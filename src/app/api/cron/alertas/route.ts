/**
 * Cron Job: Alertas 72hs y Gestión de Notificaciones Pendientes
 *
 * GET /api/cron/alertas
 *
 * Este cron job maneja el flujo de alertas para notificaciones no confirmadas:
 *
 * 1. A las 72hs sin confirmación:
 *    - Cambia estado a "pendiente_fisico" (semáforo ROJO)
 *    - Envía email de alerta al empleador con opciones
 *    - Envía WhatsApp recordatorio al empleado
 *
 * 2. A los 5 días:
 *    - Segunda alerta al empleador
 *
 * 3. A los 7 días:
 *    - Tercera y última alerta urgente
 *
 * Se recomienda ejecutar cada hora.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import sgMail from "@sendgrid/mail";
import { enviarWhatsAppRecordatorio72hs } from "@/lib/notifications/whatsapp";

// Configuración
const CRON_SECRET = process.env.CRON_SECRET;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "notificaciones@notilegal.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Cliente Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// ============================================
// TIPOS
// ============================================

interface NotificacionPendiente {
  id: string;
  empresa_id: string;
  token_acceso: string;
  tipo: string;
  motivo: string;
  email_enviado_at: string;
  alertas_enviadas_empleador: number;
  empleado: {
    nombre: string;
    cuil: string;
    telefono: string | null;
  };
  empresa: {
    razon_social: string;
    user_id: string;
  };
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get("authorization");
    const isVercelCron = request.headers.get("x-vercel-cron") === "true";
    const isAuthorized =
      isVercelCron ||
      !CRON_SECRET ||
      authHeader === `Bearer ${CRON_SECRET}`;

    if (!isAuthorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const ahora = new Date();

    const resultados = {
      alertas_72hs: 0,
      alertas_5dias: 0,
      alertas_7dias: 0,
      whatsapp_enviados: 0,
      errores: [] as { id: string; error: string }[],
    };

    // ═══════════════════════════════════════════════════════════════════════
    // TAREA 1: Notificaciones con 72+ horas sin confirmación (Primera alerta)
    // ═══════════════════════════════════════════════════════════════════════

    const hace72Horas = new Date(ahora.getTime() - 72 * 60 * 60 * 1000);

    const { data: pendientes72hs, error: error72hs } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empresa_id,
        token_acceso,
        tipo,
        motivo,
        email_enviado_at,
        alertas_enviadas_empleador,
        empleado:empleados(nombre, cuil, telefono),
        empresa:empresas(razon_social, user_id)
      `)
      .in("estado", ["enviado", "validado"])
      .lt("email_enviado_at", hace72Horas.toISOString())
      .is("lectura_confirmada_at", null)
      .or("alertas_enviadas_empleador.is.null,alertas_enviadas_empleador.eq.0")
      .not("estado", "in", "(firme,impugnado,notificado)")
      .returns<NotificacionPendiente[]>();

    if (error72hs) {
      console.error("Error buscando pendientes 72hs:", error72hs);
    }

    for (const notif of pendientes72hs || []) {
      try {
        await procesarAlerta72hs(supabase, notif, ahora);
        resultados.alertas_72hs++;

        // Enviar WhatsApp recordatorio al empleado
        if (notif.empleado?.telefono) {
          const linkLectura = `${APP_URL}/ver/${notif.token_acceso || notif.id}`;
          const whatsappResult = await enviarWhatsAppRecordatorio72hs(
            notif.empleado.telefono,
            notif.empleado.nombre,
            notif.empresa.razon_social,
            linkLectura
          );
          if (whatsappResult.success) {
            resultados.whatsapp_enviados++;
          }
        }
      } catch (err) {
        resultados.errores.push({
          id: notif.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TAREA 2: Segunda alerta a los 5 días
    // ═══════════════════════════════════════════════════════════════════════

    const hace5Dias = new Date(ahora.getTime() - 5 * 24 * 60 * 60 * 1000);

    const { data: pendientes5dias } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empresa_id,
        token_acceso,
        tipo,
        motivo,
        email_enviado_at,
        alertas_enviadas_empleador,
        empleado:empleados(nombre, cuil, telefono),
        empresa:empresas(razon_social, user_id)
      `)
      .eq("estado", "pendiente_fisico")
      .lt("email_enviado_at", hace5Dias.toISOString())
      .is("lectura_confirmada_at", null)
      .eq("alertas_enviadas_empleador", 1)
      .returns<NotificacionPendiente[]>();

    for (const notif of pendientes5dias || []) {
      try {
        await enviarAlertaEmpleador(supabase, notif, 2, ahora);
        resultados.alertas_5dias++;
      } catch (err) {
        resultados.errores.push({
          id: notif.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TAREA 3: Tercera alerta urgente a los 7 días
    // ═══════════════════════════════════════════════════════════════════════

    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

    const { data: pendientes7dias } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empresa_id,
        token_acceso,
        tipo,
        motivo,
        email_enviado_at,
        alertas_enviadas_empleador,
        empleado:empleados(nombre, cuil, telefono),
        empresa:empresas(razon_social, user_id)
      `)
      .eq("estado", "pendiente_fisico")
      .lt("email_enviado_at", hace7Dias.toISOString())
      .is("lectura_confirmada_at", null)
      .eq("alertas_enviadas_empleador", 2)
      .returns<NotificacionPendiente[]>();

    for (const notif of pendientes7dias || []) {
      try {
        await enviarAlertaEmpleador(supabase, notif, 3, ahora);
        resultados.alertas_7dias++;
      } catch (err) {
        resultados.errores.push({
          id: notif.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    console.log(`Cron Alertas: ${resultados.alertas_72hs} a 72hs, ${resultados.alertas_5dias} a 5d, ${resultados.alertas_7dias} a 7d`);

    return NextResponse.json({
      success: true,
      timestamp: ahora.toISOString(),
      ...resultados,
    });

  } catch (error) {
    console.error("Error en cron de alertas:", error);
    return NextResponse.json(
      { error: "Error interno del cron" },
      { status: 500 }
    );
  }
}

// ============================================
// PROCESAR ALERTA 72HS (PRIMERA)
// ============================================

async function procesarAlerta72hs(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  notif: NotificacionPendiente,
  ahora: Date
) {
  const timestamp = ahora.toISOString();

  // Actualizar estado a pendiente_fisico
  await supabase
    .from("notificaciones")
    .update({
      estado: "pendiente_fisico",
      semaforo: "pendiente_fisico",
      fecha_alerta_72hs: timestamp,
      alertas_enviadas_empleador: 1,
    })
    .eq("id", notif.id);

  // Registrar evento
  await supabase.from("eventos").insert({
    notificacion_id: notif.id,
    tipo: "alerta_72hs_pendiente_fisico",
    metadata: {
      timestamp,
      dias_sin_confirmacion: 3,
      requiere_accion_empleador: true,
    },
  });

  // Enviar email al empleador
  await enviarAlertaEmpleador(supabase, notif, 1, ahora);
}

// ============================================
// ENVIAR ALERTA AL EMPLEADOR
// ============================================

async function enviarAlertaEmpleador(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  notif: NotificacionPendiente,
  numeroAlerta: 1 | 2 | 3,
  ahora: Date
) {
  // Obtener email del empleador
  const { data: userData } = await supabase.auth.admin.getUserById(
    notif.empresa.user_id
  );

  if (!userData?.user?.email) {
    console.error(`No se encontró email para usuario ${notif.empresa.user_id}`);
    return;
  }

  const asuntos: Record<number, string> = {
    1: `⚠️ Acción Requerida: ${notif.empleado.nombre} no confirmó lectura (72hs)`,
    2: `🔔 Recordatorio: ${notif.empleado.nombre} aún sin confirmar (5 días)`,
    3: `🚨 URGENTE: ${notif.empleado.nombre} sin confirmar hace 7 días`,
  };

  const colores: Record<number, string> = {
    1: "#f59e0b", // Amarillo
    2: "#f97316", // Naranja
    3: "#dc2626", // Rojo
  };

  const urgencias: Record<number, string> = {
    1: "Han pasado más de 72 horas desde el envío",
    2: "Han pasado 5 días desde el envío",
    3: "Han pasado 7 días. Esta es la última alerta automática",
  };

  const linkDetalle = `${APP_URL}/sanciones/${notif.id}`;
  const linkReenviar = `${APP_URL}/sanciones/${notif.id}/reenviar`;
  const linkPdfFisico = `${APP_URL}/sanciones/${notif.id}/pdf-fisico`;

  const htmlContent = `
<!DOCTYPE html>
<html>
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
            <td style="background-color: ${colores[numeroAlerta]}; padding: 25px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 18px;">
                ${numeroAlerta === 3 ? "🚨" : "⚠️"} Notificación Pendiente de Confirmación
              </h1>
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding: 30px 40px;">
              <p style="margin: 0 0 20px 0; color: #374151; font-size: 15px;">
                Estimado/a representante de <strong>${notif.empresa.razon_social}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: ${colores[numeroAlerta]}; font-size: 15px; font-weight: 600;">
                ${urgencias[numeroAlerta]} y el trabajador aún no ha confirmado la recepción de la notificación.
              </p>

              <!-- Datos -->
              <table style="width: 100%; background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px 0;"><strong>Empleado:</strong> ${notif.empleado.nombre}</p>
                    <p style="margin: 0 0 8px 0;"><strong>CUIL:</strong> ${notif.empleado.cuil}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Sanción:</strong> ${notif.tipo}</p>
                    <p style="margin: 0;"><strong>Estado:</strong> <span style="color: #dc2626;">🔴 Pendiente de confirmación</span></p>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 25px 0 15px 0; color: #111827;">Opciones disponibles:</h3>

              <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                <strong>1. Reenviar notificación digital</strong><br>
                <span style="color: #6b7280;">El sistema enviará un nuevo Email y WhatsApp al trabajador.</span>
              </p>

              <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
                <strong>2. Generar documento para envío físico</strong><br>
                <span style="color: #6b7280;">Descargue el PDF adaptado para Carta Documento.</span>
              </p>

              <p style="margin: 0 0 20px 0; color: #374151; font-size: 14px;">
                <strong>3. Esperar</strong><br>
                <span style="color: #6b7280;">${numeroAlerta < 3 ? "Recibirá alertas adicionales." : "Esta es la última alerta automática."}</span>
              </p>

              <table style="width: 100%; margin: 25px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${linkDetalle}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 5px;">
                      Ver en Dashboard
                    </a>
                    <a href="${linkReenviar}" style="display: inline-block; background-color: #64748b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 5px;">
                      Reenviar Digital
                    </a>
                    <a href="${linkPdfFisico}" style="display: inline-block; background-color: #64748b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 5px;">
                      Descargar PDF Físico
                    </a>
                  </td>
                </tr>
              </table>

              <table style="width: 100%; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; color: #991b1b; font-size: 13px;">
                      <strong>⚠️ Importante:</strong> Mientras no exista confirmación digital o envío físico con acuse de recibo, el plazo de 30 días para impugnación NO comenzará a correr.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                ID: ${notif.id} | Alerta ${numeroAlerta} de 3 | NotiLegal
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
    await sgMail.send({
      to: userData.user.email,
      from: {
        email: SENDGRID_FROM_EMAIL,
        name: "NotiLegal - Alertas",
      },
      subject: asuntos[numeroAlerta],
      html: htmlContent,
    });

    // Actualizar contador de alertas
    await supabase
      .from("notificaciones")
      .update({ alertas_enviadas_empleador: numeroAlerta })
      .eq("id", notif.id);

    // Registrar evento
    await supabase.from("eventos").insert({
      notificacion_id: notif.id,
      tipo: `alerta_empleador_${numeroAlerta}`,
      metadata: {
        timestamp: ahora.toISOString(),
        destinatario: userData.user.email,
        numero_alerta: numeroAlerta,
      },
    });

  } catch (error) {
    console.error(`Error enviando alerta ${numeroAlerta} a empleador:`, error);
  }
}

// También permitir POST
export async function POST(request: NextRequest) {
  return GET(request);
}
