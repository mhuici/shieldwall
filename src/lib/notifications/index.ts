/**
 * Módulo de Notificaciones Fehacientes
 *
 * Exporta todos los servicios de notificación:
 * - Email (SendGrid)
 * - SMS (Twilio)
 * - Tipos compartidos
 */

export {
  enviarEmailSancion,
  enviarEmailCopiaEmpleador,
  enviarEmailAlertaEmpleador,
  type DatosEmailSancion,
  type DatosEmailCopiaEmpleador,
  type DatosEmailAlerta,
  type ResultadoEnvioEmail,
} from "./email";

export {
  enviarSMSSancion,
  enviarSMSRecordatorio,
  verificarEstadoSMS,
  formatearTelefonoArgentino,
  obtenerDescripcionError,
  TWILIO_ERROR_CODES,
  type DatosSMSSancion,
  type ResultadoEnvioSMS,
} from "./sms";

export {
  enviarWhatsAppSancion,
  enviarWhatsAppRecordatorio72hs,
  enviarWhatsAppRecordatorioUrgente,
  verificarEstadoWhatsApp,
  formatearNumeroWhatsApp,
  obtenerDescripcionErrorWhatsApp,
  WHATSAPP_ERROR_CODES,
  type DatosWhatsAppSancion,
  type ResultadoEnvioWhatsApp,
} from "./whatsapp";

// ============================================
// SEMÁFORO - Re-exportar desde semaforo.ts (fuente única de verdad)
// ============================================

export {
  type EstadoSemaforo,
  type InfoSemaforo,
  SEMAFORO_INFO,
  calcularEstadoSemaforo,
  formatearFechaNotificacion,
} from "./semaforo";
