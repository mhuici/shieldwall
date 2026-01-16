-- =====================================================
-- MIGRACIÓN: Sistema de Bitácora de Novedades
-- Fecha: 2026-01-16
-- Propósito: Log de hechos NO sancionatorios para demostrar
--            "progresividad" y destruir argumento de mobbing (Art. 64 LCT)
-- =====================================================

-- Tabla principal de novedades
CREATE TABLE IF NOT EXISTS bitacora_novedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculaciones
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
  supervisor_id UUID REFERENCES auth.users(id), -- Quien registra la novedad

  -- Tipo de novedad
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
    'recordatorio_verbal',      -- "Se le recordó uso de EPP"
    'conversacion_informal',    -- "Se habló sobre puntualidad"
    'permiso_concedido',        -- "Se retiró 5 min antes con permiso"
    'felicitacion',             -- "Se reconoció buen desempeño"
    'capacitacion',             -- "Participó en charla de seguridad"
    'incidente_menor',          -- "Llegó 2 min tarde, primera vez"
    'ajuste_horario',           -- "Se acordó cambio de turno"
    'comunicacion_general',     -- "Se informó nuevo procedimiento"
    'otro'
  )),

  -- Categoría para filtrado
  categoria VARCHAR(30) CHECK (categoria IN (
    'puntualidad',
    'seguridad',
    'conducta',
    'rendimiento',
    'comunicacion',
    'normativa_interna',
    'otro'
  )),

  -- Contenido
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_hecho DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_hecho TIME,
  lugar VARCHAR(100),

  -- Testigos presentes (opcional)
  testigos_presentes TEXT[], -- Array de nombres

  -- Respuesta del empleado (opcional)
  empleado_respuesta TEXT,
  empleado_actitud VARCHAR(30) CHECK (empleado_actitud IN (
    'colaborativa',
    'neutral',
    'reticente',
    'no_aplica'
  )) DEFAULT 'no_aplica',

  -- Vínculo con sanción posterior (si aplica)
  sancion_relacionada_id UUID REFERENCES notificaciones(id) ON DELETE SET NULL,

  -- Integridad
  hash_sha256 VARCHAR(64),

  -- Metadatos de creación
  creado_por_nombre VARCHAR(100), -- Nombre del supervisor
  creado_desde_ip INET,
  creado_user_agent TEXT,

  -- Archivado (no se pueden eliminar)
  archivado BOOLEAN DEFAULT false,
  archivado_at TIMESTAMPTZ,
  archivado_motivo TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_bitacora_empresa ON bitacora_novedades(empresa_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_empleado ON bitacora_novedades(empleado_id);
CREATE INDEX IF NOT EXISTS idx_bitacora_fecha ON bitacora_novedades(fecha_hecho DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_tipo ON bitacora_novedades(tipo);
CREATE INDEX IF NOT EXISTS idx_bitacora_categoria ON bitacora_novedades(categoria);
CREATE INDEX IF NOT EXISTS idx_bitacora_empleado_fecha ON bitacora_novedades(empleado_id, fecha_hecho DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_sancion ON bitacora_novedades(sancion_relacionada_id)
  WHERE sancion_relacionada_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bitacora_no_archivada ON bitacora_novedades(empresa_id, empleado_id, archivado)
  WHERE archivado = false;

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_bitacora_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bitacora_updated_at ON bitacora_novedades;
CREATE TRIGGER trigger_bitacora_updated_at
  BEFORE UPDATE ON bitacora_novedades
  FOR EACH ROW
  EXECUTE FUNCTION update_bitacora_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE bitacora_novedades ENABLE ROW LEVEL SECURITY;

-- Política: Empresa ve sus novedades
CREATE POLICY "Empresa ve sus novedades" ON bitacora_novedades
  FOR SELECT USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- Política: Empresa crea novedades
CREATE POLICY "Empresa crea novedades" ON bitacora_novedades
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- Política: Empresa actualiza novedades (solo dentro de 24hs y si no está archivada)
CREATE POLICY "Empresa actualiza novedades" ON bitacora_novedades
  FOR UPDATE USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
    AND archivado = false
    AND created_at > now() - interval '24 hours'
  );

-- Política: No se pueden eliminar novedades (solo archivar)
-- No creamos política DELETE

-- =====================================================
-- TABLA DE EVENTOS DE BITÁCORA (Auditoría)
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos_bitacora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  novedad_id UUID NOT NULL REFERENCES bitacora_novedades(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'creada',
    'actualizada',
    'archivada',
    'vinculada_sancion',
    'desvinculada_sancion'
  )),

  metadata JSONB DEFAULT '{}',
  ip INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_bitacora_novedad ON eventos_bitacora(novedad_id);
CREATE INDEX IF NOT EXISTS idx_eventos_bitacora_tipo ON eventos_bitacora(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_bitacora_fecha ON eventos_bitacora(created_at);

-- RLS para eventos
ALTER TABLE eventos_bitacora ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresa ve eventos de bitacora" ON eventos_bitacora
  FOR SELECT USING (
    novedad_id IN (
      SELECT id FROM bitacora_novedades
      WHERE empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Insert publico eventos bitacora" ON eventos_bitacora
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener resumen de bitácora de un empleado (últimos N meses)
CREATE OR REPLACE FUNCTION obtener_bitacora_resumen(
  p_empleado_id UUID,
  p_meses INTEGER DEFAULT 6
) RETURNS TABLE (
  total_novedades BIGINT,
  novedades_por_tipo JSONB,
  novedades_por_categoria JSONB,
  primera_novedad DATE,
  ultima_novedad DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total,
    (
      SELECT jsonb_object_agg(tipo, cnt)
      FROM (
        SELECT tipo, COUNT(*) as cnt
        FROM bitacora_novedades bn2
        WHERE bn2.empleado_id = p_empleado_id
          AND bn2.archivado = false
          AND bn2.fecha_hecho >= CURRENT_DATE - (p_meses || ' months')::INTERVAL
        GROUP BY tipo
      ) t
    ) as por_tipo,
    (
      SELECT jsonb_object_agg(COALESCE(categoria, 'sin_categoria'), cnt)
      FROM (
        SELECT categoria, COUNT(*) as cnt
        FROM bitacora_novedades bn3
        WHERE bn3.empleado_id = p_empleado_id
          AND bn3.archivado = false
          AND bn3.fecha_hecho >= CURRENT_DATE - (p_meses || ' months')::INTERVAL
        GROUP BY categoria
      ) c
    ) as por_categoria,
    MIN(fecha_hecho) as primera,
    MAX(fecha_hecho) as ultima
  FROM bitacora_novedades bn
  WHERE bn.empleado_id = p_empleado_id
    AND bn.archivado = false
    AND bn.fecha_hecho >= CURRENT_DATE - (p_meses || ' months')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener novedades detalladas de un empleado
CREATE OR REPLACE FUNCTION obtener_bitacora_detalle(
  p_empleado_id UUID,
  p_meses INTEGER DEFAULT 6,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  id UUID,
  tipo VARCHAR(30),
  categoria VARCHAR(30),
  titulo VARCHAR(200),
  descripcion TEXT,
  fecha_hecho DATE,
  hora_hecho TIME,
  lugar VARCHAR(100),
  testigos_presentes TEXT[],
  empleado_actitud VARCHAR(30),
  creado_por_nombre VARCHAR(100),
  created_at TIMESTAMPTZ,
  hash_sha256 VARCHAR(64)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bn.id,
    bn.tipo,
    bn.categoria,
    bn.titulo,
    bn.descripcion,
    bn.fecha_hecho,
    bn.hora_hecho,
    bn.lugar,
    bn.testigos_presentes,
    bn.empleado_actitud,
    bn.creado_por_nombre,
    bn.created_at,
    bn.hash_sha256
  FROM bitacora_novedades bn
  WHERE bn.empleado_id = p_empleado_id
    AND bn.archivado = false
    AND bn.fecha_hecho >= CURRENT_DATE - (p_meses || ' months')::INTERVAL
  ORDER BY bn.fecha_hecho DESC, bn.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar hash de novedad
CREATE OR REPLACE FUNCTION generar_hash_novedad(
  p_empresa_id UUID,
  p_empleado_id UUID,
  p_tipo VARCHAR(30),
  p_titulo VARCHAR(200),
  p_descripcion TEXT,
  p_fecha_hecho DATE,
  p_timestamp TIMESTAMPTZ
) RETURNS VARCHAR(64) AS $$
DECLARE
  contenido TEXT;
BEGIN
  contenido := p_empresa_id::TEXT || '|' ||
               p_empleado_id::TEXT || '|' ||
               p_tipo || '|' ||
               p_titulo || '|' ||
               COALESCE(p_descripcion, '') || '|' ||
               p_fecha_hecho::TEXT || '|' ||
               p_timestamp::TEXT;
  RETURN encode(sha256(contenido::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Función para vincular novedades a una sanción
CREATE OR REPLACE FUNCTION vincular_novedades_a_sancion(
  p_sancion_id UUID,
  p_empleado_id UUID,
  p_meses INTEGER DEFAULT 6
) RETURNS INTEGER AS $$
DECLARE
  cantidad INTEGER;
BEGIN
  UPDATE bitacora_novedades
  SET sancion_relacionada_id = p_sancion_id
  WHERE empleado_id = p_empleado_id
    AND archivado = false
    AND fecha_hecho >= CURRENT_DATE - (p_meses || ' months')::INTERVAL
    AND sancion_relacionada_id IS NULL;

  GET DIAGNOSTICS cantidad = ROW_COUNT;
  RETURN cantidad;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE bitacora_novedades IS 'Log de hechos NO sancionatorios para demostrar progresividad y gestión de personal (Art. 64 LCT). Los registros no se pueden eliminar, solo archivar.';

COMMENT ON COLUMN bitacora_novedades.tipo IS 'Tipo de novedad: recordatorio_verbal, conversacion_informal, permiso_concedido, felicitacion, capacitacion, incidente_menor, ajuste_horario, comunicacion_general, otro.';
COMMENT ON COLUMN bitacora_novedades.categoria IS 'Categoría para filtrado: puntualidad, seguridad, conducta, rendimiento, comunicacion, normativa_interna, otro.';
COMMENT ON COLUMN bitacora_novedades.hash_sha256 IS 'Hash SHA-256 del contenido para verificar integridad y demostrar que no fue alterado.';
COMMENT ON COLUMN bitacora_novedades.sancion_relacionada_id IS 'Vínculo opcional con una sanción posterior. Permite ver el contexto de gestión previa a la sanción.';
COMMENT ON COLUMN bitacora_novedades.archivado IS 'Las novedades no se eliminan, se archivan. Una vez archivada no puede modificarse.';
COMMENT ON COLUMN bitacora_novedades.empleado_actitud IS 'Actitud del empleado al recibir la novedad: colaborativa, neutral, reticente, no_aplica.';

COMMENT ON TABLE eventos_bitacora IS 'Auditoría de todas las acciones en la bitácora para cadena de custodia.';

COMMENT ON FUNCTION obtener_bitacora_resumen IS 'Obtiene resumen estadístico de la bitácora de un empleado para los últimos N meses.';
COMMENT ON FUNCTION obtener_bitacora_detalle IS 'Obtiene novedades detalladas de un empleado para los últimos N meses.';
COMMENT ON FUNCTION vincular_novedades_a_sancion IS 'Vincula todas las novedades de un empleado de los últimos N meses a una sanción.';
