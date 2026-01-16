import sgMail from "@sendgrid/mail";

// Configurar SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "notificaciones@notilegal.com.ar";
const FROM_NAME = "NotiLegal";

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

interface EnviarEmailTestigoParams {
  to: string;
  nombreTestigo: string;
  nombreEmpresa: string;
  fechaHecho: string;
  lugarHecho?: string;
  motivoIncidente: string;
  linkDeclaracion: string;
}

interface ResultadoEnvio {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function enviarEmailTestigo(params: EnviarEmailTestigoParams): Promise<ResultadoEnvio> {
  const {
    to,
    nombreTestigo,
    nombreEmpresa,
    fechaHecho,
    lugarHecho,
    motivoIncidente,
    linkDeclaracion,
  } = params;

  if (!SENDGRID_API_KEY) {
    console.warn("SendGrid no configurado, simulando envío de email");
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
    };
  }

  // Formatear fecha
  const fechaFormateada = fechaHecho
    ? new Date(fechaHecho).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "fecha no especificada";

  const ubicacion = lugarHecho ? ` en ${lugarHecho}` : "";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Solicitud de Declaración Testimonial</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #1a1a1a; margin: 0; font-size: 24px;">NotiLegal</h1>
    <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">Gestión Laboral Digital</p>
  </div>

  <div style="background: #f8f9fa; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
    <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 20px;">
      Solicitud de Declaración Testimonial
    </h2>

    <p style="margin: 0 0 16px 0;">
      Hola <strong>${nombreTestigo}</strong>,
    </p>

    <p style="margin: 0 0 16px 0;">
      <strong>${nombreEmpresa}</strong> te solicita confirmar tu testimonio sobre un incidente laboral
      ocurrido el <strong>${fechaFormateada}</strong>${ubicacion}.
    </p>

    <p style="margin: 0 0 16px 0; color: #666;">
      <strong>Motivo:</strong> ${motivoIncidente}
    </p>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="${linkDeclaracion}"
       style="display: inline-block; background: #2563eb; color: white; text-decoration: none;
              padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Completar Declaración
    </a>
  </div>

  <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #92400e;">
      <strong>Importante:</strong> Tu declaración será registrada bajo juramento y podrá ser utilizada
      como prueba en procedimientos laborales. La información será tratada de forma confidencial.
    </p>
  </div>

  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="margin: 0; font-size: 14px; color: #475569;">
      <strong>¿Qué vas a hacer?</strong>
    </p>
    <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: #475569;">
      <li>Describir lo que viste o escuchaste</li>
      <li>Confirmar bajo declaración jurada</li>
      <li>Firmar digitalmente tu testimonio</li>
    </ul>
  </div>

  <p style="font-size: 13px; color: #666; margin-bottom: 24px;">
    Este link expira en 7 días. Si tenés problemas para acceder, contactá a tu empleador.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">

  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
    Este es un mensaje automático de NotiLegal.<br>
    No respondas a este email.
  </p>

</body>
</html>
`;

  const textContent = `
Hola ${nombreTestigo},

${nombreEmpresa} te solicita confirmar tu testimonio sobre un incidente laboral ocurrido el ${fechaFormateada}${ubicacion}.

Motivo: ${motivoIncidente}

Para completar tu declaración, accedé al siguiente link:
${linkDeclaracion}

Tu declaración será registrada bajo juramento y podrá ser utilizada como prueba en procedimientos laborales.

Este link expira en 7 días.

---
NotiLegal - Gestión Laboral Digital
`;

  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Solicitud de declaración testimonial - ${nombreEmpresa}`,
      text: textContent,
      html: htmlContent,
    };

    const response = await sgMail.send(msg);
    const messageId = response[0]?.headers?.["x-message-id"];

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("Error enviando email de testigo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
