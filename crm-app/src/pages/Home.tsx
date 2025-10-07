import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ─── Storage keys compartidos con otras páginas ─── */
const KEY_CLIENTS = "pmc_clients";
const KEY_CAL = "pmc_calendar_events";
const KEY_MOVES = "pmc_reports_moves_v1";

/* ─── Utils ─── */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
const betweenISO = (iso: string, from: string, to: string) =>
  iso >= from && iso <= to;

function shortMoney(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const unit =
    abs >= 1_000_000_000
      ? { d: 1_000_000_000, s: "B" }
      : abs >= 1_000_000
      ? { d: 1_000_000, s: "M" }
      : abs >= 1_000
      ? { d: 1_000, s: "K" }
      : { d: 1, s: "" };
  return `${sign}$${(abs / unit.d).toFixed(unit.s ? 1 : 0)}${unit.s}`;
}

const Goal = 350_000;

/* ─── Tipos livianos para lo que leemos de localStorage ─── */
type Move = { id: string; kind: "income" | "expense"; amount: number; date: string };
type CalEvent = { id: string; type: string; title: string; date: string; time?: string; place?: string };

/* ─── Siembra DEMO (Home) ─── */
function randomId(p = "x") {
  return `${p}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function seedClientsDemo() {
  const names = [
    "Juan Pérez","Laura Sánchez","Pedro Fernández","Sofía Martínez","Andrés López",
    "Camila Ríos","Valentina Torres","Miguel Castro","Paula Herrera","Carlos Díaz",
    "María Gómez","Felipe Álvarez","Diana Pardo","Julián Suárez","Natalia Mora",
    "Ricardo Ruiz","Ana Beltrán","Lucía Vega","Esteban Villa","Sara Prieto","David Cárdenas"
  ];
  const out = names.map((n, i) => ({
    id: randomId("c"),
    name: n,
    email: `${n.split(" ")[0].toLowerCase()}@demo.co`,
    phone: "57300" + String(1000000 + i * 137).slice(0, 7),
    avatarUrl: `https://i.pravatar.cc/100?img=${(i % 70) + 1}`,
    status: i % 5 === 0 ? "Cerrado" : i % 3 === 0 ? "En negociación" : "Interesado",
    lastActivity: "hoy",
  }));
  localStorage.setItem(KEY_CLIENTS, JSON.stringify(out));
  return out.length;
}

const SEED_POOL: Omit<CalEvent, "id" | "date" | "time">[] = [
  { type: "Visita",  title: "Visita a propiedad", place: "Chico Norte" },
  { type: "Reunión", title: "Reunión con cliente", place: "Oficina" },
  { type: "Llamada", title: "Llamada de seguimiento", place: "Remoto" },
  { type: "Tarea",   title: "Enviar propuesta", place: "Correo" },
  { type: "Visita",  title: "Tour de propiedades", place: "Usaquén Centro" },
  { type: "Reunión", title: "Negociación avanzada", place: "Sala A" },
];
const randomHour = () => {
  const h = 9 + Math.floor(Math.random() * 8); // 09..16
  const m = Math.random() > 0.5 ? "00" : "30";
  return `${pad(h)}:${m}`;
};

function seedCalendarDemo() {
  const base = new Date();
  const howMany = 8 + Math.floor(Math.random() * 6); // 8..13
  const seeded: CalEvent[] = Array.from({ length: howMany }).map((_, i) => {
    const def = SEED_POOL[Math.floor(Math.random() * SEED_POOL.length)];
    const plusDays = 0 + Math.floor(Math.random() * 7); // hoy..+6
    return {
      id: randomId("e"),
      date: toISO(addDays(base, plusDays)),
      type: def.type,
      title: def.title,
      time: randomHour(),
      place: def.place,
    };
  });
  localStorage.setItem(KEY_CAL, JSON.stringify(seeded));
  return seeded;
}

