// src/pages/Calendar.tsx
import React, { useEffect, useMemo, useState } from "react";

type EventType = "Visita" | "Reunión" | "Llamada" | "Tarea";
type CalEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string;   // YYYY-MM-DD
  time?: string;  // HH:mm
  place?: string;
  note?: string;
};

const STORAGE_KEY = "pmc_calendar_events";

/* ── utils de fecha ───────────────────────────────────────── */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monthName = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString(undefined, { year: "numeric", month: "long" });
const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const startWeekday = (y: number, m: number) => { const wd = startOfMonth(y, m).getDay(); return wd === 0 ? 6 : wd - 1; };
const sameISO = (a?: string, b?: string) => !!a && !!b && a === b;
const betweenISO = (iso: string, from: string, to: string) => iso >= from && iso <= to;

/* ── semillas demo ────────────────────────────────────────── */
const SEED_POOL: Omit<CalEvent, "id" | "date" | "time">[] = [
  { type: "Visita",  title: "Visita a propiedad", place: "Chico Norte", note: "Cliente: Juan Pérez" },
  { type: "Reunión", title: "Reunión con cliente", place: "Oficina", note: "Caso: Rosales" },
  { type: "Llamada", title: "Llamada de seguimiento", place: "Remoto", note: "Cliente: Sofía" },
  { type: "Tarea",   title: "Enviar propuesta", place: "Correo", note: "Cedritos" },
  { type: "Visita",  title: "Tour de propiedades", place: "Usaquén Centro", note: "Cliente: Laura" },
  { type: "Reunión", title: "Negociación avanzada", place: "Sala A", note: "Chapinero" },
];
const randomHour = () => { const h = 9 + Math.floor(Math.random() * 8); const m = Math.random() > 0.5 ? "00" : "30"; return `${pad(h)}:${m}`; };

function seedNext7(): CalEvent[] {
  const base = new Date();
  const todayISO = toISO(base);
  const howMany = 8 + Math.floor(Math.random() * 5);
  const list: CalEvent[] = [];

  for (let i = 0; i < howMany; i++) {
    const def = SEED_POOL[Math.floor(Math.random() * SEED_POOL.length)];
    const plusDays = Math.floor(Math.random() * 7);
    list.push({
      id: `seed_${i}_${Math.random().toString(36).slice(2, 7)}`,
      date: toISO(addDays(base, plusDays)),
      type: def.type, title: def.title, time: randomHour(), place: def.place, note: def.note,
    });
  }
  if (!list.some(e => e.date === todayISO)) {
    const def = SEED_POOL[Math.floor(Math.random() * SEED_POOL.length)];
    list.push({
      id: `seed_today_${Math.random().toString(36).slice(2, 7)}`,
      date: todayISO,
      type: def.type, title: def.title, time: randomHour(), place: def.place, note: def.note,
    });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}


/* ── paginador ────────────────────────────────────────────── */
type PagerProps = { page: number; total: number; onPage: (p: number) => void; };
const Pager: React.FC<PagerProps> = ({ page, total, onPage }) => {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 10, alignItems: "center" }}>
      <button className="btn-ghost" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1}>‹</button>
      <span className="chip chip--active" style={{ minWidth: 56, textAlign: "center" }}>{page}/{total}</span>
      <button className="btn-ghost" onClick={() => onPage(Math.min(total, page + 1))} disabled={page === total}>›</button>
    </div>
  );
};

/* ── componente ───────────────────────────────────────────── */
const PAGE_SIZE = 5;

const CalendarPage: React.FC = () => {
  const todayISO = toISO(new Date());
  const [hydrated, setHydrated] = useState(false);          // ★ evita sobrescribir LS con []
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [open, setOpen] = useState(false);

  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selected, setSelected] = useState<string>(todayISO);
  const [tab, setTab] = useState<EventType | "Todos">("Todos");
  const [nextPage, setNextPage] = useState(1);
  const [dayPage, setDayPage] = useState(1);

  // hidratar
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: CalEvent[] = JSON.parse(raw);
        setEvents(Array.isArray(parsed) ? parsed : []);
      } catch { setEvents([]); }
    } else {
      setEvents(seedNext7());
      setSelected(todayISO);
    }
    setHydrated(true);
  }, [todayISO]);
