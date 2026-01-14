/**
 * API Route: Confirmar Lectura de Notificación
 *
 * POST /api/ver/[token]/confirmar
 *
 * Registra la confirmación de lectura por parte del empleado.
 * Captura IP, user agent como prueba legal.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Obtener IP real del cliente
function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { userAgent = "unknown", checkboxAceptado = false } = body;

    const supabase = getSupabaseAdmin();

    // Buscar notificación por token_acceso o ID
    let notificacion;

    const { data: notifByToken } = await supabase
      .from("notificaciones")
      .select("id, estado, lectura_confirmada_at")
      .eq("token_acceso", token)
      .single();

    if (notifByToken) {
      notificacion = notifByToken;
    } else {
      const { data: notifById } = await supabase
        .from("notificaciones")
        .select("id, estado, lectura_confirmada_at")
        .eq("id", token)
        .single();

      notificacion = notifById;
    }

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Verificar si ya fue confirmado
    if (notificacion.lectura_confirmada_at) {
      return NextResponse.json({
        success: true,
        yaConfirmado: true,
        fechaConfirmacion: notificacion.lectura_confirmada_at,
      });
    }

    const ip = getClientIP(request);
    const timestamp = new Date().toISOString();

    // Actualizar notificación con confirmación de lectura
    const { error: updateError } = await supabase
      .from("notificaciones")
      .update({
        estado: "notificado",  // Nuevo estado: confirmó checkbox
        semaforo: "leido",
        lectura_confirmada_at: timestamp,
        lectura_checkbox_aceptado: checkboxAceptado,
        lectura_ip: ip,
        lectura_user_agent: userAgent,
      })
      .eq("id", notificacion.id);

    if (updateError) {
      console.error("Error actualizando notificación:", updateError);
      return NextResponse.json({ error: "Error al guardar confirmación" }, { status: 500 });
    }

    // Registrar evento de confirmación con declaración jurada
    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: "lectura_confirmada_checkbox",
      ip,
      user_agent: userAgent,
      metadata: {
        timestamp,
        metodo: "checkbox_declaracion_jurada",
        checkbox_aceptado: checkboxAceptado,
        texto_legal: "Declaro bajo juramento haber accedido personalmente, leído íntegramente y comprender el plazo de 30 días para impugnación según Ley 27.742",
      },
    });

    return NextResponse.json({
      success: true,
      yaConfirmado: false,
      fechaConfirmacion: timestamp,
      ip,
    });

  } catch (error) {
    console.error("Error confirmando lectura:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
