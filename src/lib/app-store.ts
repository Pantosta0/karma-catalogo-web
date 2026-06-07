import { useEffect, useState, useCallback } from "react";
import { loadStateFromSupabase, saveStateToSupabase, DEFAULT_STATE, type AppState } from "./storage";

// Cache compartida entre todos los componentes que usen el hook
let memoryState: AppState | null = null;
let loadPromise: Promise<AppState> | null = null;
const listeners = new Set<(s: AppState) => void>();

function notify(s: AppState) {
  memoryState = s;
  listeners.forEach((l) => l(s));
}

// Carga los datos de Supabase una sola vez (singleton)
function ensureLoaded(): Promise<AppState> {
  if (memoryState) return Promise.resolve(memoryState);
  if (!loadPromise) {
    loadPromise = loadStateFromSupabase().then((s) => {
      memoryState = s;
      notify(s);
      return s;
    });
  }
  return loadPromise;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(memoryState ?? DEFAULT_STATE);
  const [loading, setLoading] = useState(!memoryState);

  useEffect(() => {
    // Si ya hay datos en memoria, usarlos de inmediato
    if (memoryState) {
      setState(memoryState);
      setLoading(false);
    }

    // Cargar de Supabase (o esperar la carga en curso)
    ensureLoaded().then((s) => {
      setState(s);
      setLoading(false);
    });

    // Suscribirse a cambios locales (del mismo tab)
    const listener = (s: AppState) => setState(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const update = useCallback((updater: (s: AppState) => AppState) => {
    const current = memoryState ?? DEFAULT_STATE;
    const next = updater(current);
    // Actualización optimista inmediata en la UI
    notify(next);
    // Guardar en Supabase en segundo plano
    saveStateToSupabase(next);
  }, []);

  return { state, loading, update };
}
