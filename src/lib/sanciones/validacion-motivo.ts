/**
 * Validación de Especificidad del Motivo
 *
 * La jurisprudencia laboral argentina es clara: las sanciones "genéricas"
 * son inválidas. Este módulo valida que la descripción de los hechos sea
 * lo suficientemente específica para tener validez probatoria.
 *
 * Requisitos para una sanción válida:
 * - Fecha del hecho (cuándo)
 * - Hora aproximada (cuándo - opcional pero recomendado)
 * - Descripción detallada (qué pasó exactamente)
 * - Lugar (dónde - contextual)
 * - Testigos (quién vio - para faltas graves)
 */

import type { ResultadoValidacionMotivo, Testigo, MotivoSancion } from "@/lib/types";
import { obtenerMotivoPorCodigo } from "./motivos-por-rubro";

// ============================================
// FRASES GENÉRICAS PROHIBIDAS
// ============================================

const FRASES_GENERICAS = [
  "mal comportamiento",
  "mala actitud",
  "actitud negativa",
  "falta de compromiso",
  "no cumple con sus tareas",
  "no trabaja bien",
  "problemas de actitud",
  "conducta inapropiada",
  "comportamiento inadecuado",
  "falta de profesionalismo",
  "no cumple expectativas",
  "desempeño deficiente",
  "bajo rendimiento",
  "falta de colaboración",
  "no se esfuerza",
  "siempre llega tarde", // muy vago
  "constantemente falta", // muy vago
];

// Palabras que indican falta de especificidad
const PALABRAS_VAGAS = [
  "siempre",
  "nunca",
  "constantemente",
  "habitualmente",
  "reiteradamente",
  "frecuentemente",
  "varias veces",
  "muchas veces",
  "algunas veces",
  "a veces",
  "generalmente",
];

// Palabras que indican buena especificidad
const PALABRAS_ESPECIFICAS = [
  "el día",
  "a las",
  "hrs",
  "horas",
  "minutos",
  "aproximadamente",
  "específicamente",
  "concretamente",
  "en el sector",
  "en la zona",
  "presenciado por",
  "testigo",
  "ante la presencia de",
];

// ============================================
// VALIDACIÓN PRINCIPAL
// ============================================

export interface InputValidacionMotivo {
  descripcion: string;
  fechaHecho?: string;
  horaHecho?: string;
  lugarHecho?: string;
  testigos?: Testigo[];
  motivoCodigo?: string;
}

/**
 * Valida la especificidad de una descripción de sanción
 */
