import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { enviarEmailTestigo } from "@/lib/notifications/testigo-email";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const { testigo_id } = body;

    if (!testigo_id) {
      return NextResponse.json(
        { error: "Se requiere testigo_id" },
        { status: 400 }
      );
    }

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener testigo con datos de empresa y notificación
    const { data: testigo, error: findError } = await supabase
      .from("declaraciones_testigos")
      .select(`
        *,
        empresa:empresas(id, razon_social, user_id),
        notificacion:notificaciones(
          id,
          motivo,
          fecha_hecho,
          lugar_hecho,
          empleado:empleados(nombre)
        )
      `)
      .eq("id", testigo_id)
      .single();

    if (findError || !testigo) {
      return NextResponse.json(
        { error: "Testigo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el usuario es dueño de la empresa
    const empresa = testigo.empresa as { id: string; razon_social: string; user_id: string };
    if (empresa.user_id !== user.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    // Verificar que tiene email o teléfono
    if (!testigo.email && !testigo.telefono) {
      return NextResponse.json(
        { error: "El testigo no tiene email ni teléfono" },
        { status: 400 }
      );
    }

    // Verificar estado
    if (testigo.estado !== "pendiente") {
      return NextResponse.json(
        { error: "La invitación ya fue enviada" },
        { status: 400 }
      );
    }

    // Construir URL de declaración
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://notilegal.com.ar";
    const declaracionUrl = `${baseUrl}/testigo/${testigo.token_acceso}`;

    // Datos para el email
    const notificacion = testigo.notificacion as {
      id: string;
      motivo: string;
      fecha_hecho: string;
      lugar_hecho?: string;
      empleado: { nombre: string } | null;
    } | null;

    let canal: "email" | "whatsapp" | "sms" = "email";
    let messageId: string | null = null;

    // Enviar email si tiene
    if (testigo.email) {
      try {
        const resultado = await enviarEmailTestigo({
          to: testigo.email,
          nombreTestigo: testigo.nombre_completo,
          nombreEmpresa: empresa.razon_social,
          fechaHecho: notificacion?.fecha_hecho || "",
          lugarHecho: notificacion?.lugar_hecho,
          motivoIncidente: notificacion?.motivo || "incidente laboral",
          linkDeclaracion: declaracionUrl,
        });

        if (resultado.success) {
          messageId = resultado.messageId || null;
        }
      } catch (emailError) {
        console.error("Error enviando email:", emailError);
        // Continuar para intentar WhatsApp/SMS si falla email
      }
    }

    // TODO: Implementar WhatsApp/SMS como fallback si no tiene email
    // if (!testigo.email && testigo.telefono) {
    //   canal = "whatsapp";
    //   ...
    // }

    // Actualizar testigo
    const { error: updateError } = await supabase
      .from("declaraciones_testigos")
      .update({
        estado: "invitado",
        invitacion_enviada_at: new Date().toISOString(),
        invitacion_canal: canal,
        invitacion_message_id: messageId,
      })
      .eq("id", testigo_id);

    if (updateError) {
      console.error("Error actualizando testigo:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar el estado" },
        { status: 500 }
      );
    }

    // Registrar evento
    await supabase.from("eventos_testigos").insert({
      declaracion_id: testigo_id,
      tipo: "invitacion_enviada",
      metadata: {
        canal,
        message_id: messageId,
        email: testigo.email,
      },
    });

    return NextResponse.json({
      success: true,
      canal,
      message: `Invitación enviada por ${canal}`,
    });
  } catch (error) {
    console.error("Error enviando invitación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
