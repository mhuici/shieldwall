import {
  RekognitionClient,
  CreateFaceLivenessSessionCommand,
  GetFaceLivenessSessionResultsCommand,
  CompareFacesCommand,
  DetectFacesCommand,
} from '@aws-sdk/client-rekognition'

// Cliente singleton de AWS Rekognition
let rekognitionClient: RekognitionClient | null = null

export function getRekognitionClient(): RekognitionClient {
  if (!rekognitionClient) {
    const region = process.env.AWS_REGION || 'us-east-1'

    // Verificar credenciales
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.')
    }

    rekognitionClient = new RekognitionClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }

  return rekognitionClient
}

// Tipos para los resultados
export interface LivenessSessionResult {
  sessionId: string
  status: 'CREATED' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
  confidence?: number
  isLive?: boolean
  referenceImageUrl?: string
  auditImagesCount?: number
}

export interface CompareFacesResult {
  similarity: number
  isMatch: boolean
  confidence: number
  sourceImageQuality?: number
  targetImageQuality?: number
}

export interface DetectFacesResult {
  faceCount: number
  hasValidFace: boolean
  confidence?: number
  boundingBox?: {
    width: number
    height: number
    left: number
    top: number
  }
}

// Costos de AWS Rekognition (para tracking)
export const AWS_COSTS = {
  FACE_LIVENESS: 0.01, // USD por sesión
  COMPARE_FACES: 0.001, // USD por comparación
  DETECT_FACES: 0.001, // USD por detección
} as const
