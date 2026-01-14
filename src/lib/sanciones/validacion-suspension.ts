/**
 * Validación de Suspensiones - Art. 220 LCT
 *
 * El Art. 220 de la Ley de Contrato de Trabajo establece:
 * "Las suspensiones fundadas en razones disciplinarias [...] no podrán
 * exceder de treinta (30) días en un (1) año, contados a partir de la
 * primera suspensión."
 *
 * Este módulo valida:
 * - Límite de 30 días anuales
 * - Solapamiento de fechas entre suspensiones
 * - Fechas coherentes (inicio < fin)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ValidacionSuspensionInput,
  ResultadoValidacionSuspension,
  SuspensionExistente,
  AlertaSuspension,
} from "@/lib/types";
import { LIMITE_DIAS_SUSPENSION_ANUAL } from "@/lib/types";

// ============================================
// OBTENER SUSPENSIONES DEL AÑO
// ============================================

/**
 * Obtiene todas las suspensiones del empleado en el año actual
 */
export async function obtenerSuspensionesAnio(
  supabase: SupabaseClient,
  empleadoId: string
): Promise<SuspensionExistente[]> {
  const inicioAnio = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("notificaciones")
    .select("id, fecha_inicio_suspension, fecha_fin_suspension, dias_suspension")
    .eq("empleado_id", empleadoId)
    .eq("tipo", "suspension")
    .gte("fecha_hecho", inicioAnio)
    .in("estado", ["enviado", "leido", "firme"]);

  if (error) {
    console.error("Error obteniendo suspensiones:", error);
    return [];
  }

  return (data || [])
    .filter((s) => s.fecha_inicio_suspension && s.fecha_fin_suspension)
    .map((s) => ({
      id: s.id,
      fecha_inicio: s.fecha_inicio_suspension!,
      fecha_fin: s.fecha_fin_suspension!,
      dias: s.dias_suspension || 0,
    }));
}

// ============================================
// VALIDACIÓN PRINCIPAL
// ============================================

/**
 * Valida si una nueva suspensión es permitida según Art. 220 LCT
 */
