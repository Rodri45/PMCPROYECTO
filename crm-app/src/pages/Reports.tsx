import React, { useMemo, useState } from "react";

/* ===== Utils ===== */
const MONTHS = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
type Money = "USD" | "COP";
const fx: Record<Money, number> = { USD: 1, COP: 4000 };

const fmt = (v: number, cur: Money) =>
  new Intl.NumberFormat(cur === "USD" ? "en-US" : "es-CO", {
    style: "currency",
    currency: cur,
    maximumFractionDigits: 0,
  }).format(v);

/* ===== Mock anual ===== */
type YearData = { ingresos: number[]; gastos: number[]; objetivoIngresos: number };

const DATA: Record<number, YearData> = {
  2024: {
    ingresos: [18000, 21000, 23000, 25000, 26000, 28000, 26000, 30000, 29000, 32000, 33000, 35000],
    gastos:   [ 9500, 11000, 11500, 12000, 14000, 15000, 13500, 16000, 14500, 17000, 16500, 17500],
    objetivoIngresos: 300000,
  },
  2025: {
    ingresos: [20000, 23000, 26000, 27000, 29000, 31000, 30500, 33000, 34000, 36000, 37000, 39000],
    gastos:   [10000, 12000, 13000, 13500, 15000, 16000, 15500, 17000, 16500, 17500, 18000, 19000],
    objetivoIngresos: 350000,
  },
  2026: {
    ingresos: [21000, 24000, 26500, 28000, 29500, 32000, 31500, 34000, 35000, 36500, 38000, 40000],
    gastos:   [10500, 12200, 13200, 14000, 15200, 16500, 16000, 17200, 16800, 17800, 18500, 19500],
    objetivoIngresos: 380000,
  },
};

