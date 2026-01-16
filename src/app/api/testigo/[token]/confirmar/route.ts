import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import SHA256 from "crypto-js/sha256";

interface RouteContext {
  params: Promise<{ token: string }>;
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const supabase = await createClient();
    const body = await request.json();

    const { descripcion_testigo, declara_bajo_juramento } = body;

    // Validaciones
    if (!descripcion_testigo || descripcion_testigo.trim().length < 20) {
      return NextResponse.json(
        { error: "La descripción debe tener al menos 20 caracteres" },
        { status: 400 }
      );
    }

    if (!declara_bajo_juramento) {
      return NextResponse.json(
        { error: "Debe aceptar la declaración jurada" },
        { status: 400 }
      );
    }

    // Buscar testigo por token
    const { data: testigo, error: findError } = await supabase
      .from("declaraciones_testigos")
      .select("*")
      .eq("token_acceso", token)
      .single();

    if (findError || !testigo) {
      return NextResponse.json(
        { error: "Testigo no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que no haya expirado
    if (new Date(testigo.token_expira_at) < new Date()) {
      return NextResponse.json(
        { error: "El link ha expirado" },
        { status: 410 }
      );
    }

    // Verificar que no esté ya firmado
    if (testigo.estado === "firmado") {
      return NextResponse.json(
        { error: "Esta declaración ya fue firmada" },
        { status: 409 }
      );
    }

    // Verificar estado válido para firmar
    if (!["pendiente", "invitado", "validado"].includes(testigo.estado)) {
      return NextResponse.json(
        { error: "No es posible firmar esta declaración" },
        { status: 400 }
      );
    }

    // Obtener datos del request
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    const timestamp = new Date().toISOString();

    // Generar hash de la declaración
    const contenidoHash = JSON.stringify({
      testigo_id: testigo.id,
      nombre: testigo.nombre_completo,
      descripcion: descripcion_testigo.trim(),
      juramento: true,
      timestamp,
      ip,
    });
    const hash = SHA256(contenidoHash).toString();

    // Actualizar testigo con la declaración
    const { error: updateError } = await supabase
      .from("declaraciones_testigos")
      .update({
        descripcion_testigo: descripcion_testigo.trim(),
        declara_bajo_juramento: true,
        juramento_timestamp: timestamp,
        juramento_ip: ip,
        juramento_user_agent: userAgent,
        hash_declaracion: hash,
        estado: "firmado",
        validado: true,
        validacion_timestamp: testigo.validacion_timestamp || timestamp,
        validacion_ip: testigo.validacion_ip || ip,
      })
      .eq("id", testigo.id);

    if (updateError) {
      console.error("Error actualizando testigo:", updateError);
      return NextResponse.json(
        { error: "Error al guardar la declaración" },
        { status: 500 }
      );
    }

    // Registrar evento
    await supabase.from("eventos_testigos").insert({
      declaracion_id: testigo.id,
      tipo: "declaracion_firmada",
      metadata: {
        descripcion_length: descripcion_testigo.trim().length,
        hash,
      },
      ip,
      user_agent: userAgent,
    });

    return NextResponse.json({
      success: true,
      hash,
      timestamp,
      message: "Declaración firmada correctamente",
    });
  } catch (error) {
    console.error("Error en confirmar declaración:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
