-- ============================================
-- MIGRACIÓN: Gatekeeper + Nuevos Estados + Flujo 72hs
-- Fecha: 2026-01-14
-- Descripción: Implementa el sistema de validación de identidad (Gatekeeper),
--              checkbox de declaración jurada, y gestión de notificaciones físicas.
-- ============================================

-- ============================================
-- 1. AGREGAR NUEVOS CAMPOS A TABLA NOTIFICACIONES
-- ============================================

-- Campo legajo en empleados (si no existe)
ALTER TABLE empleados ADD COLUMN IF NOT EXISTS legajo VARCHAR(50);

-- Validación de identidad (Gatekeeper)
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS identidad_validada_at TIMESTAMPTZ;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS identidad_cuil_ingresado VARCHAR(13);
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS identidad_ip INET;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS identidad_user_agent TEXT;

-- Confirmación de lectura con checkbox
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS lectura_confirmada_at TIMESTAMPTZ;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS lectura_checkbox_aceptado BOOLEAN DEFAULT false;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS lectura_ip INET;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS lectura_user_agent TEXT;

-- Fallback físico (72hs sin confirmación)
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_alerta_72hs TIMESTAMPTZ;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS alertas_enviadas_empleador INTEGER DEFAULT 0;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS pdf_fisico_generado BOOLEAN DEFAULT false;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_pdf_fisico TIMESTAMPTZ;

-- Envío físico
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS enviado_fisico BOOLEAN DEFAULT false;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS metodo_envio_fisico VARCHAR(30);
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_envio_fisico TIMESTAMPTZ;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS numero_tracking_fisico VARCHAR(50);
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS fecha_acuse_recibo TIMESTAMPTZ;

-- WhatsApp
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS whatsapp_enviado_at TIMESTAMPTZ;
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS whatsapp_message_sid VARCHAR(100);

-- ============================================
-- 2. ACTUALIZAR CONSTRAINT DE ESTADO
-- ============================================

-- Primero eliminar el constraint existente si existe
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_estado_check;

-- Crear nuevo constraint con todos los estados
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_estado_check
  CHECK (estado IN (
    'borrador',           -- Sanción creada pero no enviada
    'enviado',            -- Email/WhatsApp enviado, esperando que abra
    'validado',           -- Empleado ingresó CUIL, pero NO confirmó checkbox
    'notificado',         -- Empleado confirmó con checkbox (antes "leido")
    'pendiente_fisico',   -- 72hs sin confirmación, requiere acción empleador
    'enviado_fisico',     -- Se generó/envió carta documento
    'por_vencer',         -- Faltan menos de 5 días para vencimiento
    'firme',              -- 30 días sin impugnación
    'impugnado',          -- Empleado impugnó dentro del plazo
    'leido'               -- DEPRECATED: mantener por compatibilidad
  ));

-- Actualizar constraint de método de envío físico
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_metodo_envio_fisico_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_metodo_envio_fisico_check
  CHECK (metodo_envio_fisico IS NULL OR metodo_envio_fisico IN (
    'carta_documento',
    'correo_certificado',
    'entrega_mano'
  ));

-- ============================================
-- 3. CREAR ÍNDICES PARA OPTIMIZACIÓN
-- ============================================

-- Índice para buscar notificaciones por estado (para cron jobs)
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado_email_enviado
  ON notificaciones(estado, email_enviado_at);

-- Índice para buscar notificaciones pendientes de confirmación
CREATE INDEX IF NOT EXISTS idx_notificaciones_pendiente_confirmacion
  ON notificaciones(estado, email_enviado_at, lectura_confirmada_at)
  WHERE lectura_confirmada_at IS NULL;

-- Índice para buscar por alertas enviadas
CREATE INDEX IF NOT EXISTS idx_notificaciones_alertas_empleador
  ON notificaciones(alertas_enviadas_empleador)
  WHERE alertas_enviadas_empleador > 0;

-- Índice para el token de acceso (ya debería existir pero por si acaso)
CREATE INDEX IF NOT EXISTS idx_notificaciones_token_acceso
  ON notificaciones(token_acceso);

-- ============================================
-- 4. ACTUALIZAR SEMÁFORO EXISTENTE
-- ============================================

