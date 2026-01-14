/**
 * Servicio de WhatsApp - Twilio WhatsApp Business API
 *
 * Envía notificaciones de sanción por WhatsApp.
 * Canal principal para Argentina donde WhatsApp tiene > 95% de penetración.
 *
 * Incluye:
 * - Templates aprobados por WhatsApp
 * - Link a la notificación
 * - Tracking de entrega y lectura (doble tick)
 */

import twilio from "twilio";
import { formatearTelefonoArgentino } from "./sms";

// Configuración Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Sandbox por defecto
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Cliente Twilio (lazy init)
let twilioClient: twilio.Twilio | null = null;

function getTwilioClient(): twilio.Twilio | null {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    console.error("Credenciales de Twilio no configuradas");
    return null;
  }

  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }

  return twilioClient;
}

// ============================================
// TIPOS
// ============================================

export interface DatosWhatsAppSancion {
  notificacionId: string;
  tokenAcceso: string;
  empleado: {
    nombre: string;
    telefono: string;
  };
  empresa: {
    razonSocial: string;
  };
  sancion: {
    tipo: string;
    motivo: string;
    fechaVencimiento: string;
  };
}

export interface ResultadoEnvioWhatsApp {
  success: boolean;
  messageSid?: string;
  error?: string;
  errorCode?: string;
}

// ============================================
// FORMATEO DE NÚMERO PARA WHATSAPP
// ============================================

/**
 * Formatea un número para WhatsApp (prefijo whatsapp:)
 */
export function formatearNumeroWhatsApp(telefono: string): string {
  const numeroE164 = formatearTelefonoArgentino(telefono);
  return `whatsapp:${numeroE164}`;
}

// ============================================
// FUNCIÓN PRINCIPAL DE ENVÍO
// ============================================

export async function enviarWhatsAppSancion(
  datos: DatosWhatsAppSancion
): Promise<ResultadoEnvioWhatsApp> {
  const client = getTwilioClient();

  if (!client) {
    return {
      success: false,
      error: "Servicio de WhatsApp no configurado",
    };
  }

  if (!datos.empleado.telefono) {
    return {
      success: false,
      error: "El empleado no tiene teléfono registrado",
    };
  }

  const linkLectura = `${APP_URL}/ver/${datos.tokenAcceso}`;

  // Mensaje de WhatsApp - más largo que SMS, puede incluir formato
  const mensaje = `📋 *NOTIFICACIÓN LABORAL*

Estimado/a *${datos.empleado.nombre}*,

*${datos.empresa.razonSocial}* le ha enviado una notificación de sanción disciplinaria (${datos.sancion.tipo}).

*Motivo:* ${datos.sancion.motivo.substring(0, 100)}${datos.sancion.motivo.length > 100 ? "..." : ""}

⚠️ *IMPORTANTE:* Tiene hasta el *${datos.sancion.fechaVencimiento}* para responder.

👉 Acceda aquí para ver el documento completo:
${linkLectura}

_Este mensaje es una notificación fehaciente con validez legal según Ley 27.742._

---
NotiLegal - Sistema de Notificaciones Laborales`;

  try {
    const numeroWhatsApp = formatearNumeroWhatsApp(datos.empleado.telefono);

    // Solo incluir statusCallback si es una URL pública
    const isProduction = APP_URL.includes("https://") && !APP_URL.includes("localhost");

    const messageOptions: Parameters<typeof client.messages.create>[0] = {
      body: mensaje,
      from: TWILIO_WHATSAPP_NUMBER,
      to: numeroWhatsApp,
    };

    if (isProduction) {
      messageOptions.statusCallback = `${APP_URL}/api/webhooks/twilio`;
    }

    const message = await client.messages.create(messageOptions);

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error("Error enviando WhatsApp:", error);

    let errorCode: string | undefined;
    let errorMessage = "Error desconocido";

    if (error && typeof error === "object" && "code" in error) {
      errorCode = String((error as { code: number }).code);
      errorMessage = (error as { message?: string }).message || errorMessage;
    }

    return {
      success: false,
      error: errorMessage,
      errorCode,
    };
  }
}

