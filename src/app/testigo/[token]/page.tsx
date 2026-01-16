export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TestigoDeclaracionClient } from "./client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TestigoDeclaracionPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // Buscar testigo por token_acceso
  const { data: testigo, error } = await supabase
    .from("declaraciones_testigos")
    .select(`
      *,
      notificacion:notificaciones(
        id,
        tipo,
        motivo,
        fecha_hecho,
        hora_hecho,
        lugar_hecho,
        descripcion,
        empleado:empleados(nombre)
      ),
      empresa:empresas(razon_social, cuit)
    `)
    .eq("token_acceso", token)
    .single();

  if (error || !testigo) {
    console.error("Error buscando testigo:", error);
    notFound();
  }

  // Verificar si el token expiró
  const tokenExpirado = new Date(testigo.token_expira_at) < new Date();

  // Verificar si ya firmó
  const yaFirmado = testigo.estado === "firmado";

  // Verificar si fue rechazado o expirado
  const noDisponible = testigo.estado === "rechazado" || testigo.estado === "expirado";

  // Datos de la notificación
  const notificacion = testigo.notificacion as {
    id: string;
    tipo: string;
    motivo: string;
    fecha_hecho: string;
    hora_hecho?: string;
    lugar_hecho?: string;
    descripcion: string;
    empleado: { nombre: string } | null;
  } | null;

  // Datos de la empresa
  const empresa = testigo.empresa as {
    razon_social: string;
    cuit: string;
  } | null;

  // Preparar datos para el cliente
  const datosTestigo = {
    id: testigo.id,
    token: testigo.token_acceso,
    nombre_completo: testigo.nombre_completo,
    cargo: testigo.cargo,
    relacion: testigo.relacion,
    presente_en_hecho: testigo.presente_en_hecho,
    estado: testigo.estado,
    descripcion_testigo: testigo.descripcion_testigo,
    hash_declaracion: testigo.hash_declaracion,
    juramento_timestamp: testigo.juramento_timestamp,
    token_expira_at: testigo.token_expira_at,
  };

  const datosIncidente = notificacion
    ? {
        tipo: notificacion.tipo,
        motivo: notificacion.motivo,
        fecha_hecho: notificacion.fecha_hecho,
        hora_hecho: notificacion.hora_hecho,
        lugar_hecho: notificacion.lugar_hecho,
        empleado_nombre: notificacion.empleado?.nombre || "Empleado",
      }
    : null;

  const datosEmpresa = empresa
    ? {
        razon_social: empresa.razon_social,
      }
    : null;

  return (
    <TestigoDeclaracionClient
      testigo={datosTestigo}
      incidente={datosIncidente}
      empresa={datosEmpresa}
      tokenExpirado={tokenExpirado}
      yaFirmado={yaFirmado}
      noDisponible={noDisponible}
    />
  );
}
