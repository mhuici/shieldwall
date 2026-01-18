/**
 * API Route: Verificar OTP para Validación de Identidad
 *
 * POST /api/ver/[token]/verificar-otp
 *
 * Verifica el código OTP ingresado por el empleado.
 * Una vez verificado, el empleado puede ver la notificación.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function hashCodigoOTP(codigo: string): string {
  return crypto.createHash("sha256").update(codigo).digest("hex");
}

function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { codigo_otp } = body;

    if (!codigo_otp || codigo_otp.length !== 6) {
      return NextResponse.json(
        { error: "Código OTP inválido" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    // Buscar notificación
    const { data: notificacion, error: notifError } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empleado_id,
        identidad_validada_at,
        otp_validado,
        otp_intentos,
        empleado:empleados(id, nombre)
      `)
      .or(`token_acceso.eq.${token},id.eq.${token}`)
      .single();

    if (notifError || !notificacion) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que CUIL ya fue validado
    if (!notificacion.identidad_validada_at) {
      return NextResponse.json(
        { error: "Debe validar su CUIL primero" },
        { status: 400 }
      );
    }

    // Si OTP ya fue validado, permitir acceso
    if (notificacion.otp_validado) {
      return NextResponse.json({
        success: true,
        mensaje: "Identidad ya verificada",
        ya_verificado: true,
      });
    }

    // Buscar código OTP válido
    const { data: codigosOTP, error: otpError } = await supabase
      .from("codigos_otp_notificacion")
      .select("*")
      .eq("notificacion_id", notificacion.id)
      .eq("usado", false)
      .gt("expira_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpError || !codigosOTP || codigosOTP.length === 0) {
      return NextResponse.json(
        { error: "No hay código de verificación activo. Solicite uno nuevo." },
        { status: 400 }
      );
    }

    const codigoOTPRecord = codigosOTP[0];

    // Verificar intentos
    if (codigoOTPRecord.intentos >= codigoOTPRecord.max_intentos) {
      await supabase
        .from("codigos_otp_notificacion")
        .update({ usado: true, usado_at: timestamp })
        .eq("id", codigoOTPRecord.id);

      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "otp_max_intentos",
        ip,
        user_agent: userAgent,
        metadata: { intentos: codigoOTPRecord.intentos },
      });

      return NextResponse.json(
        { error: "Máximo de intentos alcanzado. Solicite un nuevo código." },
        { status: 400 }
      );
    }

    // Verificar código OTP
    const codigoHash = hashCodigoOTP(codigo_otp);
    const codigoValido = codigoHash === codigoOTPRecord.codigo_hash;

    if (!codigoValido) {
      // Incrementar intentos
      await supabase
        .from("codigos_otp_notificacion")
        .update({ intentos: codigoOTPRecord.intentos + 1 })
        .eq("id", codigoOTPRecord.id);

      await supabase
        .from("notificaciones")
        .update({ otp_intentos: (notificacion.otp_intentos || 0) + 1 })
        .eq("id", notificacion.id);

      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "otp_fallido",
        ip,
        user_agent: userAgent,
        metadata: {
          intentos: codigoOTPRecord.intentos + 1,
          max_intentos: codigoOTPRecord.max_intentos,
        },
      });

      const intentosRestantes =
        codigoOTPRecord.max_intentos - (codigoOTPRecord.intentos + 1);
      return NextResponse.json(
        {
          error: `Código incorrecto. ${intentosRestantes > 0 ? `Le quedan ${intentosRestantes} intento(s).` : "Solicite un nuevo código."}`,
        },
        { status: 400 }
      );
    }

    // Código válido - Marcar OTP como usado
    await supabase
      .from("codigos_otp_notificacion")
      .update({ usado: true, usado_at: timestamp })
      .eq("id", codigoOTPRecord.id);

    // Actualizar notificación
    await supabase
      .from("notificaciones")
      .update({
        otp_validado: true,
        otp_validado_at: timestamp,
      })
      .eq("id", notificacion.id);

    // Registrar evento exitoso
    const empleadoData = notificacion.empleado as unknown as
      | { id: string; nombre: string }[]
      | { id: string; nombre: string };
    const empleado = Array.isArray(empleadoData) ? empleadoData[0] : empleadoData;

    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: "otp_verificado",
      ip,
      user_agent: userAgent,
      metadata: {
        timestamp,
        canal: codigoOTPRecord.canal,
        empleado_nombre: empleado?.nombre,
      },
    });

    return NextResponse.json({
      success: true,
      mensaje: "Identidad verificada exitosamente",
      verificado_at: timestamp,
    });
  } catch (error) {
    console.error("Error al verificar OTP:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
