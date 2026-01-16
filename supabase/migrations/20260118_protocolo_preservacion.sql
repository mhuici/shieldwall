-- =====================================================
-- FASE 5: PROTOCOLO DE PRESERVACIÓN Y PERITAJE
-- Documentación técnica para peritos informáticos
-- =====================================================

-- Tabla para registrar exportaciones de evidencia
CREATE TABLE IF NOT EXISTS exportaciones_evidencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  notificacion_id UUID NOT NULL REFERENCES notificaciones(id) ON DELETE CASCADE,

  -- Tipo de exportación
  tipo VARCHAR(30) CHECK (tipo IN (
    'paquete_completo',     -- ZIP con todo
    'solo_timeline',        -- Solo timeline JSON/HTML
    'peritaje_tecnico',     -- Solo docs técnicos
    'cadena_custodia'       -- Solo cadena de custodia
  )) DEFAULT 'paquete_completo',

  -- Destino/motivo
  solicitado_para VARCHAR(200), -- "Juzgado Laboral N1 MdP", "Archivo interno"
  motivo TEXT,

  -- Archivo generado
  storage_path TEXT,
  nombre_archivo TEXT,
  tamano_bytes BIGINT,
  hash_paquete VARCHAR(64), -- SHA-256 del ZIP completo

  -- Contenido incluido
  contenido_incluido JSONB DEFAULT '{}', -- {sancion: true, testigos: 3, evidencias: 5, descargo: true, bitacora: 12}

  -- Timeline de hashes (todos los hashes de componentes)
  timeline_hashes JSONB DEFAULT '[]', -- [{tipo, id, hash, timestamp}]

  -- Metadatos técnicos del sistema
  metadatos_tecnicos JSONB DEFAULT '{}', -- {version_sistema, timestamp_generacion, servidor, etc}

  -- Estado
  estado VARCHAR(20) CHECK (estado IN (
    'generando',
    'completado',
    'error',
    'expirado'
  )) DEFAULT 'generando',
  error_mensaje TEXT,

  -- Descargas
  descargado_count INTEGER DEFAULT 0,
  ultima_descarga_at TIMESTAMPTZ,
  ultima_descarga_ip INET,

  -- Fechas
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  completado_at TIMESTAMPTZ
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_exportaciones_empresa ON exportaciones_evidencia(empresa_id);
CREATE INDEX IF NOT EXISTS idx_exportaciones_notificacion ON exportaciones_evidencia(notificacion_id);
CREATE INDEX IF NOT EXISTS idx_exportaciones_estado ON exportaciones_evidencia(estado);
CREATE INDEX IF NOT EXISTS idx_exportaciones_expires ON exportaciones_evidencia(expires_at);

-- RLS
ALTER TABLE exportaciones_evidencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Empresas ven sus exportaciones"
  ON exportaciones_evidencia FOR SELECT
  USING (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ));

CREATE POLICY "Empresas crean exportaciones"
  ON exportaciones_evidencia FOR INSERT
  WITH CHECK (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ));

CREATE POLICY "Empresas actualizan exportaciones"
  ON exportaciones_evidencia FOR UPDATE
  USING (empresa_id IN (
    SELECT id FROM empresas WHERE user_id = auth.uid()
  ));

-- =====================================================
-- TABLA: Verificaciones de integridad
-- Registro de cuando alguien verifica un hash
-- =====================================================

CREATE TABLE IF NOT EXISTS verificaciones_integridad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Qué se verificó
  tipo_documento VARCHAR(30) CHECK (tipo_documento IN (
    'notificacion',
    'testigo',
    'evidencia',
    'descargo',
    'bitacora',
    'paquete'
  )),
  documento_id UUID,

  -- Hash verificado
  hash_verificado VARCHAR(64),
  hash_esperado VARCHAR(64),
  verificacion_exitosa BOOLEAN,

  -- Quién verificó
  verificado_por_empresa_id UUID REFERENCES empresas(id),
  verificado_por_externo BOOLEAN DEFAULT false, -- Si es un perito/juzgado
  verificado_por_nombre TEXT, -- Nombre del verificador externo

  -- Datos de la verificación
  ip INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verificaciones_documento ON verificaciones_integridad(tipo_documento, documento_id);
CREATE INDEX IF NOT EXISTS idx_verificaciones_hash ON verificaciones_integridad(hash_verificado);

-- RLS
ALTER TABLE verificaciones_integridad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver verificaciones propias"
  ON verificaciones_integridad FOR SELECT
  USING (
    verificado_por_empresa_id IN (
      SELECT id FROM empresas WHERE user_id = auth.uid()
    )
    OR verificado_por_externo = true
  );

