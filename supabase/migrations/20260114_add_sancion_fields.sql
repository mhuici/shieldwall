-- ============================================
-- Migración: Campos extendidos para Sanciones Disciplinarias
-- Fecha: 2026-01-14
-- Descripción: Agrega campos para el módulo de sanciones con
--              lógica de gradualidad, reincidencia y Art. 220 LCT
-- ============================================

-- ============================================
-- 1. NUEVOS CAMPOS EN TABLA NOTIFICACIONES
-- ============================================

-- Campos de gravedad y clasificación
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS gravedad VARCHAR(20),
ADD COLUMN IF NOT EXISTS motivo_codigo VARCHAR(100);

-- Campos de contexto del hecho
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS hora_hecho TIME,
ADD COLUMN IF NOT EXISTS lugar_hecho VARCHAR(200);

-- Campos de suspensión (Art. 220 LCT)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS dias_suspension INTEGER,
ADD COLUMN IF NOT EXISTS fecha_inicio_suspension DATE,
ADD COLUMN IF NOT EXISTS fecha_fin_suspension DATE;

-- Testigos (JSONB array)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS testigos JSONB DEFAULT '[]'::jsonb;

-- Reincidencia (calculado al crear)
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS nivel_reincidencia VARCHAR(30),
ADD COLUMN IF NOT EXISTS sanciones_previas_count INTEGER DEFAULT 0;

-- ============================================
-- 2. ACTUALIZAR TIPO DE SANCION
-- ============================================

-- Asegurarse de que el tipo soporte los nuevos valores
-- (el constraint se maneja a nivel aplicación con TypeScript)

-- ============================================
-- 3. ÍNDICES PARA CONSULTAS DE REINCIDENCIA
-- ============================================

-- Índice para buscar sanciones por empleado y fecha
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado_fecha
ON notificaciones(empleado_id, fecha_hecho DESC);

-- Índice para buscar suspensiones del año
CREATE INDEX IF NOT EXISTS idx_notificaciones_suspension_anio
ON notificaciones(empleado_id, tipo, fecha_hecho)
WHERE tipo = 'suspension';

-- Índice para motivos (análisis de patrones)
CREATE INDEX IF NOT EXISTS idx_notificaciones_motivo_codigo
ON notificaciones(empleado_id, motivo_codigo);

-- ============================================
-- 4. TABLA DE RUBROS (para futura configuración por CCT)
-- ============================================

CREATE TABLE IF NOT EXISTS rubros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  cct_numero VARCHAR(50),
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar rubros base
INSERT INTO rubros (codigo, nombre, cct_numero) VALUES
  ('gastronomia', 'Gastronomía', '389/04'),
  ('comercio', 'Comercio', '130/75'),
  ('logistica', 'Logística y Transporte', '40/89'),
  ('construccion', 'Construcción', '76/75'),
  ('manufactura', 'Manufactura', NULL),
  ('servicios', 'Servicios', NULL),
  ('salud', 'Salud', NULL),
  ('otro', 'Otro', NULL)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================
-- 5. TABLA DE MOTIVOS (catálogo configurable)
-- ============================================

CREATE TABLE IF NOT EXISTS motivos_sancion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  gravedad VARCHAR(20) NOT NULL CHECK (gravedad IN ('leve', 'moderada', 'grave')),
  descripcion_legal TEXT,
  requiere_testigos BOOLEAN DEFAULT false,
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. RELACIÓN MOTIVOS-RUBROS (muchos a muchos)
-- ============================================

CREATE TABLE IF NOT EXISTS motivos_rubros (
  motivo_id UUID REFERENCES motivos_sancion(id) ON DELETE CASCADE,
  rubro_id UUID REFERENCES rubros(id) ON DELETE CASCADE,
  PRIMARY KEY (motivo_id, rubro_id)
);

-- ============================================
-- 7. CONFIGURACIÓN POR RUBRO
-- ============================================

