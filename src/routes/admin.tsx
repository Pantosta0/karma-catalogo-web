import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useAppState } from "@/lib/app-store";
import { uid, DEFAULT_SCHEDULE, type Product, type Category, type DaySchedule, type Promo, type PromoCode } from "@/lib/storage";
import { compressImage } from "@/lib/image";
import { LoadingScreen } from "@/components/LoadingScreen";
import { hashPassword, verifyPassword, isHashed } from "@/lib/crypto";
import { formatCOP } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, LogOut, Store, Tag, ImageOff, ArrowLeft, X, Megaphone, Clock, Ticket, Hash } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Karma" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { state, loading, update } = useAppState();
  const [tab, setTab] = useState<"productos" | "categorias" | "negocio" | "promos">("productos");

  if (loading) return <LoadingScreen logoUrl={state.config.logoSquare} />;

  if (!state.adminSession) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary" aria-label="Volver">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {(state.config.logoRect || state.config.logoSquare) && (
            <img src={state.config.logoRect || state.config.logoSquare} alt="" className="h-9 w-auto" />
          )}
          <div>
            <h1 className="font-display font-bold text-primary leading-none">Panel de administración</h1>
            <p className="text-xs text-muted-foreground">{state.config.nombre}</p>
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem("karma_admin");
              update((s) => ({ ...s, adminSession: false }));
            }}
          >
            <LogOut className="h-4 w-4 mr-1" /> Salir
          </Button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {([
            ["productos", "Productos", Store],
            ["categorias", "Categorías", Tag],
            ["negocio", "Negocio", Clock],
            ["promos", "Promos", Megaphone],
          ] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition flex items-center gap-2 ${
                tab === k ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "productos" && <ProductsTab />}
        {tab === "categorias" && <CategoriesTab />}
        {tab === "negocio" && <BusinessTab />}
        {tab === "promos" && <PromosTab />}
      </main>
    </div>
  );
}

function LoginScreen() {
  const { state, update } = useAppState();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userOk = user === state.adminAuth.user;
    const passOk = await verifyPassword(pass, state.adminAuth.pass);
    if (userOk && passOk) {
      sessionStorage.setItem("karma_admin", "1");
      // Migrar contraseña a hash si aún está en texto plano
      if (!isHashed(state.adminAuth.pass)) {
        const hashed = await hashPassword(pass);
        update((s) => ({ ...s, adminSession: true, adminAuth: { ...s.adminAuth, pass: hashed } }));
      } else {
        update((s) => ({ ...s, adminSession: true }));
      }
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  const logoUrl = state.config.logoSquare;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-2xl shadow-card border border-border p-6">
        <div className="flex flex-col items-center mb-4">
          <img src={logoUrl} alt="Logo" className="h-16 w-auto mb-2" />
          <h1 className="font-display text-xl font-bold text-primary">Administración</h1>
          <p className="text-sm text-muted-foreground">Ingresa tus credenciales</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="u">Usuario</Label>
            <Input id="u" value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
          </div>
          <div>
            <Label htmlFor="p">Contraseña</Label>
            <Input id="p" type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-brand text-brand-foreground" size="lg">
            Entrar
          </Button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-primary">
            ← Volver al catálogo
          </Link>
        </form>
        <p className="text-[11px] text-muted-foreground mt-4 text-center">
          Solo personal autorizado 🤫
        </p>
      </div>
    </div>
  );
}

/* -------------------- Productos -------------------- */

