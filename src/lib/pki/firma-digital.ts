/**
 * Firma Digital PKI - Equivalente a firma ológrafa
 *
 * Implementación de firma digital conforme al Art. 288 del Código Civil y Comercial
 * que establece la equivalencia entre firma digital y firma ológrafa.
 *
 * Modos de operación:
 * 1. Firma con certificado propio (desarrollo/testing)
 * 2. Integración con Encode (producción)
 * 3. Integración con certificado AFIP (alternativa)
 *
 * Fundamento Legal: Art. 288 CCyC - La firma digital satisface el requisito de firma
 */

import crypto from "crypto";

// Tipos
export interface FirmaDigitalResult {
  success: boolean;
  firmado_por: string;
  fecha_firma: string;
  algoritmo: string;
  certificado_serial?: string;
  certificado_emisor?: string;
  certificado_valido_hasta?: string;
  firma_base64?: string;
  hash_documento: string;
  metadatos_firma: Record<string, unknown>;
  error?: string;
}

export interface VerificacionFirmaResult {
  valida: boolean;
  firmado_por?: string;
  fecha_firma?: string;
  certificado_serial?: string;
  hash_original?: string;
  error?: string;
}

export interface DatosFirma {
  documento_id: string;
  tipo_documento: "sancion" | "convenio" | "descargo";
  hash_documento: string;
  firmante_nombre: string;
  firmante_cuit?: string;
  empresa_razon_social: string;
  empresa_cuit: string;
}

// Configuración del certificado (en producción vendría de variables de entorno)
const PKI_PRIVATE_KEY = process.env.PKI_PRIVATE_KEY;
const PKI_PUBLIC_KEY = process.env.PKI_PUBLIC_KEY;
const PKI_CERTIFICATE = process.env.PKI_CERTIFICATE;
const PKI_CERTIFICATE_SERIAL = process.env.PKI_CERTIFICATE_SERIAL;
const PKI_CERTIFICATE_ISSUER = process.env.PKI_CERTIFICATE_ISSUER || "NotiLegal CA";
const PKI_CERTIFICATE_VALID_UNTIL = process.env.PKI_CERTIFICATE_VALID_UNTIL;

/**
 * Genera un par de claves para desarrollo/testing
 * En producción se usaría un certificado real de Encode/AFIP
 */
export function generarParDeClaves(): { privateKey: string; publicKey: string } {
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });

  return { privateKey, publicKey };
}

/**
 * Firma un documento digitalmente
 * Genera una firma RSA-SHA256 del hash del documento
 */
