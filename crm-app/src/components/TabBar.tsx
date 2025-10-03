import React from "react";
import { NavLink } from "react-router-dom";

type IconProps = { path: string };
const Icon: React.FC<IconProps> = ({ path }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={22} height={22}>
    <path d={path} />
  </svg>
);

const tabs = [
  { to: "/",           label: "Inicio",    icon: "M12 3l9 8-1.5 1.8L18 11v8H6v-8l-1.5 1.8L3 11l9-8z" },
  { to: "/clients",    label: "Clientes",  icon: "M12 12a5 5 0 100-10 5 5 0 000 10zM4 20a8 8 0 0116 0v1H4v-1z" },
  { to: "/properties", label: "Prop",      icon: "M3 10l9-7 9 7v10a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V10z" },
  { to: "/calendar",   label: "Agenda",    icon: "M7 4h1V2h2v2h4V2h2v2h1a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2zm12 6H5v8a1 1 0 001 1h12a1 1 0 001-1v-8z" },
  { to: "/reports",    label: "Reportes",  icon: "M4 19h16v2H4v-2zm2-10h3v8H6v-8zm5-4h3v12h-3V5zm5 6h3v6h-3v-6z" },
];

const TabBar: React.FC = () => (
  <div className="tabbar">
    <div className="tabbar-inner">
      {tabs.map(t => (
        <NavLink
          key={t.to}
          to={t.to}
          className={({ isActive }) => "tab" + (isActive ? " active" : "")}
          end={t.to === "/"}
        >
          <Icon path={t.icon} />
          <span>{t.label}</span>
        </NavLink>
      ))}
    </div>
  </div>
);

export default TabBar;
