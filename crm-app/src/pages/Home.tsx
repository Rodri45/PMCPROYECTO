import React from "react";
import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const nav = useNavigate();

  return (
    <>
      <header className="topbar">
        <div className="row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--ring)",
              }}
            >
              🏠
            </span>
            <div>
              <div className="title">PMC CRM</div>
              <div className="subtitle">Bienvenido de vuelta</div>
            </div>
          </div>

          <button
            onClick={() => nav("/clients")}
            style={{
              border: "none",
              background: "rgba(255,255,255,.18)",
              color: "#fff",
              padding: "8px 10px",
              borderRadius: 10,
              fontWeight: 700,
              cursor: "pointer",
            }}
            aria-label="nuevo"
          >
            + Nuevo
          </button>
        </div>
      </header>

      <main className="page">
        <section
          className="card"
          style={{
            marginTop: 45,
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <div className="badge">📈</div>
          <div>
            <div className="card-title">Resumen de hoy</div>
            <div className="card-desc">
              2 reuniones · 5 leads activos · 3 propiedades nuevas
            </div>
          </div>
        </section>

        <section className="quick-list">
          <button className="quick-item" onClick={() => nav("/clients")}>
            <div className="quick-left">
              <div className="badge">👤</div>
              <div>
                <div className="card-title">Clientes</div>
                <div className="card-desc">
                  Contacta, agenda y haz seguimiento
                </div>
              </div>
            </div>
            <div>›</div>
          </button>

          <button className="quick-item" onClick={() => nav("/properties")}>
            <div className="quick-left">
              <div className="badge">🏠</div>
              <div>
                <div className="card-title">Propiedades</div>
                <div className="card-desc">Mapa, estado y desempeño</div>
              </div>
            </div>
            <div>›</div>
          </button>

          <button className="quick-item" onClick={() => nav("/calendar")}>
            <div className="quick-left">
              <div className="badge">📅</div>
              <div>
                <div className="card-title">Calendario</div>
                <div className="card-desc">Tus visitas y reuniones</div>
              </div>
            </div>
            <div>›</div>
          </button>

          <button className="quick-item" onClick={() => nav("/reports")}>
            <div className="quick-left">
              <div className="badge">💹</div>
              <div>
                <div className="card-title">Reportes</div>
                <div className="card-desc">Ingresos, gastos y embudo</div>
              </div>
            </div>
            <div>›</div>
          </button>
        </section>
      </main>
    </>
  );
}
