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

    const messageSid = formData.get("MessageSid") as string;
    const messageStatus = formData.get("MessageStatus") as TwilioStatus;
    const to = formData.get("To") as string;
    const errorCode = formData.get("ErrorCode") as string | null;
    const errorMessage = formData.get("ErrorMessage") as string | null;

    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

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
        await supabase
          .from("notificaciones")
          .update({ sms_entregado_at: timestamp })
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
