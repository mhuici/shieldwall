export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { VerNotificacionClient } from "./client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VerSancionPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // El "id" puede ser un UUID directo o un token_acceso
  let notificacion;

  const { data: notifByToken } = await supabase
    .from("notificaciones")
    .select(`
      *,
      empleado:empleados(id, nombre, cuil, legajo, telefono, convenio_firmado, convenio_id),
      empresa:empresas(id, razon_social, cuit, user_id)
    `)
    .eq("token_acceso", id)
    .single();

  if (notifByToken) {
    notificacion = notifByToken;
  } else {
    // Fallback: buscar por ID directo
    const { data: notifById } = await supabase
      .from("notificaciones")
      .select(`
        *,
        empleado:empleados(id, nombre, cuil, legajo, telefono, convenio_firmado, convenio_id),
        empresa:empresas(id, razon_social, cuit, user_id)
      `)
      .eq("id", id)
      .single();

    notificacion = notifById;
  }

  if (!notificacion) {
    notFound();
  }

  const empleado = notificacion.empleado as {
    id: string;
    nombre: string;
    cuil: string;
    legajo?: string;
    telefono?: string;
    convenio_firmado?: boolean;
    convenio_id?: string;
  } | null;

  const empresa = notificacion.empresa as {
    id: string;
    razon_social: string;
    cuit: string;
    user_id: string;
  } | null;

  // Obtener datos del convenio si existe
  let requiereSelfie = false;
  if (empleado?.convenio_id) {
    const { data: convenio } = await supabase
      .from("convenios_domicilio")
      .select("acepta_biometricos")
      .eq("id", empleado.convenio_id)
      .single();

    if (convenio) {
      requiereSelfie = convenio.acepta_biometricos === true;
    }
  }

  // Determinar si OTP ya fue validado
  const otpValidado = notificacion.otp_validado === true;

  // Token para tracking y APIs
  const trackingToken = notificacion.token_acceso || notificacion.id;

  // Determinar si ya validó identidad
  const identidadValidada = !!notificacion.identidad_validada_at;

  // Determinar si ya confirmó lectura
  const lecturaConfirmada =
    !!notificacion.lectura_confirmada_at ||
    notificacion.estado === "notificado" ||
    notificacion.estado === "leido" ||
    notificacion.estado === "firme" ||
    notificacion.estado === "impugnado";

  // Preparar datos para el cliente
  const datosNotificacion = {
    id: notificacion.id,
    token: trackingToken,
    tipo: notificacion.tipo,
    motivo: notificacion.motivo,
    descripcion: notificacion.descripcion,
    fecha_hecho: notificacion.fecha_hecho,
    fecha_vencimiento: notificacion.fecha_vencimiento,
    hash_sha256: notificacion.hash_sha256,
    timestamp_generacion: notificacion.timestamp_generacion,
    estado: notificacion.estado,
    dias_suspension: notificacion.dias_suspension,
    fecha_inicio_suspension: notificacion.fecha_inicio_suspension,
    fecha_fin_suspension: notificacion.fecha_fin_suspension,
    lectura_confirmada_at: notificacion.lectura_confirmada_at,
    fecha_lectura: notificacion.fecha_lectura,
  };

  const datosEmpresa = empresa ? {
    id: empresa.id,
    razon_social: empresa.razon_social,
    cuit: empresa.cuit,
  } : null;

  const datosEmpleado = empleado ? {
    id: empleado.id,
    nombre: empleado.nombre,
    cuil: empleado.cuil,
    telefono: empleado.telefono,
    convenioFirmado: empleado.convenio_firmado,
  } : null;

  // Verificar si la biometría ya fue completada
  const biometriaCompletada = notificacion.biometria_completada === true;

  // Verificar si el empleado tiene enrolamiento (primer acceso)
  let tieneEnrolamiento = false;
  if (empleado?.id) {
    const { data: enrollment } = await supabase
      .from('enrolamiento_biometrico')
      .select('id')
      .eq('empleado_id', empleado.id)
      .single();
    tieneEnrolamiento = !!enrollment;
  }

  return (
    <VerNotificacionClient
      notificacion={datosNotificacion}
      empresa={datosEmpresa}
      empleado={datosEmpleado}
      identidadValidada={identidadValidada}
      otpValidado={otpValidado}
      lecturaConfirmada={lecturaConfirmada}
      requiereSelfie={requiereSelfie}
      biometriaCompletada={biometriaCompletada}
      isFirstAccess={!tieneEnrolamiento}
    />
  );
}
