import React, { useMemo, useState, useEffect } from "react";

/* ─────────────────────────── Tipos ─────────────────────────── */
type Currency = "USD" | "COP";
type Kind = "income" | "expense";

type Move = {
  id: string;
  kind: Kind;
  amountUSD: number;   // SIEMPRE almacenado en USD
  date: string;        // ISO (yyyy-mm-dd)
  category: string;
  note?: string;
};

/* ─────────────────────────── Storage keys ─────────────────────────── */
const STORAGE_KEY = "pmc_reports_moves_v2";       // v2 por cambio de estructura (amountUSD)
const RATE_KEY    = "pmc_reports_usd_to_cop";

/* ─────────────────────────── Helpers ─────────────────────────── */
const months = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const fmtMoney = (v: number, cur: Currency) =>
  new Intl.NumberFormat(cur === "COP" ? "es-CO" : "en-US", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: cur === "COP" ? 0 : 2,
  }).format(v);

const isoToday = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

const cryptoRandom = () =>
  "m_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

/* ─────────────────────────── UI helpers ─────────────────────────── */
const Pill: React.FC<{ color?: string; children: React.ReactNode }> = ({
  color = "var(--ring)",
  children,
}) => <span className="pill" style={{ background: color }}>{children}</span>;

const Icon: React.FC<{ kind: Kind }> = ({ kind }) => (
  <div className={`avatar ${kind === "income" ? "ok" : "warn"}`}>
    {kind === "income" ? "⬆" : "⬇"}
  </div>
);