function seedReportsDemo(year: number) {
  // Serie "realista" 12 meses
  const catsI = ["Rentas", "Comisiones", "Servicios"];
  const catsE = ["Publicidad", "Impuestos", "Viajes", "Honorarios"];
  const out: Move[] = [];
  for (let m = 0; m < 12; m++) {
    const inc =
      18000 + Math.round(Math.random() * 9000) + Math.round(Math.random() * 15000);
    const exp = 3500 + Math.round(Math.random() * 4000);

    out.push({
      id: randomId("m"),
      kind: "income",
      amount: inc,
      date: `${year}-${pad(m + 1)}-15`,
    });
    out.push({
      id: randomId("m"),
      kind: "expense",
      amount: exp,
      date: `${year}-${pad(m + 1)}-08`,
    });
  }
  localStorage.setItem(KEY_MOVES, JSON.stringify(out));
  return out;
}

/* ─── Página ─── */
export default function HomePage() {
  const nav = useNavigate();
  const [now] = useState(() => new Date());
  const year = now.getFullYear();

  // Estado que se calcula leyendo storage (y tras DEMO)
  const [clientsCount, setClientsCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [todayEvents, setTodayEvents] = useState<CalEvent[]>([]);
  const [ytdProfit, setYtdProfit] = useState(0);

  const refreshFromStorage = () => {
    // Clientes
    try {
      const c = JSON.parse(localStorage.getItem(KEY_CLIENTS) || "[]");
      setClientsCount(Array.isArray(c) ? c.length : 0);
    } catch {
      setClientsCount(0);
    }

    // Calendario: próximos 7 y hoy
    try {
      const evts: CalEvent[] = JSON.parse(localStorage.getItem(KEY_CAL) || "[]");
      const from = toISO(now);
      const to = toISO(addDays(now, 7));
      const next = evts.filter((e) => betweenISO(e.date, from, to));
      setUpcomingCount(next.length);

      const todayISO = toISO(now);
      const today = evts
        .filter((e) => e.date === todayISO)
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""))
        .slice(0, 4);
      setTodayEvents(today);
    } catch {
      setUpcomingCount(0);
      setTodayEvents([]);
    }

    // Reportes: utilidad año actual
    try {
      const moves: Move[] = JSON.parse(localStorage.getItem(KEY_MOVES) || "[]");
      const yMoves = (Array.isArray(moves) ? moves : []).filter(
        (m) => new Date(m.date).getFullYear() === year
      );
      const income = yMoves
        .filter((m) => m.kind === "income")
        .reduce((a, b) => a + b.amount, 0);
      const expense = yMoves
        .filter((m) => m.kind === "expense")
        .reduce((a, b) => a + b.amount, 0);
      setYtdProfit(income - expense);
    } catch {
      setYtdProfit(0);
    }
  };

  useEffect(() => {
    refreshFromStorage();
  }, []);

  // % del anillo
  const ringPct = useMemo(
    () => Math.max(0, Math.min(100, (ytdProfit / Goal) * 100)),
    [ytdProfit]
  );

  const runDemo = () => {
    seedClientsDemo();
    seedCalendarDemo();
    seedReportsDemo(year);
    refreshFromStorage();
  };

  return (
    <div className="page" style={{ maxWidth: 980 }}>
      {/* HERO */}
      <section
        className="card"
        style={{
          marginTop: 12,
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>Tu día,<br />organizado</h1>
          <p className="card-desc" style={{ marginTop: 6, maxWidth: 520 }}>
            Gestiona clientes, propiedades y agenda en un solo lugar. Visualiza tu progreso
            financiero y toma decisiones más rápido.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => nav("/calendar")}>
              Ver agenda
            </button>
            <button className="btn-ghost" onClick={() => nav("/reports")}>
              Ver reportes
            </button>
            <button className="btn-ghost" onClick={runDemo} title="Cargar datos de ejemplo">
              Demo
            </button>
          </div>
        </div>

        {/* Ring compacto */}
        <div
          style={{
            position: "relative",
            width: 180,
            height: 180,
            justifySelf: "end",
          }}
        >
          <svg viewBox="0 0 42 42" style={{ width: "100%", height: "100%" }}>
            <circle
              cx="21"
              cy="21"
              r="15.9155"
              fill="transparent"
              stroke="rgba(255,255,255,.08)"
              strokeWidth="6"
            />
            <circle
              cx="21"
              cy="21"
              r="15.9155"
              fill="transparent"
              stroke="var(--brand)"
              strokeWidth="6"
              strokeDasharray={`${ringPct.toFixed(2)} ${(100 - ringPct).toFixed(2)}`}
              transform="rotate(-90 21 21)"
              strokeLinecap="round"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            <div style={{ fontSize: 10, color: "var(--muted)" }}>Utilidad YTD</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{shortMoney(ytdProfit)}</div>
          </div>
        </div>
      </section>

      {/* KPIs cortos */}
    <section
      className="kpi-strip"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 12,
        marginTop: 12,
      }}
      >
        {/* Clientes */}
        <button
          className="card"
          onClick={() => nav("/clients")}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 10,
            alignItems: "center",
            padding: "12px 14px",
          }}
        >
          <div className="badge">👤</div>
          <div>
            <div style={{ fontWeight: 700 }}>Clientes</div>
            <div className="card-desc">en tu base</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>{clientsCount}</div>
            <div className="card-desc">›</div>
          </div>
        </button>

        {/* Próximos 7 días */}
        <button
          className="card"
          onClick={() => nav("/calendar")}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 10,
            alignItems: "center",
            padding: "12px 14px",
          }}
        >
          <div className="badge">📅</div>
          <div>
            <div style={{ fontWeight: 700 }}>Próximos 7 días</div>
            <div className="card-desc">eventos</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>{upcomingCount}</div>
            <div className="card-desc">›</div>
          </div>
        </button>

        {/* Utilidad YTD */}
        <button
        
          className="card"
          onClick={() => nav("/reports")}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 10,
            alignItems: "center",
            padding: "12px 14px",
          }}
        >
          <div className="badge">✅</div>
          <div>
            <div style={{ fontWeight: 700 }}>Utilidad YTD</div>
            <div className="card-desc">año actual</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800 }}>{shortMoney(ytdProfit)}</div>
            <div className="card-desc">›</div>
          </div>
        </button>
      </section>

      {/* Navegación rápida */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 2fr)",
          gap: 12,
          marginTop: 12,
        }}
      >
        <button className="quick-item card" onClick={() => nav("/clients")}>
          <div className="badge">👤</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Contactos</div>
            <div className="card-desc">Contacta, agenda y seguimiento</div>
          </div>
          <div className="card-desc">›</div>
        </button>

        <button className="quick-item card" onClick={() => nav("/properties")}>
          <div className="badge">🏠</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Propiedades</div>
            <div className="card-desc">Mapa, estado y desempeño</div>
          </div>
          <div className="card-desc">›</div>
        </button>

        <button className="quick-item card" onClick={() => nav("/reports")}>
          <div className="badge">📊</div>
          <div style={{ flex: 1 }}>
            <div className="card-title">Reportes</div>
            <div className="card-desc">Ingresos, gastos y embudo</div>
          </div>
          <div className="card-desc">›</div>
        </button>
      </section>

      {/* Hoy */}
      <section className="card" style={{ marginTop: 12 }}>
        <div className="kpi-title">Hoy</div>
        {todayEvents.length === 0 ? (
          <div className="empty">No tienes eventos para hoy.</div>
        ) : (
          <div className="list">
            {todayEvents.map((e) => (
              <div key={e.id} className="list-item">
                <div className="list-left">
                  <div className="badge">
                    {e.type === "Visita" ? "🏠" : e.type === "Reunión" ? "🤝" : e.type === "Llamada" ? "📞" : "✅"}
                  </div>
                  <div>
                    <div className="list-title">{e.title}</div>
                    <div className="list-desc">
                      {e.time ? `${e.time} · ` : ""}{e.place || e.type}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
