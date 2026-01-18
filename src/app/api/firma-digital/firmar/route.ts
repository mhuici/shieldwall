/**
 * API Route: Firmar Documento Digitalmente
 *
 * POST /api/firma-digital/firmar
 *
 * Aplica firma digital PKI a un documento (sanción, convenio, etc.)
 * Fundamento: Art. 288 CCyC - Equivalencia con firma ológrafa
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  firmarDocumento,
  generarInfoFirmaParaUI,
} from "@/lib/pki/firma-digital";

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
    const { tipo_documento, documento_id } = body;

    if (!tipo_documento || !documento_id) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: tipo_documento, documento_id" },
        { status: 400 }
      );
    }

    // Validar tipo de documento
    const tiposValidos = ["sancion", "convenio", "descargo"];
    if (!tiposValidos.includes(tipo_documento)) {
      return NextResponse.json(
        { error: "Tipo de documento inválido" },
        { status: 400 }
      );
    }

    // Obtener empresa del usuario
    const { data: empresa } = await supabase
      .from("empresas")
      .select("id, razon_social, cuit")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Obtener documento a firmar
    let documento: { id: string; hash_sha256: string; firma_digital_aplicada?: boolean } | null = null;

    if (tipo_documento === "sancion") {
      const { data: notif } = await supabase
        .from("notificaciones")
        .select("id, hash_sha256, firma_digital_aplicada")
        .eq("id", documento_id)
        .eq("empresa_id", empresa.id)
        .single();

      documento = notif;
    }
    // Agregar más tipos según sea necesario

    if (!documento) {
      return NextResponse.json(
        { error: "Documento no encontrado" },
        { status: 404 }
      );
    }

    if (!documento.hash_sha256) {
      return NextResponse.json(
        { error: "El documento no tiene hash para firmar" },
        { status: 400 }
      );
    }

    if (documento.firma_digital_aplicada) {
      return NextResponse.json(
        { error: "El documento ya tiene firma digital" },
        { status: 400 }
      );
    }

    // Obtener IP y user agent
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Firmar documento
    const resultado = firmarDocumento({
      documento_id,
      tipo_documento,
      hash_documento: documento.hash_sha256,
      firmante_nombre: user.email || "Usuario NotiLegal",
      empresa_razon_social: empresa.razon_social,
      empresa_cuit: empresa.cuit,
    });

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Error al firmar documento: " + resultado.error },
        { status: 500 }
      );
    }

    // Guardar firma en tabla de firmas
    const { data: firma, error: firmaError } = await supabase
      .from("firmas_digitales")
      .insert({
        tipo_documento,
        documento_id,
        empresa_id: empresa.id,
        hash_documento: documento.hash_sha256,
        firmante_nombre: resultado.firmado_por,
        algoritmo: resultado.algoritmo,
        firma_base64: resultado.firma_base64,
        certificado_serial: resultado.certificado_serial,
        certificado_emisor: resultado.certificado_emisor,
        certificado_tipo: resultado.metadatos_firma.tipo_firma === "PKI-REAL" ? "encode" : "desarrollo",
        metadata: resultado.metadatos_firma,
        ip_firma: ip,
        user_agent_firma: userAgent,
      })
      .select()
      .single();

    if (firmaError) {
      console.error("Error guardando firma:", firmaError);
      return NextResponse.json(
        { error: "Error al guardar firma" },
        { status: 500 }
      );
    }

    // Actualizar documento con datos de firma
    if (tipo_documento === "sancion") {
      await supabase
        .from("notificaciones")
        .update({
          firma_digital_aplicada: true,
          firma_digital_fecha: resultado.fecha_firma,
          firma_digital_firmante: resultado.firmado_por,
          firma_digital_algoritmo: resultado.algoritmo,
          firma_digital_certificado_serial: resultado.certificado_serial,
          firma_digital_certificado_emisor: resultado.certificado_emisor,
          firma_digital_base64: resultado.firma_base64,
          firma_digital_metadata: resultado.metadatos_firma,
        })
        .eq("id", documento_id);

      // Registrar evento
      await supabase.from("eventos").insert({
        notificacion_id: documento_id,
        tipo: "firma_digital_aplicada",
        ip,
        user_agent: userAgent,
        metadata: {
          firma_id: firma.id,
          firmante: resultado.firmado_por,
          algoritmo: resultado.algoritmo,
          certificado_serial: resultado.certificado_serial,
          hash_documento: documento.hash_sha256,
        },
      });
    }

    return NextResponse.json({
      success: true,
      firma_id: firma.id,
      info_ui: generarInfoFirmaParaUI(resultado),
      metadatos: resultado.metadatos_firma,
    });
  } catch (error) {
    console.error("Error en firmar documento:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
