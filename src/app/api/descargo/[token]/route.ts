import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET: Obtener información del descargo por token (público)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();

    // Llamar función de PostgreSQL que obtiene el descargo
    const { data, error } = await supabase.rpc("obtener_descargo_por_token", {
      p_token: token,
    });

    if (error) {
      console.error("Error obteniendo descargo:", error);
      return NextResponse.json(
        { error: "Error al obtener el descargo" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 404 }
      );
    }

    const descargo = data[0];

    // Verificar si ha expirado
    if (new Date(descargo.token_expira_at) < new Date()) {
      return NextResponse.json({
        success: true,
        descargo: {
          ...descargo,
          expirado: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      descargo: {
        ...descargo,
        expirado: false,
      },
    });
  } catch (error) {
    console.error("Error en descargo GET:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT: Guardar borrador de texto de descargo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { texto } = body;

    if (!texto) {
      return NextResponse.json(
        { error: "Se requiere texto del descargo" },
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
    const { data, error } = await supabase.rpc("guardar_borrador_descargo", {
      p_token: token,
      p_texto: texto,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Error guardando borrador:", error);
      return NextResponse.json(
        { error: "Error al guardar el borrador" },
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
    console.error("Error en descargo PUT:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
