-- ============================================
-- Migración: Protocolo de Lectura Activa
-- Fecha: 2026-01-21
-- Descripción: Tracking de scroll, tiempo de lectura,
--              campo de texto libre para reconocimiento
-- ============================================

-- ============================================
-- 1. CAMPOS ADICIONALES EN NOTIFICACIONES
-- ============================================

-- Tracking de scroll
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS scroll_completado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS scroll_porcentaje_maximo INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS scroll_timestamps JSONB DEFAULT '[]';

-- Tracking de tiempo de lectura
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS tiempo_lectura_inicio_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tiempo_lectura_segundos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiempo_minimo_requerido INTEGER DEFAULT 0;

-- Campo de reconocimiento (reemplaza checkbox)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS reconocimiento_campo_mostrado TEXT,
ADD COLUMN IF NOT EXISTS reconocimiento_respuesta TEXT,
ADD COLUMN IF NOT EXISTS reconocimiento_intentos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reconocimiento_validado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reconocimiento_validado_at TIMESTAMPTZ;

-- Metadata del dispositivo al confirmar
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS confirmacion_metadata JSONB DEFAULT '{}';

-- ============================================
-- 2. TABLA DE INTENTOS DE RECONOCIMIENTO
-- ============================================

CREATE TABLE IF NOT EXISTS intentos_reconocimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,

  -- Campo y respuesta
  campo_mostrado TEXT NOT NULL,
  respuesta_ingresada TEXT NOT NULL,
  respuesta_esperada TEXT,

  -- Resultado de validación
  es_valido BOOLEAN NOT NULL DEFAULT false,
  score_similitud NUMERIC(5, 2), -- 0.00 a 100.00

  -- Metadata
  intento_numero INTEGER NOT NULL,
  ip VARCHAR(45),
  user_agent TEXT
);

-- Índice para buscar intentos por notificación
CREATE INDEX IF NOT EXISTS idx_intentos_reconocimiento_notificacion
ON intentos_reconocimiento(notificacion_id, created_at DESC);

-- ============================================
-- 3. TABLA DE TRACKING DE LECTURA
-- ============================================

CREATE TABLE IF NOT EXISTS tracking_lectura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,

  -- Tipo de evento
  evento_tipo VARCHAR(50) NOT NULL,
  -- 'scroll', 'tiempo', 'visibilidad', 'foco'

  -- Datos del evento
  scroll_porcentaje INTEGER,
  tiempo_acumulado_segundos INTEGER,
  documento_visible BOOLEAN,
  ventana_enfocada BOOLEAN,

  -- Metadata
  viewport_height INTEGER,
  document_height INTEGER,
  timestamp_cliente TIMESTAMPTZ
);

-- Índice para buscar tracking por notificación
CREATE INDEX IF NOT EXISTS idx_tracking_lectura_notificacion
ON tracking_lectura(notificacion_id, created_at);

-- ============================================
-- 4. FUNCIÓN PARA CALCULAR TIEMPO MÍNIMO DE LECTURA
-- ============================================

CREATE OR REPLACE FUNCTION calcular_tiempo_minimo_lectura(
  p_descripcion TEXT,
  p_motivo TEXT DEFAULT '',
  p_palabras_por_minuto INTEGER DEFAULT 200
)
RETURNS INTEGER AS $$
DECLARE
  v_texto_completo TEXT;
  v_palabras INTEGER;
  v_tiempo_segundos INTEGER;
BEGIN
  -- Combinar descripción y motivo
  v_texto_completo := COALESCE(p_descripcion, '') || ' ' || COALESCE(p_motivo, '');

  -- Contar palabras (aproximado)
  v_palabras := array_length(regexp_split_to_array(trim(v_texto_completo), '\s+'), 1);

  -- Calcular tiempo en segundos
  -- palabras / (palabras_por_minuto / 60) = segundos
  v_tiempo_segundos := CEIL(v_palabras::NUMERIC / (p_palabras_por_minuto::NUMERIC / 60));

  -- Mínimo 30 segundos, máximo 5 minutos
  v_tiempo_segundos := GREATEST(30, LEAST(300, v_tiempo_segundos));

  RETURN v_tiempo_segundos;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 5. FUNCIÓN PARA GENERAR CAMPO DE RECONOCIMIENTO
-- ============================================

CREATE OR REPLACE FUNCTION generar_campo_reconocimiento(
  p_tipo_sancion VARCHAR(50),
  p_dias_suspension INTEGER DEFAULT NULL,
  p_fecha_hecho DATE DEFAULT NULL,
  p_motivo TEXT DEFAULT NULL
)
RETURNS TABLE (
  campo_tipo VARCHAR(50),
  pregunta TEXT,
  respuesta_esperada TEXT
) AS $$
DECLARE
  v_campos TEXT[][] := ARRAY[]::TEXT[][];
  v_random_idx INTEGER;
