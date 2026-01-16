-- ============================================
-- Migración: Auditoría de Notificaciones Fehacientes
-- Fecha: 2026-01-14
-- Descripción: Campos para tracking multicanal, semáforo de estado
--              y contingencia física según normativa laboral argentina
-- ============================================

-- ============================================
-- 1. CAMPOS DE TOKEN Y TRACKING EN NOTIFICACIONES
-- ============================================

-- Token único para acceso seguro (evita manipulación de URL)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS token_acceso UUID DEFAULT gen_random_uuid() UNIQUE;

-- Tracking de email
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS email_enviado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_entregado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_abierto_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email_rebotado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_rebote_tipo VARCHAR(50),
ADD COLUMN IF NOT EXISTS email_rebote_mensaje TEXT;

-- Tracking de SMS
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS sms_enviado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_entregado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sms_fallido BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sms_error_mensaje TEXT;

-- Tracking de apertura de link (antes de confirmar)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS link_abierto_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS link_abierto_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS link_abierto_user_agent TEXT,
ADD COLUMN IF NOT EXISTS link_abierto_count INTEGER DEFAULT 0;

-- Fecha de confirmación de lectura (más detallada)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS lectura_confirmada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS lectura_ip VARCHAR(45),
ADD COLUMN IF NOT EXISTS lectura_user_agent TEXT,
ADD COLUMN IF NOT EXISTS lectura_dispositivo VARCHAR(100);

-- Contingencia física
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS requiere_notificacion_fisica BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS notificacion_fisica_generada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notificacion_fisica_entregada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notificacion_fisica_firmada BOOLEAN DEFAULT false;

-- Estado del semáforo (calculado pero cacheado para performance)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS semaforo VARCHAR(20) DEFAULT 'pendiente'
  CHECK (semaforo IN ('pendiente', 'enviado', 'abierto', 'leido', 'alerta', 'firme'));

-- Fecha de firmeza automática
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS fecha_firmeza TIMESTAMPTZ;

-- ============================================
-- 2. ÍNDICES PARA QUERIES DE NOTIFICACIÓN
-- ============================================

-- Índice para buscar por token de acceso
CREATE INDEX IF NOT EXISTS idx_notificaciones_token
ON notificaciones(token_acceso);

-- Índice para cron de SMS (24hs sin lectura)
CREATE INDEX IF NOT EXISTS idx_notificaciones_pendiente_sms
ON notificaciones(email_enviado_at, sms_enviado_at, estado)
WHERE email_enviado_at IS NOT NULL
  AND sms_enviado_at IS NULL
  AND estado = 'enviado';

-- Índice para cron de firmeza (30 días)
CREATE INDEX IF NOT EXISTS idx_notificaciones_pendiente_firmeza
ON notificaciones(lectura_confirmada_at, estado)
WHERE lectura_confirmada_at IS NOT NULL
  AND estado = 'leido';

-- Índice para alertas (48hs sin confirmación)
CREATE INDEX IF NOT EXISTS idx_notificaciones_alerta
ON notificaciones(email_enviado_at, lectura_confirmada_at, semaforo)
WHERE lectura_confirmada_at IS NULL;

-- ============================================
-- 3. TABLA DE EVENTOS DE NOTIFICACIÓN (AUDITORÍA COMPLETA)
-- ============================================

-- Ya existe tabla eventos, pero agregamos tipos específicos
-- Los tipos serán:
--   email_enviado, email_entregado, email_abierto, email_rebotado
--   sms_enviado, sms_entregado, sms_fallido
--   link_abierto, lectura_confirmada
--   alerta_fisica_generada, notificacion_fisica_entregada

