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
  descuento_pct: number;   // 0-100 %, 0 = sin descuento
  descuento_hasta: string; // "YYYY-MM-DD" o "" si no vence
};

export type PromoCode = {
  id: string;
  code: string;              // ej: "KARMA20" (se compara en mayúsculas)
  descripcion: string;
  descuento_tipo: "porcentaje" | "fijo"; // % sobre el subtotal o monto fijo
  descuento_valor: number;
  limite_usos: boolean;
  usos_maximos: number;
  usos_actuales: number;
  limite_tiempo: boolean;
  desde: string;             // "YYYY-MM-DD"
  hasta: string;             // "YYYY-MM-DD"
  activo: boolean;
};

// Horario de un día: abierto/cerrado + franja horaria
export type DaySchedule = {
  open: boolean;
  from: string; // "HH:MM"
  to: string;   // "HH:MM"
};

export type BusinessConfig = {
  nombre: string;
  whatsapp: string;       // formato internacional sin + (ej: 573001112233)
  logoSquare: string;     // icono/marca cuadrado — loading screen, login y favicon
  logoRect: string;       // logo rectangular — header
  seoDescription: string; // meta description y og:description
  ogImage: string;         // URL absoluta de imagen para og:image (redes sociales)
  deliveryFee: number;     // costo de domicilio en COP
  schedule: DaySchedule[]; // 7 entradas [0=Dom, 1=Lun, ..., 6=Sáb]
};

export type Promo = {
  id: string;
  activo: boolean;
  titulo: string;
  descripcion: string;
  imagen: string;  // data URL opcional
  desde: string;   // "YYYY-MM-DD"
  hasta: string;   // "YYYY-MM-DD"
};

export type AppState = {
  config: BusinessConfig;
  categorias: Category[];
  productos: Product[];
  promos: Promo[];
  codes: PromoCode[];
  /** Hay una sesión de Supabase Auth activa. Las credenciales ya no viven
   *  en la tabla config: las gestiona Supabase Auth. */
  adminSession: boolean;
};

// ─── Valores por defecto ──────────────────────────────────────────────────────

export const DEFAULT_SCHEDULE: DaySchedule[] = [
  { open: false, from: "12:00", to: "22:00" }, // 0 Domingo
  { open: true,  from: "12:00", to: "22:00" }, // 1 Lunes
  { open: true,  from: "12:00", to: "22:00" }, // 2 Martes
  { open: true,  from: "12:00", to: "22:00" }, // 3 Miércoles
  { open: true,  from: "12:00", to: "22:00" }, // 4 Jueves
  { open: true,  from: "12:00", to: "22:00" }, // 5 Viernes
  { open: true,  from: "12:00", to: "23:00" }, // 6 Sábado
];

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
    logoSquare: "",
    logoRect: "",
    seoDescription: "Restaurante de comida rápida y asados. Pide directo por WhatsApp.",
    ogImage: "",
    deliveryFee: 5000,
    schedule: DEFAULT_SCHEDULE,
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
      descuento_pct: 0,
      descuento_hasta: "",
    },
    {
      id: "p2",
      nombre: "Doble Karma",
      descripcion: "Doble carne, doble queso. Lo que te mereces.",
      precio: 28000,
      categorias: ["hamburguesas"],
      foto: "",
      disponible: true,
      descuento_pct: 0,
      descuento_hasta: "",
    },
    {
      id: "p3",
      nombre: "Asado de Tira",
      descripcion: "Asado a las brasas con chimichurri y papas rústicas.",
      precio: 38000,
      categorias: ["asados"],
      foto: "",
      disponible: true,
      descuento_pct: 0,
      descuento_hasta: "",
    },
    {
      id: "p4",
      nombre: "Combo Karma",
      descripcion: "Karma Burger + papas medianas + bebida.",
      precio: 32000,
      categorias: ["combos", "hamburguesas"],
      foto: "",
      disponible: true,
      descuento_pct: 0,
      descuento_hasta: "",
    },
    {
      id: "p5",
      nombre: "Limonada de Coco",
      descripcion: "Fresca, cremosa y con un toque de menta.",
      precio: 9000,
      categorias: ["bebidas"],
      foto: "",
      disponible: true,
      descuento_pct: 0,
      descuento_hasta: "",
    },
  ],
  promos: [],
  codes: [],
  adminSession: false,
};

// ─── Helpers localStorage (fallback) ─────────────────────────────────────────

const LS_KEY = "karma_app_v1";

export function loadCachedState(): AppState | null {
  const s = lsLoad();
  return s ? normalizeState(s) : null;
}

/** Rellena campos nuevos que pueden faltar en estados guardados en versiones anteriores */
function normalizeState(s: AppState): AppState {
  return {
    ...s,
    codes: s.codes ?? [],
    promos: s.promos ?? [],
    config: {
      ...s.config,
      deliveryFee: s.config.deliveryFee ?? 5000,
      seoDescription: s.config.seoDescription ?? "",
      ogImage: s.config.ogImage ?? "",
      schedule: s.config.schedule ?? DEFAULT_SCHEDULE,
    },
    productos: (s.productos ?? []).map((p) => ({
      ...p,
      descuento_pct: p.descuento_pct ?? 0,
      descuento_hasta: p.descuento_hasta ?? "",
    })),
  };
}

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