-- Actualizar constraint de semáforo si existe
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_semaforo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_semaforo_check
  CHECK (semaforo IS NULL OR semaforo IN (
    'pendiente',
    'enviado',
    'validado',
    'abierto',           -- Legacy, mantener por compatibilidad
    'leido',
    'alerta',
    'pendiente_fisico',
    'enviado_fisico',
    'por_vencer',
    'firme'
  ));

-- ============================================
-- 5. MIGRAR DATOS EXISTENTES
-- ============================================

-- Migrar estado 'leido' a 'notificado' para nuevas reglas
-- (Solo si ya tienen lectura_confirmada_at)
UPDATE notificaciones
SET estado = 'notificado'
WHERE estado = 'leido'
  AND lectura_confirmada_at IS NOT NULL;

-- Asegurar que alertas_enviadas_empleador tenga valor por defecto
UPDATE notificaciones
SET alertas_enviadas_empleador = 0
WHERE alertas_enviadas_empleador IS NULL;

-- ============================================
-- 6. CREAR TABLA DE LOGS DE ACCESO (OPCIONAL)
-- ============================================

CREATE TABLE IF NOT EXISTS logs_acceso_notificacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notificacion_id UUID REFERENCES notificaciones(id) ON DELETE CASCADE,

  -- Tipo de evento
  tipo_evento VARCHAR(30) NOT NULL,

  -- Datos de validación
  cuil_ingresado VARCHAR(13),
  legajo_ingresado VARCHAR(20),
  validacion_correcta BOOLEAN,

  -- Metadatos técnicos
  ip INET NOT NULL,
  user_agent TEXT,
  dispositivo VARCHAR(50),
  navegador VARCHAR(50),
  sistema_operativo VARCHAR(50),

  -- Geolocalización aproximada (opcional)
  pais VARCHAR(50),
  provincia VARCHAR(50),
  ciudad VARCHAR(100),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint para tipo de evento
  CONSTRAINT logs_acceso_tipo_evento_check CHECK (tipo_evento IN (
    'intento_validacion',
    'validacion_exitosa',
    'validacion_fallida',
    'visualizacion_pdf',
    'scroll_completo',
    'checkbox_marcado',
    'confirmacion_enviada'
  ))
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_acceso_notificacion_id
  ON logs_acceso_notificacion(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_logs_acceso_tipo_evento
  ON logs_acceso_notificacion(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_logs_acceso_created_at
  ON logs_acceso_notificacion(created_at);

-- RLS para logs
ALTER TABLE logs_acceso_notificacion ENABLE ROW LEVEL SECURITY;

-- Política: público puede insertar (tracking desde página pública)
CREATE POLICY "Public can insert logs" ON logs_acceso_notificacion
  FOR INSERT WITH CHECK (true);

-- Política: empresa puede leer sus propios logs
CREATE POLICY "Empresa can read own logs" ON logs_acceso_notificacion
  FOR SELECT USING (
    notificacion_id IN (
      SELECT n.id FROM notificaciones n
      JOIN empresas e ON n.empresa_id = e.id
      WHERE e.user_id = auth.uid()
    )
  );

-- ============================================
-- 7. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON COLUMN notificaciones.identidad_validada_at IS
  'Timestamp cuando el empleado validó su identidad ingresando CUIL/Legajo';

COMMENT ON COLUMN notificaciones.lectura_confirmada_at IS
  'Timestamp cuando el empleado marcó el checkbox de declaración jurada';

COMMENT ON COLUMN notificaciones.lectura_checkbox_aceptado IS
  'TRUE si el empleado aceptó la declaración jurada';

COMMENT ON COLUMN notificaciones.fecha_alerta_72hs IS
  'Timestamp cuando se envió la primera alerta al empleador (72hs sin confirmación)';

COMMENT ON COLUMN notificaciones.alertas_enviadas_empleador IS
  'Contador de alertas enviadas al empleador (máx 3: 72hs, 5días, 7días)';

COMMENT ON COLUMN notificaciones.estado IS
  'Estado actual: borrador, enviado, validado, notificado, pendiente_fisico, enviado_fisico, firme, impugnado';

COMMENT ON TABLE logs_acceso_notificacion IS
  'Log detallado de todos los accesos e intentos de validación de notificaciones';

-- ============================================
-- FIN DE MIGRACIÓN
-- ============================================

-- Para ejecutar en Supabase:
-- 1. Ir a SQL Editor en el dashboard de Supabase
-- 2. Pegar este script completo
-- 3. Ejecutar
--
-- También se puede ejecutar con la CLI de Supabase:
-- supabase db push
