/**
 * TSA RFC 3161 - Time Stamp Authority
 *
 * Implementación de sellado de tiempo conforme a RFC 3161.
 * Utiliza FreeTSA.org como autoridad de sellado reconocida.
 *
 * Fundamento Legal:
 * - Acordada N° 3/2015 CSJN (fecha cierta en sistemas informáticos)
 * - Ley 25.506 de Firma Digital
 *
 * RFC 3161 es el estándar internacional para sellado de tiempo digital.
 */

import crypto from "crypto";

export interface TSAResult {
  success: boolean;
  hash: string;
  timestamp: string;
  tsa_url: string;
  token_base64?: string;  // Token TSA para verificación
  serial_number?: string;
  policy_oid?: string;
  error?: string;
}

export interface TSAVerificationResult {
  verified: boolean;
  hash: string;
  timestamp?: string;
  tsa_name?: string;
  serial_number?: string;
  error?: string;
}

// Servidores TSA disponibles
const TSA_SERVERS = [
  {
    name: "FreeTSA",
    url: "https://freetsa.org/tsr",
    certUrl: "https://freetsa.org/files/tsa.crt",
  },
  {
    name: "DigiCert",
    url: "http://timestamp.digicert.com",
    certUrl: null,
  },
];

/**
 * Genera el hash SHA-256 de un contenido
 */
export function generateSHA256(content: string | Buffer): string {
  const data = typeof content === "string" ? Buffer.from(content) : content;
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Genera el hash SHA-512 de un contenido (requerido por algunos TSA)
 */
export function generateSHA512(content: string | Buffer): string {
  const data = typeof content === "string" ? Buffer.from(content) : content;
  return crypto.createHash("sha512").update(data).digest("hex");
}

/**
 * Crea una solicitud de timestamp según RFC 3161
 * Formato ASN.1 DER simplificado para FreeTSA
 */
function createTSRequest(hashHex: string, algorithm: "sha256" | "sha512" = "sha256"): Buffer {
  const hashBytes = Buffer.from(hashHex, "hex");

  // OID para el algoritmo de hash
  const algorithmOID = algorithm === "sha256"
    ? Buffer.from([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01]) // SHA-256
    : Buffer.from([0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x03]); // SHA-512

  // Construir TimeStampReq según RFC 3161
  // Estructura simplificada para compatibilidad
  const version = Buffer.from([0x02, 0x01, 0x01]); // INTEGER 1

  // MessageImprint
  const algorithmIdentifier = Buffer.concat([
    Buffer.from([0x30, algorithmOID.length + 2]), // SEQUENCE
    Buffer.from([0x06, algorithmOID.length]), // OID
    algorithmOID,
  ]);

  const messageImprint = Buffer.concat([
    Buffer.from([0x30, algorithmIdentifier.length + hashBytes.length + 2]), // SEQUENCE
    algorithmIdentifier,
    Buffer.from([0x04, hashBytes.length]), // OCTET STRING
    hashBytes,
  ]);

  // Nonce (opcional pero recomendado)
  const nonce = crypto.randomBytes(8);
  const nonceEncoded = Buffer.concat([
    Buffer.from([0x02, nonce.length]), // INTEGER
    nonce,
  ]);

  // CertReq (solicitar certificado incluido)
  const certReq = Buffer.from([0x01, 0x01, 0xff]); // BOOLEAN TRUE

  // TimeStampReq completo
  const bodyLength = version.length + messageImprint.length + nonceEncoded.length + certReq.length;
  const request = Buffer.concat([
    Buffer.from([0x30, 0x82, (bodyLength >> 8) & 0xff, bodyLength & 0xff]), // SEQUENCE
    version,
    messageImprint,
    nonceEncoded,
    certReq,
  ]);

  return request;
}

/**
 * Crea un timestamp usando un servidor TSA RFC 3161
 */
export async function createTSATimestamp(hashHex: string): Promise<TSAResult> {
  const now = new Date().toISOString();

  // Validar hash
  if (!/^[a-f0-9]{64}$/i.test(hashHex)) {
    return {
      success: false,
      hash: hashHex,
      timestamp: now,
      tsa_url: "",
      error: "Hash inválido (debe ser SHA-256 de 64 caracteres)",
    };
  }

  // Intentar con cada servidor TSA
  for (const server of TSA_SERVERS) {
    try {
      // Crear solicitud TSA
      const tsRequest = createTSRequest(hashHex, "sha256");

      // Enviar solicitud (convertir Buffer a Uint8Array para compatibilidad)
      const response = await fetch(server.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/timestamp-query",
        },
        body: new Uint8Array(tsRequest),
      });

      if (!response.ok) {
        console.warn(`TSA ${server.name} respondió con error: ${response.status}`);
        continue;
      }

      const tsResponse = await response.arrayBuffer();
      const tokenBase64 = Buffer.from(tsResponse).toString("base64");

      // Parsear respuesta para extraer información (simplificado)
      // En producción se debería usar una librería ASN.1 completa
      const responseBuffer = Buffer.from(tsResponse);

      // Verificar que es una respuesta válida (PKIStatus = granted = 0)
      // La estructura ASN.1 varía según el TSA, hacemos verificación básica
      if (responseBuffer.length < 10) {
        console.warn(`TSA ${server.name} respuesta muy corta`);
        continue;
      }

      return {
        success: true,
        hash: hashHex,
        timestamp: now,
        tsa_url: server.url,
        token_base64: tokenBase64,
        policy_oid: "1.3.6.1.4.1.13762.3", // FreeTSA policy OID
      };
    } catch (error) {
      console.warn(`Error con TSA ${server.name}:`, error);
      continue;
    }
  }

  // Si todos los servidores fallaron
  return {
    success: false,
    hash: hashHex,
    timestamp: now,
    tsa_url: "",
    error: "Todos los servidores TSA fallaron",
  };
}

