// Tipos de base de datos

export interface Empresa {
  id: string;
  user_id: string;
  cuit: string;
  razon_social: string;
  direccion_legal?: string;
  rubro: Rubro;
  plan: "trial" | "basico" | "profesional" | "empresa";
  created_at: string;
  updated_at: string;
}

export interface Empleado {
  id: string;
  empresa_id: string;
  cuil: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  activo: boolean;
  created_at: string;
}

// ============================================
// TIPOS DE SANCIÓN Y GRADUALIDAD
// ============================================

export type TipoSancion = "apercibimiento" | "suspension" | "apercibimiento_previo_despido";
export type EstadoNotificacion =
  | "borrador"           // Sanción creada pero no enviada
  | "enviado"            // Email/WhatsApp enviado, esperando que abra
  | "validado"           // Empleado ingresó CUIL, pero NO confirmó checkbox
  | "notificado"         // Empleado confirmó con checkbox (antes "leido")
  | "pendiente_fisico"   // 72hs sin confirmación, requiere acción empleador
  | "enviado_fisico"     // Se generó/envió carta documento
  | "por_vencer"         // Faltan menos de 5 días para vencimiento
  | "firme"              // 30 días sin impugnación
  | "impugnado"          // Empleado impugnó dentro del plazo
  | "leido";             // DEPRECATED: usar "notificado" - mantenido por compatibilidad
export type Gravedad = "leve" | "moderada" | "grave";
export type NivelReincidencia = "primera_vez" | "reincidente" | "reincidente_multiple";

export type Rubro =
  | "gastronomia"
  | "logistica"
  | "comercio"
  | "manufactura"
  | "servicios"
  | "construccion"
  | "salud"
  | "otro";

// Labels para UI
export const TIPO_SANCION_LABELS: Record<TipoSancion, string> = {
  apercibimiento: "Apercibimiento",
  suspension: "Suspensión",
  apercibimiento_previo_despido: "Apercibimiento Previo al Despido",
};

export const GRAVEDAD_LABELS: Record<Gravedad, string> = {
  leve: "Leve",
  moderada: "Moderada",
  grave: "Grave",
};

// ============================================
// TESTIGOS Y EVIDENCIA
// ============================================

export interface Testigo {
  nombre: string;
  cargo: string;
  presente_en_hecho: boolean;
}

export interface EvidenciaAdjunta {
  tipo: "foto" | "video" | "documento" | "otro";
  url: string;
  descripcion?: string;
}

// ============================================
// NOTIFICACIÓN CON CAMPOS EXTENDIDOS
// ============================================

export interface Notificacion {
  id: string;
  empresa_id: string;
  empleado_id: string;
  tipo: TipoSancion;
  motivo: string;
  motivo_codigo?: string; // Código del catálogo
  gravedad?: Gravedad;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho?: string;
  lugar_hecho?: string;

  // Suspensión específico
  dias_suspension?: number;
  fecha_inicio_suspension?: string;
  fecha_fin_suspension?: string;

  // Testigos y evidencia
  testigos?: Testigo[];
  evidencia_urls?: string[];

  // Reincidencia (calculado al crear)
  nivel_reincidencia?: NivelReincidencia;
  sanciones_previas_count?: number;

  // Evidencia criptográfica
  pdf_url: string | null;
  hash_sha256: string | null;
  timestamp_generacion: string;
  ip_emisor: string | null;

  // Envío
  enviado_email: boolean;
  enviado_sms: boolean;

  // Tracking
  fecha_lectura: string | null;
  fecha_primera_lectura: string | null;
  ip_lector: string | null;

  // Validación de identidad (Gatekeeper)
  identidad_validada_at: string | null;
  identidad_cuil_ingresado: string | null;
  identidad_ip: string | null;
  identidad_user_agent: string | null;

  // Confirmación de lectura (Checkbox declaración jurada)
  lectura_confirmada_at: string | null;
  lectura_checkbox_aceptado: boolean;
  lectura_ip: string | null;
  lectura_user_agent: string | null;

  // Fallback físico (72hs sin confirmación)
  fecha_alerta_72hs: string | null;
  alertas_enviadas_empleador: number;
  pdf_fisico_generado: boolean;
  fecha_pdf_fisico: string | null;

  // Envío físico
  enviado_fisico: boolean;
  metodo_envio_fisico: "carta_documento" | "correo_certificado" | "entrega_mano" | null;
  fecha_envio_fisico: string | null;
  numero_tracking_fisico: string | null;
  fecha_acuse_recibo: string | null;

  // Estado
  estado: EstadoNotificacion;
  fecha_vencimiento: string | null;

  created_at: string;

  // Relaciones (cuando se hace join)
  empleado?: Empleado;
  empresa?: Empresa;
}

