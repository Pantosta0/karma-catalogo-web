# Routes

TanStack Router uses **file-based routing**. Every `.tsx` file in this directory
is a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

There is no SSR: the app renders entirely on the client (`src/main.tsx`) and
ships as a static SPA. A route's `head()` only updates the tab that is already
open — what Google, WhatsApp and Instagram read lives in `index.html`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `menu/route.tsx` | layout for `/menu*` — wraps `menu/index.tsx` and `menu/$categoria.tsx` via `<Outlet />`, and keeps the header, pill bar and cart mounted across them |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.
