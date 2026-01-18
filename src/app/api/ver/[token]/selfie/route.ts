/**
 * API Route: Captura de Selfie para Validación de Identidad
 *
 * POST /api/ver/[token]/selfie
 *
 * Captura y almacena la selfie del empleado como prueba adicional de identidad.
 * La selfie se almacena con hash para integridad y metadatos del dispositivo.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const formData = await request.formData();

    const selfieFile = formData.get("selfie") as File | null;
    const metadata = formData.get("metadata") as string | null;

    if (!selfieFile) {
      return NextResponse.json(
        { error: "No se recibió la imagen" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!selfieFile.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 10MB)
    if (selfieFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen es demasiado grande (máximo 10MB)" },
        { status: 400 }
      );
    }

    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    // Buscar notificación
    const { data: notificacion, error: notifError } = await supabase
      .from("notificaciones")
      .select(`
        id,
        empresa_id,
        empleado_id,
        identidad_validada_at,
        selfie_url,
        empleado:empleados(id, nombre, cuil)
      `)
      .or(`token_acceso.eq.${token},id.eq.${token}`)
      .single();

    if (notifError || !notificacion) {
      return NextResponse.json(
        { error: "Notificación no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que CUIL ya fue validado
    if (!notificacion.identidad_validada_at) {
      return NextResponse.json(
        { error: "Debe validar su identidad primero" },
        { status: 400 }
      );
    }

    // Si ya tiene selfie, permitir actualización pero registrar
    const yaHabiaSelfie = !!notificacion.selfie_url;

    // Leer archivo y calcular hash
    const arrayBuffer = await selfieFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Crear nombre de archivo único
    const extension = selfieFile.type.split("/")[1] || "jpg";
    const fileName = `selfies/${notificacion.empresa_id}/${notificacion.id}_${Date.now()}.${extension}`;

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("notificaciones")
      .upload(fileName, buffer, {
        contentType: selfieFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Error al subir selfie:", uploadError);
      return NextResponse.json(
        { error: "Error al guardar la imagen" },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from("notificaciones")
      .getPublicUrl(fileName);

    // Parsear metadata del dispositivo
    let deviceMetadata = {};
    if (metadata) {
      try {
        deviceMetadata = JSON.parse(metadata);
      } catch {
        // Ignorar si no es JSON válido
      }
    }

    // Actualizar notificación con datos de selfie
    await supabase
      .from("notificaciones")
      .update({
        selfie_url: urlData.publicUrl,
        selfie_hash: hash,
        selfie_capturada_at: timestamp,
        selfie_ip: ip,
        selfie_user_agent: userAgent,
        selfie_metadata: {
          ...deviceMetadata,
          file_name: selfieFile.name,
          file_size: selfieFile.size,
          file_type: selfieFile.type,
          storage_path: fileName,
        },
      })
      .eq("id", notificacion.id);

    // Registrar evento
    const empleadoData = notificacion.empleado as unknown as
      | { id: string; nombre: string; cuil: string }[]
      | { id: string; nombre: string; cuil: string };
    const empleado = Array.isArray(empleadoData) ? empleadoData[0] : empleadoData;

    await supabase.from("eventos").insert({
      notificacion_id: notificacion.id,
      tipo: yaHabiaSelfie ? "selfie_actualizada" : "selfie_capturada",
      ip,
      user_agent: userAgent,
      metadata: {
        timestamp,
        hash,
        file_size: selfieFile.size,
        empleado_nombre: empleado?.nombre,
        empleado_cuil: empleado?.cuil,
        device_metadata: deviceMetadata,
      },
    });

    return NextResponse.json({
      success: true,
      mensaje: "Selfie capturada exitosamente",
      hash,
      capturada_at: timestamp,
    });
  } catch (error) {
    console.error("Error al capturar selfie:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
