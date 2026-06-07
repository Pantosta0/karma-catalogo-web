// Capa de datos respaldada por Supabase con fallback a localStorage.
// Si Supabase no está configurado, funciona localmente.

import { supabase } from "./supabase";

export type Category = { id: string; nombre: string };

export type Product = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  categorias: string[];
  foto: string; // base64 data url o url
  disponible: boolean;
};

export type BusinessConfig = {
  nombre: string;
  whatsapp: string; // formato internacional sin + (ej: 573001112233)
  logo: string;
};

export type AppState = {
  config: BusinessConfig;
  categorias: Category[];
  productos: Product[];
  adminAuth: { user: string; pass: string };
  adminSession: boolean;
};

// ─── Valores por defecto ──────────────────────────────────────────────────────

const DEFAULT_CATEGORIES: Category[] = [
  { id: "hamburguesas", nombre: "Hamburguesas" },
  { id: "asados", nombre: "Asados" },
  { id: "bebidas", nombre: "Bebidas" },
  { id: "combos", nombre: "Combos" },
];

export const DEFAULT_STATE: AppState = {
  config: {
    nombre: "Karma",
    whatsapp: "573001234567",
    logo: "",
  },
  categorias: DEFAULT_CATEGORIES,
  productos: [
    {
      id: "p1",
      nombre: "Karma Burger",
      descripcion: "Carne angus, queso cheddar, cebolla caramelizada y salsa secreta.",
      precio: 22000,
      categorias: ["hamburguesas"],
      foto: "",
      disponible: true,
    },
    {
      id: "p2",
      nombre: "Doble Karma",
      descripcion: "Doble carne, doble queso. Lo que te mereces.",
      precio: 28000,
      categorias: ["hamburguesas"],
      foto: "",
      disponible: true,
    },
    {
      id: "p3",
      nombre: "Asado de Tira",
      descripcion: "Asado a las brasas con chimichurri y papas rústicas.",
      precio: 38000,
      categorias: ["asados"],
      foto: "",
      disponible: true,
    },
    {
      id: "p4",
      nombre: "Combo Karma",
      descripcion: "Karma Burger + papas medianas + bebida.",
      precio: 32000,
      categorias: ["combos", "hamburguesas"],
      foto: "",
      disponible: true,
    },
    {
      id: "p5",
      nombre: "Limonada de Coco",
      descripcion: "Fresca, cremosa y con un toque de menta.",
      precio: 9000,
      categorias: ["bebidas"],
      foto: "",
      disponible: true,
    },
  ],
  adminAuth: { user: "kevin", pass: "Karma_2026_!" },
  adminSession: false,
};

// ─── Helpers localStorage (fallback) ─────────────────────────────────────────

const LS_KEY = "karma_app_v1";

function lsLoad(): AppState | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

function lsSave(state: AppState) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── Supabase: Cargar ─────────────────────────────────────────────────────────

export async function loadStateFromSupabase(): Promise<AppState> {
  try {
    const [configRes, catRes, prodRes] = await Promise.all([
      supabase.from("config").select("*").eq("id", 1).single(),
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("productos").select("*"),
    ]);

    if (configRes.error || catRes.error || prodRes.error) {
      console.warn("[Supabase] Error cargando datos, usando localStorage:", configRes.error || catRes.error || prodRes.error);
      return lsLoad() ?? DEFAULT_STATE;
    }

    const raw = configRes.data as {
      nombre: string; whatsapp: string; logo: string;
      admin_user: string; admin_pass: string;
    };

    const categorias: Category[] = (catRes.data ?? []).map((c: { id: string; nombre: string }) => ({
      id: c.id,
      nombre: c.nombre,
    }));

    const productos: Product[] = (prodRes.data ?? []).map((p: {
      id: string; nombre: string; descripcion: string; precio: number;
      categorias: string[] | null; categoria_id: string | null;
      foto: string; disponible: boolean;
    }) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precio: p.precio,
      // soporta schema nuevo (categorias text[]) y legacy (categoria_id text)
      categorias: Array.isArray(p.categorias) && p.categorias.length > 0
        ? p.categorias
        : p.categoria_id ? [p.categoria_id] : [],
      foto: p.foto ?? "",
      disponible: p.disponible,
    }));

    const state: AppState = {
      config: { nombre: raw.nombre, whatsapp: raw.whatsapp, logo: raw.logo ?? "" },
      categorias,
      productos,
      adminAuth: { user: raw.admin_user, pass: raw.admin_pass },
      adminSession: false,
    };

    lsSave(state); // cache local
    return state;
  } catch (err) {
    console.warn("[Supabase] Excepción al cargar, usando localStorage:", err);
    return lsLoad() ?? DEFAULT_STATE;
  }
}

// ─── Supabase: Guardar ────────────────────────────────────────────────────────

export async function saveStateToSupabase(state: AppState): Promise<void> {
  lsSave(state); // siempre cache local primero

  try {
    // Guardar config
    await supabase.from("config").upsert({
      id: 1,
      nombre: state.config.nombre,
      whatsapp: state.config.whatsapp,
      logo: state.config.logo,
      admin_user: state.adminAuth.user,
      admin_pass: state.adminAuth.pass,
    });

    // Sincronizar categorías: eliminar las que ya no están, insertar/actualizar nuevas
    const catIds = state.categorias.map((c) => c.id);

    // Eliminar categorías removidas
    await supabase.from("categorias").delete().not("id", "in", `(${catIds.map((id) => `'${id}'`).join(",") || "'__none__'"})`);

    // Upsert categorías actuales
    if (state.categorias.length > 0) {
      await supabase.from("categorias").upsert(
        state.categorias.map((c, i) => ({ id: c.id, nombre: c.nombre, orden: i }))
      );
    }

    // Sincronizar productos
    const prodIds = state.productos.map((p) => p.id);

    // Eliminar productos removidos
    await supabase.from("productos").delete().not("id", "in", `(${prodIds.map((id) => `'${id}'`).join(",") || "'__none__'"})`);

    // Upsert productos actuales
    if (state.productos.length > 0) {
      await supabase.from("productos").upsert(
        state.productos.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          descripcion: p.descripcion,
          precio: p.precio,
          categorias: p.categorias,
          foto: p.foto,
          disponible: p.disponible,
        }))
      );
    }
  } catch (err) {
    console.error("[Supabase] Error al guardar:", err);
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
