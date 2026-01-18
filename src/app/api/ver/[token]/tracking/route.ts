/**
 * API Route: Tracking de Lectura
 *
 * POST /api/ver/[token]/tracking
 *
 * Registra eventos de lectura: apertura de link, scroll, tiempo de lectura.
 * Captura IP, user agent, y actualiza métricas.
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

interface TrackingBody {
  userAgent?: string;
  evento_tipo?: "scroll" | "tiempo" | "complete" | "link_abierto";
  scroll_porcentaje?: number;
  tiempo_segundos?: number;
  scroll_completado?: boolean;
  tiempo_completado?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: TrackingBody = await request.json().catch(() => ({}));
    const {
      userAgent = "unknown",
      evento_tipo = "link_abierto",
      scroll_porcentaje,
      tiempo_segundos,
      scroll_completado,
      tiempo_completado,
    } = body;

    const supabase = getSupabaseAdmin();

    // Buscar notificación por token de acceso o por ID (fallback)
    let notificacion;

    // Primero intentar por token_acceso
    const { data: notifByToken } = await supabase
      .from("notificaciones")
      .select("id, link_abierto_at, link_abierto_count, scroll_porcentaje_maximo, tiempo_lectura_segundos")
      .eq("token_acceso", token)
      .single();

    if (notifByToken) {
      notificacion = notifByToken;
    } else {
      // Fallback: buscar por ID directo (para compatibilidad)
      const { data: notifById } = await supabase
        .from("notificaciones")
        .select("id, link_abierto_at, link_abierto_count, scroll_porcentaje_maximo, tiempo_lectura_segundos")
        .eq("id", token)
        .single();

      notificacion = notifById;
    }

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    const ip = getClientIP(request);
    const timestamp = new Date().toISOString();

    // Manejar diferentes tipos de eventos
    if (evento_tipo === "link_abierto" || !evento_tipo) {
      // Evento de apertura de link (comportamiento original)
      const nuevoCount = (notificacion.link_abierto_count || 0) + 1;

      const updateData: Record<string, unknown> = {
        link_abierto_count: nuevoCount,
      };

      // Solo actualizar link_abierto_at y semaforo si es la primera apertura
      if (!notificacion.link_abierto_at) {
        updateData.link_abierto_at = timestamp;
        updateData.link_abierto_ip = ip;
        updateData.link_abierto_user_agent = userAgent;
        updateData.semaforo = "abierto";
        updateData.tiempo_lectura_inicio_at = timestamp;
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
    }

    // Eventos de scroll/tiempo
    if (evento_tipo === "scroll" || evento_tipo === "tiempo" || evento_tipo === "complete") {
      const updateData: Record<string, unknown> = {};

      // Actualizar scroll si es mayor al máximo registrado
      if (scroll_porcentaje !== undefined) {
        const nuevoMaximo = Math.max(
          scroll_porcentaje,
          notificacion.scroll_porcentaje_maximo || 0
        );
        if (nuevoMaximo > (notificacion.scroll_porcentaje_maximo || 0)) {
          updateData.scroll_porcentaje_maximo = nuevoMaximo;
        }
      }

      // Actualizar scroll_completado
      if (scroll_completado === true) {
        updateData.scroll_completado = true;
      }

      // Actualizar tiempo de lectura
      if (tiempo_segundos !== undefined && tiempo_segundos > (notificacion.tiempo_lectura_segundos || 0)) {
        updateData.tiempo_lectura_segundos = tiempo_segundos;
      }

      // Solo actualizar si hay cambios
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("notificaciones")
          .update(updateData)
          .eq("id", notificacion.id);
      }

      // Registrar en tracking_lectura
      await supabase.from("tracking_lectura").insert({
        notificacion_id: notificacion.id,
        evento_tipo,
        scroll_porcentaje,
        tiempo_acumulado_segundos: tiempo_segundos,
        timestamp_cliente: timestamp,
      });

      return NextResponse.json({
        success: true,
        evento: evento_tipo,
        scroll_porcentaje_maximo: updateData.scroll_porcentaje_maximo || notificacion.scroll_porcentaje_maximo,
        tiempo_lectura_segundos: updateData.tiempo_lectura_segundos || notificacion.tiempo_lectura_segundos,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error en tracking de lectura:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
