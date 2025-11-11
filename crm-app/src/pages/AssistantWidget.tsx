import React, { useEffect, useRef, useState } from "react";

/* Claves compartidas con el resto de la app */
const KEY_CAL = "pmc_calendar_events";
const KEY_PROPS = "pmc_properties_all";

/* Persistencia del chat y si está abierto */
const KEY_CHAT = "pmc_assistant_chat_v1";
const KEY_CHAT_OPEN = "pmc_assistant_open";

type Msg = { id: string; role: "user" | "assistant"; text: string; ts: number };

type CalEvent = {
  id: string;
  type: "Visita" | "Reunión" | "Llamada" | "Tarea";
  title: string;
  date: string;   // YYYY-MM-DD
  time?: string;  // HH:mm
  place?: string;
  note?: string;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const randomId = () => Math.random().toString(36).slice(2, 10);

/* ---- helpers LS ---- */
function readLS<T>(key: string, def: T): T {
  try { const x = JSON.parse(localStorage.getItem(key) || ""); return x ?? def; }
  catch { return def; }
}
function saveLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---- demo/market ---- */
const MARKET: Record<string, { usd_m2: number; note?: string }> = {
  "Chico Norte": { usd_m2: 2250, note: "Alta demanda, inventario bajo." },
  Rosales: { usd_m2: 2400, note: "Segmento premium, rotación lenta." },
  Cedritos: { usd_m2: 1600, note: "Muy líquido en 1-2 hab." },
  "Santa Bárbara": { usd_m2: 2000 },
  Chapinero: { usd_m2: 1800 },
  Niza: { usd_m2: 1500 },
  Teusaquillo: { usd_m2: 1700 },
  "El Poblado": { usd_m2: 2400 },
  Laureles: { usd_m2: 1850 },
  Envigado: { usd_m2: 1950 },
};
const DEMO_PROPS = [
  { id: 1, city: "Bogotá", zone: "Chico Norte", name: "Apto 2H moderno", price: 480000000, rooms: 2, area: 78, type: "Apartamento" },
  { id: 2, city: "Bogotá", zone: "Cedritos", name: "Apto 1H full luz", price: 290000000, rooms: 1, area: 47, type: "Apartamento" },
  { id: 3, city: "Medellín", zone: "El Poblado", name: "Loft balcón vista", price: 690000000, rooms: 1, area: 64, type: "Apartamento" },
  { id: 4, city: "Bogotá", zone: "Chapinero", name: "Estudio amoblado", price: 310000000, rooms: 1, area: 42, type: "Apartamento" },
];

/* ---- NLU simple ---- */
function parseReminder(text: string): { date: string; time?: string; title: string } | null {
  const lower = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (!/(recordar|recuerdame|recuérdame)/i.test(lower)) return null;

  const now = new Date();
  let d = new Date(now);
  let time: string | undefined;

  if (lower.includes("manana")) d.setDate(now.getDate() + 1);
  else if (lower.includes("hoy")) d = now;

  const hhmm = text.match(/(\b[01]?\d|2[0-3]):([0-5]\d)\b/);
  if (hhmm) time = hhmm[0];
  if (!time) time = "09:00";

  const idx = lower.search(/recordar|recuerdame|recuérdame/);
  const title = text.slice(idx).replace(/recordar|recuerdame|recuérdame/i, "").trim() || "Tarea";
  return { date: toISO(d), time, title: title[0]?.toUpperCase() + title.slice(1) };
}

/* ---- recomendaciones ---- */
function recommend(query: string) {
  const saved = readLS<any[]>(KEY_PROPS, []);
  const all = saved?.length ? saved : DEMO_PROPS;

  const wantCity = /bogota|bogotá|medellin|medellín/i.exec(query)?.[0];
  const wantRooms = /(\d)\s*h(ab|abs|abitaciones)?/i.exec(query)?.[1];
  const budgetMatch = query.match(/(\d{3,})\s*(k|m|millones|mm)?/i);

  const budgetCOP =
    budgetMatch
      ? (() => {
          const n = parseInt(budgetMatch[1], 10);
          const mul = /m|millones|mm/i.test(budgetMatch[2] || "") ? 1_000_000 : /k/i.test(budgetMatch[2] || "") ? 1_000 : 1;
          return n * mul;
        })()
      : undefined;

  let list = all.slice();
  if (wantCity) {
    list = list.filter((p) =>
      /bogota|bogotá/i.test(wantCity) ? p.city.toLowerCase().includes("bogotá") : p.city.toLowerCase().includes("medellín")
    );
  }
  if (wantRooms) list = list.filter((p) => String(p.rooms) === String(wantRooms));
  if (budgetCOP) list = list.filter((p) => p.price <= budgetCOP);

  return list.slice(0, 4);
}

/* ---- “respuesta IA” en front ---- */
async function answerFront(message: string): Promise<string> {
  const rem = parseReminder(message);
  if (rem) {
    const evts: CalEvent[] = readLS(KEY_CAL, []);
    evts.push({
      id: "ia_" + randomId(),
      type: "Tarea",
      title: rem.title,
      date: rem.date,
      time: rem.time,
      place: "Asistente",
      note: "Creado por IA",
    });
    saveLS(KEY_CAL, evts);
    // 🔔 Notificar a otras vistas (Calendario / Inicio)
    document.dispatchEvent(new Event("pmc:events-updated"));
    return `✅ Listo. Agendé **${rem.title}** para **${rem.date}${rem.time ? " " + rem.time : ""}** en tu calendario.`;
  }

  if (/precio|m2|metro cuadrado|mercado|avaluo|avalúo/i.test(message)) {
    const zone = Object.keys(MARKET).find((z) => new RegExp(z, "i").test(message));
    if (zone) {
      const { usd_m2, note } = MARKET[zone];
      return `📈 En **${zone}** el valor de referencia está cerca de **USD ${usd_m2.toLocaleString()}/m²** ${note ? `(${note})` : ""}. Si tienes el área te estimo un rango.`;
    }
    return "📈 Dime, por ejemplo: *precio m² en Cedritos* o *valor en Rosales*.";
  }

  if (/recom|suger|busco|ofertas|disponibles/i.test(message)) {
    const recs = recommend(message);
    if (!recs.length) return "🔍 No encontré coincidencias. Dame ciudad, # habitaciones y presupuesto.";
    const lines = recs.map((r) => `• **${r.name}** — ${r.city} / ${r.zone} — ${r.rooms}H — ${r.area}m² — $${r.price.toLocaleString()} COP`);
    return `🏠 Te pueden interesar:\n${lines.join("\n")}\n¿Quieres que las guarde para enviar a un cliente?`;
  }

  return "Hola 👋 Puedo **crear recordatorios**, dar **precios de mercado** y **recomendar inmuebles**.\n- *Recuérdame llamar a Sofía mañana 15:00*\n- *Precio m² en Rosales*\n- *Recomiéndame aptos en Bogotá 1H 320M*";
}

/* ---- UI ---- */
const AssistantWidget: React.FC = () => {
  const [open, setOpen] = useState<boolean>(() => localStorage.getItem(KEY_CHAT_OPEN) === "1");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    const saved = readLS<Msg[]>(KEY_CHAT, []);
    return saved.length
      ? saved
      : [{ id: randomId(), role: "assistant", text: "¡Hola! Soy tu asistente IA. ¿Qué hacemos hoy? 😊", ts: Date.now() }];
  });
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { saveLS(KEY_CHAT, msgs); }, [msgs]);
  useEffect(() => { open ? localStorage.setItem(KEY_CHAT_OPEN, "1") : localStorage.removeItem(KEY_CHAT_OPEN); }, [open]);
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, msgs.length]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    setMsgs((m) => [...m, { id: randomId(), role: "user", text, ts: Date.now() }]);
    setInput("");
    const reply = await answerFront(text);
    setMsgs((m) => [...m, { id: randomId(), role: "assistant", text: reply, ts: Date.now() }]);
  };

  return (
    <>
      <button className="assistant-fab" aria-label="Asistente" onClick={() => setOpen(v => !v)} title="Asistente IA">🤖</button>

      <div className={`assistant-panel ${open ? "open" : ""}`}>
        <div className="assistant-header">
          <div className="avatar">🤖</div>
          <div className="title-wrap">
            <div className="title">Asistente IA</div>
            <div className="subtitle">Recordatorios • Precios • Recomendaciones</div>
          </div>
          <button className="x" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="assistant-body" ref={listRef}>
          {msgs.map(m => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.text.split("\n").map((line, i) => <p key={i}>{line}</p>)}
            </div>
          ))}
        </div>

        <div className="assistant-footer">
          <div className="quick-row">
            {[
              "Recuérdame llamar a Sofía mañana 15:00",
              "Precio m² en Cedritos",
              "Recomiéndame aptos en Bogotá 1H 320M",
            ].map(q => <button key={q} className="chip" onClick={() => setInput(q)}>{q}</button>)}
          </div>
          <div className="input-row">
            <input placeholder="Escribe aquí…" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button className="send" onClick={send}>➤</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssistantWidget;
