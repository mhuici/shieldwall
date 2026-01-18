-- ============================================
-- Migración: TSA RFC 3161 (Sellado de Tiempo)
-- Fecha: 2026-01-21
-- Fundamento Legal: Acordada N° 3/2015 CSJN, Ley 25.506
-- ============================================
-- Agrega soporte para sellado de tiempo RFC 3161 además de OpenTimestamps

-- ============================================
-- 1. CAMPOS ADICIONALES EN NOTIFICACIONES
-- ============================================

ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS tsa_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tsa_token_base64 TEXT,
ADD COLUMN IF NOT EXISTS tsa_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tsa_estado VARCHAR(20) DEFAULT 'no_creado' CHECK (tsa_estado IN (
  'no_creado',
  'sellado',
  'verificado',
  'fallido'
)),
ADD COLUMN IF NOT EXISTS tsa_metadata JSONB;

-- ============================================
-- 2. CAMPOS ADICIONALES EN timestamps_blockchain
-- ============================================

ALTER TABLE timestamps_blockchain
ADD COLUMN IF NOT EXISTS tsa_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS tsa_token_base64 TEXT,
ADD COLUMN IF NOT EXISTS tsa_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS tsa_estado VARCHAR(20) DEFAULT 'no_creado',
ADD COLUMN IF NOT EXISTS dual_timestamp BOOLEAN DEFAULT false;

-- ============================================
-- 3. TABLA: sellos_tsa
-- Historial de sellos TSA RFC 3161
-- ============================================

CREATE TABLE IF NOT EXISTS sellos_tsa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Documento sellado
  tipo_documento VARCHAR(30) NOT NULL CHECK (tipo_documento IN (
    'notificacion',
    'convenio',
    'testigo',
    'descargo',
    'evidencia',
    'bitacora',
    'firma'
  )),
  documento_id UUID NOT NULL,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,

  -- Hash sellado
  hash_sha256 VARCHAR(64) NOT NULL,

  -- Datos TSA
  tsa_url VARCHAR(255) NOT NULL,
  tsa_nombre VARCHAR(100),
  token_base64 TEXT NOT NULL,
  policy_oid VARCHAR(100),

  -- Verificación
  verificado_at TIMESTAMPTZ,
  verificacion_exitosa BOOLEAN,

  -- Error
  error_mensaje TEXT
);

-- ============================================
-- 4. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notificaciones_tsa ON notificaciones(tsa_estado);
CREATE INDEX IF NOT EXISTS idx_sellos_tsa_documento ON sellos_tsa(tipo_documento, documento_id);
CREATE INDEX IF NOT EXISTS idx_sellos_tsa_hash ON sellos_tsa(hash_sha256);
CREATE INDEX IF NOT EXISTS idx_sellos_tsa_empresa ON sellos_tsa(empresa_id);

-- ============================================
-- 5. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE sellos_tsa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas pueden ver sus sellos TSA"
  ON sellos_tsa FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

CREATE POLICY "Sistema puede crear sellos TSA"
  ON sellos_tsa FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. FUNCIÓN: crear_sello_dual
-- Crea sello TSA + OpenTimestamps en una transacción
-- ============================================

CREATE OR REPLACE FUNCTION registrar_sello_timestamp(
  p_tipo_documento VARCHAR(30),
  p_documento_id UUID,
  p_empresa_id UUID,
  p_hash VARCHAR(64),
  p_tsa_url VARCHAR(255),
  p_tsa_token TEXT,
  p_ots_file TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Insertar en timestamps_blockchain con datos duales
  INSERT INTO timestamps_blockchain (
    tipo_documento,
    documento_id,
    empresa_id,
    hash_sha256,
    ots_file_base64,
    estado,
    tsa_timestamp,
    tsa_token_base64,
    tsa_url,
    tsa_estado,
    dual_timestamp
  ) VALUES (
    p_tipo_documento,
    p_documento_id,
    p_empresa_id,
    p_hash,
    p_ots_file,
    CASE WHEN p_ots_file IS NOT NULL THEN 'pendiente' ELSE 'no_creado' END,
    NOW(),
    p_tsa_token,
    p_tsa_url,
    CASE WHEN p_tsa_token IS NOT NULL THEN 'sellado' ELSE 'fallido' END,
    p_ots_file IS NOT NULL AND p_tsa_token IS NOT NULL
  )
  RETURNING id INTO v_id;

  -- Insertar en sellos_tsa para historial
  IF p_tsa_token IS NOT NULL THEN
    INSERT INTO sellos_tsa (
      tipo_documento,
      documento_id,
      empresa_id,
      hash_sha256,
      tsa_url,
      token_base64
    ) VALUES (
      p_tipo_documento,
      p_documento_id,
      p_empresa_id,
      p_hash,
      p_tsa_url,
      p_tsa_token
    );
  END IF;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. COMENTARIOS
-- ============================================

COMMENT ON TABLE sellos_tsa IS
'Registro de sellos de tiempo RFC 3161. Proporciona fecha cierta inmediata
de una autoridad reconocida, complementando el timestamp en blockchain.';

COMMENT ON COLUMN notificaciones.tsa_token_base64 IS
'Token TSA RFC 3161 que puede verificarse independientemente con cualquier
herramienta compatible. Proporciona fecha cierta inmediata.';

COMMENT ON COLUMN timestamps_blockchain.dual_timestamp IS
'Indica si el documento tiene tanto sello TSA (inmediato) como timestamp
en blockchain (confirmación posterior). Máxima robustez legal.';

COMMENT ON FUNCTION registrar_sello_timestamp IS
'Registra un sello de tiempo dual (TSA + blockchain) para un documento.
El TSA proporciona fecha cierta inmediata, el blockchain confirma después.';
