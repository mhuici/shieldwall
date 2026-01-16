import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { TipoDocumentoVerificacion, ResultadoVerificacion } from "@/lib/types";

// POST: Verificar integridad de un documento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tipo: string; id: string }> }
) {
  try {
    const { tipo: tipoRaw, id } = await params;
    const tipo = tipoRaw as TipoDocumentoVerificacion;
    const supabase = await createClient();

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener body
    const body = await request.json().catch(() => ({}));
    const hashProporcionado = body.hash_proporcionado?.trim();

    // Verificar que la empresa existe
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

    let hashEsperado: string | null = null;
    let descripcion = "";

    // Obtener el hash según el tipo de documento
    switch (tipo) {
      case "notificacion": {
        const { data: notificacion } = await supabase
          .from("notificaciones")
          .select("hash_sha256, tipo, motivo")
          .eq("id", id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!notificacion) {
          return NextResponse.json(
            { error: "Notificación no encontrada" },
            { status: 404 }
          );
        }
        hashEsperado = notificacion.hash_sha256;
        descripcion = `Sanción ${notificacion.tipo}: ${notificacion.motivo}`;
        break;
      }

      case "testigo": {
        const { data: testigo } = await supabase
          .from("testigos_incidente")
          .select("hash_declaracion, nombre, notificacion_id")
          .eq("id", id)
          .single();

        if (!testigo) {
          return NextResponse.json(
            { error: "Testigo no encontrado" },
            { status: 404 }
          );
        }

        // Verificar que la notificación pertenece a la empresa
        const { data: notif } = await supabase
          .from("notificaciones")
          .select("id")
          .eq("id", testigo.notificacion_id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!notif) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        hashEsperado = testigo.hash_declaracion;
        descripcion = `Declaración de testigo: ${testigo.nombre}`;
        break;
      }

      case "evidencia": {
        const { data: evidencia } = await supabase
          .from("evidencia_incidentes")
          .select("hash_sha256, nombre_archivo, notificacion_id")
          .eq("id", id)
          .single();

        if (!evidencia) {
          return NextResponse.json(
            { error: "Evidencia no encontrada" },
            { status: 404 }
          );
        }

        // Verificar que la notificación pertenece a la empresa
        const { data: notif } = await supabase
          .from("notificaciones")
          .select("id")
          .eq("id", evidencia.notificacion_id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!notif) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        hashEsperado = evidencia.hash_sha256;
        descripcion = `Evidencia: ${evidencia.nombre_archivo}`;
        break;
      }

      case "descargo": {
        const { data: descargo } = await supabase
          .from("descargos")
          .select("hash_sha256, decision, notificacion_id")
          .eq("id", id)
          .single();

        if (!descargo) {
          return NextResponse.json(
            { error: "Descargo no encontrado" },
            { status: 404 }
          );
        }

        // Verificar que la notificación pertenece a la empresa
        const { data: notif } = await supabase
          .from("notificaciones")
          .select("id")
          .eq("id", descargo.notificacion_id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!notif) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        hashEsperado = descargo.hash_sha256;
        descripcion = `Descargo: ${descargo.decision}`;
        break;
      }

      case "bitacora": {
        const { data: entrada } = await supabase
          .from("bitacora_novedades")
          .select("hash_sha256, titulo")
          .eq("id", id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!entrada) {
          return NextResponse.json(
            { error: "Entrada de bitácora no encontrada" },
            { status: 404 }
          );
        }

        hashEsperado = entrada.hash_sha256;
        descripcion = `Bitácora: ${entrada.titulo}`;
        break;
      }

      case "paquete": {
        const { data: exportacion } = await supabase
          .from("exportaciones_evidencia")
          .select("hash_paquete, tipo")
          .eq("id", id)
          .eq("empresa_id", empresa.id)
          .single();

        if (!exportacion) {
          return NextResponse.json(
            { error: "Exportación no encontrada" },
            { status: 404 }
          );
        }

        hashEsperado = exportacion.hash_paquete;
        descripcion = `Paquete de evidencia: ${exportacion.tipo}`;
        break;
      }

      default:
        return NextResponse.json(
          { error: "Tipo de documento no válido" },
          { status: 400 }
        );
    }

    // Registrar la verificación
    await supabase.from("verificaciones_integridad").insert({
      empresa_id: empresa.id,
      tipo_documento: tipo,
      documento_id: id,
      hash_proporcionado: hashProporcionado || null,
      hash_esperado: hashEsperado,
      verificacion_exitosa: hashProporcionado
        ? hashProporcionado === hashEsperado
        : true,
      verificado_por: user.id,
    });

    // Construir respuesta
    let resultado: ResultadoVerificacion;

    if (!hashEsperado) {
      resultado = {
        verificacion_exitosa: false,
        hash_esperado: null,
        hash_proporcionado: hashProporcionado || null,
        mensaje: `El documento no tiene hash almacenado. ${descripcion}`,
      };
    } else if (!hashProporcionado) {
      // Solo mostrar el hash almacenado
      resultado = {
        verificacion_exitosa: true,
        hash_esperado: hashEsperado,
        hash_proporcionado: null,
        mensaje: `Hash encontrado para: ${descripcion}`,
      };
    } else if (hashProporcionado === hashEsperado) {
      resultado = {
        verificacion_exitosa: true,
        hash_esperado: hashEsperado,
        hash_proporcionado: hashProporcionado,
        mensaje: `Los hashes coinciden. El documento "${descripcion}" no ha sido alterado.`,
      };
    } else {
      resultado = {
        verificacion_exitosa: false,
        hash_esperado: hashEsperado,
        hash_proporcionado: hashProporcionado,
        mensaje: `Los hashes NO coinciden. El documento "${descripcion}" puede haber sido alterado o el hash proporcionado es incorrecto.`,
      };
    }

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error verificando integridad:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