export async function validarSuspension(
  supabase: SupabaseClient,
  input: ValidacionSuspensionInput
): Promise<ResultadoValidacionSuspension> {
  const alertas: AlertaSuspension[] = [];
  const solapamientos: SuspensionExistente[] = [];

  // Validar fechas básicas
  const fechaInicio = new Date(input.fechaInicio);
  const fechaFin = new Date(input.fechaFin);

  if (fechaFin <= fechaInicio) {
    alertas.push({
      tipo: "error",
      codigo: "FECHA_INVALIDA",
      mensaje: "La fecha de fin debe ser posterior a la fecha de inicio.",
    });

    return {
      permitido: false,
      diasUsadosAnio: 0,
      diasDisponibles: LIMITE_DIAS_SUSPENSION_ANUAL,
      alertas,
      solapamientos: [],
    };
  }

  // Calcular días hábiles (simplificado: sin fines de semana)
  const diasSolicitados = calcularDiasHabiles(fechaInicio, fechaFin);

  if (diasSolicitados !== input.diasSolicitados) {
    alertas.push({
      tipo: "warning",
      codigo: "DIAS_AJUSTADOS",
      mensaje: `Los días calculados (${diasSolicitados}) difieren de los ingresados (${input.diasSolicitados}). Se usarán ${diasSolicitados} días hábiles.`,
    });
  }

  // Obtener suspensiones existentes
  const suspensionesExistentes = await obtenerSuspensionesAnio(
    supabase,
    input.empleadoId
  );

  // Calcular días ya usados
  const diasUsadosAnio = suspensionesExistentes.reduce(
    (total, s) => total + s.dias,
    0
  );

  const diasDisponibles = LIMITE_DIAS_SUSPENSION_ANUAL - diasUsadosAnio;

  // Verificar límite anual
  if (diasSolicitados > diasDisponibles) {
    alertas.push({
      tipo: "error",
      codigo: "LIMITE_ANUAL_EXCEDIDO",
      mensaje:
        `No se puede aplicar suspensión de ${diasSolicitados} días. ` +
        `El empleado ya tiene ${diasUsadosAnio} días de suspensión este año. ` +
        `Disponibles: ${diasDisponibles} días. Límite: ${LIMITE_DIAS_SUSPENSION_ANUAL} días (Art. 220 LCT).`,
    });
  }

  // Advertencia si se acerca al límite
  if (diasUsadosAnio + diasSolicitados >= 25 && diasUsadosAnio + diasSolicitados <= 30) {
    alertas.push({
      tipo: "warning",
      codigo: "CERCA_LIMITE",
      mensaje:
        `Con esta suspensión, el empleado tendrá ${diasUsadosAnio + diasSolicitados} días de suspensión este año. ` +
        `Considere otras alternativas disciplinarias.`,
    });
  }

  // Verificar solapamientos
  for (const existente of suspensionesExistentes) {
    if (haysSolapamiento(fechaInicio, fechaFin, new Date(existente.fecha_inicio), new Date(existente.fecha_fin))) {
      solapamientos.push(existente);
    }
  }

  if (solapamientos.length > 0) {
    const fechasSolapadas = solapamientos
      .map((s) => `${formatearFecha(s.fecha_inicio)} a ${formatearFecha(s.fecha_fin)}`)
      .join(", ");

    alertas.push({
      tipo: "error",
      codigo: "SOLAPAMIENTO_FECHAS",
      mensaje:
        `Las fechas seleccionadas se solapan con suspensiones existentes: ${fechasSolapadas}. ` +
        `Seleccione un período diferente.`,
    });
  }

  // Determinar si está permitido
  const tieneErrores = alertas.some((a) => a.tipo === "error");

  return {
    permitido: !tieneErrores,
    diasUsadosAnio,
    diasDisponibles,
    alertas,
    solapamientos,
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Calcula días hábiles entre dos fechas (excluye sábados y domingos)
 */
export function calcularDiasHabiles(inicio: Date, fin: Date): number {
  let dias = 0;
  const actual = new Date(inicio);

  while (actual <= fin) {
    const diaSemana = actual.getDay();
    // 0 = domingo, 6 = sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      dias++;
    }
    actual.setDate(actual.getDate() + 1);
  }

  return dias;
}

/**
 * Verifica si dos rangos de fechas se solapan
 */
function haysSolapamiento(
  inicio1: Date,
  fin1: Date,
  inicio2: Date,
  fin2: Date
): boolean {
  return inicio1 <= fin2 && fin1 >= inicio2;
}

/**
 * Formatea una fecha para mostrar
 */
function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ============================================
// VALIDACIÓN SIMPLIFICADA (sin Supabase)
// ============================================

/**
 * Validación rápida sin consultar la base de datos
 * Útil para pre-validación en el cliente
 */
export function validarSuspensionLocal(
  diasSolicitados: number,
  diasYaUsados: number,
  fechaInicio?: string,
  fechaFin?: string
): ResultadoValidacionSuspension {
  const alertas: AlertaSuspension[] = [];
  const diasDisponibles = LIMITE_DIAS_SUSPENSION_ANUAL - diasYaUsados;

  // Validar días
  if (diasSolicitados <= 0) {
    alertas.push({
      tipo: "error",
      codigo: "DIAS_INVALIDOS",
      mensaje: "La cantidad de días debe ser mayor a cero.",
    });
  }

  if (diasSolicitados > diasDisponibles) {
    alertas.push({
      tipo: "error",
      codigo: "LIMITE_ANUAL_EXCEDIDO",
      mensaje:
        `Excede el límite anual. Disponibles: ${diasDisponibles} días (Art. 220 LCT).`,
    });
  }

  // Validar fechas si se proporcionan
  if (fechaInicio && fechaFin) {
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin <= inicio) {
      alertas.push({
        tipo: "error",
        codigo: "FECHA_INVALIDA",
        mensaje: "La fecha de fin debe ser posterior a la de inicio.",
      });
    }

    // Verificar que la fecha de inicio no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (inicio < hoy) {
      alertas.push({
        tipo: "warning",
        codigo: "FECHA_PASADA",
        mensaje: "La fecha de inicio es anterior a hoy. Verifique si es correcto.",
      });
    }
  }

  // Advertencias
  if (diasYaUsados + diasSolicitados >= 25 && diasYaUsados + diasSolicitados <= 30) {
    alertas.push({
      tipo: "warning",
      codigo: "CERCA_LIMITE",
      mensaje: `El empleado alcanzará ${diasYaUsados + diasSolicitados}/30 días de suspensión este año.`,
    });
  }

  return {
    permitido: !alertas.some((a) => a.tipo === "error"),
    diasUsadosAnio: diasYaUsados,
    diasDisponibles,
    alertas,
    solapamientos: [],
  };
}

// ============================================
// SUGERENCIA DE FECHAS
// ============================================

/**
 * Sugiere fechas de inicio y fin para una suspensión de X días hábiles
 */
export function sugerirFechasSuspension(
  diasHabiles: number,
  suspensionesExistentes: SuspensionExistente[] = []
): { fechaInicio: string; fechaFin: string } {
  let fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() + 1); // Empezar mañana

  // Saltar fines de semana para el inicio
  while (fechaInicio.getDay() === 0 || fechaInicio.getDay() === 6) {
    fechaInicio.setDate(fechaInicio.getDate() + 1);
  }

  // Verificar que no solape con suspensiones existentes
  for (const existente of suspensionesExistentes) {
    const finExistente = new Date(existente.fecha_fin);
    if (fechaInicio <= finExistente) {
      fechaInicio = new Date(finExistente);
      fechaInicio.setDate(fechaInicio.getDate() + 1);

      // Saltar fines de semana
      while (fechaInicio.getDay() === 0 || fechaInicio.getDay() === 6) {
        fechaInicio.setDate(fechaInicio.getDate() + 1);
      }
    }
  }

  // Calcular fecha fin
  let diasContados = 0;
  const fechaFin = new Date(fechaInicio);

  while (diasContados < diasHabiles) {
    if (fechaFin.getDay() !== 0 && fechaFin.getDay() !== 6) {
      diasContados++;
    }
    if (diasContados < diasHabiles) {
      fechaFin.setDate(fechaFin.getDate() + 1);
    }
  }

  return {
    fechaInicio: fechaInicio.toISOString().split("T")[0],
    fechaFin: fechaFin.toISOString().split("T")[0],
  };
}
