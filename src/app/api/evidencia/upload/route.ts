import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  MIME_TYPES_PERMITIDOS,
  TAMANO_MAXIMO_BYTES,
  type TipoEvidencia,
} from "@/lib/types";

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

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

    // Parsear formData
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const tipo = formData.get("tipo") as TipoEvidencia | null;
    const notificacionId = formData.get("notificacion_id") as string | null;
    const descripcion = formData.get("descripcion") as string | null;
    const esPruebaPrincipal = formData.get("es_prueba_principal") === "true";
    const hashSha256 = formData.get("hash_sha256") as string | null;
    const exifFechaCaptura = formData.get("exif_fecha_captura") as string | null;
    const exifLatitud = formData.get("exif_latitud") as string | null;
    const exifLongitud = formData.get("exif_longitud") as string | null;
    const exifAltitud = formData.get("exif_altitud") as string | null;
    const exifDispositivo = formData.get("exif_dispositivo") as string | null;
    const exifSoftware = formData.get("exif_software") as string | null;
    const exifOrientacion = formData.get("exif_orientacion") as string | null;
    const exifRaw = formData.get("exif_raw") as string | null;
    const orden = parseInt(formData.get("orden") as string) || 0;

    // Validaciones
    if (!file) {
      return NextResponse.json(
        { error: "Se requiere un archivo" },
        { status: 400 }
      );
    }

    if (!tipo) {
      return NextResponse.json(
        { error: "Se requiere el tipo de evidencia" },
        { status: 400 }
      );
    }

    if (!hashSha256) {
      return NextResponse.json(
        { error: "Se requiere el hash SHA-256" },
        { status: 400 }
      );
    }

    // Validar MIME type
    const mimeTypesPermitidos = MIME_TYPES_PERMITIDOS[tipo];
    if (!mimeTypesPermitidos.includes(file.type)) {
      return NextResponse.json(
        { error: `Tipo de archivo no permitido para ${tipo}` },
        { status: 400 }
      );
    }

    // Validar tamaño
    const maxSize = TAMANO_MAXIMO_BYTES[tipo];
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Archivo muy grande. Máximo: ${Math.round(maxSize / 1024 / 1024)}MB` },
        { status: 400 }
      );
    }

    // Verificar que la notificación pertenece a la empresa (si se proporciona)
    if (notificacionId) {
      const { data: notificacion } = await supabase
        .from("notificaciones")
        .select("id")
        .eq("id", notificacionId)
        .eq("empresa_id", empresa.id)
        .single();

      if (!notificacion) {
        return NextResponse.json(
          { error: "Notificación no encontrada o no autorizada" },
          { status: 404 }
        );
      }
    }

    // Generar path único para Storage
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `${empresa.id}/${notificacionId || "sin_notificacion"}/${timestamp}_${safeFileName}`;

    // Subir archivo a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("evidencia")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error subiendo archivo:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      );
    }

    // Obtener URL pública (opcional, dependiendo de la configuración del bucket)
    const { data: urlData } = supabase.storage
      .from("evidencia")
      .getPublicUrl(storagePath);

    // Datos del request
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Crear registro en la base de datos
    const { data: evidencia, error: insertError } = await supabase
      .from("evidencia_incidentes")
      .insert({
        empresa_id: empresa.id,
        notificacion_id: notificacionId || null,
        tipo,
        nombre_archivo: file.name,
        mime_type: file.type,
        tamano_bytes: file.size,
        storage_path: storagePath,
        url_publica: urlData?.publicUrl || null,
        hash_sha256: hashSha256,
        descripcion: descripcion || null,
        es_prueba_principal: esPruebaPrincipal,
        orden,
        exif_fecha_captura: exifFechaCaptura || null,
        exif_latitud: exifLatitud ? parseFloat(exifLatitud) : null,
        exif_longitud: exifLongitud ? parseFloat(exifLongitud) : null,
        exif_altitud: exifAltitud ? parseFloat(exifAltitud) : null,
        exif_dispositivo: exifDispositivo || null,
        exif_software: exifSoftware || null,
        exif_orientacion: exifOrientacion ? parseInt(exifOrientacion) : null,
        exif_raw: exifRaw ? JSON.parse(exifRaw) : null,
        subido_por_user_id: user.id,
        subido_desde_ip: ip,
        subido_desde_user_agent: userAgent,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creando registro:", insertError);
      // Intentar borrar el archivo subido
      await supabase.storage.from("evidencia").remove([storagePath]);
      return NextResponse.json(
        { error: "Error al guardar la evidencia" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      evidencia,
    });
  } catch (error) {
    console.error("Error en upload de evidencia:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
