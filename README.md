# Karma — Catálogo Web

Catálogo digital con carrito de compras y envío de pedidos por WhatsApp. Pensado para restaurantes y negocios de comida rápida.

## Qué hace

- **Catálogo filtrable por categorías** — cuadrícula con foto, nombre y precio de cada producto.
- **Productos en múltiples categorías** — un producto puede aparecer en Hamburguesas y también en Promociones al mismo tiempo.
- **Carrito con checkout por WhatsApp** — el cliente llena nombre, dirección, teléfono y medio de pago; la app arma el mensaje y abre WhatsApp con un clic.
- **Panel de administración** (`/admin`) — CRUD de productos, categorías y configuración del negocio (nombre, WhatsApp, logo). Protegido con usuario y contraseña.
- **Persistencia dual** — usa Supabase como base de datos principal y `localStorage` como caché/fallback automático si Supabase no está disponible.

## Stack

| Capa | Tecnología |
|---|---|
| UI | React 19 + Tailwind CSS v4 + shadcn/ui |
| Routing | TanStack Router (file-based) |
| Data fetching | TanStack Query |
| Backend / DB | Supabase (PostgreSQL) |
| Build | Vite 7 |
| Deploy | Cloudflare Pages |

## Configuración

Copia `.env.example` a `.env` y completa tus credenciales de Supabase:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://<tu-proyecto>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

Obtén estos valores en [supabase.com](https://supabase.com) → tu proyecto → **Settings → API**.

> Si no configuras Supabase, la app funciona igual usando `localStorage` como almacenamiento.

## Base de datos (Supabase)

Crea las siguientes tablas en el **SQL Editor** de tu proyecto:

```sql
-- Configuración del negocio
create table config (
  id integer primary key,
  nombre text,
  whatsapp text,
  logo text,
  admin_user text,
  admin_pass text
);

-- Categorías
create table categorias (
  id text primary key,
  nombre text,
  orden integer default 0
);

-- Productos (categorias es un array de IDs)
create table productos (
  id text primary key,
  nombre text,
  descripcion text,
  precio numeric,
  categorias text[],
  foto text,
  disponible boolean default true
);

-- Deshabilitar RLS (la app usa la anon key para leer y escribir)
alter table config disable row level security;
alter table categorias disable row level security;
alter table productos disable row level security;

-- Fila inicial de config
insert into config (id, nombre, whatsapp, logo, admin_user, admin_pass)
values (1, 'Karma', '573001234567', '', 'kevin', 'Karma_2026_!');
```

## Desarrollo local

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`.

## Build y deploy

```bash
npm run build   # genera la carpeta dist/
```

### Cloudflare Pages

| Ajuste | Valor |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` |
| Variable `VITE_SUPABASE_URL` | URL de tu proyecto Supabase |
| Variable `VITE_SUPABASE_ANON_KEY` | Anon key de tu proyecto Supabase |

El archivo `public/_redirects` ya está incluido para que el SPA funcione correctamente en todas las rutas.

Para conectar tu dominio: Cloudflare Pages → tu proyecto → **Custom domains**. Si el dominio ya está en Cloudflare lo detecta y agrega el CNAME automáticamente.

## Estructura del proyecto

```
src/
├── components/ui/     # Componentes shadcn/ui
├── hooks/             # Hooks reutilizables
├── lib/
│   ├── app-store.ts   # Estado global (React context)
│   ├── cart.ts        # Lógica del carrito
│   ├── storage.ts     # Capa de datos (Supabase + localStorage)
│   └── supabase.ts    # Cliente de Supabase
└── routes/
    ├── index.tsx      # Catálogo público
    ├── admin.tsx      # Panel de administración
    └── politica-de-privacidad-y-uso-de-datos.tsx
```
