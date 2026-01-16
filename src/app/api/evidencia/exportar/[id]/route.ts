import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import CryptoJS from "crypto-js";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: notificacionId } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar empresa
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, razon_social, cuit")
    .eq("user_id", user.id)
    .single();

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  // Obtener notificación completa con relaciones
  const { data: notificacion, error: notifError } = await supabase
    .from("notificaciones")
    .select(`
      *,
      empleado:empleados(nombre, cuil, email, telefono)
    `)
    .eq("id", notificacionId)
    .eq("empresa_id", empresa.id)
    .single();

  if (notifError || !notificacion) {
    return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
  }

  // Crear el ZIP
  const zip = new JSZip();
  const contenidoIncluido: Record<string, boolean | number> = {};
  const timelineHashes: Array<{ tipo: string; id: string; hash: string; timestamp: string }> = [];

  // Timestamp de generación
  const timestampGeneracion = new Date().toISOString();

  // =====================================================
  // 1. INFORMACIÓN DE LA SANCIÓN
  // =====================================================

  const infoSancion = {
    id: notificacion.id,
    tipo: notificacion.tipo,
    motivo: notificacion.motivo,
    descripcion: notificacion.descripcion,
    fecha_hecho: notificacion.fecha_hecho,
    gravedad: notificacion.gravedad,
    estado: notificacion.estado,
    fecha_vencimiento: notificacion.fecha_vencimiento,
    hash_sha256: notificacion.hash_sha256,
    timestamp_generacion: notificacion.timestamp_generacion,
    empleado: notificacion.empleado,
    empresa: {
      razon_social: empresa.razon_social,
      cuit: empresa.cuit,
    },
  };

  zip.file("01_sancion/info_sancion.json", JSON.stringify(infoSancion, null, 2));
  contenidoIncluido.sancion = true;

  if (notificacion.hash_sha256) {
    timelineHashes.push({
      tipo: "notificacion",
      id: notificacion.id,
      hash: notificacion.hash_sha256,
      timestamp: notificacion.timestamp_generacion || notificacion.created_at,
    });
  }

  // Si existe el PDF, descargarlo
  if (notificacion.pdf_url) {
    try {
      const { data: pdfData } = await supabase.storage
        .from("sanciones")
        .download(notificacion.pdf_url.replace(/^.*\/sanciones\//, ""));

      if (pdfData) {
        const pdfArrayBuffer = await pdfData.arrayBuffer();
        zip.file("01_sancion/sancion.pdf", pdfArrayBuffer);
      }
    } catch (e) {
      console.error("Error descargando PDF:", e);
    }
  }

  // =====================================================
  // 2. TESTIGOS
  // =====================================================

  const { data: testigos } = await supabase
    .from("declaraciones_testigos")
    .select("*")
    .eq("notificacion_id", notificacionId);

  if (testigos && testigos.length > 0) {
    contenidoIncluido.testigos = testigos.length;

    const testigosInfo = testigos.map(t => ({
      id: t.id,
      nombre: t.nombre_completo,
      cargo: t.cargo,
      relacion: t.relacion,
      presente_en_hecho: t.presente_en_hecho,
      descripcion: t.descripcion_testigo,
      estado: t.estado,
      firmado_at: t.firmado_at,
      hash_sha256: t.hash_sha256,
    }));

    zip.file("02_testigos/listado_testigos.json", JSON.stringify(testigosInfo, null, 2));

    testigos.forEach((t, idx) => {
      if (t.hash_sha256) {
        timelineHashes.push({
          tipo: "testigo",
          id: t.id,
          hash: t.hash_sha256,
          timestamp: t.firmado_at || t.created_at,
        });
      }
    });
  }

  // =====================================================
  // 3. EVIDENCIAS
  // =====================================================

  const { data: evidencias } = await supabase
    .from("evidencia_incidentes")
    .select("*")
    .eq("notificacion_id", notificacionId);

  if (evidencias && evidencias.length > 0) {
    contenidoIncluido.evidencias = evidencias.length;

    const evidenciasInfo = evidencias.map(e => ({
      id: e.id,
      tipo: e.tipo,
      nombre_archivo: e.nombre_archivo,
      descripcion: e.descripcion,
      hash_sha256: e.hash_sha256,
      exif: {
        fecha_captura: e.exif_fecha_captura,
        latitud: e.exif_latitud,
        longitud: e.exif_longitud,
        dispositivo: e.exif_dispositivo,
      },
      created_at: e.created_at,
    }));

    zip.file("03_evidencias/listado_evidencias.json", JSON.stringify(evidenciasInfo, null, 2));

    for (let i = 0; i < evidencias.length; i++) {
      const e = evidencias[i];

      if (e.hash_sha256) {
        timelineHashes.push({
          tipo: "evidencia",
          id: e.id,
          hash: e.hash_sha256,
          timestamp: e.created_at,
        });
      }

      if (e.storage_path) {
        try {
          const { data: fileData } = await supabase.storage
            .from("evidencia")
            .download(e.storage_path);

          if (fileData) {
            const arrayBuffer = await fileData.arrayBuffer();
            zip.file(`03_evidencias/archivos/${i + 1}_${e.nombre_archivo}`, arrayBuffer);
          }
        } catch (err) {
          console.error("Error descargando evidencia:", err);
        }
      }
    }
  }

  // =====================================================
  // 4. DESCARGO
  // =====================================================

  const { data: descargo } = await supabase
    .from("descargos")
    .select("*")
    .eq("notificacion_id", notificacionId)
    .single();

  if (descargo) {
    contenidoIncluido.descargo = true;

    const descargoInfo = {
      id: descargo.id,
      decision: descargo.decision,
      decision_timestamp: descargo.decision_timestamp,
      texto_descargo: descargo.texto_descargo,
      confirmado_at: descargo.confirmado_at,
      hash_sha256: descargo.hash_sha256,
    };

    zip.file("04_descargo/descargo.json", JSON.stringify(descargoInfo, null, 2));

    if (descargo.hash_sha256) {
      timelineHashes.push({
        tipo: "descargo",
        id: descargo.id,
        hash: descargo.hash_sha256,
        timestamp: descargo.confirmado_at || descargo.created_at,
      });
    }
  }

  // =====================================================
  // 5. BITÁCORA
  // =====================================================

  const { data: bitacora } = await supabase
    .from("bitacora_novedades")
    .select("*")
    .eq("empleado_id", notificacion.empleado_id)
    .eq("archivado", false)
    .order("fecha_hecho", { ascending: false })
    .limit(50);

  if (bitacora && bitacora.length > 0) {
    contenidoIncluido.bitacora = bitacora.length;

    const bitacoraInfo = bitacora.map(b => ({
      id: b.id,
      tipo: b.tipo,
      categoria: b.categoria,
      titulo: b.titulo,
      descripcion: b.descripcion,
      fecha_hecho: b.fecha_hecho,
      hash_sha256: b.hash_sha256,
      created_at: b.created_at,
    }));

    zip.file("05_bitacora/novedades.json", JSON.stringify(bitacoraInfo, null, 2));
  }

  // =====================================================
  // 6. TIMELINE
  // =====================================================

  const { data: timeline } = await supabase.rpc("obtener_timeline_notificacion", {
    p_notificacion_id: notificacionId,
  });

  if (timeline && !timeline.error) {
    zip.file("06_timeline/timeline.json", JSON.stringify(timeline, null, 2));
  }

  // =====================================================
  // 7. HASHES
  // =====================================================

  const { data: hashes } = await supabase.rpc("obtener_hashes_notificacion", {
    p_notificacion_id: notificacionId,
  });

  if (hashes && !hashes.error) {
    zip.file("07_verificacion/hashes.json", JSON.stringify(hashes, null, 2));
  }

  timelineHashes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  zip.file("07_verificacion/timeline_hashes.json", JSON.stringify(timelineHashes, null, 2));

  // =====================================================
  // CADENA DE CUSTODIA
  // =====================================================

  const cadenaCustodia = {
    paquete: {
      generado_at: timestampGeneracion,
      generado_por: user.email,
    },
    notificacion: {
      id: notificacion.id,
      created_at: notificacion.created_at,
      hash_original: notificacion.hash_sha256,
    },
    contenido_incluido: contenidoIncluido,
    timeline_hashes: timelineHashes,
  };

  zip.file("00_CADENA_CUSTODIA.json", JSON.stringify(cadenaCustodia, null, 2));

  // README
  const readme = `# PAQUETE DE EVIDENCIA - NOTILEGAL

## Información del Caso
- **Empleador**: ${empresa.razon_social} (CUIT: ${empresa.cuit})
- **Empleado**: ${notificacion.empleado?.nombre || "N/A"}
- **Tipo de Sanción**: ${notificacion.tipo}
- **Estado**: ${notificacion.estado}

## Contenido
- 00_CADENA_CUSTODIA.json - Registro de integridad
- 01_sancion/ - Documento de la sanción
- 02_testigos/ - Declaraciones de testigos
- 03_evidencias/ - Archivos de evidencia
- 04_descargo/ - Descargo del empleado
- 05_bitacora/ - Historial de novedades
- 06_timeline/ - Timeline de eventos
- 07_verificacion/ - Hashes para verificación

---
Generado: ${new Date().toLocaleString("es-AR")}
Sistema: NotiLegal v1.0
`;

  zip.file("README.md", readme);

  // Generar ZIP
  const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
  const zipBuffer = Buffer.from(zipBlob);

  // Calcular hash del paquete
  const wordArray = CryptoJS.lib.WordArray.create(zipBuffer as unknown as number[]);
  const hashPaquete = CryptoJS.SHA256(wordArray).toString();

  // Nombre del archivo
  const fechaStr = new Date().toISOString().split("T")[0];
  const nombreArchivo = `evidencia_${notificacion.tipo}_${fechaStr}.zip`;

  // Retornar el ZIP
  return new NextResponse(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
      "X-Hash-SHA256": hashPaquete,
    },
  });
}
