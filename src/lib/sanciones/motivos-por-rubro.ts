/**
 * Catálogo de Motivos de Sanción por Rubro
 *
 * Cada motivo tiene:
 * - codigo: Identificador único para tracking y reincidencia
 * - nombre: Texto mostrado al usuario
 * - gravedad: leve | moderada | grave
 * - descripcion_legal: Fundamento jurídico (opcional)
 * - requiere_testigos: Si es obligatorio agregar testigos
 * - aplica_a_rubros: Rubros específicos (vacío = universal)
 */

import type { MotivoSancion, Rubro, Gravedad } from "@/lib/types";

// ============================================
// MOTIVOS UNIVERSALES (todos los rubros)
// ============================================

export const MOTIVOS_UNIVERSALES: MotivoSancion[] = [
  // LEVES
  {
    codigo: "llegada_tarde_15min",
    nombre: "Llegada tarde (hasta 15 minutos)",
    gravedad: "leve",
    descripcion_legal: "Incumplimiento del horario de ingreso pactado",
  },
  {
    codigo: "llegada_tarde_30min",
    nombre: "Llegada tarde (más de 15 minutos)",
    gravedad: "leve",
    descripcion_legal: "Incumplimiento reiterado o significativo del horario de ingreso",
  },
  {
    codigo: "uso_celular",
    nombre: "Uso indebido de celular en horario laboral",
    gravedad: "leve",
    descripcion_legal: "Distracción durante el horario de trabajo efectivo",
  },
  {
    codigo: "vestimenta_inadecuada",
    nombre: "Incumplimiento de normas de vestimenta/uniforme",
    gravedad: "leve",
    descripcion_legal: "No uso del uniforme reglamentario o vestimenta inadecuada",
  },
  {
    codigo: "descanso_excedido",
    nombre: "Exceso en tiempo de descanso/almuerzo",
    gravedad: "leve",
    descripcion_legal: "Extensión no autorizada del tiempo de descanso",
  },

  // MODERADAS
  {
    codigo: "falta_sin_aviso",
    nombre: "Falta sin aviso previo",
    gravedad: "moderada",
    descripcion_legal: "Inasistencia sin comunicación previa al empleador (Art. 84 LCT)",
  },
  {
    codigo: "abandono_puesto_momentaneo",
    nombre: "Abandono momentáneo del puesto sin autorización",
    gravedad: "moderada",
    descripcion_legal: "Alejamiento del puesto de trabajo sin permiso del superior",
  },
  {
    codigo: "desobediencia_orden",
    nombre: "Desobediencia a orden directa del superior",
    gravedad: "moderada",
    descripcion_legal: "Incumplimiento de directiva legítima (Art. 86 LCT - deber de obediencia)",
    requiere_testigos: true,
  },
  {
    codigo: "trato_inadecuado_companero",
    nombre: "Trato irrespetuoso a compañero de trabajo",
    gravedad: "moderada",
    descripcion_legal: "Afectación del buen clima laboral",
    requiere_testigos: true,
  },
  {
    codigo: "negligencia_tareas",
    nombre: "Negligencia en el cumplimiento de tareas",
    gravedad: "moderada",
    descripcion_legal: "Falta de diligencia y colaboración (Art. 84 LCT)",
  },
  {
    codigo: "uso_indebido_recursos",
    nombre: "Uso indebido de recursos de la empresa",
    gravedad: "moderada",
    descripcion_legal: "Utilización de bienes del empleador para fines personales",
  },

  // GRAVES
  {
    codigo: "agresion_verbal",
    nombre: "Agresión verbal a compañero o superior",
    gravedad: "grave",
    descripcion_legal: "Injuria que afecta la relación laboral (Art. 242 LCT)",
    requiere_testigos: true,
  },
  {
    codigo: "agresion_fisica",
    nombre: "Agresión física en el lugar de trabajo",
    gravedad: "grave",
    descripcion_legal: "Violencia física - injuria grave (Art. 242 LCT)",
    requiere_testigos: true,
  },
  {
    codigo: "insubordinacion_grave",
    nombre: "Insubordinación grave",
    gravedad: "grave",
    descripcion_legal: "Negativa expresa a cumplir órdenes legítimas (Art. 242 LCT)",
    requiere_testigos: true,
  },
  {
    codigo: "falsificacion_documentos",
    nombre: "Falsificación de documentos o registros",
    gravedad: "grave",
    descripcion_legal: "Adulteración de información laboral - pérdida de confianza",
  },
  {
    codigo: "consumo_alcohol_drogas",
    nombre: "Consumo de alcohol o drogas en el trabajo",
    gravedad: "grave",
    descripcion_legal: "Estado de ebriedad o bajo efectos de sustancias durante la jornada",
    requiere_testigos: true,
  },
  {
    codigo: "robo_hurto",
    nombre: "Sustracción de bienes de la empresa o compañeros",
    gravedad: "grave",
    descripcion_legal: "Pérdida de confianza - injuria grave (Art. 242 LCT)",
  },
  {
    codigo: "acoso_laboral",
    nombre: "Acoso laboral (mobbing)",
    gravedad: "grave",
    descripcion_legal: "Conducta hostil sistemática hacia un trabajador",
    requiere_testigos: true,
  },
  {
    codigo: "acoso_sexual",
    nombre: "Acoso sexual",
    gravedad: "grave",
    descripcion_legal: "Conducta de naturaleza sexual no consentida (Ley 26.485)",
    requiere_testigos: true,
  },
  {
    codigo: "divulgacion_informacion_confidencial",
    nombre: "Divulgación de información confidencial",
    gravedad: "grave",
    descripcion_legal: "Violación del deber de fidelidad (Art. 85 LCT)",
  },
];

