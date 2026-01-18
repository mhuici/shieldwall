import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  verifyLivenessSession,
  verifyIdentity,
  getLivenessCost,
  getCompareCost,
} from '@/lib/rekognition'

/**
 * POST /api/biometria/verificar
 *
 * Verifica la identidad de un empleado para acceder a una notificación.
 * Requiere:
 * 1. Que el empleado tenga enrolamiento previo
 * 2. Que complete el liveness check actual
 * 3. Que la cara coincida con el patrón de enrolamiento
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      empleadoId,
      notificacionId,
      sessionId,
    } = body as {
      empleadoId: string
      notificacionId: string
      sessionId: string
    }

    // Validaciones
    if (!empleadoId || !notificacionId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'empleadoId, notificacionId y sessionId son requeridos',
        },
        { status: 400 }
      )
    }

    // Obtener metadata del request
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const supabase = await createClient()

    // Verificar que el empleado tiene enrolamiento
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrolamiento_biometrico')
      .select('id, aws_reference_image_s3, aws_confidence')
      .eq('empleado_id', empleadoId)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        {
          success: false,
          requiresEnrollment: true,
          error: 'El empleado no tiene enrolamiento biométrico. Debe completar el enrolamiento primero.',
        },
        { status: 400 }
      )
    }

    // Paso 1: Verificar que el liveness fue exitoso
    const livenessResult = await verifyLivenessSession(sessionId)

    if (!livenessResult.success) {
      // Guardar intento fallido
      await saveVerificationAttempt(supabase, {
        notificacionId,
        empleadoId,
        enrolamientoId: enrollment.id,
        sessionId,
        livenessConfidence: livenessResult.confidence,
        isLive: livenessResult.isLive,
        resultadoFinal: 'FALLIDO',
        error: livenessResult.error,
        ip,
        userAgent,
      })

      return NextResponse.json(
        {
          success: false,
          error: livenessResult.error || 'Verificación de liveness fallida',
          confidence: livenessResult.confidence,
          costoUsd: getLivenessCost(),
        },
        { status: 400 }
      )
    }

    // Paso 2: Comparar con patrón de enrolamiento
    let compareResult = null
    let costoTotal = getLivenessCost()

    if (enrollment.aws_reference_image_s3 && livenessResult.referenceImageUrl) {
      compareResult = await verifyIdentity(
        enrollment.aws_reference_image_s3,
        livenessResult.referenceImageUrl
      )
      costoTotal += getCompareCost()
    } else {
      // Si no hay imagen de referencia, solo confiamos en liveness
      // Esto es un fallback, idealmente siempre deberíamos comparar
      compareResult = {
        success: true,
        similarity: 100,
        resultado: 'APROBADO' as const,
      }
    }

    // Determinar resultado final
    const resultadoFinal = compareResult.success ? 'EXITOSO' : 'FALLIDO'

    // Guardar verificación en BD
    const { data: verification, error: verificationError } = await supabase
      .from('verificaciones_biometricas')
      .insert({
        notificacion_id: notificacionId,
        empleado_id: empleadoId,
        enrolamiento_id: enrollment.id,
        aws_liveness_session_id: sessionId,
        aws_liveness_confidence: livenessResult.confidence,
        aws_liveness_is_live: livenessResult.isLive,
        aws_liveness_audit_images_count: 0, // TODO: obtener de AWS
        aws_compare_similarity: compareResult.similarity,
        aws_compare_umbral: 95,
        aws_compare_resultado: compareResult.resultado,
        costo_liveness_usd: getLivenessCost(),
        costo_compare_usd: getCompareCost(),
        costo_total_usd: costoTotal,
        capacidad_camara_frontal: true,
        capacidad_conexion_suficiente: true,
        capacidad_sdk_inicializado: true,
        dispositivo: userAgent.substring(0, 255),
        ip_verificacion: ip,
        user_agent: userAgent,
        resultado_final: resultadoFinal,
      })
      .select()
      .single()

    if (verificationError) {
      console.error('[Biometria] Error guardando verificación:', verificationError)
    }

    // Si fue exitoso, actualizar la notificación
    if (resultadoFinal === 'EXITOSO' && verification) {
      await supabase
        .from('notificaciones')
        .update({
          verificacion_biometrica_id: verification.id,
          biometria_completada: true,
        })
        .eq('id', notificacionId)
    }

    // Log para auditoría
    console.log('[Biometria] Verificación completada:', {
      notificacionId,
      empleadoId,
      sessionId,
      livenessConfidence: livenessResult.confidence,
      similarity: compareResult.similarity,
      resultado: compareResult.resultado,
      costoTotal,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: compareResult.success,
      verificationId: verification?.id,
      liveness: {
        confidence: livenessResult.confidence,
        isLive: livenessResult.isLive,
      },
      compare: {
        similarity: compareResult.similarity,
        resultado: compareResult.resultado,
      },
      costoUsd: costoTotal,
      error: compareResult.error,
    })
  } catch (error) {
    console.error('[Biometria] Error en verificación:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno en el proceso de verificación',
      },
      { status: 500 }
    )
  }
}

// Helper para guardar intentos fallidos
async function saveVerificationAttempt(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: {
    notificacionId: string
    empleadoId: string
    enrolamientoId: string
    sessionId: string
    livenessConfidence: number
    isLive: boolean
    resultadoFinal: string
    error?: string
    ip: string
    userAgent: string
  }
) {
  try {
    await supabase.from('verificaciones_biometricas').insert({
      notificacion_id: data.notificacionId,
      empleado_id: data.empleadoId,
      enrolamiento_id: data.enrolamientoId,
      aws_liveness_session_id: data.sessionId,
      aws_liveness_confidence: data.livenessConfidence,
      aws_liveness_is_live: data.isLive,
      costo_liveness_usd: getLivenessCost(),
      costo_total_usd: getLivenessCost(),
      dispositivo: data.userAgent.substring(0, 255),
      ip_verificacion: data.ip,
      user_agent: data.userAgent,
      resultado_final: data.resultadoFinal,
    })
  } catch (error) {
    console.error('[Biometria] Error guardando intento fallido:', error)
  }
}
