/**
 * API Route: /api/biometria/contingencia
 *
 * POST - Registrar activación de contingencia (biometría fallida, usar OTP)
 * PATCH - Actualizar resultado de verificación por contingencia
 *
 * Registra en la tabla verificaciones_biometricas con resultado_final = 'CONTINGENCIA'
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificacionId, empleadoId, motivo, userAgent } = body;

    if (!notificacionId || !empleadoId) {
      return NextResponse.json(
        { error: "notificacionId y empleadoId son requeridos" },
        { status: 400 }
      );
    }

    // Obtener IP del cliente
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "unknown";

    // Verificar si ya existe un registro de contingencia para esta notificación
    const { data: existing } = await supabase
      .from("verificaciones_biometricas")
      .select("id")
      .eq("notificacion_id", notificacionId)
      .eq("empleado_id", empleadoId)
      .eq("contingencia_activada", true)
      .single();

    if (existing) {
      // Ya existe, solo retornar OK
      return NextResponse.json({ ok: true, id: existing.id });
    }

    // Detectar capacidades del dispositivo basado en el motivo
    const esProblemaCamera = motivo?.toLowerCase().includes("cámara") ||
                             motivo?.toLowerCase().includes("camera");
    const esProblemaConexion = motivo?.toLowerCase().includes("conexión") ||
                               motivo?.toLowerCase().includes("connection") ||
                               motivo?.toLowerCase().includes("timeout");

    // Crear registro de verificación biométrica en modo contingencia
    const { data, error } = await supabase
      .from("verificaciones_biometricas")
      .insert({
        notificacion_id: notificacionId,
        empleado_id: empleadoId,
        contingencia_activada: true,
        contingencia_motivo: motivo || "Problema técnico no especificado",
        capacidad_camara_frontal: !esProblemaCamera,
        capacidad_conexion_suficiente: !esProblemaConexion,
        capacidad_sdk_inicializado: false,
        resultado_final: "CONTINGENCIA",
        dispositivo: userAgent?.substring(0, 255) || null,
        ip_verificacion: ip,
        user_agent: userAgent || null,
        costo_total_usd: 0, // Sin costo AWS en contingencia
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Contingencia] Error registrando:", error);
      return NextResponse.json(
        { error: "Error registrando contingencia" },
        { status: 500 }
      );
    }

    // Registrar evento en bitácora
    await supabase.from("eventos").insert({
      notificacion_id: notificacionId,
      tipo: "biometria_contingencia",
      titulo: "Contingencia biométrica activada",
      detalle: `Motivo: ${motivo || "Problema técnico"}. Verificación por SMS habilitada.`,
      ip,
      user_agent: userAgent,
    });

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("[Contingencia] Error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { notificacionId, empleadoId, resultado } = body;

    if (!notificacionId || !empleadoId) {
      return NextResponse.json(
        { error: "notificacionId y empleadoId son requeridos" },
        { status: 400 }
      );
    }

    // Actualizar el registro de contingencia existente
    const { data, error } = await supabase
      .from("verificaciones_biometricas")
      .update({
        resultado_final: resultado === "EXITOSO" ? "CONTINGENCIA" : "FALLIDO",
      })
      .eq("notificacion_id", notificacionId)
      .eq("empleado_id", empleadoId)
      .eq("contingencia_activada", true)
      .select("id")
      .single();

    if (error) {
      console.error("[Contingencia] Error actualizando:", error);
      // No es crítico, continuar
    }

    // Si fue exitoso, actualizar la notificación
    if (resultado === "EXITOSO") {
      await supabase
        .from("notificaciones")
        .update({
          biometria_completada: true,
          verificacion_biometrica_id: data?.id,
        })
        .eq("id", notificacionId);

      // Registrar evento de éxito
      await supabase.from("eventos").insert({
        notificacion_id: notificacionId,
        tipo: "biometria_verificacion",
        titulo: "Verificación por contingencia exitosa",
        detalle: "Identidad verificada mediante OTP por SMS (modo contingencia)",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Contingencia] Error:", err);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