export interface Evento {
  id: string;
  notificacion_id: string;
  tipo: string;
  metadata: Record<string, unknown>;
  ip: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================
// FORMULARIOS
// ============================================

export interface CrearEmpresaForm {
  cuit: string;
  razon_social: string;
  rubro: Rubro;
  direccion_legal?: string;
}

export interface CrearEmpleadoForm {
  cuil: string;
  nombre: string;
  email?: string;
  telefono?: string;
}

export interface CrearSancionForm {
  empleado_id: string;
  tipo: TipoSancion;
  motivo: string;
  motivo_codigo?: string;
  gravedad?: Gravedad;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho?: string;
  lugar_hecho?: string;
  // Suspensión
  dias_suspension?: number;
  fecha_inicio_suspension?: string;
  fecha_fin_suspension?: string;
  // Testigos
  testigos?: Testigo[];
}

// ============================================
// MOTIVO DE SANCIÓN (CATÁLOGO)
// ============================================

export interface MotivoSancion {
  codigo: string;
  nombre: string;
  gravedad: Gravedad;
  descripcion_legal?: string;
  requiere_testigos?: boolean;
  aplica_a_rubros?: Rubro[]; // Si está vacío, aplica a todos
}

// ============================================
// HISTORIAL Y REINCIDENCIA
// ============================================

export interface SancionHistorial {
  id: string;
  tipo: TipoSancion;
  motivo: string;
  motivo_codigo?: string;
  gravedad?: Gravedad;
  fecha: string;
  estado: EstadoNotificacion;
  dias_suspension?: number;
}

export interface ResumenReincidencia {
  totalSanciones: number;
  sancionesUltimos12Meses: number;
  diasSuspensionAnioActual: number;
  motivosRecurrentes: { motivo: string; codigo?: string; cantidad: number }[];
  ultimaSancion: string | null;
  tieneApercibimientoPrevioDespido: boolean;
}

// ============================================
// VALIDACIÓN DE SUSPENSIÓN (Art. 220 LCT)
// ============================================

export interface ValidacionSuspensionInput {
  empleadoId: string;
  diasSolicitados: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface SuspensionExistente {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias: number;
}

export interface ResultadoValidacionSuspension {
  permitido: boolean;
  diasUsadosAnio: number;
  diasDisponibles: number;
  alertas: AlertaSuspension[];
  solapamientos: SuspensionExistente[];
}

export interface AlertaSuspension {
  tipo: "warning" | "error";
  codigo: string;
  mensaje: string;
}

// ============================================
// VALIDACIÓN DE DESCRIPCIÓN
// ============================================

export interface ResultadoValidacionMotivo {
  valido: boolean;
  errores: string[];
  advertencias: string[];
  score: number; // 0-100 de especificidad
}

// ============================================
// RECOMENDACIÓN DE SANCIÓN
// ============================================

export interface RecomendacionSancion {
  tipoSugerido: TipoSancion;
  diasSuspensionMin?: number;
  diasSuspensionMax?: number;
  motivo: string;
  explicacion: string;
  advertencias: string[];
}

// ============================================
// RUBROS (UI)
// ============================================

export const RUBROS: { value: Rubro; label: string }[] = [
  { value: "gastronomia", label: "Gastronomía" },
  { value: "logistica", label: "Logística y Transporte" },
  { value: "comercio", label: "Comercio" },
  { value: "manufactura", label: "Manufactura" },
  { value: "servicios", label: "Servicios" },
  { value: "construccion", label: "Construcción" },
  { value: "salud", label: "Salud" },
  { value: "otro", label: "Otro" },
];

// ============================================
// CONSTANTES LEGALES
// ============================================

export const LIMITE_DIAS_SUSPENSION_ANUAL = 30; // Art. 220 LCT
export const DIAS_PARA_IMPUGNAR = 30; // Reforma laboral 2025
export const MESES_HISTORIAL_REINCIDENCIA = 12; // Período relevante jurisprudencialmente
export const HORAS_PARA_ALERTA_FISICA = 72; // Horas sin confirmación para alerta

// ============================================
// LABELS DE ESTADO
// ============================================

export const ESTADO_NOTIFICACION_LABELS: Record<EstadoNotificacion, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  validado: "Identidad Validada",
  notificado: "Notificado",
  pendiente_fisico: "Pendiente Físico",
  enviado_fisico: "Enviado Físico",
  por_vencer: "Por Vencer",
  firme: "Firme",
  impugnado: "Impugnado",
  leido: "Leído", // DEPRECATED
};

// ============================================
// TEXTOS LEGALES
// ============================================

export const TEXTOS_LEGALES = {
  // Texto del checkbox de declaración jurada
  CHECKBOX_DECLARACION_JURADA: `DECLARO BAJO JURAMENTO que:

(i) He accedido personalmente a este documento;
(ii) He leído íntegramente su contenido;
(iii) Comprendo que dispongo de TREINTA (30) días corridos desde la fecha de esta confirmación para ejercer mi derecho de impugnación por escrito ante el empleador;
(iv) Entiendo que, transcurrido dicho plazo sin impugnación fehaciente, la sanción adquirirá firmeza conforme a la Ley 27.742.

La presente declaración constituye prueba de notificación fehaciente a todos los efectos legales.`,

  // Aviso de procedimiento en la pantalla de validación
  AVISO_PROCEDIMIENTO_72HS: `Este sistema garantiza su derecho a recibir notificaciones laborales de forma gratuita, inmediata y privada.

Si el sistema no registra la confirmación de lectura dentro de las próximas 72 horas, su empleador podrá optar por enviarle una Carta Documento física a su domicilio declarado, conforme al Art. 3 de la Ley 27.742, a fin de garantizar su derecho a ser debidamente notificado.

La confirmación digital es el método más ágil y confidencial.`,

  // Footer legal del PDF
  CLAUSULA_30_DIAS: `De acuerdo con la normativa vigente (Ley 27.742 de Modernización Laboral), usted dispone de TREINTA (30) días corridos desde la recepción de esta notificación para impugnar la sanción por escrito ante el empleador.

Transcurrido dicho plazo sin que medie impugnación fehaciente, la sanción quedará FIRME y constituirá PRUEBA PLENA en cualquier proceso judicial o administrativo posterior.

El silencio del trabajador importará ACEPTACIÓN TÁCITA de los hechos descriptos y de la sanción aplicada.`,
} as const;