/** ¿Hay sesión de Supabase Auth? Sustituye al flag en sessionStorage. */
async function hasActiveSession(): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  } catch {
    return false;
  }
}

export async function loadStateFromSupabase(): Promise<AppState> {
  const hasSession = await hasActiveSession();
  try {
    const [configRes, catRes, prodRes] = await Promise.all([
      supabase.from("config").select("*").eq("id", 1).single(),
      supabase.from("categorias").select("*").order("orden"),
      supabase.from("productos").select("*"),
    ]);

    if (configRes.error || catRes.error || prodRes.error) {
      console.warn("[Supabase] Error cargando datos, usando localStorage:", configRes.error || catRes.error || prodRes.error);
      const cached = normalizeState(lsLoad() ?? DEFAULT_STATE);
      return { ...cached, adminSession: await hasActiveSession() };
    }

    const raw = configRes.data as {
      nombre: string; whatsapp: string;
      logo_square: string; logo_rect: string;
      seo_description: string;
      og_image: string;
      delivery_fee: number | null;
      schedule: DaySchedule[] | null;
    };

    const categorias: Category[] = (catRes.data ?? []).map((c: { id: string; nombre: string }) => ({
      id: c.id,
      nombre: c.nombre,
    }));

    const productos: Product[] = (prodRes.data ?? []).map((p: {
      id: string; nombre: string; descripcion: string; precio: number;
      categorias: string[] | null; categoria_id: string | null;
      foto: string; disponible: boolean;
      descuento_pct?: number; descuento_hasta?: string;
    }) => ({
      id: p.id,
      nombre: p.nombre,
      descripcion: p.descripcion ?? "",
      precio: p.precio,
      categorias: Array.isArray(p.categorias) && p.categorias.length > 0
        ? p.categorias
        : p.categoria_id ? [p.categoria_id] : [],
      foto: p.foto ?? "",
      disponible: p.disponible,
      descuento_pct: p.descuento_pct ?? 0,
      descuento_hasta: p.descuento_hasta ?? "",
    }));

    // Promos — tabla opcional, falla silenciosamente si no existe todavía
    let promos: Promo[] = [];
    try {
      const promoRes = await supabase.from("promos").select("*");
      if (!promoRes.error && promoRes.data) promos = promoRes.data as Promo[];
    } catch { /* tabla aún no creada */ }

    // Códigos promo — tabla opcional
    let codes: PromoCode[] = [];
    try {
      const codesRes = await supabase.from("codigos").select("*");
      if (!codesRes.error && codesRes.data) codes = codesRes.data as PromoCode[];
    } catch { /* tabla aún no creada */ }

    // Usamos la caché de localStorage como segundo fallback para campos que
    // todavía no existan en Supabase (ej: schedule antes de correr el ALTER TABLE).
    // Así no sobreescribimos lo que el usuario había guardado.
    const cached = lsLoad();

    const state: AppState = {
      config: {
        nombre: raw.nombre,
        whatsapp: raw.whatsapp,
        logoSquare: raw.logo_square ?? "",
        logoRect: raw.logo_rect ?? "",
        seoDescription: raw.seo_description ?? "",
        ogImage: raw.og_image ?? "",
        deliveryFee: raw.delivery_fee ?? cached?.config?.deliveryFee ?? 5000,
        schedule: Array.isArray(raw.schedule) && raw.schedule.length === 7
          ? raw.schedule
          : Array.isArray(cached?.config?.schedule) && cached.config.schedule.length === 7
            ? cached.config.schedule
            : DEFAULT_SCHEDULE,
      },
      categorias,
      productos,
      promos,
      codes,
      adminSession: hasSession,
    };

    lsSave(state);
    return state;
  } catch (err) {
    console.warn("[Supabase] Excepción al cargar, usando localStorage:", err);
    const cached = normalizeState(lsLoad() ?? DEFAULT_STATE);
    return { ...cached, adminSession: await hasActiveSession() };
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
      logo_square: state.config.logoSquare,
      logo_rect: state.config.logoRect,
      seo_description: state.config.seoDescription,
      og_image: state.config.ogImage,
      delivery_fee: state.config.deliveryFee,
      schedule: state.config.schedule,
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
          descuento_pct: p.descuento_pct ?? 0,
          descuento_hasta: p.descuento_hasta ?? "",
        }))
      );
    }
    // Sincronizar promos
    try {
      const promoIds = state.promos.map((p) => p.id);
      if (promoIds.length > 0) {
        await supabase.from("promos").delete().not("id", "in", `(${promoIds.map((id) => `'${id}'`).join(",")})`);
        await supabase.from("promos").upsert(state.promos);
      } else {
        await supabase.from("promos").delete().neq("id", "__none__");
      }
    } catch { /* tabla aún no creada */ }

    // Sincronizar códigos promo
    try {
      const codeIds = state.codes.map((c) => c.id);
      if (codeIds.length > 0) {
        await supabase.from("codigos").delete().not("id", "in", `(${codeIds.map((id) => `'${id}'`).join(",")})`);
        await supabase.from("codigos").upsert(state.codes);
      } else {
        await supabase.from("codigos").delete().neq("id", "__none__");
      }
    } catch { /* tabla aún no creada */ }
  } catch (err) {
    console.error("[Supabase] Error al guardar:", err);
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
