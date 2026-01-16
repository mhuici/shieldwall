import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ notificacionId: string }>;
}

// POST: Guardar análisis del empleador sobre el descargo
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Obtener body
    const body = await request.json();
    const { contiene_admision, contiene_contradiccion, notas_empleador } = body;

    // Actualizar descargo
    const { error: updateError } = await supabase
      .from("descargos")
      .update({
        contiene_admision,
        contiene_contradiccion,
        notas_empleador,
        analizado_at: new Date().toISOString(),
        analizado_por: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("notificacion_id", notificacionId)
      .eq("empresa_id", empresa.id);

    if (updateError) {
      console.error("Error actualizando análisis:", updateError);
      return NextResponse.json(
        { error: "Error al guardar el análisis" },
        { status: 500 }
      );
    }

    // Registrar evento
    const { data: descargo } = await supabase
      .from("descargos")
      .select("id")
      .eq("notificacion_id", notificacionId)
      .single();

    if (descargo) {
      await supabase.from("eventos_descargo").insert({
        descargo_id: descargo.id,
        tipo: "analizado",
        metadata: {
          contiene_admision,
          contiene_contradiccion,
          tiene_notas: !!notas_empleador,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Análisis guardado correctamente",
    });
  } catch (error) {
    console.error("Error guardando análisis:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
