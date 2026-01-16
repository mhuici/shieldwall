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

  // Texto del checkbox de declaración jurada para TESTIGOS
  CHECKBOX_DECLARACION_TESTIGO: `DECLARO BAJO JURAMENTO que:

(i) Los hechos descriptos en mi declaración son verdaderos según mi conocimiento directo;
(ii) Esta declaración podrá ser utilizada como prueba en procedimientos laborales, administrativos o judiciales;
(iii) Conozco las consecuencias legales del falso testimonio conforme al Art. 275 del Código Penal;
(iv) Brindo esta declaración de forma voluntaria y sin coacción alguna.

La presente declaración constituye prueba testimonial con validez legal.`,
} as const;

// ============================================
// TESTIGOS DIGITALES (Sistema de Declaraciones)
// ============================================

export type EstadoTestigo =
  | "pendiente"    // Creado, no invitado
  | "invitado"     // Invitación enviada
  | "validado"     // Accedió al link
  | "firmado"      // Completó declaración con juramento
  | "rechazado"    // Rechazó declarar
  | "expirado";    // Token expiró (7 días)

export type RelacionTestigo =
  | "empleado"
  | "supervisor"
  | "cliente"
  | "proveedor"
  | "otro";

export type CanalInvitacion = "email" | "whatsapp" | "sms";

export interface DeclaracionTestigo {
  id: string;
  empresa_id: string;
  notificacion_id?: string;

  // Datos del testigo
  nombre_completo: string;
  cargo?: string;
  cuil?: string;
  email?: string;
  telefono?: string;
  relacion: RelacionTestigo;

  // Sobre el hecho
  presente_en_hecho: boolean;
  descripcion_testigo?: string; // Lo que el testigo vio/escuchó (lo completa él)

  // Token de acceso
  token_acceso: string;
  token_expira_at: string;

  // Validación (cuando accede al link)
  validado: boolean;
  validacion_timestamp?: string;
  validacion_ip?: string;
  validacion_user_agent?: string;

  // Declaración jurada
  declara_bajo_juramento: boolean;
  juramento_timestamp?: string;
  juramento_ip?: string;
  juramento_user_agent?: string;

  // Firma digital
  hash_declaracion?: string;

  // Estado
  estado: EstadoTestigo;

  // Invitación
  invitacion_enviada_at?: string;
  invitacion_canal?: CanalInvitacion;
  invitacion_message_id?: string;
  recordatorios_enviados: number;
  ultimo_recordatorio_at?: string;

  created_at: string;
  updated_at?: string;

  // Relaciones (cuando se hace join)
  notificacion?: Notificacion;
  empresa?: Empresa;
}

export interface CrearTestigoForm {
  nombre_completo: string;
  cargo?: string;
  cuil?: string;
  email?: string;
  telefono?: string;
  relacion: RelacionTestigo;
  presente_en_hecho: boolean;
  notificacion_id?: string;
}

export interface ConfirmarDeclaracionForm {
  descripcion_testigo: string;
  declara_bajo_juramento: boolean;
}

export interface EventoTestigo {
  id: string;
  declaracion_id: string;
  tipo: TipoEventoTestigo;
  metadata: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

export type TipoEventoTestigo =
  | "creado"
  | "invitacion_enviada"
  | "invitacion_fallida"
  | "recordatorio_enviado"
  | "link_abierto"
  | "validacion_exitosa"
  | "validacion_fallida"
  | "declaracion_completada"
  | "declaracion_firmada"
  | "declaracion_rechazada"
  | "token_expirado";

// Labels para UI
export const ESTADO_TESTIGO_LABELS: Record<EstadoTestigo, string> = {
  pendiente: "Pendiente",
  invitado: "Invitado",
  validado: "Accedió al link",
  firmado: "Declaración firmada",
  rechazado: "Rechazó declarar",
  expirado: "Expirado",
};

export const RELACION_TESTIGO_LABELS: Record<RelacionTestigo, string> = {
  empleado: "Empleado",
  supervisor: "Supervisor",
  cliente: "Cliente",
  proveedor: "Proveedor",
  otro: "Otro",
};

// Colores de semáforo para estados de testigo
export const ESTADO_TESTIGO_COLORES: Record<EstadoTestigo, string> = {
  pendiente: "gray",
  invitado: "blue",
  validado: "yellow",
  firmado: "green",
  rechazado: "red",
  expirado: "red",
};

// Constantes
export const DIAS_EXPIRACION_TOKEN_TESTIGO = 7;

// ============================================
// EVIDENCIA MULTIMEDIA
// ============================================

export type TipoEvidencia = "foto" | "video" | "audio" | "documento" | "screenshot";

export interface MetadatosEXIF {
  fechaCaptura?: string;
  latitud?: number;
  longitud?: number;
  altitud?: number;
  dispositivo?: string;
  software?: string;
  orientacion?: number;
  raw?: Record<string, unknown>;
}

export interface EvidenciaIncidente {
  id: string;
  empresa_id: string;
  notificacion_id?: string;

