import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { useAppState } from "@/lib/app-store";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La página que buscas no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="focus-ring rounded inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Algo salió mal
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocurrió un error. Intenta recargar la página o vuelve al inicio.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="focus-ring rounded inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Solo el título por defecto. Las etiquetas que leen los crawlers y WhatsApp
  // viven en index.html — este bloque únicamente actualiza la pestaña abierta
  // cuando el usuario navega entre rutas dentro de la app.
  head: () => ({
    meta: [{ title: "Karma — Menú" }],
  }),

  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { state } = useAppState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // ── Favicon dinámico desde el logo cuadrado ──────────────────────────────
  useEffect(() => {
    const logo = state.config.logoSquare;
    if (!logo) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = logo;
    link.type = logo.startsWith("data:image/png") ? "image/png" : "image/jpeg";
  }, [state.config.logoSquare]);

  // ── Título del catálogo desde la config ─────────────────────────────────
  // Solo en "/": /admin y la política definen el suyo con head(). Depende de
  // pathname para volver a aplicarse al regresar al catálogo desde otra ruta.
  useEffect(() => {
    if (pathname !== "/") return;
    document.title = `${state.config.nombre || "Karma"} — Menú`;
  }, [state.config.nombre, pathname]);

  // ── Meta description desde la config ────────────────────────────────────
  // Nota: esto solo actualiza la pestaña abierta. Google y WhatsApp leen el
  // HTML servido (index.html) y nunca ejecutan este código.
  useEffect(() => {
    const desc = state.config.seoDescription;
    if (!desc) return;
    document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.setAttribute("content", desc);
  }, [state.config.seoDescription]);

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <Outlet />
      <Toaster theme="dark" position="top-center" closeButton />
    </QueryClientProvider>
  );
}
