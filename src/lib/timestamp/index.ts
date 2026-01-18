/**
 * Timestamp Library
 *
 * Combina múltiples fuentes de sellado de tiempo para máxima validez legal:
 * 1. TSA RFC 3161 - Fecha cierta inmediata de autoridad reconocida
 * 2. OpenTimestamps - Anclaje en blockchain de Bitcoin (confirmación posterior)
 *
 * Fundamento Legal:
 * - Acordada N° 3/2015 CSJN
 * - Ley 25.506 de Firma Digital
 */

export {
  generateHash,
  createTimestamp,
  verifyTimestamp,
  generateTimestampMetadata,
  getBlockExplorerUrl,
  type TimestampResult,
  type VerificationResult,
} from "./opentimestamps";

export {
  generateSHA256,
  generateSHA512,
  createTSATimestamp,
  generateTSAMetadata,
  createDualTimestamp,
  type TSAResult,
  type TSAVerificationResult,
  type DualTimestampResult,
} from "./tsa-rfc3161";
