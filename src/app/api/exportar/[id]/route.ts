import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import JSZip from "jszip";
import CryptoJS from "crypto-js";
import type { TipoExportacion } from "@/lib/types";

export async function POST(
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

  // Obtener datos del request
  const body = await request.json();
  const tipo: TipoExportacion = body.tipo || "paquete_completo";
  const solicitadoPara = body.solicitado_para || null;
  const motivo = body.motivo || null;

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

      // Crear archivo individual por testigo
      const testigoDetalle = {
        ...t,
        verificacion: {
          hash_sha256: t.hash_sha256,
          firmado_at: t.firmado_at,
          ip_firma: t.juramento_ip,
        },
      };
      zip.file(`02_testigos/testigo_${idx + 1}_${t.nombre_completo.replace(/\s/g, "_")}.json`,
        JSON.stringify(testigoDetalle, null, 2));
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

    // Descargar archivos de evidencia
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
            const extension = e.nombre_archivo.split(".").pop() || "bin";
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
      checkbox_texto_aceptado: descargo.checkbox_texto_aceptado,
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
  // 5. BITÁCORA DE NOVEDADES
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
      hora_hecho: b.hora_hecho,
      testigos_presentes: b.testigos_presentes,
      empleado_actitud: b.empleado_actitud,
      hash_sha256: b.hash_sha256,
      created_at: b.created_at,
    }));

    zip.file("05_bitacora/novedades.json", JSON.stringify(bitacoraInfo, null, 2));

    bitacora.forEach(b => {
      if (b.hash_sha256) {
        timelineHashes.push({
          tipo: "bitacora",
          id: b.id,
          hash: b.hash_sha256,
          timestamp: b.created_at,
        });
      }
    });
  }

  // =====================================================
  // 6. TIMELINE DE EVENTOS
  // =====================================================

  const { data: timeline } = await supabase.rpc("obtener_timeline_notificacion", {
    p_notificacion_id: notificacionId,
  });

  if (timeline && !timeline.error) {
    zip.file("06_timeline/timeline.json", JSON.stringify(timeline, null, 2));

    // Generar timeline HTML
    const timelineHtml = generarTimelineHTML(timeline.eventos || [], infoSancion);
    zip.file("06_timeline/timeline.html", timelineHtml);
  }

  // =====================================================
  // 7. HASHES Y VERIFICACIÓN
  // =====================================================

  const { data: hashes } = await supabase.rpc("obtener_hashes_notificacion", {
    p_notificacion_id: notificacionId,
  });

  if (hashes && !hashes.error) {
    zip.file("07_verificacion/hashes.json", JSON.stringify(hashes, null, 2));
  }

  // Ordenar timeline de hashes por timestamp
  timelineHashes.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  zip.file("07_verificacion/timeline_hashes.json", JSON.stringify(timelineHashes, null, 2));

  // Instrucciones de verificación
  const instruccionesVerificacion = `
# INSTRUCCIONES DE VERIFICACIÓN DE INTEGRIDAD

Este paquete de evidencia contiene documentos digitales con firmas SHA-256.
Para verificar que ningún documento ha sido alterado:

## Verificación Manual

1. Calcular el hash SHA-256 de cada archivo
2. Comparar con el hash registrado en los archivos JSON

### En Linux/Mac:
\`\`\`bash
sha256sum archivo.pdf
\`\`\`

### En Windows (PowerShell):
\`\`\`powershell
Get-FileHash archivo.pdf -Algorithm SHA256
\`\`\`

## Verificación Online

Puede verificar cualquier hash en:
${process.env.NEXT_PUBLIC_APP_URL || "https://notilegal.com.ar"}/verificar

## Contacto para Peritaje

Para consultas técnicas sobre este paquete de evidencia:
- Email: soporte@notilegal.com.ar
- Web: https://notilegal.com.ar

---
Generado: ${timestampGeneracion}
ID Notificación: ${notificacionId}
`;

  zip.file("07_verificacion/INSTRUCCIONES.md", instruccionesVerificacion);

  // =====================================================
  // 8. CADENA DE CUSTODIA
  // =====================================================

  const cadenaCustodia = {
    paquete: {
      generado_at: timestampGeneracion,
      tipo_exportacion: tipo,
      solicitado_para: solicitadoPara,
      motivo: motivo,
      generado_por: user.email,
    },
    notificacion: {
      id: notificacion.id,
      created_at: notificacion.created_at,
      hash_original: notificacion.hash_sha256,
    },
    contenido_incluido: contenidoIncluido,
    timeline_hashes: timelineHashes,
    metadatos_tecnicos: {
      version_sistema: "NotiLegal v1.0",
      algoritmo_hash: "SHA-256",
      timestamp_formato: "ISO 8601",
      timezone: "UTC",
    },
  };

  zip.file("00_CADENA_CUSTODIA.json", JSON.stringify(cadenaCustodia, null, 2));

  // README principal
  const readme = `
# PAQUETE DE EVIDENCIA - NOTILEGAL

## Información del Caso

- **Empleador**: ${empresa.razon_social} (CUIT: ${empresa.cuit})
- **Empleado**: ${notificacion.empleado?.nombre || "N/A"} (CUIL: ${notificacion.empleado?.cuil || "N/A"})
- **Tipo de Sanción**: ${notificacion.tipo}
- **Fecha del Hecho**: ${notificacion.fecha_hecho}
- **Estado**: ${notificacion.estado}

## Contenido del Paquete

- \`00_CADENA_CUSTODIA.json\` - Registro de integridad y trazabilidad
- \`01_sancion/\` - Documento de la sanción y PDF
- \`02_testigos/\` - Declaraciones de testigos firmadas digitalmente
- \`03_evidencias/\` - Archivos de evidencia con metadatos
- \`04_descargo/\` - Descargo del empleado (si existe)
- \`05_bitacora/\` - Historial de novedades del empleado
- \`06_timeline/\` - Timeline cronológico de eventos
- \`07_verificacion/\` - Hashes e instrucciones de verificación

## Validez Legal

Este paquete de evidencia fue generado por NotiLegal, sistema de notificación
fehaciente conforme a la Ley 27.742 de Modernización Laboral.

Cada documento incluye:
- Hash SHA-256 para verificación de integridad
- Timestamp certificado
- Cadena de custodia completa

## Verificación

Para verificar la integridad de cualquier documento, consulte las
instrucciones en \`07_verificacion/INSTRUCCIONES.md\`.

---
Generado: ${new Date().toLocaleString("es-AR")}
Sistema: NotiLegal v1.0
`;

  zip.file("README.md", readme);

  // =====================================================
  // GENERAR ZIP Y CALCULAR HASH
  // =====================================================

  const zipBlob = await zip.generateAsync({ type: "arraybuffer" });
  const zipBuffer = Buffer.from(zipBlob);

  // Calcular hash del paquete completo
  const wordArray = CryptoJS.lib.WordArray.create(zipBuffer as unknown as number[]);
  const hashPaquete = CryptoJS.SHA256(wordArray).toString();

  // Generar nombre del archivo
  const fechaStr = new Date().toISOString().split("T")[0];
  const nombreArchivo = `evidencia_${notificacion.tipo}_${notificacion.empleado?.nombre?.replace(/\s/g, "_") || "empleado"}_${fechaStr}.zip`;

  // Subir a Supabase Storage
  const storagePath = `exportaciones/${empresa.id}/${notificacionId}/${nombreArchivo}`;

  const { error: uploadError } = await supabase.storage
    .from("evidencia")
    .upload(storagePath, zipBuffer, {
      contentType: "application/zip",
      upsert: true,
    });

  if (uploadError) {
    console.error("Error subiendo ZIP:", uploadError);
    return NextResponse.json({ error: "Error guardando el paquete" }, { status: 500 });
  }

  // Obtener URL pública
  const { data: urlData } = await supabase.storage
    .from("evidencia")
    .createSignedUrl(storagePath, 3600 * 24); // 24 horas de validez

  // Registrar la exportación
  await supabase.from("exportaciones_evidencia").insert({
    empresa_id: empresa.id,
    notificacion_id: notificacionId,
    tipo: tipo,
    solicitado_para: solicitadoPara,
    motivo: motivo,
    storage_path: storagePath,
    nombre_archivo: nombreArchivo,
    tamano_bytes: zipBuffer.length,
    hash_paquete: hashPaquete,
    contenido_incluido: contenidoIncluido,
    timeline_hashes: timelineHashes,
    metadatos_tecnicos: {
      version_sistema: "NotiLegal v1.0",
      timestamp_generacion: timestampGeneracion,
    },
    estado: "completado",
    completado_at: new Date().toISOString(),
  });

  return NextResponse.json({
    success: true,
    url: urlData?.signedUrl,
    hash: hashPaquete,
    nombre_archivo: nombreArchivo,
    tamano_bytes: zipBuffer.length,
    contenido_incluido: contenidoIncluido,
  });
}

