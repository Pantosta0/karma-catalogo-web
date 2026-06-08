import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef, forwardRef } from "react";
import { useAppState } from "@/lib/app-store";
import { useCart, formatCOP } from "@/lib/cart";
import type { Product, DaySchedule } from "@/lib/storage";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShoppingCart, Plus, Minus, Trash2, ImageOff, Send, Settings, X } from "lucide-react";
import { LoadingScreen } from "@/components/LoadingScreen";

// Calcula si el negocio está abierto ahora según el horario (zona horaria Bogotá)
function getIsOpen(schedule: DaySchedule[] | undefined): boolean | null {
  if (!schedule || schedule.length !== 7) return null;
  // Forzar hora de Bogotá (UTC-5) independientemente del dispositivo del cliente
  const bogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const ds = schedule[bogota.getDay()]; // 0=Dom
  if (!ds) return null;
  if (!ds.open) return false;
  const [fh, fm] = ds.from.split(":").map(Number);
  const [th, tm] = ds.to.split(":").map(Number);
  const mins = bogota.getHours() * 60 + bogota.getMinutes();
  return mins >= fh * 60 + fm && mins <= th * 60 + tm;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Karma — Menú" },
      { name: "description", content: "Sabes lo que hiciste. Te lo mereces hoy. Karma, restaurante de comida rápida y asados." },
    ],
  }),
  component: CatalogPage,
});

