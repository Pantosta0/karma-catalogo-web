import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

/**
 * ¿Se llegó aquí recargando, en vez de navegando o por el historial?
 *
 * `history.scrollRestoration` ya está en `manual` — lo pone el router — así que
 * quien devuelve a la gente a mitad de página al recargar no es el navegador
 * sino la caché propia del router. Por eso esto se resuelve en sus opciones y
 * no tocando `history`.
 *
 * Se distingue `reload` de `back_forward` a propósito: volver atrás y encontrar
 * el menú donde lo dejaste es justo lo que uno espera. Recargar es otra cosa —
 * se recarga cuando algo se ve raro, y aterrizar otra vez en el mismo sitio
 * raro es lo contrario de lo que se pedía.
 */
const LLEGO_RECARGANDO = (() => {
  if (typeof performance === "undefined") return false;
  const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  return nav?.type === "reload";
})();

/** El `href` que usa el router es la ruta —`/menu/asados-f726`—, no la URL
 *  absoluta. Comparar contra `window.location.href` no coincide nunca. */
const RUTA_INICIAL =
  typeof window === "undefined"
    ? ""
    : window.location.pathname + window.location.search + window.location.hash;

export const getRouter = () => {
  const queryClient = new QueryClient();

  // Se apaga sólo para la dirección en la que cayó la recarga, y se vuelve a
  // encender en cuanto se evalúa cualquier otra. Así la recarga empieza arriba
  // sin que el menú pierda la restauración al ir y volver de una categoría.
  let saltarRestauracion = LLEGO_RECARGANDO;

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: ({ location }) => {
      if (saltarRestauracion && location.href === RUTA_INICIAL) return false;
      saltarRestauracion = false;
      return true;
    },
    // Al apuntar o tocar un enlace se baja el chunk de esa ruta sin esperar al
    // clic. Con el menú repartido en rutas y `autoCodeSplitting` activo, cada
    // categoría es un archivo aparte: sin esto el primer toque en una tarjeta
    // se queda en blanco mientras llega el JS.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
