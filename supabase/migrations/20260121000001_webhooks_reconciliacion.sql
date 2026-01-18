-- ============================================
-- Migración: Webhooks, Reconciliación y Grace Period
-- Fecha: 2026-01-21
-- Descripción: Sistema de reconciliación cada 6hs, grace period
--              y tracking mejorado de webhooks
-- ============================================

-- ============================================
-- 1. CAMPOS ADICIONALES EN NOTIFICACIONES
-- ============================================

-- Grace period tracking
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS grace_period_inicio_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS grace_period_fin_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subsidiariedad_activada_at TIMESTAMPTZ;

-- Reconciliación tracking
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS ultima_reconciliacion_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reconciliacion_encontro_open BOOLEAN DEFAULT false;

-- SendGrid message ID para reconciliación
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS sendgrid_message_id VARCHAR(255);

-- Twilio message SID para reconciliación
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS twilio_message_sid VARCHAR(255);

-- ============================================
-- 2. TABLA DE LOGS DE RECONCILIACIÓN
-- ============================================

CREATE TABLE IF NOT EXISTS reconciliacion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Estadísticas de la ejecución
  notificaciones_revisadas INTEGER NOT NULL DEFAULT 0,
  eventos_recuperados INTEGER NOT NULL DEFAULT 0,
  errores INTEGER NOT NULL DEFAULT 0,

  -- Detalle de notificaciones procesadas
  notificaciones_ids UUID[] DEFAULT '{}',
  eventos_recuperados_ids UUID[] DEFAULT '{}',

  -- Duración y estado
  duracion_ms INTEGER,
  estado VARCHAR(20) DEFAULT 'completado' CHECK (estado IN ('completado', 'parcial', 'fallido')),
  error_mensaje TEXT,

  -- Metadata
  ejecutado_por VARCHAR(50) DEFAULT 'cron', -- 'cron', 'manual', 'api'
  metadata JSONB DEFAULT '{}'
);

-- Índice para consultar logs recientes
CREATE INDEX IF NOT EXISTS idx_reconciliacion_logs_created
ON reconciliacion_logs(created_at DESC);

-- ============================================
-- 3. TABLA DE WEBHOOKS RECIBIDOS (AUDITORÍA)
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Origen del webhook
  proveedor VARCHAR(20) NOT NULL CHECK (proveedor IN ('sendgrid', 'twilio', 'whatsapp')),

  -- Datos del evento
  evento_tipo VARCHAR(50) NOT NULL,
  notificacion_id UUID REFERENCES notificaciones(id),

  -- Payload original (para auditoría)
  payload_hash VARCHAR(64) NOT NULL, -- SHA256 del payload
  payload_raw JSONB,

  -- Verificación de firma
  firma_valida BOOLEAN,
  firma_error TEXT,

  -- Headers relevantes
  ip_origen VARCHAR(45),
  user_agent TEXT,

  -- Estado de procesamiento
  procesado BOOLEAN DEFAULT true,
  error_procesamiento TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_webhook_logs_notificacion
