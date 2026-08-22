-- ============================================================================
-- Fase 1 — Bucket de imágenes
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo.
-- ============================================================================
--
-- Sustituye las fotos en base64 dentro de la fila de `productos`. El campo
-- `foto` sigue aceptando data URLs, así que las filas viejas no se rompen.
--
-- ⚠ NOTA DE SEGURIDAD SOBRE ESTA FASE
-- Todavía no existe Supabase Auth en la app, así que las subidas ocurren con la
-- clave anon. Las políticas de escritura de abajo incluyen el rol `anon` a
-- propósito, y eso significa que cualquiera que lea el bundle puede subir
-- archivos al bucket. Es acotado (5 MB, sólo imágenes) y desaparece en la
-- fase 2, donde se restringen a `authenticated`. No amplía el acceso a la base
-- de datos, que hoy ya está abierta porque RLS está deshabilitado.

-- ── Bucket ──────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,                                              -- lectura pública: el menú es público
  5242880,                                           -- 5 MB por archivo
  array['image/jpeg', 'image/png', 'image/webp']     -- sólo imágenes
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ── Políticas ───────────────────────────────────────────────────────────────
-- storage.objects ya tiene RLS activo por defecto en Supabase.

drop policy if exists "product-photos lectura publica" on storage.objects;
create policy "product-photos lectura publica"
  on storage.objects for select
  using (bucket_id = 'product-photos');

-- FASE 1: incluye anon. La fase 2 vuelve a crear estas tres sólo para
-- `authenticated` (ver 02-rls.sql).
drop policy if exists "product-photos insert" on storage.objects;
create policy "product-photos insert"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'product-photos');

drop policy if exists "product-photos update" on storage.objects;
create policy "product-photos update"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'product-photos');

drop policy if exists "product-photos delete" on storage.objects;
create policy "product-photos delete"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'product-photos');

-- ── Verificación ────────────────────────────────────────────────────────────
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'product-photos';
