# PROMPT: Planificación Landing V2

> Ejecutar después de compact para planificar la nueva versión del landing

---

## CONTEXTO DEL PROYECTO

NotiLegal/Notificarte es un SaaS de notificaciones laborales con validez forense para PyMEs argentinas.
El objetivo es construir expedientes probatorios blindados para sanciones disciplinarias.

## FEATURES IMPLEMENTADOS (Fases 1-7)

### Fase 1-2: Biometría AWS Rekognition
- Face Liveness Detection (detecta vida real, no foto/video)
- Enrolamiento único por empleado
- Comparación facial en cada verificación (95%+ similaridad)
- Costo: $0.011 USD por verificación
- Contingencia: fallback a OTP cuando cámara/conexión falla

### Fase 3: Webhooks + Reconciliación
- Verificación de firmas SendGrid/Twilio
- Reconciliación automática cada 6 horas
- Grace period antes de subsidiariedad física

### Fase 4: Protocolo de Lectura Activa
- Tracking de scroll invisible (requiere 90%+ del documento)
- Tiempo mínimo de lectura calculado por cantidad de palabras
- Campo de reconocimiento con pregunta según tipo de sanción
- Validación fuzzy matching (acepta variaciones)
- 3 intentos permitidos
- Ataca: "lo firmé pero no lo leí"

### Fase 5: Firma PKI + TSA RFC 3161
- Sello de tiempo RFC 3161 vía FreeTSA.org (inmediato, verificable con OpenSSL)
- Blockchain Bitcoin vía OpenTimestamps (confirmación ~6 horas)
- Firma digital PKI conforme Art. 288 CCyC
- Dual timestamp: TSA para fecha cierta + blockchain para inmutabilidad

### Fase 6: Pack Evidencia v2.0
- Carpetas: timestamps/, biometria/, protocolo_lectura/, firma_digital/
- Token TSA (.der) verificable independientemente
- Archivo .ots verificable en opentimestamps.org
- Instrucciones de verificación para peritos
- Timeline visual con iconos semánticos
- Metadata JSON completo para auditoría forense

### Fase 7: Contingencia Conectividad
- Detección automática de problemas (cámara, conexión, timeout)
- Fallback a verificación por SMS (OTP) cuando biometría falla
- Registro de contingencia para auditoría
- UI clara informando "Modo Contingencia"

## MARCO LEGAL ARGENTINO
- Acordada 31/2011 CSJN: Domicilio electrónico
- Art. 288 CCyC: Equivalencia firma digital
- Ley 27.742: Plazo 30 días para impugnar sanciones
- Art. 67 LCT: Poder disciplinario del empleador
- Ley 25.326: Protección de datos personales

## LANDING ACTUAL
El archivo está en: src/app/page.tsx
Tiene ~1160 líneas, estructura:
- Hero con estadísticas
- Problema (por qué firmas en legajo no sirven)
- Solución (4 pilares)
- Convenio de Domicilio Electrónico
- Verificación de identidad (3 pasos - DESACTUALIZADO)
- 5 capas de evidencia (INCOMPLETO)
- Flujo en 4 pasos
- Validación legal
- Comparativa
- ROI
- Pricing
- FAQ
- CTA Final

## GAPS IDENTIFICADOS

| Feature implementado | Estado en landing | Impacto para abogados |
|---------------------|-------------------|----------------------|
| **Face Liveness AWS** (anti-spoofing) | Dice "selfie" genérico | ALTO - Prueba vida real, no foto |
| **TSA RFC 3161** (sello tiempo) | No mencionado | CRÍTICO - Estándar internacional |
| **Firma PKI Art. 288 CCyC** | Mencionado de pasada | ALTO - Equivalencia firma manuscrita |
| **Protocolo lectura activa** | No mencionado | ALTO - Ataca "no lo leí" |
| **Pack Evidencia v2.0** | Genérico "pack" | MEDIO - Peritos verifican TSA |
| **Contingencia OTP** | No mencionado | MEDIO - Plan B siempre |
| **Sección para abogados** | No existe | CRÍTICO - Son influenciadores |

## AUDIENCIAS TARGET

### 1. PyMEs (decisores de compra)
- Dueños, gerentes RRHH
- Pain: miedo a juicios laborales, costo de perder
- Trigger: indemnización de $72M vs $89K/mes

### 2. Abogados Laboralistas (influenciadores críticos)
- Asesores de PyMEs, estudios jurídicos
- Pain: clientes sin evidencia, casos perdidos por falta de prueba
- Trigger: herramienta que les facilita ganar casos
- Necesitan: lenguaje técnico-legal, estándares internacionales, verificabilidad

## OBJETIVO DEL NUEVO LANDING

1. **Actualizar** secciones desactualizadas (biometría, pack evidencia)
2. **Agregar** features faltantes (TSA, protocolo lectura, contingencia)
3. **Crear sección para abogados** que:
   - Hable su idioma (RFC 3161, PKI, cadena de custodia)
   - Muestre cómo verificar evidencia (comandos OpenSSL)
   - Explique por qué Notificarte > carta documento
   - Invite a recomendar a sus clientes PyME

## INSTRUCCIONES

1. Lee el archivo src/app/page.tsx completo
2. Identifica secciones a actualizar vs crear nuevas
3. Propone estructura del nuevo landing
4. Prioriza:
   - Sección abogados (nueva)
   - Biometría AWS (actualizar)
   - TSA/PKI (agregar)
   - Protocolo lectura (agregar)
5. Mantén el tono actual (profesional pero accesible)
6. NO implementes aún, solo planifica

Pregunta si necesitas más contexto antes de proponer el plan.