  // Información del archivo
  tipo: TipoEvidencia;
  nombre_archivo: string;
  mime_type: string;
  tamano_bytes: number;

  // Storage
  storage_path: string;
  url_publica?: string;
  thumbnail_path?: string;

  // Integridad
  hash_sha256: string;

  // Metadatos EXIF
  exif_fecha_captura?: string;
  exif_latitud?: number;
  exif_longitud?: number;
  exif_altitud?: number;
  exif_dispositivo?: string;
  exif_software?: string;
  exif_orientacion?: number;
  exif_raw?: Record<string, unknown>;

  // Descripción
  descripcion?: string;
  es_prueba_principal: boolean;
  orden: number;

  // Datos de subida
  subido_por_user_id?: string;
  subido_desde_ip?: string;
  subido_desde_user_agent?: string;

  created_at: string;
  updated_at?: string;

  // Relaciones (cuando se hace join)
  notificacion?: Notificacion;
  empresa?: Empresa;
}

export interface SubirEvidenciaForm {
  tipo: TipoEvidencia;
  descripcion?: string;
  es_prueba_principal?: boolean;
  file: File;
}

export interface EvidenciaPreview {
  id: string;
  tipo: TipoEvidencia;
  nombre_archivo: string;
  tamano_bytes: number;
  url_preview?: string;
  descripcion?: string;
  es_prueba_principal: boolean;
  exif_fecha_captura?: string;
  exif_latitud?: number;
  exif_longitud?: number;
  hash_sha256: string;
}

// Labels para UI
export const TIPO_EVIDENCIA_LABELS: Record<TipoEvidencia, string> = {
  foto: "Foto",
  video: "Video",
  audio: "Audio",
  documento: "Documento",
  screenshot: "Captura de pantalla",
};

export const TIPO_EVIDENCIA_ICONS: Record<TipoEvidencia, string> = {
  foto: "image",
  video: "video",
  audio: "audio",
  documento: "file-text",
  screenshot: "monitor",
};

// Extensiones permitidas por tipo
export const EXTENSIONES_PERMITIDAS: Record<TipoEvidencia, string[]> = {
  foto: [".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"],
  video: [".mp4", ".mov", ".avi", ".webm"],
  audio: [".mp3", ".wav", ".m4a", ".ogg"],
  documento: [".pdf", ".doc", ".docx", ".xls", ".xlsx"],
  screenshot: [".png", ".jpg", ".jpeg", ".webp"],
};

// MIME types permitidos por tipo
export const MIME_TYPES_PERMITIDOS: Record<TipoEvidencia, string[]> = {
  foto: ["image/jpeg", "image/png", "image/heic", "image/heif", "image/webp"],
  video: ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"],
  audio: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/ogg"],
  documento: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  screenshot: ["image/png", "image/jpeg", "image/webp"],
};

// Tamaño máximo por tipo (en bytes)
export const TAMANO_MAXIMO_BYTES: Record<TipoEvidencia, number> = {
  foto: 20 * 1024 * 1024, // 20 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 50 * 1024 * 1024, // 50 MB
  documento: 10 * 1024 * 1024, // 10 MB
  screenshot: 10 * 1024 * 1024, // 10 MB
};

// Constantes
export const MAX_EVIDENCIAS_POR_INCIDENTE = 10;

// ============================================
// BITÁCORA DE NOVEDADES (Art. 64 LCT - Progresividad)
// ============================================

export type TipoNovedad =
  | "recordatorio_verbal"      // "Se le recordó uso de EPP"
  | "conversacion_informal"    // "Se habló sobre puntualidad"
  | "permiso_concedido"        // "Se retiró 5 min antes con permiso"
  | "felicitacion"             // "Se reconoció buen desempeño"
  | "capacitacion"             // "Participó en charla de seguridad"
  | "incidente_menor"          // "Llegó 2 min tarde, primera vez"
  | "ajuste_horario"           // "Se acordó cambio de turno"
  | "comunicacion_general"     // "Se informó nuevo procedimiento"
  | "otro";

export type CategoriaNovedad =
  | "puntualidad"
  | "seguridad"
  | "conducta"
  | "rendimiento"
  | "comunicacion"
  | "normativa_interna"
  | "otro";

export type ActitudEmpleado = "colaborativa" | "neutral" | "reticente" | "no_aplica";

export interface BitacoraNovedad {
  id: string;
  empresa_id: string;
  empleado_id: string;
  supervisor_id?: string;

