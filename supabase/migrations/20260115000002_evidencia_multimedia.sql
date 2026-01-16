-- =====================================================
-- MIGRACIÓN: Sistema de Evidencia Multimedia
-- Fecha: 2026-01-15
-- Propósito: Crear tabla para almacenar fotos, videos y
--            documentos como prueba de incidentes laborales
--            con metadatos EXIF y hash de integridad
-- =====================================================

-- Tabla principal de evidencia multimedia
CREATE TABLE IF NOT EXISTS evidencia_incidentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculaciones
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  notificacion_id UUID REFERENCES notificaciones(id) ON DELETE SET NULL,

  -- Información del archivo
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('foto', 'video', 'audio', 'documento', 'screenshot')),
  nombre_archivo TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  tamano_bytes BIGINT NOT NULL,

  -- URLs en storage
  storage_path TEXT NOT NULL, -- Path en Supabase Storage
  url_publica TEXT, -- URL pública si se necesita
  thumbnail_path TEXT, -- Thumbnail para preview (fotos/videos)

  -- Hash de integridad
  hash_sha256 VARCHAR(64) NOT NULL,

  -- Metadatos EXIF (extraídos del archivo original)
  exif_fecha_captura TIMESTAMPTZ, -- Fecha/hora en que se tomó la foto/video
  exif_latitud DECIMAL(10, 8),
  exif_longitud DECIMAL(11, 8),
  exif_altitud DECIMAL(8, 2),
  exif_dispositivo TEXT, -- Make/Model del dispositivo
  exif_software TEXT, -- App usada para capturar
  exif_orientacion INTEGER,
  exif_raw JSONB, -- Todos los metadatos EXIF en crudo

  -- Descripción y contexto
  descripcion TEXT, -- Descripción de qué muestra la evidencia
  es_prueba_principal BOOLEAN DEFAULT false, -- Marcar las más importantes

  -- Orden de presentación
  orden INTEGER DEFAULT 0,

  -- Datos de subida
  subido_por_user_id UUID REFERENCES auth.users(id),
  subido_desde_ip INET,
  subido_desde_user_agent TEXT,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_evidencia_empresa ON evidencia_incidentes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_evidencia_notificacion ON evidencia_incidentes(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_evidencia_tipo ON evidencia_incidentes(tipo);
CREATE INDEX IF NOT EXISTS idx_evidencia_hash ON evidencia_incidentes(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_evidencia_fecha_captura ON evidencia_incidentes(exif_fecha_captura);
CREATE INDEX IF NOT EXISTS idx_evidencia_geolocalizacion ON evidencia_incidentes(exif_latitud, exif_longitud)
  WHERE exif_latitud IS NOT NULL AND exif_longitud IS NOT NULL;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_evidencia_incidentes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_evidencia_incidentes_updated_at
  BEFORE UPDATE ON evidencia_incidentes
  FOR EACH ROW
  EXECUTE FUNCTION update_evidencia_incidentes_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE evidencia_incidentes ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver evidencia de sus empresas
CREATE POLICY "usuarios_pueden_ver_evidencia_de_su_empresa"
  ON evidencia_incidentes
  FOR SELECT
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios solo pueden insertar evidencia en sus empresas
CREATE POLICY "usuarios_pueden_crear_evidencia_en_su_empresa"
  ON evidencia_incidentes
  FOR INSERT
  WITH CHECK (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios solo pueden actualizar evidencia de sus empresas
CREATE POLICY "usuarios_pueden_actualizar_evidencia_de_su_empresa"
  ON evidencia_incidentes
  FOR UPDATE
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- Política: Los usuarios solo pueden eliminar evidencia de sus empresas
CREATE POLICY "usuarios_pueden_eliminar_evidencia_de_su_empresa"
  ON evidencia_incidentes
  FOR DELETE
  USING (
    empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- STORAGE BUCKET (ejecutar en Supabase Dashboard o CLI)
-- =====================================================
-- Nota: La creación del bucket se debe hacer via Supabase CLI o Dashboard
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('evidencia', 'evidencia', false);

-- =====================================================
-- COMENTARIOS PARA DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE evidencia_incidentes IS 'Almacena evidencia multimedia (fotos, videos, documentos) asociada a incidentes laborales';
COMMENT ON COLUMN evidencia_incidentes.hash_sha256 IS 'Hash SHA-256 del archivo original para verificar integridad';
COMMENT ON COLUMN evidencia_incidentes.exif_fecha_captura IS 'Fecha/hora extraída de metadatos EXIF - prueba de cuándo se tomó';
COMMENT ON COLUMN evidencia_incidentes.exif_latitud IS 'Latitud extraída de EXIF - prueba de dónde se tomó';
COMMENT ON COLUMN evidencia_incidentes.exif_longitud IS 'Longitud extraída de EXIF - prueba de dónde se tomó';
COMMENT ON COLUMN evidencia_incidentes.exif_raw IS 'Metadatos EXIF completos en formato JSON para análisis forense';
