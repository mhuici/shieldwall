-- ============================================
-- MIGRACIÓN: Convenio de Domicilio Electrónico (Fase 0)
-- Fundamento Legal: Acordada N° 31/2011 CSJN
-- ============================================
-- Este convenio es OBLIGATORIO antes de cualquier notificación digital.
-- Sin él, las notificaciones electrónicas carecen de valor probatorio.
-- ============================================

-- ============================================
-- TABLA: convenios_domicilio
-- Almacena los convenios firmados por empleados
-- ============================================
CREATE TABLE IF NOT EXISTS convenios_domicilio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE NOT NULL,
  empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE NOT NULL,

  -- Versión del convenio (para trazabilidad de cambios)
  version_convenio VARCHAR(10) DEFAULT '1.0' NOT NULL,

  -- Estado del convenio
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
    'pendiente',       -- Enviado pero no firmado
    'firmado_digital', -- Firmado digitalmente (checkbox + OTP)
    'firmado_papel',   -- Firmado en papel y escaneado
    'revocado'         -- Revocado por el empleado o empresa
  )) NOT NULL,

  -- Datos del convenio
  email_constituido VARCHAR(255) NOT NULL,  -- Email donde acepta recibir notificaciones
  telefono_constituido VARCHAR(20),          -- Teléfono para SMS/WhatsApp
  acepta_notificaciones_digitales BOOLEAN DEFAULT false,
  acepta_biometricos BOOLEAN DEFAULT false,  -- Consentimiento Ley 25.326

  -- Firma digital (cuando aplica)
  firma_checkbox_at TIMESTAMPTZ,             -- Cuándo marcó el checkbox
  firma_otp_verificado BOOLEAN DEFAULT false,
  firma_otp_codigo_hash VARCHAR(64),         -- Hash del código OTP usado
  firma_otp_at TIMESTAMPTZ,
  firma_ip INET,
  firma_user_agent TEXT,
  firma_dispositivo JSONB,                   -- Device fingerprint

  -- Firma en papel (cuando aplica)
  pdf_convenio_url TEXT,                     -- URL del PDF firmado escaneado
  pdf_convenio_hash VARCHAR(64),             -- SHA-256 del PDF
  fecha_firma_papel DATE,

  -- Hash del convenio completo para integridad
  hash_convenio VARCHAR(64),                 -- SHA-256 de todos los datos

  -- Token único para el enlace de firma
  token_firma UUID DEFAULT gen_random_uuid() UNIQUE,
  token_expira_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),

  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  firmado_at TIMESTAMPTZ,                    -- Fecha efectiva de firma
  revocado_at TIMESTAMPTZ,
  motivo_revocacion TEXT,

  -- Un empleado solo puede tener un convenio activo por empresa
  CONSTRAINT unique_convenio_activo UNIQUE (empleado_id, empresa_id)
);

-- ============================================
-- TABLA: logs_convenio
-- Auditoría de todas las acciones sobre convenios
-- ============================================
CREATE TABLE IF NOT EXISTS logs_convenio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convenio_id UUID REFERENCES convenios_domicilio(id) ON DELETE CASCADE NOT NULL,

  accion VARCHAR(50) NOT NULL CHECK (accion IN (
    'creado',
    'enviado_email',
    'link_abierto',
    'checkbox_aceptado',
    'otp_enviado',
    'otp_validado',
    'otp_fallido',
    'firmado_digital',
    'pdf_subido',
    'firmado_papel',
    'revocado',
    'reenvio_solicitado'
  )),

  -- Metadata de la acción
  ip INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: codigos_otp_convenio
