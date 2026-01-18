import { CompareFacesCommand } from '@aws-sdk/client-rekognition'
import { getRekognitionClient, CompareFacesResult, AWS_COSTS } from './client'

/**
 * Compara dos imágenes de rostros usando AWS Rekognition CompareFaces
 *
 * @param sourceImage - Imagen base64 de la cara de referencia (del enrolamiento)
 * @param targetImage - Imagen base64 de la cara a verificar (de la sesión de liveness)
 * @param similarityThreshold - Umbral mínimo de similitud (default 95%)
 *
 * Costo: $0.001 USD por comparación
 */
export async function compareFaces(
  sourceImage: string | Buffer,
  targetImage: string | Buffer,
  similarityThreshold: number = 95
): Promise<CompareFacesResult> {
  try {
    const client = getRekognitionClient()

    // Convertir a Buffer si es base64
    const sourceBuffer = typeof sourceImage === 'string'
      ? Buffer.from(sourceImage.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : sourceImage

    const targetBuffer = typeof targetImage === 'string'
      ? Buffer.from(targetImage.replace(/^data:image\/\w+;base64,/, ''), 'base64')
      : targetImage

    const command = new CompareFacesCommand({
      SourceImage: {
        Bytes: sourceBuffer,
      },
      TargetImage: {
        Bytes: targetBuffer,
      },
      SimilarityThreshold: similarityThreshold,
      QualityFilter: 'AUTO', // Filtrar imágenes de baja calidad
    })

    const response = await client.send(command)

    // Si no hay coincidencias, retornar resultado negativo
    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return {
        similarity: 0,
        isMatch: false,
        confidence: 0,
        sourceImageQuality: response.SourceImageFace?.Confidence,
      }
    }

    // Tomar la mejor coincidencia
    const bestMatch = response.FaceMatches[0]
    const similarity = bestMatch.Similarity || 0
    const confidence = bestMatch.Face?.Confidence || 0

    return {
      similarity,
      isMatch: similarity >= similarityThreshold,
      confidence,
      sourceImageQuality: response.SourceImageFace?.Confidence,
      targetImageQuality: bestMatch.Face?.Confidence,
    }
  } catch (error) {
    console.error('Error comparing faces:', error)
    return {
      similarity: 0,
      isMatch: false,
      confidence: 0,
    }
  }
}

/**
 * Verifica si una cara coincide con el patrón de enrolamiento
 *
 * @param enrollmentImage - Imagen de referencia del enrolamiento
 * @param verificationImage - Imagen de la verificación actual
 * @param threshold - Umbral de similitud (default 95%)
 */
export async function verifyIdentity(
  enrollmentImage: string | Buffer,
  verificationImage: string | Buffer,
  threshold: number = 95
): Promise<{
  success: boolean
  similarity: number
  resultado: 'APROBADO' | 'REVISION' | 'RECHAZADO'
  error?: string
}> {
  const result = await compareFaces(enrollmentImage, verificationImage, 0) // Sin threshold para obtener el valor real

  const similarity = result.similarity

  // Determinar resultado según umbrales del plan
  let resultado: 'APROBADO' | 'REVISION' | 'RECHAZADO'
  if (similarity >= threshold) {
    resultado = 'APROBADO'
  } else if (similarity >= 85) {
    resultado = 'REVISION'
  } else {
    resultado = 'RECHAZADO'
  }

  return {
    success: similarity >= threshold,
    similarity,
    resultado,
    error: similarity < 85
      ? 'La similitud es muy baja. Por favor, intente nuevamente con mejor iluminación.'
      : undefined,
  }
}

/**
 * Costo de una comparación de caras
 */
export function getCompareCost(): number {
  return AWS_COSTS.COMPARE_FACES
}
