import type { DaySchedule } from "./storage";

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

/**
 * El horario en filas para mostrar, agrupando días seguidos que abren igual.
 *
 * Karma abre hoy de 11 a 21 los siete días. Listar eso como siete filas
 * idénticas es ruido: se colapsa en «Todos los días». Cuando el horario deja de
 * ser uniforme —un domingo distinto, un cierre entre semana— los grupos se
 * parten solos y aparece «Lunes a Sábado» y «Domingo» por separado.
 *
 * La semana empieza el lunes, no el domingo como el array: nadie lee su horario
 * empezando por el fin de semana.
 */
export function groupSchedule(
  schedule: DaySchedule[] | undefined,
): { dias: string; horario: string }[] {
  if (!schedule || schedule.length !== 7) return [];

  const orden = [1, 2, 3, 4, 5, 6, 0]; // lunes → domingo
  const clave = (d: DaySchedule) => (d.open ? `${d.from}-${d.to}` : "cerrado");

  const grupos: { indices: number[]; k: string }[] = [];
  for (const i of orden) {
    const k = clave(schedule[i]);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.k === k) ultimo.indices.push(i);
    else grupos.push({ indices: [i], k });
  }

  // Los siete días iguales son el caso normal, y merece su propia frase.
  if (grupos.length === 1 && grupos[0].indices.length === 7) {
    const d = schedule[1];
    return [{ dias: "Todos los días", horario: d.open ? `${d.from} – ${d.to}` : "Cerrado" }];
  }

  return grupos.map(({ indices, k }) => {
    const primero = DIAS[indices[0]];
    const ultimo = DIAS[indices[indices.length - 1]];
    return {
      dias: indices.length === 1 ? primero : `${primero} a ${ultimo}`,
      horario: k === "cerrado" ? "Cerrado" : k.replace("-", " – "),
    };
  });
}

// Calcula si el negocio está abierto ahora según el horario (zona horaria Bogotá)
export function getIsOpen(schedule: DaySchedule[] | undefined): boolean | null {
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

// Devuelve cuándo abre el negocio la próxima vez (texto legible)
export function getNextOpeningTime(schedule: DaySchedule[]): string | null {
  if (!schedule || schedule.length !== 7) return null;
  const bogota = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Bogota" }));
  const todayDay = bogota.getDay();
  const todayMins = bogota.getHours() * 60 + bogota.getMinutes();
  const dayNames = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

  // Quizás hoy aún abra más tarde
  const todayDs = schedule[todayDay];
  if (todayDs?.open) {
    const [fh, fm] = todayDs.from.split(":").map(Number);
    if (todayMins < fh * 60 + fm) return `hoy a las ${todayDs.from}`;
  }

  // Siguiente día con horario abierto
  for (let i = 1; i <= 7; i++) {
    const dayIdx = (todayDay + i) % 7;
    const ds = schedule[dayIdx];
    if (ds?.open) {
      const label = i === 1 ? "mañana" : `el ${dayNames[dayIdx]}`;
      return `${label} a las ${ds.from}`;
    }
  }
  return null;
}
