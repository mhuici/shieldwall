/**
 * OpenTimestamps - Integración para fecha cierta en blockchain
 *
 * OpenTimestamps es un protocolo abierto que ancla hashes en la blockchain de Bitcoin,
 * proporcionando prueba irrefutable de que un documento existía en una fecha determinada.
 *
 * Fundamento Legal: Acordada N° 3/2015 CSJN (fecha cierta en sistemas informáticos)
 */

import crypto from "crypto";

// Tipos
export interface TimestampResult {
  success: boolean;
  hash: string;
  timestamp_pendiente?: string;   // Timestamp inicial (antes de confirmar en blockchain)
  timestamp_confirmado?: string;  // Timestamp final (después de confirmar)
  bitcoin_block_height?: number;
  bitcoin_block_hash?: string;
  ots_file_base64?: string;       // Archivo .ots en base64 para verificación
  error?: string;
  created_at: string;
}

export interface VerificationResult {
  verified: boolean;
  hash: string;
  timestamp?: string;
  bitcoin_attestation?: {
    block_height: number;
    block_hash: string;
    block_time: string;
  };
  error?: string;
}

/**
 * Genera el hash SHA-256 de un contenido
 */
export function generateHash(content: string | Buffer): string {
  const data = typeof content === "string" ? Buffer.from(content) : content;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Crea un timestamp usando el servicio público de OpenTimestamps
 * El timestamp se confirma en la blockchain de Bitcoin (puede tardar horas/días)
 */
export async function createTimestamp(hash: string): Promise<TimestampResult> {
  const now = new Date().toISOString();

  try {
    // Convertir hash hex a bytes
    const hashBytes = Buffer.from(hash, "hex");

    // Llamar al servidor público de OpenTimestamps
    const response = await fetch("https://a.pool.opentimestamps.org/digest", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/vnd.opentimestamps.v1",
      },
      body: hashBytes,
    });

    if (!response.ok) {
      // Si el servidor principal falla, intentar con el secundario
      const backupResponse = await fetch(
        "https://b.pool.opentimestamps.org/digest",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/vnd.opentimestamps.v1",
          },
          body: hashBytes,
        }
      );

      if (!backupResponse.ok) {
        throw new Error(`Error del servidor: ${backupResponse.status}`);
      }

      const otsData = await backupResponse.arrayBuffer();
      const otsBase64 = Buffer.from(otsData).toString("base64");

      return {
        success: true,
        hash,
        timestamp_pendiente: now,
        ots_file_base64: otsBase64,
        created_at: now,
      };
    }

    const otsData = await response.arrayBuffer();
    const otsBase64 = Buffer.from(otsData).toString("base64");

    return {
      success: true,
      hash,
      timestamp_pendiente: now,
      ots_file_base64: otsBase64,
      created_at: now,
    };
  } catch (error) {
    console.error("Error creando timestamp:", error);

    // Fallback: crear registro local con fecha del servidor
    // Esto no es tan robusto como blockchain pero sirve como respaldo
    return {
      success: false,
      hash,
      error: error instanceof Error ? error.message : "Error desconocido",
      created_at: now,
    };
  }
}

/**
 * Verifica un timestamp existente (requiere el archivo .ots)
 * Nota: La verificación completa requiere que el timestamp esté confirmado en blockchain
 */
export async function verifyTimestamp(
  hash: string,
  otsFileBase64: string
): Promise<VerificationResult> {
  try {
    const otsBytes = Buffer.from(otsFileBase64, "base64");

    // Llamar al servicio de verificación
    const response = await fetch(
      `https://a.pool.opentimestamps.org/verify?hash=${hash}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.opentimestamps.v1",
        },
        body: otsBytes,
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return {
          verified: false,
          hash,
          error: "Timestamp aún no confirmado en blockchain (pendiente)",
        };
      }
      throw new Error(`Error de verificación: ${response.status}`);
    }

    const result = await response.json();

    return {
      verified: true,
      hash,
      timestamp: result.timestamp,
      bitcoin_attestation: result.attestation
        ? {
            block_height: result.attestation.height,
            block_hash: result.attestation.hash,
            block_time: result.attestation.time,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error verificando timestamp:", error);
    return {
      verified: false,
      hash,
      error: error instanceof Error ? error.message : "Error de verificación",
    };
  }
}

/**
 * Genera datos del timestamp para incluir en el JSON de cadena de custodia
 */
export function generateTimestampMetadata(
  hash: string,
  result: TimestampResult
): Record<string, unknown> {
  return {
    protocolo: "OpenTimestamps",
    version: "1.0",
    hash_algorithm: "SHA-256",
    hash_documento: hash,
    timestamp_creacion: result.created_at,
    estado: result.success ? "pendiente_confirmacion" : "fallido",
    blockchain: "Bitcoin",
    servidores_utilizados: [
      "https://a.pool.opentimestamps.org",
      "https://b.pool.opentimestamps.org",
    ],
    archivo_ots_incluido: !!result.ots_file_base64,
    fundamento_legal: "Acordada N° 3/2015 CSJN - Fecha cierta en sistemas informáticos",
    nota: result.success
      ? "El timestamp estará confirmado en blockchain de Bitcoin en aproximadamente 1-24 horas"
      : "Timestamp fallido - se conserva registro local con fecha del servidor",
  };
}

/**
 * Obtiene la URL del explorador de blockchain para verificación pública
 */
export function getBlockExplorerUrl(
  blockHeight?: number,
  blockHash?: string
): string | null {
  if (!blockHeight && !blockHash) return null;

  if (blockHash) {
    return `https://blockstream.info/block/${blockHash}`;
  }

  if (blockHeight) {
    return `https://blockstream.info/block-height/${blockHeight}`;
  }

  return null;
}