// ============================================
// MOTIVOS ESPECÍFICOS POR RUBRO
// ============================================

export const MOTIVOS_GASTRONOMIA: MotivoSancion[] = [
  // LEVES
  {
    codigo: "uniforme_sucio",
    nombre: "Uniforme sucio o en mal estado",
    gravedad: "leve",
    descripcion_legal: "Incumplimiento de normas de presentación personal",
    aplica_a_rubros: ["gastronomia"],
  },

  // MODERADAS
  {
    codigo: "incumplimiento_higiene",
    nombre: "Incumplimiento de normas de higiene básicas",
    gravedad: "moderada",
    descripcion_legal: "No lavado de manos, uso incorrecto de guantes, etc.",
    aplica_a_rubros: ["gastronomia"],
  },
  {
    codigo: "libreta_sanitaria_vencida",
    nombre: "Libreta sanitaria vencida o sin renovar",
    gravedad: "moderada",
    descripcion_legal: "Incumplimiento de requisito habilitante (normativa bromatológica)",
    aplica_a_rubros: ["gastronomia"],
  },
  {
    codigo: "trato_inadecuado_cliente",
    nombre: "Trato inadecuado a cliente",
    gravedad: "moderada",
    descripcion_legal: "Afectación de la imagen comercial del establecimiento",
    requiere_testigos: true,
    aplica_a_rubros: ["gastronomia", "comercio"],
  },
  {
    codigo: "consumo_mercaderia",
    nombre: "Consumo no autorizado de mercadería",
    gravedad: "moderada",
    descripcion_legal: "Apropiación de productos sin autorización",
    aplica_a_rubros: ["gastronomia", "comercio"],
  },

  // GRAVES
  {
    codigo: "bromatologia_grave",
    nombre: "Violación grave de normas bromatológicas",
    gravedad: "grave",
    descripcion_legal: "Incumplimiento que pone en riesgo la salud pública",
    aplica_a_rubros: ["gastronomia"],
  },
  {
    codigo: "contaminacion_cruzada",
    nombre: "Contaminación cruzada de alimentos",
    gravedad: "grave",
    descripcion_legal: "Mezcla de alimentos crudos/cocidos o alérgenos",
    aplica_a_rubros: ["gastronomia"],
  },
  {
    codigo: "manipulacion_alimentos_enfermo",
    nombre: "Manipulación de alimentos estando enfermo",
    gravedad: "grave",
    descripcion_legal: "Riesgo sanitario por trabajo con síntomas de enfermedad",
    aplica_a_rubros: ["gastronomia"],
  },
];

export const MOTIVOS_COMERCIO: MotivoSancion[] = [
  // MODERADAS
  {
    codigo: "faltante_caja",
    nombre: "Faltante de caja sin justificar",
    gravedad: "moderada",
    descripcion_legal: "Diferencia negativa en el cierre de caja",
    aplica_a_rubros: ["comercio"],
  },
  {
    codigo: "precio_incorrecto",
    nombre: "Cobro de precio incorrecto (reiterado)",
    gravedad: "moderada",
    descripcion_legal: "Error sistemático en el cobro a clientes",
    aplica_a_rubros: ["comercio"],
  },
  {
    codigo: "no_emision_comprobante",
    nombre: "No emisión de comprobante de venta",
    gravedad: "moderada",
    descripcion_legal: "Incumplimiento de normativa fiscal",
    aplica_a_rubros: ["comercio"],
  },

  // GRAVES
  {
    codigo: "faltante_caja_grave",
    nombre: "Faltante de caja significativo o reiterado",
    gravedad: "grave",
    descripcion_legal: "Diferencias importantes que generan pérdida de confianza",
    aplica_a_rubros: ["comercio"],
  },
];