useEffect(() => {
  const reload = () => {
    try {
      const parsed: CalEvent[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      setEvents(Array.isArray(parsed) ? parsed : []);
    } catch {
      /* noop */
    }
  };
  document.addEventListener("pmc:events-updated", reload);
  window.addEventListener("storage", reload);
  return () => {
    document.removeEventListener("pmc:events-updated", reload);
    window.removeEventListener("storage", reload);
  };
}, []);

  // persistir (solo cuando ya hidrató)
  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events, hydrated]);

  const goToday = () => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); setSelected(toISO(d)); };
  const prevMonth = () => setCursor((c) => (c.month - 1 < 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }));
  const nextMonth = () => setCursor((c) => (c.month + 1 > 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }));

  const grid = useMemo(() => {
    const { year, month } = cursor;
    const total = daysInMonth(year, month);
    const start = startWeekday(year, month);
    const cells: { iso?: string; day?: number }[] = [];
    for (let i = 0; i < start; i++) cells.push({});
    for (let d = 1; d <= total; d++) cells.push({ iso: toISO(new Date(year, month, d)), day: d });
    while (cells.length % 7 !== 0) cells.push({});
    return cells;
  }, [cursor]);

  const matchTab = (e: CalEvent) => tab === "Todos" || e.type === tab;

  const next7All = useMemo(() => {
    const from = todayISO;
    const to = toISO(addDays(new Date(), 7));
    return events
      .filter((e) => betweenISO(e.date, from, to))
      .filter(matchTab)
      .sort((a, b) => (a.date + "T" + (a.time || "00:00")).localeCompare(b.date + "T" + (b.time || "00:00")));
  }, [events, todayISO, tab]);

  const nextTotalPages = Math.max(1, Math.ceil(next7All.length / PAGE_SIZE));
  const nextVisible = useMemo(() => next7All.slice((nextPage - 1) * PAGE_SIZE, (nextPage) * PAGE_SIZE), [next7All, nextPage]);

  const dayEvents = useMemo(() => {
    return events.filter((e) => sameISO(e.date, selected)).filter(matchTab)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, selected, tab]);

  const dayTotalPages = Math.max(1, Math.ceil(dayEvents.length / PAGE_SIZE));
  const dayVisible = useMemo(() => dayEvents.slice((dayPage - 1) * PAGE_SIZE, (dayPage) * PAGE_SIZE), [dayEvents, dayPage]);

  const [form, setForm] = useState<CalEvent>({ id: "", type: "Visita", title: "", date: todayISO, time: "", place: "", note: "" });

  const saveEvent = () => {
    if (!form.title.trim()) { alert("El título es obligatorio"); return; }
    const newE: CalEvent = { ...form, id: "e_" + Math.random().toString(36).slice(2, 9) };
    setEvents((prev) => [...prev, newE]);
    setOpen(false);
    setForm({ id: "", type: "Visita", title: "", date: todayISO, time: "", place: "", note: "" });
    setDayPage(1); setNextPage(1);
  };

  const removeEvent = (id: string) => { if (!confirm("¿Eliminar este evento?")) return; setEvents((prev) => prev.filter((e) => e.id !== id)); };

  const labelForTab = (t: EventType | "Todos") => t === "Todos" ? "Todos" : t === "Visita" ? "Visitas" : t === "Reunión" ? "Reuniones" : t === "Llamada" ? "Llamadas" : "Tareas";
  const iconFor = (t: EventType) => t === "Visita" ? "" : t === "Reunión" ? "" : t === "Llamada" ? "" : "";
  const formatLong = (iso?: string, time?: string) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    const dd = d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
    return time ? `${dd} · ${time}` : dd;
  };

  return (
    <div className="page">
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">📆</div>
            <div><div className="card-title">Calendario</div><div className="card-desc">Tus visitas y reuniones</div></div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-ghost" onClick={goToday}>Hoy</button>
            <button className="btn-ghost" onClick={prevMonth}>‹</button>
            <div className="chip chip--active" style={{ cursor: "default" }}>{monthName(cursor.year, cursor.month)}</div>
            <button className="btn-ghost" onClick={nextMonth}>›</button>
            <button className="btn-ghost" title="Sembrar demo (incluye hoy)" onClick={() => { setEvents(seedNext7()); setSelected(todayISO); setNextPage(1); setDayPage(1); goToday(); }}>Demo</button>
            <button className="btn-primary" onClick={() => { setForm((f) => ({ ...f, date: selected || todayISO })); setOpen(true); }}>+ Nuevo</button>
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ marginTop: -6 }}>
        <div className="chips">
          {(["Todos", "Visita", "Reunión", "Llamada", "Tarea"] as const).map((t) => (
            <button key={t} className={"chip" + (tab === t ? " chip--active" : "")}
              onClick={() => { setTab(t); setDayPage(1); setNextPage(1); }}>{labelForTab(t)}</button>
          ))}
        </div>
      </div>

      <div className="calendar-shell">
        <div className="calendar-grid">
          <div className="cal-head">{["L","M","X","J","V","S","D"].map((d) => <div key={d} className="cal-head-cell">{d}</div>)}</div>
          <div className="cal-body">
            {grid.map((c, i) => {
              if (!c.iso) return <div key={i} className="cal-cell cal-cell--empty" />;
              const iso = c.iso as string;
              const isToday = sameISO(iso, todayISO);
              const isSelected = sameISO(iso, selected);
              const dayHas = events.some((e) => sameISO(e.date, iso));
              return (
                <button key={i}
                  className={"cal-cell" + (isToday ? " is-today" : "") + (isSelected ? " is-selected" : "")}
                  onClick={() => { setSelected(iso); setDayPage(1); }} title={iso}>
                  <span className="cal-day">{c.day}</span>
                  {dayHas ? <span className="dot" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mini-card" style={{ marginTop: 12 }}>
        <div className="kpi-title">{formatLong(selected)} — {labelForTab(tab)}</div>
        {dayVisible.length === 0 ? <div className="empty">Sin eventos para este día.</div> : (
          <>
            <div className="list">
              {dayVisible.map((e) => (
                <div key={e.id} className="list-item">
                  <div className="list-left">
                    <div className="badge">{iconFor(e.type)}</div>
                    <div>
                      <div className="list-title">{e.title}</div>
                      <div className="list-desc">{e.time ? `${e.time} · ` : ""}{e.place || e.type}</div>
                      {e.note ? <div className="list-note">{e.note}</div> : null}
                    </div>
                  </div>
                  <div className="list-right"><button className="btn-ghost" onClick={() => removeEvent(e.id)}>Eliminar</button></div>
                </div>
              ))}
            </div>
            <Pager page={dayPage} total={dayTotalPages} onPage={setDayPage} />
          </>
        )}
      </div>

      <div className="mini-card" style={{ marginTop: 14 }}>
        <div className="kpi-title">Próximos 7 días — {labelForTab(tab)}</div>
        {nextVisible.length === 0 ? <div className="empty">No hay eventos próximos.</div> : (
          <>
            <div className="list">
              {nextVisible.map((e) => (
                <div key={e.id} className="list-item">
                  <div className="list-left">
                    <div className="badge">{iconFor(e.type)}</div>
                    <div>
                      <div className="list-title">{e.title}</div>
                      <div className="list-desc">{formatLong(e.date, e.time)} · {e.place || e.type}</div>
                    </div>
                  </div>
                  <div className="list-right"><button className="btn-ghost" onClick={() => removeEvent(e.id)}>Eliminar</button></div>
                </div>
              ))}
            </div>
            <Pager page={nextPage} total={nextTotalPages} onPage={setNextPage} />
          </>
        )}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nuevo evento</h3>
            <div className="form-grid">
              <label><span>Título*</span>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ej. Visita a propiedad" />
              </label>
              <label><span>Tipo</span>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}>
                  <option>Visita</option><option>Reunión</option><option>Llamada</option><option>Tarea</option>
                </select>
              </label>
              <label><span>Fecha</span>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
              </label>
              <label><span>Hora</span>
                <input type="time" value={form.time || ""} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
              </label>
              <label><span>Lugar</span>
                <input value={form.place || ""} onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))} placeholder="Dirección, videollamada, etc." />
              </label>
              <label style={{ gridColumn: "1 / -1" }}><span>Notas</span>
                <textarea rows={3} value={form.note || ""} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} placeholder="Detalles adicionales…" />
              </label>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveEvent}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
