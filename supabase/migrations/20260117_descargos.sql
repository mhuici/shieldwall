-- =====================================================
-- FASE 4: AUDIENCIA DE DESCARGO VIRTUAL
-- "El golpe maestro" - Genera confesiones, contradicciones,
-- o registra que se le dio derecho a defensa
-- =====================================================

-- Tabla principal de descargos
CREATE TABLE IF NOT EXISTS descargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,

  -- Token de acceso público (como testigos)
  token_acceso UUID UNIQUE DEFAULT gen_random_uuid(),
  token_expira_at TIMESTAMPTZ, -- Vence con los 30 días de la sanción

  -- Decisión del empleado
  decision VARCHAR(30) CHECK (decision IN (
    'pendiente',           -- Aún no decidió
    'ejercer_descargo',    -- Decidió escribir su versión
    'declinar_descargo',   -- Decidió NO ejercer el derecho
    'vencido'              -- Plazo venció sin decisión
  )) DEFAULT 'pendiente',

  decision_timestamp TIMESTAMPTZ,
  decision_ip INET,
  decision_user_agent TEXT,

  -- Contenido del descargo (si ejerció)
  texto_descargo TEXT,
  archivos_adjuntos JSONB DEFAULT '[]', -- [{nombre, url, tipo, hash}]

  -- Validación de identidad (Gatekeeper)
  identidad_validada_at TIMESTAMPTZ,
  identidad_cuil_ingresado VARCHAR(13),
  identidad_ip INET,
  identidad_user_agent TEXT,

  -- Confirmación final
  confirmado_at TIMESTAMPTZ,
  checkbox_texto_aceptado TEXT, -- El texto legal que aceptó
  checkbox_aceptado BOOLEAN DEFAULT false,
  confirmacion_ip INET,
  confirmacion_user_agent TEXT,

  -- Hash de integridad del descargo completo
  hash_sha256 VARCHAR(64),

  -- Análisis por empleador (marcado manualmente después)
  contiene_admision BOOLEAN,
  contiene_contradiccion BOOLEAN,
  notas_empleador TEXT,
  analizado_at TIMESTAMPTZ,
  analizado_por UUID REFERENCES auth.users(id),

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_descargos_notificacion ON descargos(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_descargos_token ON descargos(token_acceso);
CREATE INDEX IF NOT EXISTS idx_descargos_empresa ON descargos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_descargos_empleado ON descargos(empleado_id);
CREATE INDEX IF NOT EXISTS idx_descargos_decision ON descargos(decision);

-- RLS
ALTER TABLE descargos ENABLE ROW LEVEL SECURITY;

-- Política: empresas solo ven sus descargos
CREATE POLICY "Empresas ven sus descargos"
  ON descargos FOR SELECT
  USING (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ));

-- Política: empresas pueden actualizar notas/análisis
CREATE POLICY "Empresas actualizan análisis"
  ON descargos FOR UPDATE
  USING (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ))
  WITH CHECK (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ));

-- Política: inserción solo por trigger/sistema
CREATE POLICY "Sistema inserta descargos"
  ON descargos FOR INSERT
  WITH CHECK (true); -- El trigger lo maneja

-- =====================================================
-- TABLA DE EVENTOS DE DESCARGO (Auditoría)
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos_descargo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  descargo_id UUID NOT NULL REFERENCES descargos(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'creado',
    'token_generado',
    'identidad_validada',
    'identidad_fallida',
    'decision_ejercer',
    'decision_declinar',
    'borrador_guardado',
    'archivo_adjuntado',
    'confirmado',
    'vencido',
    'analizado'
  )),

  metadata JSONB DEFAULT '{}',
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_descargo_descargo ON eventos_descargo(descargo_id);
CREATE INDEX IF NOT EXISTS idx_eventos_descargo_tipo ON eventos_descargo(tipo);

-- RLS para eventos
ALTER TABLE eventos_descargo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas ven eventos de sus descargos"
  ON eventos_descargo FOR SELECT
  USING (descargo_id IN (
    SELECT id FROM descargos WHERE empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  ));

-- =====================================================
-- FUNCIÓN: Crear descargo automáticamente al notificar
-- =====================================================

