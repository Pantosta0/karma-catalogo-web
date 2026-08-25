-- ============================================================================
-- Fase 4 — Datos que necesita la portada
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo.
-- ============================================================================
--
-- "/" deja de redirigir al menú y pasa a ser la portada de marca. Esa página
-- muestra tres cosas que hoy no existen en ningún lado:
--
--   · dónde queda el negocio      -> config.direccion
--   · el Instagram                -> config.instagram
--   · qué platos abren la marca   -> productos.destacado
--
-- Las tres son datos del negocio, no del código. La dirección cambia si se
-- mudan, el Instagram si cambian de cuenta, y los destacados cada vez que
-- quieran liderar con otra cosa — nada de eso debería necesitar un despliegue.
--
-- Todas nacen vacías y la portada las trata como opcionales: sin dirección no
-- se pinta una línea en blanco, se omite la línea. Así esto se puede aplicar
-- hoy y llenarse cuando haya tiempo.
--
-- Permisos: no hay que tocar políticas. `config` y `productos` ya tienen RLS de
-- la fase 2 —lectura pública, escritura sólo autenticada— y una columna nueva
-- hereda las políticas de su tabla.


-- ─── PASO 1 · Dirección e Instagram ─────────────────────────────────────────
-- Texto vacío y no NULL, igual que `icono` en la fase 3: el cliente ya trata ''
-- como "no configurado", y un solo caso vacío es más fácil de sostener que dos.
--
-- `instagram` guarda el usuario pelado (ej: 'karma.food'), sin @ y sin URL. La
-- portada arma el enlace. Guardar la URL completa invita a que un día entre
-- pegada con parámetros de campaña y se vuelva imposible de mostrar como texto.
--
-- Rollback: alter table config drop column direccion, drop column instagram;
alter table config add column if not exists direccion text not null default '';
alter table config add column if not exists instagram text not null default '';


-- ─── PASO 2 · Platos destacados ─────────────────────────────────────────────
-- Qué platos abren la portada. Por defecto ninguno: la portada cae en los
-- primeros tres disponibles que tengan foto, así que se ve bien desde el primer
-- día y mejora en cuanto alguien marque los suyos desde el panel.
--
-- Rollback: alter table productos drop column destacado;
alter table productos add column if not exists destacado boolean not null default false;


-- ─── Verificación ───────────────────────────────────────────────────────────
-- La primera fila debe traer direccion e instagram (vacías está bien).
select nombre, direccion, instagram from config where id = 1;

-- Y esta, la columna destacado en cada plato.
select nombre, destacado from productos order by nombre;
