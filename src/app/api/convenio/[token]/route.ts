import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente sin autenticación para acceso público
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

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
        version_convenio,
        token_expira_at,
        firma_checkbox_at,
        firma_otp_verificado,
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

    // Verificar si el token expiró
    const expiraAt = new Date(convenio.token_expira_at);
    const ahora = new Date();
    const diasRestantes = Math.ceil(
      (expiraAt.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24)
    );

    const tokenValido = expiraAt > ahora && convenio.estado === "pendiente";

    // Registrar acceso al link
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    await supabaseAdmin.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "link_abierto",
      ip,
      user_agent: userAgent,
      metadata: {
        token_valido: tokenValido,
        dias_restantes: diasRestantes,
      },
    });

    // Verificar si ya se envió OTP
    const { data: otpPendiente } = await supabaseAdmin
      .from("codigos_otp_convenio")
      .select("id")
      .eq("convenio_id", convenio.id)
      .eq("usado", false)
      .gt("expira_at", new Date().toISOString())
      .limit(1);

    // empleado y empresa pueden venir como array o como objeto según la query de supabase
    const empleadoRaw = convenio.empleado;
    const empleado = Array.isArray(empleadoRaw) ? empleadoRaw[0] : empleadoRaw;
    const empresaRaw = convenio.empresa;
    const empresa = Array.isArray(empresaRaw) ? empresaRaw[0] : empresaRaw;

    return NextResponse.json({
      id: convenio.id,
      estado: convenio.estado,
      email_constituido: convenio.email_constituido,
      telefono_constituido: convenio.telefono_constituido,
      version_convenio: convenio.version_convenio,
      empleado_nombre: empleado?.nombre || "",
      empleado_cuil: empleado?.cuil || "",
      empresa_nombre: empresa?.razon_social || "",
      empresa_cuit: empresa?.cuit || "",
      token_valido: tokenValido,
      dias_para_expirar: Math.max(0, diasRestantes),
      otp_enviado: (otpPendiente?.length || 0) > 0,
      checkbox_aceptado: !!convenio.firma_checkbox_at,
      otp_verificado: convenio.firma_otp_verificado,
    });
  } catch (error) {
    console.error("Error al obtener convenio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
