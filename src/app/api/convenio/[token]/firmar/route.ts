import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verificarCodigoOTP, generarHashConvenio } from "@/lib/convenio/otp";

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
    const {
      codigo_otp,
      acepta_notificaciones_digitales,
      acepta_biometricos,
    } = body;

    if (!token || !codigo_otp) {
      return NextResponse.json(
        { error: "Token y código OTP son requeridos" },
        { status: 400 }
      );
    }

    if (!acepta_notificaciones_digitales) {
      return NextResponse.json(
        { error: "Debe aceptar las notificaciones digitales para firmar" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

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
        empleado_id,
        empresa_id,
        empleado:empleados(id, nombre, cuil),
        empresa:empresas(id, razon_social, cuit)
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

    // Verificar que aceptó el checkbox
    if (!convenio.firma_checkbox_at) {
      return NextResponse.json(
        { error: "Debe aceptar los términos del convenio primero" },
        { status: 400 }
      );
    }

    // Buscar código OTP válido
    const { data: codigosOTP, error: otpError } = await supabaseAdmin
      .from("codigos_otp_convenio")
      .select("*")
      .eq("convenio_id", convenio.id)
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
      // Marcar como usado (agotado)
      await supabaseAdmin
        .from("codigos_otp_convenio")
        .update({ usado: true, usado_at: new Date().toISOString() })
        .eq("id", codigoOTPRecord.id);

      await supabaseAdmin.from("logs_convenio").insert({
        convenio_id: convenio.id,
        accion: "otp_fallido",
        ip,
        user_agent: userAgent,
        metadata: { motivo: "max_intentos_alcanzado" },
      });

      return NextResponse.json(
        { error: "Máximo de intentos alcanzado. Solicite un nuevo código." },
        { status: 400 }
      );
    }

    // Verificar código OTP
    const codigoValido = verificarCodigoOTP(
      codigo_otp,
      codigoOTPRecord.codigo_hash
    );

    if (!codigoValido) {
      // Incrementar intentos
      await supabaseAdmin
        .from("codigos_otp_convenio")
        .update({ intentos: codigoOTPRecord.intentos + 1 })
        .eq("id", codigoOTPRecord.id);

      await supabaseAdmin.from("logs_convenio").insert({
        convenio_id: convenio.id,
        accion: "otp_fallido",
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
    await supabaseAdmin
      .from("codigos_otp_convenio")
      .update({ usado: true, usado_at: new Date().toISOString() })
      .eq("id", codigoOTPRecord.id);

    // Registrar validación exitosa
    await supabaseAdmin.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "otp_validado",
      ip,
      user_agent: userAgent,
      metadata: { canal: codigoOTPRecord.canal },
    });

    // Generar hash del convenio firmado
    // empleado y empresa pueden venir como array o como objeto según la query de supabase
    const empleadoRaw = convenio.empleado;
    const empleadoData = Array.isArray(empleadoRaw) ? empleadoRaw[0] : empleadoRaw;
    const empresaRaw = convenio.empresa;
    const empresaData = Array.isArray(empresaRaw) ? empresaRaw[0] : empresaRaw;

    const datosConvenio = {
      convenio_id: convenio.id,
      empleado_id: convenio.empleado_id,
      empresa_id: convenio.empresa_id,
      email_constituido: convenio.email_constituido,
      telefono_constituido: convenio.telefono_constituido,
      acepta_notificaciones_digitales,
      acepta_biometricos: acepta_biometricos || false,
      firma_timestamp: new Date().toISOString(),
      firma_ip: ip,
      otp_canal: codigoOTPRecord.canal,
    };

    const hashConvenio = generarHashConvenio(datosConvenio);

    // Actualizar convenio como firmado
    const ahora = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("convenios_domicilio")
      .update({
        estado: "firmado_digital",
        acepta_notificaciones_digitales,
        acepta_biometricos: acepta_biometricos || false,
        firma_otp_verificado: true,
        firma_otp_codigo_hash: codigoOTPRecord.codigo_hash,
        firma_otp_at: ahora,
        firma_ip: ip,
        firma_user_agent: userAgent,
        hash_convenio: hashConvenio,
        firmado_at: ahora,
        updated_at: ahora,
      })
      .eq("id", convenio.id);

    if (updateError) {
      console.error("Error al actualizar convenio:", updateError);
      return NextResponse.json(
        { error: "Error al firmar el convenio" },
        { status: 500 }
      );
    }

    // Registrar firma exitosa
    await supabaseAdmin.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "firmado_digital",
      ip,
      user_agent: userAgent,
      metadata: {
        hash_convenio: hashConvenio,
        acepta_notificaciones_digitales,
        acepta_biometricos,
        empleado_nombre: empleadoData?.nombre,
        empresa_nombre: empresaData?.razon_social,
      },
    });

    return NextResponse.json({
      success: true,
      mensaje: "Convenio firmado exitosamente",
      hash_convenio: hashConvenio,
      firmado_at: ahora,
      empleado_nombre: empleadoData?.nombre,
      empresa_nombre: empresaData?.razon_social,
    });
  } catch (error) {
    console.error("Error al firmar convenio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
