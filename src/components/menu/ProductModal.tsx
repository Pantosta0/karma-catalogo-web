import { useState } from "react";
import { ImageOff, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCOP } from "@/lib/cart";
import { getDiscountedPrice, isDiscounted } from "@/lib/pricing";
import type { Product } from "@/lib/storage";

export function ProductModal({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  return (
    <Dialog
      open={!!product}
      onOpenChange={(o) => {
        if (!o) {
          onClose();
          setQty(1);
        }
      }}
    >
      {/* Cuando el plato no tiene descripción no se renderiza DialogDescription.
          Radix avisa por consola salvo que la clave aria-describedby exista con
          valor undefined, así que hay que pasarla por spread, no por ternario:
          `aria-describedby={undefined}` y omitir la prop son lo mismo en JSX. */}
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        {...(product?.descripcion ? {} : { "aria-describedby": undefined })}
      >
        {product && (
          <>
            <div className="aspect-square bg-muted">
              {product.foto ? (
                <img
                  src={product.foto}
                  alt={product.nombre}
                  decoding="async"
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{product.nombre}</DialogTitle>
                {/* Sin descripción no se inventa una: el relleno genérico
                    ("Delicioso producto") resta más de lo que aporta. */}
                {product.descripcion && (
                  <DialogDescription className="text-muted-foreground">
                    {product.descripcion}
                  </DialogDescription>
                )}
              </DialogHeader>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="tabular text-2xl font-display font-bold text-brand-bright">
                    {formatCOP(getDiscountedPrice(product) * qty)}
                  </span>
                  {isDiscounted(product) && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCOP(product.precio * qty)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="focus-ring h-11 w-11 rounded-full bg-card flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="focus-ring h-11 w-11 rounded-full bg-card flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <Button
                onClick={() => {
                  onAdd(qty);
                  setQty(1);
                }}
                className="w-full mt-5 bg-gradient-brand text-brand-foreground hover:opacity-95"
                size="lg"
              >
                Agregar al carrito
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
