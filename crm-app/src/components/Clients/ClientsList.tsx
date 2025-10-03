import React from "react";
import type { ClientsListProps, Client } from "../../types/ClientsListProps";

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8a15.1 15.1 0 006.6 6.6l2.2-2.2a1 1 0 011.1-.2 11.7 11.7 0 003.6.6 1 1 0 011 1v3.6a1 1 0 01-1 1A17.1 17.1 0 013 6a1 1 0 011-1h3.6a1 1 0 011 1 11.7 11.7 0 00.6 3.6 1 1 0 01-.2 1.1L6.6 10.8z"/></svg>
);
const WAIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.05 2a10 10 0 00-8.5 15.2L2 22l4.97-1.5A10 10 0 1012.05 2zm5.7 14.7c-.24.67-1.4 1.3-1.93 1.34-.51.05-1.17.07-1.89-.12a8.54 8.54 0 01-3.9-2.2 9.8 9.8 0 01-2.18-3.36c-.46-1.1-.5-2-.48-2.2.02-.2.21-.97.9-1.4.24-.15.55-.2.87-.12.28.07.44.3.55.53.22.5.7 1.7.76 1.84.07.15.1.33.02.52-.08.2-.12.31-.23.48-.12.17-.25.38-.36.51-.12.12-.26.26-.11.51.15.26.68 1.12 1.46 1.82 1 .9 1.85 1.17 2.13 1.3.27.12.44.1.6-.06.2-.23.45-.6.72-.97.18-.25.42-.28.68-.19.27.1 1.7.8 1.99.95.3.15.5.22.57.35.06.12.06.7-.18 1.35z"/></svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 5c5.05 0 9.27 3.11 10.86 7.5C21.27 16.89 17.05 20 12 20S2.73 16.89 1.14 12.5C2.73 8.11 6.95 5 12 5zm0 3a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"/></svg>
);

const initials = (name?: string) =>
  (name || "?")
    .split(" ")
    .map(s => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const ClientsList: React.FC<ClientsListProps> = ({
  clients = [],
  onClientSelect = () => {},
}) => {
  return (
    <div className="client-grid">
      {clients.map((c: Client) => (
        <div key={c.id} className="client-card" onClick={() => onClientSelect(c.id)}>
          <div className="client-avatar" aria-hidden="true">
            {c.avatarUrl ? <img src={c.avatarUrl} alt={c.name} /> : initials(c.name)}
          </div>

          <div className="client-main">
            <div className="client-name">{c.name}</div>
            <div className="client-meta">
              <span className={`status-pill status--${c.status.replace(" ", "\\ ")}`}>
                {c.status}
              </span>
              {c.lastActivity ? <> · Último mov.: {c.lastActivity}</> : null}
            </div>
          </div>

          <div className="client-actions" onClick={(e) => e.stopPropagation()}>
            {c.phone && (
              <button className="icon-btn" title="Llamar" onClick={() => window.open(`tel:${c.phone}`, "_self")}>
                <PhoneIcon />
              </button>
            )}
            {c.phone && (
              <button className="icon-btn" title="WhatsApp" onClick={() => window.open(`https://wa.me/${c.phone}`, "_blank")}>
                <WAIcon />
              </button>
            )}
            <button className="icon-btn" title="Ver ficha" onClick={() => onClientSelect(c.id)}>
              <EyeIcon />
            </button>
          </div>
        </div>
      ))}
      {clients.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          No hay clientes aún. Crea uno con “+ Nuevo”.
        </div>
      )}
    </div>
  );
};

export default ClientsList;
