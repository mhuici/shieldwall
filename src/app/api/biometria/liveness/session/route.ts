import { NextRequest, NextResponse } from 'next/server'
import { createLivenessSession } from '@/lib/rekognition'

/**
 * POST /api/biometria/liveness/session
 *
 * Crea una nueva sesión de Face Liveness en AWS Rekognition.
 * El frontend debe usar el sessionId retornado para iniciar
 * el componente de verificación de AWS Amplify.
 *
 * Costo: $0.01 USD por sesión
 */
export async function POST(request: NextRequest) {
  try {
    // Opcional: recibir metadata del request
    const body = await request.json().catch(() => ({}))
    const { empleadoId, notificacionId, tipo } = body as {
      empleadoId?: string
      notificacionId?: string
      tipo?: 'enrolamiento' | 'verificacion'
    }

    // Crear sesión en AWS
    const result = await createLivenessSession()

    if (result.error) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      )
    }

    // Log para auditoría
    console.log('[Biometria] Sesión de liveness creada:', {
      sessionId: result.sessionId,
      empleadoId,
      notificacionId,
      tipo,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      // El frontend necesita esto para inicializar AWS Amplify FaceLivenessDetector
      region: process.env.AWS_REGION || 'us-east-1',
    })
  } catch (error) {
    console.error('[Biometria] Error creando sesión:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno al crear sesión de liveness',
      },
      { status: 500 }
    )
  }
}