function ProductsTab() {
  const { state, update } = useAppState();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const catNames = (ids: string[]) =>
    ids.map((id) => state.categorias.find((c) => c.id === id)?.nombre).filter(Boolean).join(" · ") || "—";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">Productos ({state.productos.length})</h2>
        <Button onClick={() => setCreating(true)} className="bg-gradient-brand text-brand-foreground">
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {state.productos.map((p) => (
          <div key={p.id} className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
            <div className="aspect-video bg-muted">
              {p.foto ? (
                <img src={p.foto} alt={p.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm line-clamp-1">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{catNames(p.categorias)}</p>
                </div>
                <p className="text-primary font-bold whitespace-nowrap">{formatCOP(p.precio)}</p>
              </div>
              <div className="flex items-center justify-between mt-3">
                <label className="flex items-center gap-2 text-xs">
                  <Switch
                    checked={p.disponible}
                    onCheckedChange={(v) =>
                      update((s) => ({
                        ...s,
                        productos: s.productos.map((x) => (x.id === p.id ? { ...x, disponible: v } : x)),
                      }))
                    }
                  />
                  {p.disponible ? "Disponible" : "No disponible"}
                </label>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)} aria-label="Editar">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setToDelete(p)}
                    className="text-destructive hover:text-destructive"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ProductFormDialog
        open={creating || !!editing}
        product={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(prod) =>
          update((s) => ({
            ...s,
            productos: editing
              ? s.productos.map((x) => (x.id === prod.id ? prod : x))
              : [...s.productos, prod],
          }))
        }
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente "{toDelete?.nombre}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (toDelete) {
                  update((s) => ({ ...s, productos: s.productos.filter((x) => x.id !== toDelete.id) }));
                  setToDelete(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ProductFormDialog({
  open,
  product,
  onClose,
  onSave,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (p: Product) => void;
}) {
  const { state } = useAppState();
  const [nombre, setNombre] = useState(product?.nombre ?? "");
  const [descripcion, setDescripcion] = useState(product?.descripcion ?? "");
  const [precio, setPrecio] = useState<string>(product?.precio?.toString() ?? "");
  const [categorias, setCategorias] = useState<string[]>(product?.categorias ?? []);
  const [foto, setFoto] = useState(product?.foto ?? "");
  const [disponible, setDisponible] = useState(product?.disponible ?? true);
  const [descuentoPct, setDescuentoPct] = useState<string>(product?.descuento_pct?.toString() ?? "0");
  const [descuentoHasta, setDescuentoHasta] = useState(product?.descuento_hasta ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  // Sincronizar form cuando el diálogo abre o cambia el producto seleccionado
  useEffect(() => {
    if (open) {
      setNombre(product?.nombre ?? "");
      setDescripcion(product?.descripcion ?? "");
      setPrecio(product?.precio?.toString() ?? "");
      setCategorias(product?.categorias ?? []);
      setFoto(product?.foto ?? "");
      setDisponible(product?.disponible ?? true);
      setDescuentoPct(product?.descuento_pct?.toString() ?? "0");
      setDescuentoHasta(product?.descuento_hasta ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product?.id]);

  const toggleCat = (id: string) =>
    setCategorias((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleFile = (f: File) => {
    // Límite generoso — la compresión reduce el tamaño real antes de guardar
    if (f.size > 15 * 1024 * 1024) {
      alert("La imagen es demasiado grande (máx 15 MB)");
      return;
    }
    compressImage(f, 900, "jpeg", 0.82)
      .then(setFoto)
      .catch(() => alert("No se pudo procesar la imagen"));
  };

  const submit = () => {
    const p = parseInt(precio, 10);
    if (!nombre.trim() || categorias.length === 0 || isNaN(p) || p < 0) return;
    const pct = Math.min(100, Math.max(0, parseInt(descuentoPct, 10) || 0));
    onSave({
      id: product?.id ?? uid(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim().slice(0, 120),
      precio: p,
      categorias,
      foto,
      disponible,
      descuento_pct: pct,
      descuento_hasta: descuentoHasta,
    });
    onClose();
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setCategorias([]);
    setFoto("");
    setDisponible(true);
    setDescuentoPct("0");
    setDescuentoHasta("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
        if (o && product) {
          setNombre(product.nombre);
          setDescripcion(product.descripcion);
          setPrecio(product.precio.toString());
          setCategorias(product.categorias);
          setFoto(product.foto);
          setDisponible(product.disponible);
        } else if (o && !product) {
          setNombre("");
          setDescripcion("");
          setPrecio("");
          setCategorias([]);
          setFoto("");
          setDisponible(true);
        }
      }}
    >
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {product ? "Editar producto" : "Agregar producto"}
          </DialogTitle>
          <DialogDescription>Completa los datos del producto.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Foto</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {foto ? (
                  <img src={foto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  {foto ? "Cambiar imagen" : "Subir imagen"}
                </Button>
                {foto && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFoto("")}>
                    Quitar
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="nom">Nombre</Label>
            <Input id="nom" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} />
          </div>
          <div>
            <Label htmlFor="desc">Descripción ({descripcion.length}/120)</Label>
            <Textarea id="desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value.slice(0, 120))} rows={2} />
          </div>
          <div>
            <Label htmlFor="pre">Precio (COP)</Label>
            <Input id="pre" type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
          </div>
          <div>
            <Label>Categorías <span className="text-muted-foreground font-normal">(selecciona una o más)</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {state.categorias.map((c) => {
                const active = categorias.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCat(c.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {c.nombre}
                  </button>
                );
              })}
            </div>
            {categorias.length === 0 && (
              <p className="text-xs text-destructive mt-1">Selecciona al menos una categoría.</p>
            )}
          </div>
          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm font-medium">Disponible en el catálogo</span>
            <Switch checked={disponible} onCheckedChange={setDisponible} />
          </label>

          {/* Descuento por tiempo limitado */}
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-sm font-semibold flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-primary" /> Descuento (opcional)
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <Label htmlFor="prod-desc-pct">Descuento %</Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    id="prod-desc-pct"
                    type="number"
                    min={0}
                    max={100}
                    value={descuentoPct}
                    onChange={(e) => setDescuentoPct(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="prod-desc-hasta">Válido hasta <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input
                  id="prod-desc-hasta"
                  type="date"
                  value={descuentoHasta}
                  onChange={(e) => setDescuentoHasta(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            {parseInt(descuentoPct, 10) > 0 && (
              <p className="text-xs text-primary">
                Precio con descuento:{" "}
                {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                  .format(Math.round((parseInt(precio, 10) || 0) * (1 - (parseInt(descuentoPct, 10) || 0) / 100)))}
                {descuentoHasta ? ` hasta ${descuentoHasta}` : " (sin fecha límite)"}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} className="bg-gradient-brand text-brand-foreground">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Categorías -------------------- */

function CategoriesTab() {
  const { state, update } = useAppState();
  const [nueva, setNueva] = useState("");

  const add = () => {
    const n = nueva.trim();
    if (!n) return;
    const id = n.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 24) + "-" + uid().slice(0, 4);
    update((s) => ({ ...s, categorias: [...s.categorias, { id, nombre: n }] }));
    setNueva("");
  };

  const remove = (c: Category) => {
    if (state.productos.some((p) => p.categorias.includes(c.id))) {
      alert("No se puede eliminar: hay productos en esta categoría.");
      return;
    }
    update((s) => ({ ...s, categorias: s.categorias.filter((x) => x.id !== c.id) }));
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="font-display text-lg font-bold">Categorías</h2>
      <div className="flex gap-2">
        <Input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          placeholder="Nueva categoría"
          maxLength={30}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <Button onClick={add} className="bg-gradient-brand text-brand-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        {state.categorias.map((c) => (
          <div key={c.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
            <span className="font-medium">{c.nombre}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => remove(c)}
              className="text-destructive"
              aria-label="Eliminar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------- Negocio -------------------- */

function BusinessTab() {
  const { state, update } = useAppState();
  const [nombre, setNombre] = useState(state.config.nombre);
  const [whatsapp, setWhatsapp] = useState(state.config.whatsapp);
  const [logoSquare, setLogoSquare] = useState(state.config.logoSquare);
  const [logoRect, setLogoRect] = useState(state.config.logoRect);
  const [seoDescription, setSeoDescription] = useState(state.config.seoDescription);
  const [ogImage, setOgImage] = useState(state.config.ogImage ?? "");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [schedule, setSchedule] = useState<DaySchedule[]>(
    state.config.schedule?.length === 7 ? state.config.schedule : DEFAULT_SCHEDULE
  );
  const [globalFrom, setGlobalFrom] = useState(() => {
    const first = (state.config.schedule ?? DEFAULT_SCHEDULE).find((d) => d.open);
    return first?.from ?? "12:00";
  });
  const [globalTo, setGlobalTo] = useState(() => {
    const first = (state.config.schedule ?? DEFAULT_SCHEDULE).find((d) => d.open);
    return first?.to ?? "22:00";
  });
  const [saved, setSaved] = useState(false);

  // Sincronizar estado local cuando state.config.schedule cambia (ej: carga desde Supabase)
  useEffect(() => {
    const sched = state.config.schedule;
    if (Array.isArray(sched) && sched.length === 7) {
      setSchedule(sched);
      const first = sched.find((d) => d.open);
      if (first) { setGlobalFrom(first.from); setGlobalTo(first.to); }
    }
  }, [state.config.schedule]); // eslint-disable-line react-hooks/exhaustive-deps
  const fileSquareRef = useRef<HTMLInputElement>(null);
  const fileRectRef = useRef<HTMLInputElement>(null);

  const handleLogo = (f: File, type: "square" | "rect") => {
    if (f.size > 15 * 1024 * 1024) {
      alert("El archivo es demasiado grande (máx 15 MB)");
      return;
    }
    // Logos: PNG para mantener transparencia; cuadrado max 400px, rect max 800px
    const maxPx = type === "square" ? 400 : 800;
    compressImage(f, maxPx, "png")
      .then((url) => {
        if (type === "square") setLogoSquare(url);
        else setLogoRect(url);
      })
      .catch(() => alert("No se pudo procesar el logo"));
  };

  const guardar = async () => {
    setPassError("");
    let newHashedPass: string | null = null;

    if (newPass) {
      if (newPass.length < 8) {
        setPassError("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (newPass !== confirmPass) {
        setPassError("Las contraseñas no coinciden.");
        return;
      }
      newHashedPass = await hashPassword(newPass);
    }

    update((s) => ({
      ...s,
      config: {
        nombre: nombre.trim(),
        whatsapp: whatsapp.replace(/\D/g, ""),
        logoSquare,
        logoRect,
        seoDescription: seoDescription.trim(),
        ogImage: ogImage.trim(),
        schedule,
      },
      ...(newHashedPass ? { adminAuth: { ...s.adminAuth, pass: newHashedPass } } : {}),
    }));
    setSaved(true);
    setNewPass("");
    setConfirmPass("");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="font-display text-lg font-bold">Configuración del negocio</h2>
      <div>
        <Label>Logos</Label>
        <div className="mt-2 grid grid-cols-2 gap-4">
          {/* Logo cuadrado */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Cuadrado <span className="text-muted-foreground font-normal text-xs">(loading · login)</span></p>
            <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex items-center justify-center p-1 border border-border">
              {logoSquare
                ? <img src={logoSquare} alt="" className="max-h-full max-w-full object-contain" />
                : <ImageOff className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => fileSquareRef.current?.click()}>
                Subir
              </Button>
              {logoSquare && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoSquare("")}>
                  Quitar
                </Button>
              )}
            </div>
            <input ref={fileSquareRef} type="file" accept="image/*" hidden
              onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0], "square")} />
          </div>

          {/* Logo rectangular */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Rectangular <span className="text-muted-foreground font-normal text-xs">(header)</span></p>
            <div className="h-20 w-40 rounded-lg bg-muted overflow-hidden flex items-center justify-center p-2 border border-border">
              {logoRect
                ? <img src={logoRect} alt="" className="max-h-full max-w-full object-contain" />
                : <ImageOff className="h-6 w-6 text-muted-foreground" />}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRectRef.current?.click()}>
                Subir
              </Button>
              {logoRect && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setLogoRect("")}>
                  Quitar
                </Button>
              )}
            </div>
            <input ref={fileRectRef} type="file" accept="image/*" hidden
              onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0], "rect")} />
          </div>
        </div>
      </div>
      <div>
        <Label htmlFor="bn">Nombre del negocio</Label>
        <Input id="bn" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={60} />
      </div>
      <div>
        <Label htmlFor="wa">WhatsApp (con código de país, sin +)</Label>
        <Input
          id="wa"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="573001112233"
          inputMode="tel"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Ej: 573001112233 (Colombia +57). Aquí llegarán los pedidos.
        </p>
      </div>

      {/* ── Horarios ────────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" /> Horarios de atención
        </p>

        {/* Horario global: aplica a todos los días activos */}
        <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-muted/40 rounded-xl border border-border">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 w-full sm:w-auto">
            Todos los días activos:
          </span>
          <input
            type="time"
            value={globalFrom}
            onChange={(e) => setGlobalFrom(e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1 text-sm w-28"
          />
          <span className="text-muted-foreground text-xs">→</span>
          <input
            type="time"
            value={globalTo}
            onChange={(e) => setGlobalTo(e.target.value)}
            className="bg-background border border-border rounded-md px-2 py-1 text-sm w-28"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              if (globalFrom && globalTo) {
                setSchedule((prev) =>
                  prev.map((d) => d.open ? { ...d, from: globalFrom, to: globalTo } : d)
                );
              }
            }}
          >
            Aplicar a todos
          </Button>
        </div>

        <div className="space-y-2">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day, i) => {
            // Mostrar lunes primero visualmente
            const displayOrder = [1, 2, 3, 4, 5, 6, 0];
            const idx = displayOrder[i];
            const ds = schedule[idx];
            return (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <span className="w-8 text-muted-foreground font-medium shrink-0">
                  {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][idx]}
                </span>
                <Switch
                  checked={ds.open}
                  onCheckedChange={(v) =>
                    setSchedule((prev) => prev.map((d, j) => j === idx ? { ...d, open: v } : d))
                  }
                />
                {ds.open ? (
                  <>
                    <input
                      type="time"
                      value={ds.from}
                      onChange={(e) =>
                        setSchedule((prev) => prev.map((d, j) => j === idx ? { ...d, from: e.target.value } : d))
                      }
                      className="bg-muted border border-border rounded-md px-2 py-1 text-sm w-28"
                    />
                    <span className="text-muted-foreground">→</span>
                    <input
                      type="time"
                      value={ds.to}
                      onChange={(e) =>
                        setSchedule((prev) => prev.map((d, j) => j === idx ? { ...d, to: e.target.value } : d))
                      }
                      className="bg-muted border border-border rounded-md px-2 py-1 text-sm w-28"
                    />
                  </>
                ) : (
                  <span className="text-muted-foreground text-xs">Cerrado</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SEO ─────────────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm font-semibold mb-3">SEO / Redes sociales</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="seo-title">Título de la pestaña</Label>
            <Input
              id="seo-title"
              value={`${nombre || "Karma"} — Menú`}
              readOnly
              className="opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se genera automáticamente desde el nombre del negocio.
            </p>
          </div>
          <div>
            <Label htmlFor="seo-desc">
              Meta descripción <span className="text-muted-foreground font-normal">({seoDescription.length}/160)</span>
            </Label>
            <Textarea
              id="seo-desc"
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value.slice(0, 160))}
              rows={3}
              placeholder="Breve descripción que aparece en Google y al compartir en redes sociales."
            />
          </div>
          <div>
            <Label htmlFor="og-image">Imagen para redes sociales (og:image)</Label>
            <Input
              id="og-image"
              value={ogImage}
              onChange={(e) => setOgImage(e.target.value)}
              placeholder="https://tudominio.com/imagen.jpg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              URL pública de la imagen que aparece al compartir el link en WhatsApp, Instagram, etc. Mínimo 1200×630px recomendado.
            </p>
          </div>
        </div>
      </div>

      {/* ── Contraseña ───────────────────────────────────────────────────────── */}
      <div className="pt-2 border-t border-border">
        <p className="text-sm font-semibold mb-3">Cambiar contraseña</p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="new-pass">Nueva contraseña</Label>
            <Input
              id="new-pass"
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
            />
          </div>
          <div>
            <Label htmlFor="confirm-pass">Confirmar contraseña</Label>
            <Input
              id="confirm-pass"
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          {passError && <p className="text-sm text-destructive">{passError}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={guardar} className="bg-gradient-brand text-brand-foreground">
          Guardar cambios
        </Button>
        {saved && <span className="text-sm text-primary font-semibold">✓ Guardado</span>}
      </div>
    </div>
  );
}

/* -------------------- Promos -------------------- */

function PromosTab() {
  const [subTab, setSubTab] = useState<"popups" | "codigos">("popups");
  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex gap-2">
        {(["popups", "codigos"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setSubTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
              subTab === t ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "popups" ? "Popups" : "Códigos promo"}
          </button>
        ))}
      </div>
      {subTab === "popups" ? <PopupsSubTab /> : <CodesSubTab />}
    </div>
  );
}

function PopupsSubTab() {
  const { state, update } = useAppState();
  const [editing, setEditing] = useState<Promo | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Promo | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Popups promocionales</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se muestran como popup al entrar al catálogo, una vez por sesión.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-gradient-brand text-brand-foreground">
          <Plus className="h-4 w-4 mr-1" /> Nueva
        </Button>
      </div>

      {state.promos.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          No hay promociones. Crea una para anunciar algo especial.
        </div>
      ) : (
        <div className="space-y-3">
          {state.promos.map((p) => {
            const today = new Date().toISOString().slice(0, 10);
            const active = p.activo && today >= p.desde && today <= p.hasta;
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 flex gap-4">
                {p.imagen && (
                  <img src={p.imagen} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{p.titulo}</p>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      active ? "bg-green-500/20 text-green-400" : p.activo ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground"
                    }`}>
                      {active ? "Activa ahora" : p.activo ? "Programada" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.desde} → {p.hasta}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setToDelete(p)}
                    className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PromoFormDialog
        open={creating || !!editing}
        promo={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={(promo) => {
          update((s) => ({
            ...s,
            promos: editing
              ? s.promos.map((x) => (x.id === promo.id ? promo : x))
              : [...s.promos, promo],
          }));
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará "{toDelete?.titulo}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (toDelete) {
                  update((s) => ({ ...s, promos: s.promos.filter((x) => x.id !== toDelete.id) }));
                  setToDelete(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PromoFormDialog({
  open, promo, onClose, onSave,
}: {
  open: boolean;
  promo: Promo | null;
  onClose: () => void;
  onSave: (p: Promo) => void;
}) {
  const [titulo, setTitulo] = useState(promo?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(promo?.descripcion ?? "");
  const [imagen, setImagen] = useState(promo?.imagen ?? "");
  const [desde, setDesde] = useState(promo?.desde ?? "");
  const [hasta, setHasta] = useState(promo?.hasta ?? "");
  const [activo, setActivo] = useState(promo?.activo ?? true);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = (p: Promo | null) => {
    setTitulo(p?.titulo ?? "");
    setDescripcion(p?.descripcion ?? "");
    setImagen(p?.imagen ?? "");
    setDesde(p?.desde ?? "");
    setHasta(p?.hasta ?? "");
    setActivo(p?.activo ?? true);
  };

  // Sincronizar form cuando el diálogo abre o cambia el promo seleccionado
  useEffect(() => {
    if (open) reset(promo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, promo?.id]);

  const submit = () => {
    if (!titulo.trim() || !desde || !hasta) return;
    onSave({
      id: promo?.id ?? uid(),
      activo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      imagen,
      desde,
      hasta,
    });
    reset(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); reset(null); } else reset(promo); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{promo ? "Editar promoción" : "Nueva promoción"}</DialogTitle>
          <DialogDescription>El popup se muestra una vez por sesión cuando está activo y dentro del rango de fechas.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Imagen (opcional)</Label>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-20 w-20 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                {imagen
                  ? <img src={imagen} alt="" className="w-full h-full object-cover" />
                  : <ImageOff className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex flex-col gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  {imagen ? "Cambiar" : "Subir imagen"}
                </Button>
                {imagen && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setImagen("")}>
                    Quitar
                  </Button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    compressImage(f, 800, "jpeg", 0.85)
                      .then(setImagen)
                      .catch(() => alert("Error al procesar imagen"));
                  }}
                />
              </div>
            </div>
          </div>
          <div>
            <Label htmlFor="pt">Título</Label>
            <Input id="pt" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} />
          </div>
          <div>
            <Label htmlFor="pd">Descripción ({descripcion.length}/200)</Label>
            <Textarea id="pd" value={descripcion}
              onChange={(e) => setDescripcion(e.target.value.slice(0, 200))} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pd-desde">Desde</Label>
              <Input id="pd-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="pd-hasta">Hasta</Label>
              <Input id="pd-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm font-medium">Activa</span>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onClose(); reset(null); }}>Cancelar</Button>
          <Button
            onClick={submit}
            disabled={!titulo.trim() || !desde || !hasta}
            className="bg-gradient-brand text-brand-foreground"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- Códigos promo -------------------- */

function CodesSubTab() {
  const { state, update } = useAppState();
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<PromoCode | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const codeStatus = (c: PromoCode) => {
    if (!c.activo) return { label: "Inactivo", cls: "bg-muted text-muted-foreground" };
    if (c.limite_tiempo && (today < c.desde || today > c.hasta))
      return { label: "Fuera de rango", cls: "bg-yellow-500/20 text-yellow-400" };
    if (c.limite_usos && c.usos_actuales >= c.usos_maximos)
      return { label: "Agotado", cls: "bg-red-500/20 text-red-400" };
    return { label: "Activo", cls: "bg-green-500/20 text-green-400" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Códigos promocionales</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Códigos de descuento que los clientes ingresan en el carrito.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-gradient-brand text-brand-foreground">
          <Plus className="h-4 w-4 mr-1" /> Nuevo
        </Button>
      </div>

      {state.codes.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl">
          No hay códigos. Crea uno para empezar.
        </div>
      ) : (
        <div className="space-y-3">
          {state.codes.map((c) => {
            const status = codeStatus(c);
            return (
              <div key={c.id} className="bg-card border border-border rounded-xl p-4 flex gap-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                  <Hash className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold tracking-widest text-primary">{c.code}</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status.cls}`}>{status.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.descuento_tipo === "porcentaje" ? `${c.descuento_valor}% de descuento` : `$${c.descuento_valor.toLocaleString("es-CO")} de descuento`}
                    {c.descripcion ? ` · ${c.descripcion}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.limite_usos && `${c.usos_actuales}/${c.usos_maximos} usos`}
                    {c.limite_usos && c.limite_tiempo && " · "}
                    {c.limite_tiempo && `${c.desde} → ${c.hasta}`}
                    {!c.limite_usos && !c.limite_tiempo && "Sin límites"}
                  </p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive"
                    onClick={() => setToDelete(c)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CodeFormDialog
        open={creating || !!editing}
        code={editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        onSave={(code) => {
          update((s) => ({
            ...s,
            codes: editing
              ? s.codes.map((x) => (x.id === code.id ? code : x))
              : [...s.codes, code],
          }));
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar código?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminará el código "{toDelete?.code}".</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground"
              onClick={() => {
                if (toDelete) {
                  update((s) => ({ ...s, codes: s.codes.filter((x) => x.id !== toDelete.id) }));
                  setToDelete(null);
                }
              }}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CodeFormDialog({
  open, code, onClose, onSave,
}: {
  open: boolean;
  code: PromoCode | null;
  onClose: () => void;
  onSave: (c: PromoCode) => void;
}) {
  const [codeStr, setCodeStr] = useState(code?.code ?? "");
  const [descripcion, setDescripcion] = useState(code?.descripcion ?? "");
  const [descTipo, setDescTipo] = useState<"porcentaje" | "fijo">(code?.descuento_tipo ?? "porcentaje");
  const [descValor, setDescValor] = useState<string>(code?.descuento_valor?.toString() ?? "");
  const [limUsos, setLimUsos] = useState(code?.limite_usos ?? false);
  const [usosMax, setUsosMax] = useState<string>(code?.usos_maximos?.toString() ?? "100");
  const [usosAct, setUsosAct] = useState<number>(code?.usos_actuales ?? 0);
  const [limTiempo, setLimTiempo] = useState(code?.limite_tiempo ?? false);
  const [desde, setDesde] = useState(code?.desde ?? "");
  const [hasta, setHasta] = useState(code?.hasta ?? "");
  const [activo, setActivo] = useState(code?.activo ?? true);

  useEffect(() => {
    if (open) {
      setCodeStr(code?.code ?? "");
      setDescripcion(code?.descripcion ?? "");
      setDescTipo(code?.descuento_tipo ?? "porcentaje");
      setDescValor(code?.descuento_valor?.toString() ?? "");
      setLimUsos(code?.limite_usos ?? false);
      setUsosMax(code?.usos_maximos?.toString() ?? "100");
      setUsosAct(code?.usos_actuales ?? 0);
      setLimTiempo(code?.limite_tiempo ?? false);
      setDesde(code?.desde ?? "");
      setHasta(code?.hasta ?? "");
      setActivo(code?.activo ?? true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, code?.id]);

  const submit = () => {
    const valor = parseFloat(descValor);
    if (!codeStr.trim() || isNaN(valor) || valor <= 0) return;
    if (limUsos && (!usosMax || parseInt(usosMax, 10) <= 0)) return;
    if (limTiempo && (!desde || !hasta)) return;
    onSave({
      id: code?.id ?? uid(),
      code: codeStr.toUpperCase().trim().replace(/\s+/g, ""),
      descripcion: descripcion.trim(),
      descuento_tipo: descTipo,
      descuento_valor: valor,
      limite_usos: limUsos,
      usos_maximos: parseInt(usosMax, 10) || 0,
      usos_actuales: usosAct,
      limite_tiempo: limTiempo,
      desde,
      hasta,
      activo,
    });
  };

  const canSave = codeStr.trim() && parseFloat(descValor) > 0
    && (!limUsos || parseInt(usosMax, 10) > 0)
    && (!limTiempo || (desde && hasta));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{code ? "Editar código" : "Nuevo código"}</DialogTitle>
          <DialogDescription>El cliente lo ingresa en el carrito para obtener el descuento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="cd-code">Código</Label>
            <Input
              id="cd-code"
              value={codeStr}
              onChange={(e) => setCodeStr(e.target.value.toUpperCase().replace(/\s+/g, ""))}
              placeholder="KARMA20"
              className="font-display tracking-widest uppercase"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1">Solo letras y números, sin espacios.</p>
          </div>
          <div>
            <Label htmlFor="cd-desc">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input id="cd-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={80} />
          </div>

          {/* Tipo y valor del descuento */}
          <div>
            <Label>Tipo de descuento</Label>
            <div className="flex gap-2 mt-1">
              {(["porcentaje", "fijo"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDescTipo(t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition ${
                    descTipo === t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  {t === "porcentaje" ? "Porcentaje (%)" : "Monto fijo ($)"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="cd-valor">
              {descTipo === "porcentaje" ? "Porcentaje de descuento" : "Monto de descuento (COP)"}
            </Label>
            <div className="flex items-center gap-1 mt-1">
              <Input
                id="cd-valor"
                type="number"
                min={0}
                max={descTipo === "porcentaje" ? 100 : undefined}
                value={descValor}
                onChange={(e) => setDescValor(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">{descTipo === "porcentaje" ? "%" : "COP"}</span>
            </div>
          </div>

          {/* Límite por usos */}
          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <div>
              <span className="text-sm font-medium">Límite de usos</span>
              <p className="text-xs text-muted-foreground">El código se desactiva al alcanzar el máximo.</p>
            </div>
            <Switch checked={limUsos} onCheckedChange={setLimUsos} />
          </label>
          {limUsos && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cd-usos-max">Usos máximos</Label>
                <Input id="cd-usos-max" type="number" min={1} value={usosMax}
                  onChange={(e) => setUsosMax(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Usos actuales</Label>
                <Input value={usosAct} readOnly className="mt-1 opacity-60 cursor-not-allowed" />
              </div>
            </div>
          )}

          {/* Límite por tiempo */}
          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <div>
              <span className="text-sm font-medium">Límite de tiempo</span>
              <p className="text-xs text-muted-foreground">Solo válido entre las fechas indicadas.</p>
            </div>
            <Switch checked={limTiempo} onCheckedChange={setLimTiempo} />
          </label>
          {limTiempo && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="cd-desde">Desde</Label>
                <Input id="cd-desde" type="date" value={desde}
                  onChange={(e) => setDesde(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="cd-hasta">Hasta</Label>
                <Input id="cd-hasta" type="date" value={hasta}
                  onChange={(e) => setHasta(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm font-medium">Activo</span>
            <Switch checked={activo} onCheckedChange={setActivo} />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={!canSave} className="bg-gradient-brand text-brand-foreground">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

