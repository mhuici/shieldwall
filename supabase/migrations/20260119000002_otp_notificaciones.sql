-- ============================================
-- MIGRACIÓN: OTP para Validación de Identidad en Notificaciones
-- Fortalece el gatekeeper con verificación de dos factores
-- ============================================

-- ============================================
-- TABLA: codigos_otp_notificacion
-- Códigos OTP temporales para validación de identidad
-- ============================================
CREATE TABLE IF NOT EXISTS codigos_otp_notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notificacion_id UUID REFERENCES notificaciones(id) ON DELETE CASCADE NOT NULL,
  empleado_id UUID REFERENCES empleados(id) ON DELETE CASCADE NOT NULL,

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
-- MODIFICAR TABLA notificaciones
-- Agregar campos para OTP
-- ============================================
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS otp_enviado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_enviado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_canal VARCHAR(10),
ADD COLUMN IF NOT EXISTS otp_validado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS otp_validado_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS otp_intentos INTEGER DEFAULT 0;

-- ============================================
-- MODIFICAR TABLA notificaciones
-- Agregar campos para Selfie
-- ============================================
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS selfie_url TEXT,
ADD COLUMN IF NOT EXISTS selfie_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS selfie_capturada_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS selfie_ip INET,
ADD COLUMN IF NOT EXISTS selfie_user_agent TEXT,
ADD COLUMN IF NOT EXISTS selfie_metadata JSONB;  -- Device info, dimensiones, etc.

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_otp_notificacion_notif ON codigos_otp_notificacion(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_otp_notificacion_empleado ON codigos_otp_notificacion(empleado_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_otp ON notificaciones(otp_validado);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE codigos_otp_notificacion ENABLE ROW LEVEL SECURITY;

-- Acceso público para validación
CREATE POLICY "Acceso público a OTP de notificación"
  ON codigos_otp_notificacion FOR ALL
  USING (true);

-- ============================================
-- COMENTARIOS
-- ============================================
COMMENT ON TABLE codigos_otp_notificacion IS
'Códigos OTP para validación de identidad en notificaciones.
Fortalece la prueba de que el empleado realmente accedió al documento.';

COMMENT ON COLUMN notificaciones.selfie_url IS
'URL de la selfie capturada durante la confirmación de lectura.
Prueba adicional de identidad según Acordada 31/2011.';
