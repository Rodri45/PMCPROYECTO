import React, { useMemo, useState } from "react";
import PropertiesMap from "../components/Properties/PropertiesMap";
import PropertyCard from "../components/Properties/PropertyCard";
import type { Property, MapConfig } from "../types/PropertiesMapProps";

type Status = "Interesado" | "En negociación" | "Cerrado";

type PropertyWithCounts = Property & {
  interested?: number;
  negotiating?: number;
  photo?: string; // << NUEVO: foto opcional para popup del mapa
};

// ---------- base ----------
const BASE: Record<string, PropertyWithCounts[]> = {
  Bogotá: [
    { id: 1,  name: "Chico Norte",    lat: 4.676, lng: -74.048, address: "Cra 15 #120",  status: "Interesado",     interested: 12, negotiating: 3 },
    { id: 2,  name: "Rosales",        lat: 4.651, lng: -74.056, address: "Cl 72 #6",     status: "En negociación", interested:  7, negotiating: 8 },
    { id: 3,  name: "Cedritos",       lat: 4.723, lng: -74.033, address: "Cl 140 #19",   status: "Cerrado",        interested:  5, negotiating: 0 },
    { id: 4,  name: "Santa Bárbara",  lat: 4.699, lng: -74.036, address: "Cra 7 #116",   status: "Interesado",     interested: 10, negotiating: 2 },
    { id: 5,  name: "Chapinero",      lat: 4.649, lng: -74.062, address: "Cl 60 #8",     status: "Interesado",     interested:  6, negotiating: 1 },
    { id: 9,  name: "Niza",           lat: 4.730, lng: -74.078, address: "Av Suba #123", status: "En negociación", interested:  9, negotiating: 5 },
    { id: 10, name: "Teusaquillo",    lat: 4.639, lng: -74.066, address: "Cl 39 #20",    status: "Cerrado",        interested:  4, negotiating: 0 },
    { id: 11, name: "Modelia",        lat: 4.668, lng: -74.121, address: "Cl 23 #81",    status: "En negociación", interested:  8, negotiating: 6 },
    { id: 12, name: "San Patricio",   lat: 4.683, lng: -74.050, address: "Cl 103 #18",   status: "Interesado",     interested: 11, negotiating: 2 },
    { id: 13, name: "Madelena",       lat: 4.582, lng: -74.153, address: "Cra 62 #44",   status: "Interesado",     interested:  7, negotiating: 1 },
    { id: 14, name: "Usaquén Centro", lat: 4.693, lng: -74.030, address: "Cl 120 #6",    status: "Interesado",     interested:  9, negotiating: 2 },
    { id: 15, name: "Ciudad Salitre", lat: 4.648, lng: -74.109, address: "Av 68 #24",    status: "Interesado",     interested:  6, negotiating: 1 },
  ],
  Medellín: [
    { id: 601, name: "El Poblado",     lat: 6.207, lng: -75.566, address: "Cra 43A",       status: "En negociación", interested:  9, negotiating: 7 },
    { id: 602, name: "Laureles",       lat: 6.244, lng: -75.601, address: "Circular 3",    status: "Interesado",     interested: 12, negotiating: 2 },
    { id: 603, name: "Envigado",       lat: 6.169, lng: -75.586, address: "Calle 30 Sur",  status: "Cerrado",        interested:  5, negotiating: 0 },
    { id: 604, name: "Belén",          lat: 6.225, lng: -75.606, address: "Cra 76 #30",    status: "Interesado",     interested: 10, negotiating: 3 },
    { id: 605, name: "Sabaneta",       lat: 6.154, lng: -75.616, address: "Cl 75 Sur",     status: "En negociación", interested:  8, negotiating: 6 },
    { id: 606, name: "Itagüí",         lat: 6.168, lng: -75.614, address: "Cl 49 #52",     status: "Interesado",     interested:  7, negotiating: 1 },
    { id: 607, name: "Laureles Est.",  lat: 6.255, lng: -75.592, address: "Cr 70 #12",     status: "Interesado",     interested: 11, negotiating: 2 },
    { id: 608, name: "Robledo",        lat: 6.280, lng: -75.604, address: "Cl 79 #84",     status: "Cerrado",        interested:  4, negotiating: 0 },
    { id: 609, name: "Buenos Aires",   lat: 6.246, lng: -75.555, address: "Cl 45 #21",     status: "En negociación", interested:  6, negotiating: 5 },
  ],
};
const CITIES = Object.keys(BASE);

