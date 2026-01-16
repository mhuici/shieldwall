-- =====================================================
-- MIGRACIÓN: Sistema de Testigos Digitales
-- Fecha: 2026-01-15
-- Propósito: Crear tabla para declaraciones de testigos
--            que puedan ser firmadas digitalmente en tiempo real
-- =====================================================

-- Tabla principal de declaraciones de testigos
CREATE TABLE IF NOT EXISTS declaraciones_testigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Vinculaciones
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  notificacion_id UUID REFERENCES notificaciones(id) ON DELETE SET NULL,

  -- Datos del testigo
  nombre_completo TEXT NOT NULL,
  cargo TEXT,
  cuil VARCHAR(13),
  email VARCHAR(255),
  telefono VARCHAR(20),

  -- Relación con la empresa
  relacion VARCHAR(30) DEFAULT 'empleado' CHECK (relacion IN ('empleado', 'supervisor', 'cliente', 'proveedor', 'otro')),

  -- Sobre el hecho
  presente_en_hecho BOOLEAN NOT NULL DEFAULT true,
  descripcion_testigo TEXT, -- Lo que vio/escuchó (lo completa el testigo)

  -- Token de acceso para página pública
  token_acceso UUID UNIQUE DEFAULT gen_random_uuid(),
  token_expira_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),

  -- Validación de identidad (cuando el testigo accede al link)
  validado BOOLEAN DEFAULT false,
  validacion_timestamp TIMESTAMPTZ,
  validacion_ip INET,
  validacion_user_agent TEXT,

  -- Declaración jurada
  declara_bajo_juramento BOOLEAN DEFAULT false,
  juramento_timestamp TIMESTAMPTZ,
  juramento_ip INET,
  juramento_user_agent TEXT,

  -- Firma digital (hash del contenido de la declaración)
  hash_declaracion VARCHAR(64),

  -- Estado del testigo
  estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'invitado', 'validado', 'firmado', 'rechazado', 'expirado')),

  -- Envío de invitación
  invitacion_enviada_at TIMESTAMPTZ,
  invitacion_canal VARCHAR(20) CHECK (invitacion_canal IN ('email', 'whatsapp', 'sms')),
  invitacion_message_id VARCHAR(100), -- ID del mensaje en SendGrid/Twilio
  recordatorios_enviados INTEGER DEFAULT 0,
  ultimo_recordatorio_at TIMESTAMPTZ,

  -- Metadatos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_declaraciones_empresa ON declaraciones_testigos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_notificacion ON declaraciones_testigos(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_declaraciones_token ON declaraciones_testigos(token_acceso);
CREATE INDEX IF NOT EXISTS idx_declaraciones_estado ON declaraciones_testigos(estado);
CREATE INDEX IF NOT EXISTS idx_declaraciones_email ON declaraciones_testigos(email);
CREATE INDEX IF NOT EXISTS idx_declaraciones_pendientes ON declaraciones_testigos(estado, token_expira_at)
  WHERE estado IN ('pendiente', 'invitado');

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_declaraciones_testigos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_declaraciones_testigos_updated_at ON declaraciones_testigos;
CREATE TRIGGER trigger_declaraciones_testigos_updated_at
  BEFORE UPDATE ON declaraciones_testigos
  FOR EACH ROW
  EXECUTE FUNCTION update_declaraciones_testigos_updated_at();

-- Trigger para marcar tokens expirados
CREATE OR REPLACE FUNCTION marcar_testigos_expirados()
RETURNS INTEGER AS $$
DECLARE
  cantidad INTEGER;
BEGIN
  UPDATE declaraciones_testigos
  SET estado = 'expirado'
  WHERE estado IN ('pendiente', 'invitado', 'validado')
    AND token_expira_at < now();

  GET DIAGNOSTICS cantidad = ROW_COUNT;
  RETURN cantidad;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE declaraciones_testigos ENABLE ROW LEVEL SECURITY;

-- Política: Empleador ve testigos de su empresa
CREATE POLICY "Empleador ve testigos de su empresa" ON declaraciones_testigos
  FOR SELECT USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- Política: Empleador puede crear testigos de su empresa
CREATE POLICY "Empleador crea testigos" ON declaraciones_testigos
  FOR INSERT WITH CHECK (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- Política: Empleador puede actualizar testigos de su empresa
CREATE POLICY "Empleador actualiza testigos" ON declaraciones_testigos
  FOR UPDATE USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
  );

-- Política: Empleador puede eliminar testigos pendientes de su empresa
CREATE POLICY "Empleador elimina testigos pendientes" ON declaraciones_testigos
  FOR DELETE USING (
    empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
    AND estado = 'pendiente'
  );

-- =====================================================
-- POLÍTICAS PÚBLICAS (para el testigo accediendo por token)
-- =====================================================

-- Política: Acceso público de lectura por token (para el testigo)
CREATE POLICY "Testigo accede por token" ON declaraciones_testigos
  FOR SELECT USING (
    token_acceso IS NOT NULL
    AND estado != 'expirado'
    AND token_expira_at > now()
  );

-- Política: Testigo puede actualizar su declaración (solo campos específicos)
-- Nota: Esta política permite UPDATE pero la lógica de negocio en el backend
-- debe validar que solo se actualicen los campos permitidos
CREATE POLICY "Testigo actualiza su declaracion" ON declaraciones_testigos
  FOR UPDATE USING (
    token_acceso IS NOT NULL
    AND estado IN ('invitado', 'validado')
    AND token_expira_at > now()
  );

-- =====================================================
-- TABLA DE EVENTOS DE TESTIGOS (Auditoría)
-- =====================================================

CREATE TABLE IF NOT EXISTS eventos_testigos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaracion_id UUID NOT NULL REFERENCES declaraciones_testigos(id) ON DELETE CASCADE,

  tipo VARCHAR(50) NOT NULL CHECK (tipo IN (
    'creado',
    'invitacion_enviada',
    'invitacion_fallida',
    'recordatorio_enviado',
    'link_abierto',
    'validacion_exitosa',
    'validacion_fallida',
    'declaracion_completada',
    'declaracion_firmada',
    'declaracion_rechazada',
    'token_expirado'
  )),

  metadata JSONB DEFAULT '{}',
  ip INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_testigos_declaracion ON eventos_testigos(declaracion_id);
CREATE INDEX IF NOT EXISTS idx_eventos_testigos_tipo ON eventos_testigos(tipo);
CREATE INDEX IF NOT EXISTS idx_eventos_testigos_fecha ON eventos_testigos(created_at);

-- RLS para eventos de testigos
ALTER TABLE eventos_testigos ENABLE ROW LEVEL SECURITY;

-- Empleador ve eventos de testigos de su empresa
CREATE POLICY "Empleador ve eventos de testigos" ON eventos_testigos
  FOR SELECT USING (
    declaracion_id IN (
      SELECT id FROM declaraciones_testigos
      WHERE empresa_id IN (SELECT id FROM empresas WHERE user_id = auth.uid())
    )
  );

-- Inserción pública (para tracking)
CREATE POLICY "Insert público eventos testigos" ON eventos_testigos
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FUNCIONES AUXILIARES
-- =====================================================

-- Función para obtener testigos pendientes de invitación
CREATE OR REPLACE FUNCTION obtener_testigos_pendientes_invitacion(p_empresa_id UUID)
RETURNS TABLE (
  id UUID,
  nombre_completo TEXT,
  email VARCHAR(255),
  telefono VARCHAR(20),
  notificacion_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.id,
    dt.nombre_completo,
    dt.email,
    dt.telefono,
    dt.notificacion_id,
    dt.created_at
  FROM declaraciones_testigos dt
  WHERE dt.empresa_id = p_empresa_id
    AND dt.estado = 'pendiente'
    AND (dt.email IS NOT NULL OR dt.telefono IS NOT NULL)
  ORDER BY dt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener testigos que necesitan recordatorio (24hs sin responder)
CREATE OR REPLACE FUNCTION obtener_testigos_necesitan_recordatorio()
RETURNS TABLE (
  id UUID,
  nombre_completo TEXT,
  email VARCHAR(255),
  telefono VARCHAR(20),
  empresa_id UUID,
  invitacion_enviada_at TIMESTAMPTZ,
  recordatorios_enviados INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dt.id,
    dt.nombre_completo,
    dt.email,
    dt.telefono,
    dt.empresa_id,
    dt.invitacion_enviada_at,
    dt.recordatorios_enviados
  FROM declaraciones_testigos dt
  WHERE dt.estado = 'invitado'
    AND dt.invitacion_enviada_at < now() - interval '24 hours'
    AND dt.recordatorios_enviados < 3
    AND (dt.ultimo_recordatorio_at IS NULL OR dt.ultimo_recordatorio_at < now() - interval '24 hours')
    AND dt.token_expira_at > now()
  ORDER BY dt.invitacion_enviada_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para generar hash de declaración
CREATE OR REPLACE FUNCTION generar_hash_declaracion(
  p_nombre TEXT,
  p_descripcion TEXT,
  p_timestamp TIMESTAMPTZ,
  p_ip INET
) RETURNS VARCHAR(64) AS $$
DECLARE
  contenido TEXT;
BEGIN
  contenido := p_nombre || '|' || COALESCE(p_descripcion, '') || '|' || p_timestamp::TEXT || '|' || COALESCE(p_ip::TEXT, '');
  RETURN encode(sha256(contenido::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE declaraciones_testigos IS 'Declaraciones de testigos para sanciones laborales. Cada testigo recibe un link único para completar su declaración bajo juramento.';

COMMENT ON COLUMN declaraciones_testigos.token_acceso IS 'Token UUID único para acceso público del testigo. Expira en 7 días por defecto.';
COMMENT ON COLUMN declaraciones_testigos.hash_declaracion IS 'Hash SHA-256 del contenido de la declaración para verificar integridad.';
COMMENT ON COLUMN declaraciones_testigos.estado IS 'Estado del testigo: pendiente (sin invitar), invitado (email enviado), validado (accedió al link), firmado (completó declaración), rechazado, expirado.';
COMMENT ON COLUMN declaraciones_testigos.declara_bajo_juramento IS 'True si el testigo aceptó el checkbox de declaración jurada (Art. 275 CP).';

COMMENT ON TABLE eventos_testigos IS 'Auditoría de todas las acciones relacionadas con testigos para cadena de custodia.';
