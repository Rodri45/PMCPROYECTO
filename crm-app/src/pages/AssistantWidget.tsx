// src/components/pages/AssistantWidget.tsx
import React, { useEffect, useRef, useState } from "react";

/* ── Claves compartidas con el resto de la app ───────────────────────────── */
const KEY_CAL   = "pmc_calendar_events";
const KEY_PROPS = "pmc_properties_all";
const KEY_MOVES = "pmc_reports_moves_v1";
const KEY_CLIENTS = "pmc_clients";

/* ── Persistencia del chat ───────────────────────────────────────────────── */
const KEY_CHAT      = "pmc_assistant_chat_v1";
const KEY_CHAT_OPEN = "pmc_assistant_open";

/* ── Meses en español ───────────────────────────────────────────────────── */
const MONTHS: Record<string, number> = {
  enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,
  julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12
};

/* ── Tipos ───────────────────────────────────────────────────────────────── */
type Msg = { id: string; role: "user" | "assistant"; text: string; ts: number };
type EventType = "Visita" | "Reunión" | "Llamada" | "Tarea";
type CalEvent = {
  id: string;
  type: EventType;
  title: string;
  date: string;   // YYYY-MM-DD
  time?: string;  // HH:mm
  place?: string;
  note?: string;
};

/* ── Helpers base ────────────────────────────────────────────────────────── */
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const randomId = () => Math.random().toString(36).slice(2, 10);
const COP = (n: number) => n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function readLS<T>(key: string, def: T): T {
  try { const x = JSON.parse(localStorage.getItem(key) || ""); return x ?? def; }
  catch { return def; }
}
function saveLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ── Datos demo de mercado/props para recomendaciones ────────────────────── */
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
  { id: 1, city: "Bogotá",   zone: "Chico Norte", name: "Apto 2H moderno",   price: 480000000, rooms: 2, area: 78, type: "Apartamento" },
  { id: 2, city: "Bogotá",   zone: "Cedritos",    name: "Apto 1H full luz",  price: 290000000, rooms: 1, area: 47, type: "Apartamento" },
  { id: 3, city: "Medellín", zone: "El Poblado",  name: "Loft balcón vista", price: 690000000, rooms: 1, area: 64, type: "Apartamento" },
  { id: 4, city: "Bogotá",   zone: "Chapinero",   name: "Estudio amoblado",  price: 310000000, rooms: 1, area: 42, type: "Apartamento" },
];

/* ── NLU fechas/horas ────────────────────────────────────────────────────── */
function parseDateFrom(text: string): {
  iso: string;
  time?: string;
  explicit: boolean;
  dateText?: string;
  timeText?: string;
} {
  const raw = text;
  const lower = raw.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  const now = new Date();
  let target = new Date(now);
  let explicit = false;
  let dateText: string | undefined;
  let timeText: string | undefined;

  // Hora HH:mm (tolerante a espacios)
  const t = raw.match(/(\b[01]?\d|2[0-3])\s*:\s*([0-5]\d)\b/);
  if (t) { timeText = `${String(t[1]).padStart(2,"0")}:${t[2]}`; }

  // “dd de <mes> [de yyyy]”
  if (!explicit) {
    const m = lower.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/);
    if (m) {
      const dd = parseInt(m[1], 10);
      const mm = MONTHS[m[2]];
      const yy = m[3] ? parseInt(m[3], 10) : now.getFullYear();
      target = new Date(yy, mm - 1, dd);
      explicit = true;
      dateText = m[0];
    }
  }

  // “dd/mm[/yyyy]” o “dd-mm[-yyyy]” (tolerante a espacios)
  if (!explicit) {
    const dm = raw.match(/(\d{1,2})\s*[\/\-]\s*(\d{1,2})(?:\s*[\/\-]\s*(\d{2,4}))?/);
    if (dm) {
      const dd = parseInt(dm[1], 10);
      const mm = parseInt(dm[2], 10);
      const yy = dm[3]
        ? (parseInt(dm[3], 10) < 100 ? 2000 + parseInt(dm[3], 10) : parseInt(dm[3], 10))
        : now.getFullYear();
      target = new Date(yy, mm - 1, dd);
      explicit = true;
      dateText = dm[0];
    }
  }

  // hoy / mañana
  if (!explicit) {
    if (/\bhoy\b/.test(lower)) {
      explicit = true;
    } else if (/\bmanana\b/.test(lower) || /\bmañana\b/.test(raw)) {
      target.setDate(now.getDate() + 1);
      explicit = true;
      dateText = "mañana";
    }
  }

  // día de la semana -> próxima ocurrencia
  if (!explicit) {
    const dowMap: Record<string, number> = { domingo:0,lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6 };
    const d = lower.match(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
    if (d) {
      const want = dowMap[d[1]];
      const cur = now.getDay();
      let add = (want - cur + 7) % 7;
      if (add === 0) add = 7;
      target = new Date(now);
      target.setDate(now.getDate() + add);
      explicit = true;
      dateText = d[0];
    }
  }

  // si fue explícita y quedó en pasado (sin año), empujar un año
  const only = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  if (explicit && only(target) < only(now) && !/\b\d{4}\b/.test(lower)) {
    target.setFullYear(target.getFullYear() + 1);
  }

  return { iso: toISO(target), time: timeText, explicit, dateText, timeText };
}

