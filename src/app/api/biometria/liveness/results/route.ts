import { NextRequest, NextResponse } from 'next/server'
import { verifyLivenessSession, getLivenessCost } from '@/lib/rekognition'

/**
 * POST /api/biometria/liveness/results
 *
 * Obtiene los resultados de una sesión de Face Liveness completada.
 * Debe llamarse después de que el usuario complete el challenge
 * en el componente de AWS Amplify FaceLivenessDetector.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, minConfidence = 95 } = body as {
      sessionId: string
      minConfidence?: number
    }

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId es requerido',
        },
        { status: 400 }
      )
    }

    // Verificar sesión en AWS
    const result = await verifyLivenessSession(sessionId, minConfidence)

    // Log para auditoría
    console.log('[Biometria] Resultado de liveness:', {
      sessionId,
      success: result.success,
      confidence: result.confidence,
      isLive: result.isLive,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: result.success,
      sessionId,
      confidence: result.confidence,
      isLive: result.isLive,
      hasReferenceImage: !!result.referenceImageUrl,
      // No exponemos la imagen directamente por seguridad
      // Se usa internamente para comparación
      costoUsd: getLivenessCost(),
      error: result.error,
    })
  } catch (error) {
    console.error('[Biometria] Error obteniendo resultados:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al obtener resultados de liveness',
      },
      { status: 500 }
    )
  }
}
