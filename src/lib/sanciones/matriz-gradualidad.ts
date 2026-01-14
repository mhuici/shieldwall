/**
 * Matriz de Gradualidad - Motor de Recomendación de Sanciones
 *
 * Implementa la lógica de proporcionalidad entre:
 * - Gravedad del hecho (leve, moderada, grave)
 * - Nivel de reincidencia (primera vez, reincidente, reincidente múltiple)
 *
 * Basado en principios de la LCT:
 * - Art. 67: Facultades disciplinarias del empleador
 * - Art. 68: Modalidades de su ejercicio (proporcionalidad)
 * - Art. 218-220: Requisitos de validez de sanciones
 */

import type {
  TipoSancion,
  Gravedad,
  NivelReincidencia,
  RecomendacionSancion,
  MotivoSancion,
  ResumenReincidencia,
} from "@/lib/types";
import { obtenerMotivoPorCodigo } from "./motivos-por-rubro";

// ============================================
// MATRIZ DE RECOMENDACIÓN
// ============================================

interface CeldaMatriz {
  tipo: TipoSancion;
  diasSuspensionMin?: number;
  diasSuspensionMax?: number;
  explicacion: string;
}

/**
 * Matriz: [gravedad][reincidencia] => recomendación
 */
const MATRIZ: Record<Gravedad, Record<NivelReincidencia, CeldaMatriz>> = {
  leve: {
    primera_vez: {
      tipo: "apercibimiento",
      explicacion:
        "Para faltas leves sin antecedentes, corresponde un llamado de atención formal.",
    },
    reincidente: {
      tipo: "apercibimiento",
      explicacion:
        "Reincidencia en falta leve. Se recomienda apercibimiento con advertencia de suspensión futura.",
    },
    reincidente_multiple: {
      tipo: "suspension",
      diasSuspensionMin: 1,
      diasSuspensionMax: 2,
      explicacion:
        "Reincidencia múltiple en faltas leves justifica una suspensión breve para marcar gravedad.",
    },
  },
  moderada: {
    primera_vez: {
      tipo: "apercibimiento",
      explicacion:
        "Falta moderada sin antecedentes. Apercibimiento con advertencia clara de consecuencias.",
    },
    reincidente: {
      tipo: "suspension",
      diasSuspensionMin: 1,
      diasSuspensionMax: 3,
      explicacion:
        "Reincidencia en falta moderada. Suspensión breve proporcional a la conducta.",
    },
    reincidente_multiple: {
      tipo: "suspension",
      diasSuspensionMin: 5,
      diasSuspensionMax: 10,
      explicacion:
        "Reincidencia múltiple en faltas moderadas. Suspensión significativa. Evalúe próximos pasos.",
    },
  },
  grave: {
    primera_vez: {
      tipo: "suspension",
      diasSuspensionMin: 3,
      diasSuspensionMax: 5,
      explicacion:
        "Falta grave aún sin antecedentes justifica suspensión. La gravedad intrínseca lo requiere.",
    },
    reincidente: {
      tipo: "suspension",
      diasSuspensionMin: 10,
      diasSuspensionMax: 15,
      explicacion:
        "Reincidencia en falta grave. Suspensión prolongada. Considere seriamente el apercibimiento previo.",
    },
    reincidente_multiple: {
      tipo: "apercibimiento_previo_despido",
      explicacion:
        "Reincidencia múltiple en faltas graves. Última advertencia antes de considerar despido con causa.",
    },
  },
};

// ============================================
// FUNCIÓN PRINCIPAL DE RECOMENDACIÓN
// ============================================

export interface InputRecomendacion {
  motivoCodigo?: string;
  motivoNombre?: string;
  gravedad?: Gravedad;
  reincidencia: NivelReincidencia;
  historial?: ResumenReincidencia;
}

/**
 * Genera una recomendación de sanción basada en la matriz de gradualidad
 */
