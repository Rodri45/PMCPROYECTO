import React, { useMemo, useState } from "react";
import PropertiesMap from "../components/Properties/PropertiesMap";
import PropertyCard from "../components/Properties/PropertyCard";
import type { Property, MapConfig } from "../types/PropertiesMapProps";

type Status = "Interesado" | "En negociación" | "Cerrado";

/** ------------------ MOCK con interesados/negociación ------------------ */
type PropertyWithCounts = Property & {
  interested?: number;   // leads interesados
  negotiating?: number;  // leads en negociación
};

const MOCK: Record<string, PropertyWithCounts[]> = {
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
const CITIES = Object.keys(MOCK);

/** ------------------ Página ------------------ */
const PropertiesPage: React.FC = () => {
  const [city, setCity] = useState<string>("Bogotá");

  const properties = useMemo<PropertyWithCounts[]>(
    () => (MOCK[city] ?? []) as PropertyWithCounts[],
    [city]
  );

  // Centro del mapa = promedio de puntos
  const center = useMemo(() => {
    if (!properties.length) return { latitude: 4.711, longitude: -74.0721 };
    const sum = properties.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
      { lat: 0, lng: 0 }
    );
    return {
      latitude: sum.lat / properties.length,
      longitude: sum.lng / properties.length,
    };
  }, [properties]);

  const mapConfig: MapConfig = { zoom: 12, center };

  // Conteos para el donut
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

  // Datos para la gráfica de “Interesados por propiedad”
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
          <div>
            <select
              className="city-select"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
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

      {/* Contenido en dos columnas: KPIs a la izquierda (stack), lista a la derecha */}
      <div className="props-two-col">
        {/* Interesados (barras por propiedad) */}
        <div className="kpi-card">
          <div className="kpi-title">Interesados</div>
          <div className="bar-chart">
            {(() => {
              // ancho/alto y spacing
              const H = 140;
              const top = 8;
              const base = 110; // línea base donde apoyan las barras
              const w = 20;     // ancho de barra
              const gap = 12;
              const left = 10;
              const chartWidth = left + interestedBars.length * (w + gap);

              return (
                <svg
                  width="100%"
                  height={H}
                  viewBox={`0 0 ${chartWidth} ${H}`}
                  preserveAspectRatio="xMinYMid meet"
                >
                  {/* Base line & grid */}
                  <line x1="0" y1={base} x2={chartWidth} y2={base} stroke="rgba(255,255,255,.08)" />
                  {[0.25, 0.5, 0.75, 1].map((t) => (
                    <line
                      key={t}
                      x1="0"
                      y1={base - (base - top) * t}
                      x2={chartWidth}
                      y2={base - (base - top) * t}
                      stroke="rgba(255,255,255,.06)"
                    />
                  ))}

                  {/* Barras */}
                  {interestedBars.map((d, i) => {
                    const x = left + i * (w + gap);
                    const h = ((d.interested || 0) / maxInterested) * (base - top);
                    const y = base - h;

                    return (
                      <g key={i}>
                        {/* Barra principal */}
                        <rect
                          x={x}
                          y={y}
                          width={w}
                          height={h}
                          rx="6"
                          ry="6"
                          fill="rgba(26,160,179,.55)"
                        >
                          <title>
                            {`${d.name}\nInteresados: ${d.interested ?? 0}${
                              d.negotiating ? `\nEn negociación: ${d.negotiating}` : ""
                            }`}
                          </title>
                        </rect>

                        {/* Punto indicando leads en negociación, si aplica */}
                        {d.negotiating ? (
                          <circle
                            cx={x + w / 2}
                            cy={y - 6}
                            r="3"
                            fill="var(--brand)"
                          >
                            <title>{`En negociación: ${d.negotiating}`}</title>
                          </circle>
                        ) : null}

                        {/* Etiqueta del eje X */}
                        <text
                          x={x + w / 2}
                          y={H - 10}
                          fontSize="9"
                          textAnchor="middle"
                          fill="var(--muted)"
                        >
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

        {/* Lista de propiedades */}
        <div className="mini-card results-card">
          <div className="kpi-title" style={{ marginBottom: 8 }}>
            Resultados
          </div>
          {properties.length === 0 ? (
            <div className="empty">No hay propiedades en {city}.</div>
          ) : (
            <div className="prop-list">
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  data={p}
                  onClick={(id) =>
                    alert(
                      `Detalle propiedad #${id}\n${p.name}\n${p.address ?? ""}\nEstado: ${p.status ?? "-"}`
                    )
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Donut de estado */}
        <div className="kpi-card">
          <div className="kpi-title">Estado</div>
          <div className="donut-wrap compact">
            <svg viewBox="0 0 42 42" className="donut" style={{ width: 120, height: 120 }}>
              {/* anillo base */}
              <circle
                className="donut-ring"
                cx="21"
                cy="21"
                r="15.9155"
                fill="transparent"
                strokeWidth="6"
              />
              {/* segmentos */}
              {(() => {
                type Seg = { val: number; className: string };
                const totalSeg: number = Math.max(
                  1,
                  percent.interesado + percent.negociacion + percent.cerrado
                );
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
              {/* centro con más aire */}
              <g>
                <text x="21" y="17" textAnchor="middle" fontSize="7.5" fill="var(--muted)">
                  Total
                </text>
                <text
                  x="21"
                  y="31"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={800}
                  fill="var(--ink)"
                >
                  {properties.length}
                </text>
              </g>
            </svg>

            <div className="legend tight">
              <div>
                <i className="lg a" /> Interesado <b>{percent.interesado}%</b>
              </div>
              <div>
                <i className="lg b" /> En negociación <b>{percent.negociacion}%</b>
              </div>
              <div>
                <i className="lg c" /> Cerrado <b>{percent.cerrado}%</b>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertiesPage;