  // Contenido
  tipo: TipoNovedad;
  categoria?: CategoriaNovedad;
  titulo: string;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho?: string;
  lugar?: string;

  // Testigos
  testigos_presentes?: string[];

  // Respuesta del empleado
  empleado_respuesta?: string;
  empleado_actitud: ActitudEmpleado;

  // Vínculo con sanción
  sancion_relacionada_id?: string;

  // Integridad
  hash_sha256?: string;

  // Metadatos de creación
  creado_por_nombre?: string;
  creado_desde_ip?: string;
  creado_user_agent?: string;

  // Archivado
  archivado: boolean;
  archivado_at?: string;
  archivado_motivo?: string;

  created_at: string;
  updated_at?: string;

  // Relaciones (cuando se hace join)
  empleado?: Empleado;
  empresa?: Empresa;
  sancion_relacionada?: Notificacion;
}

export interface CrearNovedadForm {
  empleado_id: string;
  tipo: TipoNovedad;
  categoria?: CategoriaNovedad;
  titulo: string;
  descripcion: string;
  fecha_hecho: string;
  hora_hecho?: string;
  lugar?: string;
  testigos_presentes?: string[];
  empleado_respuesta?: string;
  empleado_actitud?: ActitudEmpleado;
}

export interface ResumenBitacora {
  total_novedades: number;
  novedades_por_tipo: Record<TipoNovedad, number>;
  novedades_por_categoria: Record<CategoriaNovedad, number>;
  primera_novedad?: string;
  ultima_novedad?: string;
}

export interface EventoBitacora {
  id: string;
  novedad_id: string;
  tipo: TipoEventoBitacora;
  metadata: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

export type TipoEventoBitacora =
  | "creada"
  | "actualizada"
  | "archivada"
  | "vinculada_sancion"
  | "desvinculada_sancion";

// Labels para UI
export const TIPO_NOVEDAD_LABELS: Record<TipoNovedad, string> = {
  recordatorio_verbal: "Recordatorio verbal",
  conversacion_informal: "Conversación informal",
  permiso_concedido: "Permiso concedido",
  felicitacion: "Felicitación",
  capacitacion: "Capacitación",
  incidente_menor: "Incidente menor",
  ajuste_horario: "Ajuste de horario",
  comunicacion_general: "Comunicación general",
  otro: "Otro",
};

export const CATEGORIA_NOVEDAD_LABELS: Record<CategoriaNovedad, string> = {
  puntualidad: "Puntualidad",
  seguridad: "Seguridad",
  conducta: "Conducta",
  rendimiento: "Rendimiento",
  comunicacion: "Comunicación",
  normativa_interna: "Normativa interna",
  otro: "Otro",
};

export const ACTITUD_EMPLEADO_LABELS: Record<ActitudEmpleado, string> = {
  colaborativa: "Colaborativa",
  neutral: "Neutral",
  reticente: "Reticente",
  no_aplica: "No aplica",
};

// Iconos para tipos de novedad (lucide-react)
export const TIPO_NOVEDAD_ICONS: Record<TipoNovedad, string> = {
  recordatorio_verbal: "message-circle",
  conversacion_informal: "message-square",
  permiso_concedido: "check-circle",
  felicitacion: "star",
  capacitacion: "graduation-cap",
  incidente_menor: "alert-triangle",
  ajuste_horario: "clock",
  comunicacion_general: "megaphone",
  otro: "file-text",
};

// Colores para tipos de novedad
export const TIPO_NOVEDAD_COLORES: Record<TipoNovedad, string> = {
  recordatorio_verbal: "yellow",
  conversacion_informal: "blue",
  permiso_concedido: "green",
  felicitacion: "purple",
  capacitacion: "cyan",
  incidente_menor: "orange",
  ajuste_horario: "gray",
  comunicacion_general: "blue",
  otro: "gray",
};

// Colores para categorías
export const CATEGORIA_NOVEDAD_COLORES: Record<CategoriaNovedad, string> = {
  puntualidad: "orange",
  seguridad: "red",
  conducta: "purple",
  rendimiento: "blue",
  comunicacion: "cyan",
  normativa_interna: "gray",
  otro: "gray",
};

// Constantes
export const MESES_BITACORA_CONTEXTO = 6; // Meses de historial para contexto de sanción

// ============================================
// DESCARGOS - Audiencia de Descargo Virtual
// ============================================

export type DecisionDescargo =
  | "pendiente"          // Aún no decidió
  | "ejercer_descargo"   // Decidió escribir su versión
  | "declinar_descargo"  // Decidió NO ejercer el derecho
  | "vencido";           // Plazo venció sin decisión

export type TipoEventoDescargo =
  | "creado"
  | "token_generado"
  | "identidad_validada"
  | "identidad_fallida"
  | "decision_ejercer"
  | "decision_declinar"
  | "borrador_guardado"
  | "archivo_adjuntado"
  | "confirmado"
  | "vencido"
  | "analizado";

export interface ArchivoAdjuntoDescargo {
  nombre: string;
  url: string;
  tipo: string;
  hash?: string;
  tamano?: number;
}

export interface Descargo {
  id: string;
  notificacion_id: string;
  empresa_id: string;
  empleado_id: string;
  token_acceso: string;
  token_expira_at: string;
  decision: DecisionDescargo;
  decision_timestamp?: string;
  decision_ip?: string;
  texto_descargo?: string;
  archivos_adjuntos: ArchivoAdjuntoDescargo[];
  identidad_validada_at?: string;
  identidad_cuil_ingresado?: string;
  confirmado_at?: string;
  checkbox_texto_aceptado?: string;
  checkbox_aceptado: boolean;
  hash_sha256?: string;
  contiene_admision?: boolean;
  contiene_contradiccion?: boolean;
  notas_empleador?: string;
  created_at: string;
  updated_at: string;
}

export interface EventoDescargo {
  id: string;
  descargo_id: string;
  tipo: TipoEventoDescargo;
  metadata: Record<string, unknown>;
  ip?: string;
  user_agent?: string;
  created_at: string;
}

// Datos del descargo para vista pública (token)
export interface DescargoPublico {
  id: string;
  notificacion_id: string;
  decision: DecisionDescargo;
  token_expira_at: string;
  identidad_validada: boolean;
  confirmado: boolean;
  empleado_nombre: string;
  empleado_cuil: string;
  sancion_tipo: string;
  sancion_motivo: string;
  sancion_descripcion: string;
  sancion_fecha_hecho: string;
  empresa_nombre: string;
  dias_restantes: number;
}

// Resumen del descargo para empleador
export interface DescargoResumen {
  existe: boolean;
  id?: string;
  decision?: DecisionDescargo;
  decision_timestamp?: string;
  texto_descargo?: string;
  archivos_adjuntos?: ArchivoAdjuntoDescargo[];
  confirmado_at?: string;
  hash_sha256?: string;
  token_expira_at?: string;
  dias_restantes?: number;
  contiene_admision?: boolean;
  contiene_contradiccion?: boolean;
  notas_empleador?: string;
  eventos?: Array<{
    tipo: TipoEventoDescargo;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
}

// Labels para UI
export const DECISION_DESCARGO_LABELS: Record<DecisionDescargo, string> = {
  pendiente: "Pendiente",
  ejercer_descargo: "Ejerció descargo",
  declinar_descargo: "Declinó descargo",
  vencido: "Vencido sin respuesta",
};

export const DECISION_DESCARGO_COLORES: Record<DecisionDescargo, { bg: string; text: string; border: string }> = {
  pendiente: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  ejercer_descargo: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  declinar_descargo: { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200" },
  vencido: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

// Textos legales para checkbox
export const TEXTO_CHECKBOX_EJERCER_DESCARGO = `DECLARO BAJO JURAMENTO que:
(i) La información proporcionada en mi descargo es verídica y completa;
(ii) Entiendo que esta declaración será incorporada al expediente laboral;
(iii) Conozco que brindar información falsa puede tener consecuencias legales;
(iv) Presento este descargo de forma voluntaria, sin coacción alguna.`;

export const TEXTO_CHECKBOX_DECLINAR_DESCARGO = `DECLARO que:
(i) He sido informado/a de mi derecho a presentar un descargo ante la sanción recibida;
(ii) Voluntariamente decido NO ejercer este derecho en el plazo establecido;
(iii) Entiendo que esta decisión quedará registrada y no podrá ser modificada posteriormente;
(iv) Tomo esta decisión de forma libre y sin coacción alguna.`;

// ============================================
// PROTOCOLO DE PRESERVACIÓN Y PERITAJE
// ============================================

export type TipoExportacion =
  | "paquete_completo"
  | "solo_timeline"
  | "peritaje_tecnico"
  | "cadena_custodia";

export type EstadoExportacion = "generando" | "completado" | "error" | "expirado";

export type TipoDocumentoVerificacion =
  | "notificacion"
  | "testigo"
  | "evidencia"
  | "descargo"
  | "bitacora"
  | "paquete";

export interface ExportacionEvidencia {
  id: string;
  empresa_id: string;
  notificacion_id: string;
  tipo: TipoExportacion;
  solicitado_para?: string;
  motivo?: string;
  storage_path?: string;
  nombre_archivo?: string;
  tamano_bytes?: number;
  hash_paquete?: string;
  contenido_incluido: {
    sancion?: boolean;
    testigos?: number;
    evidencias?: number;
    descargo?: boolean;
    bitacora?: number;
  };
  timeline_hashes: TimelineHash[];
  metadatos_tecnicos: Record<string, unknown>;
  estado: EstadoExportacion;
  error_mensaje?: string;
  descargado_count: number;
  ultima_descarga_at?: string;
  created_at: string;
  expires_at: string;
  completado_at?: string;
}

export interface TimelineHash {
  tipo: string;
  id: string;
  hash: string;
  timestamp: string;
  descripcion?: string;
}

export interface EventoTimeline {
  tipo: string;
  timestamp: string;
  titulo: string;
  descripcion: string;
  hash?: string;
  metadata?: Record<string, unknown>;
}

export interface TimelineNotificacion {
  notificacion_id: string;
  total_eventos: number;
  eventos: EventoTimeline[];
}

export interface HashesNotificacion {
  notificacion_id: string;
  total_hashes: number;
  hashes: TimelineHash[];
}

export interface VerificacionIntegridad {
  id: string;
  tipo_documento: TipoDocumentoVerificacion;
  documento_id: string;
  hash_verificado: string;
  hash_esperado: string;
  verificacion_exitosa: boolean;
  verificado_por_externo: boolean;
  verificado_por_nombre?: string;
  created_at: string;
}

export interface ResultadoVerificacion {
  verificacion_exitosa: boolean;
  hash_proporcionado: string | null;
  hash_esperado: string | null;
  mensaje: string;
}

// Labels para UI
export const TIPO_EXPORTACION_LABELS: Record<TipoExportacion, string> = {
  paquete_completo: "Paquete Completo",
  solo_timeline: "Solo Timeline",
  peritaje_tecnico: "Documentación Técnica",
  cadena_custodia: "Cadena de Custodia",
};

export const ESTADO_EXPORTACION_LABELS: Record<EstadoExportacion, string> = {
  generando: "Generando...",
  completado: "Completado",
  error: "Error",
  expirado: "Expirado",
};

export const TIPO_EVENTO_TIMELINE_LABELS: Record<string, string> = {
  sancion_creada: "Sanción Creada",
  timestamp_generacion: "Timestamp Certificado",
  email_enviado: "Notificación Enviada",
  email_entregado: "Email Entregado",
  link_abierto: "Link Accedido",
  identidad_validada: "Identidad Verificada",
  lectura_confirmada: "Lectura Confirmada",
  testigo_agregado: "Testigo Agregado",
  testigo_invitado: "Invitación a Testigo",
  testigo_firmado: "Testigo Firmó",
  evidencia_adjuntada: "Evidencia Adjuntada",
  descargo_pendiente: "Descargo Pendiente",
  descargo_presentado: "Descargo Presentado",
  descargo_declinado: "Descargo Declinado",
  descargo_vencido: "Plazo Vencido",
  sancion_firme: "Sanción Firme",
};

export const TIPO_EVENTO_TIMELINE_ICONOS: Record<string, string> = {
  sancion_creada: "file-text",
  timestamp_generacion: "hash",
  email_enviado: "send",
  email_entregado: "check-circle",
  link_abierto: "eye",
  identidad_validada: "shield-check",
  lectura_confirmada: "check-square",
  testigo_agregado: "user-plus",
  testigo_invitado: "mail",
  testigo_firmado: "pen-tool",
  evidencia_adjuntada: "image",
  descargo_pendiente: "clock",
  descargo_presentado: "file-text",
  descargo_declinado: "x-circle",
  descargo_vencido: "alert-triangle",
  sancion_firme: "shield",
};

export const TIPO_EVENTO_TIMELINE_COLORES: Record<string, string> = {
  sancion_creada: "blue",
  timestamp_generacion: "purple",
  email_enviado: "cyan",
  email_entregado: "green",
  link_abierto: "yellow",
  identidad_validada: "green",
  lectura_confirmada: "green",
  testigo_agregado: "blue",
  testigo_invitado: "yellow",
  testigo_firmado: "green",
  evidencia_adjuntada: "purple",
  descargo_pendiente: "yellow",
  descargo_presentado: "blue",
  descargo_declinado: "gray",
  descargo_vencido: "red",
  sancion_firme: "green",
};