export function obtenerRecomendacion(input: InputRecomendacion): RecomendacionSancion {
  let gravedad: Gravedad = input.gravedad || "moderada";
  let motivoNombre = input.motivoNombre || "No especificado";
  const advertencias: string[] = [];

  // Si tenemos código de motivo, obtener gravedad del catálogo
  if (input.motivoCodigo) {
    const motivo = obtenerMotivoPorCodigo(input.motivoCodigo);
    if (motivo) {
      gravedad = motivo.gravedad;
      motivoNombre = motivo.nombre;
    }
  }

  // Obtener celda de la matriz
  const celda = MATRIZ[gravedad][input.reincidencia];

  // Agregar advertencias contextuales
  if (input.historial) {
    // Advertencia si se acerca al límite de suspensiones
    if (input.historial.diasSuspensionAnioActual >= 20) {
      advertencias.push(
        `⚠️ El empleado ya tiene ${input.historial.diasSuspensionAnioActual} días de suspensión este año. ` +
        `Límite legal: 30 días (Art. 220 LCT).`
      );
    }

    // Advertencia si ya tiene apercibimiento previo a despido
    if (input.historial.tieneApercibimientoPrevioDespido) {
      advertencias.push(
        "⚠️ El empleado ya recibió un Apercibimiento Previo al Despido. " +
        "Una nueva falta grave podría justificar despido con causa."
      );
    }

    // Advertencia si hay muchas sanciones recientes
    if (input.historial.sancionesUltimos12Meses >= 3) {
      advertencias.push(
        `ℹ️ El empleado tiene ${input.historial.sancionesUltimos12Meses} sanciones en los últimos 12 meses. ` +
        "Evalúe si corresponde escalar la medida disciplinaria."
      );
    }
  }

  // Advertencia especial para apercibimiento previo a despido
  if (celda.tipo === "apercibimiento_previo_despido") {
    advertencias.push(
      "⚠️ IMPORTANTE: El Apercibimiento Previo al Despido es la última instancia disciplinaria. " +
      "Una nueva falta similar podría configurar injuria grave (Art. 242 LCT)."
    );
  }

  return {
    tipoSugerido: celda.tipo,
    diasSuspensionMin: celda.diasSuspensionMin,
    diasSuspensionMax: celda.diasSuspensionMax,
    motivo: motivoNombre,
    explicacion: celda.explicacion,
    advertencias,
  };
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Determina si se puede aplicar una suspensión de X días
 * considerando el límite anual del Art. 220 LCT
 */
export function validarDiasSuspension(
  diasSolicitados: number,
  diasYaUsados: number
): { permitido: boolean; diasDisponibles: number; mensaje: string } {
  const LIMITE_ANUAL = 30;
  const diasDisponibles = LIMITE_ANUAL - diasYaUsados;

  if (diasSolicitados <= diasDisponibles) {
    return {
      permitido: true,
      diasDisponibles,
      mensaje: `Suspensión válida. Días disponibles restantes: ${diasDisponibles - diasSolicitados}`,
    };
  }

  return {
    permitido: false,
    diasDisponibles,
    mensaje:
      `No se puede aplicar suspensión de ${diasSolicitados} días. ` +
      `Límite anual: ${LIMITE_ANUAL} días, ya usados: ${diasYaUsados}, disponibles: ${diasDisponibles}. ` +
      `(Art. 220 LCT)`,
  };
}

/**
 * Sugiere días de suspensión dentro del rango recomendado,
 * ajustando según días disponibles
 */
export function sugerirDiasSuspension(
  recomendacion: RecomendacionSancion,
  diasDisponibles: number
): number {
  if (!recomendacion.diasSuspensionMin || !recomendacion.diasSuspensionMax) {
    return 0;
  }

  const min = recomendacion.diasSuspensionMin;
  const max = recomendacion.diasSuspensionMax;

  // Si no hay días disponibles suficientes para el mínimo
  if (diasDisponibles < min) {
    return diasDisponibles > 0 ? diasDisponibles : 0;
  }

  // Sugerir el punto medio del rango, sin exceder disponibles
  const sugerido = Math.ceil((min + max) / 2);
  return Math.min(sugerido, diasDisponibles);
}

/**
 * Obtiene texto descriptivo del nivel de reincidencia
 */
export function descripcionReincidencia(nivel: NivelReincidencia): string {
  const descripciones: Record<NivelReincidencia, string> = {
    primera_vez: "Primera vez - Sin antecedentes de esta conducta",
    reincidente: "Reincidente - Entre 1 y 3 antecedentes similares",
    reincidente_multiple: "Reincidente múltiple - 4 o más antecedentes similares",
  };
  return descripciones[nivel];
}

/**
 * Obtiene el color/variante para mostrar la gravedad en UI
 */
export function colorGravedad(gravedad: Gravedad): {
  bg: string;
  text: string;
  border: string;
} {
  const colores: Record<Gravedad, { bg: string; text: string; border: string }> = {
    leve: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    moderada: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    grave: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
  };
  return colores[gravedad];
}

/**
 * Obtiene el color/variante para mostrar el tipo de sanción en UI
 */
export function colorTipoSancion(tipo: TipoSancion): {
  bg: string;
  text: string;
  border: string;
} {
  const colores: Record<TipoSancion, { bg: string; text: string; border: string }> = {
    apercibimiento: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    suspension: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    apercibimiento_previo_despido: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
  };
  return colores[tipo];
}
