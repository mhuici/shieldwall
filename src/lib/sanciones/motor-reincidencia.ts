/**
 * Motor de Reincidencia
 *
 * Consulta el historial de sanciones de un empleado para:
 * - Calcular el nivel de reincidencia (primera_vez, reincidente, reincidente_multiple)
 * - Generar un resumen del historial disciplinario
 * - Identificar patrones de conducta recurrente
 *
 * Período relevante: 12 meses (jurisprudencia laboral argentina)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  NivelReincidencia,
  SancionHistorial,
  ResumenReincidencia,
  TipoSancion,
  Gravedad,
} from "@/lib/types";
import {
  MESES_HISTORIAL_REINCIDENCIA,
  LIMITE_DIAS_SUSPENSION_ANUAL,
} from "@/lib/types";
import { sonMotivosRelacionados, obtenerGrupoMotivo } from "./motivos-por-rubro";

// ============================================
// CONSULTA DE HISTORIAL
// ============================================

/**
 * Obtiene el historial de sanciones de un empleado desde Supabase
 */
export async function obtenerHistorialEmpleado(
  supabase: SupabaseClient,
  empleadoId: string
): Promise<SancionHistorial[]> {
  const { data, error } = await supabase
    .from("notificaciones")
    .select(`
      id,
      tipo,
      motivo,
      gravedad,
      fecha_hecho,
      estado,
      dias_suspension
    `)
    .eq("empleado_id", empleadoId)
    .in("estado", ["enviado", "leido", "firme"]) // Solo sanciones válidas
    .order("fecha_hecho", { ascending: false });

  if (error) {
    console.error("Error al obtener historial:", error);
    return [];
  }

  return (data || []).map((n) => ({
    id: n.id,
    tipo: n.tipo as TipoSancion,
    motivo: n.motivo,
    motivo_codigo: undefined, // Se podría agregar a la BD
    gravedad: n.gravedad as Gravedad | undefined,
    fecha: n.fecha_hecho,
    estado: n.estado,
    dias_suspension: n.dias_suspension,
  }));
}

// ============================================
// CÁLCULO DE REINCIDENCIA
// ============================================

/**
 * Calcula el nivel de reincidencia para un motivo específico
 *
 * @param historial - Historial completo de sanciones del empleado
 * @param motivoCodigo - Código del motivo actual (para buscar relacionados)
 * @param motivoTexto - Texto del motivo (fallback si no hay código)
 */
export function calcularReincidencia(
  historial: SancionHistorial[],
  motivoCodigo?: string,
  motivoTexto?: string
): NivelReincidencia {
  // Filtrar sanciones de los últimos 12 meses
  const hace12Meses = new Date();
  hace12Meses.setMonth(hace12Meses.getMonth() - MESES_HISTORIAL_REINCIDENCIA);

  const sancionesRelevantes = historial.filter(
    (s) => new Date(s.fecha) >= hace12Meses
  );

  if (sancionesRelevantes.length === 0) {
    return "primera_vez";
  }

  // Contar sanciones por mismo motivo o relacionado
  let sancionesRelacionadas = 0;

  for (const sancion of sancionesRelevantes) {
    let esRelacionada = false;

    // Comparar por código si está disponible
    if (motivoCodigo && sancion.motivo_codigo) {
      esRelacionada = sonMotivosRelacionados(motivoCodigo, sancion.motivo_codigo);
    }

    // Fallback: comparar por texto de motivo (coincidencia parcial)
    if (!esRelacionada && motivoTexto) {
      esRelacionada = sonMotivosSimilaresPorTexto(motivoTexto, sancion.motivo);
    }

    // Si no podemos determinar relación, contar todas las del mismo grupo de gravedad
    if (!esRelacionada && motivoCodigo) {
      const grupoActual = obtenerGrupoMotivo(motivoCodigo);
      const grupoHistorico = sancion.motivo_codigo
        ? obtenerGrupoMotivo(sancion.motivo_codigo)
        : null;

      if (grupoActual && grupoActual === grupoHistorico) {
        esRelacionada = true;
      }
    }

    if (esRelacionada) {
      sancionesRelacionadas++;
    }
  }

  // Determinar nivel basado en cantidad
  if (sancionesRelacionadas === 0) {
    return "primera_vez";
  } else if (sancionesRelacionadas <= 2) {
    return "reincidente";
  } else {
    return "reincidente_multiple";
  }
}

