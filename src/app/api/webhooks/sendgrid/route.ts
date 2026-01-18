/**
 * Webhook de SendGrid
 *
 * Recibe eventos de tracking de emails:
 * - delivered: Email entregado al servidor de destino
 * - open: Email abierto por el destinatario
 * - click: Link clickeado
 * - bounce: Email rebotado
 * - dropped: Email descartado
 * - spam: Marcado como spam
 *
 * Actualiza el estado de la notificación y genera alertas si es necesario.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarEmailAlertaEmpleador } from "@/lib/notifications";
import { verifySendGridSignature, hashPayload } from "@/lib/webhooks";

// Cliente Supabase con service role para webhooks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    // Fallback a anon key si no hay service key
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Tipos de eventos de SendGrid
interface SendGridEvent {
  event: "delivered" | "open" | "click" | "bounce" | "dropped" | "spamreport" | "deferred";
  email: string;
  timestamp: number;
  sg_message_id?: string;
  notificacion_id?: string;
  ip?: string;
  useragent?: string;
  url?: string;
  reason?: string;
  type?: string; // Para bounces: "bounce" o "blocked"
  bounce_classification?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Obtener el body raw para verificación de firma
    const rawBody = await request.text();
    const events: SendGridEvent[] = JSON.parse(rawBody);

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verificar firma de SendGrid
    const signature = request.headers.get("X-Twilio-Email-Event-Webhook-Signature");
    const timestamp = request.headers.get("X-Twilio-Email-Event-Webhook-Timestamp");

    const signatureCheck = verifySendGridSignature(rawBody, signature, timestamp);

    const supabase = getSupabaseAdmin();

    // Log del webhook recibido (incluso si la firma falla)
    const payloadHash = hashPayload(rawBody);
    const ipOrigen = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") || "unknown";

    // Guardar log de webhook
    await supabase.from("webhook_logs").insert({
      proveedor: "sendgrid",
      evento_tipo: events.map((e) => e.event).join(","),
      payload_hash: payloadHash,
      payload_raw: events,
      firma_valida: signatureCheck.valid,
      firma_error: signatureCheck.error,
      ip_origen: ipOrigen,
      user_agent: request.headers.get("user-agent"),
    });

    // Si la firma es inválida y está configurada la verificación, rechazar
    if (!signatureCheck.valid && process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY) {
      console.warn("[SendGrid Webhook] Firma inválida:", signatureCheck.error);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    for (const event of events) {
      // Intentar obtener notificacion_id de custom args o del email
      let notificacionId = event.notificacion_id;

      if (!notificacionId && event.email) {
        // Buscar por email del empleado
        const { data: notif } = await supabase
          .from("notificaciones")
          .select("id, empresa_id")
          .eq("empleado.email", event.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (notif) {
          notificacionId = notif.id;
        }
      }

      if (!notificacionId) {
        console.log("SendGrid webhook: No se encontró notificación para", event.email);
        continue;
      }

      const timestamp = new Date(event.timestamp * 1000).toISOString();

      // Procesar según tipo de evento
      switch (event.event) {
        case "delivered":
          // Guardar sendgrid_message_id para reconciliación
          await supabase
            .from("notificaciones")
            .update({
              email_entregado_at: timestamp,
              sendgrid_message_id: event.sg_message_id || null,
            })
            .eq("id", notificacionId);

          await supabase.from("eventos").insert({
            notificacion_id: notificacionId,
            tipo: "email_entregado",
            metadata: { timestamp, sg_message_id: event.sg_message_id },
          });
          break;

        case "open":
          // Solo registrar la primera apertura en email_abierto_at
          const { data: notifOpen } = await supabase
            .from("notificaciones")
            .select("email_abierto_at")
            .eq("id", notificacionId)
            .single();

          const updateOpen: Record<string, unknown> = {};
          if (!notifOpen?.email_abierto_at) {
            updateOpen.email_abierto_at = timestamp;
          }

          if (Object.keys(updateOpen).length > 0) {
            await supabase
              .from("notificaciones")
              .update(updateOpen)
              .eq("id", notificacionId);
          }

          await supabase.from("eventos").insert({
            notificacion_id: notificacionId,
            tipo: "email_abierto",
            ip: event.ip || null,
            user_agent: event.useragent || null,
            metadata: { timestamp, ip: event.ip, useragent: event.useragent },
          });
          break;

        case "click":
          await supabase.from("eventos").insert({
            notificacion_id: notificacionId,
            tipo: "email_click",
            ip: event.ip || null,
            user_agent: event.useragent || null,
            metadata: { timestamp, url: event.url, ip: event.ip },
          });
          break;

        case "bounce":
        case "dropped":
          // Email rebotado - CRÍTICO
          await supabase
            .from("notificaciones")
            .update({
              email_rebotado: true,
              email_rebote_tipo: event.type || event.event,
              email_rebote_mensaje: event.reason || event.bounce_classification,
              semaforo: "alerta",
              requiere_notificacion_fisica: true,
            })
            .eq("id", notificacionId);

          await supabase.from("eventos").insert({
            notificacion_id: notificacionId,
            tipo: "email_rebotado",
            metadata: {
              timestamp,
              tipo: event.type,
              razon: event.reason,
              clasificacion: event.bounce_classification,
            },
          });

          // Notificar al empleador
          await notificarEmpleadorRebote(supabase, notificacionId, event.reason);
          break;

        case "spamreport":
          await supabase.from("eventos").insert({
            notificacion_id: notificacionId,
            tipo: "email_spam",
            metadata: { timestamp },
          });
          break;
      }
    }

    return NextResponse.json({ success: true, processed: events.length });

  } catch (error) {
    console.error("Error en webhook SendGrid:", error);
    return NextResponse.json(
      { error: "Error procesando webhook" },
      { status: 500 }
    );
  }
}

// Función helper para notificar al empleador sobre rebote
async function notificarEmpleadorRebote(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  notificacionId: string,
  razon?: string
) {
  try {
    // Obtener datos de la notificación y empresa
    const { data: notif } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empresa:empresas(user_id, razon_social),
        empleado:empleados(nombre)
      `)
      .eq("id", notificacionId)
      .single();

    if (!notif || !notif.empresa || !notif.empleado) return;

    const empresa = notif.empresa as unknown as { user_id: string; razon_social: string };
    const empleado = notif.empleado as unknown as { nombre: string };

    // Obtener email del usuario (empleador)
    // Nota: Esto requiere service role key para acceder a auth.users
    // Por ahora lo dejamos como placeholder

    console.log(`ALERTA: Email rebotado para ${empleado.nombre}. Razón: ${razon}`);

  } catch (error) {
    console.error("Error notificando rebote:", error);
  }
}

// GET para verificación del webhook
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "sendgrid",
    timestamp: new Date().toISOString(),
  });
}