BEGIN
  -- Siempre agregar campo de tipo de sanción
  v_campos := v_campos || ARRAY[[
    'tipo_sancion',
    'Indique la sanción o medida mencionada en el documento',
    p_tipo_sancion
  ]];

  -- Agregar duración si es suspensión
  IF p_tipo_sancion = 'suspension' AND p_dias_suspension IS NOT NULL THEN
    v_campos := v_campos || ARRAY[[
      'duracion',
      'Indique la cantidad de días mencionada',
      p_dias_suspension::TEXT || ' dias'
    ]];
  END IF;

  -- Agregar fecha si está disponible
  IF p_fecha_hecho IS NOT NULL THEN
    v_campos := v_campos || ARRAY[[
      'fecha_hecho',
      'Indique la fecha del hecho sancionado',
      to_char(p_fecha_hecho, 'DD/MM/YYYY')
    ]];
  END IF;

  -- Seleccionar uno aleatorio (priorizando tipo_sancion y duracion)
  IF array_length(v_campos, 1) = 1 THEN
    v_random_idx := 1;
  ELSIF array_length(v_campos, 1) = 2 THEN
    v_random_idx := CASE WHEN random() < 0.7 THEN 1 ELSE 2 END;
  ELSE
    v_random_idx := CASE
      WHEN random() < 0.5 THEN 1  -- 50% tipo sanción
      WHEN random() < 0.8 THEN 2  -- 30% duración
      ELSE 3                      -- 20% fecha
    END;
  END IF;

  campo_tipo := v_campos[v_random_idx][1];
  pregunta := v_campos[v_random_idx][2];
  respuesta_esperada := v_campos[v_random_idx][3];

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCIÓN PARA VALIDAR RESPUESTA (Fuzzy Match)
-- ============================================

CREATE OR REPLACE FUNCTION validar_respuesta_reconocimiento(
  p_respuesta TEXT,
  p_esperada TEXT,
  p_campo_tipo VARCHAR(50)
)
RETURNS TABLE (
  es_valido BOOLEAN,
  score_similitud NUMERIC(5, 2)
) AS $$
DECLARE
  v_respuesta_norm TEXT;
  v_esperada_norm TEXT;
  v_score NUMERIC;
BEGIN
  -- Normalizar: minúsculas, sin acentos, sin espacios extra
  v_respuesta_norm := lower(trim(regexp_replace(
    translate(p_respuesta, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
    '\s+', ' ', 'g'
  )));

  v_esperada_norm := lower(trim(regexp_replace(
    translate(p_esperada, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
    '\s+', ' ', 'g'
  )));

  -- Validación según tipo de campo
  IF p_campo_tipo = 'tipo_sancion' THEN
    -- Buscar palabras clave
    es_valido := v_respuesta_norm LIKE '%suspension%'
              OR v_respuesta_norm LIKE '%apercibimiento%'
              OR v_respuesta_norm LIKE '%despido%'
              OR v_respuesta_norm LIKE '%llamado%atencion%';

    -- Si coincide exactamente con lo esperado, dar 100%
    IF v_respuesta_norm LIKE '%' || v_esperada_norm || '%' THEN
      score_similitud := 100.0;
    ELSIF es_valido THEN
      score_similitud := 80.0;
    ELSE
      score_similitud := 0.0;
    END IF;

  ELSIF p_campo_tipo = 'duracion' THEN
    -- Extraer número de la respuesta
    DECLARE
      v_numero_resp INTEGER;
      v_numero_esp INTEGER;
    BEGIN
      -- Extraer números
      v_numero_resp := (regexp_match(v_respuesta_norm, '(\d+)'))[1]::INTEGER;
      v_numero_esp := (regexp_match(v_esperada_norm, '(\d+)'))[1]::INTEGER;

      IF v_numero_resp IS NOT NULL AND v_numero_resp = v_numero_esp THEN
        es_valido := true;
        score_similitud := 100.0;
      ELSE
        es_valido := false;
        score_similitud := 0.0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      es_valido := false;
      score_similitud := 0.0;
    END;

  ELSIF p_campo_tipo = 'fecha_hecho' THEN
    -- Buscar la fecha en diferentes formatos
    DECLARE
      v_fecha_resp DATE;
      v_fecha_esp DATE;
    BEGIN
      v_fecha_esp := to_date(p_esperada, 'DD/MM/YYYY');

      -- Intentar parsear la respuesta
      BEGIN
        v_fecha_resp := to_date(v_respuesta_norm, 'DD/MM/YYYY');
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          v_fecha_resp := to_date(v_respuesta_norm, 'DD-MM-YYYY');
        EXCEPTION WHEN OTHERS THEN
          v_fecha_resp := NULL;
        END;
      END;

      IF v_fecha_resp IS NOT NULL AND v_fecha_resp = v_fecha_esp THEN
        es_valido := true;
        score_similitud := 100.0;
      ELSE
        es_valido := false;
        score_similitud := 0.0;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      es_valido := false;
      score_similitud := 0.0;
    END;

  ELSE
    -- Tipo desconocido: comparación simple
    IF v_respuesta_norm = v_esperada_norm THEN
      es_valido := true;
      score_similitud := 100.0;
    ELSIF v_respuesta_norm LIKE '%' || v_esperada_norm || '%' THEN
      es_valido := true;
      score_similitud := 80.0;
    ELSE
      es_valido := false;
      score_similitud := 0.0;
    END IF;
  END IF;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. COMENTARIOS
-- ============================================

COMMENT ON COLUMN notificaciones.scroll_completado IS 'Si el usuario scrolleó >= 90% del documento';
COMMENT ON COLUMN notificaciones.tiempo_lectura_segundos IS 'Tiempo total que el usuario tuvo el documento visible';
COMMENT ON COLUMN notificaciones.reconocimiento_respuesta IS 'Respuesta del usuario al campo de reconocimiento (texto libre)';
COMMENT ON TABLE intentos_reconocimiento IS 'Historial de intentos de validación de reconocimiento';
COMMENT ON TABLE tracking_lectura IS 'Eventos de tracking durante la lectura del documento';
COMMENT ON FUNCTION calcular_tiempo_minimo_lectura IS 'Calcula tiempo mínimo de lectura basado en cantidad de palabras';
COMMENT ON FUNCTION validar_respuesta_reconocimiento IS 'Valida respuesta con fuzzy matching';
