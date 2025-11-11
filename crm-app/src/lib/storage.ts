// src/lib/storage.ts
export const KEY_CAL = "pmc_calendar_events";
export const KEY_CHAT = "pmc_assistant_chat_v1";
export type CalEvent = {
  id: string;
  type: "Visita" | "Reunión" | "Llamada" | "Tarea" | string;
  title: string;
  date: string;      // YYYY-MM-DD (mismo toISO de Home)
  time?: string;     // HH:mm
  place?: string;
};

const isISO = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

export function getEvents(): CalEvent[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY_CAL) || "[]");
    return Array.isArray(raw) ? raw.filter(e => e?.id && isISO(e?.date)) : [];
  } catch { return []; }
}

export function setEvents(list: CalEvent[]) {
  localStorage.setItem(KEY_CAL, JSON.stringify(list));
}

export function addEvent(evt: CalEvent) {
  const all = getEvents();
  // si coincide id, actualiza; si no, agrega
  const i = all.findIndex(e => e.id === evt.id);
  if (i >= 0) all[i] = evt; else all.push(evt);
  setEvents(all);
  return evt;
}

export function eventsByDate(iso: string) {
  return getEvents()
    .filter(e => e.date === iso)
    .sort((a,b)=> (a.time||"").localeCompare(b.time||""));
}

/* Chat (hilo del asistente) */
export type ChatMsg = { id: string; role: "user" | "assistant" | "system"; text: string; ts: number };
export function getChat(): ChatMsg[] {
  try { const v = JSON.parse(localStorage.getItem(KEY_CHAT)||"[]"); return Array.isArray(v) ? v : []; }
  catch { return []; }
}
export function setChat(list: ChatMsg[]) {
  localStorage.setItem(KEY_CHAT, JSON.stringify(list));
}
