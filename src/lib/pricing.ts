import type { Product } from "./storage";
import { supabase } from "./supabase";

/**
 * Reglas de precio, en un solo sitio.
 *
 * Antes vivían duplicadas: el catálogo tenía getDiscountedPrice/isDiscounted y
 * el panel recalculaba el mismo descuento a mano dentro del JSX para la vista
 * previa. Dos copias de la misma regla se separan en cuanto una cambia, y aquí
 * la que se separa decide lo que cobra el negocio.
 */

/** Fecha de hoy en formato "YYYY-MM-DD", que es como se guardan los límites. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Precio efectivo de un producto, aplicando su descuento si sigue vigente. */
export function getDiscountedPrice(p: Product): number {
  return applyPercent(p.precio, activeDiscountPct(p));
}

/** Porcentaje de descuento vigente hoy: 0 si no tiene o si ya venció. */
export function activeDiscountPct(p: Product): number {
  if (!p.descuento_pct || p.descuento_pct <= 0) return 0;
  if (p.descuento_hasta && today() > p.descuento_hasta) return 0;
  return p.descuento_pct;
}

export function isDiscounted(p: Product): boolean {
  return getDiscountedPrice(p) < p.precio;
}

/** Aplica un porcentaje a un precio. Redondea al peso, que es la unidad real. */
export function applyPercent(precio: number, pct: number): number {
  if (!pct) return precio;
  const clamped = Math.min(100, Math.max(0, pct));
  return Math.round(precio * (1 - clamped / 100));
}

/**
 * Lo que el carrito necesita de un código. Deliberadamente menos que la fila
 * completa: usos_actuales, usos_maximos y las fechas no salen nunca del
 * servidor.
 */
export type AppliedCode = {
  id: string;
  code: string;
  descuento_tipo: "porcentaje" | "fijo";
  descuento_valor: number;
};

/** Descuento en pesos que aporta un código sobre una base dada. */
export function calcCodeDiscount(code: AppliedCode, base: number): number {
  if (code.descuento_tipo === "porcentaje") {
    return Math.round((base * code.descuento_valor) / 100);
  }
  // Un monto fijo nunca puede dejar el subtotal en negativo.
  return Math.min(code.descuento_valor, base);
}

/**
 * Valida un código contra el servidor.
 *
 * Antes se comparaba contra `state.codes`, lo que obligaba a mandar la lista
 * completa de códigos al navegador de cualquier visitante. Ahora sólo viaja el
 * código escrito y vuelve el veredicto, así que `codigos` no necesita lectura
 * pública. La validación de fechas ocurre en hora de Bogotá, no UTC.
 */
export async function validateCode(
  input: string,
): Promise<{ ok: true; code: AppliedCode } | { ok: false; error: string }> {
  const { data, error } = await supabase.rpc("validate_promo_code", {
    p_code: input.toUpperCase().trim(),
  });

  if (error) {
    console.warn("[promo] fallo al validar:", error.message);
    return { ok: false, error: "No se pudo validar el código. Intenta de nuevo." };
  }
  const res = data as { ok: boolean; error?: string; code?: AppliedCode };
  return res?.ok && res.code
    ? { ok: true, code: res.code }
    : { ok: false, error: res?.error ?? "Código no válido" };
}
