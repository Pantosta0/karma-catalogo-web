import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppState } from "@/lib/app-store";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductModal } from "@/components/menu/ProductModal";
import type { Product } from "@/lib/storage";

/** Id reservado que significa "todo el menú". No puede chocar con una
 *  categoría real: el panel genera los ids como `slug-xxxx`, siempre con
 *  sufijo, así que `todos` a secas nunca sale de ahí. */
const TODOS = "todos";

export const Route = createFileRoute("/menu/$categoria")({
  component: CategoryProducts,
});

function CategoryProducts() {
  const { categoria } = Route.useParams();
  const { state, loading } = useAppState();
  const cart = useCart(state.productos, !loading);
  const [selected, setSelected] = useState<Product | null>(null);

  const esTodos = categoria === TODOS;
  const cat = state.categorias.find((c) => c.id === categoria);

  // El catálogo llega asíncrono: mientras carga, `categorias` está vacío y
  // cualquier id parecería inválido. El layout ya muestra el loader antes de
  // renderizar esta ruta, así que llegar aquí sin la categoría significa que
  // de verdad no existe.
  if (!esTodos && !cat) throw notFound();

  const visibles = useMemo(
    () =>
      state.productos.filter(
        (p) => p.disponible && (esTodos || p.categorias.includes(categoria)),
      ),
    [state.productos, categoria, esTodos],
  );

  const titulo = esTodos ? "Todo el menú" : cat!.nombre;

  return (
    <main className="max-w-5xl mx-auto px-4">
      <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-32 pt-6">
        <h1 id="menu-heading" className="font-display text-2xl font-bold text-brand-bright mb-4">
          {titulo}
        </h1>

        {visibles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {esTodos
                ? "El menú está vacío por ahora. Vuelve en un rato."
                : "Nada disponible en esta categoría ahora mismo."}
            </p>
            {!esTodos && (
              <Link
                to="/menu"
                className="focus-ring rounded mt-3 inline-block text-sm font-semibold text-brand-bright hover:underline underline-offset-4"
              >
                Ver las demás categorías
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {visibles.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onOpen={() => setSelected(p)}
                onAdd={() => cart.add(p, 1)}
              />
            ))}
          </div>
        )}
      </section>

      {/* El modal es de esta ruta y no del layout: lo abre una tarjeta de aquí
          y no tiene por qué sobrevivir a cambiar de categoría. */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(qty) => {
          if (selected) cart.add(selected, qty);
          setSelected(null);
        }}
      />
    </main>
  );
}
