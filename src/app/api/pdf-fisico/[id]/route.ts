/**
 * API Route: Generar PDF de Notificación Física (Carta Documento)
 *
 * GET /api/pdf-fisico/[id]
 *
 * Genera el PDF para notificación física cuando la digital no fue confirmada.
 * También actualiza el estado de la notificación para registrar que se generó.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ActaNotificacionFisica } from "@/lib/pdf/acta-notificacion-fisica";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener empresa del usuario
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Obtener notificación con datos del empleado
    const { data: notificacion } = await supabase
      .from("notificaciones")
      .select(`
        *,
        empleado:empleados(nombre, cuil)
      `)
      .eq("id", id)
      .eq("empresa_id", empresa.id)
      .single();

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    const empleado = notificacion.empleado as unknown as { nombre: string; cuil: string };

    // Determinar motivo de contingencia
    let motivoContingencia = "Notificación digital no confirmada en el plazo establecido";

    if (notificacion.estado === "enviado" && !notificacion.lectura_confirmada_at) {
      motivoContingencia = "El empleado no confirmó la recepción de la notificación digital dentro del plazo de 72 horas";
    } else if (notificacion.identidad_validada_at && !notificacion.lectura_confirmada_at) {
      motivoContingencia = "El empleado validó su identidad pero no confirmó la lectura del documento";
    } else if (notificacion.email_rebotado) {
      motivoContingencia = "El email fue rechazado por el servidor de destino";
    }

    // Generar PDF
    const pdfBuffer = await renderToBuffer(
      ActaNotificacionFisica({
        notificacion: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          motivo: notificacion.motivo,
          descripcion: notificacion.descripcion,
          fecha_hecho: notificacion.fecha_hecho,
          fecha_vencimiento: notificacion.fecha_vencimiento,
          hash_sha256: notificacion.hash_sha256,
          timestamp_generacion: notificacion.timestamp_generacion,
        },
        empresa: {
          razon_social: empresa.razon_social,
          cuit: empresa.cuit,
          direccion: empresa.direccion_legal || undefined,
        },
        empleado: {
          nombre: empleado.nombre,
          cuil: empleado.cuil,
        },
        motivoContingencia,
      })
    );

    // Actualizar estado de la notificación
    await supabase
      .from("notificaciones")
      .update({
        pdf_fisico_generado: true,
        fecha_pdf_fisico: new Date().toISOString(),
      })
      .eq("id", id);

    // Registrar evento
    await supabase.from("eventos").insert({
      notificacion_id: id,
      tipo: "pdf_fisico_generado",
      metadata: {
        motivo_contingencia: motivoContingencia,
        generado_por: user.id,
        timestamp: new Date().toISOString(),
      },
    });

    // Nombre del archivo
    const fileName = `carta_documento_${empleado.nombre.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;

    // Devolver PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF físico:", error);
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
