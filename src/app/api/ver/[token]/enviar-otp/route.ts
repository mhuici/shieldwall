/**
 * API Route: Enviar OTP para Validación de Identidad
 *
 * POST /api/ver/[token]/enviar-otp
 *
 * Envía un código OTP al teléfono del empleado como segundo factor de autenticación.
 * Requisito: El CUIL ya debe estar validado.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendSMS } from "@/lib/notifications/sms";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function generarCodigoOTP(): string {
  const randomBytes = crypto.randomBytes(4);
  const randomNum = randomBytes.readUInt32BE(0);
  return (randomNum % 1000000).toString().padStart(6, "0");
}

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
    const body = await request.json().catch(() => ({}));
    const { canal = "sms" } = body;

    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Buscar notificación
    const { data: notificacion, error: notifError } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empleado_id,
        identidad_validada_at,
        otp_validado,
        empleado:empleados(id, nombre, telefono, email)
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

    // Si OTP ya fue validado, no reenviar
    if (notificacion.otp_validado) {
      return NextResponse.json({
        success: true,
        mensaje: "Identidad ya verificada",
        ya_verificado: true,
      });
    }

    const empleadoData = notificacion.empleado as unknown as
      | { id: string; nombre: string; telefono?: string; email?: string }[]
      | { id: string; nombre: string; telefono?: string; email?: string };
    const empleado = Array.isArray(empleadoData) ? empleadoData[0] : empleadoData;

    // Verificar que tiene teléfono
    if (canal === "sms" && !empleado.telefono) {
      return NextResponse.json(
        { error: "No hay número de teléfono registrado para este empleado" },
        { status: 400 }
      );
    }

    // Invalidar códigos OTP anteriores
    await supabase
      .from("codigos_otp_notificacion")
      .update({ usado: true, usado_at: new Date().toISOString() })
      .eq("notificacion_id", notificacion.id)
      .eq("usado", false);

    // Generar nuevo código OTP
    const codigoOTP = generarCodigoOTP();
    const codigoHash = hashCodigoOTP(codigoOTP);

    // Calcular expiración (10 minutos)
    const expiraAt = new Date();
    expiraAt.setMinutes(expiraAt.getMinutes() + 10);

    // Guardar código en base de datos
    const { error: otpError } = await supabase
      .from("codigos_otp_notificacion")
      .insert({
        notificacion_id: notificacion.id,
        empleado_id: empleado.id,
        codigo_hash: codigoHash,
        canal,
        telefono_enviado: canal === "sms" ? empleado.telefono : null,
        email_enviado: canal === "email" ? empleado.email : null,
        expira_at: expiraAt.toISOString(),
      });

    if (otpError) {
      console.error("Error al guardar OTP:", otpError);
      return NextResponse.json(
        { error: "Error al generar código de verificación" },
        { status: 500 }
      );
    }

    // Enviar código por SMS
    if (canal === "sms") {
      const resultado = await sendSMS(
        empleado.telefono!,
        `NotiLegal: Tu código de verificación es: ${codigoOTP}. Válido por 10 minutos. No compartas este código.`
      );

      if (!resultado.success) {
        console.error("Error al enviar SMS:", resultado.error);
        return NextResponse.json(
          { error: "Error al enviar el código por SMS" },
          { status: 500 }
        );
      }
    }

    // Actualizar notificación
    await supabase
      .from("notificaciones")
      .update({
        otp_enviado: true,
        otp_enviado_at: new Date().toISOString(),
        otp_canal: canal,
      })
      .eq("id", notificacion.id);

    // Registrar evento
    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: "otp_enviado",
      ip,
      user_agent: userAgent,
      metadata: {
        canal,
        telefono: canal === "sms" ? `****${empleado.telefono?.slice(-4)}` : null,
        empleado_nombre: empleado.nombre,
      },
    });

    // Ofuscar teléfono para respuesta
    const telefonoOfuscado = empleado.telefono
      ? `****${empleado.telefono.slice(-4)}`
      : null;

    return NextResponse.json({
      success: true,
      mensaje: `Código enviado a ${telefonoOfuscado}`,
      canal,
      telefono_ofuscado: telefonoOfuscado,
      expira_en_minutos: 10,
    });
  } catch (error) {
    console.error("Error al enviar OTP:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
