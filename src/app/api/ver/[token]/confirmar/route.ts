/**
 * API Route: Confirmar Lectura de Notificación
 *
 * POST /api/ver/[token]/confirmar
 *
 * Registra la confirmación de lectura por parte del empleado.
 * Soporta dos métodos:
 * - Checkbox (legacy): checkboxAceptado = true
 * - Reconocimiento de texto (nuevo): reconocimiento = { campo_tipo, respuesta, intento_numero }
 *
 * Captura IP, user agent como prueba legal.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Cliente Supabase con service role
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const MAX_INTENTOS = 3;

function getSupabaseAdmin() {
  if (!supabaseServiceKey) {
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  }
  return createClient(supabaseUrl, supabaseServiceKey);
}

// Obtener IP real del cliente
function getClientIP(request: NextRequest): string {
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;

  return "unknown";
}

// Normalizar texto: minúsculas, sin acentos, sin espacios extra
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/\s+/g, " ")
    .trim();
}

// Validar respuesta según tipo de campo
function validarRespuesta(
  respuesta: string,
  campoTipo: string,
  tipoSancion: string,
  diasSuspension: number | null,
  fechaHecho: string | null
): { esValido: boolean; scoreSimilitud: number } {
  const respuestaNorm = normalizarTexto(respuesta);

  if (campoTipo === "tipo_sancion") {
    // Buscar palabras clave según el tipo de sanción
    const palabrasClave: Record<string, string[]> = {
      suspension: ["suspension", "suspendido", "suspender"],
      apercibimiento: ["apercibimiento", "apercibido", "apercibi"],
      apercibimiento_previo_despido: ["apercibimiento", "previo", "despido"],
      despido: ["despido", "despedido", "desvinculacion"],
      llamado_atencion: ["llamado", "atencion"],
    };

    const claves = palabrasClave[tipoSancion] || [tipoSancion];
    const coincide = claves.some((clave) => respuestaNorm.includes(clave));

    if (coincide) {
      // Verificar si coincide exactamente con el tipo esperado
      const tipoNorm = normalizarTexto(tipoSancion.replace(/_/g, " "));
      if (respuestaNorm.includes(tipoNorm)) {
        return { esValido: true, scoreSimilitud: 100 };
      }
      return { esValido: true, scoreSimilitud: 80 };
    }
    return { esValido: false, scoreSimilitud: 0 };
  }

  if (campoTipo === "duracion" && diasSuspension !== null) {
    // Extraer número de la respuesta
    const matchRespuesta = respuestaNorm.match(/(\d+)/);
    if (matchRespuesta) {
      const numeroRespuesta = parseInt(matchRespuesta[1], 10);
      if (numeroRespuesta === diasSuspension) {
        return { esValido: true, scoreSimilitud: 100 };
      }
    }
    return { esValido: false, scoreSimilitud: 0 };
  }

  if (campoTipo === "fecha_hecho" && fechaHecho) {
    // Parsear fecha esperada
    const fechaEsperada = new Date(fechaHecho);
    const diaEsp = fechaEsperada.getDate();
    const mesEsp = fechaEsperada.getMonth() + 1;
    const anioEsp = fechaEsperada.getFullYear();

    // Intentar extraer fecha de la respuesta en varios formatos
    const formatosDeFecha = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
      /(\d{1,2})\.(\d{1,2})\.(\d{4})/, // DD.MM.YYYY
    ];

    for (const formato of formatosDeFecha) {
      const match = respuestaNorm.match(formato);
      if (match) {
        const dia = parseInt(match[1], 10);
        const mes = parseInt(match[2], 10);
        const anio = parseInt(match[3], 10);

        if (dia === diaEsp && mes === mesEsp && anio === anioEsp) {
          return { esValido: true, scoreSimilitud: 100 };
        }
      }
    }
    return { esValido: false, scoreSimilitud: 0 };
  }

  // Tipo desconocido: comparación simple
  return { esValido: false, scoreSimilitud: 0 };
}

interface ReconocimientoBody {
  campo_tipo: string;
  respuesta: string;
  intento_numero: number;
}

interface ConfirmarBody {
  userAgent?: string;
  checkboxAceptado?: boolean;
  reconocimiento?: ReconocimientoBody;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body: ConfirmarBody = await request.json().catch(() => ({}));
    const { userAgent = "unknown", checkboxAceptado, reconocimiento } = body;

    const supabase = getSupabaseAdmin();

    // Buscar notificación por token_acceso o ID
    let notificacion;

    const { data: notifByToken } = await supabase
      .from("notificaciones")
      .select(`
        id, estado, lectura_confirmada_at, tipo, dias_suspension, fecha_hecho,
        reconocimiento_intentos, reconocimiento_validado
      `)
      .eq("token_acceso", token)
      .single();

    if (notifByToken) {
      notificacion = notifByToken;
    } else {
      const { data: notifById } = await supabase
        .from("notificaciones")
        .select(`
          id, estado, lectura_confirmada_at, tipo, dias_suspension, fecha_hecho,
          reconocimiento_intentos, reconocimiento_validado
        `)
        .eq("id", token)
        .single();

      notificacion = notifById;
    }

    if (!notificacion) {
      return NextResponse.json({ error: "Notificación no encontrada" }, { status: 404 });
    }

    // Verificar si ya fue confirmado
    if (notificacion.lectura_confirmada_at) {
      return NextResponse.json({
        success: true,
        yaConfirmado: true,
        fechaConfirmacion: notificacion.lectura_confirmada_at,
      });
    }

    const ip = getClientIP(request);
    const timestamp = new Date().toISOString();

    // Método 1: Checkbox (legacy)
    if (checkboxAceptado === true && !reconocimiento) {
      const { error: updateError } = await supabase
        .from("notificaciones")
        .update({
          estado: "notificado",
          semaforo: "leido",
          lectura_confirmada_at: timestamp,
          lectura_checkbox_aceptado: true,
          lectura_ip: ip,
          lectura_user_agent: userAgent,
        })
        .eq("id", notificacion.id);

      if (updateError) {
        console.error("Error actualizando notificación:", updateError);
        return NextResponse.json({ error: "Error al guardar confirmación" }, { status: 500 });
      }

      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "lectura_confirmada_checkbox",
        ip,
        user_agent: userAgent,
        metadata: {
          timestamp,
          metodo: "checkbox_declaracion_jurada",
          checkbox_aceptado: true,
          texto_legal: "Declaro bajo juramento haber accedido personalmente, leído íntegramente y comprender el plazo de 30 días para impugnación según Ley 27.742",
        },
      });

      return NextResponse.json({
        success: true,
        yaConfirmado: false,
        fechaConfirmacion: timestamp,
        ip,
      });
    }

    // Método 2: Reconocimiento de texto (nuevo)
    if (reconocimiento) {
      const { campo_tipo, respuesta, intento_numero } = reconocimiento;

      // Verificar si agotó los intentos
      const intentosActuales = notificacion.reconocimiento_intentos || 0;
      if (intentosActuales >= MAX_INTENTOS) {
        return NextResponse.json(
          { error: "Ha agotado los intentos disponibles", intentosAgotados: true },
          { status: 400 }
        );
      }

      // Validar la respuesta
      const { esValido, scoreSimilitud } = validarRespuesta(
        respuesta,
        campo_tipo,
        notificacion.tipo,
        notificacion.dias_suspension,
        notificacion.fecha_hecho
      );

      // Registrar intento
      await supabase.from("intentos_reconocimiento").insert({
        notificacion_id: notificacion.id,
        campo_mostrado: campo_tipo,
        respuesta_ingresada: respuesta,
        respuesta_esperada: notificacion.tipo, // Simplificado
        es_valido: esValido,
        score_similitud: scoreSimilitud,
        intento_numero: intento_numero,
        ip,
        user_agent: userAgent,
      });

      // Incrementar contador de intentos
      await supabase
        .from("notificaciones")
        .update({
          reconocimiento_intentos: intentosActuales + 1,
          reconocimiento_campo_mostrado: campo_tipo,
        })
        .eq("id", notificacion.id);

      if (!esValido) {
        const nuevosIntentos = intentosActuales + 1;
        const intentosRestantes = MAX_INTENTOS - nuevosIntentos;

        return NextResponse.json(
          {
            error: "La respuesta no coincide con el contenido del documento",
            intentos: nuevosIntentos,
            intentosRestantes,
            intentosAgotados: nuevosIntentos >= MAX_INTENTOS,
          },
          { status: 400 }
        );
      }

      // Respuesta válida: confirmar lectura
      const { error: updateError } = await supabase
        .from("notificaciones")
        .update({
          estado: "notificado",
          semaforo: "leido",
          lectura_confirmada_at: timestamp,
          lectura_ip: ip,
          lectura_user_agent: userAgent,
          reconocimiento_respuesta: respuesta,
          reconocimiento_validado: true,
          reconocimiento_validado_at: timestamp,
          confirmacion_metadata: {
            metodo: "reconocimiento_texto",
            campo_tipo,
            score_similitud: scoreSimilitud,
            intento_exitoso: intento_numero,
            total_intentos: intentosActuales + 1,
          },
        })
        .eq("id", notificacion.id);

      if (updateError) {
        console.error("Error actualizando notificación:", updateError);
        return NextResponse.json({ error: "Error al guardar confirmación" }, { status: 500 });
      }

      // Registrar evento de confirmación
      await supabase.from("eventos").insert({
        notificacion_id: notificacion.id,
        tipo: "lectura_confirmada_reconocimiento",
        ip,
        user_agent: userAgent,
        metadata: {
          timestamp,
          metodo: "reconocimiento_texto_libre",
          campo_tipo,
          respuesta,
          score_similitud: scoreSimilitud,
          intento_exitoso: intento_numero,
          total_intentos: intentosActuales + 1,
        },
      });

      return NextResponse.json({
        success: true,
        yaConfirmado: false,
        fechaConfirmacion: timestamp,
        ip,
        metodo: "reconocimiento",
      });
    }

    // Sin método válido
    return NextResponse.json(
      { error: "Debe proporcionar checkboxAceptado o reconocimiento" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Error confirmando lectura:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
