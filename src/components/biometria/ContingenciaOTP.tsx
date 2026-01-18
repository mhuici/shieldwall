"use client";

/**
 * ContingenciaOTP - Verificación por SMS cuando biometría no está disponible
 *
 * Este componente se activa cuando:
 * - El dispositivo no tiene cámara
 * - La conexión es inestable para Face Liveness
 * - Se alcanzan múltiples reintentos fallidos
 *
 * La contingencia queda registrada en la base de datos para auditoría.
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Phone,
  AlertTriangle,
  CheckCircle,
  WifiOff,
  Shield,
} from "lucide-react";

interface ContingenciaOTPProps {
  /** Token de la notificación */
  token: string;
  /** ID de la notificación */
  notificacionId: string;
  /** ID del empleado */
  empleadoId: string;
  /** Teléfono ofuscado para mostrar */
  telefonoOfuscado?: string;
  /** Motivo de la contingencia */
  motivoContingencia: string;
  /** Callback cuando la verificación es exitosa */
  onVerified: () => void;
  /** Callback para cancelar y volver a biometría */
  onCancel?: () => void;
}

export function ContingenciaOTP({
  token,
  notificacionId,
  empleadoId,
  telefonoOfuscado,
  motivoContingencia,
  onVerified,
  onCancel,
}: ContingenciaOTPProps) {
  const [paso, setPaso] = useState<"enviar" | "verificar" | "completado">("enviar");
  const [codigoOTP, setCodigoOTP] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [telefono, setTelefono] = useState(telefonoOfuscado || "");
  const [contingenciaRegistrada, setContingenciaRegistrada] = useState(false);

  // Registrar la contingencia al montar el componente
  useEffect(() => {
    async function registrarContingencia() {
      if (contingenciaRegistrada) return;

      try {
        const response = await fetch("/api/biometria/contingencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notificacionId,
            empleadoId,
            motivo: motivoContingencia,
            userAgent: navigator.userAgent,
          }),
        });

        if (response.ok) {
          setContingenciaRegistrada(true);
        }
      } catch (err) {
        console.error("[ContingenciaOTP] Error registrando contingencia:", err);
      }
    }

    registrarContingencia();
  }, [notificacionId, empleadoId, motivoContingencia, contingenciaRegistrada]);

  // Enviar OTP
  const handleEnviarOTP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ver/${token}/enviar-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canal: "sms" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Error al enviar código");
        return;
      }

      setTelefono(data.telefono_ofuscado || telefono);
      setPaso("verificar");
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // Verificar OTP
  const handleVerificarOTP = async () => {
    if (codigoOTP.length !== 6) {
      setError("Ingrese el código de 6 dígitos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ver/${token}/verificar-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo_otp: codigoOTP,
          contingencia: true, // Indicar que es verificación por contingencia
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Código incorrecto");
        return;
      }

      // Actualizar la verificación biométrica como contingencia exitosa
      await fetch("/api/biometria/contingencia", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificacionId,
          empleadoId,
          resultado: "EXITOSO",
        }),
      });

      setPaso("completado");
      setTimeout(() => {
        onVerified();
      }, 1500);
    } catch {
      setError("Error de conexión. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
          {paso === "completado" ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <WifiOff className="h-6 w-6 text-amber-600" />
          )}
        </div>
        <CardTitle>
          {paso === "completado"
            ? "Verificación Completada"
            : "Verificación por SMS"}
        </CardTitle>
        <CardDescription>
          {paso === "completado"
            ? "Identidad verificada mediante código SMS"
            : "Modo contingencia activado"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {paso === "enviar" && (
          <>
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle className="text-sm">Modo Contingencia</AlertTitle>
              <AlertDescription className="text-xs">
                Debido a limitaciones técnicas (cámara o conexión), se verificará
                su identidad mediante un código SMS. Este evento queda registrado
                para auditoría.
              </AlertDescription>
            </Alert>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Phone className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-sm text-muted-foreground">
                Se enviará un código de 6 dígitos a:
              </p>
              <p className="font-mono font-medium">
                {telefono || "Su teléfono registrado"}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleEnviarOTP}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando código...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Enviar Código por SMS
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                variant="outline"
                onClick={onCancel}
                className="w-full"
              >
                Volver a verificación facial
              </Button>
            )}
          </>
        )}

        {paso === "verificar" && (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Ingrese el código de 6 dígitos enviado a{" "}
              <strong>{telefono}</strong>:
            </p>

            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigoOTP}
              onChange={(e) => setCodigoOTP(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-2xl font-mono tracking-widest h-14"
            />

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleVerificarOTP}
              disabled={codigoOTP.length !== 6 || loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleEnviarOTP}
              disabled={loading}
              className="w-full"
            >
              Reenviar código
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              El código expira en 10 minutos.
            </p>
          </>
        )}

        {paso === "completado" && (
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-semibold text-green-700">
              Identidad Verificada
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Verificación por contingencia completada
            </p>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-4 mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">
              Redirigiendo...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