function inferType(text: string): EventType {
  const l = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (/visita|tour|mostrar|ver inmueble/.test(l)) return "Visita";
  if (/reunion|junta|meeting/.test(l)) return "Reunión";
  if (/llamada|call/.test(l)) return "Llamada";
  return "Tarea";
}

/* ── Recordatorios ───────────────────────────────────────────────────────── */
function parseReminder(text: string): Omit<CalEvent, "id"> | null {
  const lower = text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
  if (!/(recordar|recuerdame|recuérdame)/i.test(lower)) return null;

  const { iso, time, dateText, timeText } = parseDateFrom(text);

  // Título: lo que viene después del verbo, sin fecha/hora ni conectores
  const idx = lower.search(/recordar|recuerdame|recuérdame/);
  let title = text.slice(idx).replace(/recordar|recuerdame|recuérdame/i, "");
  if (dateText) title = title.replace(dateText, "");
  if (timeText) title = title.replace(timeText, "");
  title = title.replace(/\b(el|la|para|hoy|mañana|manana|de)\b/gi, " ").replace(/\s+/g, " ").trim();
  if (!title) title = "Tarea";
  title = title[0]?.toUpperCase() + title.slice(1);

  const type = inferType(text);
  return { type, title, date: iso, time: time || "09:00", place: "Asistente", note: "Creado por IA" };
}

/* ── Recomendaciones de propiedades ─────────────────────────────────────── */
function recommend(query: string) {
  const saved = readLS<any[]>(KEY_PROPS, []);
  const all = saved?.length ? saved : DEMO_PROPS;

  const wantCity =
    /bogota|bogotá/i.test(query) ? "bogotá" :
    /medellin|medellín/i.test(query) ? "medellín" : undefined;

  // “1 habitacion”, “una habitacion”, “2 habitaciones”
  let wantRooms: number | undefined;
  const rm1 = query.match(/(\d+)\s*habitacion(?:es)?/i);
  if (rm1) wantRooms = parseInt(rm1[1], 10);
  else if (/una\s*habitacion/i.test(query)) wantRooms = 1;

  // presupuesto: 320M / 320 millones / 320.000.000 / 320k
  const budgetMatch = query.replace(/\./g, "").match(/(\d{2,9})\s*(m|millones|mm|k)?/i);
  const budgetCOP = budgetMatch
    ? (() => {
        const n = parseInt(budgetMatch[1], 10);
        const mul = /m|millones|mm/i.test(budgetMatch[2] || "") ? 1_000_000
                : /k/i.test(budgetMatch[2] || "") ? 1_000
                : 1;
        return n * mul;
      })()
    : undefined;

  let list = all.slice();
  if (wantCity) list = list.filter((p) => p.city.toLowerCase().includes(wantCity));
  if (wantRooms) list = list.filter((p) => Number(p.rooms) === wantRooms || Number(p.rooms) === (wantRooms === 1 ? 2 : wantRooms));
  if (budgetCOP) list = list.filter((p) => p.price <= budgetCOP);

  return list.slice(0, 4);
}