CREATE OR REPLACE FUNCTION crear_descargo_automatico()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo crear si la notificación pasa a estado 'notificado' o 'leido'
  IF (NEW.estado IN ('notificado', 'leido') AND
      (OLD.estado IS NULL OR OLD.estado NOT IN ('notificado', 'leido'))) THEN

    -- Verificar que no exista ya un descargo para esta notificación
    IF NOT EXISTS (SELECT 1 FROM descargos WHERE notificacion_id = NEW.id) THEN
      INSERT INTO descargos (
        notificacion_id,
        empresa_id,
        empleado_id,
        token_expira_at
      ) VALUES (
        NEW.id,
        NEW.empresa_id,
        NEW.empleado_id,
        NEW.fecha_vencimiento::timestamptz + interval '1 day' -- Vence un día después de la sanción
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear descargo automáticamente
DROP TRIGGER IF EXISTS trigger_crear_descargo_auto ON notificaciones;
CREATE TRIGGER trigger_crear_descargo_auto
  AFTER UPDATE ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION crear_descargo_automatico();

-- También crear en INSERT si ya viene con estado notificado
DROP TRIGGER IF EXISTS trigger_crear_descargo_auto_insert ON notificaciones;
CREATE TRIGGER trigger_crear_descargo_auto_insert
  AFTER INSERT ON notificaciones
  FOR EACH ROW
  WHEN (NEW.estado IN ('notificado', 'leido'))
  EXECUTE FUNCTION crear_descargo_automatico();

-- =====================================================
-- FUNCIÓN: Marcar descargos vencidos
-- =====================================================

CREATE OR REPLACE FUNCTION marcar_descargos_vencidos()
RETURNS INTEGER AS $$
DECLARE
  filas_actualizadas INTEGER;
BEGIN
  UPDATE descargos
  SET
    decision = 'vencido',
    updated_at = now()
  WHERE
    decision = 'pendiente'
    AND token_expira_at < now();

  GET DIAGNOSTICS filas_actualizadas = ROW_COUNT;
  RETURN filas_actualizadas;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Obtener descargo por token (público)
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_descargo_por_token(p_token UUID)
RETURNS TABLE (
  id UUID,
  notificacion_id UUID,
  decision VARCHAR(30),
  token_expira_at TIMESTAMPTZ,
  identidad_validada BOOLEAN,
  confirmado BOOLEAN,
  empleado_nombre TEXT,
  empleado_cuil TEXT,
  sancion_tipo TEXT,
  sancion_motivo TEXT,
  sancion_descripcion TEXT,
  sancion_fecha_hecho DATE,
  empresa_nombre TEXT,
  dias_restantes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.notificacion_id,
    d.decision,
    d.token_expira_at,
    (d.identidad_validada_at IS NOT NULL) AS identidad_validada,
    (d.confirmado_at IS NOT NULL) AS confirmado,
    e.nombre AS empleado_nombre,
    e.cuil AS empleado_cuil,
    n.tipo AS sancion_tipo,
    n.motivo AS sancion_motivo,
    n.descripcion AS sancion_descripcion,
    n.fecha_hecho AS sancion_fecha_hecho,
    emp.razon_social AS empresa_nombre,
    GREATEST(0, EXTRACT(DAY FROM d.token_expira_at - now())::INTEGER) AS dias_restantes
  FROM descargos d
  JOIN notificaciones n ON n.id = d.notificacion_id
  JOIN empleados e ON e.id = d.empleado_id
  JOIN empresas emp ON emp.id = d.empresa_id
  WHERE d.token_acceso = p_token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Validar identidad para descargo
-- =====================================================

CREATE OR REPLACE FUNCTION validar_identidad_descargo(
  p_token UUID,
  p_cuil VARCHAR(13),
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_descargo RECORD;
  v_empleado RECORD;
  v_resultado JSONB;
BEGIN
  -- Obtener descargo
  SELECT d.*, e.cuil AS cuil_real
  INTO v_descargo
  FROM descargos d
  JOIN empleados e ON e.id = d.empleado_id
  WHERE d.token_acceso = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido o expirado');
  END IF;

  -- Verificar que no haya expirado
  IF v_descargo.token_expira_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plazo para presentar descargo ha vencido');
  END IF;

  -- Verificar que no esté ya confirmado
  IF v_descargo.confirmado_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este descargo ya fue confirmado');
  END IF;

  -- Normalizar CUILs (quitar guiones)
  DECLARE
    cuil_ingresado_limpio VARCHAR(11);
    cuil_real_limpio VARCHAR(11);
  BEGIN
    cuil_ingresado_limpio := REPLACE(REPLACE(p_cuil, '-', ''), ' ', '');
    cuil_real_limpio := REPLACE(REPLACE(v_descargo.cuil_real, '-', ''), ' ', '');

    IF cuil_ingresado_limpio != cuil_real_limpio THEN
      -- Registrar intento fallido
      INSERT INTO eventos_descargo (descargo_id, tipo, metadata, ip, user_agent)
      VALUES (v_descargo.id, 'identidad_fallida',
        jsonb_build_object('cuil_ingresado', p_cuil),
        p_ip, p_user_agent);

      RETURN jsonb_build_object('success', false, 'error', 'CUIL incorrecto');
    END IF;
  END;

  -- Actualizar descargo con validación
  UPDATE descargos SET
    identidad_validada_at = now(),
    identidad_cuil_ingresado = p_cuil,
    identidad_ip = p_ip,
    identidad_user_agent = p_user_agent,
    updated_at = now()
  WHERE id = v_descargo.id;

  -- Registrar evento
  INSERT INTO eventos_descargo (descargo_id, tipo, metadata, ip, user_agent)
  VALUES (v_descargo.id, 'identidad_validada',
    jsonb_build_object('cuil', p_cuil),
    p_ip, p_user_agent);

  RETURN jsonb_build_object('success', true, 'message', 'Identidad validada correctamente');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Registrar decisión de descargo
-- =====================================================

CREATE OR REPLACE FUNCTION registrar_decision_descargo(
  p_token UUID,
  p_decision VARCHAR(30),
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_descargo RECORD;
BEGIN
  -- Obtener descargo
  SELECT * INTO v_descargo
  FROM descargos
  WHERE token_acceso = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido');
  END IF;

  -- Verificar que la identidad esté validada
  IF v_descargo.identidad_validada_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debe validar su identidad primero');
  END IF;

  -- Verificar que no haya expirado
  IF v_descargo.token_expira_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plazo ha vencido');
  END IF;

  -- Verificar que no esté ya confirmado
  IF v_descargo.confirmado_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este descargo ya fue confirmado');
  END IF;

  -- Verificar decisión válida
  IF p_decision NOT IN ('ejercer_descargo', 'declinar_descargo') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Decisión inválida');
  END IF;

  -- Actualizar decisión
  UPDATE descargos SET
    decision = p_decision,
    decision_timestamp = now(),
    decision_ip = p_ip,
    decision_user_agent = p_user_agent,
    updated_at = now()
  WHERE id = v_descargo.id;

  -- Registrar evento
  INSERT INTO eventos_descargo (descargo_id, tipo, metadata, ip, user_agent)
  VALUES (v_descargo.id,
    CASE WHEN p_decision = 'ejercer_descargo' THEN 'decision_ejercer' ELSE 'decision_declinar' END,
    jsonb_build_object('decision', p_decision),
    p_ip, p_user_agent);

  RETURN jsonb_build_object('success', true, 'decision', p_decision);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Guardar borrador de descargo
-- =====================================================

CREATE OR REPLACE FUNCTION guardar_borrador_descargo(
  p_token UUID,
  p_texto TEXT,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_descargo RECORD;
BEGIN
  -- Obtener descargo
  SELECT * INTO v_descargo
  FROM descargos
  WHERE token_acceso = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido');
  END IF;

  -- Verificar que decidió ejercer
  IF v_descargo.decision != 'ejercer_descargo' THEN
    RETURN jsonb_build_object('success', false, 'error', 'No puede escribir descargo si no eligió ejercerlo');
  END IF;

  -- Verificar que no esté confirmado
  IF v_descargo.confirmado_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'El descargo ya fue confirmado');
  END IF;

  -- Verificar que no haya expirado
  IF v_descargo.token_expira_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plazo ha vencido');
  END IF;

  -- Guardar borrador
  UPDATE descargos SET
    texto_descargo = p_texto,
    updated_at = now()
  WHERE id = v_descargo.id;

  -- Registrar evento
  INSERT INTO eventos_descargo (descargo_id, tipo, metadata, ip, user_agent)
  VALUES (v_descargo.id, 'borrador_guardado',
    jsonb_build_object('longitud', LENGTH(p_texto)),
    p_ip, p_user_agent);

  RETURN jsonb_build_object('success', true, 'message', 'Borrador guardado');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Confirmar descargo (ejercido o declinado)
-- =====================================================

CREATE OR REPLACE FUNCTION confirmar_descargo(
  p_token UUID,
  p_checkbox_texto TEXT,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_descargo RECORD;
  v_hash VARCHAR(64);
  v_contenido_hash TEXT;
BEGIN
  -- Obtener descargo
  SELECT * INTO v_descargo
  FROM descargos
  WHERE token_acceso = p_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido');
  END IF;

  -- Verificar que la identidad esté validada
  IF v_descargo.identidad_validada_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debe validar su identidad primero');
  END IF;

  -- Verificar que haya tomado una decisión
  IF v_descargo.decision NOT IN ('ejercer_descargo', 'declinar_descargo') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Debe elegir si ejercer o declinar el descargo');
  END IF;

  -- Verificar que no esté ya confirmado
  IF v_descargo.confirmado_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Este descargo ya fue confirmado');
  END IF;

  -- Verificar que no haya expirado
  IF v_descargo.token_expira_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'El plazo ha vencido');
  END IF;

  -- Si ejerció, verificar que haya texto
  IF v_descargo.decision = 'ejercer_descargo' AND
     (v_descargo.texto_descargo IS NULL OR LENGTH(TRIM(v_descargo.texto_descargo)) < 20) THEN
    RETURN jsonb_build_object('success', false, 'error', 'El descargo debe tener al menos 20 caracteres');
  END IF;

  -- Generar hash del contenido
  v_contenido_hash := jsonb_build_object(
    'descargo_id', v_descargo.id,
    'notificacion_id', v_descargo.notificacion_id,
    'decision', v_descargo.decision,
    'texto_descargo', COALESCE(v_descargo.texto_descargo, ''),
    'checkbox_texto', p_checkbox_texto,
    'timestamp', now()
  )::text;

  v_hash := encode(sha256(v_contenido_hash::bytea), 'hex');

  -- Confirmar descargo
  UPDATE descargos SET
    confirmado_at = now(),
    checkbox_texto_aceptado = p_checkbox_texto,
    checkbox_aceptado = true,
    confirmacion_ip = p_ip,
    confirmacion_user_agent = p_user_agent,
    hash_sha256 = v_hash,
    updated_at = now()
  WHERE id = v_descargo.id;

  -- Registrar evento
  INSERT INTO eventos_descargo (descargo_id, tipo, metadata, ip, user_agent)
  VALUES (v_descargo.id, 'confirmado',
    jsonb_build_object(
      'decision', v_descargo.decision,
      'hash', v_hash,
      'tiene_texto', v_descargo.texto_descargo IS NOT NULL
    ),
    p_ip, p_user_agent);

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Descargo confirmado correctamente',
    'hash', v_hash,
    'decision', v_descargo.decision
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Obtener resumen de descargo para empleador
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_descargo_completo(p_notificacion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_descargo RECORD;
  v_eventos JSONB;
BEGIN
  -- Obtener descargo
  SELECT * INTO v_descargo
  FROM descargos
  WHERE notificacion_id = p_notificacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('existe', false);
  END IF;

  -- Obtener eventos
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', tipo,
      'metadata', metadata,
      'created_at', created_at
    ) ORDER BY created_at
  ) INTO v_eventos
  FROM eventos_descargo
  WHERE descargo_id = v_descargo.id;

  RETURN jsonb_build_object(
    'existe', true,
    'id', v_descargo.id,
    'decision', v_descargo.decision,
    'decision_timestamp', v_descargo.decision_timestamp,
    'texto_descargo', v_descargo.texto_descargo,
    'archivos_adjuntos', v_descargo.archivos_adjuntos,
    'confirmado_at', v_descargo.confirmado_at,
    'hash_sha256', v_descargo.hash_sha256,
    'token_expira_at', v_descargo.token_expira_at,
    'dias_restantes', GREATEST(0, EXTRACT(DAY FROM v_descargo.token_expira_at - now())::INTEGER),
    'contiene_admision', v_descargo.contiene_admision,
    'contiene_contradiccion', v_descargo.contiene_contradiccion,
    'notas_empleador', v_descargo.notas_empleador,
    'eventos', COALESCE(v_eventos, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS para funciones públicas
-- =====================================================

-- Las funciones con token son públicas (para empleados sin cuenta)
GRANT EXECUTE ON FUNCTION obtener_descargo_por_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION validar_identidad_descargo(UUID, VARCHAR, INET, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION registrar_decision_descargo(UUID, VARCHAR, INET, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION guardar_borrador_descargo(UUID, TEXT, INET, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION confirmar_descargo(UUID, TEXT, INET, TEXT) TO anon;

-- Función de resumen solo para autenticados
GRANT EXECUTE ON FUNCTION obtener_descargo_completo(UUID) TO authenticated;
