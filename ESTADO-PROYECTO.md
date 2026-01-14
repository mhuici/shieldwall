# NotiLegal - Estado del Proyecto

**Última actualización:** 14 de enero de 2026 (tarde)

---

## Resumen

NotiLegal es un SaaS B2B para PyMEs argentinas que automatiza la notificación fehaciente de sanciones laborales, aprovechando la reforma laboral 2025 (Ley 27.742 - regla de los 30 días).

---

## Días Completados

### Día 1-4: Fundamentos ✅
- [x] Setup Next.js 16 + TypeScript + Tailwind
- [x] Autenticación con Supabase
- [x] CRUD de Empresas y Empleados
- [x] Creación de Sanciones con PDF
- [x] Hash SHA-256 para integridad
- [x] Página pública `/ver/[id]` para empleados

### Día 5: Notificaciones Fehacientes ✅
- [x] Envío de emails con SendGrid
- [x] Envío de SMS con Twilio
- [x] Sistema de semáforo básico
- [x] Tracking de apertura de links
- [x] Confirmación de lectura con IP y timestamp
- [x] Webhooks para tracking de delivery (SendGrid/Twilio)
- [x] PDF de Acta de Notificación Física (contingencia)
- [x] Cron jobs configurados

### Día 6: Sistema Gatekeeper + Flujo 72hs ✅ (NUEVO)
- [x] **Gatekeeper**: Validación de identidad con CUIL antes de mostrar sanción
- [x] **Checkbox Declaración Jurada**: Texto legal Ley 27.742
- [x] **WhatsApp**: Reemplaza SMS como canal secundario (Twilio Business)
- [x] **Email CC al Empleador**: Copia de cada notificación enviada
- [x] **Cron Alertas 72hs**:
  - 72hs → Estado `pendiente_fisico` + alerta al empleador
  - 5 días → Segunda alerta
  - 7 días → Tercera alerta urgente
- [x] **Página PDF Físico**: `/sanciones/[id]/pdf-fisico` con instrucciones
- [x] **Página Reenvío Digital**: `/sanciones/[id]/reenviar`
- [x] **Semáforo Actualizado**: 10 estados con colores e iconos
- [x] **Migración DB**: Nuevas columnas para Gatekeeper y alertas

---

## Sistema de Semáforo (Actualizado)

| Estado | Color | Icono | Descripción |
|--------|-------|-------|-------------|
| `pendiente` | Gris | Clock | Notificación no enviada |
| `enviado` | Azul (pulsa) | Mail | Email/WhatsApp enviado |
| `validado` | Amarillo | UserCheck | CUIL validado, falta checkbox |
| `abierto` | Amarillo | Eye | Legacy: link abierto |
| `leido` | Verde | CheckCircle | Confirmado con declaración jurada |
| `alerta` | Ámbar (pulsa) | AlertTriangle | 72hs+ sin confirmación |
| `pendiente_fisico` | Rojo (pulsa) | FileText | Requiere carta documento |
| `enviado_fisico` | Naranja | Truck | Carta enviada |
| `por_vencer` | Ámbar | Timer | <5 días para vencimiento |
| `firme` | Esmeralda | Shield | 30 días sin impugnación |

---

## Flujo de Notificación (Actualizado)

```
1. Empleador crea sanción
   ↓
2. Empleador hace click en "Enviar Notificación"
   ↓
3. Sistema envía EMAIL + WHATSAPP (paralelo)
   + Email CC al empleador
   → Semáforo: AZUL (Enviado)
   ↓
4. Empleado abre el link
   → Ve formulario GATEKEEPER (ingresa CUIL)
   ↓
5. Empleado valida su identidad (CUIL correcto)
   → Semáforo: AMARILLO (Validado)
   → Ve el contenido de la sanción + checkbox
   ↓
6. Empleado marca checkbox de declaración jurada
   → Semáforo: VERDE (Leído/Notificado)
   → Comienza plazo de 30 días
   ↓
7. Si no confirma en 72hs:
   → Semáforo: ROJO (Pendiente Físico)
   → Email de alerta al empleador con opciones:
     - Botón "Reenviar Digital"
     - Botón "Descargar Carta Documento"
   ↓
8. Alertas adicionales: 5 días, 7 días
   ↓
9. Pasan 30 días sin impugnación
   → Semáforo: ESMERALDA (Firme)
   → Sanción con valor de prueba plena
```

---

## Arquitectura Actual

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── sanciones/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx           # Detalle sanción
│   │   │   │   ├── pdf-fisico/        # 🆕 Descarga carta documento
│   │   │   │   └── reenviar/          # 🆕 Reenvío digital
│   │   │   ├── nueva/
│   │   │   └── page.tsx
│   │   ├── empleados/
│   │   └── page.tsx
│   ├── api/
│   │   ├── notificar/[id]/            # Envío Email + WhatsApp + CC
│   │   ├── pdf/[id]/                  # PDF sanción
│   │   ├── pdf-fisico/[id]/           # 🆕 PDF carta documento
│   │   ├── ver/[token]/
│   │   │   ├── tracking/              # Tracking apertura
│   │   │   ├── validar-identidad/     # 🆕 Gatekeeper CUIL
│   │   │   └── confirmar/             # Confirmación checkbox
│   │   ├── webhooks/
│   │   └── cron/
│   │       ├── alertas/               # 🆕 72hs + 5d + 7d
│   │       └── firmeza/
│   └── ver/[id]/
│       ├── page.tsx                   # Server component
│       └── client.tsx                 # 🆕 Flujo Gatekeeper + Checkbox
├── components/
│   ├── sanciones/
│   ├── notificaciones/
│   │   └── semaforo-notificacion.tsx  # 🆕 10 estados
│   └── ver/
│       ├── gatekeeper-validacion.tsx  # 🆕 Form CUIL
│       ├── contenido-notificacion.tsx # 🆕 Muestra sanción
│       └── checkbox-declaracion.tsx   # 🆕 Declaración jurada
└── lib/
    ├── notifications/
    │   ├── email.ts                   # SendGrid
    │   ├── whatsapp.ts                # 🆕 Twilio WhatsApp
    │   ├── sms.ts                     # Twilio SMS (legacy)
    │   ├── semaforo.ts                # 🆕 Fuente única de verdad
    │   └── index.ts                   # Re-exports
    ├── pdf/
    │   ├── sancion-pdf.tsx
    │   └── acta-notificacion-fisica.tsx
    └── types.ts
