'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Camera } from 'lucide-react'
import type { LivenessResult } from './FaceLivenessCheck'

// Importar dinámicamente el componente de AWS Liveness para evitar SSR
// ya que TensorFlow/MediaPipe no funciona con server-side rendering
const FaceLivenessCheck = dynamic(
  () => import('./FaceLivenessCheck').then((mod) => mod.FaceLivenessCheck),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando verificación biométrica...</p>
      </div>
    ),
  }
)

interface BiometricGateProps {
  /** ID del empleado */
  empleadoId: string
  /** ID de la empresa */
  empresaId: string
  /** ID de la notificación a la que quiere acceder */
  notificacionId: string
  /** Callback cuando la verificación es exitosa y puede continuar */
  onVerified: () => void
  /** Callback cuando hay un error fatal */
  onError?: (error: string) => void
  /** Si es el primer acceso (enrolamiento) */
  isFirstAccess?: boolean
}

type GateState =
  | 'checking' // Verificando si tiene enrolamiento
  | 'needs_enrollment' // No tiene enrolamiento, debe registrarse
  | 'enrolling' // Proceso de enrolamiento en curso
  | 'needs_verification' // Tiene enrolamiento, debe verificar
  | 'verifying' // Proceso de verificación en curso
  | 'success' // Verificación exitosa
  | 'error' // Error fatal

export function BiometricGate({
  empleadoId,
  empresaId,
  notificacionId,
  onVerified,
  onError,
  isFirstAccess = false,
}: BiometricGateProps) {
  const [state, setState] = useState<GateState>('checking')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [result, setResult] = useState<LivenessResult | null>(null)

  // Verificar si el empleado tiene enrolamiento
  useEffect(() => {
    async function checkEnrollment() {
      if (isFirstAccess) {
        // Si sabemos que es primer acceso, ir directo a enrolamiento
        setState('needs_enrollment')
        return
      }

      try {
        const response = await fetch(
          `/api/biometria/enrolamiento?empleadoId=${empleadoId}`
        )
        const data = await response.json()

        if (data.tieneEnrolamiento) {
          setState('needs_verification')
        } else {
          setState('needs_enrollment')
        }
      } catch (error) {
        console.error('[BiometricGate] Error checking enrollment:', error)
        setState('needs_enrollment')
      }
    }

    checkEnrollment()
  }, [empleadoId, isFirstAccess])

  // Handler para cuando el liveness es exitoso
  const handleSuccess = (livenessResult: LivenessResult) => {
    setResult(livenessResult)
    setState('success')

    // Esperar un momento para mostrar el mensaje de éxito
    setTimeout(() => {
      onVerified()
    }, 1500)
  }

  // Handler para errores
  const handleError = (error: string) => {
    setErrorMessage(error)
    setState('error')
    if (onError) {
      onError(error)
    }
  }

  // Iniciar el proceso de enrolamiento
  const startEnrollment = () => {
    setState('enrolling')
  }

  // Iniciar el proceso de verificación
  const startVerification = () => {
    setState('verifying')
  }

  // Reintentar
  const retry = () => {
    setErrorMessage(null)
    setState('checking')
  }

  // Renderizar según el estado
  switch (state) {
    case 'checking':
      return (
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              Verificando estado de identidad...
            </p>
          </CardContent>
        </Card>
      )

    case 'needs_enrollment':
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Camera className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Registro de Identidad</CardTitle>
            <CardDescription>
              Para acceder a las notificaciones, primero debe registrar su
              identidad mediante verificación facial.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Proceso seguro</AlertTitle>
              <AlertDescription>
                Su información biométrica se procesa de forma segura mediante
                Amazon Web Services y no se comparte con terceros.
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>Para completar el registro necesitará:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Una cámara frontal funcionando</li>
                <li>Buena iluminación</li>
                <li>Seguir las instrucciones en pantalla</li>
              </ul>
            </div>

            <Button onClick={startEnrollment} className="w-full">
              Iniciar Registro
            </Button>
          </CardContent>
        </Card>
      )

    case 'enrolling':
      return (
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6">
            <FaceLivenessCheck
              tipo="enrolamiento"
              empleadoId={empleadoId}
              empresaId={empresaId}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={() => setState('needs_enrollment')}
            />
          </CardContent>
        </Card>
      )

    case 'needs_verification':
      return (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Verificación de Identidad</CardTitle>
            <CardDescription>
              Para acceder a esta notificación, debe verificar su identidad.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>
                Este paso garantiza que solo usted pueda ver el contenido de la
                notificación.
              </p>
            </div>

            <Button onClick={startVerification} className="w-full">
              Verificar Identidad
            </Button>
          </CardContent>
        </Card>
      )

    case 'verifying':
      return (
        <Card className="max-w-lg mx-auto">
          <CardContent className="pt-6">
            <FaceLivenessCheck
              tipo="verificacion"
              empleadoId={empleadoId}
              notificacionId={notificacionId}
              onSuccess={handleSuccess}
              onError={handleError}
              onCancel={() => setState('needs_verification')}
            />
          </CardContent>
        </Card>
      )

    case 'success':
      return (
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-600 mb-2">
              ¡Verificación Exitosa!
            </h3>
            <p className="text-muted-foreground text-center">
              {result?.resultado === 'APROBADO'
                ? `Identidad confirmada con ${result.similarity?.toFixed(1)}% de similitud`
                : 'Su identidad ha sido verificada correctamente'}
            </p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-4" />
            <p className="text-xs text-muted-foreground mt-2">
              Redirigiendo...
            </p>
          </CardContent>
        </Card>
      )

    case 'error':
      return (
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Error en la Verificación
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {errorMessage || 'Ha ocurrido un error. Por favor, intente nuevamente.'}
            </p>
            <Button onClick={retry} variant="outline">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )

    default:
      return null
  }
}
