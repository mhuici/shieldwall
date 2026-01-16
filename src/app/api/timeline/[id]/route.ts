import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Verificar que la notificación pertenece al usuario
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const { data: notificacion } = await supabase
    .from("notificaciones")
    .select("id")
    .eq("id", id)
    .eq("empresa_id", empresa.id)
    .single();

  if (!notificacion) {
    return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
  }

  // Obtener el timeline usando la función de Supabase
  const { data: timeline, error } = await supabase.rpc("obtener_timeline_notificacion", {
    p_notificacion_id: id,
  });

  if (error) {
    console.error("Error obteniendo timeline:", error);
    return NextResponse.json({ error: "Error obteniendo timeline" }, { status: 500 });
  }

  return NextResponse.json(timeline);
}
