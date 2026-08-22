import { useEffect, useMemo, useState } from "react";
import type { Product } from "./storage";

export type CartItem = { product: Product; cantidad: number };

/** Lo que se persiste: solo id + cantidad. */
type StoredLine = { id: string; cantidad: number };

const CART_KEY = "karma_cart_v1";
const MAX_QTY = 99;

function loadLines(): StoredLine[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is StoredLine =>
          !!l && typeof l === "object" &&
          typeof (l as StoredLine).id === "string" &&
          Number.isFinite((l as StoredLine).cantidad),
      )
      .map((l) => ({ id: l.id, cantidad: clampQty(l.cantidad) }))
      .filter((l) => l.cantidad > 0);
  } catch {
    return [];
  }
}

function saveLines(lines: StoredLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  } catch {
    /* modo privado o cuota llena — el carrito sigue vivo en memoria */
  }
}

function clampQty(n: number): number {
  return Math.min(MAX_QTY, Math.max(0, Math.floor(n)));
}

// ─── Store compartido ────────────────────────────────────────────────────────
//
// El carrito vive en el módulo, no dentro del componente que llama al hook.
//
// Con el menú repartido en varias rutas (/menu, /menu/$categoria) hay más de un
// consumidor montado a la vez: la insignia flotante y la hoja del carrito viven
// en el layout, y los botones de "agregar" en la ruta hija. Con estado local
// cada uno tendría su propia copia — la insignia no vería lo que agrega la
// tarjeta, y ambos escribirían el mismo localStorage pisándose.
//
// Mismo patrón que `app-store.ts`: una copia en memoria, un Set de listeners y
// una función que notifica.

let lines: StoredLine[] = typeof window === "undefined" ? [] : loadLines();
const listeners = new Set<(l: StoredLine[]) => void>();

/** Ya se descartaron las líneas huérfanas en esta carga de página. Vive en el
 *  módulo y no en un ref: si no, la poda volvería a correr en cada navegación
 *  entre categorías, que es justo lo que el store viene a evitar. */
let pruned = false;

function commit(next: StoredLine[]) {
  lines = next;
  saveLines(lines);
  listeners.forEach((l) => l(lines));
}

function addLine(product: Product, cantidad = 1) {
  const ex = lines.find((l) => l.id === product.id);
  commit(
    ex
      ? lines.map((l) =>
          l.id === product.id ? { ...l, cantidad: clampQty(l.cantidad + cantidad) } : l,
        )
      : [...lines, { id: product.id, cantidad: clampQty(cantidad) }],
  );
}

function setLineQty(id: string, cantidad: number) {
  const q = clampQty(cantidad);
  commit(
    q <= 0
      ? lines.filter((l) => l.id !== id)
      : lines.map((l) => (l.id === id ? { ...l, cantidad: q } : l)),
  );
}

function removeLine(id: string) {
  commit(lines.filter((l) => l.id !== id));
}

function clearLines() {
  commit([]);
}

/**
 * Carrito persistido en localStorage y compartido entre rutas.
 *
 * Guarda únicamente id + cantidad, nunca una copia del producto: así el precio,
 * la foto y el descuento salen siempre del catálogo actual y un pedido no puede
 * enviarse con datos viejos. Las líneas cuyo producto ya no existe o quedó no
 * disponible se descartan en cuanto el catálogo termina de cargar.
 *
 * Las funciones que mutan son del módulo, así que su identidad es estable y no
 * necesitan `useCallback`.
 *
 * @param productos Catálogo actual.
 * @param catalogReady `false` mientras el catálogo aún carga — evita descartar
 *   líneas válidas contra la lista por defecto.
 */
export function useCart(productos: Product[], catalogReady: boolean) {
  const [current, setCurrent] = useState<StoredLine[]>(lines);

  useEffect(() => {
    // Ponerse al día con lo que haya pasado entre el primer render y aquí.
    setCurrent(lines);
    const listener = (l: StoredLine[]) => setCurrent(l);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of productos) m.set(p.id, p);
    return m;
  }, [productos]);

  // Descartar líneas huérfanas una vez que el catálogo real está disponible.
  useEffect(() => {
    if (!catalogReady || pruned) return;
    pruned = true;
    const next = lines.filter((l) => byId.get(l.id)?.disponible);
    if (next.length !== lines.length) commit(next);
  }, [catalogReady, byId]);

  const items: CartItem[] = useMemo(
    () =>
      current
        .map((l) => {
          const product = byId.get(l.id);
          return product ? { product, cantidad: l.cantidad } : null;
        })
        .filter((i): i is CartItem => i !== null),
    [current, byId],
  );

  const subtotal = items.reduce((acc, i) => acc + i.product.precio * i.cantidad, 0);
  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return {
    items,
    add: addLine,
    setQty: setLineQty,
    remove: removeLine,
    clear: clearLines,
    subtotal,
    count,
  };
}

export function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
