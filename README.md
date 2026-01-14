# NotiLegal

El torniquete digital para PyMEs argentinas. Sistema de notificación fehaciente de sanciones laborales.

## Setup Rápido

### 1. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) y crear cuenta/proyecto
2. Copiar la URL y la anon key desde **Settings > API**
3. Configurar en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Crear tablas en Supabase

1. Ir a **SQL Editor** en el dashboard de Supabase
2. Copiar y ejecutar el contenido de `supabase/schema.sql`

### 3. Configurar Auth

1. En Supabase: **Authentication > Providers**
2. Habilitar "Email" (magic link)
3. En **Email Templates**, personalizar el template en español (opcional)

### 4. Iniciar el proyecto

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Estructura del Proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/           # Dashboard protegido
│   │   ├── empleados/         # CRUD empleados
│   │   ├── sanciones/         # Lista y nueva sanción
│   │   └── onboarding/        # Crear empresa
│   ├── auth/callback/         # Callback de auth
│   └── ver/[id]/              # Vista pública de notificación
├── components/
│   ├── ui/                    # Componentes shadcn/ui
│   └── layout/                # Sidebar, header
└── lib/
    ├── supabase/              # Clientes de Supabase
    ├── types.ts               # Tipos TypeScript
    └── validators.ts          # Validadores (CUIL, etc)
```

## Stack Técnico

- **Framework**: Next.js 16 (App Router)
- **Estilos**: Tailwind CSS + shadcn/ui
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (Magic Link)
- **Lenguaje**: TypeScript

## Roadmap

- [x] Día 1: Setup proyecto + Supabase + Auth
- [ ] Día 2: Branding + Login + Onboarding
- [ ] Día 3: CRUD Empleados
- [ ] Día 4: Formulario sanción + PDF
- [ ] Día 5: Twilio SMS + SendGrid Email
- [ ] Día 6: Página pública + Tracking
- [ ] Día 7: Dashboard + Testing + Deploy

## Deploy

La forma más fácil de deployar es usar [Vercel](https://vercel.com):

1. Conectar el repo de GitHub
2. Configurar las variables de entorno en Vercel
3. Deploy automático en cada push