export function validarEspecificidadMotivo(
  input: InputValidacionMotivo
): ResultadoValidacionMotivo {
  const errores: string[] = [];
  const advertencias: string[] = [];
  let score = 100;

  const descripcion = input.descripcion.trim();
  const descripcionLower = descripcion.toLowerCase();

  // =========================================
  // VALIDACIONES OBLIGATORIAS (errores)
  // =========================================

  // 1. Longitud mínima
  if (descripcion.length < 50) {
    errores.push(
      "La descripción es demasiado corta. Debe tener al menos 50 caracteres para ser específica."
    );
    score -= 30;
  } else if (descripcion.length < 100) {
    advertencias.push(
      "La descripción es breve. Se recomienda al menos 100 caracteres para mejor respaldo legal."
    );
    score -= 10;
  }

  // 2. Frases genéricas prohibidas
  const frasesEncontradas: string[] = [];
  for (const frase of FRASES_GENERICAS) {
    if (descripcionLower.includes(frase)) {
      frasesEncontradas.push(frase);
    }
  }

  if (frasesEncontradas.length > 0) {
    errores.push(
      `Evite frases genéricas: "${frasesEncontradas.join('", "')}". ` +
      "Describa hechos concretos y verificables."
    );
    score -= 25 * frasesEncontradas.length;
  }

  // 3. Palabras vagas sin contexto específico
  const palabrasVagasEncontradas: string[] = [];
  for (const palabra of PALABRAS_VAGAS) {
    if (descripcionLower.includes(palabra)) {
      palabrasVagasEncontradas.push(palabra);
    }
  }

  if (palabrasVagasEncontradas.length > 0) {
    advertencias.push(
      `Palabras como "${palabrasVagasEncontradas.join('", "')}` +
      '" son vagas. Especifique fechas y hechos concretos.'
    );
    score -= 5 * palabrasVagasEncontradas.length;
  }

  // =========================================
  // VALIDACIONES DE CONTEXTO
  // =========================================

  // 4. Verificar que incluya fecha
  if (!input.fechaHecho) {
    errores.push("Debe especificar la fecha del hecho.");
    score -= 20;
  }

  // 5. Hora (recomendado)
  const tieneHoraEnDescripcion =
    /\d{1,2}:\d{2}|(\d{1,2}\s*(hs|hrs|horas|am|pm))/i.test(descripcion);

  if (!input.horaHecho && !tieneHoraEnDescripcion) {
    advertencias.push(
      "Se recomienda especificar la hora aproximada del hecho para mayor precisión."
    );
    score -= 5;
  }

  // 6. Lugar (contextual)
  const tieneLugarEnDescripcion =
    /(en el |en la |sector |área |zona |oficina |local |sucursal )/i.test(descripcion);

  if (!input.lugarHecho && !tieneLugarEnDescripcion) {
    advertencias.push(
      "Considere especificar el lugar donde ocurrió el hecho."
    );
    score -= 3;
  }

  // =========================================
  // VALIDACIONES SEGÚN TIPO DE MOTIVO
  // =========================================

  // 7. Si el motivo requiere testigos, verificar
  if (input.motivoCodigo) {
    const motivo = obtenerMotivoPorCodigo(input.motivoCodigo);

    if (motivo?.requiere_testigos) {
      if (!input.testigos || input.testigos.length === 0) {
        errores.push(
          `El motivo "${motivo.nombre}" requiere al menos un testigo para tener validez.`
        );
        score -= 20;
      }
    }
  }

  // 8. Validar testigos si se proporcionan
  if (input.testigos && input.testigos.length > 0) {
    for (let i = 0; i < input.testigos.length; i++) {
      const testigo = input.testigos[i];

      if (!testigo.nombre || testigo.nombre.trim().length < 3) {
        errores.push(`Testigo ${i + 1}: Debe especificar el nombre completo.`);
        score -= 10;
      }

      if (!testigo.cargo || testigo.cargo.trim().length < 2) {
        advertencias.push(
          `Testigo ${i + 1}: Se recomienda especificar el cargo/puesto.`
        );
        score -= 3;
      }
    }
  }

  // =========================================
  // BONIFICACIONES POR BUENA PRÁCTICA
  // =========================================

  // Bonificar palabras específicas
  let bonificacion = 0;
  for (const palabra of PALABRAS_ESPECIFICAS) {
    if (descripcionLower.includes(palabra)) {
      bonificacion += 3;
    }
  }

  // Bonificar si menciona nombres propios (patrón: mayúscula seguida de minúsculas)
  const nombresPropios = descripcion.match(/[A-Z][a-záéíóúñ]+\s+[A-Z][a-záéíóúñ]+/g);
  if (nombresPropios && nombresPropios.length > 0) {
    bonificacion += 5;
  }

  // Bonificar si tiene estructura clara (puntos, comas, conectores)
  const tieneEstructura =
    descripcion.includes(".") ||
    descripcion.includes(",") ||
    /( y | que | cuando | donde | mientras )/i.test(descripcion);

  if (tieneEstructura && descripcion.length > 100) {
    bonificacion += 5;
  }

  score = Math.min(100, Math.max(0, score + bonificacion));

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
    score,
  };
}

// ============================================
// SUGERENCIAS DE MEJORA
// ============================================

/**
 * Genera sugerencias específicas para mejorar una descripción
 */
export function generarSugerenciasMejora(
  descripcion: string,
  motivoCodigo?: string
): string[] {
  const sugerencias: string[] = [];
  const descripcionLower = descripcion.toLowerCase();

  // Sugerencias basadas en lo que falta
  if (!/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(descripcion) && !/el día \d/.test(descripcionLower)) {
    sugerencias.push(
      'Incluya la fecha exacta del hecho (ej: "El día 15/01/2026...")'
    );
  }

  if (!/\d{1,2}:\d{2}/.test(descripcion) && !/\d{1,2}\s*hs/i.test(descripcion)) {
    sugerencias.push(
      'Especifique la hora aproximada (ej: "...a las 14:30 aproximadamente...")'
    );
  }

  if (!/(en el |en la |sector |área )/i.test(descripcion)) {
    sugerencias.push(
      'Indique el lugar del hecho (ej: "...en el sector de caja...")'
    );
  }

  if (!/presenci|testig|vio|observ/i.test(descripcion)) {
    sugerencias.push(
      'Mencione testigos si los hay (ej: "...presenciado por María García, supervisora...")'
    );
  }

  if (descripcion.length < 150) {
    sugerencias.push(
      "Amplíe la descripción con más detalles del contexto y las circunstancias."
    );
  }

  // Sugerencias específicas por tipo de motivo
  if (motivoCodigo) {
    const motivo = obtenerMotivoPorCodigo(motivoCodigo);

    if (motivo) {
      switch (motivo.codigo) {
        case "llegada_tarde_15min":
        case "llegada_tarde_30min":
          sugerencias.push(
            'Especifique la hora de llegada real vs. la hora pactada (ej: "Ingresó a las 09:25 cuando su horario es 09:00")'
          );
          break;

        case "falta_sin_aviso":
          sugerencias.push(
            "Indique si se intentó contactar al empleado y el resultado."
          );
          break;

        case "dano_mercaderia_leve":
        case "dano_mercaderia_grave":
          sugerencias.push(
            "Describa qué mercadería fue dañada y el valor aproximado."
          );
          break;

        case "faltante_caja":
        case "faltante_caja_grave":
          sugerencias.push(
            "Indique el monto del faltante y el arqueo realizado."
          );
          break;

        case "agresion_verbal":
        case "agresion_fisica":
          sugerencias.push(
            "Transcriba las palabras exactas o describa los actos específicos."
          );
          break;
      }
    }
  }

  return sugerencias;
}