// ============================================
// WHATSAPP DE RECORDATORIO (72hs sin confirmación)
// ============================================

export async function enviarWhatsAppRecordatorio72hs(
  telefono: string,
  empleadoNombre: string,
  empresaNombre: string,
  linkLectura: string
): Promise<ResultadoEnvioWhatsApp> {
  const client = getTwilioClient();

  if (!client) {
    return { success: false, error: "Servicio no configurado" };
  }

  const mensaje = `⚠️ *RECORDATORIO IMPORTANTE*

Estimado/a *${empleadoNombre}*,

Hace más de 72 horas que tiene pendiente una notificación laboral de *${empresaNombre}*.

Si no confirma la lectura digitalmente, su empleador podrá optar por enviarle una *Carta Documento física* a su domicilio.

👉 Confirme aquí de forma rápida y privada:
${linkLectura}

_La confirmación digital es gratuita y confidencial._

---
NotiLegal`;

  try {
    const message = await client.messages.create({
      body: mensaje,
      from: TWILIO_WHATSAPP_NUMBER,
      to: formatearNumeroWhatsApp(telefono),
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// WHATSAPP DE RECORDATORIO URGENTE (5-7 días)
// ============================================

export async function enviarWhatsAppRecordatorioUrgente(
  telefono: string,
  empleadoNombre: string,
  diasRestantes: number,
  linkLectura: string
): Promise<ResultadoEnvioWhatsApp> {
  const client = getTwilioClient();

  if (!client) {
    return { success: false, error: "Servicio no configurado" };
  }

  const mensaje = `🚨 *ÚLTIMA NOTIFICACIÓN*

*${empleadoNombre}*, le quedan solo *${diasRestantes} días* para responder la notificación laboral pendiente.

Transcurrido ese plazo, la sanción quedará *FIRME* con valor de prueba plena.

👉 Acceda AHORA:
${linkLectura}

_Esta es una comunicación urgente._

---
NotiLegal`;

  try {
    const message = await client.messages.create({
      body: mensaje,
      from: TWILIO_WHATSAPP_NUMBER,
      to: formatearNumeroWhatsApp(telefono),
    });

    return { success: true, messageSid: message.sid };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// VERIFICAR ESTADO DE MENSAJE WHATSAPP
// ============================================

export async function verificarEstadoWhatsApp(messageSid: string): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
  leido?: boolean;
}> {
  const client = getTwilioClient();

  if (!client) {
    return { status: "unknown" };
  }

  try {
    const message = await client.messages(messageSid).fetch();

    return {
      status: message.status,
      errorCode: message.errorCode?.toString(),
      errorMessage: message.errorMessage || undefined,
      // "read" status indica que el usuario vio el mensaje (doble tick azul)
      leido: message.status === "read",
    };
  } catch {
    return { status: "unknown" };
  }
}

// ============================================
// CÓDIGOS DE ERROR ESPECÍFICOS DE WHATSAPP
// ============================================

export const WHATSAPP_ERROR_CODES: Record<string, string> = {
  "63001": "El número no tiene WhatsApp",
  "63003": "Tasa de mensajes excedida",
  "63007": "El usuario bloqueó la cuenta de WhatsApp Business",
  "63016": "El mensaje no pudo ser entregado",
  "131047": "El mensaje fue rechazado por WhatsApp",
  "131051": "El número no es un número de WhatsApp válido",
  "131053": "El número fue recientemente eliminado de WhatsApp",
};

export function obtenerDescripcionErrorWhatsApp(errorCode: string): string {
  return (
    WHATSAPP_ERROR_CODES[errorCode] || `Error de WhatsApp (código: ${errorCode})`
  );
}