CREATE TABLE IF NOT EXISTS config_rubros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubro_id UUID REFERENCES rubros(id) ON DELETE CASCADE UNIQUE,
  dias_suspension_max_anual INTEGER DEFAULT 30,
  permite_apercibimiento_previo BOOLEAN DEFAULT true,
  requiere_testigos_obligatorio BOOLEAN DEFAULT false,
  campos_adicionales JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. FUNCIÓN PARA CALCULAR DÍAS SUSPENSIÓN ANUAL
-- ============================================

CREATE OR REPLACE FUNCTION calcular_dias_suspension_anual(p_empleado_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_dias INTEGER;
BEGIN
  SELECT COALESCE(SUM(dias_suspension), 0)
  INTO total_dias
  FROM notificaciones
  WHERE empleado_id = p_empleado_id
    AND tipo = 'suspension'
    AND estado IN ('enviado', 'leido', 'firme')
    AND fecha_hecho >= DATE_TRUNC('year', CURRENT_DATE);

  RETURN total_dias;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGER PARA VALIDAR LÍMITE Art. 220 LCT
-- ============================================

CREATE OR REPLACE FUNCTION validar_limite_suspension()
RETURNS TRIGGER AS $$
DECLARE
  dias_usados INTEGER;
  dias_disponibles INTEGER;
BEGIN
  IF NEW.tipo = 'suspension' AND NEW.dias_suspension IS NOT NULL THEN
    -- Calcular días ya usados
    dias_usados := calcular_dias_suspension_anual(NEW.empleado_id);
    dias_disponibles := 30 - dias_usados;

    -- Validar que no exceda el límite
    IF NEW.dias_suspension > dias_disponibles THEN
      RAISE EXCEPTION 'Excede el límite de 30 días de suspensión anual (Art. 220 LCT). Días disponibles: %', dias_disponibles;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger (si no existe)
DROP TRIGGER IF EXISTS trigger_validar_suspension ON notificaciones;
CREATE TRIGGER trigger_validar_suspension
  BEFORE INSERT ON notificaciones
  FOR EACH ROW
  EXECUTE FUNCTION validar_limite_suspension();

-- ============================================
-- 10. POLÍTICAS RLS (si están habilitadas)
-- ============================================

-- Las políticas existentes deberían cubrir los nuevos campos
-- ya que son columnas de la misma tabla notificaciones

-- ============================================
-- 11. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN notificaciones.gravedad IS 'Gravedad del motivo: leve, moderada, grave';
COMMENT ON COLUMN notificaciones.motivo_codigo IS 'Código del catálogo de motivos para análisis de reincidencia';
COMMENT ON COLUMN notificaciones.hora_hecho IS 'Hora aproximada del hecho';
COMMENT ON COLUMN notificaciones.lugar_hecho IS 'Lugar/sector donde ocurrió el hecho';
COMMENT ON COLUMN notificaciones.dias_suspension IS 'Cantidad de días de suspensión (solo si tipo=suspension)';
COMMENT ON COLUMN notificaciones.fecha_inicio_suspension IS 'Fecha de inicio de la suspensión';
COMMENT ON COLUMN notificaciones.fecha_fin_suspension IS 'Fecha de fin de la suspensión';
COMMENT ON COLUMN notificaciones.testigos IS 'Array de testigos {nombre, cargo, presente_en_hecho}';
COMMENT ON COLUMN notificaciones.nivel_reincidencia IS 'primera_vez, reincidente, reincidente_multiple';
COMMENT ON COLUMN notificaciones.sanciones_previas_count IS 'Cantidad de sanciones previas al momento de crear';

COMMENT ON TABLE rubros IS 'Catálogo de rubros/actividades económicas';
COMMENT ON TABLE motivos_sancion IS 'Catálogo de motivos de sanción predefinidos';
COMMENT ON TABLE config_rubros IS 'Configuración específica por rubro';
COMMENT ON FUNCTION calcular_dias_suspension_anual IS 'Calcula días de suspensión usados en el año actual';
