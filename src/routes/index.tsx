import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAppState } from "@/lib/app-store";
import { useCart, formatCOP } from "@/lib/cart";
import type { Product } from "@/lib/storage";
import logoAsset from "@/assets/logo-bunuelos.png.asset.json";
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
import { ShoppingCart, Plus, Minus, Trash2, ImageOff, Send, Settings } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Los Buñuelos Los Originales — Catálogo" },
      { name: "description", content: "🧡Kiosco los buñuelos los originales + de 10 años en el mercado" },
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

  // ⚠️ Todos los hooks deben ir ANTES de cualquier return condicional
  const visibles = useMemo(
    () => state.productos.filter((p) => p.disponible && (activeCat === "todos" || p.categoriaId === activeCat)),
    [state.productos, activeCat],
  );

  const logoUrl = state.config.logo || logoAsset.url;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando catálogo…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/85 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <img src={logoUrl} alt={state.config.nombre} className="h-12 sm:h-14 w-auto" />
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
            <CategoryPill active={activeCat === "todos"} onClick={() => setActiveCat("todos")}>
              Todos
            </CategoryPill>
            {state.categorias.map((c) => (
              <CategoryPill key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)}>
                {c.nombre}
              </CategoryPill>
            ))}
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <section className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary text-balance">
          Crujientes, doraditos y recién hechos 💙
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Elige tus favoritos y envía tu pedido directo por WhatsApp.
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

function CategoryPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition shadow-soft ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-card text-foreground hover:bg-muted border border-border"
      }`}
    >
      {children}
    </button>
  );
}

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
