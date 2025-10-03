// src/pages/Calendar.tsx
import React, { useEffect, useMemo, useState } from "react";

/* =========================
   Tipos y utilidades
========================= */

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

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const monthName = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleDateString(undefined, { year: "numeric", month: "long" });

const startOfMonth = (y: number, m: number) => new Date(y, m, 1);
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const startWeekday = (y: number, m: number) => {
  // 0=Sunday..6=Saturday -> queremos L(1) .. D(0)
  const wd = startOfMonth(y, m).getDay();
  return wd === 0 ? 6 : wd - 1; // Lunes=0
};

const sameISO = (a: string, b: string) => a === b;
const betweenISO = (iso: string, from: string, to: string) =>
  iso >= from && iso <= to;

/* =========================
   Semillas base (plantillas)
========================= */
const SEED: Omit<CalEvent, "id" | "date">[] = [
  {
    type: "Visita",
    title: "Visita a propiedad",
    time: "10:00",
    place: "Chico Norte",
    note: "Cliente: Juan Pérez",
  },
  {
    type: "Reunión",
    title: "Reunión de negociación",
    time: "14:30",
    place: "Oficina",
    note: "Caso: Rosales",
  },
  {
    type: "Llamada",
    title: "Llamada de seguimiento",
    time: "11:00",
    place: "Remoto",
    note: "Cliente: Sofía",
  },
  {
    type: "Tarea",
    title: "Enviar propuesta",
    time: "16:00",
    place: "Correo",
    note: "Cedritos",
  },
];