/* ── Consultas de negocio y agenda ──────────────────────────────────────── */
function totalsMoves() {
  const moves = readLS<Array<{kind:"income"|"expense"; amount:number}>>(KEY_MOVES, []);
  const inc = moves.filter(m=>m.kind==="income").reduce((a,b)=>a+b.amount,0);
  const exp = moves.filter(m=>m.kind==="expense").reduce((a,b)=>a+b.amount,0);
  return { inc, exp, profit: inc-exp };
}
function propertiesSummary() {
  const props = readLS<any[]>(KEY_PROPS, []);
  return { total: Array.isArray(props) ? props.length : 0 };
}
function clientsByStatus() {
  const list = readLS<any[]>(KEY_CLIENTS, []);
  const by = { "Cerrado": [] as string[], "Interesado": [] as string[], "En negociación": [] as string[] };
  (list||[]).forEach((c:any)=>{
    if (by[c?.status as keyof typeof by]) by[c.status as keyof typeof by].push(c.name || c.nombre || "Cliente");
  });
  return by;
}
function eventsOn(iso: string) {
  const evts = readLS<CalEvent[]>(KEY_CAL, []);
  return evts.filter(e => e.date === iso).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
}

/* ── “respuesta IA” (front) ─────────────────────────────────────────────── */
async function answerFront(message: string): Promise<string> {
  // 1) Recordatorios (crear evento)
  const rem = parseReminder(message);
  if (rem) {
    const evts: CalEvent[] = readLS(KEY_CAL, []);
    evts.push({ id: "ia_"+randomId(), ...rem });
    saveLS(KEY_CAL, evts);
    document.dispatchEvent(new Event("pmc:events-updated"));
    return `✅ Listo. Agendé **${rem.title}** para **${rem.date}${rem.time ? " " + rem.time : ""}** en tu calendario.`;
  }

  const lower = message.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  // 2) ¿Tengo eventos hoy / el 14/11 / jueves?
  if (/tengo\s+eventos|hay\s+eventos|eventos?\b/.test(lower)) {
    const parsed = parseDateFrom(message);
    const iso = parsed.explicit ? parsed.iso : toISO(new Date());
    const day = eventsOn(iso);
    if (day.length === 0) return `📅 ${iso}: no tienes eventos.`;
    const items = day.map(e=>`• ${e.time ? e.time+" — " : ""}${e.title} (${e.type})`).join("\n");
    return `📅 ${iso}:\n${items}`;
  }

  // 3) Ingresos / gastos / utilidad
  if (/(ingresos|gastos|utilidad)/.test(lower)) {
    const {inc, exp, profit} = totalsMoves();
    return `💰 Resumen total:\n• Ingresos: **${COP(inc)}**\n• Gastos: **${COP(exp)}**\n• Utilidad: **${COP(profit)}**`;
  }

  // 4) Propiedades (conteo)
  if (/propiedad(es)?|inmueble(s)?/.test(lower) && /cuant|total|cuantos/.test(lower)) {
    const { total } = propertiesSummary();
    return `🏠 Tienes **${total}** propiedades registradas.`;
  }

  // 5) Clientes por estado (cerrado / interesado / en negociación)
  if (/clientes?|cerrad|interesad|negociaci/.test(lower)) {
    const by = clientsByStatus();
    const sec = [
      by["En negociación"].length ? `🤝 En negociación:\n${by["En negociación"].map(n=>"• "+n).join("\n")}` : "",
      by["Interesado"].length ? `⭐ Interesados:\n${by["Interesado"].map(n=>"• "+n).join("\n")}` : "",
      by["Cerrado"].length ? `✅ Cerrados:\n${by["Cerrado"].map(n=>"• "+n).join("\n")}` : "",
    ].filter(Boolean).join("\n\n");
    return sec || "No encontré clientes con estado registrado.";
  }

  // 6) Precios de mercado por zona
  if (/precio|m2|metro cuadrado|mercado|avaluo|avalúo/.test(lower)) {
    const zone = Object.keys(MARKET).find((z) => new RegExp(z, "i").test(message));
    if (zone) {
      const { usd_m2, note } = MARKET[zone];
      return `📈 En **${zone}** el valor de referencia está cerca de **USD ${usd_m2.toLocaleString()}/m²** ${note ? `(${note})` : ""}. Si tienes el área te estimo un rango.`;
    }
    return "📈 Dime, por ejemplo: *precio m² en Cedritos* o *valor en Rosales*.";
  }

  // 7) Recomendaciones
  if (/recom|suger|busco|ofertas|disponibles/.test(lower)) {
    const recs = recommend(message);
    if (!recs.length) return "🔍 No encontré coincidencias. Dame ciudad, número de **habitaciones** y presupuesto.";
    const lines = recs.map((r) => `• **${r.name}** — ${r.city} / ${r.zone} — ${r.rooms}H — ${r.area}m² — ${COP(r.price)}`);
    return `🏠 Te pueden interesar:\n${lines.join("\n")}\n¿Quieres que las guarde para enviar a un cliente?`;
  }

  // 8) Ayuda
  return (
    "Hola 👋 Puedo **crear recordatorios**, **consultar tu agenda**, **mostrar ingresos/gastos**, " +
    "**contar propiedades**, listar **clientes por estado**, dar **precios de mercado** y **recomendar inmuebles**.\n" +
    "- *Recuérdame llamada al Banco el 15/11 09:30*\n" +
    "- *¿Tengo eventos hoy?* / *Eventos 14 de noviembre*\n" +
    "- *Ingresos y gastos totales*\n" +
    "- *¿Cuántas propiedades hay?*\n" +
    "- *Clientes en negociación*\n" +
    "- *Precio m² en Rosales*\n" +
    "- *Recomiéndame aptos en Bogotá 2 habitaciones 320M*"
  );
}

