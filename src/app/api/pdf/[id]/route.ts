import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { SancionPDF } from "@/lib/pdf/sancion-pdf";

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

    // Generar PDF
    const pdfBuffer = await renderToBuffer(
      SancionPDF({
        notificacion: {
          id: notificacion.id,
          tipo: notificacion.tipo,
          motivo: notificacion.motivo,
          descripcion: notificacion.descripcion,
          fecha_hecho: notificacion.fecha_hecho,
          hash_sha256: notificacion.hash_sha256,
          timestamp_generacion: notificacion.timestamp_generacion,
          fecha_vencimiento: notificacion.fecha_vencimiento,
          created_at: notificacion.created_at,
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
      })
    );

    // Nombre del archivo
    const fileName = `sancion_${notificacion.tipo}_${empleado.nombre.replace(/\s+/g, "_")}_${new Date(notificacion.created_at).toISOString().split("T")[0]}.pdf`;

    // Devolver PDF (convert Buffer to Uint8Array for NextResponse)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Error generando PDF:", error);
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