// Función auxiliar para generar timeline HTML
function generarTimelineHTML(eventos: Array<{ tipo: string; timestamp: string; titulo: string; descripcion: string; hash?: string }>, sancion: Record<string, unknown>): string {
  const eventosHtml = eventos.map((e, idx) => `
    <div class="evento">
      <div class="evento-dot"></div>
      <div class="evento-contenido">
        <div class="evento-header">
          <span class="evento-titulo">${e.titulo}</span>
          <span class="evento-fecha">${new Date(e.timestamp).toLocaleString("es-AR")}</span>
        </div>
        <p class="evento-descripcion">${e.descripcion}</p>
        ${e.hash ? `<code class="evento-hash">Hash: ${e.hash}</code>` : ""}
      </div>
    </div>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Timeline - NotiLegal</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    h1 { color: #1e40af; margin-bottom: 8px; }
    .subtitulo { color: #64748b; margin-bottom: 24px; }
    .info { background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .info p { margin: 4px 0; color: #475569; }
    .timeline { position: relative; padding-left: 24px; border-left: 2px solid #e2e8f0; }
    .evento { position: relative; padding-bottom: 24px; }
    .evento:last-child { padding-bottom: 0; }
    .evento-dot { position: absolute; left: -29px; top: 4px; width: 12px; height: 12px; background: #1e40af; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 2px #1e40af; }
    .evento-contenido { background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .evento-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
    .evento-titulo { font-weight: 600; color: #1e293b; }
    .evento-fecha { font-size: 12px; color: #64748b; }
    .evento-descripcion { color: #475569; font-size: 14px; }
    .evento-hash { display: block; margin-top: 8px; font-size: 11px; background: #e2e8f0; padding: 4px 8px; border-radius: 4px; word-break: break-all; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Timeline de Eventos</h1>
    <p class="subtitulo">Registro cronológico de la notificación</p>

    <div class="info">
      <p><strong>ID:</strong> ${(sancion as { id?: string }).id || "N/A"}</p>
      <p><strong>Tipo:</strong> ${(sancion as { tipo?: string }).tipo || "N/A"}</p>
      <p><strong>Estado:</strong> ${(sancion as { estado?: string }).estado || "N/A"}</p>
    </div>

    <div class="timeline">
      ${eventosHtml}
    </div>

    <div class="footer">
      Generado por NotiLegal - ${new Date().toLocaleString("es-AR")}
    </div>
  </div>
</body>
</html>
`;
}
