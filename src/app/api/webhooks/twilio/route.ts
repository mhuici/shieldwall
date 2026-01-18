/**
 * Webhook de Twilio
 *
 * Recibe actualizaciones de estado de SMS:
 * - queued: En cola
 * - sent: Enviado al carrier
 * - delivered: Entregado al dispositivo
 * - undelivered: No entregado
 * - failed: Falló el envío
 *
 * Actualiza el estado y genera alertas si falla.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { obtenerDescripcionError } from "@/lib/notifications";
import { verifyTwilioSignature, hashPayload } from "@/lib/webhooks";

// Cliente Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Estados de Twilio
type TwilioStatus = "queued" | "sent" | "delivered" | "undelivered" | "failed";

export async function POST(request: NextRequest) {
  try {
    // Twilio envía datos como form-urlencoded
    const formData = await request.formData();

    // Convertir FormData a objeto para verificación y logging
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const messageSid = params.MessageSid;
    const messageStatus = params.MessageStatus as TwilioStatus;
    const to = params.To;
    const errorCode = params.ErrorCode || null;
    const errorMessage = params.ErrorMessage || null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Verificar firma de Twilio
    const signature = request.headers.get("X-Twilio-Signature");
    const webhookUrl = process.env.TWILIO_WEBHOOK_URL ||
      `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;

    const signatureCheck = verifyTwilioSignature(webhookUrl, params, signature);

    const supabase = getSupabaseAdmin();

    // Log del webhook recibido
    const payloadHash = hashPayload(params);
    const ipOrigen = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") || "unknown";

    await supabase.from("webhook_logs").insert({
      proveedor: "twilio",
      evento_tipo: messageStatus,
      payload_hash: payloadHash,
      payload_raw: params,
      firma_valida: signatureCheck.valid,
      firma_error: signatureCheck.error,
      ip_origen: ipOrigen,
      user_agent: request.headers.get("user-agent"),
    });

    // Si la firma es inválida y está configurada la verificación, rechazar
    if (!signatureCheck.valid && process.env.TWILIO_AUTH_TOKEN) {
      console.warn("[Twilio Webhook] Firma inválida:", signatureCheck.error);
      return new NextResponse("<Response></Response>", {
        status: 401,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Buscar la notificación por el número de teléfono
    // Primero buscar en eventos para encontrar el messageSid
    const { data: evento } = await supabase
      .from("eventos")
      .select("notificacion_id")
      .eq("tipo", "sms_enviado")
      .contains("metadata", { message_sid: messageSid })
      .single();

    let notificacionId = evento?.notificacion_id;

    // Si no encontramos por evento, buscar por teléfono del empleado
    if (!notificacionId && to) {
      // Normalizar el teléfono para búsqueda
      const telefonoNormalizado = to.replace(/^\+549?/, "").replace(/^\+54/, "");

      const { data: notif } = await supabase
        .from("notificaciones")
        .select("id, empleado:empleados!inner(telefono)")
        .ilike("empleado.telefono", `%${telefonoNormalizado.slice(-8)}%`)
        .order("sms_enviado_at", { ascending: false })
        .limit(1)
        .single();

      if (notif) {
        notificacionId = notif.id;
      }
    }

    if (!notificacionId) {
      console.log("Twilio webhook: No se encontró notificación para", messageSid, to);
      // Aún así respondemos OK para que Twilio no reintente
      return NextResponse.json({ success: true, found: false });
    }

    const timestamp = new Date().toISOString();

    // Procesar según estado
    switch (messageStatus) {
      case "delivered":
        // Guardar twilio_message_sid para reconciliación
        await supabase
          .from("notificaciones")
          .update({
            sms_entregado_at: timestamp,
            twilio_message_sid: messageSid,
          })
          .eq("id", notificacionId);

        await supabase.from("eventos").insert({
          notificacion_id: notificacionId,
          tipo: "sms_entregado",
          metadata: { timestamp, message_sid: messageSid },
        });
        break;

      case "undelivered":
      case "failed":
        const descripcionError = errorCode
          ? obtenerDescripcionError(errorCode)
          : errorMessage || "Error desconocido";

        await supabase
          .from("notificaciones")
          .update({
            sms_fallido: true,
            sms_error_mensaje: descripcionError,
            // Si el SMS falla y no hubo email exitoso, marcar alerta
            semaforo: "alerta",
            requiere_notificacion_fisica: true,
          })
          .eq("id", notificacionId);

        await supabase.from("eventos").insert({
          notificacion_id: notificacionId,
          tipo: "sms_fallido",
          metadata: {
            timestamp,
            message_sid: messageSid,
            error_code: errorCode,
            error_message: errorMessage,
            descripcion: descripcionError,
          },
        });

        // Notificar al empleador
        console.log(`ALERTA: SMS fallido para notificación ${notificacionId}. Error: ${descripcionError}`);
        break;

      case "sent":
        await supabase.from("eventos").insert({
          notificacion_id: notificacionId,
          tipo: "sms_en_transito",
          metadata: { timestamp, message_sid: messageSid },
        });
        break;
    }

    // Twilio espera un TwiML vacío o un 200 OK
    return new NextResponse("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });

  } catch (error) {
    console.error("Error en webhook Twilio:", error);
    // Responder OK para evitar reintentos
    return new NextResponse("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

// GET para verificación
export async function GET() {
  return NextResponse.json({
    status: "ok",
    webhook: "twilio",
    timestamp: new Date().toISOString(),
  });
}
