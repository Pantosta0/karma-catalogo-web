-- ============================================================================
-- Fase 3 — Icono por categoría
-- Ejecutar en Supabase → SQL Editor. Es idempotente: se puede correr de nuevo.
-- ============================================================================
--
-- El menú deja de abrir con la parrilla completa de productos y pasa a abrir
-- con una cuadrícula de categorías. Cada categoría necesita un icono, y las
-- categorías las crea el dueño desde el panel — no son una lista fija en el
-- código. Un mapa `id -> icono` escrito a mano se rompería el día que alguien
-- añada «Postres» desde el panel, así que el icono tiene que ser un dato más
-- de la fila.
--
-- Qué guarda la columna: el nombre de un icono de lucide-react
-- (ej: 'Beef', 'CupSoda'), no un SVG ni una URL. El panel sólo deja elegir de
-- una lista curada en `src/lib/category-icons.ts`, y el cliente resuelve
-- cualquier valor desconocido —o vacío— a un icono por defecto. Por eso la
-- columna no lleva CHECK: la lista curada puede cambiar sin migrar la base, y
-- un valor viejo nunca deja la interfaz rota.
--
-- Permisos: no hace falta tocar políticas. `categorias` ya tiene RLS de la
-- fase 2 — lectura pública, escritura sólo para `authenticated`— y una columna
-- nueva hereda las políticas de la tabla.


-- ─── PASO 1 · La columna ────────────────────────────────────────────────────
-- NOT NULL con default '' y no NULL a secas: el cliente ya trata '' como
-- "sin icono, usa el de por defecto", así que un solo caso vacío en vez de dos.
--
-- Rollback: alter table categorias drop column icono;
alter table categorias
  add column if not exists icono text not null default '';


-- ─── PASO 2 · Sembrar las categorías que ya existen ─────────────────────────
-- Sin esto toda categoría anterior a la migración sale con el icono genérico.
-- Sólo toca filas que aún no tienen icono, así que correrlo dos veces no pisa
-- lo que el dueño haya elegido a mano — y por eso cambiar un icono desde el
-- panel es definitivo aunque alguien vuelva a correr este archivo.
--
-- Son propuestas, no decisiones: cualquiera se cambia con un toque en
-- Panel → Categorías. Las que no aparezcan aquí salen con el icono genérico,
-- que es una señal legítima de "falta elegir este".
update categorias set icono = 'Beef'      where icono = '' and id like 'hamburguesas%';
update categorias set icono = 'Flame'     where icono = '' and id like 'asados%';
update categorias set icono = 'Wheat'     where icono = '' and id like 'desgranados%';
update categorias set icono = 'Drumstick' where icono = '' and id like 'picadas%';
update categorias set icono = 'CupSoda'   where icono = '' and id like 'bebidas%';
update categorias set icono = 'Gift'      where icono = '' and id like 'combos%';


-- ─── Verificación ───────────────────────────────────────────────────────────
-- Debe listar la columna `icono` en cada fila.
select id, nombre, orden, icono
from categorias
order by orden;
