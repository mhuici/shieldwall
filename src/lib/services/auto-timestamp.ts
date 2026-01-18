/**
 * Auto-Timestamp Service
 *
 * Servicio para crear automáticamente timestamps (TSA + Blockchain)
 * cuando se crean notificaciones u otros documentos.
 *
 * Uso:
 * - Llamar después de crear una notificación
 * - Es asíncrono y no bloquea el flujo principal
 */

import { createDualTimestamp, generateTSAMetadata } from "@/lib/timestamp";

interface TimestampDocumentoOptions {
  tipo_documento: "notificacion" | "convenio" | "testigo" | "descargo" | "evidencia";
  documento_id: string;
  hash_sha256: string;
  includeBlockchain?: boolean;
}

/**
 * Crea timestamps para un documento de forma asíncrona
 * Llama a la API para que se registren en la base de datos
 */
export async function crearTimestampDocumento(
  options: TimestampDocumentoOptions
): Promise<{ success: boolean; error?: string }> {
  const { tipo_documento, documento_id, hash_sha256, includeBlockchain = true } = options;

  try {
    // Crear timestamp dual (TSA inmediato + blockchain pendiente)
    const result = await createDualTimestamp(hash_sha256, includeBlockchain);

    // Guardar en la base de datos vía API
    const response = await fetch("/api/timestamp/registrar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo_documento,
        documento_id,
        hash: hash_sha256,
        tsa: result.tsa ? {
          timestamp: result.tsa.timestamp,
          token_base64: result.tsa.token_base64,
          tsa_url: result.tsa.tsa_url,
        } : null,
        blockchain: result.blockchain ? {
          ots_file_base64: result.blockchain.ots_file_base64,
        } : null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error creando timestamp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Función helper para llamar desde el cliente después de crear una notificación
 * No bloquea el flujo principal (fire-and-forget)
 */
export function timestampNotificacionAsync(
  notificacionId: string,
  hash: string
): void {
  // Fire and forget - no await
  crearTimestampDocumento({
    tipo_documento: "notificacion",
    documento_id: notificacionId,
    hash_sha256: hash,
    includeBlockchain: true,
  }).then((result) => {
    if (!result.success) {
      console.warn("Timestamp async falló:", result.error);
    }
  }).catch((error) => {
    console.warn("Error en timestamp async:", error);
  });
}