/* Siembra automática próximos 7 días */
function seedNext7(): CalEvent[] {
  const base = new Date();
  const plan = [1, 3, 5, 6]; // días desde hoy
  const seeded: CalEvent[] = plan.map((d, i) => {
    const t = SEED[i % SEED.length];
    return {
      id: `seed_${i}_${Math.random().toString(36).slice(2, 7)}`,
      date: toISO(addDays(base, d)),
      type: t.type,
      title: t.title,
      time: t.time,
      place: t.place,
      note: t.note,
    };
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

/* =========================
   Componente principal
========================= */

const CalendarPage: React.FC = () => {
  const todayISO = toISO(new Date());

  const [events, setEvents] = useState<CalEvent[]>([]);
  const [open, setOpen] = useState(false);

  // Fecha “cursor” del calendario
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // 0..11
  });

  // Día seleccionado (por defecto hoy)
  const [selected, setSelected] = useState<string>(todayISO);

  // Filtro por pestañas (opcional visual)
  const [tab, setTab] = useState<EventType | "Todos">("Todos");

  // Cargar / sembrar
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      setEvents(JSON.parse(raw));
    } else {
      const seeded = seedNext7();
      setEvents(seeded);
      setSelected(seeded[0].date);
    }
  }, []);

  // Persistir
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }, [events]);

  // Navegación
  const goToday = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelected(toISO(d));
  };
  const prevMonth = () => {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { ...c, month: m };
    });
  };
  const nextMonth = () => {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { ...c, month: m };
    });
  };

  // Cuadrícula del mes
  const grid = useMemo(() => {
    const { year, month } = cursor;
    const total = daysInMonth(year, month);
    const start = startWeekday(year, month); // 0..6 L..D
    const cells: { iso?: string; day?: number }[] = [];
    // celdas previas vacías
    for (let i = 0; i < start; i++) cells.push({});
    // días del mes
    for (let d = 1; d <= total; d++) {
      const iso = toISO(new Date(year, month, d));
      cells.push({ iso, day: d });
    }
    // completar a múltiplos de 7
    while (cells.length % 7 !== 0) cells.push({});
    return cells;
  }, [cursor]);

  // Próximos 7 días
  const next7 = useMemo(() => {
    const from = todayISO;
    const to = toISO(addDays(new Date(), 7));
    return events
      .filter((e) => betweenISO(e.date, from, to))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, todayISO]);

  // Eventos del día seleccionado
  const dayEvents = useMemo(() => {
    const list = events.filter((e) => sameISO(e.date, selected));
    const filtered = tab === "Todos" ? list : list.filter((e) => e.type === tab);
    return filtered.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [events, selected, tab]);

  // Crear evento
  const [form, setForm] = useState<CalEvent>({
    id: "",
    type: "Visita",
    title: "",
    date: todayISO,
    time: "",
    place: "",
    note: "",
  });

  const saveEvent = () => {
    if (!form.title.trim()) {
      alert("El título es obligatorio");
      return;
    }
    const newE: CalEvent = { ...form, id: "e_" + Math.random().toString(36).slice(2, 9) };
    setEvents((prev) => [...prev, newE]);
    setOpen(false);
    setForm({
      id: "",
      type: "Visita",
      title: "",
      date: todayISO,
      time: "",
      place: "",
      note: "",
    });
  };

  const removeEvent = (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  /* =========================
     Render
  ========================= */

  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">📆</div>
            <div>
              <div className="card-title">Calendario</div>
              <div className="card-desc">Tus visitas y reuniones</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-ghost" onClick={goToday}>Hoy</button>
            <button className="btn-ghost" onClick={prevMonth}>‹</button>
            <div className="chip chip--active" style={{ cursor: "default" }}>
              {monthName(cursor.year, cursor.month)}
            </div>
            <button className="btn-ghost" onClick={nextMonth}>›</button>
            <button
              className="btn-ghost"
              title="Sembrar demo próximos 7 días"
              onClick={() => {
                const seeded = seedNext7();
                setEvents(seeded);
                setSelected(seeded[0].date);
                goToday();
              }}
            >
              Demo
            </button>
            <button className="btn-primary" onClick={() => {
              setForm((f) => ({ ...f, date: selected }));
              setOpen(true);
            }}>
              + Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Tabs rápidas (opcional visual) */}
      <div className="toolbar" style={{ marginTop: -6 }}>
        <div className="chips">
          {(["Todos", "Visita", "Reunión", "Llamada", "Tarea"] as const).map((t) => (
            <button
              key={t}
              className={"chip" + (tab === t ? " chip--active" : "")}
              onClick={() => setTab(t)}
            >
              {t === "Todos" ? "Todos" : t + (t === "Reunión" ? "es" : "s")}
            </button>
          ))}
        </div>
      </div>
    {/* Matriz mensual */}
    <div className="calendar-shell">
      <div className="calendar-grid">
        <div className="cal-head">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <div key={d} className="cal-head-cell">{d}</div>
          ))}
        </div>

        <div className="cal-body">
          {grid.map((c, i) => {
            if (!c.iso) return <div key={i} className="cal-cell cal-cell--empty" />;
            const iso = c.iso as string;
            const isToday = sameISO(iso, todayISO);
            const isSelected = sameISO(iso, selected);
            const dayHas = events.some((e) => sameISO(e.date, iso));
            return (
              <button
                key={i}
                className={
                  "cal-cell" +
                  (isToday ? " is-today" : "") +
                  (isSelected ? " is-selected" : "")
                }
                onClick={() => setSelected(iso)}
                title={iso}
              >
                <span className="cal-day">{c.day}</span>
                {dayHas ? <span className="dot" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>


      {/* Próximos 7 días */}
      <div className="mini-card" style={{ marginTop: 14 }}>
        <div className="kpi-title">Próximos 7 días</div>
        {next7.length === 0 ? (
          <div className="empty">No hay eventos próximos.</div>
        ) : (
          <div className="list">
            {next7.map((e) => (
              <div key={e.id} className="list-item">
                <div className="list-left">
                  <div className="badge">{iconFor(e.type)}</div>
                  <div>
                    <div className="list-title">{e.title}</div>
                    <div className="list-desc">
                      {formatLong(e.date, e.time)} · {e.place || e.type}
                    </div>
                  </div>
                </div>
                <div className="list-right">
                  <button className="btn-ghost" onClick={() => removeEvent(e.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eventos del día seleccionado */}
      <div className="mini-card" style={{ marginTop: 12 }}>
        <div className="kpi-title">{formatLong(selected)} — {tab === "Todos" ? "Eventos" : tab}</div>
        {dayEvents.length === 0 ? (
          <div className="empty">Sin eventos para este día.</div>
        ) : (
          <div className="list">
            {dayEvents.map((e) => (
              <div key={e.id} className="list-item">
                <div className="list-left">
                  <div className="badge">{iconFor(e.type)}</div>
                  <div>
                    <div className="list-title">{e.title}</div>
                    <div className="list-desc">
                      {e.time ? `${e.time} · ` : ""}{e.place || e.type}
                    </div>
                    {e.note ? <div className="list-note">{e.note}</div> : null}
                  </div>
                </div>
                <div className="list-right">
                  <button className="btn-ghost" onClick={() => removeEvent(e.id)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Nuevo evento</h3>
            <div className="form-grid">
              <label>
                <span>Título*</span>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ej. Visita a propiedad"
                />
              </label>
              <label>
                <span>Tipo</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
                >
                  <option>Visita</option>
                  <option>Reunión</option>
                  <option>Llamada</option>
                  <option>Tarea</option>
                </select>
              </label>
              <label>
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </label>
              <label>
                <span>Hora</span>
                <input
                  type="time"
                  value={form.time || ""}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </label>
              <label>
                <span>Lugar</span>
                <input
                  value={form.place || ""}
                  onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
                  placeholder="Dirección, videollamada, etc."
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Notas</span>
                <textarea
                  rows={3}
                  value={form.note || ""}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Detalles adicionales…"
                />
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

/* =========================
   Helpers de UI
========================= */

function iconFor(t: EventType) {
  switch (t) {
    case "Visita":
      return "🏠";
    case "Reunión":
      return "🤝";
    case "Llamada":
      return "📞";
    case "Tarea":
      return "✅";
  }
}

function formatLong(iso: string, time?: string) {
  const d = new Date(iso + "T00:00:00");
  const dd = d.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return time ? `${dd} · ${time}` : dd;
}

export default CalendarPage;
