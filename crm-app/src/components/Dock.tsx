import React from "react";
import { NavLink } from "react-router-dom";

type DockProps = {
  position?: "top" | "bottom";
  variant?: "bar" | "pill"; // bar = ancho completo; pill = flotante
};

export default function Dock({ position = "bottom", variant = "pill" }: DockProps) {
  return (
    <nav className={`dock ${position} ${variant}`}>
      <div className="dock-inner">
        <NavLink to="/" className="dock-btn">
          <span className="ico">🏠</span><span>Inicio</span>
        </NavLink>
        <NavLink to="/clients" className="dock-btn">
          <span className="ico">👤</span><span>Clientes</span>
        </NavLink>
        <NavLink to="/properties" className="dock-btn">
          <span className="ico">🏠</span><span>Prop</span>
        </NavLink>
        <NavLink to="/calendar" className="dock-btn">
          <span className="ico">📅</span><span>Agenda</span>
        </NavLink>
        <NavLink to="/reports" className="dock-btn">
          <span className="ico">📊</span><span>Reportes</span>
        </NavLink>
      </div>
    </nav>
  );
}
