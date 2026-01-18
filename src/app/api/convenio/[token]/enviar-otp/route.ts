import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generarCodigoOTP, hashCodigoOTP } from "@/lib/convenio/otp";
import { sendSMS } from "@/lib/notifications/sms";

// Cliente sin autenticación para acceso público
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { canal = "sms" } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }

    // Buscar convenio por token
    const { data: convenio, error } = await supabaseAdmin
      .from("convenios_domicilio")
      .select(
        `
        id,
        estado,
        email_constituido,
        telefono_constituido,
        token_expira_at,
        firma_checkbox_at,
        empleado:empleados(nombre)
      `
      )
      .eq("token_firma", token)
      .single();

    if (error || !convenio) {
      return NextResponse.json(
        { error: "Convenio no encontrado" },
        { status: 404 }
      );
    }

    // Verificar estado
    if (convenio.estado !== "pendiente") {
      return NextResponse.json(
        { error: "Este convenio ya fue firmado o revocado" },
        { status: 400 }
      );
    }

    // Verificar que no expiró
    const expiraAt = new Date(convenio.token_expira_at);
    if (expiraAt < new Date()) {
      return NextResponse.json(
        { error: "El enlace de firma ha expirado" },
        { status: 400 }
      );
    }

    // Verificar que aceptó el checkbox primero
    if (!convenio.firma_checkbox_at) {
      return NextResponse.json(
        { error: "Debe aceptar los términos del convenio primero" },
        { status: 400 }
      );
    }

    // Verificar que tiene teléfono para SMS
    if (canal === "sms" && !convenio.telefono_constituido) {
      return NextResponse.json(
        { error: "No hay número de teléfono para enviar el código" },
        { status: 400 }
      );
    }

    // Invalidar códigos OTP anteriores
    await supabaseAdmin
      .from("codigos_otp_convenio")
      .update({ usado: true, usado_at: new Date().toISOString() })
      .eq("convenio_id", convenio.id)
      .eq("usado", false);

    // Generar nuevo código OTP
    const codigoOTP = generarCodigoOTP();
    const codigoHash = hashCodigoOTP(codigoOTP);

    // Calcular expiración (10 minutos)
    const expiraAtOTP = new Date();
    expiraAtOTP.setMinutes(expiraAtOTP.getMinutes() + 10);

    // Guardar código en base de datos
    const { error: otpError } = await supabaseAdmin
      .from("codigos_otp_convenio")
      .insert({
        convenio_id: convenio.id,
        codigo_hash: codigoHash,
        canal,
        telefono_enviado: canal === "sms" ? convenio.telefono_constituido : null,
        email_enviado: canal === "email" ? convenio.email_constituido : null,
        expira_at: expiraAtOTP.toISOString(),
      });

    if (otpError) {
      console.error("Error al guardar OTP:", otpError);
      return NextResponse.json(
        { error: "Error al generar código de verificación" },
        { status: 500 }
      );
    }

    // empleado puede venir como array o como objeto según la query de supabase
    const empleadoRaw = convenio.empleado;
    const empleadoData = Array.isArray(empleadoRaw) ? empleadoRaw[0] : empleadoRaw;

    // Enviar código por SMS
    if (canal === "sms") {
      const resultado = await sendSMS(
        convenio.telefono_constituido!,
        `NotiLegal: Tu código de verificación para firmar el convenio de domicilio electrónico es: ${codigoOTP}. Válido por 10 minutos.`
      );

      if (!resultado.success) {
        console.error("Error al enviar SMS:", resultado.error);
        return NextResponse.json(
          { error: "Error al enviar el código por SMS" },
          { status: 500 }
        );
      }
    }

    // Registrar envío de OTP
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "otp_enviado",
      ip,
      user_agent: userAgent,
      metadata: {
        canal,
        telefono: canal === "sms" ? convenio.telefono_constituido : null,
        email: canal === "email" ? convenio.email_constituido : null,
        empleado_nombre: empleadoData?.nombre,
      },
    });

    // Ofuscar teléfono para respuesta
    const telefonoOfuscado = convenio.telefono_constituido
      ? `****${convenio.telefono_constituido.slice(-4)}`
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