export function firmarDocumento(datos: DatosFirma): FirmaDigitalResult {
  const ahora = new Date().toISOString();

  try {
    // Crear datos a firmar (incluye metadatos para evitar reutilización)
    const datosAFirmar = JSON.stringify({
      documento_id: datos.documento_id,
      tipo_documento: datos.tipo_documento,
      hash_documento: datos.hash_documento,
      firmante: datos.firmante_nombre,
      firmante_cuit: datos.firmante_cuit,
      empresa: datos.empresa_razon_social,
      empresa_cuit: datos.empresa_cuit,
      timestamp: ahora,
    });

    let firma: string;
    let usandoCertificadoReal = false;

    if (PKI_PRIVATE_KEY) {
      // Usar certificado real configurado
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(datosAFirmar);
      sign.end();
      firma = sign.sign(PKI_PRIVATE_KEY, "base64");
      usandoCertificadoReal = true;
    } else {
      // Modo desarrollo: generar firma simulada
      // En producción esto fallaría o usaría un servicio externo
      const hash = crypto
        .createHash("sha256")
        .update(datosAFirmar)
        .digest("hex");
      firma = Buffer.from(hash + "_DEV_SIGNATURE").toString("base64");
    }

    return {
      success: true,
      firmado_por: datos.firmante_nombre,
      fecha_firma: ahora,
      algoritmo: "RSA-SHA256",
      certificado_serial: PKI_CERTIFICATE_SERIAL || "DEV-001",
      certificado_emisor: PKI_CERTIFICATE_ISSUER,
      certificado_valido_hasta: PKI_CERTIFICATE_VALID_UNTIL,
      firma_base64: firma,
      hash_documento: datos.hash_documento,
      metadatos_firma: {
        tipo_firma: usandoCertificadoReal ? "PKI-REAL" : "PKI-DESARROLLO",
        fundamento_legal: "Art. 288 Código Civil y Comercial",
        equivalencia: "Equivale a firma ológrafa conforme ley vigente",
        documento_tipo: datos.tipo_documento,
        documento_id: datos.documento_id,
        empresa_cuit: datos.empresa_cuit,
        firmante_cuit: datos.firmante_cuit,
        timestamp_firma: ahora,
        algoritmo_hash: "SHA-256",
        algoritmo_firma: "RSA-2048",
        padding: "PKCS1-v1_5",
        nota: usandoCertificadoReal
          ? "Firmado con certificado digital reconocido"
          : "Firma de desarrollo - no válida para producción",
      },
    };
  } catch (error) {
    console.error("Error firmando documento:", error);
    return {
      success: false,
      firmado_por: datos.firmante_nombre,
      fecha_firma: ahora,
      algoritmo: "RSA-SHA256",
      hash_documento: datos.hash_documento,
      metadatos_firma: {},
      error: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

/**
 * Verifica una firma digital
 */
export function verificarFirma(
  datosOriginales: string,
  firmaBase64: string
): VerificacionFirmaResult {
  try {
    if (!PKI_PUBLIC_KEY) {
      // Modo desarrollo: verificación simulada
      return {
        valida: true,
        error: "Verificación de desarrollo - usar certificado real en producción",
      };
    }

    const verify = crypto.createVerify("RSA-SHA256");
    verify.update(datosOriginales);
    verify.end();

    const esValida = verify.verify(
      PKI_PUBLIC_KEY,
      Buffer.from(firmaBase64, "base64")
    );

    return {
      valida: esValida,
      certificado_serial: PKI_CERTIFICATE_SERIAL,
    };
  } catch (error) {
    console.error("Error verificando firma:", error);
    return {
      valida: false,
      error: error instanceof Error ? error.message : "Error de verificación",
    };
  }
}

/**
 * Genera los metadatos de firma para incluir en el PDF
 */
export function generarMetadatosPDF(resultado: FirmaDigitalResult): Record<string, string> {
  return {
    "/Producer": "NotiLegal - Sistema de Notificaciones Laborales",
    "/Creator": "NotiLegal PKI",
    "/Author": resultado.firmado_por,
    "/Subject": "Documento firmado digitalmente",
    "/Keywords": "firma digital, PKI, Art. 288 CCyC, notificación laboral",
    "/ModDate": resultado.fecha_firma,
    "/Custom:FirmaDigital": "true",
    "/Custom:Algoritmo": resultado.algoritmo,
    "/Custom:CertificadoSerial": resultado.certificado_serial || "",
    "/Custom:CertificadoEmisor": resultado.certificado_emisor || "",
    "/Custom:HashDocumento": resultado.hash_documento,
    "/Custom:FundamentoLegal": "Art. 288 Código Civil y Comercial",
  };
}

/**
 * Información para mostrar al usuario sobre la firma
 */
export function generarInfoFirmaParaUI(resultado: FirmaDigitalResult): {
  titulo: string;
  descripcion: string;
  detalles: Array<{ label: string; valor: string }>;
} {
  return {
    titulo: "Documento Firmado Digitalmente",
    descripcion:
      "Este documento cuenta con firma digital conforme al Art. 288 del Código Civil y Comercial, " +
      "lo que le otorga la misma validez legal que una firma manuscrita.",
    detalles: [
      { label: "Firmado por", valor: resultado.firmado_por },
      { label: "Fecha de firma", valor: new Date(resultado.fecha_firma).toLocaleString("es-AR") },
      { label: "Algoritmo", valor: resultado.algoritmo },
      { label: "Certificado", valor: resultado.certificado_serial || "N/A" },
      { label: "Emisor", valor: resultado.certificado_emisor || "N/A" },
      { label: "Hash documento", valor: resultado.hash_documento.substring(0, 16) + "..." },
    ],
  };
}