/**
 * Compara dos textos de motivo para ver si son similares
 * (fallback cuando no hay códigos)
 */
function sonMotivosSimilaresPorTexto(motivo1: string, motivo2: string): boolean {
  const normalizar = (texto: string) =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/[^a-z0-9\s]/g, "") // Solo letras y números
      .trim();

  const m1 = normalizar(motivo1);
  const m2 = normalizar(motivo2);

  // Coincidencia exacta
  if (m1 === m2) return true;

  // Una contiene a la otra
  if (m1.includes(m2) || m2.includes(m1)) return true;

  // Palabras clave en común
  const palabras1 = new Set(m1.split(/\s+/).filter((p) => p.length > 3));
  const palabras2 = new Set(m2.split(/\s+/).filter((p) => p.length > 3));

  let coincidencias = 0;
  for (const palabra of palabras1) {
    if (palabras2.has(palabra)) coincidencias++;
  }

  // Si coinciden más del 50% de las palabras significativas
  const totalPalabras = Math.min(palabras1.size, palabras2.size);
  return totalPalabras > 0 && coincidencias / totalPalabras >= 0.5;
}

// ============================================
// RESUMEN DE HISTORIAL
// ============================================

/**
 * Genera un resumen completo del historial disciplinario
 */
export function generarResumenHistorial(
  historial: SancionHistorial[]
): ResumenReincidencia {
  const ahora = new Date();
  const hace12Meses = new Date();
  hace12Meses.setMonth(ahora.getMonth() - 12);
  const inicioAnio = new Date(ahora.getFullYear(), 0, 1);

  // Filtrar por períodos
  const ultimos12Meses = historial.filter(
    (s) => new Date(s.fecha) >= hace12Meses
  );
  const esteAnio = historial.filter(
    (s) => new Date(s.fecha) >= inicioAnio
  );

  // Calcular días de suspensión del año actual
  const diasSuspensionAnio = esteAnio.reduce(
    (total, s) => total + (s.dias_suspension || 0),
    0
  );

  // Identificar motivos recurrentes
  const conteoMotivos: Record<string, number> = {};
  for (const s of ultimos12Meses) {
    const key = s.motivo_codigo || s.motivo;
    conteoMotivos[key] = (conteoMotivos[key] || 0) + 1;
  }

  const motivosRecurrentes = Object.entries(conteoMotivos)
    .filter(([, count]) => count >= 2)
    .map(([motivo, cantidad]) => ({
      motivo,
      codigo: undefined, // Se podría mejorar
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // Última sanción
  const ultimaSancion = historial.length > 0 ? historial[0].fecha : null;

  // Verificar si tiene apercibimiento previo a despido
  const tieneAPD = historial.some(
    (s) => s.tipo === "apercibimiento_previo_despido"
  );

  return {
    totalSanciones: historial.length,
    sancionesUltimos12Meses: ultimos12Meses.length,
    diasSuspensionAnioActual: diasSuspensionAnio,
    motivosRecurrentes,
    ultimaSancion,
    tieneApercibimientoPrevioDespido: tieneAPD,
  };
}

// ============================================
// DÍAS DE SUSPENSIÓN DISPONIBLES
// ============================================

/**
 * Calcula cuántos días de suspensión puede recibir aún el empleado este año
 */
export function calcularDiasSuspensionDisponibles(
  historial: SancionHistorial[]
): {
  diasUsados: number;
  diasDisponibles: number;
  limite: number;
  suspensionesEsteAnio: SancionHistorial[];
} {
  const inicioAnio = new Date(new Date().getFullYear(), 0, 1);

  const suspensionesEsteAnio = historial.filter(
    (s) =>
      s.tipo === "suspension" &&
      new Date(s.fecha) >= inicioAnio &&
      s.dias_suspension
  );

  const diasUsados = suspensionesEsteAnio.reduce(
    (total, s) => total + (s.dias_suspension || 0),
    0
  );

  return {
    diasUsados,
    diasDisponibles: Math.max(0, LIMITE_DIAS_SUSPENSION_ANUAL - diasUsados),
    limite: LIMITE_DIAS_SUSPENSION_ANUAL,
    suspensionesEsteAnio,
  };
}

// ============================================
// ANÁLISIS DE PATRONES
// ============================================

/**
 * Analiza patrones de conducta en el historial
 */
export function analizarPatrones(historial: SancionHistorial[]): {
  patronPuntualidad: boolean;
  patronAsistencia: boolean;
  patronConducta: boolean;
  patronSeguridad: boolean;
  escaladaGravedad: boolean;
  mensaje: string | null;
} {
  const hace12Meses = new Date();
  hace12Meses.setMonth(hace12Meses.getMonth() - 12);

  const recientes = historial.filter((s) => new Date(s.fecha) >= hace12Meses);

  // Contar por grupos
  const grupos = {
    puntualidad: 0,
    asistencia: 0,
    conducta: 0,
    seguridad: 0,
  };

  for (const s of recientes) {
    const grupo = s.motivo_codigo ? obtenerGrupoMotivo(s.motivo_codigo) : null;
    if (grupo && grupo in grupos) {
      grupos[grupo as keyof typeof grupos]++;
    }
  }

  // Detectar escalada de gravedad
  const ultimasTres = recientes.slice(0, 3);
  const gravedadOrden: Record<string, number> = { leve: 1, moderada: 2, grave: 3 };
  let escalada = false;

  if (ultimasTres.length >= 3) {
    const gravedades = ultimasTres
      .map((s) => gravedadOrden[s.gravedad || "leve"])
      .reverse();

    escalada =
      gravedades[0] < gravedades[1] && gravedades[1] < gravedades[2];
  }

  // Generar mensaje resumen
  let mensaje: string | null = null;
  const patronesDetectados: string[] = [];

  if (grupos.puntualidad >= 3) patronesDetectados.push("puntualidad");
  if (grupos.asistencia >= 2) patronesDetectados.push("asistencia");
  if (grupos.conducta >= 2) patronesDetectados.push("conducta");
  if (grupos.seguridad >= 2) patronesDetectados.push("seguridad");

  if (patronesDetectados.length > 0) {
    mensaje = `Patrón detectado en: ${patronesDetectados.join(", ")}. `;
  }

  if (escalada) {
    mensaje =
      (mensaje || "") +
      "Se observa escalada en la gravedad de las faltas recientes.";
  }

  return {
    patronPuntualidad: grupos.puntualidad >= 3,
    patronAsistencia: grupos.asistencia >= 2,
    patronConducta: grupos.conducta >= 2,
    patronSeguridad: grupos.seguridad >= 2,
    escaladaGravedad: escalada,
    mensaje,
  };
}

// ============================================
// FUNCIÓN INTEGRADA PRINCIPAL
// ============================================

export interface ResultadoAnalisisEmpleado {
  historial: SancionHistorial[];
  resumen: ResumenReincidencia;
  reincidenciaParaMotivo: NivelReincidencia;
  diasSuspension: {
    diasUsados: number;
    diasDisponibles: number;
    limite: number;
  };
  patrones: {
    patronPuntualidad: boolean;
    patronAsistencia: boolean;
    patronConducta: boolean;
    patronSeguridad: boolean;
    escaladaGravedad: boolean;
    mensaje: string | null;
  };
}

/**
 * Función principal que obtiene y analiza todo el historial de un empleado
 */
export async function analizarEmpleado(
  supabase: SupabaseClient,
  empleadoId: string,
  motivoCodigo?: string,
  motivoTexto?: string
): Promise<ResultadoAnalisisEmpleado> {
  // Obtener historial
  const historial = await obtenerHistorialEmpleado(supabase, empleadoId);

  // Generar análisis
  const resumen = generarResumenHistorial(historial);
  const reincidencia = calcularReincidencia(historial, motivoCodigo, motivoTexto);
  const diasSuspension = calcularDiasSuspensionDisponibles(historial);
  const patrones = analizarPatrones(historial);

  return {
    historial,
    resumen,
    reincidenciaParaMotivo: reincidencia,
    diasSuspension: {
      diasUsados: diasSuspension.diasUsados,
      diasDisponibles: diasSuspension.diasDisponibles,
      limite: diasSuspension.limite,
    },
    patrones,
  };
}
