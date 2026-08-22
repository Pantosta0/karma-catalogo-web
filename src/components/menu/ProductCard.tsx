import { ImageOff, Plus } from "lucide-react";
import { formatCOP } from "@/lib/cart";
import { getDiscountedPrice, isDiscounted } from "@/lib/pricing";
import type { Product } from "@/lib/storage";

export function ProductCard({
  product,
  onOpen,
  onAdd,
}: {
  product: Product;
  onOpen: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden shadow-card border border-border/60 hover:-translate-y-0.5 transition">
      {/* inset: la tarjeta recorta con overflow-hidden y un anillo hacia
          afuera se perdería entero. aria-label porque cuando el producto no
          tiene foto el contenido es un icono decorativo y el botón se
          anunciaría sólo como "button". */}
      <button
        onClick={onOpen}
        aria-label={`Ver ${product.nombre}`}
        className="focus-ring-inset block w-full aspect-square bg-muted overflow-hidden"
      >
        {product.foto ? (
          <img
            src={product.foto}
            alt=""
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </button>
      <div className="p-3 pb-12">
        <h3 className="font-semibold text-sm sm:text-base leading-tight line-clamp-2">{product.nombre}</h3>
        {isDiscounted(product) ? (
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <p className="text-brand-bright font-display font-bold">{formatCOP(getDiscountedPrice(product))}</p>
            <p className="text-muted-foreground text-xs line-through">{formatCOP(product.precio)}</p>
            {/* Relleno sólido, no un lavado al 15%: sobre el wash el rojo se
                quedaba en 4.24:1. Blanco sobre el relleno da 4.56:1. */}
            <span className="text-[11px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
              -{product.descuento_pct}%
            </span>
          </div>
        ) : (
          <p className="text-brand-bright font-display font-bold mt-1">{formatCOP(product.precio)}</p>
        )}
      </div>
      <button
        onClick={onAdd}
        aria-label={`Agregar ${product.nombre}`}
        className="focus-ring absolute bottom-3 right-3 h-11 w-11 rounded-full bg-secondary text-secondary-foreground shadow-card flex items-center justify-center hover:scale-110 transition"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}
