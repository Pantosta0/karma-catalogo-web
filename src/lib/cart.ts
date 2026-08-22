import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

/**
 * Carrito persistido en localStorage.
 *
 * Guarda únicamente id + cantidad, nunca una copia del producto: así el precio,
 * la foto y el descuento salen siempre del catálogo actual y un pedido no puede
 * enviarse con datos viejos. Las líneas cuyo producto ya no existe o quedó no
 * disponible se descartan en cuanto el catálogo termina de cargar.
 *
 * @param productos Catálogo actual.
 * @param catalogReady `false` mientras el catálogo aún carga — evita descartar
 *   líneas válidas contra la lista por defecto.
 */
export function useCart(productos: Product[], catalogReady: boolean) {
  const [lines, setLines] = useState<StoredLine[]>(() =>
    typeof window === "undefined" ? [] : loadLines(),
  );

  const byId = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of productos) m.set(p.id, p);
    return m;
  }, [productos]);

  // Descartar líneas huérfanas una vez que el catálogo real está disponible.
  const pruned = useRef(false);
  useEffect(() => {
    if (!catalogReady || pruned.current) return;
    pruned.current = true;
    setLines((prev) => {
      const next = prev.filter((l) => byId.get(l.id)?.disponible);
      return next.length === prev.length ? prev : next;
    });
  }, [catalogReady, byId]);

  useEffect(() => {
    saveLines(lines);
  }, [lines]);

  const items: CartItem[] = useMemo(
    () =>
      lines
        .map((l) => {
          const product = byId.get(l.id);
          return product ? { product, cantidad: l.cantidad } : null;
        })
        .filter((i): i is CartItem => i !== null),
    [lines, byId],
  );

  const add = useCallback((product: Product, cantidad = 1) => {
    setLines((prev) => {
      const ex = prev.find((l) => l.id === product.id);
      if (ex) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, cantidad: clampQty(l.cantidad + cantidad) } : l,
        );
      }
      return [...prev, { id: product.id, cantidad: clampQty(cantidad) }];
    });
  }, []);

  const setQty = useCallback((id: string, cantidad: number) => {
    const q = clampQty(cantidad);
    setLines((prev) =>
      q <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, cantidad: q } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => setLines((p) => p.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setLines([]), []);

  const subtotal = items.reduce((acc, i) => acc + i.product.precio * i.cantidad, 0);
  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return { items, add, setQty, remove, clear, subtotal, count };
}

export function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
