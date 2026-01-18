/**
 * Servicio de SMS - Twilio
 *
 * Envía notificaciones de sanción por SMS como respaldo
 * cuando el email no es confirmado en 24hs.
 *
 * Incluye:
 * - Link corto a la notificación
 * - Mensaje claro y conciso
 * - Tracking de entrega
 */

import twilio from "twilio";

// Configuración Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
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

export interface DatosSMSSancion {
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
    fechaVencimiento: string;
  };
}

export interface ResultadoEnvioSMS {
  success: boolean;
  messageSid?: string;
  error?: string;
  errorCode?: string;
}

// ============================================
// FORMATEO DE TELÉFONO
// ============================================

/**
 * Formatea un número de teléfono argentino al formato E.164
 * Ejemplo: "1155551234" -> "+5491155551234"
 */
export function formatearTelefonoArgentino(telefono: string): string {
  // Remover espacios, guiones, paréntesis
  let numero = telefono.replace(/[\s\-\(\)]/g, "");

  // Si ya tiene código de país, retornar
  if (numero.startsWith("+")) {
    return numero;
  }

  // Remover 0 inicial si existe
  if (numero.startsWith("0")) {
    numero = numero.substring(1);
  }

  // Remover 15 inicial de celulares argentinos
  if (numero.startsWith("15")) {
    numero = numero.substring(2);
  }

  // Agregar código de país Argentina (+54) y 9 para celulares
  // Asumimos que es un celular si tiene 10 dígitos
  if (numero.length === 10) {
    return `+549${numero}`;
  }

  // Si tiene 11 dígitos y empieza con 9, ya está formateado
  if (numero.length === 11 && numero.startsWith("9")) {
    return `+54${numero}`;
  }

  // Fallback: agregar +54 directamente
  return `+54${numero}`;
}

// ============================================
// FUNCIÓN GENÉRICA DE ENVÍO SMS
// ============================================

/**
 * Envía un SMS genérico a un número de teléfono
 */
export async function sendSMS(
  telefono: string,
  mensaje: string
): Promise<ResultadoEnvioSMS> {
  const client = getTwilioClient();

  if (!client) {
    return {
      success: false,
      error: "Servicio de SMS no configurado",
    };
  }

  if (!TWILIO_PHONE_NUMBER) {
    return {
      success: false,
      error: "Número de envío no configurado",
    };
  }

  if (!telefono) {
    return {
      success: false,
      error: "Número de teléfono no proporcionado",
    };
  }

  try {
    const telefonoFormateado = formatearTelefonoArgentino(telefono);

    const message = await client.messages.create({
      body: mensaje,
      from: TWILIO_PHONE_NUMBER,
      to: telefonoFormateado,
    });

    return {
      success: true,
      messageSid: message.sid,
    };
  } catch (error) {
    console.error("Error enviando SMS:", error);

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
// FUNCIÓN PRINCIPAL DE ENVÍO SANCIÓN
// ============================================

export async function enviarSMSSancion(datos: DatosSMSSancion): Promise<ResultadoEnvioSMS> {
  const client = getTwilioClient();

  if (!client) {
    return {
      success: false,
      error: "Servicio de SMS no configurado",
    };
  }

  if (!TWILIO_PHONE_NUMBER) {
    return {
      success: false,
      error: "Número de envío no configurado",
    };
  }

  if (!datos.empleado.telefono) {
    return {
      success: false,
      error: "El empleado no tiene teléfono registrado",
    };
  }

  const linkLectura = `${APP_URL}/ver/${datos.notificacionId}?token=${datos.tokenAcceso}`;

  // Mensaje SMS (máximo 160 caracteres para 1 segmento)
  const mensaje = `NOTIFICACION LABORAL de ${datos.empresa.razonSocial.substring(0, 20)}. ` +
    `${datos.sancion.tipo}. ` +
    `Plazo: ${datos.sancion.fechaVencimiento}. ` +
    `Ver: ${linkLectura}`;

  try {
    const telefonoFormateado = formatearTelefonoArgentino(datos.empleado.telefono);

    // Solo incluir statusCallback si es una URL pública (no localhost)
    const isProduction = APP_URL.includes("https://") && !APP_URL.includes("localhost");

    const messageOptions: Parameters<typeof client.messages.create>[0] = {
      body: mensaje,
      from: TWILIO_PHONE_NUMBER,
      to: telefonoFormateado,
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
    console.error("Error enviando SMS:", error);

    // Extraer código de error de Twilio
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
// SMS DE RECORDATORIO
// ============================================

export async function enviarSMSRecordatorio(
  telefono: string,
  empleadoNombre: string,
  diasRestantes: number,
  linkLectura: string
): Promise<ResultadoEnvioSMS> {
  const client = getTwilioClient();

  if (!client || !TWILIO_PHONE_NUMBER) {
    return { success: false, error: "Servicio no configurado" };
  }

  const mensaje = `URGENTE: ${empleadoNombre}, tiene ${diasRestantes} dias para responder ` +
    `la notificacion laboral. Ver: ${linkLectura}`;

  try {
    const message = await client.messages.create({
      body: mensaje,
      from: TWILIO_PHONE_NUMBER,
      to: formatearTelefonoArgentino(telefono),
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
// VERIFICAR ESTADO DE MENSAJE
// ============================================

export async function verificarEstadoSMS(messageSid: string): Promise<{
  status: string;
  errorCode?: string;
  errorMessage?: string;
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
    };
  } catch {
    return { status: "unknown" };
  }
}

// ============================================
// CÓDIGOS DE ERROR COMUNES DE TWILIO
// ============================================

export const TWILIO_ERROR_CODES: Record<string, string> = {
  "21211": "Número de teléfono inválido",
  "21214": "El número no puede recibir SMS",
  "21408": "Permisos insuficientes para el país",
  "21610": "El número bloqueó los mensajes",
  "21612": "El número no existe",
  "30003": "Número inalcanzable",
  "30004": "Mensaje bloqueado",
  "30005": "Número desconocido",
  "30006": "Portador inalcanzable",
  "30007": "Mensaje filtrado por spam",
};

export function obtenerDescripcionError(errorCode: string): string {
  return TWILIO_ERROR_CODES[errorCode] || `Error de SMS (código: ${errorCode})`;
}
