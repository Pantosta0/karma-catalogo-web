import type { DaySchedule } from "./storage";

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
