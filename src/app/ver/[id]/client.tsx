"use client";

import { useState, useEffect } from "react";
import { GatekeeperValidacion } from "@/components/ver/gatekeeper-validacion";
import { GatekeeperValidacionReforzada } from "@/components/ver/gatekeeper-validacion-reforzada";
import { ContenidoNotificacion } from "@/components/ver/contenido-notificacion";
import { TrackingApertura } from "@/components/ver/tracking-apertura";
import { BiometricGate } from "@/components/biometria/BiometricGate";

interface NotificacionData {
  id: string;
  token: string;
  tipo: string;
  motivo: string;
  descripcion: string;
  fecha_hecho: string;
  fecha_vencimiento: string | null;
  hash_sha256: string | null;
  timestamp_generacion: string;
  estado: string;
  dias_suspension?: number;
  fecha_inicio_suspension?: string;
  fecha_fin_suspension?: string;
  lectura_confirmada_at?: string | null;
  fecha_lectura?: string | null;
}

interface EmpresaData {
  id: string;
  razon_social: string;
  cuit: string;
}

interface EmpleadoData {
  id: string;
  nombre: string;
  cuil: string;
  telefono?: string;
  convenioFirmado?: boolean;
}

interface VerNotificacionClientProps {
  notificacion: NotificacionData;
  empresa: EmpresaData | null;
  empleado: EmpleadoData | null;
  identidadValidada: boolean;
  otpValidado: boolean;
  lecturaConfirmada: boolean;
  requiereSelfie: boolean;
  biometriaCompletada: boolean;
  isFirstAccess: boolean;
}

export function VerNotificacionClient({
  notificacion,
  empresa,
  empleado,
  identidadValidada: initialIdentidadValidada,
  otpValidado: initialOtpValidado,
  lecturaConfirmada: initialLecturaConfirmada,
  requiereSelfie,
  biometriaCompletada: initialBiometriaCompletada,
  isFirstAccess,
}: VerNotificacionClientProps) {
  const [identidadValidada, setIdentidadValidada] = useState(initialIdentidadValidada);
  const [lecturaConfirmada, setLecturaConfirmada] = useState(initialLecturaConfirmada);
  const [biometriaCompletada, setBiometriaCompletada] = useState(initialBiometriaCompletada);

  // Si la identidad ya estaba validada (incluyendo OTP), mostrar directamente el contenido
  useEffect(() => {
    if (initialIdentidadValidada && initialOtpValidado) {
      setIdentidadValidada(true);
    }
  }, [initialIdentidadValidada, initialOtpValidado]);

  const handleValidacionExitosa = () => {
    setIdentidadValidada(true);
  };

  const handleBiometriaVerificada = () => {
    setBiometriaCompletada(true);
  };

  const handleLecturaConfirmada = () => {
    setLecturaConfirmada(true);
  };

  // Determinar si usar gatekeeper reforzado (empleado con convenio firmado)
  const usarValidacionReforzada = empleado?.convenioFirmado === true;

  // Paso 1: Gatekeeper - Validación de identidad (CUIL/OTP)
  if (!identidadValidada) {
    return (
      <>
        {/* Tracking básico de apertura de link */}
        <TrackingApertura token={notificacion.token} />

        {usarValidacionReforzada ? (
          <GatekeeperValidacionReforzada
            token={notificacion.token}
            empresaNombre={empresa?.razon_social || "Su empleador"}
            empleadoNombre={empleado?.nombre || "Trabajador"}
            empleadoTelefono={empleado?.telefono}
            requiereSelfie={false} // Ya no usamos selfie simple, usamos biometría AWS
            onValidacionExitosa={handleValidacionExitosa}
          />
        ) : (
          <GatekeeperValidacion
            token={notificacion.token}
            empresaNombre={empresa?.razon_social || "Su empleador"}
            empleadoNombre={empleado?.nombre || "Trabajador"}
            onValidacionExitosa={handleValidacionExitosa}
          />
        )}
      </>
    );
  }

  // Paso 2: Verificación biométrica con AWS Rekognition (si requiere y no está completada)
  if (requiereSelfie && !biometriaCompletada && empleado?.id && empresa?.id) {
    return (
      <>
        <TrackingApertura token={notificacion.token} />
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b">
            <div className="max-w-lg mx-auto px-4 py-4">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="font-semibold text-lg">NotiLegal</span>
              </div>
            </div>
          </div>

          {/* Biometric Gate */}
          <div className="flex-1 flex items-center justify-center p-4">
            <BiometricGate
              empleadoId={empleado.id}
              empresaId={empresa.id}
              notificacionId={notificacion.id}
              onVerified={handleBiometriaVerificada}
              isFirstAccess={isFirstAccess}
            />
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-4">
            <p>Sistema de notificaciones laborales con validez legal</p>
          </div>
        </div>
      </>
    );
  }

  // Paso 3: Contenido de la notificación con checkbox
  return (
    <>
      {/* Tracking de apertura post-validación */}
      <TrackingApertura token={notificacion.token} />

      <ContenidoNotificacion
        notificacion={notificacion}
        empresa={empresa}
        empleado={empleado}
        lecturaConfirmada={lecturaConfirmada}
        onLecturaConfirmada={handleLecturaConfirmada}
      />
    </>
  );
}
