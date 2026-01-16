import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { DecisionDescargo } from "@/lib/types";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// POST: Registrar decisión del empleado (ejercer o declinar)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const supabase = await createClient();
    const body = await request.json();
    const { decision } = body as { decision: DecisionDescargo };

    // Validar decisión
    if (!decision || !["ejercer_descargo", "declinar_descargo"].includes(decision)) {
      return NextResponse.json(
        { error: "Decisión inválida. Debe ser 'ejercer_descargo' o 'declinar_descargo'" },
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
    const { data, error } = await supabase.rpc("registrar_decision_descargo", {
      p_token: token,
      p_decision: decision,
      p_ip: ip,
      p_user_agent: userAgent,
    });

    if (error) {
      console.error("Error registrando decisión:", error);
      return NextResponse.json(
        { error: "Error al registrar la decisión" },
        { status: 500 }
      );
    }

    if (!data.success) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      decision: data.decision,
    });
  } catch (error) {
    console.error("Error en decision descargo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
