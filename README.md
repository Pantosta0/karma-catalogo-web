# Karma Catálogo Web

Catálogo digital con carrito de compras y envío de pedidos por WhatsApp. Pensado para pequeños negocios que quieren una vitrina online sencilla y sin complicaciones.

## Qué hace

- **Catálogo filtrable por categorías** — cuadrícula tipo Instagram con foto, nombre y precio de cada producto.
- **Carrito con checkout por WhatsApp** — el cliente llena nombre, dirección, teléfono y medio de pago; la app arma el mensaje y abre WhatsApp con un solo clic.
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

Crea las siguientes tablas en tu proyecto de Supabase:

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

-- Productos
create table productos (
  id text primary key,
  nombre text,
  descripcion text,
  precio numeric,
  categoria_id text references categorias(id),
  foto text,
  disponible boolean default true
);
```

## Desarrollo local

```bash
# Instalar dependencias
bun install   # o npm install

# Servidor de desarrollo
bun run dev   # o npm run dev
```

La app queda en `http://localhost:5173`.

## Build y deploy

```bash
bun run build   # genera la carpeta dist/
```

### Cloudflare Pages

| Ajuste | Valor |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variables de entorno | `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` |

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
