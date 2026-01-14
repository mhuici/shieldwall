/**
 * API Route: Enviar Notificación de Sanción
 *
 * POST /api/notificar/[id]
 *
 * Envía la notificación por email (y SMS si se especifica).
 * Registra todos los eventos de auditoría.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  enviarEmailSancion,
  enviarEmailCopiaEmpleador,
  enviarWhatsAppSancion,
} from "@/lib/notifications";
import { formatearCUIL } from "@/lib/validators";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { forzarReenvio = false } = body;

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

    // Obtener notificación con empleado
    const { data: notificacion, error: notifError } = await supabase
      .from("notificaciones")
      .select(`
        *,
        empleado:empleados(id, nombre, email, telefono, cuil)
      `)
      .eq("id", id)
      .eq("empresa_id", empresa.id)
      .single();

    if (notifError || !notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    const empleado = notificacion.empleado as {
      id: string;
      nombre: string;
      email: string | null;
      telefono: string | null;
      cuil: string;
    };

    // Verificar si ya fue enviado (a menos que sea forzado)
    if (notificacion.email_enviado_at && !forzarReenvio) {
      return NextResponse.json({
        error: "La notificación ya fue enviada",
        enviado_at: notificacion.email_enviado_at,
      }, { status: 400 });
    }

    // Verificar que el empleado tenga email O teléfono
    if (!empleado.email && !empleado.telefono) {
      return NextResponse.json({
        error: "El empleado no tiene email ni teléfono registrado",
      }, { status: 400 });
    }

    // Generar token de acceso si no existe
    let tokenAcceso = notificacion.token_acceso;
    if (!tokenAcceso) {
      const { data: tokenData } = await supabase
        .from("notificaciones")
        .update({ token_acceso: crypto.randomUUID() })
        .eq("id", id)
        .select("token_acceso")
        .single();

      tokenAcceso = tokenData?.token_acceso;
    }

    // Formatear fechas
    const fechaHecho = new Date(notificacion.fecha_hecho).toLocaleDateString("es-AR");
    const fechaVencimiento = new Date(notificacion.fecha_vencimiento).toLocaleDateString("es-AR");
    const timestamp = new Date().toISOString();
    const timestampFormateado = new Date().toLocaleString("es-AR");

    const tipoLabel =
      notificacion.tipo === "apercibimiento" ? "Apercibimiento" :
      notificacion.tipo === "suspension" ? "Suspensión" :
      notificacion.tipo === "apercibimiento_previo_despido" ? "Apercibimiento Previo al Despido" :
      notificacion.tipo;

    // =====================================================
    // ENVÍO 1: Email al empleado
    // =====================================================
    let resultadoEmail: { success: boolean; messageId?: string; error?: string } = { success: false, error: "No email" };

    if (empleado.email) {
      resultadoEmail = await enviarEmailSancion({
        notificacionId: id,
        tokenAcceso: tokenAcceso || id,
        empleado: {
          nombre: empleado.nombre,
          email: empleado.email,
        },
        empresa: {
          razonSocial: empresa.razon_social,
        },
        sancion: {
          tipo: tipoLabel,
          motivo: notificacion.motivo,
          fechaHecho,
          fechaVencimiento,
        },
      });

      if (resultadoEmail.success) {
        await supabase.from("eventos").insert({
          notificacion_id: id,
          tipo: "email_enviado_empleado",
          metadata: {
            message_id: resultadoEmail.messageId,
            destinatario: empleado.email,
            timestamp,
          },
        });
      } else {
        await supabase.from("eventos").insert({
          notificacion_id: id,
          tipo: "email_error_empleado",
          metadata: { error: resultadoEmail.error, destinatario: empleado.email },
        });
      }
    }

    // =====================================================
    // ENVÍO 2: WhatsApp al empleado
    // =====================================================
    let resultadoWhatsApp: { success: boolean; messageSid?: string; error?: string } = { success: false, error: "No teléfono" };

    if (empleado.telefono) {
      resultadoWhatsApp = await enviarWhatsAppSancion({
        notificacionId: id,
        tokenAcceso: tokenAcceso || id,
        empleado: {
          nombre: empleado.nombre,
          telefono: empleado.telefono,
        },
        empresa: {
          razonSocial: empresa.razon_social,
        },
        sancion: {
          tipo: tipoLabel,
          motivo: notificacion.motivo,
          fechaVencimiento,
        },
      });

      if (resultadoWhatsApp.success) {
        await supabase.from("eventos").insert({
          notificacion_id: id,
          tipo: "whatsapp_enviado_empleado",
          metadata: {
            message_sid: resultadoWhatsApp.messageSid,
            destinatario: empleado.telefono,
            timestamp,
          },
        });
      } else {
        await supabase.from("eventos").insert({
          notificacion_id: id,
          tipo: "whatsapp_error_empleado",
          metadata: { error: resultadoWhatsApp.error, destinatario: empleado.telefono },
        });
      }
    }

    // =====================================================
    // ENVÍO 3: Email CC al empleador (copia)
    // =====================================================
    let resultadoEmailEmpleador: { success: boolean; messageId?: string } = { success: false };

    if (user.email) {
      resultadoEmailEmpleador = await enviarEmailCopiaEmpleador({
        notificacionId: id,
        empleador: {
          nombre: empresa.razon_social,
          email: user.email,
        },
        empleado: {
          nombre: empleado.nombre,
          cuil: formatearCUIL(empleado.cuil),
        },
        empresa: {
          razonSocial: empresa.razon_social,
        },
        sancion: {
          tipo: tipoLabel,
          motivo: notificacion.motivo,
          fechaHecho,
          fechaVencimiento,
        },
        timestamp: timestampFormateado,
      });

      if (resultadoEmailEmpleador.success) {
        await supabase.from("eventos").insert({
          notificacion_id: id,
          tipo: "email_copia_empleador",
          metadata: {
            message_id: resultadoEmailEmpleador.messageId,
            destinatario: user.email,
            timestamp,
          },
        });
      }
    }

    // =====================================================
    // Verificar que al menos un canal llegó
    // =====================================================
    if (!resultadoEmail.success && !resultadoWhatsApp.success) {
      return NextResponse.json({
        error: "No se pudo enviar la notificación por ningún canal",
        detalles: {
          email: resultadoEmail.error,
          whatsapp: resultadoWhatsApp.error,
        },
      }, { status: 500 });
    }

    // =====================================================
    // Actualizar notificación con datos de envío
    // =====================================================
    const updateData: Record<string, unknown> = {
      estado: "enviado",
      semaforo: "enviado",
    };

    if (resultadoEmail.success) {
      updateData.email_enviado_at = timestamp;
    }
    if (resultadoWhatsApp.success) {
      updateData.whatsapp_enviado_at = timestamp;
    }

    await supabase
      .from("notificaciones")
      .update(updateData)
      .eq("id", id);

    return NextResponse.json({
      success: true,
      canales: {
        email_empleado: {
          enviado: resultadoEmail.success,
          messageId: resultadoEmail.messageId,
          destinatario: empleado.email,
          error: resultadoEmail.success ? undefined : resultadoEmail.error,
        },
        whatsapp_empleado: {
          enviado: resultadoWhatsApp.success,
          messageSid: resultadoWhatsApp.messageSid,
          destinatario: empleado.telefono,
          error: resultadoWhatsApp.success ? undefined : resultadoWhatsApp.error,
        },
        email_copia_empleador: {
          enviado: resultadoEmailEmpleador.success,
          messageId: resultadoEmailEmpleador.messageId,
          destinatario: user.email,
        },
      },
      timestamp,
    });

  } catch (error) {
    console.error("Error en API notificar:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Obtener estado de notificación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Obtener notificación con eventos
    const { data: notificacion } = await supabase
      .from("notificaciones")
      .select(`
        id,
        estado,
        semaforo,
        email_enviado_at,
        email_entregado_at,
        email_abierto_at,
        email_rebotado,
        sms_enviado_at,
        sms_entregado_at,
        sms_fallido,
        link_abierto_at,
        link_abierto_count,
        lectura_confirmada_at,
        lectura_ip,
        requiere_notificacion_fisica,
        fecha_vencimiento
      `)
      .eq("id", id)
      .eq("empresa_id", empresa.id)
      .single();

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Obtener eventos
    const { data: eventos } = await supabase
      .from("eventos")
      .select("tipo, metadata, created_at")
      .eq("notificacion_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({
      notificacion,
      eventos: eventos || [],
    });

  } catch (error) {
    console.error("Error obteniendo estado:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