-- Códigos OTP temporales para firma
-- ============================================
CREATE TABLE IF NOT EXISTS codigos_otp_convenio (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  convenio_id UUID REFERENCES convenios_domicilio(id) ON DELETE CASCADE NOT NULL,

  codigo_hash VARCHAR(64) NOT NULL,          -- SHA-256 del código
  canal VARCHAR(10) CHECK (canal IN ('sms', 'whatsapp', 'email')) NOT NULL,
  telefono_enviado VARCHAR(20),
  email_enviado VARCHAR(255),

  intentos INTEGER DEFAULT 0,
  max_intentos INTEGER DEFAULT 3,

  usado BOOLEAN DEFAULT false,
  usado_at TIMESTAMPTZ,

  expira_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MODIFICAR TABLA empleados
-- Agregar campos para convenio
-- ============================================
ALTER TABLE empleados
ADD COLUMN IF NOT EXISTS convenio_firmado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS convenio_id UUID REFERENCES convenios_domicilio(id),
ADD COLUMN IF NOT EXISTS fecha_convenio TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notificacion_solo_fisica BOOLEAN DEFAULT false;  -- Si true, no recibe digital

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_convenios_empresa ON convenios_domicilio(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convenios_empleado ON convenios_domicilio(empleado_id);
CREATE INDEX IF NOT EXISTS idx_convenios_estado ON convenios_domicilio(estado);
CREATE INDEX IF NOT EXISTS idx_convenios_token ON convenios_domicilio(token_firma);
CREATE INDEX IF NOT EXISTS idx_logs_convenio_convenio ON logs_convenio(convenio_id);
CREATE INDEX IF NOT EXISTS idx_otp_convenio_convenio ON codigos_otp_convenio(convenio_id);
CREATE INDEX IF NOT EXISTS idx_empleados_convenio ON empleados(convenio_firmado);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE convenios_domicilio ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_convenio ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_otp_convenio ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS: convenios_domicilio
-- ============================================
-- Empresas pueden ver convenios de sus empleados
CREATE POLICY "Empresas pueden ver convenios de sus empleados"
  ON convenios_domicilio FOR SELECT
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- Empresas pueden crear convenios para sus empleados
CREATE POLICY "Empresas pueden crear convenios"
  ON convenios_domicilio FOR INSERT
  WITH CHECK (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- Empresas pueden actualizar convenios
CREATE POLICY "Empresas pueden actualizar convenios"
  ON convenios_domicilio FOR UPDATE
  USING (empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid()));

-- Acceso público por token (para que empleados firmen)
CREATE POLICY "Acceso público por token para firma"
  ON convenios_domicilio FOR SELECT
  USING (true);  -- El filtro por token se hace en la app

CREATE POLICY "Actualización pública por token"
  ON convenios_domicilio FOR UPDATE
  USING (true);  -- El filtro por token se hace en la app

-- ============================================
-- POLÍTICAS: logs_convenio
-- ============================================
CREATE POLICY "Empresas pueden ver logs de sus convenios"
  ON logs_convenio FOR SELECT
  USING (convenio_id IN (
    SELECT id FROM convenios_domicilio WHERE empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Inserción pública de logs"
  ON logs_convenio FOR INSERT
  WITH CHECK (true);

-- ============================================
-- POLÍTICAS: codigos_otp_convenio
-- ============================================
CREATE POLICY "Acceso a OTP por convenio"
  ON codigos_otp_convenio FOR ALL
  USING (true);

-- ============================================
-- TRIGGER para actualizar updated_at
-- ============================================
CREATE TRIGGER update_convenios_updated_at
  BEFORE UPDATE ON convenios_domicilio
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGER para actualizar empleado cuando se firma convenio
-- ============================================
CREATE OR REPLACE FUNCTION sync_empleado_convenio()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('firmado_digital', 'firmado_papel') AND OLD.estado = 'pendiente' THEN
    UPDATE empleados
    SET
      convenio_firmado = true,
      convenio_id = NEW.id,
      fecha_convenio = COALESCE(NEW.firmado_at, NOW())
    WHERE id = NEW.empleado_id;
  ELSIF NEW.estado = 'revocado' AND OLD.estado IN ('firmado_digital', 'firmado_papel') THEN
    UPDATE empleados
    SET
      convenio_firmado = false,
      convenio_id = NULL,
      fecha_convenio = NULL
    WHERE id = NEW.empleado_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_empleado_convenio_trigger
  AFTER UPDATE ON convenios_domicilio
  FOR EACH ROW
  EXECUTE FUNCTION sync_empleado_convenio();

-- ============================================
-- FUNCIÓN: Verificar si empleado puede recibir notificación digital
-- ============================================
CREATE OR REPLACE FUNCTION puede_notificar_digital(p_empleado_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_convenio_firmado BOOLEAN;
  v_solo_fisica BOOLEAN;
BEGIN
  SELECT convenio_firmado, notificacion_solo_fisica
  INTO v_convenio_firmado, v_solo_fisica
  FROM empleados
  WHERE id = p_empleado_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Solo puede recibir digital si tiene convenio firmado Y no está marcado como solo física
  RETURN v_convenio_firmado AND NOT COALESCE(v_solo_fisica, false);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMENTARIOS (Documentación)
-- ============================================
COMMENT ON TABLE convenios_domicilio IS
'Convenios de Domicilio Electrónico según Acordada N° 31/2011 CSJN.
OBLIGATORIO antes de cualquier notificación digital.';

COMMENT ON COLUMN convenios_domicilio.email_constituido IS
'Email donde el empleado acepta recibir notificaciones electrónicas (domicilio electrónico constituido)';

COMMENT ON COLUMN convenios_domicilio.acepta_biometricos IS
'Consentimiento expreso para datos biométricos según Ley 25.326';

COMMENT ON COLUMN empleados.notificacion_solo_fisica IS
'Si true, el empleado solo acepta notificaciones físicas (carta documento)';
