/**
 * API Route: Tracking de Apertura de Link
 *
 * POST /api/ver/[token]/tracking
 *
 * Registra cuando el empleado abre el link de la notificación.
 * Captura IP, user agent, y actualiza contadores.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase con service role para poder actualizar sin auth
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
  // Cloudflare
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // X-Forwarded-For (primer IP en la cadena)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  // X-Real-IP
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  // Fallback
  return "unknown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { userAgent = "unknown" } = body;

    const supabase = getSupabaseAdmin();

    // Buscar notificación por token de acceso o por ID (fallback)
    let notificacion;

    // Primero intentar por token_acceso
    const { data: notifByToken } = await supabase
      .from("notificaciones")
      .select("id, link_abierto_at, link_abierto_count")
      .eq("token_acceso", token)
      .single();

    if (notifByToken) {
      notificacion = notifByToken;
    } else {
      // Fallback: buscar por ID directo (para compatibilidad)
      const { data: notifById } = await supabase
        .from("notificaciones")
        .select("id, link_abierto_at, link_abierto_count")
        .eq("id", token)
        .single();

      notificacion = notifById;
    }

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    const ip = getClientIP(request);
    const timestamp = new Date().toISOString();
    const nuevoCount = (notificacion.link_abierto_count || 0) + 1;

    // Actualizar notificación
    const updateData: Record<string, unknown> = {
      link_abierto_count: nuevoCount,
    };

    // Solo actualizar link_abierto_at y semaforo si es la primera apertura
    if (!notificacion.link_abierto_at) {
      updateData.link_abierto_at = timestamp;
      updateData.link_abierto_ip = ip;
      updateData.link_abierto_user_agent = userAgent;
      updateData.semaforo = "abierto";
    }

    await supabase
      .from("notificaciones")
      .update(updateData)
      .eq("id", notificacion.id);

    // Registrar evento
    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: "link_abierto",
      ip,
      user_agent: userAgent,
      metadata: {
        timestamp,
        apertura_numero: nuevoCount,
        primera_apertura: !notificacion.link_abierto_at,
      },
    });

    return NextResponse.json({
      success: true,
      primeraApertura: !notificacion.link_abierto_at,
      aperturaNumero: nuevoCount,
    });

  } catch (error) {
    console.error("Error en tracking de apertura:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
