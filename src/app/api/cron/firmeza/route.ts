/**
 * Cron Job: Firmeza Automática
 *
 * GET /api/cron/firmeza
 *
 * Marca como "firme" las notificaciones que:
 * - Fueron leídas hace más de 30 días
 * - No fueron impugnadas
 *
 * Según la reforma laboral, las sanciones no impugnadas
 * en 30 días quedan firmes con valor de prueba plena.
 *
 * Se recomienda ejecutar este cron diariamente.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Verificar clave de cron para seguridad
const CRON_SECRET = process.env.CRON_SECRET;

// Cliente Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización (Vercel Cron o clave secreta)
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
    const hace30Dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar notificaciones candidatas a firmeza:
    // - Estado "leido"
    // - lectura_confirmada_at hace más de 30 días
    // - No impugnadas
    const { data: candidatas, error: fetchError } = await supabase
      .from("notificaciones")
      .select("id, empleado_id, tipo, motivo, lectura_confirmada_at")
      .eq("estado", "leido")
      .lt("lectura_confirmada_at", hace30Dias.toISOString())
      .is("fecha_impugnacion", null);

    if (fetchError) {
      console.error("Error buscando candidatas:", fetchError);
      throw fetchError;
    }

    if (!candidatas || candidatas.length === 0) {
      return NextResponse.json({
        success: true,
        procesadas: 0,
        mensaje: "No hay notificaciones pendientes de firmeza",
      });
    }

    const resultados = {
      procesadas: 0,
      firmes: [] as string[],
      errores: [] as { id: string; error: string }[],
    };

    for (const notif of candidatas) {
      try {
        const timestampFirmeza = new Date().toISOString();

        // Actualizar a estado firme
        const { error: updateError } = await supabase
          .from("notificaciones")
          .update({
            estado: "firme",
            semaforo: "firme",
            fecha_firmeza: timestampFirmeza,
          })
          .eq("id", notif.id);

        if (updateError) throw updateError;

        // Registrar evento
        await supabase.from("eventos").insert({
          notificacion_id: notif.id,
          tipo: "sancion_firme",
          metadata: {
            timestamp: timestampFirmeza,
            dias_desde_lectura: 30,
            automatico: true,
            fecha_lectura: notif.lectura_confirmada_at,
          },
        });

        resultados.firmes.push(notif.id);
        resultados.procesadas++;
      } catch (err) {
        resultados.errores.push({
          id: notif.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    console.log(`Cron Firmeza: ${resultados.procesadas} notificaciones marcadas como firmes`);

    return NextResponse.json({
      success: true,
      timestamp: ahora.toISOString(),
      ...resultados,
    });

  } catch (error) {
    console.error("Error en cron de firmeza:", error);
    return NextResponse.json(
      { error: "Error interno del cron" },
      { status: 500 }
    );
  }
}

// También permitir POST para compatibilidad con algunos servicios de cron
export async function POST(request: NextRequest) {
  return GET(request);
}