```

---

## Variables de Entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=✅
NEXT_PUBLIC_SUPABASE_ANON_KEY=✅
SUPABASE_SERVICE_ROLE_KEY=✅

# SendGrid
SENDGRID_API_KEY=✅
SENDGRID_FROM_EMAIL=✅
SENDGRID_FROM_NAME=✅

# Twilio (SMS + WhatsApp)
TWILIO_ACCOUNT_SID=✅
TWILIO_AUTH_TOKEN=✅
TWILIO_PHONE_NUMBER=✅
TWILIO_WHATSAPP_NUMBER=✅  # 🆕 formato: whatsapp:+5492236248599

# Cron
CRON_SECRET=✅
```

---

## Base de Datos (Columnas Nuevas)

### Tabla `notificaciones`
```sql
-- Gatekeeper
identidad_validada_at TIMESTAMPTZ
identidad_cuil_ingresado VARCHAR(13)
identidad_ip INET
identidad_user_agent TEXT

-- Checkbox
lectura_confirmada_at TIMESTAMPTZ
lectura_checkbox_aceptado BOOLEAN
lectura_ip INET
lectura_user_agent TEXT

-- Alertas 72hs
fecha_alerta_72hs TIMESTAMPTZ
alertas_enviadas_empleador INTEGER DEFAULT 0

-- Envío Físico
pdf_fisico_generado BOOLEAN DEFAULT false
fecha_pdf_fisico TIMESTAMPTZ
enviado_fisico BOOLEAN DEFAULT false
metodo_envio_fisico VARCHAR(30)  -- carta_documento, correo_certificado, entrega_mano
fecha_envio_fisico TIMESTAMPTZ
numero_tracking_fisico VARCHAR(50)
fecha_acuse_recibo TIMESTAMPTZ

-- WhatsApp
whatsapp_enviado_at TIMESTAMPTZ
whatsapp_message_sid VARCHAR(100)
```

### Tabla `logs_acceso_notificacion` (Nueva)
Auditoría detallada de accesos e intentos de validación.

### Tabla `empleados`
```sql
legajo VARCHAR(50)  -- Alternativa al CUIL para validación
```

---

## Cron Jobs

| Endpoint | Frecuencia | Función |
|----------|------------|---------|
| `/api/cron/alertas` | Cada hora | Alertas 72hs, 5d, 7d al empleador |
| `/api/cron/firmeza` | 6:00 AM diario | Marca sanciones firmes (30 días) |

---

## Pendiente para Producción

### Configuración Requerida
- [ ] **WhatsApp Business**: Registrar número en Twilio como sender
- [ ] **Dominio Email**: Configurar SPF/DKIM/DMARC para evitar spam
- [ ] Deploy a Vercel
- [ ] Configurar webhooks con URL pública

### Features Futuras
- [ ] Marcar como "enviado_fisico" cuando se envía carta
- [ ] Registrar acuse de recibo
- [ ] Flujo de impugnación
- [ ] Dashboard con métricas
- [ ] Facturación y planes

---

## Testing Completado

| Flujo | Estado |
|-------|--------|
| Gatekeeper (validación CUIL) | ✅ Funciona |
| Checkbox declaración jurada | ✅ Funciona |
| Cron alertas 72hs | ✅ Funciona |
| Email alerta al empleador | ✅ Funciona (va a spam sin SPF/DKIM) |
| PDF carta documento | ✅ Funciona |
| Reenvío digital | ✅ Funciona |
| WhatsApp | ⚠️ Requiere config Twilio Business |

---

## Textos Legales Implementados

### Checkbox Declaración Jurada
> DECLARO BAJO JURAMENTO que: (i) He accedido personalmente a este documento digital utilizando mis credenciales de identificación; (ii) He leído íntegramente su contenido y comprendo las implicancias de la sanción comunicada; (iii) Comprendo que dispongo de TREINTA (30) DÍAS CORRIDOS desde la fecha de esta notificación para ejercer mi derecho de impugnación; (iv) Entiendo que, de no ejercer dicho derecho en el plazo mencionado, la sanción adquirirá firmeza y tendrá pleno valor probatorio conforme a la normativa vigente (Ley 27.742).

### Aviso 72hs
> Este sistema garantiza su derecho a ser notificado de manera fehaciente. Dispone de 72 horas desde este momento para completar la confirmación de lectura. Si no lo hace, su empleador será notificado para proceder con métodos alternativos de notificación según la normativa laboral vigente.

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Type check
npx tsc --noEmit

# Ejecutar cron manualmente
curl -X GET "http://localhost:3000/api/cron/alertas" \
  -H "Authorization: Bearer $CRON_SECRET"

# Reset notificación (testing)
# Usar Supabase Management API
```

---

## Contacto

Proyecto desarrollado con Claude Code (Anthropic).
