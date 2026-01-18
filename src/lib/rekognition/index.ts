// AWS Rekognition Service
// Servicios de biometría para NotiLegal v2

export {
  getRekognitionClient,
  AWS_COSTS,
  type LivenessSessionResult,
  type CompareFacesResult,
  type DetectFacesResult,
} from './client'

export {
  createLivenessSession,
  getLivenessSessionResults,
  verifyLivenessSession,
  getLivenessCost,
} from './liveness'

export {
  compareFaces,
  verifyIdentity,
  getCompareCost,
} from './compare'

// Tipos adicionales para la integración
export interface BiometricVerificationResult {
  success: boolean
  livenessSessionId: string
  livenessConfidence: number
  isLive: boolean
  compareResult?: {
    similarity: number
    resultado: 'APROBADO' | 'REVISION' | 'RECHAZADO'
  }
  costoTotalUsd: number
  error?: string
}

export interface EnrollmentResult {
  success: boolean
  empleadoId: string
  sessionId: string
  confidence: number
  referenceImageUrl?: string
  costoUsd: number
  error?: string
}

/**
 * Verificación biométrica completa para una notificación
 * Combina liveness detection + comparación con patrón de enrolamiento
 *
 * @param livenessSessionId - ID de la sesión de liveness completada
 * @param enrollmentImageUrl - URL de la imagen de enrolamiento del empleado
 */
export async function performFullBiometricVerification(
  livenessSessionId: string,
  enrollmentImage: string | Buffer
): Promise<BiometricVerificationResult> {
  const { verifyLivenessSession, getLivenessCost } = await import('./liveness')
  const { verifyIdentity, getCompareCost } = await import('./compare')

  // Paso 1: Verificar liveness
  const livenessResult = await verifyLivenessSession(livenessSessionId)

  if (!livenessResult.success) {
    return {
      success: false,
      livenessSessionId,
      livenessConfidence: livenessResult.confidence,
      isLive: livenessResult.isLive,
      costoTotalUsd: getLivenessCost(),
      error: livenessResult.error,
    }
  }

  // Paso 2: Comparar con patrón de enrolamiento
  if (!livenessResult.referenceImageUrl) {
    return {
      success: false,
      livenessSessionId,
      livenessConfidence: livenessResult.confidence,
      isLive: livenessResult.isLive,
      costoTotalUsd: getLivenessCost(),
      error: 'No se pudo obtener la imagen de referencia del liveness',
    }
  }

  const compareResult = await verifyIdentity(
    enrollmentImage,
    livenessResult.referenceImageUrl
  )

  const costoTotal = getLivenessCost() + getCompareCost()

  return {
    success: compareResult.success,
    livenessSessionId,
    livenessConfidence: livenessResult.confidence,
    isLive: livenessResult.isLive,
    compareResult: {
      similarity: compareResult.similarity,
      resultado: compareResult.resultado,
    },
    costoTotalUsd: costoTotal,
    error: compareResult.error,
  }
}
