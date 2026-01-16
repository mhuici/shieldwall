import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { MESES_BITACORA_CONTEXTO } from "@/lib/types";

interface RouteParams {
  params: Promise<{ empleadoId: string }>;
}

// GET: Obtener resumen de bitácora de un empleado para mostrar en sanción
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { empleadoId } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener empresa del usuario
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el empleado pertenece a la empresa
    const { data: empleado } = await supabase
      .from("empleados")
      .select("id, nombre")
      .eq("id", empleadoId)
      .eq("empresa_id", empresa.id)
      .single();

    if (!empleado) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    // Obtener parámetro de meses (default: 6)
    const { searchParams } = new URL(request.url);
    const meses = parseInt(
      searchParams.get("meses") || String(MESES_BITACORA_CONTEXTO)
    );

    // Calcular fecha de corte
    const fechaCorte = new Date();
    fechaCorte.setMonth(fechaCorte.getMonth() - meses);
    const fechaCorteStr = fechaCorte.toISOString().split("T")[0];

    // Obtener novedades del período
    const { data: novedades, error } = await supabase
      .from("bitacora_novedades")
      .select("*")
      .eq("empleado_id", empleadoId)
      .eq("archivado", false)
      .gte("fecha_hecho", fechaCorteStr)
      .order("fecha_hecho", { ascending: false });

    if (error) {
      console.error("Error obteniendo bitácora:", error);
      return NextResponse.json(
        { error: "Error al obtener la bitácora" },
        { status: 500 }
      );
    }

    // Calcular estadísticas
    const totalNovedades = novedades?.length || 0;

    // Agrupar por tipo
    const novedadesPorTipo: Record<string, number> = {};
    novedades?.forEach((n) => {
      novedadesPorTipo[n.tipo] = (novedadesPorTipo[n.tipo] || 0) + 1;
    });

    // Agrupar por categoría
    const novedadesPorCategoria: Record<string, number> = {};
    novedades?.forEach((n) => {
      const cat = n.categoria || "sin_categoria";
      novedadesPorCategoria[cat] = (novedadesPorCategoria[cat] || 0) + 1;
    });

    // Fechas primera y última
    const primeraFecha = novedades?.length
      ? novedades[novedades.length - 1].fecha_hecho
      : null;
    const ultimaFecha = novedades?.length ? novedades[0].fecha_hecho : null;

    // Armar respuesta
    const resumen = {
      total_novedades: totalNovedades,
      novedades_por_tipo: novedadesPorTipo,
      novedades_por_categoria: novedadesPorCategoria,
      primera_novedad: primeraFecha,
      ultima_novedad: ultimaFecha,
      meses_analizados: meses,
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre,
      },
    };

    // Incluir las novedades detalladas (últimas 20)
    const novedadesDetalle = novedades?.slice(0, 20).map((n) => ({
      id: n.id,
      tipo: n.tipo,
      categoria: n.categoria,
      titulo: n.titulo,
      descripcion: n.descripcion,
      fecha_hecho: n.fecha_hecho,
      hora_hecho: n.hora_hecho,
      empleado_actitud: n.empleado_actitud,
      hash_sha256: n.hash_sha256,
      created_at: n.created_at,
    }));

    return NextResponse.json({
      success: true,
      resumen,
      novedades: novedadesDetalle,
    });
  } catch (error) {
    console.error("Error en resumen de bitácora:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
