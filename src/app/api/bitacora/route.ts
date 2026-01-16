import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { SHA256 } from "crypto-js";
import type {
  TipoNovedad,
  CategoriaNovedad,
  ActitudEmpleado,
} from "@/lib/types";

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

// POST: Crear nueva novedad en la bitácora
export async function POST(request: NextRequest) {
  try {
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

    // Parsear body
    const body = await request.json();
    const {
      empleado_id,
      tipo,
      categoria,
      titulo,
      descripcion,
      fecha_hecho,
      hora_hecho,
      lugar,
      testigos_presentes,
      empleado_respuesta,
      empleado_actitud,
    } = body as {
      empleado_id: string;
      tipo: TipoNovedad;
      categoria?: CategoriaNovedad;
      titulo: string;
      descripcion: string;
      fecha_hecho: string;
      hora_hecho?: string;
      lugar?: string;
      testigos_presentes?: string[];
      empleado_respuesta?: string;
      empleado_actitud?: ActitudEmpleado;
    };

    // Validaciones
    if (!empleado_id) {
      return NextResponse.json(
        { error: "Se requiere empleado_id" },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { error: "Se requiere tipo de novedad" },
        { status: 400 }
      );
    }

    if (!titulo || titulo.trim().length < 5) {
      return NextResponse.json(
        { error: "El título debe tener al menos 5 caracteres" },
        { status: 400 }
      );
    }

    if (!descripcion || descripcion.trim().length < 10) {
      return NextResponse.json(
        { error: "La descripción debe tener al menos 10 caracteres" },
        { status: 400 }
      );
    }

    if (!fecha_hecho) {
      return NextResponse.json(
        { error: "Se requiere fecha del hecho" },
        { status: 400 }
      );
    }

    // Verificar que el empleado pertenece a la empresa
    const { data: empleado } = await supabase
      .from("empleados")
      .select("id, nombre")
      .eq("id", empleado_id)
      .eq("empresa_id", empresa.id)
      .single();

    if (!empleado) {
      return NextResponse.json(
        { error: "Empleado no encontrado o no pertenece a esta empresa" },
        { status: 404 }
      );
    }

    // Generar hash SHA-256
    const timestamp = new Date().toISOString();
    const contenidoHash = JSON.stringify({
      empresa_id: empresa.id,
      empleado_id,
      tipo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      fecha_hecho,
      timestamp,
    });
    const hash = SHA256(contenidoHash).toString();

    // Datos del request
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Obtener nombre del supervisor (usuario actual)
    const { data: perfilUsuario } = await supabase
      .from("empresas")
      .select("razon_social")
      .eq("user_id", user.id)
      .single();

    // Crear novedad
    const { data: novedad, error: insertError } = await supabase
      .from("bitacora_novedades")
      .insert({
        empresa_id: empresa.id,
        empleado_id,
        supervisor_id: user.id,
        tipo,
        categoria: categoria || null,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha_hecho,
        hora_hecho: hora_hecho || null,
        lugar: lugar?.trim() || null,
        testigos_presentes: testigos_presentes || null,
        empleado_respuesta: empleado_respuesta?.trim() || null,
        empleado_actitud: empleado_actitud || "no_aplica",
        hash_sha256: hash,
        creado_por_nombre: perfilUsuario?.razon_social || user.email,
        creado_desde_ip: ip,
        creado_user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creando novedad:", insertError);
      return NextResponse.json(
        { error: "Error al crear la novedad" },
        { status: 500 }
      );
    }

    // Registrar evento
    await supabase.from("eventos_bitacora").insert({
      novedad_id: novedad.id,
      tipo: "creada",
      metadata: {
        tipo_novedad: tipo,
        empleado_nombre: empleado.nombre,
      },
      ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      novedad,
    });
  } catch (error) {
    console.error("Error en bitácora:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Listar novedades de la bitácora
export async function GET(request: NextRequest) {
  try {
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

    // Obtener parámetros de query
    const { searchParams } = new URL(request.url);
    const empleadoId = searchParams.get("empleado_id");
    const tipo = searchParams.get("tipo") as TipoNovedad | null;
    const categoria = searchParams.get("categoria") as CategoriaNovedad | null;
    const fechaDesde = searchParams.get("fecha_desde");
    const fechaHasta = searchParams.get("fecha_hasta");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const incluirArchivadas = searchParams.get("incluir_archivadas") === "true";

    // Construir query
    let query = supabase
      .from("bitacora_novedades")
      .select(
        `
        *,
        empleado:empleados(id, nombre, cuil)
      `,
        { count: "exact" }
      )
      .eq("empresa_id", empresa.id)
      .order("fecha_hecho", { ascending: false })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtros
    if (!incluirArchivadas) {
      query = query.eq("archivado", false);
    }

    if (empleadoId) {
      query = query.eq("empleado_id", empleadoId);
    }

    if (tipo) {
      query = query.eq("tipo", tipo);
    }

    if (categoria) {
      query = query.eq("categoria", categoria);
    }

    if (fechaDesde) {
      query = query.gte("fecha_hecho", fechaDesde);
    }

    if (fechaHasta) {
      query = query.lte("fecha_hecho", fechaHasta);
    }

    const { data: novedades, error, count } = await query;

    if (error) {
      console.error("Error obteniendo novedades:", error);
      return NextResponse.json(
        { error: "Error al obtener las novedades" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      novedades,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error en bitácora GET:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
