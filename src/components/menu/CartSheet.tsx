import { useState } from "react";
import { Minus, Plus, Send, Trash2, X } from "lucide-react";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP, type CartItem } from "@/lib/cart";
import {
  getDiscountedPrice,
  isDiscounted,
  validateCode,
  type AppliedCode,
} from "@/lib/pricing";

export function CartSheet({
  items, subtotal, productDiscountTotal, appliedCode, codeDiscountAmount, deliveryFee, totalFinal,
  onApplyCode, setQty, remove, onCheckout,
}: {
  items: CartItem[];
  subtotal: number;
  productDiscountTotal: number;
  appliedCode: AppliedCode | null;
  codeDiscountAmount: number;
  deliveryFee: number;
  totalFinal: number;
  onApplyCode: (c: AppliedCode | null) => void;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  onCheckout: () => void;
}) {
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState("");

  const [validando, setValidando] = useState(false);

  const applyCode = async () => {
    if (!codeInput.trim() || validando) return;
    setValidando(true);
    const result = await validateCode(codeInput);
    if (result.ok) {
      onApplyCode(result.code);
      setCodeError("");
      setCodeInput("");
    } else {
      setCodeError(result.error);
    }
    setValidando(false);
  };

  return (
    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle className="font-display">Tu pedido</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Todavía no has agregado nada.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Toca el + en cualquier plato del menú.
            </p>
          </div>
        ) : (
          items.map((i) => {
            const discounted = isDiscounted(i.product);
            return (
              <div key={i.product.id} className="flex gap-3 bg-muted/50 rounded-xl p-2">
                <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {i.product.foto ? (
                    <img
                      src={i.product.foto}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{i.product.nombre}</p>
                  <div className="flex items-center gap-1.5">
                    <p className="tabular text-brand-bright font-bold text-sm">{formatCOP(getDiscountedPrice(i.product) * i.cantidad)}</p>
                    {discounted && <p className="text-muted-foreground text-xs line-through">{formatCOP(i.product.precio * i.cantidad)}</p>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setQty(i.product.id, i.cantidad - 1)}
                      className="focus-ring h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{i.cantidad}</span>
                    <button onClick={() => setQty(i.product.id, i.cantidad + 1)}
                      className="focus-ring h-11 w-11 rounded-full bg-card border border-border flex items-center justify-center">
                      <Plus className="h-3 w-3" />
                    </button>
                    <button onClick={() => remove(i.product.id)}
                      className="focus-ring ml-auto h-11 w-11 -mr-1 rounded-full flex items-center justify-center text-brand-bright" aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {items.length > 0 && (
        <div className="border-t border-border pt-4 space-y-3">
          {/* Código promo */}
          <div>
            {appliedCode ? (
              <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-bold text-green-400">Código: {appliedCode.code}</p>
                  <p className="text-xs text-muted-foreground">
                    -{appliedCode.descuento_tipo === "porcentaje" ? `${appliedCode.descuento_valor}%` : formatCOP(appliedCode.descuento_valor)} del subtotal
                  </p>
                </div>
                <button
                  onClick={() => onApplyCode(null)}
                  aria-label="Quitar código"
                  className="focus-ring h-11 w-11 -mr-2 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input placeholder="Código promo" value={codeInput}
                  onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && applyCode()}
                  className="font-display tracking-widest uppercase text-sm" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={applyCode}
                  disabled={validando}
                  className="shrink-0"
                >
                  {validando ? "…" : "Aplicar"}
                </Button>
              </div>
            )}
            {codeError && (
              <p role="alert" className="text-xs text-brand-bright mt-1">
                {codeError}
              </p>
            )}
            <p aria-live="polite" className="sr-only">
              {appliedCode
                ? `Código ${appliedCode.code} aplicado. Descuento de ${formatCOP(codeDiscountAmount)}. Nuevo total ${formatCOP(totalFinal)}.`
                : ""}
            </p>
          </div>

          {/* Desglose */}
          <div className="tabular space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCOP(subtotal)}</span>
            </div>
            {productDiscountTotal > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Descuentos productos</span><span>-{formatCOP(productDiscountTotal)}</span>
              </div>
            )}
            {appliedCode && codeDiscountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Código {appliedCode.code}</span><span>-{formatCOP(codeDiscountAmount)}</span>
              </div>
            )}
            {deliveryFee > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Domicilio</span><span>{formatCOP(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-1 border-t border-border">
              <span>Total</span>
              <span className="tabular text-brand-bright font-display">{formatCOP(totalFinal)}</span>
            </div>
          </div>

          <Button onClick={onCheckout} size="lg" className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95">
            <Send className="h-4 w-4 mr-2" />Enviar pedido por WhatsApp
          </Button>
        </div>
      )}
    </SheetContent>
  );
}
