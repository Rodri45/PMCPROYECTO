export type ClientStatus = "Interesado" | "En negociación" | "Cerrado";

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;    // URL de la foto
  status: ClientStatus;
  lastActivity?: string; // ISO o texto corto: "hoy", "hace 2 días"
  notes?: string;
}

export interface ClientsListProps {
  clients?: Client[];
  onClientSelect?: (id: string) => void;
}

export {};
