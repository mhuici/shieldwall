/**
 * Tipos y constantes del Semáforo de Notificación
 *
 * Este archivo está separado de index.ts para poder
 * importarlo en componentes cliente sin traer las
 * dependencias de servidor (Twilio, SendGrid).
 *
 * ACTUALIZADO: Nuevos estados para sistema Gatekeeper + 72hs
 */

export type EstadoSemaforo =
  | "pendiente"       // Borrador, no enviado
  | "enviado"         // Email/WhatsApp enviado
  | "validado"        // Empleado validó identidad (CUIL) pero no confirmó
  | "abierto"         // Legacy: mantener por compatibilidad
  | "leido"           // Lectura confirmada con checkbox
  | "alerta"          // 72hs sin confirmación
  | "pendiente_fisico"// Requiere acción del empleador (carta física)
  | "enviado_fisico"  // Se generó/envió carta documento
  | "por_vencer"      // Menos de 5 días para vencimiento
  | "firme";          // 30 días sin impugnación

export interface InfoSemaforo {
  estado: EstadoSemaforo;
  color: "gray" | "blue" | "yellow" | "green" | "red" | "emerald" | "orange" | "amber";
  label: string;
  descripcion: string;
  accionRequerida?: string;
}

export const SEMAFORO_INFO: Record<EstadoSemaforo, InfoSemaforo> = {
  pendiente: {
    estado: "pendiente",
    color: "gray",
    label: "Pendiente",
    descripcion: "La notificación aún no fue enviada",
    accionRequerida: "Enviar notificación al empleado",
  },
  enviado: {
    estado: "enviado",
    color: "blue",
    label: "Enviado",
    descripcion: "Email y WhatsApp enviados, esperando que el empleado acceda",
  },
  validado: {
    estado: "validado",
    color: "yellow",
    label: "Identidad Validada",
    descripcion: "El empleado ingresó su CUIL pero NO confirmó con el checkbox",
    accionRequerida: "Esperando confirmación de lectura",
  },
  abierto: {
    estado: "abierto",
    color: "yellow",
    label: "Abierto",
    descripcion: "El empleado abrió el link pero NO confirmó lectura (legacy)",
    accionRequerida: "Se recomienda seguimiento telefónico",
  },
  leido: {
    estado: "leido",
    color: "green",
    label: "Notificado",
    descripcion: "Lectura confirmada con declaración jurada",
  },
  alerta: {
    estado: "alerta",
    color: "amber",
    label: "Alerta 72hs",
    descripcion: "72+ horas sin confirmación de lectura",
    accionRequerida: "Considerar notificación física",
  },
  pendiente_fisico: {
    estado: "pendiente_fisico",
    color: "red",
    label: "Pendiente Físico",
    descripcion: "El empleador debe generar notificación física",
    accionRequerida: "Generar PDF para carta documento o reenviar digital",
  },
  enviado_fisico: {
    estado: "enviado_fisico",
    color: "orange",
    label: "Enviado Físico",
    descripcion: "Carta documento enviada, esperando acuse de recibo",
    accionRequerida: "Cargar acuse de recibo cuando llegue",
  },
  por_vencer: {
    estado: "por_vencer",
    color: "amber",
    label: "Por Vencer",
    descripcion: "Menos de 5 días para que venza el plazo de impugnación",
  },
  firme: {
    estado: "firme",
    color: "emerald",
    label: "Firme",
    descripcion: "Sanción firme - 30 días sin impugnación",
  },
};

/**
 * Calcula el estado del semáforo basado en los datos de la notificación
 * Actualizado para el nuevo flujo con Gatekeeper + 72hs
 */
export function calcularEstadoSemaforo(notificacion: {
  estado?: string;
  email_enviado_at?: string | null;
  identidad_validada_at?: string | null;
  link_abierto_at?: string | null;
  lectura_confirmada_at?: string | null;
  fecha_vencimiento?: string | null;
  semaforo?: string;
}): EstadoSemaforo {
  // Estados terminales
  if (notificacion.estado === "firme") return "firme";
  if (notificacion.estado === "impugnado") return "firme"; // Tratamos igual visualmente

  // Estados de envío físico
  if (notificacion.estado === "enviado_fisico") return "enviado_fisico";
  if (notificacion.estado === "pendiente_fisico") return "pendiente_fisico";

  // Si confirmó lectura con checkbox
  if (notificacion.lectura_confirmada_at || notificacion.estado === "notificado") {
    // Verificar si está por vencer
    if (notificacion.fecha_vencimiento) {
      const diasParaVencer = Math.ceil(
        (new Date(notificacion.fecha_vencimiento).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (diasParaVencer > 0 && diasParaVencer <= 5) return "por_vencer";
    }
    return "leido";
  }

  // Si no se envió email/whatsapp
  if (!notificacion.email_enviado_at) return "pendiente";

  const ahora = new Date();
  const emailEnviado = new Date(notificacion.email_enviado_at);
  const horasDesdeEnvio = (ahora.getTime() - emailEnviado.getTime()) / (1000 * 60 * 60);

  // Si validó identidad (ingresó CUIL) - nuevo flujo Gatekeeper
  if (notificacion.identidad_validada_at) {
    const identidadValidada = new Date(notificacion.identidad_validada_at);
    const horasDesdeValidacion = (ahora.getTime() - identidadValidada.getTime()) / (1000 * 60 * 60);

    // Más de 72hs desde validación sin confirmar = alerta
    if (horasDesdeValidacion >= 72) return "alerta";

    return "validado";
  }

  // Legacy: Si abrió el link (para notificaciones anteriores al nuevo flujo)
  if (notificacion.link_abierto_at) {
    const linkAbierto = new Date(notificacion.link_abierto_at);
    const horasDesdeApertura = (ahora.getTime() - linkAbierto.getTime()) / (1000 * 60 * 60);

    // Más de 72hs desde apertura sin confirmar = alerta
    if (horasDesdeApertura >= 72) return "alerta";

    return "abierto";
  }

  // Más de 72hs sin validar identidad = alerta
  if (horasDesdeEnvio >= 72) return "alerta";

  return "enviado";
}

/**
 * Formatea fecha para mostrar
 */
export function formatearFechaNotificacion(fecha: string | Date): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
