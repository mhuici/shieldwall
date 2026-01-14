"use client";

import { useState, useEffect } from "react";
import { GatekeeperValidacion } from "@/components/ver/gatekeeper-validacion";
import { ContenidoNotificacion } from "@/components/ver/contenido-notificacion";
import { TrackingApertura } from "@/components/ver/tracking-apertura";

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
  razon_social: string;
  cuit: string;
}

interface EmpleadoData {
  nombre: string;
  cuil: string;
}

interface VerNotificacionClientProps {
  notificacion: NotificacionData;
  empresa: EmpresaData | null;
  empleado: EmpleadoData | null;
  identidadValidada: boolean;
  lecturaConfirmada: boolean;
}

export function VerNotificacionClient({
  notificacion,
  empresa,
  empleado,
  identidadValidada: initialIdentidadValidada,
  lecturaConfirmada: initialLecturaConfirmada,
}: VerNotificacionClientProps) {
  const [identidadValidada, setIdentidadValidada] = useState(initialIdentidadValidada);
  const [lecturaConfirmada, setLecturaConfirmada] = useState(initialLecturaConfirmada);

  // Si la identidad ya estaba validada, mostrar directamente el contenido
  useEffect(() => {
    if (initialIdentidadValidada) {
      setIdentidadValidada(true);
    }
  }, [initialIdentidadValidada]);

  const handleValidacionExitosa = () => {
    setIdentidadValidada(true);
  };

  const handleLecturaConfirmada = () => {
    setLecturaConfirmada(true);
  };

  // Paso 1: Gatekeeper - Validación de identidad
  if (!identidadValidada) {
    return (
      <>
        {/* Tracking básico de apertura de link */}
        <TrackingApertura token={notificacion.token} />

        <GatekeeperValidacion
          token={notificacion.token}
          empresaNombre={empresa?.razon_social || "Su empleador"}
          empleadoNombre={empleado?.nombre || "Trabajador"}
          onValidacionExitosa={handleValidacionExitosa}
        />
      </>
    );
  }

  // Paso 2: Contenido de la notificación con checkbox
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
