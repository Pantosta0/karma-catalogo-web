import { useState, useCallback } from "react";
import type { Product } from "./storage";

export type CartItem = { product: Product; cantidad: number };

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = useCallback((product: Product, cantidad = 1) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.product.id === product.id);
      if (ex) return prev.map((i) => (i.product.id === product.id ? { ...i, cantidad: i.cantidad + cantidad } : i));
      return [...prev, { product, cantidad }];
    });
  }, []);

  const setQty = useCallback((id: string, cantidad: number) => {
    setItems((prev) =>
      cantidad <= 0 ? prev.filter((i) => i.product.id !== id) : prev.map((i) => (i.product.id === id ? { ...i, cantidad } : i)),
    );
  }, []);

  const remove = useCallback((id: string) => setItems((p) => p.filter((i) => i.product.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((acc, i) => acc + i.product.precio * i.cantidad, 0);
  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return { items, add, setQty, remove, clear, subtotal, count };
}

export function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}
