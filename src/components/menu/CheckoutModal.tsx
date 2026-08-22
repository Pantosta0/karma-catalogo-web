import { useState } from "react";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCOP, type CartItem } from "@/lib/cart";
import { getDiscountedPrice, isDiscounted, type AppliedCode } from "@/lib/pricing";

export function CheckoutModal({
  open,
  onOpenChange,
  items,
  subtotal,
  productDiscountTotal,
  appliedCode,
  codeDiscountAmount,
  deliveryFee,
  totalFinal,
  whatsapp,
  onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: CartItem[];
  subtotal: number;
  productDiscountTotal: number;
  appliedCode: AppliedCode | null;
  codeDiscountAmount: number;
  deliveryFee: number;
  totalFinal: number;
  whatsapp: string;
  onSent: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pago, setPago] = useState("Efectivo");
  const [errors, setErrors] = useState<{ nombre?: string; direccion?: string; telefono?: string }>(
    {},
  );
  const [enviando, setEnviando] = useState(false);

  // Un número colombiano son 10 dígitos; se aceptan 7 (fijo) a 15 (E.164).
  const validate = () => {
    const next: typeof errors = {};
    if (!nombre.trim()) next.nombre = "Necesitamos tu nombre para el pedido.";
    if (!direccion.trim()) next.direccion = "Sin dirección no podemos llevarlo.";
    const digits = telefono.replace(/\D/g, "");
    if (!digits) next.telefono = "Necesitamos un número para confirmarte.";
    else if (digits.length < 7 || digits.length > 15)
      next.telefono = "Ese número no parece completo.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const enviar = () => {
    if (enviando) return; // evita doble envío si tocan dos veces
    if (!validate()) return;

    const destino = whatsapp.replace(/\D/g, "");
    if (!destino) {
      setErrors({
        telefono: "El restaurante aún no configuró su WhatsApp. Escríbenos por Instagram.",
      });
      return;
    }
    setEnviando(true);

    const detalle = items
      .map((i) => {
        const dp = getDiscountedPrice(i.product);
        const disc = isDiscounted(i.product) ? ` (antes ${formatCOP(i.product.precio)})` : "";
        return `   - ${i.cantidad}x ${i.product.nombre} — ${formatCOP(dp * i.cantidad)}${disc}`;
      })
      .join("\n");
    const discLines = [
      productDiscountTotal > 0
        ? `\n- Descuento productos: -${formatCOP(productDiscountTotal)}`
        : "",
      appliedCode ? `\n- Código ${appliedCode.code}: -${formatCOP(codeDiscountAmount)}` : "",
      deliveryFee > 0 ? `\n- Domicilio: ${formatCOP(deliveryFee)}` : "",
    ].join("");
    const msg = `Hola! quisiera hacer un pedido:

- Nombre completo: ${nombre}

- Pedido detallado:
${detalle}

- Dirección + punto de referencia: ${direccion}

- Número de contacto: ${telefono}

- Medio de pago: ${pago}
${discLines}
Total: ${formatCOP(totalFinal)}`;
    const url = `https://wa.me/${destino}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onSent();
    setNombre("");
    setDireccion("");
    setTelefono("");
    setPago("Efectivo");
    setErrors({});
    setEnviando(false);
  };

  const opciones = ["Efectivo", "Nequi", "Bancolombia", "Otro"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Datos de entrega</DialogTitle>
          <DialogDescription>Completa para enviar tu pedido por WhatsApp.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setErrors((p) => ({ ...p, nombre: undefined }));
              }}
              maxLength={80}
              autoComplete="name"
              aria-invalid={!!errors.nombre}
              aria-describedby={errors.nombre ? "nombre-error" : undefined}
            />
            {errors.nombre && (
              <p id="nombre-error" className="text-xs text-brand-bright mt-1">
                {errors.nombre}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="dir">Dirección + punto de referencia</Label>
            <Textarea
              id="dir"
              value={direccion}
              onChange={(e) => {
                setDireccion(e.target.value);
                setErrors((p) => ({ ...p, direccion: undefined }));
              }}
              maxLength={240}
              rows={2}
              autoComplete="street-address"
              aria-invalid={!!errors.direccion}
              aria-describedby={errors.direccion ? "dir-error" : undefined}
            />
            {errors.direccion && (
              <p id="dir-error" className="text-xs text-brand-bright mt-1">
                {errors.direccion}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="tel">Número de contacto</Label>
            <Input
              id="tel"
              type="tel"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setErrors((p) => ({ ...p, telefono: undefined }));
              }}
              inputMode="tel"
              maxLength={20}
              autoComplete="tel"
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? "tel-error" : undefined}
            />
            {errors.telefono && (
              <p id="tel-error" className="text-xs text-brand-bright mt-1">
                {errors.telefono}
              </p>
            )}
          </div>
          <div>
            <Label>Medio de pago</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {opciones.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setPago(o)}
                  className={`focus-ring px-3 py-2 rounded-full text-sm border transition ${
                    pago === o
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border hover:bg-muted"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          {/* Habilitado siempre a propósito: un botón muerto no explica qué
              falta. Al tocarlo, validate() señala el campo incompleto. */}
          <Button
            onClick={enviar}
            disabled={enviando}
            size="lg"
            className="w-full bg-gradient-brand text-brand-foreground"
          >
            <Send className="h-4 w-4 mr-2" /> Enviar por WhatsApp
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
