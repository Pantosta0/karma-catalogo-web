import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAppState } from "@/lib/app-store";
import { getCategoryIcon } from "@/lib/category-icons";
import { LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/menu/")({
  component: CategoryGrid,
});

/**
 * La portada del menú: categorías, no productos.
 *
 * Antes esta ruta pintaba el catálogo entero de una vez. Con las fotos ya en
 * Storage eso son N peticiones de imagen antes de que nadie haya dicho qué
 * quiere comer; aquí sólo se pintan iconos, que ya vienen en el bundle.
 */
function CategoryGrid() {
  const { state } = useAppState();

  // Cuántos productos disponibles tiene cada categoría. Una categoría vacía se
  // oculta en vez de llevar a una pantalla que dice "nada disponible".
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of state.productos) {
      if (!p.disponible) continue;
      for (const c of p.categorias) m.set(c, (m.get(c) ?? 0) + 1);
    }
    return m;
  }, [state.productos]);

  const visibles = state.categorias.filter((c) => (counts.get(c.id) ?? 0) > 0);
  const totalDisponible = state.productos.filter((p) => p.disponible).length;

  return (
    <main className="max-w-5xl mx-auto px-4">
      {/* El lema vive en la portada y sólo ahí. Repetirlo aquí le quita el
          golpe, y quien entra directo a /menu desde Instagram viene a pedir,
          no a que le recuerden de qué va la marca. */}
      <section className="pt-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-brand-bright text-balance">
          Nuestro menú
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Elige una categoría y arma tu pedido.
        </p>
      </section>

      <section id="menu" aria-labelledby="cats-heading" className="scroll-mt-32">
        <h2 id="cats-heading" className="sr-only">
          Categorías del menú
        </h2>

        {totalDisponible === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              El menú está vacío por ahora. Vuelve en un rato.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {visibles.map((c) => {
              const Icon = getCategoryIcon(c.icono);
              const n = counts.get(c.id) ?? 0;
              return (
                <Link
                  key={c.id}
                  to="/menu/$categoria"
                  params={{ categoria: c.id }}
                  className="focus-ring group bg-card rounded-2xl border border-border/60 shadow-card p-5 flex flex-col items-center justify-center gap-3 aspect-square hover:-translate-y-0.5 transition"
                >
                  <Icon
                    className="h-10 w-10 text-brand-bright group-hover:scale-105 transition duration-300"
                    aria-hidden="true"
                  />
                  <div className="text-center">
                    <h3 className="font-display font-bold leading-tight text-balance">
                      {c.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n} {n === 1 ? "plato" : "platos"}
                    </p>
                  </div>
                </Link>
              );
            })}

            {/* Un producto puede estar en varias categorías, así que la
                cuadrícula sola no garantiza que se vea todo. */}
            <Link
              to="/menu/$categoria"
              params={{ categoria: "todos" }}
              className="focus-ring group bg-muted/40 rounded-2xl border border-dashed border-border p-5 flex flex-col items-center justify-center gap-3 aspect-square hover:-translate-y-0.5 hover:bg-muted/60 transition"
            >
              <LayoutGrid
                className="h-10 w-10 text-muted-foreground group-hover:scale-105 transition duration-300"
                aria-hidden="true"
              />
              <div className="text-center">
                <h3 className="font-display font-bold leading-tight">Ver todo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {totalDisponible} {totalDisponible === 1 ? "plato" : "platos"}
                </p>
              </div>
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
