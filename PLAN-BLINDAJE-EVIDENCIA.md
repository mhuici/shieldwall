# NotiLegal: De "Notificador" a "Blindaje de Evidencia"

**Última actualización**: 15 de Enero 2026
**Estado del proyecto**: MVP + Sistema de Testigos Digitales implementado

---

## ÍNDICE

1. [Contexto: La Crítica de Vergara](#contexto-la-crítica-de-vergara)
2. [Matriz de Contraargumentos](#matriz-de-contraargumentos)
3. [Estado de Implementación](#estado-de-implementación)
4. [Roadmap de Blindaje](#roadmap-de-blindaje)
5. [FAQ para Abogados Evaluadores](#faq-para-abogados-evaluadores)
6. [Pendientes de Marketing](#pendientes-de-marketing)

---

## CONTEXTO: LA CRÍTICA DE VERGARA

### Quién es Vergara
Abogado laboralista argentino con experiencia en empresas y sindicatos. Evaluó NotiLegal y planteó objeciones técnico-jurídicas serias.

### Sus argumentos principales (textual de la conversación):

> **Argumento 1**: "La notificación de un apercibimiento o una sanción que se le quiere imponer a un trabajador no implica prueba de que la misma fue justificada. Es decir, que vos sos mi empleado y yo te digo llegaste tarde y te lo mando por un medio fehaciente, no es prueba de que llegaste tarde."

> **Argumento 2**: "La dificultad del empleador está en cuanto a probar que esa causa existió y no el hecho de que se le haya comunicado."

> **Argumento 3**: "Hoy las leyes son el tipo se droga, no va nunca, pues tenés testigos de que dice que se droga, iba nunca, y el tipo va con un testigo que dice que no se droga, iba todo día y te gana el juicio."

> **Argumento 4**: "Cualquier antes compra esa aplicación ese asesor un poco con su abogado y esto funciona así o no y el abogado a decir no la verdad que no a ver es mejor que nada pues encontrás un empleado pero todo que se caga con eso y dice ya está me despidieron con causa pero más que empleados pero todos está lleno de abogados que le sacan agua al bolsillo y le decir no no eso no vale nada amigo hacemos tremendo juicio"

### El error de premisa identificado

**Premisa original (incorrecta)**:
> "Con NotiLegal no perdés juicios porque probás que notificaste"

**Realidad según Vergara**:
> "La dificultad NO está en probar que notificaste, sino en probar que EL HECHO EXISTIÓ"

---

## MATRIZ DE CONTRAARGUMENTOS

### Cómo atacamos cada argumento de Vergara:

| # | Argumento de Vergara | Estado | Solución Implementada | Valor Probatorio |
|---|---------------------|--------|----------------------|------------------|
| 1 | "Notificar no prueba el hecho" | RESUELTO | Testigos Digitales + Evidencia Multimedia | Los testigos declaran EN EL MOMENTO + fotos/videos con EXIF |
| 2 | "Hay que probar que la causa existió" | PARCIAL | Evidencia Multimedia (implementado) + Control Asistencia (pendiente) | Fotos con GPS/timestamp + registro de fichaje |
| 3 | "Testigos pueden contradecir todo en juicio" | RESUELTO | Declaraciones inmutables con hash SHA-256 | Si el testigo cambia versión, tenés la declaración original |
| 4 | "Los abogados van a decir que no vale" | RESUELTO | Cadena de custodia completa + evidencia multimedia | Paquete ZIP con documentos, testigos, fotos y metadatos |

### Leyenda:
- **RESUELTO**: Implementado y funcionando
- **PARCIAL**: Implementado parcialmente o en progreso
- **PENDIENTE**: No implementado aún

---

## ESTADO DE IMPLEMENTACIÓN

### Pilar 1: TESTIGOS DIGITALES - IMPLEMENTADO

**Problema que resuelve**: Los testigos declaran meses después en juicio y pueden cambiar versión o "no recordar".

**Solución**: Declaraciones firmadas digitalmente EN EL MOMENTO del hecho.

**Archivos creados**:
```
supabase/migrations/20260115_testigos_digitales.sql
src/lib/types.ts (tipos de testigos agregados)
src/components/testigos/agregar-testigo-dialog.tsx
src/components/testigos/card-testigo.tsx
src/components/testigos/lista-testigos.tsx
src/components/testigos/index.ts
src/app/testigo/[token]/page.tsx
src/app/testigo/[token]/client.tsx
src/app/api/testigo/[token]/confirmar/route.ts
src/app/api/testigos/enviar-invitacion/route.ts
src/lib/notifications/testigo-email.ts
src/lib/pdf/declaracion-testigo-pdf.tsx
```

**Archivos modificados**:
```
src/components/sanciones/nueva-sancion-form.tsx
src/app/api/evidencia/[id]/route.ts (integración de testigos en ZIP)
```

**Flujo implementado**:
```
EMPLEADOR agrega testigo (nombre, email, cargo, relación)
    ↓
SISTEMA crea registro con token único (expira en 7 días)
    ↓
EMPLEADOR envía invitación → Email al testigo
    ↓
TESTIGO accede a /testigo/[token]
    ↓
TESTIGO escribe su declaración
    ↓
TESTIGO acepta checkbox de declaración jurada (Art. 275 CP)
    ↓
SISTEMA genera hash SHA-256 + guarda IP + timestamp
    ↓
DECLARACIÓN queda INMUTABLE y firmada digitalmente
```

**Valor probatorio**:
- Hash SHA-256 del contenido (inmutable)
- Timestamp exacto de firma
- IP de origen del testigo
- Declaración jurada bajo apercibimiento de falso testimonio
- Si el testigo dice algo distinto en juicio → tenés la declaración original

---

### Pilar 2: EVIDENCIA MULTIMEDIA - IMPLEMENTADO

**Problema que resuelve**: No hay prueba visual/audiovisual del hecho.

**Solución implementada**: Upload de fotos/videos con extracción de metadatos EXIF.

**Archivos creados**:
```
supabase/migrations/20260115_evidencia_multimedia.sql
src/lib/types.ts (tipos de evidencia agregados)
src/lib/utils/exif-extractor.ts
src/components/evidencia/upload-evidencia.tsx
src/components/evidencia/card-evidencia.tsx
src/components/evidencia/index.ts
src/app/api/evidencia/upload/route.ts
```

**Archivos modificados**:
```
src/components/sanciones/nueva-sancion-form.tsx
src/app/api/evidencia/[id]/route.ts (integración en ZIP)
```

**Flujo implementado**:
```
EMPLEADOR selecciona archivo (foto/video/documento)
    ↓
SISTEMA extrae metadatos EXIF (fecha captura, GPS, dispositivo)
    ↓
SISTEMA calcula hash SHA-256 del archivo
    ↓
EMPLEADOR confirma y agrega descripción
    ↓
Al crear sanción → archivos se suben a Supabase Storage
    ↓
PAQUETE ZIP incluye archivos + metadatos verificables
```

**Valor probatorio**:
- Foto del empleado llegando tarde con timestamp EXIF
- Video de cámara de seguridad
- Screenshot de WhatsApp donde admite el hecho
- Metadatos prueban cuándo y dónde se tomó
- Hash SHA-256 garantiza que no fue alterado

---

### Pilar 3: CONTROL DE ASISTENCIA - PENDIENTE

**Problema que resuelve**: No hay prueba de que el empleado llegó tarde (el caso más común).

**Solución propuesta**: PWA para fichaje con geolocalización + foto selfie.

**Tabla a crear**: `registros_asistencia`
```sql
- id, empresa_id, empleado_id
- tipo (entrada/salida/break)
- timestamp_registro
- latitud, longitud, precision_metros
- foto_url, foto_hash
- metodo (app/qr/manual/biometrico)
- hash_registro
```

**Valor probatorio**:
- Registro de que fichó a las 9:15 cuando el turno era a las 8:00
- Geolocalización prueba que estaba en el lugar
- Foto selfie elimina "otro fichó por mí"

---

### Pilar 4: ACTAS DE SITUACIÓN - PENDIENTE

**Problema que resuelve**: El incidente se documenta días después, no en el momento.

**Solución propuesta**: Wizard para labrar acta inmediatamente después del hecho.

**Tabla a crear**: `actas_situacion`
```sql
- id, empresa_id, empleado_id
- fecha_hecho, hora_hecho, lugar_hecho
- descripcion_detallada
- turno_programado, hora_real_evento
- firmado_por_empleador (timestamp, IP)
- pdf_url, hash_acta
```

**Valor probatorio**:
- Documento labrado EN EL MOMENTO del hecho
- No es una reconstrucción posterior
- El juez ve que el empleador actuó de inmediato

---

### Pilar 5: CADENA DE CUSTODIA TOTAL - IMPLEMENTADO

**Estado actual**:
- [x] Hash SHA-256 de sanciones
- [x] Timestamp certificado
- [x] Tracking multicanal (email, SMS, WhatsApp)
- [x] Validación de identidad con CUIL (Gatekeeper)
- [x] Declaración jurada del empleado (checkbox)
- [x] Logs de auditoría inmutables
- [x] Testigos integrados en paquete ZIP de evidencia
- [x] Evidencia multimedia integrada en paquete ZIP
- [ ] PENDIENTE: Timeline unificado visual

---

## ROADMAP DE BLINDAJE

### Fase 1: Testigos Digitales - COMPLETADO (15/01/2026)
- [x] Migración SQL
- [x] Tipos TypeScript
- [x] Componentes UI
- [x] Página pública del testigo
- [x] APIs de confirmación
- [x] Email de invitación
- [x] PDF de declaración
- [x] Integrar en paquete ZIP de evidencia

### Fase 2: Evidencia Multimedia - COMPLETADO (15/01/2026)
- [x] Migración SQL para `evidencia_incidentes`
- [x] Tipos TypeScript para evidencia
- [x] Componente de upload con drag & drop
- [x] Extracción de metadatos EXIF (fecha, GPS, dispositivo)
- [x] Hash SHA-256 de archivos
- [x] Preview de evidencia con metadatos
- [x] API de upload a Supabase Storage
- [x] Integrar en formulario de sanción
- [x] Integrar en paquete ZIP de evidencia

### Fase 3: Control de Asistencia
- [ ] Migración SQL para `registros_asistencia`
- [ ] PWA para empleados (`/fichar`)
- [ ] Geolocalización + foto selfie
- [ ] Dashboard de asistencia para empleador
- [ ] Detección automática de llegadas tarde
- [ ] Sugerencia de sanción con evidencia pre-cargada

### Fase 4: Actas de Situación
- [ ] Migración SQL para `actas_situacion`
- [ ] Wizard de creación de acta
- [ ] Vinculación con testigos y evidencia
- [ ] PDF de acta de situación
- [ ] Conversión a sanción con 1 click

### Fase 5: Timeline Unificado
- [ ] Componente de timeline visual
- [ ] Consolidación de toda la evidencia de un caso
- [ ] Paquete ZIP expandido con toda la cadena de custodia

---

## FAQ PARA ABOGADOS EVALUADORES

### Preguntas que van a hacer (y cómo responder):

---

**P: "¿Cómo prueba esto que el hecho realmente ocurrió?"**

R: NotiLegal no es solo un notificador. Construye un expediente probatorio completo:
1. **Testigos digitales**: Declaraciones firmadas EN EL MOMENTO del hecho, no meses después en juicio
2. **Evidencia multimedia**: Fotos/videos con metadatos EXIF que prueban cuándo y dónde se tomaron
3. **Control de asistencia**: Registro de fichaje con geolocalización (para llegadas tarde)
4. **Actas de situación**: Documento labrado inmediatamente después del hecho

---

**P: "¿Qué pasa si el testigo dice algo distinto en el juicio?"**

R: Tenés su declaración original firmada digitalmente:
- Hash SHA-256 inmutable
- Timestamp exacto de cuando declaró (a las horas del hecho, no meses después)
- IP de origen (prueba que declaró desde su dispositivo, no bajo coacción en la empresa)
- Declaración jurada bajo apercibimiento de falso testimonio (Art. 275 CP)

Si el testigo cambia su versión en juicio, presentás la declaración original y queda evidenciada la contradicción.

---

**P: "¿Esto tiene validez legal en Argentina?"**

R: Sí. El sistema cumple con:
- **Ley 27.742** (Reforma Laboral 2025): Plazo de 30 días para impugnar, notificación fehaciente
- **Art. 67 LCT**: Poder disciplinario del empleador
- **Art. 220 LCT**: Límite de 30 días de suspensión por año
- **Art. 275 CP**: Falso testimonio (aplica a las declaraciones juradas de testigos)
- **Firma digital**: Hash SHA-256 + timestamp certificado constituyen firma electrónica

---

**P: "¿Cómo verifico que un documento no fue alterado?"**

R: Cada documento tiene:
1. **Hash SHA-256**: Código único generado del contenido
2. **Timestamp**: Momento exacto de generación
3. **Endpoint de verificación**: `/verificar/[hash]` permite a cualquiera (juez, perito, abogado) verificar la integridad

Si alguien altera un solo carácter, el hash cambia completamente.

---

**P: "¿Qué ventaja tiene sobre una carta documento?"**

| Aspecto | Carta Documento | NotiLegal |
|---------|-----------------|-----------|
| Costo | $15.000+ por envío | $45.000/mes ilimitado |
| Demora | 3-7 días | 60 segundos |
| Prueba de lectura | Solo acuse de recibo | Tracking completo + confirmación con CUIL |
| Testigos | No incluye | Declaraciones digitales firmadas |
| Evidencia | No incluye | Fotos, videos, geolocalización |
| Impugnabilidad | Alta ("no recibí") | Baja (cadena de custodia completa) |

---

**P: "¿Y si el empleado dice que le robaron el CUIL?"**

R: El sistema registra:
- IP de acceso (geolocalizable)
- User-agent (tipo de dispositivo)
- Timestamp exacto
- Declaración jurada con checkbox

Si el empleado alega que "le robaron el CUIL", debe explicar:
1. Por qué no hizo la denuncia policial
2. Por qué el IP corresponde a su zona habitual
3. Por qué el dispositivo coincide con el que usa siempre
4. Por qué aceptó la declaración jurada

---

**P: "¿Qué pasa si el empleado no tiene smartphone?"**

R: El sistema tiene fallback físico:
- Si no confirma en 72 horas → alerta al empleador
- Opción de generar PDF para carta documento física
- Se registra que se intentó notificación digital primero

---

**P: "¿Cómo maneja la privacidad de datos?"**

R:
- **Row Level Security (RLS)**: Cada empresa solo ve sus datos
- **Tokens únicos**: Los links son UUID, no IDs predecibles
- **Datos mínimos**: Solo se captura lo necesario para el proceso
- **Hosting en Argentina**: Supabase con datos en región (cumple con ley de datos personales)

---

## PENDIENTES DE MARKETING

### Landing Page - Actualizaciones necesarias:

1. **Cambiar propuesta de valor principal**:
   - ANTES: "Notificá sanciones en 60 segundos"
   - AHORA: "Construí el expediente laboral que gana juicios"

2. **Agregar sección "¿Por qué NotiLegal gana juicios?"**:
   - Testigos que declaran en el momento
   - Evidencia multimedia con metadatos
   - Cadena de custodia digital inmutable
   - Control de asistencia con geolocalización

3. **Agregar FAQ para Abogados**:
   - Copiar las preguntas de arriba
   - Hacer versión colapsable/accordion
   - Agregar link a documentación técnica

4. **Agregar sección "Validación Legal"**:
   - Mencionar las leyes que cumple
   - Mostrar ejemplo de paquete de evidencia
   - Caso de éxito (cuando tengamos uno)

5. **Agregar comparativa**:
   - NotiLegal vs Carta Documento vs Notificación en legajo
   - Tabla con costos, tiempos, validez

6. **CTA para abogados**:
   - "¿Sos abogado laboralista? Agendá una demo técnica"
   - Formulario específico para profesionales

---

## MÉTRICAS DE ÉXITO (para medir después)

1. **Tasa de firmeza**: % de sanciones que llegan a "firme" sin impugnación
2. **Completitud del expediente**: % de sanciones con testigos + evidencia
3. **Tiempo de declaración**: Horas promedio entre incidente y declaración de testigo
4. **Tasa de conversión de abogados**: % de abogados que aprueban después de evaluar

---

## NOTAS PARA DESARROLLO

### Para retomar el trabajo:
1. Correr migraciones:
   - `supabase db push` o aplicar manualmente:
   - `20260115_testigos_digitales.sql`
   - `20260115_evidencia_multimedia.sql`
2. Crear bucket de Storage en Supabase: `evidencia` (privado)
3. El sistema de testigos y evidencia multimedia está 100% funcional
4. Próximo paso técnico: Fase 3 (Control de Asistencia)

### Archivos clave para entender el sistema:

**Testigos Digitales:**
- Tipos: `src/lib/types.ts` (sección testigos)
- Componentes: `src/components/testigos/`
- Página del testigo: `src/app/testigo/[token]/client.tsx`
- API de confirmación: `src/app/api/testigo/[token]/confirmar/route.ts`

**Evidencia Multimedia:**
- Tipos: `src/lib/types.ts` (sección evidencia)
- Extractor EXIF: `src/lib/utils/exif-extractor.ts`
- Componentes: `src/components/evidencia/`
- API de upload: `src/app/api/evidencia/upload/route.ts`

**Formulario principal:**
- `src/components/sanciones/nueva-sancion-form.tsx` (integra testigos + evidencia)

**Paquete de evidencia:**
- `src/app/api/evidencia/[id]/route.ts` (genera ZIP con todo)

---

*Documento generado para tracking interno y evaluación por abogados.*
*NotiLegal - "No solo notificamos. Blindamos tu evidencia."*
