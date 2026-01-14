/**
 * Módulo de Sanciones Disciplinarias
 *
 * Exporta todas las funciones y tipos necesarios para:
 * - Gestión de motivos por rubro (CCT)
 * - Matriz de gradualidad y recomendaciones
 * - Motor de reincidencia
 * - Validación de suspensiones (Art. 220 LCT)
 * - Validación de especificidad de descripciones
 */

// Catálogo de motivos por rubro
export {
  MOTIVOS_UNIVERSALES,
  MOTIVOS_GASTRONOMIA,
  MOTIVOS_COMERCIO,
  MOTIVOS_LOGISTICA,
  MOTIVOS_CONSTRUCCION,
  MOTIVOS_SALUD,
  GRUPOS_MOTIVOS_RELACIONADOS,
  obtenerMotivosPorRubro,
  obtenerMotivosPorGravedad,
  obtenerMotivoPorCodigo,
  agruparMotivosPorGravedad,
  sonMotivosRelacionados,
  obtenerGrupoMotivo,
} from "./motivos-por-rubro";

// Matriz de gradualidad
export {
  obtenerRecomendacion,
  validarDiasSuspension,
  sugerirDiasSuspension,
  descripcionReincidencia,
  colorGravedad,
  colorTipoSancion,
  type InputRecomendacion,
} from "./matriz-gradualidad";

// Motor de reincidencia
export {
  obtenerHistorialEmpleado,
  calcularReincidencia,
  generarResumenHistorial,
  calcularDiasSuspensionDisponibles,
  analizarPatrones,
  analizarEmpleado,
  type ResultadoAnalisisEmpleado,
} from "./motor-reincidencia";

// Validación de suspensiones
export {
  obtenerSuspensionesAnio,
  validarSuspension,
  validarSuspensionLocal,
  calcularDiasHabiles,
  sugerirFechasSuspension,
} from "./validacion-suspension";

// Validación de especificidad
export {
  validarEspecificidadMotivo,
  generarSugerenciasMejora,
  generarTemplateDescripcion,
  calcularScoreEspecificidad,
  esDescripcionValida,
  type InputValidacionMotivo,
} from "./validacion-motivo";