// ============================================
// TEMPLATE DE DESCRIPCIÓN
// ============================================

/**
 * Genera un template de descripción basado en el motivo seleccionado
 */
export function generarTemplateDescripcion(motivoCodigo: string): string {
  const motivo = obtenerMotivoPorCodigo(motivoCodigo);

  if (!motivo) {
    return `El día [FECHA], a las [HORA] aproximadamente, en [LUGAR], el/la empleado/a [DESCRIPCIÓN DETALLADA DEL HECHO]. Este hecho fue presenciado por [NOMBRE], [CARGO].`;
  }

  const templates: Record<string, string> = {
    llegada_tarde_15min: `El día [FECHA], el/la empleado/a ingresó a las [HORA REAL] cuando su horario de ingreso pactado es [HORA PACTADA], acumulando un retraso de [X] minutos. Se verificó el registro de ingreso en [SISTEMA/RELOJ].`,

    llegada_tarde_30min: `El día [FECHA], el/la empleado/a ingresó a las [HORA REAL] cuando su horario de ingreso pactado es [HORA PACTADA], acumulando un retraso de [X] minutos sin justificación previa. Se verificó el registro de ingreso en [SISTEMA/RELOJ].`,

    falta_sin_aviso: `El día [FECHA], el/la empleado/a no se presentó a trabajar sin dar aviso previo. Se intentó comunicación telefónica a las [HORA] sin obtener respuesta. Su horario de trabajo era de [HORARIO].`,

    abandono_puesto_momentaneo: `El día [FECHA], a las [HORA] aproximadamente, el/la empleado/a abandonó su puesto de trabajo en [LUGAR/SECTOR] sin autorización de su superior, ausentándose por [DURACIÓN]. Este hecho fue observado por [NOMBRE], [CARGO].`,

    desobediencia_orden: `El día [FECHA], a las [HORA] aproximadamente, se le impartió al empleado/a la orden de [DESCRIBIR ORDEN] por parte de [SUPERIOR], [CARGO]. El/la empleado/a se negó a cumplirla manifestando [QUÉ DIJO/HIZO]. Testigo: [NOMBRE], [CARGO].`,

    agresion_verbal: `El día [FECHA], a las [HORA] aproximadamente, en [LUGAR], el/la empleado/a dirigió expresiones agraviantes hacia [VÍCTIMA], [CARGO], manifestando textualmente: "[PALABRAS EXACTAS]". Este hecho fue presenciado por [NOMBRE], [CARGO].`,

    incumplimiento_higiene: `El día [FECHA], durante la inspección de rutina realizada a las [HORA], se constató que el/la empleado/a [DESCRIBIR INCUMPLIMIENTO ESPECÍFICO] en el sector [LUGAR]. Verificado por [NOMBRE], [CARGO].`,

    faltante_caja: `El día [FECHA], al realizar el cierre de caja del turno [MAÑANA/TARDE/NOCHE], se detectó un faltante de $[MONTO] en la caja operada por el/la empleado/a. El arqueo fue realizado por [NOMBRE], [CARGO], y verificado por [NOMBRE 2], [CARGO 2].`,
  };

  return (
    templates[motivo.codigo] ||
    `El día [FECHA], a las [HORA] aproximadamente, en [LUGAR], el/la empleado/a [DESCRIPCIÓN DETALLADA: qué hizo exactamente, qué consecuencias tuvo, qué norma/procedimiento incumplió]. Este hecho fue presenciado por [NOMBRE], [CARGO].`
  );
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula el score de especificidad de 0 a 100
 */
export function calcularScoreEspecificidad(descripcion: string): number {
  const resultado = validarEspecificidadMotivo({ descripcion });
  return resultado.score;
}

/**
 * Verifica si una descripción es suficientemente específica para uso legal
 */
export function esDescripcionValida(descripcion: string, motivoCodigo?: string): boolean {
  const resultado = validarEspecificidadMotivo({ descripcion, motivoCodigo });
  return resultado.valido && resultado.score >= 60;
}
