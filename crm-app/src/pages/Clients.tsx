import React, { useEffect, useMemo, useState } from "react";
import ClientsList from "../components/Clients/ClientsList";
import type { Client, ClientStatus } from "../types/ClientsListProps";

type NewClient = {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  status: ClientStatus;
};

const STORAGE_KEY = "pmc_clients";

const genId = () =>
  "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

const DEFAULT_MOCKS: Client[] = [
  { id: "c1", name: "Juan Pérez", email: "juan@acme.com", phone: "573001112233", avatarUrl: "https://i.pravatar.cc/100?img=12", status: "Interesado", lastActivity: "hoy" },
  { id: "c2", name: "Laura Sánchez", email: "laura@globex.com", phone: "573002223344", avatarUrl: "https://i.pravatar.cc/100?img=32", status: "En negociación", lastActivity: "ayer" },
  { id: "c3", name: "Pedro Fernández", email: "pedro@initech.com", phone: "573003334455", avatarUrl: "https://i.pravatar.cc/100?img=18", status: "Cerrado", lastActivity: "hace 3 días" },
  { id: "c4", name: "Sofía Martínez", email: "sofia@umbrella.co", phone: "573004445566", avatarUrl: "https://i.pravatar.cc/100?img=47", status: "Interesado", lastActivity: "hace 2 h" }
];

const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);
const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientStatus | "Todos">("Todos");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClient>({
    name: "", email: "", phone: "", avatarUrl: "", status: "Interesado"
  });

  // 👇 Definir aquí, dentro del componente
  const FilterChip: React.FC<{ value: ClientStatus | "Todos"; label: string }> = ({ value, label }) => (
    <button
      className={"chip" + (filter === value ? " chip--active" : "")}
      onClick={() => setFilter(value)}
    >
      {label}
    </button>
  );

  // ... (useEffect de carga, visible, etc.)

  // cargar desde localStorage o sembrar mocks si no hay nada o está vacío
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Client[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
          return;
        }
      } catch {
        // si falla el parse, seguimos a los mocks
      }
    }
    setClients(DEFAULT_MOCKS);
  }, []);


  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)); }, [clients]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter(c => {
      const mQ = !q || c.name.toLowerCase().includes(q) || (c.email||"").toLowerCase().includes(q) || (c.phone||"").toLowerCase().includes(q);
      const mF = filter === "Todos" ? true : c.status === filter;
      return mQ && mF;
    });
  }, [clients, query, filter]);

  const addClient = () => {
    if (!form.name.trim()) return alert("El nombre es obligatorio");
    const newC: Client = { id: genId(), name: form.name.trim(), email: form.email?.trim() || undefined, phone: form.phone?.trim() || undefined, avatarUrl: form.avatarUrl?.trim() || undefined, status: form.status, lastActivity: "hoy" };
    setClients(prev => [newC, ...prev]);
    setForm({ name: "", email: "", phone: "", avatarUrl: "", status: "Interesado" });
    setOpen(false);
  };
  const removeAll = () => { if (confirm("¿Vaciar la lista de clientes?")) setClients([]); };
  const handleSelect = (id: string) => {
    const c = clients.find(x => x.id === id); if (!c) return;
    alert(`Ficha del cliente:\n\n${c.name}\n${c.email || "-"}\n${c.phone || "-"}\nEstado: ${c.status}`);
  };

  const Chip: React.FC<{ value: ClientStatus | "Todos"; label: string }> = ({ value, label }) => (
    <button className={"chip" + (filter === value ? " chip--active" : "")} onClick={() => setFilter(value)}>{label}</button>
  );

  return (
    <div className="page">
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">👤</div>
            <div>
              <div className="card-title">Clientes</div>
              <div className="card-desc">Lista de clientes activos</div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setOpen(true)}>+ Nuevo</button>
        </div>
      </div>

      <div className="toolbar">
        <input className="search" placeholder="Buscar por nombre, email o teléfono…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips">
          <Chip value="Todos" label="Todos" />
          <Chip value="Interesado" label="Interesados" />
          <Chip value="En negociación" label="En negociación" />
          <Chip value="Cerrado" label="Cerrados" />
        </div>
        <div style={{ textAlign: "right", marginTop: 6 }}>
          <button className="btn-ghost" onClick={removeAll}>Vaciar</button>
        </div>
      </div>

      <ClientsList clients={visible} onClientSelect={handleSelect} />

      {open && (
        <Backdrop onClose={() => setOpen(false)}>
          <h3 style={{ margin: 0 }}>Nuevo cliente</h3>
          <p className="card-desc" style={{ marginTop: 2 }}>Completa los campos y guarda</p>
          <div className="form-grid">
            <label><span>Nombre*</span><input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Ana Gómez" /></label>
            <label><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ana@mail.com" /></label>
            <label><span>Teléfono</span><input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="57300..." /></label>
            <label><span>Foto (URL)</span><input value={form.avatarUrl} onChange={(e) => setForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://…" /></label>
            <label><span>Estado</span>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as ClientStatus }))}>
                <option>Interesado</option><option>En negociación</option><option>Cerrado</option>
              </select>
            </label>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
            <button className="btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={addClient}>Guardar</button>
          </div>
        </Backdrop>
      )}
    </div>
  );
};

export default ClientsPage;