export const MOTIVOS_LOGISTICA: MotivoSancion[] = [
  // MODERADAS
  {
    codigo: "dano_mercaderia_leve",
    nombre: "Daño a mercadería por descuido",
    gravedad: "moderada",
    descripcion_legal: "Negligencia en el manejo de productos",
    aplica_a_rubros: ["logistica"],
  },
  {
    codigo: "no_uso_epp",
    nombre: "No uso de elementos de protección personal",
    gravedad: "moderada",
    descripcion_legal: "Incumplimiento de normas de seguridad e higiene (Ley 19.587)",
    aplica_a_rubros: ["logistica", "construccion", "manufactura"],
  },
  {
    codigo: "entrega_fuera_horario",
    nombre: "Retraso significativo en entregas",
    gravedad: "moderada",
    descripcion_legal: "Afectación del servicio al cliente",
    aplica_a_rubros: ["logistica"],
  },

  // GRAVES
  {
    codigo: "conduccion_imprudente",
    nombre: "Conducción imprudente de vehículo de la empresa",
    gravedad: "grave",
    descripcion_legal: "Puesta en riesgo del patrimonio y terceros",
    aplica_a_rubros: ["logistica"],
  },
  {
    codigo: "dano_mercaderia_grave",
    nombre: "Daño grave a mercadería por negligencia",
    gravedad: "grave",
    descripcion_legal: "Pérdida significativa de productos",
    aplica_a_rubros: ["logistica"],
  },
  {
    codigo: "accidente_evitable",
    nombre: "Accidente evitable por incumplimiento de normas",
    gravedad: "grave",
    descripcion_legal: "Siniestro causado por negligencia del trabajador",
    aplica_a_rubros: ["logistica", "construccion"],
  },
];

export const MOTIVOS_CONSTRUCCION: MotivoSancion[] = [
  // MODERADAS
  {
    codigo: "abandono_frente_obra",
    nombre: "Abandono de frente de obra sin autorización",
    gravedad: "moderada",
    descripcion_legal: "Alejamiento del sector asignado",
    aplica_a_rubros: ["construccion"],
  },
  {
    codigo: "incumplimiento_procedimiento_seguridad",
    nombre: "Incumplimiento de procedimiento de seguridad",
    gravedad: "moderada",
    descripcion_legal: "No seguir protocolos establecidos (Res. SRT 295/03)",
    aplica_a_rubros: ["construccion"],
  },

  // GRAVES
  {
    codigo: "trabajo_altura_sin_arnes",
    nombre: "Trabajo en altura sin arnés de seguridad",
    gravedad: "grave",
    descripcion_legal: "Riesgo grave para la vida (Dec. 911/96)",
    aplica_a_rubros: ["construccion"],
  },
  {
    codigo: "ingreso_zona_restringida",
    nombre: "Ingreso a zona restringida sin autorización",
    gravedad: "grave",
    descripcion_legal: "Violación de perímetros de seguridad",
    aplica_a_rubros: ["construccion"],
  },
];

export const MOTIVOS_SALUD: MotivoSancion[] = [
  // MODERADAS
  {
    codigo: "incumplimiento_protocolo_asepsia",
    nombre: "Incumplimiento de protocolo de asepsia",
    gravedad: "moderada",
    descripcion_legal: "No seguir procedimientos de higiene establecidos",
    aplica_a_rubros: ["salud"],
  },
  {
    codigo: "registro_incompleto_paciente",
    nombre: "Registro incompleto de historia clínica",
    gravedad: "moderada",
    descripcion_legal: "Documentación deficiente de atención",
    aplica_a_rubros: ["salud"],
  },

  // GRAVES
  {
    codigo: "negligencia_atencion_paciente",
    nombre: "Negligencia grave en atención de paciente",
    gravedad: "grave",
    descripcion_legal: "Omisión de cuidados que pone en riesgo al paciente",
    requiere_testigos: true,
    aplica_a_rubros: ["salud"],
  },
  {
    codigo: "violacion_secreto_profesional",
    nombre: "Violación del secreto profesional",
    gravedad: "grave",
    descripcion_legal: "Divulgación de información médica confidencial",
    aplica_a_rubros: ["salud"],
  },
];

// ============================================
// FUNCIÓN PARA OBTENER MOTIVOS POR RUBRO
// ============================================

/**
 * Obtiene todos los motivos aplicables a un rubro específico
 * Combina motivos universales + específicos del rubro
 */