CREATE POLICY "Insertar verificaciones"
  ON verificaciones_integridad FOR INSERT
  WITH CHECK (true); -- Cualquiera puede verificar

-- =====================================================
-- FUNCIÓN: Obtener timeline completo de una notificación
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_timeline_notificacion(p_notificacion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_notificacion RECORD;
  v_timeline JSONB := '[]'::jsonb;
  v_evento JSONB;
BEGIN
  -- Obtener notificación base
  SELECT * INTO v_notificacion
  FROM notificaciones
  WHERE id = p_notificacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Notificación no encontrada');
  END IF;

  -- 1. Creación de la sanción
  v_timeline := v_timeline || jsonb_build_array(
    jsonb_build_object(
      'tipo', 'sancion_creada',
      'timestamp', v_notificacion.created_at,
      'titulo', 'Sanción creada',
      'descripcion', 'Se generó la notificación de ' || v_notificacion.tipo,
      'hash', v_notificacion.hash_sha256,
      'metadata', jsonb_build_object(
        'tipo_sancion', v_notificacion.tipo,
        'motivo', v_notificacion.motivo,
        'gravedad', v_notificacion.gravedad
      )
    )
  );

  -- 2. Timestamp de generación
  IF v_notificacion.timestamp_generacion IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'timestamp_generacion',
        'timestamp', v_notificacion.timestamp_generacion,
        'titulo', 'Timestamp certificado',
        'descripcion', 'Hash SHA-256 generado',
        'hash', v_notificacion.hash_sha256
      )
    );
  END IF;

  -- 3. Email enviado
  IF v_notificacion.email_enviado_at IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'email_enviado',
        'timestamp', v_notificacion.email_enviado_at,
        'titulo', 'Notificación enviada',
        'descripcion', 'Email enviado al empleado'
      )
    );
  END IF;

  -- 4. Email entregado
  IF v_notificacion.email_entregado_at IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'email_entregado',
        'timestamp', v_notificacion.email_entregado_at,
        'titulo', 'Email entregado',
        'descripcion', 'Confirmación de entrega del servidor de correo'
      )
    );
  END IF;

  -- 5. Link abierto
  IF v_notificacion.link_abierto_at IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'link_abierto',
        'timestamp', v_notificacion.link_abierto_at,
        'titulo', 'Link accedido',
        'descripcion', 'El empleado accedió al enlace de notificación'
      )
    );
  END IF;

  -- 6. Identidad validada
  IF v_notificacion.identidad_validada_at IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'identidad_validada',
        'timestamp', v_notificacion.identidad_validada_at,
        'titulo', 'Identidad verificada',
        'descripcion', 'El empleado validó su identidad con CUIL',
        'metadata', jsonb_build_object(
          'ip', v_notificacion.validacion_ip
        )
      )
    );
  END IF;

  -- 7. Lectura confirmada
  IF v_notificacion.lectura_confirmada_at IS NOT NULL THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'lectura_confirmada',
        'timestamp', v_notificacion.lectura_confirmada_at,
        'titulo', 'Lectura confirmada',
        'descripcion', 'El empleado confirmó lectura con declaración jurada',
        'hash', v_notificacion.hash_confirmacion,
        'metadata', jsonb_build_object(
          'ip', v_notificacion.confirmacion_ip
        )
      )
    );
  END IF;

  -- 8. Testigos (de declaraciones_testigos)
  FOR v_evento IN
    SELECT jsonb_build_object(
      'tipo', CASE
        WHEN estado = 'firmado' THEN 'testigo_firmado'
        WHEN estado = 'invitado' THEN 'testigo_invitado'
        ELSE 'testigo_agregado'
      END,
      'timestamp', COALESCE(firmado_at, invitacion_enviada_at, created_at),
      'titulo', CASE
        WHEN estado = 'firmado' THEN 'Testigo firmó declaración'
        WHEN estado = 'invitado' THEN 'Invitación enviada a testigo'
        ELSE 'Testigo agregado'
      END,
      'descripcion', 'Testigo: ' || nombre_completo,
      'hash', hash_sha256,
      'metadata', jsonb_build_object(
        'testigo_id', id,
        'nombre', nombre_completo,
        'cargo', cargo,
        'estado', estado
      )
    ) AS evento
    FROM declaraciones_testigos
    WHERE notificacion_id = p_notificacion_id
    ORDER BY created_at
  LOOP
    v_timeline := v_timeline || jsonb_build_array(v_evento.evento);
  END LOOP;

  -- 9. Evidencias (de evidencia_incidentes)
  FOR v_evento IN
    SELECT jsonb_build_object(
      'tipo', 'evidencia_adjuntada',
      'timestamp', created_at,
      'titulo', 'Evidencia adjuntada',
      'descripcion', COALESCE(descripcion, 'Archivo ' || tipo),
      'hash', hash_sha256,
      'metadata', jsonb_build_object(
        'evidencia_id', id,
        'tipo', tipo,
        'tiene_exif', exif_fecha_captura IS NOT NULL,
        'tiene_gps', exif_latitud IS NOT NULL
      )
    ) AS evento
    FROM evidencia_incidentes
    WHERE notificacion_id = p_notificacion_id
    ORDER BY created_at
  LOOP
    v_timeline := v_timeline || jsonb_build_array(v_evento.evento);
  END LOOP;

  -- 10. Descargo
  FOR v_evento IN
    SELECT jsonb_build_object(
      'tipo', CASE
        WHEN confirmado_at IS NOT NULL AND decision = 'ejercer_descargo' THEN 'descargo_presentado'
        WHEN confirmado_at IS NOT NULL AND decision = 'declinar_descargo' THEN 'descargo_declinado'
        WHEN decision = 'vencido' THEN 'descargo_vencido'
        ELSE 'descargo_pendiente'
      END,
      'timestamp', COALESCE(confirmado_at, decision_timestamp, created_at),
      'titulo', CASE
        WHEN confirmado_at IS NOT NULL AND decision = 'ejercer_descargo' THEN 'Descargo presentado'
        WHEN confirmado_at IS NOT NULL AND decision = 'declinar_descargo' THEN 'Descargo declinado'
        WHEN decision = 'vencido' THEN 'Plazo de descargo vencido'
        ELSE 'Descargo pendiente'
      END,
      'descripcion', CASE
        WHEN decision = 'ejercer_descargo' THEN 'El empleado presentó su versión de los hechos'
        WHEN decision = 'declinar_descargo' THEN 'El empleado decidió no presentar descargo'
        WHEN decision = 'vencido' THEN 'El plazo venció sin respuesta'
        ELSE 'Esperando decisión del empleado'
      END,
      'hash', hash_sha256,
      'metadata', jsonb_build_object(
        'descargo_id', id,
        'decision', decision,
        'tiene_texto', texto_descargo IS NOT NULL
      )
    ) AS evento
    FROM descargos
    WHERE notificacion_id = p_notificacion_id
  LOOP
    v_timeline := v_timeline || jsonb_build_array(v_evento.evento);
  END LOOP;

  -- 11. Sanción firme (si aplica)
  IF v_notificacion.estado = 'firme' THEN
    v_timeline := v_timeline || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'sancion_firme',
        'timestamp', v_notificacion.updated_at,
        'titulo', 'Sanción firme',
        'descripcion', 'Transcurrieron 30 días sin impugnación. La sanción tiene valor de prueba plena.',
        'hash', v_notificacion.hash_sha256
      )
    );
  END IF;

  -- Ordenar por timestamp
  SELECT jsonb_agg(elem ORDER BY (elem->>'timestamp')::timestamptz)
  INTO v_timeline
  FROM jsonb_array_elements(v_timeline) AS elem;

  RETURN jsonb_build_object(
    'notificacion_id', p_notificacion_id,
    'total_eventos', jsonb_array_length(v_timeline),
    'eventos', v_timeline
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Obtener todos los hashes de una notificación
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_hashes_notificacion(p_notificacion_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_hashes JSONB := '[]'::jsonb;
  v_notificacion RECORD;
BEGIN
  -- Hash de la notificación
  SELECT id, hash_sha256, hash_confirmacion, timestamp_generacion
  INTO v_notificacion
  FROM notificaciones
  WHERE id = p_notificacion_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Notificación no encontrada');
  END IF;

  -- Hash principal
  v_hashes := v_hashes || jsonb_build_array(
    jsonb_build_object(
      'tipo', 'notificacion',
      'id', v_notificacion.id,
      'hash', v_notificacion.hash_sha256,
      'timestamp', v_notificacion.timestamp_generacion,
      'descripcion', 'Hash del contenido de la sanción'
    )
  );

  -- Hash de confirmación
  IF v_notificacion.hash_confirmacion IS NOT NULL THEN
    v_hashes := v_hashes || jsonb_build_array(
      jsonb_build_object(
        'tipo', 'confirmacion_lectura',
        'id', v_notificacion.id,
        'hash', v_notificacion.hash_confirmacion,
        'descripcion', 'Hash de la confirmación de lectura'
      )
    );
  END IF;

  -- Hashes de testigos
  SELECT jsonb_agg(
    jsonb_build_object(
      'tipo', 'testigo',
      'id', id,
      'hash', hash_sha256,
      'timestamp', firmado_at,
      'descripcion', 'Declaración de ' || nombre_completo
    )
  ) INTO v_hashes
  FROM (
    SELECT id, hash_sha256, firmado_at, nombre_completo
    FROM declaraciones_testigos
    WHERE notificacion_id = p_notificacion_id
    AND hash_sha256 IS NOT NULL
  ) t;

  -- Hashes de evidencias
  SELECT v_hashes || COALESCE(jsonb_agg(
    jsonb_build_object(
      'tipo', 'evidencia',
      'id', id,
      'hash', hash_sha256,
      'timestamp', created_at,
      'descripcion', 'Archivo de evidencia: ' || COALESCE(descripcion, tipo)
    )
  ), '[]'::jsonb) INTO v_hashes
  FROM evidencia_incidentes
  WHERE notificacion_id = p_notificacion_id
  AND hash_sha256 IS NOT NULL;

  -- Hash de descargo
  SELECT v_hashes || COALESCE(jsonb_agg(
    jsonb_build_object(
      'tipo', 'descargo',
      'id', id,
      'hash', hash_sha256,
      'timestamp', confirmado_at,
      'descripcion', 'Descargo del empleado'
    )
  ), '[]'::jsonb) INTO v_hashes
  FROM descargos
  WHERE notificacion_id = p_notificacion_id
  AND hash_sha256 IS NOT NULL;

  RETURN jsonb_build_object(
    'notificacion_id', p_notificacion_id,
    'total_hashes', jsonb_array_length(v_hashes),
    'hashes', v_hashes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN: Verificar integridad de un documento
-- =====================================================

CREATE OR REPLACE FUNCTION verificar_integridad(
  p_tipo VARCHAR(30),
  p_documento_id UUID,
  p_hash_proporcionado VARCHAR(64),
  p_verificador_nombre TEXT DEFAULT NULL,
  p_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_hash_real VARCHAR(64);
  v_verificacion_exitosa BOOLEAN;
  v_empresa_id UUID;
BEGIN
  -- Obtener el hash real según el tipo
  CASE p_tipo
    WHEN 'notificacion' THEN
      SELECT hash_sha256, empresa_id INTO v_hash_real, v_empresa_id
      FROM notificaciones WHERE id = p_documento_id;
    WHEN 'testigo' THEN
      SELECT hash_sha256, empresa_id INTO v_hash_real, v_empresa_id
      FROM declaraciones_testigos WHERE id = p_documento_id;
    WHEN 'evidencia' THEN
      SELECT hash_sha256, empresa_id INTO v_hash_real, v_empresa_id
      FROM evidencia_incidentes WHERE id = p_documento_id;
    WHEN 'descargo' THEN
      SELECT hash_sha256, empresa_id INTO v_hash_real, v_empresa_id
      FROM descargos WHERE id = p_documento_id;
    WHEN 'bitacora' THEN
      SELECT hash_sha256, empresa_id INTO v_hash_real, v_empresa_id
      FROM bitacora_novedades WHERE id = p_documento_id;
    ELSE
      RETURN jsonb_build_object('error', 'Tipo de documento inválido');
  END CASE;

  IF v_hash_real IS NULL THEN
    RETURN jsonb_build_object('error', 'Documento no encontrado');
  END IF;

  -- Comparar hashes
  v_verificacion_exitosa := (LOWER(v_hash_real) = LOWER(p_hash_proporcionado));

  -- Registrar la verificación
  INSERT INTO verificaciones_integridad (
    tipo_documento,
    documento_id,
    hash_verificado,
    hash_esperado,
    verificacion_exitosa,
    verificado_por_empresa_id,
    verificado_por_externo,
    verificado_por_nombre,
    ip,
    user_agent
  ) VALUES (
    p_tipo,
    p_documento_id,
    p_hash_proporcionado,
    v_hash_real,
    v_verificacion_exitosa,
    v_empresa_id,
    p_verificador_nombre IS NOT NULL,
    p_verificador_nombre,
    p_ip,
    p_user_agent
  );

  RETURN jsonb_build_object(
    'verificacion_exitosa', v_verificacion_exitosa,
    'hash_proporcionado', p_hash_proporcionado,
    'hash_esperado', v_hash_real,
    'mensaje', CASE
      WHEN v_verificacion_exitosa THEN 'El documento NO ha sido alterado. Integridad verificada.'
      ELSE 'ADVERTENCIA: Los hashes no coinciden. El documento puede haber sido alterado.'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION obtener_timeline_notificacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION obtener_hashes_notificacion(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verificar_integridad(VARCHAR, UUID, VARCHAR, TEXT, INET, TEXT) TO authenticated, anon;
