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
-- Configuración del negocio (una sola fila, id = 1)
create table config (
  id              integer primary key,
  nombre          text,
  whatsapp        text,          -- internacional sin "+", ej: 573001112233
  logo_square     text,          -- data URL — loading, login y favicon
  logo_rect       text,          -- data URL — header
  seo_description text,
  og_image        text,
  delivery_fee    numeric default 5000,
  schedule        jsonb,         -- 7 entradas [0=Dom .. 6=Sáb] {open, from, to}
  admin_user      text,
  admin_pass      text           -- hash SHA-256 (ver aviso de seguridad abajo)
);

-- Categorías
create table categorias (
  id     text primary key,
  nombre text,
  orden  integer default 0
);

-- Productos (categorias es un array de IDs)
create table productos (
  id              text primary key,
  nombre          text,
  descripcion     text,
  precio          numeric,
  categorias      text[],
  foto            text,            -- data URL base64 o URL
  disponible      boolean default true,
  descuento_pct   integer default 0,
  descuento_hasta text default ''  -- "YYYY-MM-DD" o "" si no vence
);

-- Popups promocionales
create table promos (
  id          text primary key,
  activo      boolean default true,
  titulo      text,
  descripcion text,
  imagen      text,
  desde       text,   -- "YYYY-MM-DD"
  hasta       text
);

-- Códigos de descuento
create table codigos (
  id              text primary key,
  code            text,
  descripcion     text,
  descuento_tipo  text,    -- 'porcentaje' | 'fijo'
  descuento_valor numeric,
  limite_usos     boolean default false,
  usos_maximos    integer default 0,
  usos_actuales   integer default 0,
  limite_tiempo   boolean default false,
  desde           text,
  hasta           text,
  activo          boolean default true
);

alter table config     disable row level security;
alter table categorias disable row level security;
alter table productos  disable row level security;
alter table promos     disable row level security;
alter table codigos    disable row level security;

-- Fila inicial de config
insert into config (id, nombre, whatsapp, admin_user, admin_pass, delivery_fee)
values (1, 'Karma', '573001234567', 'kevin', '', 5000);
```

`promos` y `codigos` son opcionales: si no existen, la app las ignora y el resto
sigue funcionando.

> **Aviso de seguridad.** Con RLS deshabilitado y `select("*")` sobre `config`,
> `admin_user` y `admin_pass` viajan al navegador de **cualquier** visitante del
> menú, y la verificación de login ocurre en el cliente. El hash de la contraseña
> es legible por cualquiera. Antes de promocionar el sitio hay que mover la
> autenticación a Supabase Auth, o crear una política RLS que excluya esas dos
> columnas del rol `anon`.

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

### Cloudflare Workers

El deploy real lo hace `.github/workflows/deploy.yml` en cada push a `master`,
usando `wrangler.toml`. No es Cloudflare Pages: es un Worker que sirve `dist/`
como assets estáticos (`worker.ts`) y fuerza `no-cache` sobre el HTML para que
un deploy nuevo se vea de inmediato.

| Ajuste | Valor |
|---|---|
| Entrada del Worker | `worker.ts` |
| Directorio de assets | `dist` |
| Routing SPA | `not_found_handling = "single-page-application"` en `wrangler.toml` |
| Dominio | `karmaclub.food` (custom domain, ya configurado) |
| Node.js | `20` |
| Secretos | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` en el environment `Deploy` |

El repo también incluye un `netlify.toml` con el fallback SPA equivalente, por si
se despliega en Netlify en vez de Cloudflare.

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
