import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendConvenioInvitacionEmail } from "@/lib/notifications/email";

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

    // Obtener datos del request
    const body = await request.json();
    const { empleado_id, email_constituido, telefono_constituido } = body;

    if (!empleado_id || !email_constituido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: empleado_id y email_constituido" },
        { status: 400 }
      );
    }

    // Obtener empresa del usuario
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id, razon_social, cuit")
      .eq("user_id", user.id)
      .single();

    if (empresaError || !empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el empleado pertenece a la empresa
    const { data: empleado, error: empleadoError } = await supabase
      .from("empleados")
      .select("id, nombre, cuil, email, telefono, convenio_firmado")
      .eq("id", empleado_id)
      .eq("empresa_id", empresa.id)
      .single();

    if (empleadoError || !empleado) {
      return NextResponse.json(
        { error: "Empleado no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya tiene un convenio activo
    if (empleado.convenio_firmado) {
      return NextResponse.json(
        { error: "El empleado ya tiene un convenio firmado" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene un convenio pendiente
    const { data: convenioExistente } = await supabase
      .from("convenios_domicilio")
      .select("id, estado, token_expira_at")
      .eq("empleado_id", empleado_id)
      .eq("empresa_id", empresa.id)
      .eq("estado", "pendiente")
      .single();

    if (convenioExistente) {
      // Si el token no expiró, devolver error
      const expiraAt = new Date(convenioExistente.token_expira_at);
      if (expiraAt > new Date()) {
        return NextResponse.json(
          {
            error: "Ya existe un convenio pendiente para este empleado",
            convenio_id: convenioExistente.id,
          },
          { status: 400 }
        );
      }

      // Si expiró, eliminar el antiguo
      await supabase
        .from("convenios_domicilio")
        .delete()
        .eq("id", convenioExistente.id);
    }

    // Crear el convenio
    const tokenExpiraAt = new Date();
    tokenExpiraAt.setDate(tokenExpiraAt.getDate() + 7); // 7 días

    const { data: convenio, error: convenioError } = await supabase
      .from("convenios_domicilio")
      .insert({
        empresa_id: empresa.id,
        empleado_id: empleado.id,
        email_constituido: email_constituido,
        telefono_constituido: telefono_constituido || empleado.telefono,
        estado: "pendiente",
        version_convenio: "1.0",
        token_expira_at: tokenExpiraAt.toISOString(),
      })
      .select()
      .single();

    if (convenioError) {
      console.error("Error al crear convenio:", convenioError);
      return NextResponse.json(
        { error: "Error al crear el convenio" },
        { status: 500 }
      );
    }

    // Registrar evento de creación
    await supabase.from("logs_convenio").insert({
      convenio_id: convenio.id,
      accion: "creado",
      metadata: {
        email_constituido,
        telefono_constituido,
      },
    });

    // Enviar email de invitación
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const linkFirma = `${baseUrl}/convenio/${convenio.token_firma}`;

    try {
      await sendConvenioInvitacionEmail({
        to: email_constituido,
        empleadoNombre: empleado.nombre,
        empresaNombre: empresa.razon_social,
        linkFirma,
        diasParaExpirar: 7,
      });

      // Registrar envío de email
      await supabase.from("logs_convenio").insert({
        convenio_id: convenio.id,
        accion: "enviado_email",
        metadata: {
          email: email_constituido,
          link: linkFirma,
        },
      });
    } catch (emailError) {
      console.error("Error al enviar email de convenio:", emailError);
      // No fallar la operación, solo registrar el error
    }

    return NextResponse.json({
      success: true,
      convenio_id: convenio.id,
      token_firma: convenio.token_firma,
      link_firma: linkFirma,
      expira_at: convenio.token_expira_at,
    });
  } catch (error) {
    console.error("Error en crear convenio:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
