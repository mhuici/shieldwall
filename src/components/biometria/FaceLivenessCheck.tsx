'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader } from '@aws-amplify/ui-react'
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness'
import { Amplify } from 'aws-amplify'
import '@aws-amplify/ui-react/styles.css'

// Configurar Amplify (debe hacerse antes de usar el componente)
Amplify.configure({
  Auth: {
    Cognito: {
      // Para uso anónimo, no necesitamos Cognito
      // pero Amplify requiere algo de configuración
      identityPoolId: '', // Vacío para uso sin auth
      allowGuestAccess: true,
    },
  },
})

interface FaceLivenessCheckProps {
  /** Tipo de verificación */
  tipo: 'enrolamiento' | 'verificacion'
  /** ID del empleado */
  empleadoId: string
  /** ID de la empresa (para enrolamiento) */
  empresaId?: string
  /** ID de la notificación (para verificación) */
  notificacionId?: string
  /** Callback cuando la verificación es exitosa */
  onSuccess: (result: LivenessResult) => void
  /** Callback cuando hay un error */
  onError: (error: string) => void
  /** Callback cuando el usuario cancela */
  onCancel?: () => void
}

export interface LivenessResult {
  sessionId: string
  confidence: number
  isLive: boolean
  verificationId?: string
  enrollmentId?: string
  similarity?: number
  resultado?: 'APROBADO' | 'REVISION' | 'RECHAZADO'
}

export function FaceLivenessCheck({
  tipo,
  empleadoId,
  empresaId,
  notificacionId,
  onSuccess,
  onError,
  onCancel,
}: FaceLivenessCheckProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Crear sesión de liveness al montar
  useEffect(() => {
    async function createSession() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/biometria/liveness/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empleadoId,
            notificacionId,
            tipo,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error al crear sesión')
        }

        setSessionId(data.sessionId)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
        onError(message)
      } finally {
        setLoading(false)
      }
    }

    createSession()
  }, [empleadoId, notificacionId, tipo, onError])

  // Handler cuando el liveness check se completa
  const handleAnalysisComplete = useCallback(async () => {
    if (!sessionId) return

    try {
      setLoading(true)

      if (tipo === 'enrolamiento') {
        // Para enrolamiento, guardar el patrón
        const response = await fetch('/api/biometria/enrolamiento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empleadoId,
            empresaId,
            sessionId,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Error en el enrolamiento')
        }

        onSuccess({
          sessionId,
          confidence: data.confidence,
          isLive: true,
          enrollmentId: data.enrollmentId,
        })
      } else {
        // Para verificación, comparar con patrón existente
        const response = await fetch('/api/biometria/verificar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            empleadoId,
            notificacionId,
            sessionId,
          }),
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Verificación fallida')
        }

        onSuccess({
          sessionId,
          confidence: data.liveness.confidence,
          isLive: data.liveness.isLive,
          verificationId: data.verificationId,
          similarity: data.compare?.similarity,
          resultado: data.compare?.resultado,
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      setError(message)
      onError(message)
    } finally {
      setLoading(false)
    }
  }, [sessionId, tipo, empleadoId, empresaId, notificacionId, onSuccess, onError])

  // Handler cuando hay un error en el componente de AWS
  // LivenessError tiene propiedades: error (Error), state (string)
  const handleError = useCallback(
    (livenessError: { state: string; error: Error }) => {
      const errorMessage = livenessError.error?.message || `Error en estado: ${livenessError.state}`
      console.error('[FaceLiveness] Error:', livenessError)
      setError(errorMessage)
      onError(errorMessage)
    },
    [onError]
  )

  // Handler cuando el usuario cierra el detector
  const handleUserCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    }
  }, [onCancel])

  if (loading && !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader size="large" />
        <p className="text-muted-foreground">
          Preparando verificación de identidad...
        </p>
      </div>
    )
  }

  if (error && !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <div className="text-red-500 text-center">
          <p className="font-medium">Error al iniciar la verificación</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!sessionId) {
    return null
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold">
          {tipo === 'enrolamiento'
            ? 'Registro de Identidad'
            : 'Verificación de Identidad'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {tipo === 'enrolamiento'
            ? 'Siga las instrucciones para registrar su rostro'
            : 'Confirme su identidad para acceder a la notificación'}
        </p>
      </div>

      <FaceLivenessDetector
        sessionId={sessionId}
        region={process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'}
        onAnalysisComplete={handleAnalysisComplete}
        onError={handleError}
        onUserCancel={handleUserCancel}
        disableStartScreen={false}
        displayText={{
          hintCenterFaceText: 'Centra tu rostro',
          hintMoveFaceFrontOfCameraText: 'Acerca tu rostro a la cámara',
          hintTooManyFacesText: 'Solo debe haber un rostro',
          hintFaceDetectedText: 'Rostro detectado',
          hintCanNotIdentifyText: 'Muévete a un lugar con mejor luz',
          hintTooCloseText: 'Aléjate un poco',
          hintTooFarText: 'Acércate un poco',
          hintHoldFaceForFreshnessText: 'Mantén la posición',
          hintConnectingText: 'Conectando...',
          hintVerifyingText: 'Verificando...',
          hintCheckCompleteText: 'Verificación completada',
          hintIlluminationTooBrightText: 'Hay demasiada luz',
          hintIlluminationTooDarkText: 'Necesitas más luz',
          hintIlluminationNormalText: 'Iluminación correcta',
          startScreenBeginCheckText: 'Iniciar verificación',
          photosensitivityWarningHeadingText: 'Advertencia de fotosensibilidad',
          photosensitivityWarningBodyText:
            'Esta verificación muestra luces de colores. Tenga precaución si tiene fotosensibilidad.',
          photosensitivityWarningInfoText:
            'Algunas personas pueden experimentar molestias.',
          goodFitCaptionText: 'Buen encuadre',
          tooFarCaptionText: 'Muy lejos',
          waitingCameraPermissionText: 'Esperando permiso de cámara...',
          cameraNotFoundHeadingText: 'Cámara no encontrada',
          cameraNotFoundMessageText:
            'Asegúrate de que tu dispositivo tiene una cámara frontal y que has dado permiso para usarla.',
          retryCameraPermissionsText: 'Reintentar',
        }}
      />

      {loading && sessionId && (
        <div className="mt-4 flex items-center justify-center space-x-2">
          <Loader size="small" />
          <span className="text-sm text-muted-foreground">
            Procesando resultado...
          </span>
        </div>
      )}
    </div>
  )
}
