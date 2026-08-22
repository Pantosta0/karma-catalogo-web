-- ============================================================================
-- Fase 2 — Autenticación y RLS
-- ============================================================================
--
-- NO EJECUTAR ENTERO DE UNA VEZ. Está dividido en pasos que se aplican y
-- verifican por separado; cada uno lleva su rollback al lado.
--
-- Requisito previo: existe un usuario en Supabase Auth y el login del panel
-- funciona con él. Sin eso, el paso 3 deja el panel sin poder escribir.
--
-- Qué cambia: hoy RLS está deshabilitado y la clave anon —que va dentro del
-- bundle público— puede leer y escribir todas las tablas. Al terminar, el menú
-- se sigue leyendo público y sólo un usuario autenticado puede modificarlo.


-- ─── PASO 0 · Preflight (sólo lectura, no cambia nada) ──────────────────────
-- Debe devolver al menos un usuario. Si devuelve 0, parar aquí.
select count(*) as usuarios_auth from auth.users;

-- Estado actual de RLS por tabla.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('config','categorias','productos','promos','codigos')
order by tablename;


-- ─── PASO 1 · Quitar las credenciales de la tabla config ────────────────────
-- Ya no las lee ni las escribe nadie: el panel usa Supabase Auth. Mientras
-- estas columnas existan, el hash sigue siendo legible por cualquier visitante.
--
-- Rollback: no lo hay, y no hace falta. Supabase Auth es la fuente de verdad.
-- Si quisieras volver atrás, restaura config desde .backups/.
alter table config drop column if exists admin_user;
alter table config drop column if exists admin_pass;


-- ─── PASO 2 · Contador de usos de códigos sin escritura anónima ─────────────
-- El catálogo incrementa usos_actuales cuando el cliente manda el pedido. Hoy
-- eso dispara un guardado completo del estado con la clave anon, que el paso 3
-- va a bloquear. Además dos pedidos simultáneos leen N y ambos escriben N+1,
-- así que se pierde un uso.
--
-- Esta función corre con los permisos de su dueño (security definer), toca una
-- sola columna de una sola fila, y el incremento es atómico.
create or replace function public.increment_code_usage(code_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update codigos
  set usos_actuales = usos_actuales + 1
  where id = code_id;
$$;

revoke all on function public.increment_code_usage(text) from public;
grant execute on function public.increment_code_usage(text) to anon, authenticated;

-- Rollback: drop function public.increment_code_usage(text);


-- ─── PASO 3 · RLS ───────────────────────────────────────────────────────────
-- Lectura pública en todo (el menú es público). Escritura sólo autenticada.
--
-- Rollback inmediato si algo sale mal, tabla por tabla:
--   alter table productos disable row level security;
--
-- Aplicar UNA TABLA A LA VEZ y comprobar que el menú sigue cargando entre cada
-- una. `productos` es la que más duele si se equivoca.

-- config
alter table config enable row level security;
drop policy if exists "config lectura publica" on config;
create policy "config lectura publica" on config for select using (true);
drop policy if exists "config escritura autenticada" on config;
create policy "config escritura autenticada" on config for all
  to authenticated using (true) with check (true);

-- categorias
alter table categorias enable row level security;
drop policy if exists "categorias lectura publica" on categorias;
create policy "categorias lectura publica" on categorias for select using (true);
drop policy if exists "categorias escritura autenticada" on categorias;
create policy "categorias escritura autenticada" on categorias for all
  to authenticated using (true) with check (true);

-- productos
alter table productos enable row level security;
drop policy if exists "productos lectura publica" on productos;
create policy "productos lectura publica" on productos for select using (true);
drop policy if exists "productos escritura autenticada" on productos;
create policy "productos escritura autenticada" on productos for all
  to authenticated using (true) with check (true);

-- promos
alter table promos enable row level security;
drop policy if exists "promos lectura publica" on promos;
create policy "promos lectura publica" on promos for select using (true);
drop policy if exists "promos escritura autenticada" on promos;
create policy "promos escritura autenticada" on promos for all
  to authenticated using (true) with check (true);

-- codigos
-- Lectura pública porque el carrito valida el código en el cliente. Eso expone
-- la lista de códigos a quien mire la red — aceptable para descuentos de menú,
-- pero conviene saberlo. La alternativa sería validar por RPC.
alter table codigos enable row level security;
drop policy if exists "codigos lectura publica" on codigos;
create policy "codigos lectura publica" on codigos for select using (true);
drop policy if exists "codigos escritura autenticada" on codigos;
create policy "codigos escritura autenticada" on codigos for all
  to authenticated using (true) with check (true);


-- ─── PASO 4 · Cerrar la escritura anónima en Storage ────────────────────────
-- La fase 1 dejó `anon` en las políticas de escritura porque todavía no había
-- sesión. Ya la hay.
drop policy if exists "product-photos insert" on storage.objects;
create policy "product-photos insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos');

drop policy if exists "product-photos update" on storage.objects;
create policy "product-photos update"
  on storage.objects for update to authenticated
  using (bucket_id = 'product-photos');

drop policy if exists "product-photos delete" on storage.objects;
create policy "product-photos delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos');


-- ─── PASO 5 · Verificación ──────────────────────────────────────────────────
select tablename, rowsecurity from pg_tables
where schemaname='public' and tablename in ('config','categorias','productos','promos','codigos')
order by tablename;

select tablename, policyname, cmd, roles::text from pg_policies
where schemaname='public' order by tablename, policyname;
