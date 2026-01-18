-- ============================================
-- MIGRACIÓN: Firma Digital PKI
-- Fundamento Legal: Art. 288 Código Civil y Comercial
-- ============================================
-- La firma digital equivale a la firma ológrafa cuando cumple los requisitos legales

-- ============================================
-- MODIFICAR TABLA notificaciones
-- Agregar campos para firma digital
-- ============================================
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS firma_digital_aplicada BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS firma_digital_fecha TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS firma_digital_firmante VARCHAR(255),
ADD COLUMN IF NOT EXISTS firma_digital_algoritmo VARCHAR(20),
ADD COLUMN IF NOT EXISTS firma_digital_certificado_serial VARCHAR(100),
ADD COLUMN IF NOT EXISTS firma_digital_certificado_emisor VARCHAR(255),
ADD COLUMN IF NOT EXISTS firma_digital_base64 TEXT,  -- La firma en sí
ADD COLUMN IF NOT EXISTS firma_digital_metadata JSONB;

-- ============================================
-- TABLA: firmas_digitales
-- Historial de todas las firmas para auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS firmas_digitales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Documento firmado
  tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
    'sancion',
    'convenio',
    'descargo',
    'testigo',
    'acta'
  )),
  documento_id UUID NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,

  -- Hash del documento firmado
  hash_documento VARCHAR(64) NOT NULL,

  -- Datos del firmante
  firmante_nombre VARCHAR(255) NOT NULL,
  firmante_cuit VARCHAR(13),
  firmante_cargo VARCHAR(100),

  -- Firma
  algoritmo VARCHAR(20) NOT NULL DEFAULT 'RSA-SHA256',
  firma_base64 TEXT NOT NULL,

  -- Certificado
  certificado_serial VARCHAR(100),
  certificado_emisor VARCHAR(255),
  certificado_valido_desde TIMESTAMPTZ,
  certificado_valido_hasta TIMESTAMPTZ,
  certificado_tipo VARCHAR(30) CHECK (certificado_tipo IN (
    'desarrollo',      -- Certificado de desarrollo/testing
    'encode',          -- Certificado de Encode
    'afip',            -- Certificado AFIP
    'otro_reconocido'  -- Otro certificado reconocido
  )),

  -- Metadatos
  metadata JSONB DEFAULT '{}',

  -- Auditoría
  ip_firma INET,
  user_agent_firma TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Verificaciones posteriores
  ultima_verificacion_at TIMESTAMPTZ,
  verificacion_exitosa BOOLEAN
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notificaciones_firma ON notificaciones(firma_digital_aplicada);
CREATE INDEX IF NOT EXISTS idx_firmas_documento ON firmas_digitales(tipo_documento, documento_id);
CREATE INDEX IF NOT EXISTS idx_firmas_empresa ON firmas_digitales(empresa_id);
CREATE INDEX IF NOT EXISTS idx_firmas_hash ON firmas_digitales(hash_documento);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE firmas_digitales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas pueden ver sus firmas"
  ON firmas_digitales FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Sistema puede crear firmas"
  ON firmas_digitales FOR INSERT
  WITH CHECK (true);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE firmas_digitales IS
'Registro de firmas digitales PKI aplicadas a documentos.
Fundamento: Art. 288 CCyC establece equivalencia con firma ológrafa.';

COMMENT ON COLUMN firmas_digitales.certificado_tipo IS
'Tipo de certificado utilizado. Para máxima validez legal usar Encode o AFIP.';

COMMENT ON COLUMN notificaciones.firma_digital_base64 IS
'Firma RSA-SHA256 del hash del documento. Verificable con la clave pública del certificado.';
