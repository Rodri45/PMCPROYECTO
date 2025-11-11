// src/layouts/Shell.tsx
import React from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { logout, getUser } from "../lib/auth";
import AssistantWidget from "../pages/AssistantWidget"; // <-- IA global
import TabBar from "../components/TabBar";                   // <-- TabBar global

const Shell: React.FC = () => {
  const nav = useNavigate();
  const loc = useLocation();
  const user = getUser();

  const handleLogout = () => {
    if (!confirm("¿Cerrar sesión?")) return;
    logout();
    nav("/login", { replace: true });
  };

  const titles: Record<string, string> = {
    "/": "Inicio",
    "/clients": "Clientes",
    "/properties": "Propiedades",
    "/reports": "Reportes",
    "/calendar": "Calendario",
  };
  const title = titles[loc.pathname] ?? "PMC CRM";

  return (
    <>
      {/* Topbar */}
      <header className="topbar">
        <div className="row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
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
            </Link>
            <div>
              <div className="title">{title}</div>
              <div className="subtitle">CRM Inmobiliaria</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user ? (
              <span className="chip" title={user.email}>
                {user.name} · {user.role}
              </span>
            ) : null}
            <button className="btn-ghost" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main style={{ paddingBottom: 74 }}>
        {/* paddingBottom para no tapar contenido con la TabBar fija */}
        <Outlet />
      </main>

      {/* TabBar fija abajo (visible en todas las vistas protegidas) */}
      <TabBar />

      {/* Widget de IA flotante (icono 🤖 visible en todas las vistas protegidas) */}
      <AssistantWidget />
    </>
  );
};

export default Shell;
