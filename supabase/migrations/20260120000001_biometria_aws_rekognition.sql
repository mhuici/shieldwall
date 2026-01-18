-- =====================================================
-- MIGRACION: Biometria con AWS Rekognition
-- Fecha: 2026-01-20
-- Descripcion: Tablas y campos para liveness detection
--              y comparacion facial con AWS Rekognition
-- =====================================================

-- Tabla de enrolamiento biometrico
-- Guarda el patron base de cada empleado (una vez)
CREATE TABLE IF NOT EXISTS enrolamiento_biometrico (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,

    -- Datos del DNI escaneado
    dni_numero VARCHAR(15),
    dni_nombre VARCHAR(255),
    dni_foto_hash VARCHAR(64), -- SHA-256 de la foto del DNI
    dni_metodo VARCHAR(50), -- 'ocr' | 'nfc' | 'manual'

    -- Patron biometrico (NO guardamos la imagen, solo el hash del vector)
    patron_biometrico_hash VARCHAR(64),

    -- Resultado del enrolamiento con AWS
    aws_session_id VARCHAR(255),
    aws_confidence DECIMAL(5,2),
    aws_is_live BOOLEAN,
    aws_reference_image_s3 VARCHAR(500), -- URL de S3 donde se guarda la imagen de referencia

    -- RENAPER (opcional)
    renaper_validado BOOLEAN DEFAULT FALSE,
    renaper_respuesta VARCHAR(50), -- 'COINCIDE' | 'NO_COINCIDE' | 'ERROR' | 'OMITIDO'
    renaper_timestamp TIMESTAMPTZ,

    -- Metadata
    dispositivo VARCHAR(255),
    ip_enrolamiento INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Solo un enrolamiento activo por empleado
    UNIQUE(empleado_id)
);

-- Tabla de verificaciones biometricas
-- Cada vez que un empleado confirma una notificacion
CREATE TABLE IF NOT EXISTS verificaciones_biometricas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,
    empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE CASCADE,
    enrolamiento_id UUID REFERENCES enrolamiento_biometrico(id),

    -- AWS Rekognition Face Liveness
    aws_liveness_session_id VARCHAR(255),
    aws_liveness_confidence DECIMAL(5,2),
    aws_liveness_is_live BOOLEAN,
    aws_liveness_audit_images_count INTEGER,

    -- AWS Rekognition CompareFaces
    aws_compare_similarity DECIMAL(5,2),
    aws_compare_umbral DECIMAL(5,2) DEFAULT 95.0,
    aws_compare_resultado VARCHAR(20), -- 'APROBADO' | 'REVISION' | 'RECHAZADO'

    -- Costos (para tracking)
    costo_liveness_usd DECIMAL(10,6) DEFAULT 0.01,
    costo_compare_usd DECIMAL(10,6) DEFAULT 0.001,
    costo_total_usd DECIMAL(10,6),

    -- Deteccion de capacidades del dispositivo
    capacidad_camara_frontal BOOLEAN,
    capacidad_conexion_suficiente BOOLEAN,
    capacidad_sdk_inicializado BOOLEAN,

    -- Si hubo contingencia
    contingencia_activada BOOLEAN DEFAULT FALSE,
    contingencia_motivo VARCHAR(100),

    -- Metadata
    dispositivo VARCHAR(255),
    ip_verificacion INET,
    user_agent TEXT,

    -- Resultado final
    resultado_final VARCHAR(20) NOT NULL, -- 'EXITOSO' | 'FALLIDO' | 'CONTINGENCIA'

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar campo de verificacion biometrica a notificaciones
ALTER TABLE notificaciones
ADD COLUMN IF NOT EXISTS verificacion_biometrica_id UUID REFERENCES verificaciones_biometricas(id),
ADD COLUMN IF NOT EXISTS requiere_biometria BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS biometria_completada BOOLEAN DEFAULT FALSE;

-- Agregar campo de enrolamiento a empleados
ALTER TABLE empleados
ADD COLUMN IF NOT EXISTS enrolamiento_completado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enrolamiento_id UUID REFERENCES enrolamiento_biometrico(id);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_enrolamiento_empleado ON enrolamiento_biometrico(empleado_id);
CREATE INDEX IF NOT EXISTS idx_enrolamiento_empresa ON enrolamiento_biometrico(empresa_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_notificacion ON verificaciones_biometricas(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_empleado ON verificaciones_biometricas(empleado_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_resultado ON verificaciones_biometricas(resultado_final);

-- RLS Policies
ALTER TABLE enrolamiento_biometrico ENABLE ROW LEVEL SECURITY;
ALTER TABLE verificaciones_biometricas ENABLE ROW LEVEL SECURITY;

-- Politica: usuarios autenticados pueden ver enrolamientos de su empresa
CREATE POLICY "Usuarios pueden ver enrolamientos de su empresa"
ON enrolamiento_biometrico FOR SELECT
TO authenticated
USING (
    empresa_id IN (
        SELECT id FROM empresas WHERE user_id = auth.uid()
    )
);

-- Politica: usuarios autenticados pueden crear enrolamientos para su empresa
CREATE POLICY "Usuarios pueden crear enrolamientos para su empresa"
ON enrolamiento_biometrico FOR INSERT
TO authenticated
WITH CHECK (
    empresa_id IN (
        SELECT id FROM empresas WHERE user_id = auth.uid()
    )
);

-- Politica: permitir acceso publico para enrolamiento (empleado sin auth)
CREATE POLICY "Acceso publico para enrolamiento por token"
ON enrolamiento_biometrico FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Acceso publico para leer enrolamiento por empleado_id"
ON enrolamiento_biometrico FOR SELECT
TO anon
USING (true);

-- Politicas para verificaciones
CREATE POLICY "Usuarios pueden ver verificaciones de su empresa"
ON verificaciones_biometricas FOR SELECT
TO authenticated
USING (
    empleado_id IN (
        SELECT e.id FROM empleados e
        JOIN empresas emp ON e.empresa_id = emp.id
        WHERE emp.user_id = auth.uid()
    )
);

CREATE POLICY "Acceso publico para crear verificaciones"
ON verificaciones_biometricas FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Acceso publico para leer verificaciones"
ON verificaciones_biometricas FOR SELECT
TO anon
USING (true);

-- Funcion para actualizar updated_at
CREATE OR REPLACE FUNCTION update_enrolamiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrolamiento_updated_at
    BEFORE UPDATE ON enrolamiento_biometrico
    FOR EACH ROW
    EXECUTE FUNCTION update_enrolamiento_updated_at();

-- Comentarios para documentacion
COMMENT ON TABLE enrolamiento_biometrico IS 'Patron biometrico base de cada empleado (enrolamiento unico)';
COMMENT ON TABLE verificaciones_biometricas IS 'Registro de cada verificacion biometrica por notificacion';
COMMENT ON COLUMN enrolamiento_biometrico.patron_biometrico_hash IS 'Hash del vector biometrico, NO la imagen';
COMMENT ON COLUMN enrolamiento_biometrico.aws_reference_image_s3 IS 'URL de S3 de la imagen de referencia para CompareFaces';
COMMENT ON COLUMN verificaciones_biometricas.costo_total_usd IS 'Costo total de AWS por esta verificacion (~$0.011)';
