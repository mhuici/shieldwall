/**
 * Cron Job: SMS Recordatorio Automático
 *
 * GET /api/cron/sms-recordatorio
 *
 * Envía SMS de recordatorio a notificaciones que:
 * - Fueron enviadas hace más de 24 horas
 * - El email NO fue abierto aún
 * - NO se envió SMS todavía
 * - El empleado tiene teléfono registrado
 *
 * Se recomienda ejecutar cada 4-6 horas.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enviarSMSRecordatorio } from "@/lib/notifications";

// Verificar clave de cron
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
    const hace24Horas = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Buscar notificaciones candidatas para SMS:
    // - email_enviado_at hace más de 24 horas
    // - Sin link_abierto_at (empleado no abrió el link)
    // - Sin sms_enviado_at (no se envió SMS todavía)
    // - No muy antiguas (menos de 7 días)
    const { data: candidatas, error: fetchError } = await supabase
      .from("notificaciones")
      .select(`
        id,
        tipo,
        token_acceso,
        fecha_vencimiento,
        empleado:empleados(id, nombre, telefono),
        empresa:empresas(razon_social)
      `)
      .lt("email_enviado_at", hace24Horas.toISOString())
      .gt("email_enviado_at", hace7Dias.toISOString())
      .is("link_abierto_at", null)
      .is("sms_enviado_at", null)
      .in("estado", ["enviado", "abierto"]);

    if (fetchError) {
      console.error("Error buscando candidatas:", fetchError);
      throw fetchError;
    }

    if (!candidatas || candidatas.length === 0) {
      return NextResponse.json({
        success: true,
        procesadas: 0,
        mensaje: "No hay notificaciones pendientes de SMS",
      });
    }

    const resultados = {
      procesadas: 0,
      enviados: [] as string[],
      sinTelefono: [] as string[],
      errores: [] as { id: string; error: string }[],
    };

    for (const notif of candidatas) {
      const empleado = notif.empleado as unknown as {
        id: string;
        nombre: string;
        telefono: string | null;
      } | null;

      const empresa = notif.empresa as unknown as {
        razon_social: string;
      } | null;

      // Verificar que el empleado tenga teléfono
      if (!empleado?.telefono) {
        resultados.sinTelefono.push(notif.id);
        continue;
      }

      try {
        // Calcular días restantes
        const fechaVencimiento = notif.fecha_vencimiento
          ? new Date(notif.fecha_vencimiento)
          : null;
        const diasRestantes = fechaVencimiento
          ? Math.ceil((fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
          : 30;

        const linkLectura = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ver/${notif.token_acceso || notif.id}`;

        // Enviar SMS
        const resultado = await enviarSMSRecordatorio(
          empleado.telefono,
          empleado.nombre,
          diasRestantes,
          linkLectura
        );

        if (resultado.success) {
          // Actualizar notificación
          await supabase
            .from("notificaciones")
            .update({
              sms_enviado_at: new Date().toISOString(),
            })
            .eq("id", notif.id);

          // Registrar evento
          await supabase.from("eventos").insert({
            notificacion_id: notif.id,
            tipo: "sms_enviado",
            metadata: {
              message_sid: resultado.messageSid,
              destinatario: empleado.telefono,
              tipo: "recordatorio_automatico",
              timestamp: new Date().toISOString(),
            },
          });

          resultados.enviados.push(notif.id);
        } else {
          resultados.errores.push({
            id: notif.id,
            error: resultado.error || "Error desconocido",
          });
        }

        resultados.procesadas++;
      } catch (err) {
        resultados.errores.push({
          id: notif.id,
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
    }

    console.log(`Cron SMS: ${resultados.enviados.length} SMS enviados de ${resultados.procesadas} procesadas`);

    return NextResponse.json({
      success: true,
      timestamp: ahora.toISOString(),
      ...resultados,
    });

  } catch (error) {
    console.error("Error en cron de SMS:", error);
    return NextResponse.json(
      { error: "Error interno del cron" },
      { status: 500 }
    );
  }
}

// También permitir POST
export async function POST(request: NextRequest) {
  return GET(request);
}