ON webhook_logs(notificacion_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_proveedor
ON webhook_logs(proveedor, evento_tipo, created_at DESC);

-- ============================================
-- 4. FUNCIÓN PARA EVALUAR GRACE PERIOD
-- ============================================

CREATE OR REPLACE FUNCTION evaluar_grace_period(p_notificacion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_notif RECORD;
  v_horas_desde_envio NUMERIC;
  v_resultado JSONB;
BEGIN
  SELECT * INTO v_notif FROM notificaciones WHERE id = p_notificacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Notificación no encontrada');
  END IF;

  -- Si ya tiene open, no necesita grace period
  IF v_notif.email_abierto_at IS NOT NULL OR v_notif.link_abierto_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'necesita_grace_period', false,
      'razon', 'Ya tiene evento de apertura'
    );
  END IF;

  -- Calcular horas desde envío
  IF v_notif.email_enviado_at IS NOT NULL THEN
    v_horas_desde_envio := EXTRACT(EPOCH FROM (NOW() - v_notif.email_enviado_at)) / 3600;

    -- Menos de 48 horas: todavía en período normal
    IF v_horas_desde_envio < 48 THEN
      RETURN jsonb_build_object(
        'necesita_grace_period', false,
        'razon', 'Aún en período de espera normal',
        'horas_restantes', 48 - v_horas_desde_envio
      );
    END IF;

    -- Entre 48 y 54 horas: EN grace period
    IF v_horas_desde_envio >= 48 AND v_horas_desde_envio < 54 THEN
      -- Marcar inicio de grace period si no está marcado
      IF v_notif.grace_period_inicio_at IS NULL THEN
        UPDATE notificaciones
        SET grace_period_inicio_at = NOW(),
            grace_period_fin_at = NOW() + INTERVAL '6 hours'
        WHERE id = p_notificacion_id;
      END IF;

      RETURN jsonb_build_object(
        'necesita_grace_period', true,
        'en_grace_period', true,
        'horas_en_grace', v_horas_desde_envio - 48,
        'horas_restantes_grace', 54 - v_horas_desde_envio
      );
    END IF;

    -- Más de 54 horas: grace period expirado, activar subsidiariedad
    IF v_horas_desde_envio >= 54 THEN
      -- Marcar subsidiariedad si no está marcada
      IF v_notif.subsidiariedad_activada_at IS NULL THEN
        UPDATE notificaciones
        SET subsidiariedad_activada_at = NOW(),
            requiere_notificacion_fisica = true,
            semaforo = 'alerta'
        WHERE id = p_notificacion_id;
      END IF;

      RETURN jsonb_build_object(
        'necesita_grace_period', false,
        'grace_period_expirado', true,
        'subsidiariedad_activada', true,
        'horas_desde_envio', v_horas_desde_envio
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'necesita_grace_period', false,
    'razon', 'Email no enviado aún'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. FUNCIÓN PARA OBTENER NOTIFICACIONES PENDIENTES DE RECONCILIACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION obtener_pendientes_reconciliacion()
RETURNS TABLE (
  id UUID,
  sendgrid_message_id VARCHAR(255),
  email_enviado_at TIMESTAMPTZ,
  horas_desde_envio NUMERIC,
  en_grace_period BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.sendgrid_message_id,
    n.email_enviado_at,
    EXTRACT(EPOCH FROM (NOW() - n.email_enviado_at)) / 3600 as horas,
    (EXTRACT(EPOCH FROM (NOW() - n.email_enviado_at)) / 3600 BETWEEN 48 AND 54) as en_grace
  FROM notificaciones n
  WHERE
    -- Tiene email enviado
    n.email_enviado_at IS NOT NULL
    -- No tiene apertura confirmada
    AND n.email_abierto_at IS NULL
    AND n.link_abierto_at IS NULL
    -- Tiene delivered (el email llegó al servidor)
    AND n.email_entregado_at IS NOT NULL
    -- Está entre 48 y 72 horas (rango de reconciliación)
    AND n.email_enviado_at <= NOW() - INTERVAL '48 hours'
    AND n.email_enviado_at >= NOW() - INTERVAL '72 hours'
    -- No tiene subsidiariedad ya activada
    AND n.subsidiariedad_activada_at IS NULL
    -- Tiene sendgrid_message_id para poder consultar
    AND n.sendgrid_message_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. FUNCIÓN PARA REGISTRAR EVENTO RECUPERADO POR RECONCILIACIÓN
-- ============================================

CREATE OR REPLACE FUNCTION registrar_evento_reconciliado(
  p_notificacion_id UUID,
  p_evento_tipo VARCHAR(50),
  p_timestamp_original TIMESTAMPTZ,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_evento_id UUID;
BEGIN
  -- Insertar evento
  INSERT INTO eventos (
    notificacion_id,
    tipo,
    metadata,
    created_at
  ) VALUES (
    p_notificacion_id,
    p_evento_tipo,
    jsonb_build_object(
      'origen', 'reconciliacion',
      'timestamp_original', p_timestamp_original,
      'timestamp_reconciliacion', NOW()
    ) || p_metadata,
    p_timestamp_original -- Usar timestamp original
  )
  RETURNING id INTO v_evento_id;

  -- Actualizar notificación según tipo de evento
  IF p_evento_tipo = 'email_abierto' THEN
    UPDATE notificaciones
    SET
      email_abierto_at = p_timestamp_original,
      reconciliacion_encontro_open = true,
      ultima_reconciliacion_at = NOW(),
      -- Cancelar grace period si estaba activo
      grace_period_fin_at = NOW()
    WHERE id = p_notificacion_id
    AND email_abierto_at IS NULL; -- Solo si no tenía fecha
  END IF;

  -- Actualizar timestamp de reconciliación
  UPDATE notificaciones
  SET ultima_reconciliacion_at = NOW()
  WHERE id = p_notificacion_id;

  RETURN v_evento_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. ACTUALIZAR FUNCIÓN DE SEMÁFORO CON GRACE PERIOD
-- ============================================

CREATE OR REPLACE FUNCTION calcular_semaforo(p_notificacion_id UUID)
RETURNS VARCHAR(20) AS $$
DECLARE
  v_notif RECORD;
  v_horas_desde_envio NUMERIC;
  v_horas_desde_apertura NUMERIC;
BEGIN
  SELECT * INTO v_notif FROM notificaciones WHERE id = p_notificacion_id;

  IF NOT FOUND THEN
    RETURN 'pendiente';
  END IF;

  -- Ya está firme
  IF v_notif.estado = 'firme' THEN
    RETURN 'firme';
  END IF;

  -- Ya confirmó lectura = VERDE
  IF v_notif.lectura_confirmada_at IS NOT NULL THEN
    RETURN 'leido';
  END IF;

  -- Calcular horas desde envío de email
  IF v_notif.email_enviado_at IS NOT NULL THEN
    v_horas_desde_envio := EXTRACT(EPOCH FROM (NOW() - v_notif.email_enviado_at)) / 3600;

    -- Si abrió el link/email pero no confirmó = AMARILLO
    IF v_notif.link_abierto_at IS NOT NULL OR v_notif.email_abierto_at IS NOT NULL THEN
      v_horas_desde_apertura := EXTRACT(EPOCH FROM (NOW() - COALESCE(v_notif.link_abierto_at, v_notif.email_abierto_at))) / 3600;

      -- Si pasaron más de 48hs desde apertura sin confirmar = ROJO
      IF v_horas_desde_apertura >= 48 THEN
        RETURN 'alerta';
      END IF;

      RETURN 'abierto';
    END IF;

    -- NUEVO: Grace period (48-54 horas) = sigue siendo "enviado" pero con alerta pendiente
    IF v_horas_desde_envio >= 48 AND v_horas_desde_envio < 54 THEN
      RETURN 'enviado'; -- Aún no es alerta, está en grace period
    END IF;

    -- Más de 54hs sin abrir (después de grace period) = ROJO (alerta)
    IF v_horas_desde_envio >= 54 THEN
      RETURN 'alerta';
    END IF;

    RETURN 'enviado';
  END IF;

  RETURN 'pendiente';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. COMENTARIOS
-- ============================================

COMMENT ON TABLE reconciliacion_logs IS 'Logs de ejecución del proceso de reconciliación cada 6 horas';
COMMENT ON TABLE webhook_logs IS 'Auditoría de todos los webhooks recibidos de SendGrid/Twilio';
COMMENT ON COLUMN notificaciones.grace_period_inicio_at IS 'Inicio del grace period de 6 horas (hora 48)';
COMMENT ON COLUMN notificaciones.grace_period_fin_at IS 'Fin del grace period (hora 54)';
COMMENT ON COLUMN notificaciones.subsidiariedad_activada_at IS 'Timestamp cuando se activó la subsidiariedad física';
COMMENT ON FUNCTION evaluar_grace_period IS 'Evalúa si una notificación necesita grace period y lo activa si corresponde';
COMMENT ON FUNCTION obtener_pendientes_reconciliacion IS 'Obtiene notificaciones que deben revisarse en reconciliación';
