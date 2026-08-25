import { Link } from "@tanstack/react-router";
import { useAppState } from "@/lib/app-store";

/** Un solo footer: antes eran dos hermanos, y dos landmarks contentinfo
 *  compiten en la navegación por lector de pantalla. */
export function SiteFooter() {
  const { state } = useAppState();
  return (
    <footer className="mt-16 border-t border-border/40 pt-8 pb-8 max-w-5xl mx-auto px-4 flex flex-col items-center gap-2">
      <Link
        to="/politica-de-privacidad-y-uso-de-datos"
        className="focus-ring rounded text-sm text-muted-foreground hover:text-brand-bright transition-colors"
      >
        Política de Privacidad y Uso de Datos
      </Link>
      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} {state.config.nombre}
      </p>
    </footer>
  );
}
