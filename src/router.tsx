import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Al apuntar o tocar un enlace se baja el chunk de esa ruta sin esperar al
    // clic. Con el menú repartido en rutas y `autoCodeSplitting` activo, cada
    // categoría es un archivo aparte: sin esto el primer toque en una tarjeta
    // se queda en blanco mientras llega el JS.
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