function CatalogPage() {
  const { state, loading } = useAppState();
  const cart = useCart();
  const [activeCat, setActiveCat] = useState<string>("todos");
  const [selected, setSelected] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [activePromo, setActivePromo] = useState<(typeof state.promos)[0] | null>(null);

  const isOpen = getIsOpen(state.config.schedule);
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Desplazar el pill activo al centro de la barra de categorías
  useEffect(() => {
    const el = pillRefs.current.get(activeCat);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCat]);

  // Mostrar promo activa una vez por sesión
  useEffect(() => {
    if (loading) return;
    const today = new Date().toISOString().slice(0, 10);
    const promo = state.promos?.find(
      (p) => p.activo && today >= p.desde && today <= p.hasta
    ) ?? null;
    if (promo && !sessionStorage.getItem(`karma_promo_${promo.id}`)) {
      setActivePromo(promo);
      setPromoOpen(true);
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⚠️ Todos los hooks deben ir ANTES de cualquier return condicional
  const visibles = useMemo(
    () => state.productos.filter((p) => p.disponible && (activeCat === "todos" || p.categorias.includes(activeCat))),
    [state.productos, activeCat],
  );

  const logoUrl = state.config.logoSquare;
  const logoHeaderUrl = state.config.logoRect || state.config.logoSquare;

  if (loading) return <LoadingScreen logoUrl={logoUrl} />;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoHeaderUrl} alt={state.config.nombre} className="h-12 sm:h-14 w-auto" />
          {isOpen !== null && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
              isOpen
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-red-500/20 text-red-400 border border-red-500/30"
            }`}>
              {isOpen ? "Abierto" : "Cerrado"}
            </span>
          )}
          <div className="flex-1" />
          <Link
            to="/admin"
            aria-label="Admin"
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition"
          >
            <Settings className="h-5 w-5" />
          </Link>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <button
                className="relative inline-flex items-center justify-center h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-card hover:scale-105 transition"
                aria-label="Carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.count > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-secondary text-secondary-foreground text-[11px] font-bold flex items-center justify-center">
                    {cart.count}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <CartSheet
              items={cart.items}
              subtotal={cart.subtotal}
              setQty={cart.setQty}
              remove={cart.remove}
              onCheckout={() => {
                setCartOpen(false);
                setCheckoutOpen(true);
              }}
            />
          </Sheet>
        </div>

        {/* Category bar */}
        <div className="max-w-5xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            <CategoryPill
              active={activeCat === "todos"}
              ref={(el) => { if (el) pillRefs.current.set("todos", el); else pillRefs.current.delete("todos"); }}
              onClick={() => setActiveCat("todos")}
            >
              Todos
            </CategoryPill>
            {state.categorias.map((c) => (
              <CategoryPill
                key={c.id}
                active={activeCat === c.id}
                ref={(el) => { if (el) pillRefs.current.set(c.id, el); else pillRefs.current.delete(c.id); }}
                onClick={() => setActiveCat(c.id)}
              >
                {c.nombre}
              </CategoryPill>
            ))}
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary text-balance">
          Sabes lo que hiciste. Te lo mereces hoy.
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Elige tu pedido y envíalo directo por WhatsApp.
        </p>
      </section>

      {/* Product grid - 3 col instagram-like */}
      <main className="max-w-5xl mx-auto px-4">
        {visibles.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No hay productos disponibles en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {visibles.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={() => setSelected(p)} onAdd={() => cart.add(p, 1)} />
            ))}
          </div>
        )}
      </main>

      {/* Floating cart button (mobile) */}
      {cart.count > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 mx-auto max-w-md z-20 bg-gradient-brand text-brand-foreground rounded-full px-5 py-4 shadow-card flex items-center justify-between font-semibold"
        >
          <span className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> {cart.count} {cart.count === 1 ? "ítem" : "ítems"}
          </span>
          <span>{formatCOP(cart.subtotal)}</span>
        </button>
      )}

      {/* Product detail modal */}
      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={(qty) => {
          if (selected) cart.add(selected, qty);
          setSelected(null);
        }}
      />

      {/* Promo popup */}
      {activePromo && (
        <Dialog open={promoOpen} onOpenChange={(o) => {
          if (!o) {
            sessionStorage.setItem(`karma_promo_${activePromo.id}`, "1");
            setPromoOpen(false);
          }
        }}>
          <DialogContent className="max-w-sm p-0 overflow-hidden gap-0">
            {activePromo.imagen && (
              <div className="aspect-video w-full bg-muted">
                <img src={activePromo.imagen} alt={activePromo.titulo} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{activePromo.titulo}</DialogTitle>
                {activePromo.descripcion && (
                  <DialogDescription className="text-muted-foreground whitespace-pre-line">
                    {activePromo.descripcion}
                  </DialogDescription>
                )}
              </DialogHeader>
              <Button
                onClick={() => {
                  sessionStorage.setItem(`karma_promo_${activePromo.id}`, "1");
                  setPromoOpen(false);
                }}
                className="w-full mt-4 bg-gradient-brand text-brand-foreground"
              >
                ¡Entendido!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer */}
      <footer className="mt-16 pb-8 text-center border-t border-border/40 pt-8 max-w-5xl mx-auto">
        <Link to="/politica-de-privacidad-y-uso-de-datos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
          Política de Privacidad y Uso de Datos
        </Link>
      </footer>

      {/* Checkout modal */}
      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        items={cart.items}
        subtotal={cart.subtotal}
        whatsapp={state.config.whatsapp}
        onSent={() => {
          cart.clear();
          setCheckoutOpen(false);
        }}
      />

      <footer className="text-center text-xs text-muted-foreground py-6 mt-10">
        © {new Date().getFullYear()} {state.config.nombre}
      </footer>
    </div>
  );
}

const CategoryPill = forwardRef<
  HTMLButtonElement,
  { active: boolean; onClick: () => void; children: React.ReactNode }
>(({ active, onClick, children }, ref) => (
  <button
    ref={ref}
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shadow-soft ${
      active
        ? "bg-primary text-primary-foreground scale-105"
        : "bg-card text-foreground hover:bg-muted border border-border"
    }`}
  >
    {children}
  </button>
));

