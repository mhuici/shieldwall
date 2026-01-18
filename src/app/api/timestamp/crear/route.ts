/**
 * API Route: Crear OpenTimestamp
 *
 * POST /api/timestamp/crear
 *
 * Crea un timestamp en blockchain de Bitcoin para un documento.
 * El timestamp proporciona fecha cierta irrefutable.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  createTimestamp,
  generateTimestampMetadata,
} from "@/lib/timestamp/opentimestamps";

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

    const body = await request.json();
    const { tipo_documento, documento_id, hash } = body;

    if (!tipo_documento || !documento_id || !hash) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: tipo_documento, documento_id, hash" },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const tiposValidos = [
      "notificacion",
      "convenio",
      "testigo",
      "descargo",
      "evidencia",
      "bitacora",
    ];
    if (!tiposValidos.includes(tipo_documento)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido" },
        { status: 400 }
      );
    }

    // Validar hash (SHA-256 = 64 caracteres hex)
    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return NextResponse.json(
        { error: "Hash inválido (debe ser SHA-256)" },
        { status: 400 }
      );
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

    // Verificar que el documento existe y pertenece a la empresa
    let documentoValido = false;

    if (tipo_documento === "notificacion") {
      const { data: notif } = await supabase
        .from("notificaciones")
        .select("id, hash_sha256")
        .eq("id", documento_id)
        .eq("empresa_id", empresa.id)
        .single();

      documentoValido = !!notif && notif.hash_sha256 === hash;
    }
    // Agregar más validaciones para otros tipos de documentos según sea necesario

    if (!documentoValido) {
      return NextResponse.json(
        { error: "Documento no encontrado o hash no coincide" },
        { status: 404 }
      );
    }

    // Crear timestamp
    const result = await createTimestamp(hash);

    // Guardar en tabla de timestamps
    const { data: timestamp, error: insertError } = await supabase
      .from("timestamps_blockchain")
      .insert({
        tipo_documento,
        documento_id,
        empresa_id: empresa.id,
        hash_sha256: hash,
        ots_file_base64: result.ots_file_base64,
        estado: result.success ? "pendiente" : "fallido",
        error_mensaje: result.error,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error guardando timestamp:", insertError);
      return NextResponse.json(
        { error: "Error al guardar timestamp" },
        { status: 500 }
      );
    }

    // Si es una notificación, actualizar también la tabla de notificaciones
    if (tipo_documento === "notificacion" && result.success) {
      await supabase
        .from("notificaciones")
        .update({
          ots_timestamp_pendiente: result.timestamp_pendiente,
          ots_file_base64: result.ots_file_base64,
          ots_estado: "pendiente",
          ots_metadata: generateTimestampMetadata(hash, result),
        })
        .eq("id", documento_id);
    }

    // Registrar evento
    if (tipo_documento === "notificacion") {
      await supabase.from("eventos").insert({
        notificacion_id: documento_id,
        tipo: "timestamp_creado",
        metadata: {
          success: result.success,
          hash,
          timestamp_id: timestamp.id,
          blockchain: "Bitcoin",
          error: result.error,
        },
      });
    }

    return NextResponse.json({
      success: result.success,
      timestamp_id: timestamp.id,
      hash,
      estado: result.success ? "pendiente" : "fallido",
      mensaje: result.success
        ? "Timestamp creado. Será confirmado en blockchain de Bitcoin en 1-24 horas."
        : "Error al crear timestamp: " + result.error,
      metadata: generateTimestampMetadata(hash, result),
    });
  } catch (error) {
    console.error("Error en crear timestamp:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
