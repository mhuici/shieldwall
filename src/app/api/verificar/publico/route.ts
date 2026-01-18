import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

interface DocumentoEncontrado {
  tipo: string;
  id: string;
  descripcion: string;
  fecha_creacion: string;
  hash_almacenado: string;
  metadata?: Record<string, unknown>;
  // Información de timestamps
  timestamp_tsa?: {
    estado: string;
    fecha: string | null;
    tsa_url: string | null;
  };
  timestamp_blockchain?: {
    estado: string;
    bitcoin_block_height: number | null;
    bitcoin_block_hash: string | null;
  };
  // Información de firma digital
  firma_digital?: {
    aplicada: boolean;
    fecha: string | null;
    firmante: string | null;
    algoritmo: string | null;
  };
}

// POST: Buscar documento por hash (público, sin autenticación)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hashBuscado = body.hash?.trim().toLowerCase();

    if (!hashBuscado) {
      return NextResponse.json(
        { error: "Debe proporcionar un hash para verificar" },
        { status: 400 }
      );
    }

    // Validar formato SHA-256
    if (!/^[a-f0-9]{64}$/i.test(hashBuscado)) {
      return NextResponse.json(
        { error: "El hash debe ser SHA-256 válido (64 caracteres hexadecimales)" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const documentosEncontrados: DocumentoEncontrado[] = [];

    // Buscar en notificaciones
    const { data: notificacion } = await supabase
      .from("notificaciones")
      .select(`
        id, tipo, motivo, created_at, hash_sha256,
        empleado:empleados(nombre),
        empresa:empresas(razon_social),
        tsa_estado, tsa_timestamp, tsa_url,
        ots_estado, ots_bitcoin_block_height, ots_bitcoin_block_hash,
        firma_digital_aplicada, firma_digital_fecha, firma_digital_firmante, firma_digital_algoritmo
      `)
      .eq("hash_sha256", hashBuscado)
      .single();

    if (notificacion) {
      const empleado = notificacion.empleado as unknown as { nombre: string } | null;
      const empresa = notificacion.empresa as unknown as { razon_social: string } | null;

      documentosEncontrados.push({
        tipo: "notificacion",
        id: notificacion.id,
        descripcion: `Sanción: ${notificacion.tipo} - ${notificacion.motivo}`,
        fecha_creacion: notificacion.created_at,
        hash_almacenado: notificacion.hash_sha256,
        metadata: {
          tipo_sancion: notificacion.tipo,
          motivo: notificacion.motivo,
          empleado: empleado?.nombre || "N/A",
          empresa: empresa?.razon_social || "N/A",
        },
        // Información de timestamps
        timestamp_tsa: {
          estado: notificacion.tsa_estado || "no_creado",
          fecha: notificacion.tsa_timestamp,
          tsa_url: notificacion.tsa_url,
        },
        timestamp_blockchain: {
          estado: notificacion.ots_estado || "no_creado",
          bitcoin_block_height: notificacion.ots_bitcoin_block_height,
          bitcoin_block_hash: notificacion.ots_bitcoin_block_hash,
        },
        // Información de firma digital
        firma_digital: {
          aplicada: notificacion.firma_digital_aplicada || false,
          fecha: notificacion.firma_digital_fecha,
          firmante: notificacion.firma_digital_firmante,
          algoritmo: notificacion.firma_digital_algoritmo,
        },
      });
    }

    // Buscar hash de confirmación de lectura
    const { data: notifConfirmacion } = await supabase
      .from("notificaciones")
      .select(`
        id, tipo, motivo, lectura_confirmada_at, hash_confirmacion,
        empleado:empleados(nombre)
      `)
      .eq("hash_confirmacion", hashBuscado)
      .single();

    if (notifConfirmacion) {
      const empleado = notifConfirmacion.empleado as unknown as { nombre: string } | null;

      documentosEncontrados.push({
        tipo: "confirmacion_lectura",
        id: notifConfirmacion.id,
        descripcion: `Confirmación de lectura de sanción: ${notifConfirmacion.tipo}`,
        fecha_creacion: notifConfirmacion.lectura_confirmada_at,
        hash_almacenado: notifConfirmacion.hash_confirmacion,
        metadata: {
          tipo_sancion: notifConfirmacion.tipo,
          empleado: empleado?.nombre || "N/A",
        },
      });
    }

    // Buscar en declaraciones de testigos
    const { data: testigo } = await supabase
      .from("declaraciones_testigos")
      .select("id, nombre_completo, cargo, firmado_at, hash_sha256")
      .eq("hash_sha256", hashBuscado)
      .single();

    if (testigo) {
      documentosEncontrados.push({
        tipo: "testigo",
        id: testigo.id,
        descripcion: `Declaración de testigo: ${testigo.nombre_completo}`,
        fecha_creacion: testigo.firmado_at,
        hash_almacenado: testigo.hash_sha256,
        metadata: {
          nombre: testigo.nombre_completo,
          cargo: testigo.cargo,
        },
      });
    }

    // Buscar en evidencias
    const { data: evidencia } = await supabase
      .from("evidencia_incidentes")
      .select("id, tipo, nombre_archivo, descripcion, created_at, hash_sha256")
      .eq("hash_sha256", hashBuscado)
      .single();

    if (evidencia) {
      documentosEncontrados.push({
        tipo: "evidencia",
        id: evidencia.id,
        descripcion: `Evidencia: ${evidencia.nombre_archivo}`,
        fecha_creacion: evidencia.created_at,
        hash_almacenado: evidencia.hash_sha256,
        metadata: {
          tipo_archivo: evidencia.tipo,
          nombre_archivo: evidencia.nombre_archivo,
          descripcion: evidencia.descripcion,
        },
      });
    }

    // Buscar en descargos
    const { data: descargo } = await supabase
      .from("descargos")
      .select(`
        id, decision, confirmado_at, hash_sha256,
        empleado:empleados(nombre)
      `)
      .eq("hash_sha256", hashBuscado)
      .single();

    if (descargo) {
      const empleado = descargo.empleado as unknown as { nombre: string } | null;

      documentosEncontrados.push({
        tipo: "descargo",
        id: descargo.id,
        descripcion: `Descargo de empleado: ${descargo.decision}`,
        fecha_creacion: descargo.confirmado_at,
        hash_almacenado: descargo.hash_sha256,
        metadata: {
          decision: descargo.decision,
          empleado: empleado?.nombre || "N/A",
        },
      });
    }

    // Buscar en bitácora
    const { data: bitacora } = await supabase
      .from("bitacora_novedades")
      .select("id, tipo, titulo, created_at, hash_sha256")
      .eq("hash_sha256", hashBuscado)
      .single();

    if (bitacora) {
      documentosEncontrados.push({
        tipo: "bitacora",
        id: bitacora.id,
        descripcion: `Entrada de bitácora: ${bitacora.titulo}`,
        fecha_creacion: bitacora.created_at,
        hash_almacenado: bitacora.hash_sha256,
        metadata: {
          tipo: bitacora.tipo,
          titulo: bitacora.titulo,
        },
      });
    }

    // Buscar en exportaciones
    const { data: exportacion } = await supabase
      .from("exportaciones_evidencia")
      .select("id, tipo, nombre_archivo, completado_at, hash_paquete")
      .eq("hash_paquete", hashBuscado)
      .single();

    if (exportacion) {
      documentosEncontrados.push({
        tipo: "paquete",
        id: exportacion.id,
        descripcion: `Paquete de evidencia: ${exportacion.nombre_archivo}`,
        fecha_creacion: exportacion.completado_at,
        hash_almacenado: exportacion.hash_paquete,
        metadata: {
          tipo_exportacion: exportacion.tipo,
          nombre_archivo: exportacion.nombre_archivo,
        },
      });
    }

    // Obtener IP y user agent para registro
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0] ||
               headersList.get("x-real-ip") ||
               "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    // Registrar la verificación
    if (documentosEncontrados.length > 0) {
      const doc = documentosEncontrados[0];
      await supabase.from("verificaciones_integridad").insert({
        tipo_documento: doc.tipo,
        documento_id: doc.id,
        hash_verificado: hashBuscado,
        hash_esperado: doc.hash_almacenado,
        verificacion_exitosa: true,
        verificado_por_externo: true,
        ip: ip,
        user_agent: userAgent,
      });
    } else {
      // Registrar intento fallido
      await supabase.from("verificaciones_integridad").insert({
        tipo_documento: "desconocido",
        hash_verificado: hashBuscado,
        verificacion_exitosa: false,
        verificado_por_externo: true,
        ip: ip,
        user_agent: userAgent,
      });
    }

    // Respuesta
    if (documentosEncontrados.length === 0) {
      return NextResponse.json({
        encontrado: false,
        hash_buscado: hashBuscado,
        mensaje: "No se encontró ningún documento con este hash en el sistema.",
        sugerencias: [
          "Verifique que el hash esté copiado correctamente (64 caracteres)",
          "Asegúrese de que el documento fue generado por NotiLegal",
          "Si el hash proviene de un archivo, recalcúlelo con una herramienta SHA-256",
        ],
      });
    }

    return NextResponse.json({
      encontrado: true,
      hash_buscado: hashBuscado,
      documentos: documentosEncontrados,
      verificacion: {
        integridad_verificada: true,
        mensaje: "El hash coincide con un documento almacenado en el sistema. El documento NO ha sido alterado.",
        fecha_verificacion: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error en verificación pública:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Información sobre el endpoint
export async function GET() {
  return NextResponse.json({
    servicio: "Verificador de Integridad Documental - NotiLegal",
    version: "2.0",
    descripcion: "API pública para verificar la integridad de documentos generados por NotiLegal",
    uso: {
      metodo: "POST",
      body: { hash: "string (SHA-256 de 64 caracteres)" },
      ejemplo: {
        hash: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
      },
    },
    tipos_verificables: [
      "notificacion - Sanciones (apercibimientos, suspensiones)",
      "confirmacion_lectura - Confirmaciones de lectura del empleado",
      "testigo - Declaraciones de testigos firmadas",
      "evidencia - Archivos de evidencia (fotos, videos, documentos)",
      "descargo - Respuestas/descargos del empleado",
      "bitacora - Entradas de bitácora de novedades",
      "paquete - Paquetes de evidencia exportados",
    ],
    verificaciones_incluidas: {
      integridad: "Hash SHA-256 del documento",
      timestamp_tsa: "Sello de tiempo RFC 3161 (fecha cierta inmediata)",
      timestamp_blockchain: "Anclaje en blockchain Bitcoin via OpenTimestamps",
      firma_digital: "Firma PKI conforme Art. 288 CCyC",
    },
    fundamento_legal: [
      "Acordada N° 3/2015 CSJN - Fecha cierta en sistemas informáticos",
      "Ley 25.506 - Firma Digital",
      "Art. 288 CCyC - Equivalencia firma digital/ológrafa",
      "RFC 3161 - Time-Stamp Protocol",
    ],
    contacto: "soporte@notilegal.com.ar",
  });
}