-- ============================================
-- 4. FUNCIÓN PARA CALCULAR SEMÁFORO
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

    -- Si abrió el link pero no confirmó = AMARILLO
    IF v_notif.link_abierto_at IS NOT NULL THEN
      v_horas_desde_apertura := EXTRACT(EPOCH FROM (NOW() - v_notif.link_abierto_at)) / 3600;

      -- Si pasaron más de 48hs desde apertura sin confirmar = ROJO
      IF v_horas_desde_apertura >= 48 THEN
        RETURN 'alerta';
      END IF;

      RETURN 'abierto';
    END IF;

    -- Más de 48hs sin abrir = ROJO (alerta)
    IF v_horas_desde_envio >= 48 THEN
      RETURN 'alerta';
    END IF;

    RETURN 'enviado';
  END IF;

  RETURN 'pendiente';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. TRIGGER PARA ACTUALIZAR SEMÁFORO
-- ============================================

CREATE OR REPLACE FUNCTION trigger_actualizar_semaforo()
RETURNS TRIGGER AS $$
BEGIN
  NEW.semaforo := calcular_semaforo(NEW.id);

  -- Si pasa a alerta, marcar que requiere notificación física
  IF NEW.semaforo = 'alerta' AND OLD.semaforo != 'alerta' THEN
    NEW.requiere_notificacion_fisica := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_semaforo_notificacion ON notificaciones;
CREATE TRIGGER trigger_semaforo_notificacion
  BEFORE UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION trigger_actualizar_semaforo();

-- ============================================
-- 6. FUNCIÓN PARA MARCAR FIRMEZA AUTOMÁTICA
-- ============================================

CREATE OR REPLACE FUNCTION procesar_firmeza_automatica()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Actualizar a firme las notificaciones leídas hace más de 30 días
  UPDATE notificaciones
  SET
    estado = 'firme',
    semaforo = 'firme',
    fecha_firmeza = NOW()
  WHERE
    estado = 'leido'
    AND lectura_confirmada_at IS NOT NULL
    AND lectura_confirmada_at <= NOW() - INTERVAL '30 days'
    AND fecha_firmeza IS NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. FUNCIÓN PARA OBTENER PENDIENTES DE SMS
-- ============================================

CREATE OR REPLACE FUNCTION obtener_pendientes_sms()
RETURNS TABLE (
  id UUID,
  empleado_id UUID,
  token_acceso UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.empleado_id, n.token_acceso
  FROM notificaciones n
  WHERE n.email_enviado_at IS NOT NULL
    AND n.email_enviado_at <= NOW() - INTERVAL '24 hours'
    AND n.sms_enviado_at IS NULL
    AND n.lectura_confirmada_at IS NULL
    AND n.estado = 'enviado';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNCIÓN PARA OBTENER ALERTAS FÍSICAS
-- ============================================

CREATE OR REPLACE FUNCTION obtener_alertas_fisicas()
RETURNS TABLE (
  id UUID,
  empleado_id UUID,
  empresa_id UUID,
  semaforo VARCHAR(20),
  horas_sin_confirmacion NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.empleado_id,
    n.empresa_id,
    n.semaforo,
    EXTRACT(EPOCH FROM (NOW() - COALESCE(n.link_abierto_at, n.email_enviado_at))) / 3600 as horas
  FROM notificaciones n
  WHERE n.semaforo = 'alerta'
    AND n.requiere_notificacion_fisica = true
    AND n.notificacion_fisica_generada_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN notificaciones.token_acceso IS 'Token UUID único para acceso seguro al link de lectura';
COMMENT ON COLUMN notificaciones.semaforo IS 'Estado visual: pendiente, enviado, abierto (amarillo), leido (verde), alerta (rojo), firme';
COMMENT ON COLUMN notificaciones.requiere_notificacion_fisica IS 'Flag activado automáticamente cuando pasan 48hs sin confirmación';
COMMENT ON FUNCTION calcular_semaforo IS 'Calcula el estado del semáforo basado en tiempos y acciones';
COMMENT ON FUNCTION procesar_firmeza_automatica IS 'Llamar desde cron para marcar como firmes las sanciones de +30 días';
COMMENT ON FUNCTION obtener_pendientes_sms IS 'Obtiene notificaciones que necesitan SMS (24hs sin lectura)';
