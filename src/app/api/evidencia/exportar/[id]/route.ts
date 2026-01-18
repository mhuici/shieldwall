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
    .select("id, razon_social, cuit, direccion_legal")
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
      empleado:empleados(id, nombre, cuil, email, telefono, convenio_firmado, convenio_id, fecha_convenio)
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
  // 8. CONVENIO DE DOMICILIO ELECTRÓNICO
  // =====================================================

  const empleadoData = notificacion.empleado as { id: string; convenio_id?: string } | null;

  if (empleadoData?.convenio_id) {
    const { data: convenio } = await supabase
      .from("convenios_domicilio")
      .select("*")
      .eq("id", empleadoData.convenio_id)
      .single();

    if (convenio) {
      contenidoIncluido.convenio = true;

      const convenioInfo = {
        id: convenio.id,
        estado: convenio.estado,
        version_convenio: convenio.version_convenio,
        email_constituido: convenio.email_constituido,
        telefono_constituido: convenio.telefono_constituido,
        acepta_notificaciones_digitales: convenio.acepta_notificaciones_digitales,
        acepta_biometricos: convenio.acepta_biometricos,
        firma_checkbox_at: convenio.firma_checkbox_at,
        firma_otp_verificado: convenio.firma_otp_verificado,
        firma_otp_at: convenio.firma_otp_at,
        firmado_at: convenio.firmado_at,
        hash_convenio: convenio.hash_convenio,
        fundamento_legal: "Acordada N° 31/2011 CSJN",
      };

      zip.file("08_convenio/convenio_domicilio.json", JSON.stringify(convenioInfo, null, 2));

      if (convenio.hash_convenio) {
        timelineHashes.push({
          tipo: "convenio",
          id: convenio.id,
          hash: convenio.hash_convenio,
          timestamp: convenio.firmado_at || convenio.created_at,
        });
      }
    }
  }

  // =====================================================
  // 9. VALIDACIÓN DE IDENTIDAD (OTP + SELFIE)
  // =====================================================

  const validacionIdentidad = {
    cuil_validado: {
      validado: !!notificacion.identidad_validada_at,
      timestamp: notificacion.identidad_validada_at,
      cuil_ingresado: notificacion.identidad_cuil_ingresado,
      ip: notificacion.identidad_ip,
      user_agent: notificacion.identidad_user_agent,
    },
    otp_verificado: {
      verificado: notificacion.otp_validado,
      enviado_at: notificacion.otp_enviado_at,
      verificado_at: notificacion.otp_validado_at,
      canal: notificacion.otp_canal,
      intentos: notificacion.otp_intentos,
    },
    selfie_capturada: {
      capturada: !!notificacion.selfie_url,
      url: notificacion.selfie_url,
      hash: notificacion.selfie_hash,
      capturada_at: notificacion.selfie_capturada_at,
      ip: notificacion.selfie_ip,
      metadata: notificacion.selfie_metadata,
    },
    fundamento_legal: "Acordada N° 31/2011 CSJN - Requisitos de acreditación de identidad",
  };

  zip.file("09_validacion_identidad/validacion.json", JSON.stringify(validacionIdentidad, null, 2));
  contenidoIncluido.validacion_identidad = true;

  // =====================================================
  // 10. OPENTIMESTAMP (BLOCKCHAIN)
  // =====================================================

  if (notificacion.ots_estado && notificacion.ots_estado !== "no_creado") {
    const timestampBlockchain = {
      estado: notificacion.ots_estado,
      timestamp_pendiente: notificacion.ots_timestamp_pendiente,
      timestamp_confirmado: notificacion.ots_timestamp_confirmado,
      bitcoin_block_height: notificacion.ots_bitcoin_block_height,
      bitcoin_block_hash: notificacion.ots_bitcoin_block_hash,
      archivo_ots_base64: notificacion.ots_file_base64,
      metadata: notificacion.ots_metadata,
      protocolo: "OpenTimestamps",
      blockchain: "Bitcoin",
      fundamento_legal: "Acordada N° 3/2015 CSJN - Fecha cierta en sistemas informáticos",
      instrucciones_verificacion: "El archivo .ots puede verificarse en https://opentimestamps.org/",
    };

    zip.file("10_blockchain/opentimestamp.json", JSON.stringify(timestampBlockchain, null, 2));

    if (notificacion.ots_file_base64) {
      const otsBuffer = Buffer.from(notificacion.ots_file_base64, "base64");
      zip.file("10_blockchain/documento.ots", otsBuffer);
    }

    contenidoIncluido.opentimestamp = true;
  }

  // =====================================================
  // 11. FIRMA DIGITAL PKI
  // =====================================================

  if (notificacion.firma_digital_aplicada) {
    const firmaPKI = {
      firmado: true,
      firmado_por: notificacion.firma_digital_firmante,
      fecha_firma: notificacion.firma_digital_fecha,
      algoritmo: notificacion.firma_digital_algoritmo,
      certificado_serial: notificacion.firma_digital_certificado_serial,
      certificado_emisor: notificacion.firma_digital_certificado_emisor,
      firma_base64: notificacion.firma_digital_base64,
      metadata: notificacion.firma_digital_metadata,
      fundamento_legal: "Art. 288 Código Civil y Comercial - Equivalencia con firma ológrafa",
    };

    zip.file("11_firma_pki/firma_digital.json", JSON.stringify(firmaPKI, null, 2));
    contenidoIncluido.firma_pki = true;
  }

  // =====================================================
  // 12. EVENTOS DE AUDITORIA
  // =====================================================

  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .eq("notificacion_id", notificacionId)
    .order("created_at", { ascending: true });

  if (eventos && eventos.length > 0) {
    const eventosFormateados = eventos.map(e => ({
      tipo: e.tipo,
      timestamp: e.created_at,
      ip: e.ip,
      user_agent: e.user_agent,
      metadata: e.metadata,
    }));

    zip.file("12_auditoria/eventos.json", JSON.stringify(eventosFormateados, null, 2));
    contenidoIncluido.eventos_auditoria = eventos.length;
  }

  // =====================================================
  // CADENA DE CUSTODIA COMPLETA
  // =====================================================

  const cadenaCustodia = {
    version: "2.0",
    paquete: {
      generado_at: timestampGeneracion,
      generado_por: user.email,
      sistema: "NotiLegal v2.0",
      hash_algoritmo: "SHA-256",
    },
    empresa: {
      razon_social: empresa.razon_social,
      cuit: empresa.cuit,
      direccion_legal: empresa.direccion_legal,
    },
    notificacion: {
      id: notificacion.id,
      tipo: notificacion.tipo,
      estado: notificacion.estado,
      created_at: notificacion.created_at,
      hash_original: notificacion.hash_sha256,
    },
    empleado: {
      nombre: (notificacion.empleado as { nombre?: string })?.nombre,
      cuil: (notificacion.empleado as { cuil?: string })?.cuil,
      convenio_firmado: (notificacion.empleado as { convenio_firmado?: boolean })?.convenio_firmado,
    },
    elementos_probatorios: {
      convenio_domicilio: contenidoIncluido.convenio || false,
      validacion_cuil: !!notificacion.identidad_validada_at,
      validacion_otp: notificacion.otp_validado || false,
      selfie_capturada: !!notificacion.selfie_url,
      firma_digital_pki: notificacion.firma_digital_aplicada || false,
      opentimestamp: contenidoIncluido.opentimestamp || false,
      testigos: contenidoIncluido.testigos || 0,
      evidencias: contenidoIncluido.evidencias || 0,
      descargo: contenidoIncluido.descargo || false,
    },
    fundamentos_legales: [
      { norma: "Acordada N° 31/2011 CSJN", descripcion: "Domicilio electrónico y validación de identidad" },
      { norma: "Art. 288 CCyC", descripcion: "Equivalencia firma digital - firma ológrafa" },
      { norma: "Acordada N° 3/2015 CSJN", descripcion: "Fecha cierta en sistemas informáticos" },
      { norma: "Ley 25.326", descripcion: "Protección de datos personales" },
      { norma: "Ley 27.742", descripcion: "Plazo 30 días para impugnación" },
    ],
    contenido_incluido: contenidoIncluido,
    timeline_hashes: timelineHashes,
    instrucciones_verificacion_pericial: {
      paso_1: "Verificar hash SHA-256 de cada documento contra los listados en timeline_hashes.json",
      paso_2: "Verificar archivo .ots en https://opentimestamps.org/ para confirmar fecha cierta",
      paso_3: "Verificar firma digital PKI con certificado del emisor",
      paso_4: "Contrastar eventos de auditoría con registros de proveedores (SendGrid, Twilio)",
      paso_5: "Verificar integridad del paquete ZIP con hash en header X-Hash-SHA256",
    },
  };

  zip.file("00_CADENA_CUSTODIA.json", JSON.stringify(cadenaCustodia, null, 2));

  // README
  const empleadoNombre = (notificacion.empleado as { nombre?: string })?.nombre || "N/A";
  const readme = `# PAQUETE DE EVIDENCIA PERICIAL - NOTILEGAL v2.0

## Información del Caso
- **Empleador**: ${empresa.razon_social} (CUIT: ${empresa.cuit})
- **Empleado**: ${empleadoNombre}
- **Tipo de Sanción**: ${notificacion.tipo}
- **Estado**: ${notificacion.estado}
- **ID Notificación**: ${notificacion.id}

## Elementos Probatorios Incluidos
- Convenio de Domicilio Electrónico: ${contenidoIncluido.convenio ? "✓" : "✗"}
- Validación de Identidad (CUIL + OTP + Selfie): ${validacionIdentidad.cuil_validado.validado ? "✓" : "✗"}
- Firma Digital PKI: ${notificacion.firma_digital_aplicada ? "✓" : "✗"}
- Timestamp Blockchain (OpenTimestamps): ${contenidoIncluido.opentimestamp ? "✓" : "✗"}
- Testigos: ${contenidoIncluido.testigos || 0}
- Evidencias: ${contenidoIncluido.evidencias || 0}
- Descargo del empleado: ${contenidoIncluido.descargo ? "✓" : "✗"}

## Estructura del Paquete
\`\`\`
00_CADENA_CUSTODIA.json     - Registro completo de integridad y metadatos
01_sancion/                 - Documento de la sanción y PDF
02_testigos/                - Declaraciones juradas de testigos
03_evidencias/              - Archivos multimedia de evidencia
04_descargo/                - Descargo presentado por el empleado
05_bitacora/                - Historial de novedades previas
06_timeline/                - Timeline cronológico de eventos
07_verificacion/            - Hashes SHA-256 para verificación
08_convenio/                - Convenio de domicilio electrónico
09_validacion_identidad/    - Datos de validación (CUIL, OTP, Selfie)
10_blockchain/              - Archivo .ots de OpenTimestamps
11_firma_pki/               - Firma digital y certificado
12_auditoria/               - Log completo de eventos
\`\`\`

## Instrucciones de Verificación Pericial

### 1. Verificar Integridad de Documentos
Calcular el hash SHA-256 de cada archivo y comparar con los valores en \`07_verificacion/timeline_hashes.json\`.

### 2. Verificar Fecha Cierta (Blockchain)
El archivo \`10_blockchain/documento.ots\` puede verificarse en:
- https://opentimestamps.org/
- Usando el cliente oficial: \`ots verify documento.ots\`

### 3. Verificar Firma Digital
La firma en \`11_firma_pki/firma_digital.json\` puede verificarse con la clave pública del certificado emisor.

### 4. Verificar Proveedores Externos
Solicitar certificados de entrega a:
- SendGrid: https://sendgrid.com/ (email)
- Twilio: https://twilio.com/ (SMS/WhatsApp)

### 5. Verificar Integridad del Paquete
El hash SHA-256 del paquete ZIP está en el header HTTP \`X-Hash-SHA256\`.

## Fundamentos Legales
- Acordada N° 31/2011 CSJN - Domicilio electrónico
- Art. 288 CCyC - Equivalencia firma digital
- Acordada N° 3/2015 CSJN - Fecha cierta
- Ley 25.326 - Protección de datos
- Ley 27.742 - Plazo 30 días impugnación

---
Generado: ${new Date().toLocaleString("es-AR")}
Sistema: NotiLegal v2.0
Hash SHA-256 del paquete: [Ver header X-Hash-SHA256]
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
