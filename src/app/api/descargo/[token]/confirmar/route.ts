import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// POST: Confirmar descargo con declaración jurada
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { checkbox_texto } = body;

    if (!checkbox_texto) {
      return NextResponse.json(
        { error: "Se requiere aceptar la declaración jurada" },
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
    const { data, error } = await supabase.rpc("confirmar_descargo", {
      p_token: token,
      p_checkbox_texto: checkbox_texto,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Error confirmando descargo:", error);
      return NextResponse.json(
        { error: "Error al confirmar el descargo" },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: data.message,
      hash: data.hash,
      decision: data.decision,
    });
  } catch (error) {
    console.error("Error en confirmar descargo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
