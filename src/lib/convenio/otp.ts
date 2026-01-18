import crypto from "crypto";

/**
 * Genera un código OTP de 6 dígitos
 */
export function generarCodigoOTP(): string {
  // Genera un número aleatorio criptográficamente seguro
  const randomBytes = crypto.randomBytes(4);
  const randomNum = randomBytes.readUInt32BE(0);
  // Convertir a 6 dígitos
  const codigo = (randomNum % 1000000).toString().padStart(6, "0");
  return codigo;
}

/**
 * Genera hash SHA-256 de un código OTP
 */
export function hashCodigoOTP(codigo: string): string {
  return crypto.createHash("sha256").update(codigo).digest("hex");
}

/**
 * Verifica si un código OTP coincide con su hash
 */
export function verificarCodigoOTP(codigo: string, hash: string): boolean {
  const codigoHash = hashCodigoOTP(codigo);
  return codigoHash === hash;
}

/**
 * Genera un hash SHA-256 de un objeto (para convenio completo)
 */
export function generarHashConvenio(datos: Record<string, unknown>): string {
  const datosOrdenados = JSON.stringify(datos, Object.keys(datos).sort());
  return crypto.createHash("sha256").update(datosOrdenados).digest("hex");
}
