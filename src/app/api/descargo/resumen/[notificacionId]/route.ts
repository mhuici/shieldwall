import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ notificacionId: string }>;
}

// GET: Obtener resumen del descargo para el empleador
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { notificacionId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verificar que la notificación pertenece a la empresa del usuario
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Verificar que la notificación existe y pertenece a la empresa
    const { data: notificacion } = await supabase
      .from("notificaciones")
      .select("id")
      .eq("id", notificacionId)
      .eq("empresa_id", empresa.id)
      .single();

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Llamar función de PostgreSQL
    const { data, error } = await supabase.rpc("obtener_descargo_completo", {
      p_notificacion_id: notificacionId,
    });

    if (error) {
      console.error("Error obteniendo descargo:", error);
      return NextResponse.json(
        { error: "Error al obtener el descargo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      descargo: data,
    });
  } catch (error) {
    console.error("Error en descargo resumen:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
