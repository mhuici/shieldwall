/**
 * API Route: Verificar Timestamps Pendientes
 *
 * GET /api/cron/verificar-timestamps
 *
 * Cron job que verifica timestamps pendientes en OpenTimestamps.
 * Los timestamps toman entre 1-24 horas en confirmarse en blockchain.
 *
 * Ejecutar cada 6 horas con cron: `0 0,6,12,18 * * *`
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyTimestamp } from "@/lib/timestamp/opentimestamps";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autorización con CRON_SECRET
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    const ahora = new Date().toISOString();

    // Buscar timestamps pendientes (creados hace más de 1 hora)
    const unaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: pendientes, error: fetchError } = await supabase
      .from("timestamps_blockchain")
      .select("*")
      .eq("estado", "pendiente")
      .lt("created_at", unaHoraAtras)
      .lt("intentos_verificacion", 10) // Máximo 10 intentos
      .order("created_at", { ascending: true })
      .limit(50);

    if (fetchError) {
      console.error("Error obteniendo timestamps pendientes:", fetchError);
      return NextResponse.json(
        { error: "Error al obtener timestamps" },
        { status: 500 }
      );
    }

    if (!pendientes || pendientes.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: "No hay timestamps pendientes para verificar",
        verificados: 0,
        timestamp: ahora,
      });
    }

    const resultados = {
      verificados: 0,
      confirmados: 0,
      pendientes: 0,
      errores: 0,
      detalles: [] as Array<{
        id: string;
        hash: string;
        estado: string;
        bitcoin_block?: number;
      }>,
    };

    for (const ts of pendientes) {
      if (!ts.ots_file_base64) {
        resultados.errores++;
        continue;
      }

      try {
        // Verificar timestamp
        const result = await verifyTimestamp(ts.hash_sha256, ts.ots_file_base64);

        resultados.verificados++;

        if (result.verified && result.bitcoin_attestation) {
          // Confirmado en blockchain
          resultados.confirmados++;

          await supabase
            .from("timestamps_blockchain")
            .update({
              estado: "confirmado",
              bitcoin_block_height: result.bitcoin_attestation.block_height,
              bitcoin_block_hash: result.bitcoin_attestation.block_hash,
              bitcoin_block_time: result.bitcoin_attestation.block_time,
              confirmado_at: ahora,
              verificado_at: ahora,
              intentos_verificacion: ts.intentos_verificacion + 1,
            })
            .eq("id", ts.id);

          // Si es notificación, actualizar también
          if (ts.tipo_documento === "notificacion") {
            await supabase
              .from("notificaciones")
              .update({
                ots_estado: "confirmado",
                ots_timestamp_confirmado: ahora,
                ots_bitcoin_block_height: result.bitcoin_attestation.block_height,
                ots_bitcoin_block_hash: result.bitcoin_attestation.block_hash,
              })
              .eq("id", ts.documento_id);

            // Registrar evento
            await supabase.from("eventos").insert({
              notificacion_id: ts.documento_id,
              tipo: "timestamp_confirmado",
              metadata: {
                timestamp_id: ts.id,
                bitcoin_block_height: result.bitcoin_attestation.block_height,
                bitcoin_block_hash: result.bitcoin_attestation.block_hash,
                bitcoin_block_time: result.bitcoin_attestation.block_time,
              },
            });
          }

          resultados.detalles.push({
            id: ts.id,
            hash: ts.hash_sha256.substring(0, 16) + "...",
            estado: "confirmado",
            bitcoin_block: result.bitcoin_attestation.block_height,
          });
        } else {
          // Aún pendiente
          resultados.pendientes++;

          await supabase
            .from("timestamps_blockchain")
            .update({
              verificado_at: ahora,
              intentos_verificacion: ts.intentos_verificacion + 1,
            })
            .eq("id", ts.id);

          resultados.detalles.push({
            id: ts.id,
            hash: ts.hash_sha256.substring(0, 16) + "...",
            estado: "pendiente",
          });
        }
      } catch (error) {
        console.error(`Error verificando timestamp ${ts.id}:`, error);
        resultados.errores++;

        await supabase
          .from("timestamps_blockchain")
          .update({
            intentos_verificacion: ts.intentos_verificacion + 1,
            error_mensaje: error instanceof Error ? error.message : "Error desconocido",
          })
          .eq("id", ts.id);
      }
    }

    return NextResponse.json({
      success: true,
      mensaje: `Verificados ${resultados.verificados} timestamps`,
      ...resultados,
      timestamp: ahora,
    });
  } catch (error) {
    console.error("Error en cron de timestamps:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
