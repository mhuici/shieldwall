/**
 * API Route: Registrar Timestamp Dual
 *
 * POST /api/timestamp/registrar
 *
 * Registra timestamps TSA y/o blockchain para un documento.
 * Llamado automáticamente después de crear documentos.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTSAMetadata, type TSAResult } from "@/lib/timestamp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

interface RequestBody {
  tipo_documento: string;
  documento_id: string;
  hash: string;
  tsa?: {
    timestamp: string;
    token_base64: string;
    tsa_url: string;
  } | null;
  blockchain?: {
    ots_file_base64: string;
  } | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { tipo_documento, documento_id, hash, tsa, blockchain } = body;

    // Validaciones
    if (!tipo_documento || !documento_id || !hash) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (!/^[a-f0-9]{64}$/i.test(hash)) {
      return NextResponse.json(
        { error: "Hash inválido" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ahora = new Date().toISOString();

    // Determinar si es dual timestamp
    const dualTimestamp = !!tsa && !!blockchain;

    // Registrar en timestamps_blockchain
    const { data: timestampRecord, error: insertError } = await supabase
      .from("timestamps_blockchain")
      .insert({
        tipo_documento,
        documento_id,
        hash_sha256: hash,
        // Blockchain (OpenTimestamps)
        ots_file_base64: blockchain?.ots_file_base64 || null,
        estado: blockchain ? "pendiente" : "no_creado",
        // TSA RFC 3161
        tsa_timestamp: tsa ? tsa.timestamp : null,
        tsa_token_base64: tsa?.token_base64 || null,
        tsa_url: tsa?.tsa_url || null,
        tsa_estado: tsa ? "sellado" : "no_creado",
        dual_timestamp: dualTimestamp,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error insertando timestamp:", insertError);
      return NextResponse.json(
        { error: "Error al guardar timestamp" },
        { status: 500 }
      );
    }

    // Si hay TSA, registrar también en sellos_tsa
    if (tsa) {
      await supabase.from("sellos_tsa").insert({
        tipo_documento,
        documento_id,
        hash_sha256: hash,
        tsa_url: tsa.tsa_url,
        token_base64: tsa.token_base64,
      });
    }

    // Actualizar el documento original con los datos de timestamp
    if (tipo_documento === "notificacion") {
      const updateData: Record<string, unknown> = {};

      if (tsa) {
        updateData.tsa_timestamp = tsa.timestamp;
        updateData.tsa_token_base64 = tsa.token_base64;
        updateData.tsa_url = tsa.tsa_url;
        updateData.tsa_estado = "sellado";
        updateData.tsa_metadata = generateTSAMetadata({
          success: true,
          hash,
          timestamp: tsa.timestamp,
          tsa_url: tsa.tsa_url,
          token_base64: tsa.token_base64,
        } as TSAResult);
      }

      if (blockchain) {
        updateData.ots_file_base64 = blockchain.ots_file_base64;
        updateData.ots_estado = "pendiente";
        updateData.ots_timestamp_pendiente = ahora;
      }

      if (Object.keys(updateData).length > 0) {
        await supabase
          .from("notificaciones")
          .update(updateData)
          .eq("id", documento_id);
      }

      // Registrar evento
      await supabase.from("eventos").insert({
        notificacion_id: documento_id,
        tipo: "timestamp_creado",
        metadata: {
          timestamp_id: timestampRecord.id,
          tsa_incluido: !!tsa,
          blockchain_incluido: !!blockchain,
          dual_timestamp: dualTimestamp,
          hash,
        },
      });
    }

    return NextResponse.json({
      success: true,
      timestamp_id: timestampRecord.id,
      tsa_incluido: !!tsa,
      blockchain_incluido: !!blockchain,
      dual_timestamp: dualTimestamp,
    });
  } catch (error) {
    console.error("Error en registrar timestamp:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
