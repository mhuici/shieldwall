import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Buscar convenio por token
    const { data: convenio, error } = await supabaseAdmin
      .from("convenios_domicilio")
      .select("id, estado, token_expira_at, firma_checkbox_at")
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

    // Si ya aceptó, devolver éxito
    if (convenio.firma_checkbox_at) {
      return NextResponse.json({
        success: true,
        mensaje: "Términos ya aceptados previamente",
        ya_aceptado: true,
      });
    }

    // Actualizar convenio
    const ahora = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from("convenios_domicilio")
      .update({
        firma_checkbox_at: ahora,
        updated_at: ahora,
      })
      .eq("id", convenio.id);

    if (updateError) {
      console.error("Error al actualizar convenio:", updateError);
      return NextResponse.json(
        { error: "Error al registrar aceptación" },
        { status: 500 }
      );
    }

    // Registrar evento
    await supabaseAdmin.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "checkbox_aceptado",
      ip,
      user_agent: userAgent,
      metadata: { timestamp: ahora },
    });

    return NextResponse.json({
      success: true,
      mensaje: "Términos aceptados. Ahora debe verificar su identidad con el código OTP.",
      ya_aceptado: false,
    });
  } catch (error) {
    console.error("Error al aceptar términos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
