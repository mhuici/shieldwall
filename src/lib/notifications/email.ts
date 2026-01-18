/**
 * Servicio de Email - SendGrid
 *
 * Envía notificaciones de sanción por email con:
 * - Token de acceso único para seguridad
 * - Tracking de apertura y clics
 * - Diseño profesional con información legal
 */

import sgMail from "@sendgrid/mail";

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "notificaciones@notilegal.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "NotiLegal";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

// ============================================
// TIPOS
// ============================================

export interface DatosEmailSancion {
  notificacionId: string;
  tokenAcceso: string;
  empleado: {
    nombre: string;
    email: string;
  };
  empresa: {
    razonSocial: string;
  };
  sancion: {
    tipo: string;
    motivo: string;
    fechaHecho: string;
    fechaVencimiento: string;
  };
}

export interface ResultadoEnvioEmail {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// TEMPLATES DE EMAIL
// ============================================

function generarHtmlEmail(datos: DatosEmailSancion): string {
  const linkLectura = `${APP_URL}/ver/${datos.notificacionId}?token=${datos.tokenAcceso}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Sanción Laboral</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                📋 NotiLegal
              </h1>
              <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 14px;">
                Sistema de Notificaciones Laborales
              </p>
            </td>
          </tr>

          <!-- Alerta -->
          <tr>
            <td style="background-color: #fef3c7; padding: 20px 40px; border-bottom: 1px solid #fcd34d;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                ⚠️ <strong>NOTIFICACIÓN FEHACIENTE</strong> - Documento con validez legal
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Estimado/a <strong>${datos.empleado.nombre}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Le informamos que <strong>${datos.empresa.razonSocial}</strong> le ha comunicado
                una sanción disciplinaria que requiere su atención inmediata.
              </p>

              <!-- Datos de la sanción -->
              <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Tipo de Sanción
                    </p>
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 16px; font-weight: 600;">
                      ${datos.sancion.tipo}
                    </p>

                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Motivo
                    </p>
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
                      ${datos.sancion.motivo}
                    </p>

                    <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Fecha del Hecho
                    </p>
                    <p style="margin: 0; color: #111827; font-size: 14px;">
                      ${datos.sancion.fechaHecho}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${linkLectura}"
                       style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Ver Notificación Completa
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plazo -->
              <table style="width: 100%; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #991b1b; font-size: 14px; font-weight: 500;">
                      🕐 <strong>PLAZO LEGAL:</strong> Tiene hasta el <strong>${datos.sancion.fechaVencimiento}</strong>
                      (30 días corridos) para impugnar esta sanción.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 13px;">
                      Transcurrido ese plazo sin objeciones, la sanción quedará <strong>FIRME</strong>
                      y tendrá valor de prueba plena en caso de litigio laboral.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                Este email constituye notificación fehaciente según la normativa laboral argentina vigente.
                Al hacer clic en el botón, se registrará la fecha y hora de lectura con fines probatorios.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-align: center;">
                Este mensaje fue enviado por NotiLegal en nombre de ${datos.empresa.razonSocial}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                ID: ${datos.notificacionId}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

function generarTextoPlano(datos: DatosEmailSancion): string {
  const linkLectura = `${APP_URL}/ver/${datos.notificacionId}?token=${datos.tokenAcceso}`;

  return `
NOTIFICACIÓN DE SANCIÓN LABORAL
================================

Estimado/a ${datos.empleado.nombre},

Le informamos que ${datos.empresa.razonSocial} le ha comunicado una sanción disciplinaria.

DATOS DE LA SANCIÓN:
- Tipo: ${datos.sancion.tipo}
- Motivo: ${datos.sancion.motivo}
- Fecha del Hecho: ${datos.sancion.fechaHecho}

PLAZO LEGAL: Tiene hasta el ${datos.sancion.fechaVencimiento} (30 días corridos) para impugnar.

Para ver la notificación completa y confirmar su lectura, ingrese al siguiente link:
${linkLectura}

IMPORTANTE: Si no impugna la sanción dentro del plazo, quedará FIRME y tendrá valor de prueba plena.

---
Este mensaje fue enviado por NotiLegal
ID: ${datos.notificacionId}
  `.trim();
}

// ============================================
// FUNCIÓN PRINCIPAL DE ENVÍO
// ============================================

export async function enviarEmailSancion(datos: DatosEmailSancion): Promise<ResultadoEnvioEmail> {
  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY no configurada");
    return {
      success: false,
      error: "Servicio de email no configurado",
    };
  }

  if (!datos.empleado.email) {
    return {
      success: false,
      error: "El empleado no tiene email registrado",
    };
  }

  try {
    const msg = {
      to: datos.empleado.email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: `⚠️ Notificación de Sanción Laboral - ${datos.empresa.razonSocial}`,
      text: generarTextoPlano(datos),
      html: generarHtmlEmail(datos),
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false,
        },
        openTracking: {
          enable: true,
        },
      },
      customArgs: {
        notificacion_id: datos.notificacionId,
      },
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error) {
    console.error("Error enviando email:", error);

    const errorMessage = error instanceof Error ? error.message : "Error desconocido";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

// ============================================
// EMAIL DE COPIA AL EMPLEADOR (CC)
// ============================================

export interface DatosEmailCopiaEmpleador {
  notificacionId: string;
  empleador: {
    nombre: string;
    email: string;
  };
  empleado: {
    nombre: string;
    cuil: string;
  };
  empresa: {
    razonSocial: string;
  };
  sancion: {
    tipo: string;
    motivo: string;
    fechaHecho: string;
    fechaVencimiento: string;
  };
  timestamp: string;
}

export async function enviarEmailCopiaEmpleador(
  datos: DatosEmailCopiaEmpleador
): Promise<ResultadoEnvioEmail> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: "Servicio de email no configurado" };
  }

  const linkDetalle = `${APP_URL}/sanciones/${datos.notificacionId}`;

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #10b981; padding: 25px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px;">
                ✅ Notificación Enviada - Copia para sus registros
              </h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px;">
                Estimado/a <strong>${datos.empleador.nombre}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px;">
                Se ha enviado correctamente la siguiente notificación de sanción al empleado:
              </p>

              <!-- Datos del empleado -->
              <table style="width: 100%; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px 0; color: #166534; font-size: 12px; text-transform: uppercase;">
                      Empleado Notificado
                    </p>
                    <p style="margin: 0 0 5px 0; color: #111827; font-size: 16px; font-weight: 600;">
                      ${datos.empleado.nombre}
                    </p>
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      CUIL: ${datos.empleado.cuil}
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Datos de la sanción -->
              <table style="width: 100%; background-color: #f9fafb; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Tipo de Sanción
                    </p>
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 15px; font-weight: 600;">
                      ${datos.sancion.tipo}
                    </p>

                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Motivo
                    </p>
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
                      ${datos.sancion.motivo}
                    </p>

                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Fecha del Hecho
                    </p>
                    <p style="margin: 0 0 15px 0; color: #111827; font-size: 14px;">
                      ${datos.sancion.fechaHecho}
                    </p>

                    <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">
                      Fecha Límite de Impugnación
                    </p>
                    <p style="margin: 0; color: #111827; font-size: 14px; font-weight: 600;">
                      ${datos.sancion.fechaVencimiento}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0; color: #374151; font-size: 14px;">
                📧 El empleado recibirá esta notificación por <strong>Email</strong> y <strong>WhatsApp</strong>.
              </p>

              <p style="margin: 20px 0; color: #374151; font-size: 14px;">
                Le notificaremos cuando el empleado confirme la lectura del documento.
              </p>

              <table style="width: 100%; margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${linkDetalle}"
                       style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 14px; font-weight: 600;">
                      Ver Estado en Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">
                Enviado: ${datos.timestamp}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                ID: ${datos.notificacionId} | NotiLegal
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const msg = {
      to: datos.empleador.email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: `✅ Notificación enviada a ${datos.empleado.nombre} - ${datos.sancion.tipo}`,
      html: htmlContent,
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error) {
    console.error("Error enviando email copia empleador:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

// ============================================
// EMAIL DE ALERTA AL EMPLEADOR
// ============================================

export interface DatosEmailAlerta {
  empleador: {
    nombre: string;
    email: string;
  };
  empleado: {
    nombre: string;
  };
  notificacionId: string;
  tipoAlerta: "lectura_confirmada" | "sin_confirmacion_48hs" | "email_rebotado" | "sms_fallido";
  mensaje: string;
}

export async function enviarEmailAlertaEmpleador(datos: DatosEmailAlerta): Promise<ResultadoEnvioEmail> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: "Servicio de email no configurado" };
  }

  const asuntos: Record<string, string> = {
    lectura_confirmada: `✅ ${datos.empleado.nombre} confirmó lectura de sanción`,
    sin_confirmacion_48hs: `🔴 ALERTA: ${datos.empleado.nombre} no confirmó lectura - Acción requerida`,
    email_rebotado: `⚠️ Email rebotado para ${datos.empleado.nombre}`,
    sms_fallido: `⚠️ SMS fallido para ${datos.empleado.nombre}`,
  };

  const colores: Record<string, string> = {
    lectura_confirmada: "#10b981",
    sin_confirmacion_48hs: "#ef4444",
    email_rebotado: "#f59e0b",
    sms_fallido: "#f59e0b",
  };

  try {
    const msg = {
      to: datos.empleador.email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: asuntos[datos.tipoAlerta],
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${colores[datos.tipoAlerta]}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">Alerta de Notificación</h2>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
            <p><strong>Empleado:</strong> ${datos.empleado.nombre}</p>
            <p>${datos.mensaje}</p>
            <a href="${APP_URL}/sanciones/${datos.notificacionId}"
               style="display: inline-block; background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
              Ver Detalle
            </a>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Error desconocido" };
  }
}

// ============================================
// EMAIL DE INVITACIÓN A FIRMAR CONVENIO
// ============================================

export interface DatosEmailConvenio {
  to: string;
  empleadoNombre: string;
  empresaNombre: string;
  linkFirma: string;
  diasParaExpirar: number;
}

export async function sendConvenioInvitacionEmail(
  datos: DatosEmailConvenio
): Promise<ResultadoEnvioEmail> {
  if (!SENDGRID_API_KEY) {
    return { success: false, error: "Servicio de email no configurado" };
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: #1e40af; padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                📋 NotiLegal
              </h1>
              <p style="margin: 10px 0 0 0; color: #93c5fd; font-size: 14px;">
                Convenio de Domicilio Electrónico
              </p>
            </td>
          </tr>

          <!-- Info -->
          <tr>
            <td style="background-color: #dbeafe; padding: 20px 40px; border-bottom: 1px solid #93c5fd;">
              <p style="margin: 0; color: #1e40af; font-size: 14px; font-weight: 500;">
                📝 <strong>DOCUMENTO LEGAL</strong> - Requiere su firma
              </p>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                Estimado/a <strong>${datos.empleadoNombre}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong>${datos.empresaNombre}</strong> le invita a firmar el <strong>Convenio de Constitución de Domicilio Electrónico</strong>.
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                Este convenio le permitirá recibir notificaciones laborales de forma digital, segura y privada, evitando demoras de la correspondencia tradicional.
              </p>

              <!-- Beneficios -->
              <table style="width: 100%; background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-weight: 600;">
                      Beneficios para usted:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                      <li>Reciba notificaciones al instante en su email y teléfono</li>
                      <li>Acceso seguro con verificación de identidad</li>
                      <li>Siempre puede solicitar notificación física si lo prefiere</li>
                      <li>Sin costo alguno para usted</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${datos.linkFirma}"
                       style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Revisar y Firmar Convenio
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Plazo -->
              <table style="width: 100%; background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; margin: 25px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;">
                      ⏰ <strong>Este enlace expira en ${datos.diasParaExpirar} días.</strong>
                      Si no puede firmarlo ahora, solicite un nuevo enlace a su empleador.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Alternativa física -->
              <p style="margin: 25px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                <strong>Nota:</strong> Si prefiere no recibir notificaciones electrónicas, puede solicitar a su empleador que todas las comunicaciones se realicen por carta documento. Esta opción no implica ningún perjuicio para usted.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 25px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 12px; text-align: center;">
                Este mensaje fue enviado por NotiLegal en nombre de ${datos.empresaNombre}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                Conforme a la Acordada N° 31/2011 CSJN
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const textoPlano = `
CONVENIO DE DOMICILIO ELECTRÓNICO
==================================

Estimado/a ${datos.empleadoNombre},

${datos.empresaNombre} le invita a firmar el Convenio de Constitución de Domicilio Electrónico.

Este convenio le permitirá recibir notificaciones laborales de forma digital, segura y privada.

Para revisar y firmar el convenio, ingrese al siguiente enlace:
${datos.linkFirma}

IMPORTANTE: Este enlace expira en ${datos.diasParaExpirar} días.

Si prefiere no recibir notificaciones electrónicas, puede solicitar a su empleador que todas las comunicaciones se realicen por carta documento.

---
NotiLegal - Sistema de Notificaciones Laborales
Conforme a la Acordada N° 31/2011 CSJN
  `.trim();

  try {
    const msg = {
      to: datos.to,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: SENDGRID_FROM_NAME,
      },
      subject: `📝 ${datos.empresaNombre} - Convenio de Domicilio Electrónico`,
      text: textoPlano,
      html: htmlContent,
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers["x-message-id"] as string,
    };
  } catch (error) {
    console.error("Error enviando email de convenio:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