const ReportsPage: React.FC = () => {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState<number>(Object.keys(DATA).includes(String(thisYear)) ? thisYear : 2025);
  const [money, setMoney] = useState<Money>("USD");
  const base = DATA[year] ?? DATA[2025];

  const ingresos = useMemo(() => base.ingresos.map(v => Math.round(v*fx[money])), [base.ingresos, money]);
  const gastos   = useMemo(() => base.gastos  .map(v => Math.round(v*fx[money])), [base.gastos, money]);
  const objetivo = Math.round(base.objetivoIngresos * fx[money]);

  const totalIngresos = useMemo(() => ingresos.reduce((a,b)=>a+b,0), [ingresos]);
  const totalGastos   = useMemo(() => gastos  .reduce((a,b)=>a+b,0), [gastos]);
  const utilidad      = totalIngresos - totalGastos;
  const progreso      = Math.min(100, Math.round(totalIngresos / Math.max(1, objetivo) * 100));

  // últimas 6 barras
  const lastN = 6;
  const lastMonths = MONTHS.slice(-lastN);
  const ingresos6  = ingresos.slice(-lastN);

  /* ====== UI ====== */
  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ marginTop: 8, marginBottom: 12 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">📈</div>
            <div>
              <div className="card-title">Datos financieros</div>
              <div className="card-desc">Ingresos, gastos y progreso</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="city-select" value={year} onChange={e=>setYear(+e.target.value)}>
              {Object.keys(DATA).map(Number).sort((a,b)=>a-b).map(y=>(
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select className="city-select" value={money} onChange={e=>setMoney(e.target.value as Money)}>
              <option value="USD">USD</option>
              <option value="COP">COP</option>
            </select>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="reports-grid">
        {/* Progreso = card grande */}
        <div className="mini-card card-lg">
          <div className="kpi-title">Progreso anual</div>
          <div className="donut-wrap pretty" style={{ gap: 24 }}>
            {/* Donut grande */}
            <svg viewBox="0 0 42 42" className="donut" style={{ width: 180, height: 180 }}>
              {/* base */}
              <circle cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8" className="donut-ring"/>
              {/* progreso */}
              {(() => {
                const dash = `${progreso} ${100 - progreso}`;
                return (
                  <circle
                    cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="8"
                    className="donut-seg a"
                    strokeDasharray={dash}
                    transform="rotate(-90 21 21)"
                  />
                );
              })()}
              {/* texto centrado, con espacio correcto */}
              <text x="21" y="18" textAnchor="middle" fontSize="7.5" fill="var(--muted)">Ingresos</text>
              <text x="21" y="29" textAnchor="middle" fontSize="5.5" fontWeight={800} fill="var(--ink)">
                {fmt(totalIngresos, money)}
              </text>
            </svg>

            {/* KPIs laterales */}
            <div className="legend-rows">
              <div className="kpi-pill"><span className="dot a" /> Ingresos <b>{fmt(totalIngresos, money)}</b></div>
              <div className="kpi-pill"><span className="dot b" /> Objetivo <b>{fmt(objetivo, money)}</b></div>
              <div className="kpi-pill"><span className="dot c" /> Gastos <b>{fmt(totalGastos, money)}</b></div>
              <div className="kpi-pill strong">Utilidad <b style={{ color: utilidad>=0 ? "var(--brand)" : "#e25c5c" }}>{fmt(utilidad, money)}</b></div>
              <div className="kpi-sub">Avance del objetivo: <b>{progreso}%</b></div>
            </div>
          </div>
        </div>

        {/* Barras Ingresos */}
        <div className="mini-card">
          <div className="kpi-title">Ingresos</div>
          <svg width="100%" height="160" viewBox="0 0 220 160" className="chart">
            {/* grid */}
            <line x1="10" y1="120" x2="210" y2="120" className="grid" />
            {[0.25,0.5,0.75].map((t)=>(
              <line key={t} x1="10" y1={120 - 90*t} x2="210" y2={120 - 90*t} className="grid thin"/>
            ))}
            {(() => {
              const max = Math.max(1, ...ingresos6);
              const w=18, gap=14, left=20;
              return ingresos6.map((v,i)=>{
                const x = left + i*(w+gap);
                const h = (v/max)*90;
                const y = 120 - h;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={w} height={h} rx="6" ry="6" className="bar">
                      <title>{`${lastMonths[i]}: ${fmt(v, money)}`}</title>
                    </rect>
                    <text x={x + w/2} y={138} textAnchor="middle" fontSize="8" fill="var(--muted)">
                      {lastMonths[i]}
                    </text>
                  </g>
                );
              })
            })()}
          </svg>
        </div>

        {/* Línea Gastos */}
        <div className="mini-card">
          <div className="kpi-title">Gastos</div>
          <svg width="100%" height="160" viewBox="0 0 240 160" className="chart">
            <defs>
              <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="var(--brand)" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="var(--brand)" stopOpacity="0"/>
              </linearGradient>
            </defs>

            <line x1="12" y1="120" x2="228" y2="120" className="grid"/>
            {[0.25,0.5,0.75].map((t)=>(
              <line key={t} x1="12" y1={120 - 90*t} x2="228" y2={120 - 90*t} className="grid thin"/>
            ))}

            {(() => {
              const max = Math.max(1, ...gastos);
              const step = (228-12) / (gastos.length-1);

              const pts = gastos.map((v,i)=>{
                const x = 12 + i*step;
                const y = 120 - (v/max)*90;
                return `${x},${y}`;
              }).join(" ");

              const area = `12,120 ${pts} 228,120`;

              return (
                <>
                  <polyline points={area} fill="url(#area)" />
                  <polyline points={pts} fill="none" className="line"/>
                  {gastos.map((v,i)=>{
                    const x = 12 + i*step;
                    const y = 120 - (v/max)*90;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="3" className="dot">
                          <title>{`${MONTHS[i]}: ${fmt(v, money)}`}</title>
                        </circle>
                      </g>
                    );
                  })}
                  {/* etiquetas cada 2 meses */}
                  {MONTHS.map((m,i)=>{
                    const x = 12 + i*step;
                    return (
                      <text key={m} x={x} y={138} textAnchor="middle" fontSize="8" fill="var(--muted)">
                        {i%2===0 ? m : ""}
                      </text>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
