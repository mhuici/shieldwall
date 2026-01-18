-- ============================================
-- MIGRACIÓN: OpenTimestamps (Blockchain)
-- Fundamento Legal: Acordada N° 3/2015 CSJN
-- ============================================
-- Permite anclar hashes en blockchain de Bitcoin para fecha cierta irrefutable

-- ============================================
-- MODIFICAR TABLA notificaciones
-- Agregar campos para OpenTimestamps
-- ============================================
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS ots_timestamp_pendiente TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ots_timestamp_confirmado TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ots_bitcoin_block_height INTEGER,
ADD COLUMN IF NOT EXISTS ots_bitcoin_block_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS ots_file_base64 TEXT,  -- Archivo .ots para verificación
ADD COLUMN IF NOT EXISTS ots_estado VARCHAR(20) DEFAULT 'no_creado' CHECK (ots_estado IN (
  'no_creado',
  'pendiente',       -- Enviado a OpenTimestamps, esperando confirmación en blockchain
  'confirmado',      -- Confirmado en blockchain de Bitcoin
  'fallido'          -- Error al crear timestamp
)),
ADD COLUMN IF NOT EXISTS ots_metadata JSONB;    -- Metadatos adicionales del timestamp

-- ============================================
-- TABLA: timestamps_blockchain
-- Historial completo de timestamps para auditoría
-- ============================================
CREATE TABLE IF NOT EXISTS timestamps_blockchain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Puede ser de cualquier tipo de documento
  tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
    'notificacion',
    'convenio',
    'testigo',
    'descargo',
    'evidencia',
    'bitacora'
  )),
  documento_id UUID NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,

  -- Hash del documento
  hash_sha256 VARCHAR(64) NOT NULL,

  -- Datos OpenTimestamps
  ots_file_base64 TEXT,

  -- Estado y confirmación
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',
    'confirmado',
    'fallido'
  )),

  -- Bitcoin attestation (cuando se confirma)
  bitcoin_block_height INTEGER,
  bitcoin_block_hash VARCHAR(64),
  bitcoin_block_time TIMESTAMPTZ,

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  confirmado_at TIMESTAMPTZ,
  verificado_at TIMESTAMPTZ,

  -- Errores
  error_mensaje TEXT,
  intentos_verificacion INTEGER DEFAULT 0
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notificaciones_ots ON notificaciones(ots_estado);
CREATE INDEX IF NOT EXISTS idx_timestamps_estado ON timestamps_blockchain(estado);
CREATE INDEX IF NOT EXISTS idx_timestamps_documento ON timestamps_blockchain(tipo_documento, documento_id);
CREATE INDEX IF NOT EXISTS idx_timestamps_hash ON timestamps_blockchain(hash_sha256);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE timestamps_blockchain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas pueden ver sus timestamps"
  ON timestamps_blockchain FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Sistema puede crear timestamps"
  ON timestamps_blockchain FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Sistema puede actualizar timestamps"
  ON timestamps_blockchain FOR UPDATE
  USING (true);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE timestamps_blockchain IS
'Registro de todos los timestamps anclados en blockchain Bitcoin via OpenTimestamps.
Fundamento: Acordada N° 3/2015 CSJN (fecha cierta en sistemas informáticos)';

COMMENT ON COLUMN notificaciones.ots_file_base64 IS
'Archivo .ots de OpenTimestamps en base64. Este archivo es necesario para verificar
el timestamp independientemente. Incluir en exportación para peritos.';

COMMENT ON COLUMN timestamps_blockchain.ots_file_base64 IS
'Archivo .ots que permite verificar el timestamp de forma independiente usando
el cliente oficial de OpenTimestamps o servicios de verificación en línea.';