function ProductCard({
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
      <button onClick={onOpen} className="block w-full aspect-square bg-muted overflow-hidden">
        {product.foto ? (
          <img
            src={product.foto}
            alt={product.nombre}
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
        <p className="text-primary font-display font-bold mt-1">{formatCOP(product.precio)}</p>
      </div>
      <button
        onClick={onAdd}
        aria-label={`Agregar ${product.nombre}`}
        className="absolute bottom-3 right-3 h-9 w-9 rounded-full bg-secondary text-secondary-foreground shadow-card flex items-center justify-center hover:scale-110 transition"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

function ProductModal({
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
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {product && (
          <>
            <div className="aspect-square bg-muted">
              {product.foto ? (
                <img src={product.foto} alt={product.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-10 w-10" />
                </div>
              )}
            </div>
            <div className="p-5">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{product.nombre}</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  {product.descripcion || "Delicioso producto."}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-2xl font-display font-bold text-primary">
                  {formatCOP(product.precio * qty)}
                </span>
                <div className="flex items-center gap-2 bg-muted rounded-full p-1">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="h-8 w-8 rounded-full bg-card flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="h-8 w-8 rounded-full bg-card flex items-center justify-center"
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

function CartSheet({
  items,
  subtotal,
  setQty,
  remove,
  onCheckout,
}: {
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  onCheckout: () => void;
}) {
  return (
    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
      <SheetHeader>
        <SheetTitle className="font-display">Tu pedido</SheetTitle>
      </SheetHeader>
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">El carrito está vacío.</p>
        ) : (
          items.map((i) => (
            <div key={i.product.id} className="flex gap-3 bg-muted/50 rounded-xl p-2">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {i.product.foto ? (
                  <img src={i.product.foto} alt={i.product.nombre} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm line-clamp-1">{i.product.nombre}</p>
                <p className="text-primary font-bold text-sm">{formatCOP(i.product.precio)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => setQty(i.product.id, i.cantidad - 1)}
                    className="h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-sm font-semibold w-5 text-center">{i.cantidad}</span>
                  <button
                    onClick={() => setQty(i.product.id, i.cantidad + 1)}
                    className="h-7 w-7 rounded-full bg-card border border-border flex items-center justify-center"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => remove(i.product.id)}
                    className="ml-auto p-1 text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {items.length > 0 && (
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Subtotal</span>
            <span className="font-display font-bold text-primary">{formatCOP(subtotal)}</span>
          </div>
          <Button onClick={onCheckout} size="lg" className="w-full bg-gradient-brand text-brand-foreground hover:opacity-95">
            <Send className="h-4 w-4 mr-2" />
            Enviar pedido por WhatsApp
          </Button>
        </div>
      )}
    </SheetContent>
  );
}

function CheckoutModal({
  open,
  onOpenChange,
  items,
  subtotal,
  whatsapp,
  onSent,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: ReturnType<typeof useCart>["items"];
  subtotal: number;
  whatsapp: string;
  onSent: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [pago, setPago] = useState("Efectivo");

  const enviar = () => {
    if (!nombre.trim() || !direccion.trim() || !telefono.trim()) return;
    const detalle = items
      .map((i) => `   - ${i.cantidad}x ${i.product.nombre} (${formatCOP(i.product.precio * i.cantidad)})`)
      .join("\n");
    const msg = `Hola! quisiera hacer un pedido:

- Nombre completo: ${nombre}

- Pedido detallado:
${detalle}

- Dirección + punto de referencia: ${direccion}

- Número de contacto: ${telefono}

- Medio de pago: ${pago}

Total: ${formatCOP(subtotal)}`;
    const url = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    onSent();
    setNombre("");
    setDireccion("");
    setTelefono("");
    setPago("Efectivo");
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
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="dir">Dirección + punto de referencia</Label>
            <Textarea id="dir" value={direccion} onChange={(e) => setDireccion(e.target.value)} maxLength={240} rows={2} />
          </div>
          <div>
            <Label htmlFor="tel">Número de contacto</Label>
            <Input
              id="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              inputMode="tel"
              maxLength={20}
            />
          </div>
          <div>
            <Label>Medio de pago</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {opciones.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setPago(o)}
                  className={`px-3 py-2 rounded-full text-sm border transition ${
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
          <Button
            onClick={enviar}
            disabled={!nombre.trim() || !direccion.trim() || !telefono.trim()}
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