/* ─────────────────────────── Página ─────────────────────────── */
const ReportsPage: React.FC = () => {
  // filtros – header
  const [year, setYear] = useState<number>(2025);
  const [currency, setCurrency] = useState<Currency>("USD");

  // tasa USD→COP (editable)
  const [usdToCop, setUsdToCop] = useState<number>(() => {
    const raw = localStorage.getItem(RATE_KEY);
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 4200;
  });

  // datos (migración simple si antes se guardó "amount")
  const [moves, setMoves] = useState<Move[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as any[];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((m) => {
        // soportar estructuras viejas (amount en moneda base desconocida)
        if (m && typeof m.amountUSD === "number") return m as Move;
        if (m && typeof m.amount === "number") {
          return {
            id: m.id || cryptoRandom(),
            kind: m.kind as Kind,
            amountUSD: m.amount, // asumimos ya venía en USD
            date: m.date,
            category: m.category || "",
            note: m.note || "",
          } as Move;
        }
        return null;
      }).filter(Boolean) as Move[];
    } catch {
      return [];
    }
  });

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(moves));
  }, [moves]);

  useEffect(() => {
    localStorage.setItem(RATE_KEY, String(usdToCop));
  }, [usdToCop]);

  // convertir USD→moneda elegida (sólo para mostrar)
  const toDisplay = (amountUSD: number, cur: Currency) =>
    cur === "USD" ? amountUSD : amountUSD * usdToCop;

  // Tabs y paginación
  const [tab, setTab] = useState<"all" | "income" | "expense">("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  // KPI
  const { incomeUSD, expenseUSD, goalUSD } = useMemo(() => {
    const yearMoves = moves.filter((m) => new Date(m.date).getFullYear() === year);
    const incomeUSD = yearMoves.filter(m => m.kind === "income").reduce((a, b) => a + b.amountUSD, 0);
    const expenseUSD = yearMoves.filter(m => m.kind === "expense").reduce((a, b) => a + b.amountUSD, 0);
    // objetivo en USD (cámbialo a tu gusto)
    const goalUSD = 350_000;
    return { incomeUSD, expenseUSD, goalUSD };
  }, [moves, year]);

  const profitUSD = incomeUSD - expenseUSD;

  // series (en USD) -> convertir al mostrar
  const monthly = useMemo(() => {
    const inc = Array(12).fill(0);
    const exp = Array(12).fill(0);
    for (const m of moves) {
      const d = new Date(m.date);
      if (d.getFullYear() !== year) continue;
      const i = d.getMonth();
      if (m.kind === "income") inc[i] += m.amountUSD;
      else exp[i] += m.amountUSD;
    }
    return { inc, exp };
  }, [moves, year]);

  // lista visible (filtro + paginación)
  const filtered = useMemo(() => {
    const y = moves.filter((m) => new Date(m.date).getFullYear() === year);
    const t = tab === "all" ? y : y.filter((m) => m.kind === tab);
    // más recientes primero
    return t.sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [moves, year, tab]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(0, page * PAGE_SIZE);

  // alta movimientos (si la UI está en COP, convertir a USD al guardar)
  const addMove = (kind: Kind, amountInput: number, dateISO: string, category: string, note?: string) => {
    const amountUSD = currency === "USD" ? amountInput : amountInput / usdToCop;
    const id = cryptoRandom();
    setMoves((prev) => [{ id, kind, amountUSD, date: dateISO, category, note }, ...prev]);
  };
  const removeMove = (id: string) => setMoves((prev) => prev.filter((m) => m.id !== id));

  // demo (en USD)
  const seedDemo = () => {
    const catsI = ["Rentas", "Comisiones", "Servicios"];
    const catsE = ["Publicidad", "Impuestos", "Viajes", "Honorarios"];
    const out: Move[] = [];
    for (let m = 0; m < 12; m++) {
      const base = 18_000 + Math.round(Math.random() * 9_000);
      const inc = base + Math.round(Math.random() * 15_000);
      const exp = 4_000 + Math.round(Math.random() * 3_500);

      out.push({
        id: cryptoRandom(),
        kind: "income",
        amountUSD: inc, // USD
        date: `${year}-${String(m + 1).padStart(2, "0")}-15`,
        category: catsI[Math.floor(Math.random() * catsI.length)],
        note: "Ingreso mensual",
      });
      out.push({
        id: cryptoRandom(),
        kind: "expense",
        amountUSD: exp, // USD
        date: `${year}-${String(m + 1).padStart(2, "0")}-08`,
        category: catsE[Math.floor(Math.random() * catsE.length)],
        note: "Gasto operativo",
      });
    }
    setMoves(out);
    setPage(1);
    setTab("all");
  };

  // modal simple alta rápida
  const [open, setOpen] = useState<null | Kind>(null);
  const [form, setForm] = useState({ amount: "", date: "", category: "", note: "" });

  const submit = () => {
    if (!open) return;
    const a = Number(form.amount);
    if (!a || !form.date || !form.category) return alert("Completa monto, fecha y categoría.");
    addMove(open, a, form.date, form.category, form.note || "");
    setOpen(null);
    setForm({ amount: "", date: "", category: "", note: "" });
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">📊</div>
            <div>
              <div className="card-title">Datos financieros</div>
              <div className="card-desc">Ingresos, gastos y progreso</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              className="city-select"
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setPage(1); }}
            >
              {[2023, 2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              className="city-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
            >
              <option>USD</option>
              <option>COP</option>
            </select>

            {currency === "COP" && (
              <div className="chip" title="Tasa USD→COP">
                1 USD ={" "}
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={usdToCop}
                  onChange={(e) => setUsdToCop(Math.max(1, Number(e.target.value)))}
                  style={{
                    width: 90,
                    background: "transparent",
                    border: "none",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />{" "}
                COP
              </div>
            )}

            <button className="btn-ghost" onClick={seedDemo}>Demo</button>
          </div>
        </div>
      </div>

      {/* Hero KPIs */}
      <div className="hero-card">
        <div className="ring">
          <div className="ring-inner">
            <div className="ring-label">Ingresos</div>
            <div className="ring-value">
              {fmtMoney(toDisplay(incomeUSD, currency), currency)}
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="kpi-row">
            <span className="dot a" /> Ingresos{" "}
            <b>{fmtMoney(toDisplay(incomeUSD, currency), currency)}</b>
          </div>
          <div className="kpi-row">
            <span className="dot b" /> Objetivo{" "}
            <b>{fmtMoney(toDisplay(goalUSD, currency), currency)}</b>
          </div>
          <div className="kpi-row">
            <span className="dot c" /> Gastos{" "}
            <b>{fmtMoney(toDisplay(expenseUSD, currency), currency)}</b>
          </div>

          <div className="kpi-profit">
            <Pill color="rgba(16,185,129,.18)">Utilidad</Pill>
            <b>{fmtMoney(toDisplay(profitUSD, currency), currency)}</b>
          </div>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => {
                setOpen("income");
                setForm({ amount: "", date: isoToday(), category: "Rentas", note: "" });
              }}
            >
              + Ingreso
            </button>
            <button
              className="btn-ghost"
              onClick={() => {
                setOpen("expense");
                setForm({ amount: "", date: isoToday(), category: "Impuestos", note: "" });
              }}
            >
              + Gasto
            </button>
          </div>
        </div>
      </div>

      {/* Grid de charts */}
      <div className="reports-grid">
        {/* Ingresos (barras) */}
        <div className="mini-card">
          <div className="kpi-title">Ingresos</div>
          <svg width="100%" height="120" viewBox="0 0 220 120" preserveAspectRatio="none">
            {monthly.inc.map((vUSD, i) => {
              const incDisp = monthly.inc.map((x) => toDisplay(x, currency));
              const max = Math.max(1, ...incDisp);
              const v = toDisplay(vUSD, currency);
              const h = (v / max) * 90;
              const x = 10 + i * 16;
              const y = 105 - h;
              return (
                <g key={i}>
                  <rect
                    x={x}
                    y={y}
                    width="10"
                    height={h}
                    rx="4"
                    ry="4"
                    fill="rgba(16,185,129,.55)"
                  >
                    <title>{`${months[i]}: ${fmtMoney(v, currency)}`}</title>
                  </rect>
                  <text x={x + 5} y={115} fontSize="8" textAnchor="middle" fill="var(--muted)">
                    {months[i]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Gastos (línea) */}
        <div className="mini-card">
          <div className="kpi-title">Gastos</div>
          <svg width="100%" height="120" viewBox="0 0 220 120" preserveAspectRatio="none">
            <line x1="0" y1="100" x2="220" y2="100" stroke="rgba(255,255,255,.08)" />
            {(() => {
              const expDisp = monthly.exp.map((x) => toDisplay(x, currency));
              const max = Math.max(1, ...expDisp);
              const pts = expDisp
                .map((v, i) => {
                  const x = 10 + i * 18;
                  const y = 100 - (v / max) * 80;
                  return `${x},${y}`;
                })
                .join(" ");
              return (
                <>
                  <polyline fill="none" stroke="rgba(59,130,246,.9)" strokeWidth="2" points={pts} />
                  {expDisp.map((v, i) => {
                    const x = 10 + i * 18;
                    const y = 100 - (v / max) * 80;
                    return (
                      <circle key={i} cx={x} cy={y} r="2.5" fill="rgba(59,130,246,.9)">
                        <title>{`${months[i]}: ${fmtMoney(v, currency)}`}</title>
                      </circle>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Tabs + Movimientos (paginado) */}
      <div className="mini-card">
        <div className="kpi-title" style={{ marginBottom: 6 }}>Movimientos</div>

        <div className="tabs">
          <button className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => { setTab("all"); setPage(1); }}>
            Todos
          </button>
          <button className={`tab ${tab === "income" ? "active" : ""}`} onClick={() => { setTab("income"); setPage(1); }}>
            Ingresos
          </button>
          <button className={`tab ${tab === "expense" ? "active" : ""}`} onClick={() => { setTab("expense"); setPage(1); }}>
            Gastos
          </button>
        </div>

        {visible.length === 0 ? (
          <div className="empty">Sin movimientos para esta vista.</div>
        ) : (
          <div className="moves">
            {visible.map((m) => {
              const d = new Date(m.date);
              const dateStr = d.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "short",
                day: "numeric",
              });
              const sign = m.kind === "income" ? "+" : "–";
              const color = m.kind === "income" ? "var(--brand)" : "#ef4444";
              const shown = toDisplay(m.amountUSD, currency);
              return (
                <div key={m.id} className="move-card">
                  <Icon kind={m.kind} />
                  <div className="move-main">
                    <div className="move-title">
                      {m.kind === "income" ? "Ingreso" : "Gasto"} ·{" "}
                      <span className="muted">{m.category}</span>
                    </div>
                    <div className="move-sub">
                      {dateStr}
                      {m.note ? ` · ${m.note}` : ""}
                    </div>
                  </div>
                  <div className="move-amount" style={{ color }}>
                    {sign}
                    {fmtMoney(shown, currency)}
                  </div>
                  <button className="btn-ghost sm" onClick={() => removeMove(m.id)}>
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > PAGE_SIZE && (
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 8 }}>
            {page < pageCount ? (
              <button className="btn-ghost" onClick={() => setPage((p) => Math.min(pageCount, p + 1))}>
                Ver más
              </button>
            ) : (
              <button className="btn-ghost" onClick={() => setPage(1)}>
                Ver menos
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal alta rápida */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{open === "income" ? "Nuevo ingreso" : "Nuevo gasto"}</h3>

            <div className="form-grid">
              <label>
                <span>Monto ({currency})</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder={currency === "USD" ? "1000.00" : "1.000.000"}
                />
              </label>
              <label>
                <span>Fecha</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
              <label>
                <span>Categoría</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Rentas / Impuestos..."
                />
              </label>
              <label>
                <span>Nota</span>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  placeholder="opcional"
                />
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-ghost" onClick={() => setOpen(null)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={submit}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
