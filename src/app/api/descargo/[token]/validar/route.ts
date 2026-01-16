import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// POST: Validar identidad del empleado con CUIL
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { cuil } = body;

    if (!cuil) {
      return NextResponse.json(
        { error: "Se requiere el CUIL" },
        { status: 400 }
      );
    }

    // Obtener IP y user-agent
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const userAgent = request.headers.get("user-agent") || null;

    // Llamar función de PostgreSQL
    const { data, error } = await supabase.rpc("validar_identidad_descargo", {
      p_token: token,
      p_cuil: cuil,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Error validando identidad:", error);
      return NextResponse.json(
        { error: "Error al validar identidad" },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: data.message,
    });
  } catch (error) {
    console.error("Error en validar descargo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
