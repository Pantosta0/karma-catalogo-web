#!/usr/bin/env node
/**
 * Restaura el menú desde un backup JSON de .backups/.
 *
 *   node scripts/restore.mjs .backups/karma-YYYYMMDD-HHMMSS          # simulacro
 *   node scripts/restore.mjs .backups/karma-YYYYMMDD-HHMMSS --apply  # de verdad
 *
 * Hace upsert por id: no borra nada que no esté en el backup, así que volver a
 * correrlo es seguro. Lee las credenciales de .env.
 *
 * Si RLS ya está activo, la clave anon no podrá escribir: exporta
 * SUPABASE_ACCESS_TOKEN o usa el SQL Editor. Se avisa con el 401.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2];
const apply = process.argv.includes("--apply");

if (!dir || !existsSync(dir)) {
  console.error("Uso: node scripts/restore.mjs <carpeta-de-backup> [--apply]");
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync(".env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const URL = env.VITE_SUPABASE_URL;
const KEY = env.VITE_SUPABASE_ANON_KEY;
if (!URL || !KEY) {
  console.error("Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY en .env");
  process.exit(1);
}

// config primero: el resto no depende de ella, pero es la fila que más duele.
const TABLES = ["config", "categorias", "productos", "promos", "codigos"];
let failed = false;

for (const table of TABLES) {
  const file = join(dir, `${table}.json`);
  if (!existsSync(file)) {
    console.log(`  – ${table}: sin backup, se omite`);
    continue;
  }
  const rows = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`  – ${table}: 0 filas, se omite`);
    continue;
  }

  if (!apply) {
    console.log(`  · ${table}: ${rows.length} filas listas para upsert (simulacro)`);
    continue;
  }

  const res = await fetch(`${URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (res.ok) {
    console.log(`  ✓ ${table}: ${rows.length} filas restauradas`);
  } else {
    failed = true;
    const body = await res.text();
    console.error(`  ✗ ${table}: HTTP ${res.status} ${body.slice(0, 200)}`);
    if (res.status === 401 || res.status === 403) {
      console.error("    RLS está bloqueando la escritura anónima. Usa el SQL Editor.");
    }
  }
}

if (!apply) console.log("\nSimulacro. Añade --apply para escribir de verdad.");
process.exit(failed ? 1 : 0);