export function obtenerMotivosPorRubro(rubro: Rubro): MotivoSancion[] {
  // Siempre incluir motivos universales
  const motivos = [...MOTIVOS_UNIVERSALES];

  // Agregar motivos específicos según el rubro
  switch (rubro) {
    case "gastronomia":
      motivos.push(...MOTIVOS_GASTRONOMIA);
      break;
    case "comercio":
      motivos.push(...MOTIVOS_GASTRONOMIA.filter(m =>
        m.aplica_a_rubros?.includes("comercio")
      ));
      motivos.push(...MOTIVOS_COMERCIO);
      break;
    case "logistica":
      motivos.push(...MOTIVOS_LOGISTICA);
      break;
    case "construccion":
      motivos.push(...MOTIVOS_CONSTRUCCION);
      motivos.push(...MOTIVOS_LOGISTICA.filter(m =>
        m.aplica_a_rubros?.includes("construccion")
      ));
      break;
    case "manufactura":
      motivos.push(...MOTIVOS_LOGISTICA.filter(m =>
        m.aplica_a_rubros?.includes("manufactura")
      ));
      break;
    case "salud":
      motivos.push(...MOTIVOS_SALUD);
      break;
    case "servicios":
    case "otro":
    default:
      // Solo motivos universales
      break;
  }

  // Ordenar: primero por gravedad (leve -> grave), luego alfabético
  const ordenGravedad: Record<Gravedad, number> = {
    leve: 1,
    moderada: 2,
    grave: 3,
  };

  return motivos.sort((a, b) => {
    const diffGravedad = ordenGravedad[a.gravedad] - ordenGravedad[b.gravedad];
    if (diffGravedad !== 0) return diffGravedad;
    return a.nombre.localeCompare(b.nombre);
  });
}

/**
 * Obtiene motivos filtrados por gravedad
 */
export function obtenerMotivosPorGravedad(
  rubro: Rubro,
  gravedad: Gravedad
): MotivoSancion[] {
  return obtenerMotivosPorRubro(rubro).filter(m => m.gravedad === gravedad);
}

/**
 * Busca un motivo por su código
 */
export function obtenerMotivoPorCodigo(codigo: string): MotivoSancion | undefined {
  const todosLosMotivos = [
    ...MOTIVOS_UNIVERSALES,
    ...MOTIVOS_GASTRONOMIA,
    ...MOTIVOS_COMERCIO,
    ...MOTIVOS_LOGISTICA,
    ...MOTIVOS_CONSTRUCCION,
    ...MOTIVOS_SALUD,
  ];

  return todosLosMotivos.find(m => m.codigo === codigo);
}

/**
 * Agrupa motivos por gravedad para mostrar en UI
 */
export function agruparMotivosPorGravedad(
  rubro: Rubro
): Record<Gravedad, MotivoSancion[]> {
  const motivos = obtenerMotivosPorRubro(rubro);

  return {
    leve: motivos.filter(m => m.gravedad === "leve"),
    moderada: motivos.filter(m => m.gravedad === "moderada"),
    grave: motivos.filter(m => m.gravedad === "grave"),
  };
}

// ============================================
// GRUPOS DE MOTIVOS RELACIONADOS (para reincidencia)
// ============================================

/**
 * Define qué motivos se consideran "relacionados" para calcular reincidencia
 * Si un empleado tiene sanciones por motivos del mismo grupo, cuenta como reincidente
 */
export const GRUPOS_MOTIVOS_RELACIONADOS: Record<string, string[]> = {
  puntualidad: [
    "llegada_tarde_15min",
    "llegada_tarde_30min",
    "descanso_excedido",
  ],
  asistencia: [
    "falta_sin_aviso",
    "abandono_puesto_momentaneo",
    "abandono_frente_obra",
  ],
  conducta: [
    "agresion_verbal",
    "agresion_fisica",
    "trato_inadecuado_companero",
    "trato_inadecuado_cliente",
    "insubordinacion_grave",
    "desobediencia_orden",
  ],
  higiene: [
    "incumplimiento_higiene",
    "uniforme_sucio",
    "vestimenta_inadecuada",
    "incumplimiento_protocolo_asepsia",
  ],
  seguridad: [
    "no_uso_epp",
    "incumplimiento_procedimiento_seguridad",
    "trabajo_altura_sin_arnes",
    "conduccion_imprudente",
  ],
  patrimonio: [
    "robo_hurto",
    "dano_mercaderia_leve",
    "dano_mercaderia_grave",
    "faltante_caja",
    "faltante_caja_grave",
    "consumo_mercaderia",
  ],
};

/**
 * Determina si dos códigos de motivo son relacionados
 */
export function sonMotivosRelacionados(codigo1: string, codigo2: string): boolean {
  if (codigo1 === codigo2) return true;

  for (const grupo of Object.values(GRUPOS_MOTIVOS_RELACIONADOS)) {
    if (grupo.includes(codigo1) && grupo.includes(codigo2)) {
      return true;
    }
  }
  return false;
}

/**
 * Obtiene el grupo al que pertenece un motivo
 */
export function obtenerGrupoMotivo(codigo: string): string | null {
  for (const [grupo, codigos] of Object.entries(GRUPOS_MOTIVOS_RELACIONADOS)) {
    if (codigos.includes(codigo)) {
      return grupo;
    }
  }
  return null;
}
