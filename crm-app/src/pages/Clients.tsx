import React, { useEffect, useMemo, useState } from "react";
import ClientsList from "../components/Clients/ClientsList";
import type { Client, ClientStatus } from "../types/ClientsListProps";

/* ─────────────────────────── Setup ─────────────────────────── */
type NewClient = {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  status: ClientStatus;
};

const STORAGE_KEY = "pmc_clients";
const genId = () => "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);

const DEFAULT_MOCKS: Client[] = [
  { id: "c1", name: "Juan Pérez",   email: "juan@acme.com",     phone: "573001112233", avatarUrl: "https://i.pravatar.cc/100?img=12", status: "Interesado",     lastActivity: "hoy" },
  { id: "c2", name: "Laura Sánchez",email: "laura@globex.com",  phone: "573002223344", avatarUrl: "https://i.pravatar.cc/100?img=32", status: "En negociación", lastActivity: "ayer" },
  { id: "c3", name: "Pedro Fernández", email: "pedro@initech.com", phone: "573003334455", avatarUrl: "https://i.pravatar.cc/100?img=18", status: "Cerrado",        lastActivity: "hace 3 días" },
  { id: "c4", name: "Sofía Martínez",  email: "sofia@umbrella.co", phone: "573004445566", avatarUrl: "https://i.pravatar.cc/100?img=47", status: "Interesado",     lastActivity: "hace 2 h" },
];

/* Backdrop simple para modal */
const Backdrop: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div>
  </div>
);

/* ─────────────────────────── Page ─────────────────────────── */
const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ClientStatus | "Todos">("Todos");

  // Modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<NewClient>({
    name: "", email: "", phone: "", avatarUrl: "", status: "Interesado",
  });

  // Paginación
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  /* Carga inicial (si no hay nada, usa mocks) */
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed: Client[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setClients(parsed);
          return;
        }
      } catch { /* si falla, ignora y usa mocks */ }
    }
    setClients(DEFAULT_MOCKS);
  }, []);

  /* Persistir */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
  }, [clients]);

  /* Filtro + búsqueda */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = clients.filter((c) => {
      const matchQ =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q);
      const matchF = filter === "Todos" ? true : c.status === filter;
      return matchQ && matchF;
    });
    return out;
  }, [clients, query, filter]);

  /* Paginado */
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* Acciones */
  const addClient = () => {
    if (!form.name.trim()) return alert("El nombre es obligatorio");
    const newC: Client = {
      id: genId(),
      name: form.name.trim(),
      email: form.email?.trim() || undefined,
      phone: form.phone?.trim() || undefined,
      avatarUrl: form.avatarUrl?.trim() || undefined,
      status: form.status,
      lastActivity: "hoy",
    };
    setClients((prev) => [newC, ...prev]);
    setForm({ name: "", email: "", phone: "", avatarUrl: "", status: "Interesado" });
    setOpen(false);
    setPage(1);
  };

  const removeAll = () => {
    if (confirm("¿Vaciar la lista de clientes?")) {
      setClients([]);
      setPage(1);
    }
  };

  const handleSelect = (id: string) => {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    alert(`Ficha del cliente:\n\n${c.name}\n${c.email || "-"}\n${c.phone || "-"}\nEstado: ${c.status}`);
  };

  /* DEMO: genera 20–30 clientes aleatorios */
  const seedDemo = () => {
    const first = ["Juan", "Laura", "Pedro", "Sofía", "Andrés", "María", "Camilo", "Daniela", "Felipe", "Carolina", "Pablo", "Diana", "Julián", "Paula", "Santiago", "Valentina", "Nicolás", "Luisa", "Esteban", "Catalina"];
    const last  = ["Pérez", "García", "Martínez", "Ramírez", "Sánchez", "Gómez", "Rodríguez", "Fernández", "Castro", "Vargas", "Suárez", "López", "Mejía", "Muñoz", "Rojas", "Moreno"];
    const statuses: ClientStatus[] = ["Interesado", "En negociación", "Cerrado"];

    const howMany = 20 + Math.floor(Math.random() * 11); // 20..30
    const genPhone = () => "57" + (300 + Math.floor(Math.random() * 80)).toString() + Math.floor(1000000 + Math.random() * 8999999).toString();
    const todayLabel = ["hoy", "ayer", "hace 2 días", "hace 3 días", "hace 1 h", "hace 2 h"];

    const arr: Client[] = Array.from({ length: howMany }).map((_, i) => {
      const fn = first[Math.floor(Math.random() * first.length)];
      const ln = last[Math.floor(Math.random() * last.length)];
      const name = `${fn} ${ln}`;
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@demo.io`.replace("ñ","n");
      const avatarIdx = 1 + ((i * 7) % 70); // distribuye un poco
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        id: genId(),
        name,
        email,
        phone: genPhone(),
        avatarUrl: `https://i.pravatar.cc/100?img=${avatarIdx}`,
        status,
        lastActivity: todayLabel[Math.floor(Math.random() * todayLabel.length)],
      };
    });

    setClients(arr);
    setQuery("");
    setFilter("Todos");
    setPage(1);
  };

  /* Chips (filtro) */
  const Chip: React.FC<{ value: ClientStatus | "Todos"; label: string }> = ({ value, label }) => (
    <button
      className={"chip" + (filter === value ? " chip--active" : "")}
      onClick={() => { setFilter(value); setPage(1); }}
    >
      {label}
    </button>
  );

  return (
    <div className="page">
      {/* Header */}
      <div className="card" style={{ marginTop: 8, marginBottom: 10 }}>
        <div className="card-row" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="badge">👤</div>
            <div>
              <div className="card-title">Clientes</div>
              <div className="card-desc">Lista de clientes activos</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" onClick={seedDemo}>Demo</button>
            <button className="btn-primary" onClick={() => setOpen(true)}>+ Nuevo</button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <input
          className="search"
          placeholder="Buscar por nombre, email o teléfono…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
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

      {/* Lista (paginada) */}
      <ClientsList clients={paged} onClientSelect={handleSelect} />

      {/* Paginación */}
      {filtered.length > PAGE_SIZE && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
            margin: "10px 0 18px",
          }}
        >
          <button
            className="btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            title="Anterior"
          >
            ‹
          </button>
          <div className="chip" style={{ cursor: "default" }}>
            {page}/{pageCount}
          </div>
          <button
            className="btn-ghost"
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            disabled={page === pageCount}
            title="Siguiente"
          >
            ›
          </button>
        </div>
      )}

      {/* Modal nuevo cliente */}
      {open && (
        <Backdrop onClose={() => setOpen(false)}>
          <h3 style={{ margin: 0 }}>Nuevo cliente</h3>
          <p className="card-desc" style={{ marginTop: 2 }}>Completa los campos y guarda</p>
          <div className="form-grid">
            <label>
              <span>Nombre*</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Ana Gómez"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="ana@mail.com"
              />
            </label>
            <label>
              <span>Teléfono</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="57300..."
              />
            </label>
            <label>
              <span>Foto (URL)</span>
              <input
                value={form.avatarUrl}
                onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
                placeholder="https://…"
              />
            </label>
            <label>
              <span>Estado</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))
                }
              >
                <option>Interesado</option>
                <option>En negociación</option>
                <option>Cerrado</option>
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
