import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useAppState } from "@/lib/app-store";
import { uid, type Product, type Category } from "@/lib/storage";
import { formatCOP } from "@/lib/cart";
import logoAsset from "@/assets/logo-bunuelos.png.asset.json";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, LogOut, Store, Tag, ImageOff, ArrowLeft, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Los Buñuelos" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { state, loading, update } = useAppState();
  const [tab, setTab] = useState<"productos" | "categorias" | "negocio">("productos");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Cargando…</p>
        </div>
      </div>
    );
  }

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
          <img src={state.config.logo || logoAsset.url} alt="" className="h-9 w-auto" />
          <div>
            <h1 className="font-display font-bold text-primary leading-none">Panel de administración</h1>
            <p className="text-xs text-muted-foreground">{state.config.nombre}</p>
          </div>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => update((s) => ({ ...s, adminSession: false }))}
          >
            <LogOut className="h-4 w-4 mr-1" /> Salir
          </Button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-2 flex gap-2 overflow-x-auto">
          {([
            ["productos", "Productos", Store],
            ["categorias", "Categorías", Tag],
            ["negocio", "Negocio", Store],
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
      </main>
    </div>
  );
}

function LoginScreen() {
  const { state, update } = useAppState();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === state.adminAuth.user && pass === state.adminAuth.pass) {
      update((s) => ({ ...s, adminSession: true }));
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  const logoUrl = state.config.logo || logoAsset.url;

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

  const catName = (id: string) => state.categorias.find((c) => c.id === id)?.nombre ?? "—";

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
                  <p className="text-xs text-muted-foreground">{catName(p.categoriaId)}</p>
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
  const [categoriaId, setCategoriaId] = useState(product?.categoriaId ?? state.categorias[0]?.id ?? "");
  const [foto, setFoto] = useState(product?.foto ?? "");
  const [disponible, setDisponible] = useState(product?.disponible ?? true);
  const fileRef = useRef<HTMLInputElement>(null);

  // reset cuando cambia product/open
  useState(() => {});

  const handleFile = (f: File) => {
    if (f.size > 2 * 1024 * 1024) {
      alert("La imagen debe ser menor a 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const submit = () => {
    const p = parseInt(precio, 10);
    if (!nombre.trim() || !categoriaId || isNaN(p) || p < 0) return;
    onSave({
      id: product?.id ?? uid(),
      nombre: nombre.trim(),
      descripcion: descripcion.trim().slice(0, 120),
      precio: p,
      categoriaId,
      foto,
      disponible,
    });
    onClose();
    // reset
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setFoto("");
    setDisponible(true);
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
          setCategoriaId(product.categoriaId);
          setFoto(product.foto);
          setDisponible(product.disponible);
        } else if (o && !product) {
          setNombre("");
          setDescripcion("");
          setPrecio("");
          setCategoriaId(state.categorias[0]?.id ?? "");
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="pre">Precio (COP)</Label>
              <Input id="pre" type="number" min="0" value={precio} onChange={(e) => setPrecio(e.target.value)} />
            </div>
            <div>
              <Label>Categoría</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {state.categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center justify-between bg-muted rounded-lg p-3">
            <span className="text-sm font-medium">Disponible en el catálogo</span>
            <Switch checked={disponible} onCheckedChange={setDisponible} />
          </label>
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
    if (state.productos.some((p) => p.categoriaId === c.id)) {
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
  const [logo, setLogo] = useState(state.config.logo);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleLogo = (f: File) => {
    if (f.size > 1024 * 1024) {
      alert("El logo debe ser menor a 1MB");
      return;
    }
    const r = new FileReader();
    r.onload = () => setLogo(r.result as string);
    r.readAsDataURL(f);
  };

  const guardar = () => {
    update((s) => ({ ...s, config: { nombre: nombre.trim(), whatsapp: whatsapp.replace(/\D/g, ""), logo } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="font-display text-lg font-bold">Configuración del negocio</h2>
      <div>
        <Label>Logo personalizado (opcional)</Label>
        <div className="mt-1 flex items-center gap-3">
          <div className="h-16 w-32 rounded-lg bg-muted overflow-hidden flex items-center justify-center p-1">
            <img src={logo || logoAsset.url} alt="" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex flex-col gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              Subir logo
            </Button>
            {logo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogo("")}>
                Restaurar predeterminado
              </Button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && handleLogo(e.target.files[0])}
            />
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
      <div className="flex items-center gap-3">
        <Button onClick={guardar} className="bg-gradient-brand text-brand-foreground">
          Guardar cambios
        </Button>
        {saved && <span className="text-sm text-primary font-semibold">✓ Guardado</span>}
      </div>
    </div>
  );
}