// --- util demo ---
const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function demoForCity(base: PropertyWithCounts[]): PropertyWithCounts[] {
  const out: PropertyWithCounts[] = base.map(p => ({ ...p }));
  const extras = rand(2, 4);
  const names = ["Verdes Premium", "Lagos Plaza", "Lagos Norte", "Altos del Sol", "Parque Real"];
  for (let i = 0; i < extras; i++) {
    const name = names[i % names.length];
    const seed = base[rand(0, base.length - 1)];
    out.push({
      id: Number(`${Date.now()}${i}`),
      name,
      lat: seed.lat + (Math.random() - 0.5) * 0.03,
      lng: seed.lng + (Math.random() - 0.5) * 0.03,
      address: "Dirección por confirmar",
      status: (["Interesado","En negociación","Interesado","En negociación","Cerrado"] as Status[])[rand(0,4)],
      interested: rand(4, 15),
      negotiating: rand(0, 8),
      photo: undefined,
    });
  }
  out.forEach(p => { if (p.status === "Cerrado") p.negotiating = 0; });
  return out;
}

const PropertiesPage: React.FC = () => {
  const [city, setCity] = useState<string>("Bogotá");

  // datos por ciudad
  const [dataByCity, setDataByCity] = useState<Record<string, PropertyWithCounts[]>>(
    () => JSON.parse(JSON.stringify(BASE))
  );

  // paginación fija
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const properties = useMemo<PropertyWithCounts[]>(
    () => dataByCity[city] ?? [],
    [dataByCity, city]
  );

  const totalPages = Math.max(1, Math.ceil(properties.length / PER_PAGE));
  const pageClamped = Math.min(page, totalPages);
  const sliceStart = (pageClamped - 1) * PER_PAGE;
  const visible = properties.slice(sliceStart, sliceStart + PER_PAGE);

  // centro mapa
  const center = useMemo(() => {
    if (!properties.length) return { latitude: 4.711, longitude: -74.0721 };
    const sum = properties.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );
    return { latitude: sum.lat / properties.length, longitude: sum.lng / properties.length };
  }, [properties]);

  const mapConfig: MapConfig = { zoom: 12, center };

  // conteos donut
  const counts = useMemo(() => {
    const c = { Interesado: 0, "En negociación": 0, Cerrado: 0 } as Record<Status, number>;
    properties.forEach((p) => c[p.status as Status]++);
    return c;
  }, [properties]);

  const totalProps = properties.length || 1;
  const percent = {
    interesado: Math.round((counts["Interesado"] / totalProps) * 100),
    negociacion: Math.round((counts["En negociación"] / totalProps) * 100),
    cerrado: Math.round((counts["Cerrado"] / totalProps) * 100),
  };

  // barras interesados
  const interestedBars = useMemo(() => {
    return properties.map((p) => ({
      name: p.name,
      interested:
        typeof p.interested === "number"
          ? p.interested
          : p.status === "Interesado"
          ? 1
          : 0,
      negotiating: typeof p.negotiating === "number" ? p.negotiating : 0,
    }));
  }, [properties]);
  const maxInterested = Math.max(1, ...interestedBars.map((d) => d.interested));

  // demo
  const runDemo = () => {
    setDataByCity((prev) => ({ ...prev, [city]: demoForCity(BASE[city]) }));
    setPage(1);
  };

  /* ───────────────────────── Modal “Nueva propiedad” ───────────────────────── */
  const [open, setOpen] = useState(false);
  // foto demo real (apartamento)
  const demoPhoto =
    "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1600";

  const [form, setForm] = useState<PropertyWithCounts>({
    id: Date.now(),
    name: "Loft Parque 93",
    address: "Cra 13 #93-45",
    status: "Interesado",
    lat: center.latitude + (Math.random() - 0.5) * 0.01,
    lng: center.longitude + (Math.random() - 0.5) * 0.01,
    interested: 8,
    negotiating: 2,
    photo: demoPhoto,
  } as PropertyWithCounts);

  const resetForm = () =>
    setForm({
      id: Date.now(),
      name: "Loft Parque 93",
      address: "Cra 13 #93-45",
      status: "Interesado",
      lat: center.latitude + (Math.random() - 0.5) * 0.01,
      lng: center.longitude + (Math.random() - 0.5) * 0.01,
      interested: 8,
      negotiating: 2,
      photo: demoPhoto,
    } as PropertyWithCounts);

  const saveProperty = () => {
    if (!form.name?.trim() || !form.address?.trim()) {
      alert("Completa al menos Nombre y Dirección.");
      return;
    }
    const newProp: PropertyWithCounts = {
      ...form,
      id: Number(`${Date.now()}${Math.floor(Math.random() * 1000)}`),
    };
    setDataByCity((prev) => ({
      ...prev,
      [city]: [newProp, ...(prev[city] ?? [])],
    }));
    setOpen(false);
    setPage(1);
    resetForm();
  };

  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">🏠</div>
            <div>
              <div className="card-title">Propiedades</div>
              <div className="card-desc">Mapa, estado y desempeño</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={() => { resetForm(); setOpen(true); }}>
              + Nueva
            </button>
            <button className="btn-ghost" onClick={runDemo}>Demo</button>
            <select
              className="city-select"
              value={city}
              onChange={(e) => { setCity(e.target.value); setPage(1); }}
            >
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mapa */}
      <div className="map-card">
        <PropertiesMap properties={properties} mapConfig={mapConfig} />
        <div className="map-caption">
          <span className="map-pin">📍</span> {city}
        </div>
      </div>

      {/* KPIs + Lista */}
      <div className="props-two-col">
        {/* Interesados (barras) */}
        <div className="kpi-card">
          <div className="kpi-title">Interesados</div>
          <div className="bar-chart">
            {(() => {
              const H = 140, top = 8, base = 110, w = 20, gap = 12, left = 10;
              const chartWidth = left + interestedBars.length * (w + gap);
              return (
                <svg width="100%" height={H} viewBox={`0 0 ${chartWidth} ${H}`} preserveAspectRatio="xMinYMid meet">
                  <line x1="0" y1={base} x2={chartWidth} y2={base} stroke="rgba(255,255,255,.08)" />
                  {[0.25, 0.5, 0.75, 1].map((t) => (
                    <line key={t} x1="0" y1={base - (base - top) * t} x2={chartWidth} y2={base - (base - top) * t} stroke="rgba(255,255,255,.06)" />
                  ))}
                  {interestedBars.map((d, i) => {
                    const x = left + i * (w + gap);
                    const h = ((d.interested || 0) / maxInterested) * (base - top);
                    const y = base - h;
                    return (
                      <g key={i}>
                        <rect x={x} y={y} width={w} height={h} rx="6" ry="6" fill="rgba(26,160,179,.55)">
                          <title>{`${d.name}\nInteresados: ${d.interested ?? 0}${d.negotiating ? `\nEn negociación: ${d.negotiating}` : ""}`}</title>
                        </rect>
                        {d.negotiating ? (
                          <circle cx={x + w / 2} cy={y - 6} r="3" fill="var(--brand)">
                            <title>{`En negociación: ${d.negotiating}`}</title>
                          </circle>
                        ) : null}
                        <text x={x + w / 2} y={H - 10} fontSize="9" textAnchor="middle" fill="var(--muted)">
                          {d.name.length > 7 ? d.name.slice(0, 7) + "…" : d.name}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Lista + paginación compacta */}
        <div className="mini-card results-card">
          <div className="kpi-title" style={{ marginBottom: 8 }}>Resultados</div>
          {visible.length === 0 ? (
            <div className="empty">No hay propiedades en {city}.</div>
          ) : (
            <>
              <div className="prop-list">
                {visible.map((p) => (
                  <PropertyCard
                    key={p.id}
                    data={p}
                    onClick={(id) =>
                      alert(`Detalle propiedad #${id}\n${p.name}\n${p.address ?? ""}\nEstado: ${p.status ?? "-"}`)
                    }
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pager compact">
                  <button
                    className="btn-ghost pager-btn"
                    disabled={pageClamped <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label="Anterior"
                  >
                    ‹
                  </button>

                  <div className="pager-pill">
                    {pageClamped}<span className="sep">/</span>{totalPages}
                  </div>

                  <button
                    className="btn-ghost pager-btn"
                    disabled={pageClamped >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    aria-label="Siguiente"
                  >
                    ›
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Donut */}
        <div className="kpi-card">
          <div className="kpi-title">Estado</div>
          <div className="donut-wrap compact donut-row">
            <svg viewBox="0 0 42 42" className="donut">
              <circle className="donut-ring" cx="21" cy="21" r="15.9155" fill="transparent" strokeWidth="6" />
              {(() => {
                type Seg = { val: number; className: string };
                const totalSeg: number = Math.max(1, percent.interesado + percent.negociacion + percent.cerrado);
                const segs: Seg[] = [
                  { val: percent.interesado,  className: "donut-seg a" },
                  { val: percent.negociacion, className: "donut-seg b" },
                  { val: percent.cerrado,     className: "donut-seg c" },
                ];
                let acc = 0;
                return segs.map((s, idx) => {
                  const frac = s.val / totalSeg;
                  const dashNum = frac * 100;
                  const dash = `${dashNum.toFixed(2)} ${(100 - dashNum).toFixed(2)}`;
                  const rot = `rotate(${(acc / totalSeg) * 360} 21 21)`;
                  acc += s.val;
                  return (
                    <circle
                      key={idx}
                      className={s.className}
                      cx="21"
                      cy="21"
                      r="15.9155"
                      fill="transparent"
                      strokeWidth="6"
                      strokeDasharray={dash}
                      transform={rot}
                    />
                  );
                });
              })()}
              <text className="donut-center-title" x="21" y="17" textAnchor="middle">Total</text>
              <text className="donut-center-number" x="21" y="31" textAnchor="middle">{properties.length}</text>
            </svg>

            <div className="legend tight legend-contrast">
              <div><i className="lg a" /> Interesado <b>{percent.interesado}%</b></div>
              <div><i className="lg b" /> En negociación <b>{percent.negociacion}%</b></div>
              <div><i className="lg c" /> Cerrado <b>{percent.cerrado}%</b></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Propiedad */}
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 520, maxWidth: "95vw" }}
          >
            <h3 style={{ marginTop: 0 }}>Nueva propiedad</h3>
            <p className="card-desc" style={{ marginTop: -6 }}>
              Completa los campos o usa los valores de ejemplo.
            </p>

            <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <label style={{ gridColumn: "1 / -1" }}>
                <span>Nombre*</span>
                <input
                  value={form.name ?? ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Loft Parque 93"
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Dirección*</span>
                <input
                  value={form.address ?? ""}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Cra 13 #93-45"
                />
              </label>

              <label>
                <span>Latitud</span>
                <input
                  type="number"
                  step="0.00001"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) })}
                />
              </label>

              <label>
                <span>Longitud</span>
                <input
                  type="number"
                  step="0.00001"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) })}
                />
              </label>

              <label>
                <span>Estado</span>
                <select
                  value={form.status as Status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as Status })}
                >
                  <option>Interesado</option>
                  <option>En negociación</option>
                  <option>Cerrado</option>
                </select>
              </label>

              <label>
                <span>Interesados</span>
                <input
                  type="number"
                  min={0}
                  value={form.interested ?? 0}
                  onChange={(e) => setForm({ ...form, interested: parseInt(e.target.value || "0", 10) })}
                />
              </label>

              <label>
                <span>En negociación</span>
                <input
                  type="number"
                  min={0}
                  value={form.negotiating ?? 0}
                  onChange={(e) => setForm({ ...form, negotiating: parseInt(e.target.value || "0", 10) })}
                />
              </label>

              <label style={{ gridColumn: "1 / -1" }}>
                <span>Foto (URL)</span>
                <input
                  value={form.photo ?? ""}
                  onChange={(e) => setForm({ ...form, photo: e.target.value })}
                  placeholder="https://…"
                />
              </label>

              {form.photo ? (
                <div style={{ gridColumn: "1 / -1" }}>
                  <img
                    src={form.photo}
                    alt="preview"
                    style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                </div>
              ) : null}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
              <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="btn-primary" onClick={saveProperty}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertiesPage;
