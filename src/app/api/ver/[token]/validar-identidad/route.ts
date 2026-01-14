/**
 * API Route: Validar Identidad del Empleado (Gatekeeper)
 *
 * POST /api/ver/[token]/validar-identidad
 *
 * Valida que el CUIL o legajo ingresado coincida con los datos del empleado.
 * Registra el intento de validación con fines de auditoría.
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

// Normalizar CUIL para comparación
function normalizarCuil(cuil: string | null): string {
  if (!cuil) return "";
  return cuil.replace(/\D/g, "");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json().catch(() => ({}));
    const { cuil, legajo, userAgent = "unknown" } = body;

    if (!cuil && !legajo) {
      return NextResponse.json(
        { error: "Debe ingresar CUIL o legajo" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ip = getClientIP(request);
    const timestamp = new Date().toISOString();

    // Buscar notificación por token_acceso o ID
    let notificacion;

    const { data: notifByToken } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empleado_id,
        identidad_validada_at,
        link_abierto_at,
        empleado:empleados(id, cuil, legajo, nombre)
      `)
      .eq("token_acceso", token)
      .single();

    if (notifByToken) {
      notificacion = notifByToken;
    } else {
      const { data: notifById } = await supabase
        .from("notificaciones")
        .select(`
          id,
          empleado_id,
          identidad_validada_at,
          link_abierto_at,
          empleado:empleados(id, cuil, legajo, nombre)
        `)
        .eq("id", token)
        .single();

      notificacion = notifById;
    }

    if (!notificacion) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Si ya validó identidad, permitir acceso
    if (notificacion.identidad_validada_at) {
      return NextResponse.json({
        success: true,
        yaValidado: true,
        fechaValidacion: notificacion.identidad_validada_at,
      });
    }

    // Contar intentos fallidos recientes (últimas 24 horas)
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: intentosFallidos } = await supabase
      .from("eventos")
      .select("*", { count: "exact", head: true })
      .eq("notificacion_id", notificacion.id)
      .eq("tipo", "validacion_identidad_fallida")
      .gte("created_at", hace24Horas);

    // Bloquear si hay más de 10 intentos fallidos
    if (intentosFallidos && intentosFallidos >= 10) {
      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "validacion_identidad_bloqueada",
        ip,
        user_agent: userAgent,
        metadata: {
          timestamp,
          intentos_fallidos: intentosFallidos,
          cuil_ingresado: cuil,
          legajo_ingresado: legajo,
        },
      });

      return NextResponse.json(
        { error: "Demasiados intentos fallidos", bloqueado: true },
        { status: 429 }
      );
    }

    // Supabase returns array for relations, get first element
    const empleadoData = notificacion.empleado as unknown as {
      id: string;
      cuil: string;
      legajo?: string;
      nombre: string;
    }[] | { id: string; cuil: string; legajo?: string; nombre: string };

    const empleado = Array.isArray(empleadoData) ? empleadoData[0] : empleadoData;

    // Validar CUIL o legajo
    const cuilNormalizado = normalizarCuil(cuil);
    const cuilEmpleado = normalizarCuil(empleado.cuil);

    let validacionExitosa = false;

    if (cuilNormalizado && cuilNormalizado === cuilEmpleado) {
      validacionExitosa = true;
    } else if (legajo && empleado.legajo && legajo.trim().toLowerCase() === empleado.legajo.trim().toLowerCase()) {
      validacionExitosa = true;
    }

    if (!validacionExitosa) {
      // Registrar intento fallido
      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "validacion_identidad_fallida",
        ip,
        user_agent: userAgent,
        metadata: {
          timestamp,
          cuil_ingresado: cuil,
          legajo_ingresado: legajo,
          intento_numero: (intentosFallidos || 0) + 1,
        },
      });

      return NextResponse.json(
        { error: "Los datos ingresados no coinciden con los registrados" },
        { status: 401 }
      );
    }

    // Validación exitosa - actualizar notificación
    await supabase
      .from("notificaciones")
      .update({
        identidad_validada_at: timestamp,
        identidad_cuil_ingresado: cuilNormalizado || null,
        identidad_ip: ip,
        identidad_user_agent: userAgent,
        estado: "validado",
        semaforo: "abierto",
        link_abierto_at: notificacion.link_abierto_at || timestamp,
      })
      .eq("id", notificacion.id);

    // Registrar evento exitoso
    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: "validacion_identidad_exitosa",
      ip,
      user_agent: userAgent,
      metadata: {
        timestamp,
        metodo: cuil ? "cuil" : "legajo",
        cuil_ingresado: cuilNormalizado,
        legajo_ingresado: legajo,
      },
    });

    return NextResponse.json({
      success: true,
      yaValidado: false,
      fechaValidacion: timestamp,
      empleadoNombre: empleado.nombre,
    });

  } catch (error) {
    console.error("Error validando identidad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
