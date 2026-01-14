-- ============================================
-- NOTILEGAL - Schema de Base de Datos
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLA: empresas
-- ============================================
CREATE TABLE IF NOT EXISTS empresas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cuit VARCHAR(13) UNIQUE NOT NULL,
  razon_social TEXT NOT NULL,
  rubro VARCHAR(50) DEFAULT 'otro' CHECK (rubro IN ('gastronomia', 'logistica', 'comercio', 'manufactura', 'servicios', 'otro')),
  plan VARCHAR(20) DEFAULT 'trial' CHECK (plan IN ('trial', 'basico', 'profesional', 'empresa')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: empleados
-- ============================================
CREATE TABLE IF NOT EXISTS empleados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  cuil VARCHAR(13) NOT NULL,
  nombre TEXT NOT NULL,
  email VARCHAR(255),
  telefono VARCHAR(20),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un empleado no puede tener el mismo CUIL en la misma empresa
  UNIQUE(empresa_id, cuil)
);

-- ============================================
-- TABLA: notificaciones
-- ============================================
CREATE TABLE IF NOT EXISTS notificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('apercibimiento', 'suspension', 'otro')),
  motivo VARCHAR(200) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_hecho DATE NOT NULL,

  -- Evidencia
  pdf_url TEXT,
  hash_sha256 VARCHAR(64),
  timestamp_generacion TIMESTAMPTZ DEFAULT NOW(),
  ip_emisor INET,

  -- Envío
  enviado_email BOOLEAN DEFAULT false,
  enviado_sms BOOLEAN DEFAULT false,

  -- Tracking
  fecha_primera_lectura TIMESTAMPTZ,
  ip_lector INET,

  -- Estado
  estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado', 'leido', 'vencido', 'impugnado', 'firme')),
  fecha_vencimiento DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: eventos (tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notificacion_id UUID REFERENCES notificaciones(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_empresas_user ON empresas(user_id);
CREATE INDEX IF NOT EXISTS idx_empleados_empresa ON empleados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empleados_activo ON empleados(empresa_id, activo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empresa ON notificaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_empleado ON notificaciones(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_vencimiento ON notificaciones(fecha_vencimiento) WHERE estado = 'enviado' OR estado = 'leido';
CREATE INDEX IF NOT EXISTS idx_eventos_notificacion ON eventos(notificacion_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: empresas
-- ============================================
CREATE POLICY "Usuarios pueden ver su propia empresa"
  ON empresas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear su empresa"
  ON empresas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden actualizar su empresa"
  ON empresas FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================
-- POLÍTICAS: empleados
-- ============================================
CREATE POLICY "Usuarios pueden ver empleados de su empresa"
  ON empleados FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios pueden crear empleados en su empresa"
  ON empleados FOR INSERT
  WITH CHECK (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios pueden actualizar empleados de su empresa"
  ON empleados FOR UPDATE
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios pueden eliminar empleados de su empresa"
  ON empleados FOR DELETE
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- ============================================
-- POLÍTICAS: notificaciones
-- ============================================
CREATE POLICY "Usuarios pueden ver notificaciones de su empresa"
  ON notificaciones FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios pueden crear notificaciones en su empresa"
  ON notificaciones FOR INSERT
  WITH CHECK (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Usuarios pueden actualizar notificaciones de su empresa"
  ON notificaciones FOR UPDATE
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- Política pública para ver notificaciones por ID (empleados acceden via link)
CREATE POLICY "Cualquiera puede ver notificación por ID directo"
  ON notificaciones FOR SELECT
  USING (true);

-- ============================================
-- POLÍTICAS: eventos
-- ============================================
CREATE POLICY "Usuarios pueden ver eventos de sus notificaciones"
  ON eventos FOR SELECT
  USING (notificacion_id IN (
    SELECT id FROM notificaciones WHERE empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  ));

-- Política pública para insertar eventos (tracking de lectura)
CREATE POLICY "Cualquiera puede registrar eventos de lectura"
  ON eventos FOR INSERT
  WITH CHECK (true);

-- ============================================
-- FUNCIONES
-- ============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para empresas
CREATE TRIGGER update_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE (para PDFs)
-- ============================================
-- Ejecutar esto en la sección Storage > Policies de Supabase:
-- 1. Crear bucket "notificaciones" (privado)
-- 2. Agregar policy para que usuarios autenticados puedan subir a su carpeta
