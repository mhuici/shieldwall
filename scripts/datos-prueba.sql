-- ============================================
-- SCRIPT DE DATOS DE PRUEBA - NOTILEGAL
-- ============================================
-- INSTRUCCIONES:
-- 1. Primero ejecuta: SELECT id FROM auth.users LIMIT 1;
-- 2. Copia el UUID del usuario
-- 3. Reemplaza 'TU_USER_ID_AQUI' con ese UUID
-- 4. Ejecuta este script en Supabase SQL Editor
-- ============================================

-- Reemplaza esto con tu user_id real:
DO $$
DECLARE
  v_user_id UUID := 'TU_USER_ID_AQUI'; -- ⚠️ REEMPLAZAR CON TU USER_ID
  v_empresa_id UUID;
  v_empleado1_id UUID;
  v_empleado2_id UUID;
  v_empleado3_id UUID;
  v_notif1_id UUID;
  v_notif2_id UUID;
  v_notif3_id UUID;
  v_notif4_id UUID;
  v_notif5_id UUID;
BEGIN
  -- ============================================
  -- 1. CREAR EMPRESA DE PRUEBA (si no existe)
  -- ============================================

  -- Verificar si ya existe empresa para este usuario
  SELECT id INTO v_empresa_id
  FROM empresas
  WHERE user_id = v_user_id
  LIMIT 1;

  -- Si no existe, crear una
  IF v_empresa_id IS NULL THEN
    INSERT INTO empresas (user_id, cuit, razon_social, rubro, plan)
    VALUES (
      v_user_id,
      '30-71234567-9',
      'Restaurante El Buen Gusto S.R.L.',
      'gastronomia',
      'profesional'
    )
    RETURNING id INTO v_empresa_id;

    RAISE NOTICE 'Empresa creada: %', v_empresa_id;
  ELSE
    RAISE NOTICE 'Empresa existente: %', v_empresa_id;
  END IF;

  -- ============================================
  -- 2. CREAR EMPLEADOS DE PRUEBA
  -- ============================================

  -- Empleado 1: Juan Pérez
  INSERT INTO empleados (empresa_id, cuil, nombre, email, telefono, activo)
  VALUES (
    v_empresa_id,
    '20-12345678-9',
    'Juan Carlos Pérez',
    'juan.perez.test@example.com',
    '+5492236123456',
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_empleado1_id;

  IF v_empleado1_id IS NULL THEN
    SELECT id INTO v_empleado1_id FROM empleados
    WHERE empresa_id = v_empresa_id AND cuil = '20-12345678-9';
  END IF;

  -- Empleado 2: María González
  INSERT INTO empleados (empresa_id, cuil, nombre, email, telefono, activo)
  VALUES (
    v_empresa_id,
    '27-23456789-5',
    'María Laura González',
    'maria.gonzalez.test@example.com',
    '+5492236234567',
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_empleado2_id;

  IF v_empleado2_id IS NULL THEN
    SELECT id INTO v_empleado2_id FROM empleados
    WHERE empresa_id = v_empresa_id AND cuil = '27-23456789-5';
  END IF;

  -- Empleado 3: Carlos Rodríguez
  INSERT INTO empleados (empresa_id, cuil, nombre, email, telefono, activo)
  VALUES (
    v_empresa_id,
    '20-34567890-3',
    'Carlos Alberto Rodríguez',
    'carlos.rodriguez.test@example.com',
    '+5492236345678',
    true
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_empleado3_id;

  IF v_empleado3_id IS NULL THEN
    SELECT id INTO v_empleado3_id FROM empleados
    WHERE empresa_id = v_empresa_id AND cuil = '20-34567890-3';
  END IF;

  RAISE NOTICE 'Empleados: %, %, %', v_empleado1_id, v_empleado2_id, v_empleado3_id;

  -- ============================================
  -- 3. CREAR NOTIFICACIONES DE PRUEBA (Varios estados)
  -- ============================================

  -- Notificación 1: Estado BORRADOR (pendiente de envío)
  INSERT INTO notificaciones (
    empresa_id, empleado_id, tipo, motivo, descripcion, fecha_hecho,
    hash_sha256, timestamp_generacion, estado, token_acceso
  )
  VALUES (
    v_empresa_id,
    v_empleado1_id,
    'apercibimiento',
    'Llegada tarde reiterada',
    'El trabajador llegó tarde en 3 oportunidades durante la última semana: lunes 13/01 a las 09:45, miércoles 15/01 a las 10:15, y viernes 17/01 a las 09:30. El horario de ingreso establecido es 09:00.',
    CURRENT_DATE - INTERVAL '2 days',
    encode(sha256(random()::text::bytea), 'hex'),
    NOW() - INTERVAL '2 days',
    'borrador',
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO v_notif1_id;

  -- Notificación 2: Estado ENVIADO (esperando respuesta del empleado)
  INSERT INTO notificaciones (
    empresa_id, empleado_id, tipo, motivo, descripcion, fecha_hecho,
    hash_sha256, timestamp_generacion, estado,
    email_enviado_at, fecha_vencimiento, token_acceso
  )
  VALUES (
    v_empresa_id,
    v_empleado2_id,
    'apercibimiento',
    'Incumplimiento de normas de higiene',
    'Se constató que el trabajador no utilizó los elementos de protección personal (cofia y guantes) durante el servicio del almuerzo del día 12/01/2026, contraviniendo las normas de higiene establecidas.',
    CURRENT_DATE - INTERVAL '3 days',
    encode(sha256(random()::text::bytea), 'hex'),
    NOW() - INTERVAL '1 day',
    'enviado',
    NOW() - INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '29 days',
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO v_notif2_id;

  -- Notificación 3: Estado NOTIFICADO (lectura confirmada, esperando vencimiento)
  INSERT INTO notificaciones (
    empresa_id, empleado_id, tipo, motivo, descripcion, fecha_hecho,
    hash_sha256, timestamp_generacion, estado,
    email_enviado_at, identidad_validada_at, identidad_cuil_ingresado,
    lectura_confirmada_at, lectura_checkbox_aceptado,
    fecha_vencimiento, token_acceso
  )
  VALUES (
    v_empresa_id,
    v_empleado3_id,
    'suspension',
    'Falta injustificada',
    'El trabajador no se presentó a trabajar el día 08/01/2026 sin dar aviso previo ni presentar justificativo posterior. Se aplicó suspensión de 2 días conforme al Art. 67 LCT.',
    CURRENT_DATE - INTERVAL '10 days',
    encode(sha256(random()::text::bytea), 'hex'),
    NOW() - INTERVAL '8 days',
    'notificado',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '7 days',
    '20-34567890-3',
    NOW() - INTERVAL '7 days',
    true,
    CURRENT_DATE + INTERVAL '22 days',
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO v_notif3_id;

  -- Notificación 4: Estado FIRME (ya pasaron 30 días)
  INSERT INTO notificaciones (
    empresa_id, empleado_id, tipo, motivo, descripcion, fecha_hecho,
    hash_sha256, timestamp_generacion, estado,
    email_enviado_at, identidad_validada_at, identidad_cuil_ingresado,
    lectura_confirmada_at, lectura_checkbox_aceptado,
    fecha_vencimiento, token_acceso
  )
  VALUES (
    v_empresa_id,
    v_empleado1_id,
    'apercibimiento',
    'Uso indebido de celular',
    'Se observó al trabajador utilizando su teléfono celular de manera reiterada durante el horario de trabajo, específicamente durante el servicio de cena del día 05/12/2025.',
    '2025-12-05',
    encode(sha256(random()::text::bytea), 'hex'),
    '2025-12-06T10:00:00Z',
    'firme',
    '2025-12-06T10:05:00Z',
    '2025-12-06T14:30:00Z',
    '20-12345678-9',
    '2025-12-06T14:35:00Z',
    true,
    '2026-01-05',
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO v_notif4_id;

  -- Notificación 5: Estado ALERTA (72hs sin respuesta)
  INSERT INTO notificaciones (
    empresa_id, empleado_id, tipo, motivo, descripcion, fecha_hecho,
    hash_sha256, timestamp_generacion, estado,
    email_enviado_at, fecha_alerta_72hs, alertas_enviadas_empleador,
    fecha_vencimiento, token_acceso
  )
  VALUES (
    v_empresa_id,
    v_empleado2_id,
    'apercibimiento',
    'Trato inadecuado a cliente',
    'Se recibió queja de cliente sobre trato descortés por parte del trabajador durante el servicio del día 10/01/2026. El cliente reportó que el empleado respondió de manera grosera ante un reclamo legítimo.',
    CURRENT_DATE - INTERVAL '5 days',
    encode(sha256(random()::text::bytea), 'hex'),
    NOW() - INTERVAL '4 days',
    'pendiente_fisico',
    NOW() - INTERVAL '4 days',
    NOW() - INTERVAL '1 day',
    1,
    CURRENT_DATE + INTERVAL '26 days',
    encode(gen_random_bytes(16), 'hex')
  )
  RETURNING id INTO v_notif5_id;

  -- ============================================
  -- 4. CREAR EVENTOS DE PRUEBA
  -- ============================================

  -- Eventos para notificación 2 (enviada)
  INSERT INTO eventos (notificacion_id, tipo, metadata, ip)
  VALUES
    (v_notif2_id, 'envio_email', '{"to": "maria.gonzalez.test@example.com", "sendgrid_id": "sg_test_123"}'::jsonb, '190.0.0.1'),
    (v_notif2_id, 'envio_sms', '{"to": "+5492236234567", "twilio_sid": "SM_test_456"}'::jsonb, '190.0.0.1');

  -- Eventos para notificación 3 (notificada)
  INSERT INTO eventos (notificacion_id, tipo, metadata, ip, created_at)
  VALUES
    (v_notif3_id, 'envio_email', '{"to": "carlos.rodriguez.test@example.com"}'::jsonb, '190.0.0.1', NOW() - INTERVAL '8 days'),
    (v_notif3_id, 'apertura_link', '{"source": "email"}'::jsonb, '181.0.0.50', NOW() - INTERVAL '7 days' + INTERVAL '2 hours'),
    (v_notif3_id, 'validacion_identidad', '{"cuil": "20-34567890-3", "resultado": "exitoso"}'::jsonb, '181.0.0.50', NOW() - INTERVAL '7 days' + INTERVAL '2 hours' + INTERVAL '5 minutes'),
    (v_notif3_id, 'confirmacion_lectura', '{"checkbox": true}'::jsonb, '181.0.0.50', NOW() - INTERVAL '7 days' + INTERVAL '2 hours' + INTERVAL '10 minutes');

  -- Eventos para notificación 4 (firme)
  INSERT INTO eventos (notificacion_id, tipo, metadata, ip, created_at)
  VALUES
    (v_notif4_id, 'envio_email', '{"to": "juan.perez.test@example.com"}'::jsonb, '190.0.0.1', '2025-12-06T10:05:00Z'),
    (v_notif4_id, 'apertura_link', '{}'::jsonb, '181.0.0.100', '2025-12-06T14:30:00Z'),
    (v_notif4_id, 'validacion_identidad', '{"cuil": "20-12345678-9"}'::jsonb, '181.0.0.100', '2025-12-06T14:33:00Z'),
    (v_notif4_id, 'confirmacion_lectura', '{"checkbox": true}'::jsonb, '181.0.0.100', '2025-12-06T14:35:00Z'),
    (v_notif4_id, 'firmeza', '{"dias_transcurridos": 30}'::jsonb, '127.0.0.1', '2026-01-05T06:00:00Z');

  -- Eventos para notificación 5 (alerta 72hs)
  INSERT INTO eventos (notificacion_id, tipo, metadata, ip, created_at)
  VALUES
    (v_notif5_id, 'envio_email', '{"to": "maria.gonzalez.test@example.com"}'::jsonb, '190.0.0.1', NOW() - INTERVAL '4 days'),
    (v_notif5_id, 'alerta_72hs', '{"alerta_numero": 1, "enviado_a": "empleador"}'::jsonb, '127.0.0.1', NOW() - INTERVAL '1 day');

  RAISE NOTICE '============================================';
  RAISE NOTICE 'DATOS DE PRUEBA CREADOS EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Empresa ID: %', v_empresa_id;
  RAISE NOTICE 'Empleados: 3';
  RAISE NOTICE 'Notificaciones: 5';
  RAISE NOTICE '';
  RAISE NOTICE 'Estados de las notificaciones:';
  RAISE NOTICE '  1. BORRADOR - Juan Pérez (llegada tarde)';
  RAISE NOTICE '  2. ENVIADO - María González (higiene)';
  RAISE NOTICE '  3. NOTIFICADO - Carlos Rodríguez (falta)';
  RAISE NOTICE '  4. FIRME - Juan Pérez (celular)';
  RAISE NOTICE '  5. PENDIENTE_FISICO - María González (trato cliente)';
  RAISE NOTICE '============================================';

END $$;

-- ============================================
-- VERIFICAR DATOS CREADOS
-- ============================================

-- Ver empleados
SELECT id, nombre, cuil, email FROM empleados ORDER BY created_at DESC LIMIT 5;

-- Ver notificaciones con estados
SELECT
  n.id,
  e.nombre as empleado,
  n.tipo,
  n.estado,
  n.email_enviado_at,
  n.lectura_confirmada_at,
  n.fecha_vencimiento
FROM notificaciones n
JOIN empleados e ON n.empleado_id = e.id
ORDER BY n.created_at DESC
LIMIT 10;