/* ── UI ──────────────────────────────────────────────────────────────────── */
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

  // Persistir mensajes y estado abierto
  useEffect(() => { saveLS(KEY_CHAT, msgs); }, [msgs]);
  useEffect(() => { open ? localStorage.setItem(KEY_CHAT_OPEN, "1") : localStorage.removeItem(KEY_CHAT_OPEN); }, [open]);

  // Autoscroll
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

  // FAB — solo cuando está cerrado
  return (
    <>
      {!open && (
        <button
          className="assistant-fab"
          aria-label="Asistente"
          onClick={() => setOpen(true)}
          title="Asistente IA"
        >
          🤖
        </button>
      )}

      <div className={`assistant-panel ${open ? "open" : ""}`}>
        <div className="assistant-header">
          <div className="avatar">🤖</div>
          <div className="title-wrap">
            <div className="title">Asistente IA</div>
            <div className="subtitle">Recordatorios • Agenda • Reportes • Propiedades</div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="chip"
              title="Reiniciar conversación"
              onClick={() => {
                localStorage.removeItem(KEY_CHAT);
                setMsgs([{ id: randomId(), role: "assistant", text: "Conversación reiniciada. ¿Qué hacemos ahora? 🙂", ts: Date.now() }]);
              }}
            >
              🧹 Reset
            </button>
            <button className="x" onClick={() => setOpen(false)}>✕</button>
          </div>
        </div>

        <div className="assistant-body" ref={listRef}>
          {msgs.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              {m.text.split("\n").map((line, i) => (<p key={i}>{line}</p>))}
            </div>
          ))}
        </div>

        <div className="assistant-footer">
          <div className="quick-row">
            {[
              "¿Tengo eventos hoy?",
              "Recuérdame llamada al Banco el 15/11 09:30",
              "Ingresos y gastos totales",
              "Clientes en negociación",
              "Precio m² en Cedritos",
              "Recomiéndame aptos en Bogotá 1 habitación 320M",
            ].map((q) => (
              <button key={q} className="chip" onClick={() => setInput(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="input-row">
            <input
              placeholder="Escribe aquí…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="send" onClick={send}>➤</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AssistantWidget;