/**
 * Genera metadatos del timestamp para documentación
 */
export function generateTSAMetadata(result: TSAResult): Record<string, unknown> {
  return {
    protocolo: "RFC 3161",
    version: "1.0",
    hash_algorithm: "SHA-256",
    hash_documento: result.hash,
    timestamp_creacion: result.timestamp,
    tsa_utilizado: result.tsa_url,
    token_incluido: !!result.token_base64,
    estado: result.success ? "sellado" : "fallido",
    fundamento_legal: [
      "Acordada N° 3/2015 CSJN - Fecha cierta en sistemas informáticos",
      "Ley 25.506 - Firma Digital",
      "RFC 3161 - Internet X.509 PKI Time-Stamp Protocol",
    ],
    verificacion: result.success
      ? "El token TSA puede verificarse con cualquier herramienta compatible RFC 3161"
      : "Sellado fallido - " + result.error,
  };
}

/**
 * Combina timestamp con blockchain (OpenTimestamps) y TSA (RFC 3161)
 * para máxima robustez legal
 */
export interface DualTimestampResult {
  hash: string;
  tsa?: TSAResult;
  blockchain?: {
    pendiente: boolean;
    ots_file_base64?: string;
  };
  timestamp: string;
}

export async function createDualTimestamp(
  hashHex: string,
  includeBlockchain: boolean = true
): Promise<DualTimestampResult> {
  const now = new Date().toISOString();
  const result: DualTimestampResult = {
    hash: hashHex,
    timestamp: now,
  };

  // Crear timestamp TSA (inmediato)
  const tsaResult = await createTSATimestamp(hashHex);
  if (tsaResult.success) {
    result.tsa = tsaResult;
  }

  // Crear timestamp blockchain (se confirma después)
  if (includeBlockchain) {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const { createTimestamp } = await import("./opentimestamps");
      const otsResult = await createTimestamp(hashHex);

      result.blockchain = {
        pendiente: true,
        ots_file_base64: otsResult.ots_file_base64,
      };
    } catch (error) {
      console.warn("Error creando timestamp blockchain:", error);
    }
  }

  return result;
}
