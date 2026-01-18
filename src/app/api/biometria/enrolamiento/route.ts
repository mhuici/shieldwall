import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  verifyLivenessSession,
  getLivenessCost,
} from '@/lib/rekognition'
import CryptoJS from 'crypto-js'

/**
 * POST /api/biometria/enrolamiento
 *
 * Completa el proceso de enrolamiento biométrico de un empleado.
 * Debe llamarse después de que el empleado complete el liveness check.
 *
 * El enrolamiento se hace UNA vez por empleado (bajo demanda,
 * cuando recibe su primera notificación).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      empleadoId,
      empresaId,
      sessionId,
      dniNumero,
      dniNombre,
    } = body as {
      empleadoId: string
      empresaId: string
      sessionId: string
      dniNumero?: string
      dniNombre?: string
    }

    // Validaciones
    if (!empleadoId || !empresaId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'empleadoId, empresaId y sessionId son requeridos',
        },
        { status: 400 }
      )
    }

    // Verificar que el liveness fue exitoso
    const livenessResult = await verifyLivenessSession(sessionId)

    if (!livenessResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: livenessResult.error || 'Verificación de liveness fallida',
          confidence: livenessResult.confidence,
        },
        { status: 400 }
      )
    }

    // Obtener metadata del request
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Crear hash del patrón biométrico (no guardamos la imagen real)
    const patronHash = CryptoJS.SHA256(
      `${empleadoId}-${sessionId}-${Date.now()}`
    ).toString()

    // Guardar en base de datos
    const supabase = await createClient()

    // Verificar si ya existe enrolamiento
    const { data: existingEnrollment } = await supabase
      .from('enrolamiento_biometrico')
      .select('id')
      .eq('empleado_id', empleadoId)
      .single()

    if (existingEnrollment) {
      return NextResponse.json(
        {
          success: false,
          error: 'El empleado ya tiene un enrolamiento biométrico activo',
        },
        { status: 409 }
      )
    }

    // Insertar enrolamiento
    const { data: enrollment, error: insertError } = await supabase
      .from('enrolamiento_biometrico')
      .insert({
        empleado_id: empleadoId,
        empresa_id: empresaId,
        dni_numero: dniNumero,
        dni_nombre: dniNombre,
        dni_metodo: 'manual', // Por ahora manual, luego OCR/NFC
        patron_biometrico_hash: patronHash,
        aws_session_id: sessionId,
        aws_confidence: livenessResult.confidence,
        aws_is_live: livenessResult.isLive,
        // Si tienes S3 configurado, guardar la URL de la imagen de referencia
        aws_reference_image_s3: livenessResult.referenceImageUrl || null,
        renaper_validado: false,
        renaper_respuesta: 'OMITIDO', // Por ahora omitimos RENAPER
        ip_enrolamiento: ip,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[Biometria] Error insertando enrolamiento:', insertError)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al guardar el enrolamiento',
        },
        { status: 500 }
      )
    }

    // Actualizar empleado con flag de enrolamiento
    await supabase
      .from('empleados')
      .update({
        enrolamiento_completado: true,
        enrolamiento_id: enrollment.id,
      })
      .eq('id', empleadoId)

    // Log para auditoría
    console.log('[Biometria] Enrolamiento completado:', {
      empleadoId,
      enrollmentId: enrollment.id,
      sessionId,
      confidence: livenessResult.confidence,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      enrollmentId: enrollment.id,
      empleadoId,
      confidence: livenessResult.confidence,
      costoUsd: getLivenessCost(),
      message: 'Enrolamiento biométrico completado exitosamente',
    })
  } catch (error) {
    console.error('[Biometria] Error en enrolamiento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno en el proceso de enrolamiento',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/biometria/enrolamiento?empleadoId=xxx
 *
 * Verifica si un empleado ya tiene enrolamiento biométrico
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const empleadoId = searchParams.get('empleadoId')

    if (!empleadoId) {
      return NextResponse.json(
        {
          success: false,
          error: 'empleadoId es requerido',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data: enrollment, error } = await supabase
      .from('enrolamiento_biometrico')
      .select('id, created_at, aws_confidence')
      .eq('empleado_id', empleadoId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[Biometria] Error consultando enrolamiento:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Error al consultar enrolamiento',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tieneEnrolamiento: !!enrollment,
      enrollment: enrollment
        ? {
            id: enrollment.id,
            createdAt: enrollment.created_at,
            confidence: enrollment.aws_confidence,
          }
        : null,
    })
  } catch (error) {
    console.error('[Biometria] Error en GET enrolamiento:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno',
      },
      { status: 500 }
    )
  }
}
