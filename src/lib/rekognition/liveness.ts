import {
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
} from '@aws-sdk/client-rekognition'
import { getRekognitionClient, LivenessSessionResult, AWS_COSTS } from './client'

/**
 * Crea una sesión de Face Liveness en AWS Rekognition
 * El cliente debe usar esta sessionId para iniciar la verificación en el frontend
 *
 * Costo: $0.01 USD por sesión
 */
export async function createLivenessSession(): Promise<{
  sessionId: string
  error?: string
}> {
  try {
    const client = getRekognitionClient()

    // Configurar output a S3 solo si está configurado
    const s3Bucket = process.env.AWS_S3_BUCKET
    const settings: {
      AuditImagesLimit?: number
      OutputConfig?: { S3Bucket: string; S3KeyPrefix?: string }
    } = {
      AuditImagesLimit: 4, // Máximo 4 imágenes de auditoría
    }

    // Solo agregar OutputConfig si hay bucket S3 configurado
    if (s3Bucket) {
      settings.OutputConfig = {
        S3Bucket: s3Bucket,
        S3KeyPrefix: 'liveness-audit/',
      }
    }

    const command = new CreateFaceLivenessSessionCommand({
      Settings: settings,
    })

    const response = await client.send(command)

    if (!response.SessionId) {
      throw new Error('AWS Rekognition did not return a session ID')
    }

    return {
      sessionId: response.SessionId,
    }
  } catch (error) {
    console.error('Error creating liveness session:', error)
    return {
      sessionId: '',
      error: error instanceof Error ? error.message : 'Error desconocido',
    }
  }
}

/**
 * Obtiene los resultados de una sesión de Face Liveness
 * Debe llamarse después de que el usuario complete el challenge en el frontend
 *
 * @param sessionId - ID de la sesión creada con createLivenessSession
 */
export async function getLivenessSessionResults(
  sessionId: string
): Promise<LivenessSessionResult> {
  try {
    const client = getRekognitionClient()

    const command = new GetFaceLivenessSessionResultsCommand({
      SessionId: sessionId,
    })

    const response = await client.send(command)

    // Determinar el status
    let status: LivenessSessionResult['status'] = 'FAILED'
    if (response.Status === 'SUCCEEDED') {
      status = 'SUCCEEDED'
    } else if (response.Status === 'IN_PROGRESS') {
      status = 'IN_PROGRESS'
    } else if (response.Status === 'EXPIRED') {
      status = 'EXPIRED'
    }

    // Obtener la imagen de referencia si existe
    let referenceImageUrl: string | undefined
    if (response.ReferenceImage?.Bytes) {
      // Convertir a base64 para uso temporal
      // En producción, guardarías esto en S3
      referenceImageUrl = `data:image/jpeg;base64,${Buffer.from(response.ReferenceImage.Bytes).toString('base64')}`
    }

    return {
      sessionId,
      status,
      confidence: response.Confidence,
      isLive: response.Status === 'SUCCEEDED' && (response.Confidence || 0) >= 90,
      referenceImageUrl,
      auditImagesCount: response.AuditImages?.length || 0,
    }
  } catch (error) {
    console.error('Error getting liveness session results:', error)
    return {
      sessionId,
      status: 'FAILED',
      isLive: false,
    }
  }
}

/**
 * Verifica si una sesión de liveness fue exitosa con el umbral requerido
 *
 * @param sessionId - ID de la sesión
 * @param minConfidence - Confianza mínima requerida (default 95%)
 */
export async function verifyLivenessSession(
  sessionId: string,
  minConfidence: number = 95
): Promise<{
  success: boolean
  confidence: number
  isLive: boolean
  referenceImageUrl?: string
  error?: string
}> {
  const result = await getLivenessSessionResults(sessionId)

  if (result.status !== 'SUCCEEDED') {
    return {
      success: false,
      confidence: result.confidence || 0,
      isLive: false,
      error: `Session status: ${result.status}`,
    }
  }

  const confidence = result.confidence || 0
  const isLive = result.isLive || false

  if (!isLive) {
    return {
      success: false,
      confidence,
      isLive: false,
      error: 'Liveness check failed - possible spoofing detected',
    }
  }

  if (confidence < minConfidence) {
    return {
      success: false,
      confidence,
      isLive: true,
      error: `Confidence ${confidence}% is below threshold ${minConfidence}%`,
    }
  }

  return {
    success: true,
    confidence,
    isLive: true,
    referenceImageUrl: result.referenceImageUrl,
  }
}

/**
 * Costo de una verificación de liveness
 */
export function getLivenessCost(): number {
  return AWS_COSTS.FACE_LIVENESS
}
