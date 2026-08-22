import type { Product, PromoCode } from "./storage";

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

/** Descuento en pesos que aporta un código sobre una base dada. */
export function calcCodeDiscount(code: PromoCode, base: number): number {
  if (code.descuento_tipo === "porcentaje") {
    return Math.round((base * code.descuento_valor) / 100);
  }
  // Un monto fijo nunca puede dejar el subtotal en negativo.
  return Math.min(code.descuento_valor, base);
}

/** Valida un código escrito por el cliente contra la lista vigente. */
export function validateCode(
  input: string,
  codes: PromoCode[],
): { ok: true; code: PromoCode } | { ok: false; error: string } {
  const hoy = today();
  const found = codes.find((c) => c.code === input.toUpperCase().trim());
  if (!found) return { ok: false, error: "Código no válido" };
  if (!found.activo) return { ok: false, error: "Este código no está activo" };
  if (found.limite_tiempo && (hoy < found.desde || hoy > found.hasta))
    return { ok: false, error: "Código fuera de su período de validez" };
  if (found.limite_usos && found.usos_actuales >= found.usos_maximos)
    return { ok: false, error: "Este código ya agotó sus usos disponibles" };
  return { ok: true, code: found };
}
