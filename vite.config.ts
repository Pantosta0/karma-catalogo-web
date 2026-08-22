import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        // Separar las dependencias del código de la app. No baja los bytes del
        // primer render (las tres se necesitan igual), pero sí hace que editar
        // el menú no invalide la caché de 95 kB gzip de librerías que no
        // cambiaron — importa en un negocio donde la gente vuelve a pedir.
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
          vendor: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-query"],
        },
      },
    },
  },
});
