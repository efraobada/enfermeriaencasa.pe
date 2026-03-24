import { useEffect, useState } from "react";

const C = {
  brand: "#3fb8c9",
  brandDark: "#2ca9bc",
  brandDeep: "#dbe8ea",
  brandDeep2: "#f3f8f8",
  text: "#0d2756",
  muted: "#607089",
  accent: "#e9b86d",
  line: "#d8e1e6",
  surface: "#ffffff",
  bg: "#f5f7f8",
};

const WA = "51973591964";
const WAM = encodeURIComponent("Hola, deseo solicitar un servicio de enfermeria a domicilio en Cusco.");

function Icon({ name, size = 20, color = "currentColor", stroke = 1.8 }) {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: color, strokeWidth: stroke,
    strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true"
  };
  const icons = {
    check: <><circle cx="12" cy="12" r="9" /><path d="M8 12l2.5 2.5L16 9" /></>,
    home:  <><path d="M4 11.5L12 5l8 6.5" /><path d="M7 10.5V19h10v-8.5" /></>,
    whatsapp: <><path d="M6 18l1.2-3A7 7 0 1 1 18 15.8z" /><path d="M10 9.5c.4 2 1.9 3.5 3.9 3.9" /></>,
    phone: <><path d="M7 5h3l1 4-2 1.5a14 14 0 0 0 4.5 4.5L15 13l4 1v3a2 2 0 0 1-2 2A15 15 0 0 1 5 7a2 2 0 0 1 2-2z" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="3" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    shield: <><path d="M12 3l7 3v5c0 4.3-2.7 8.1-7 10-4.3-1.9-7-5.7-7-10V6z" /><path d="M9 12l2 2 4-4" /></>,
  };
  return <svg {...p}>{icons[name]}</svg>;
}

function LogoLockup() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        border: "1px solid rgba(63,184,201,.25)",
        background: "#fff", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 5
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
          stroke="#3fb8c9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="5" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </div>
      <div>
        <span style={{ display: "block", fontWeight: 900, fontSize: 15, color: C.text, lineHeight: 1, letterSpacing: "-.03em" }}>
          Enfermeria a Domicilio
        </span>
        <span style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.brandDark, marginTop: 3 }}>
          Atencion las 24 horas del dia
        </span>
      </div>
    </div>
  );
}

export default function Gracias() {
  const [contador, setContador] = useState(10);

  useEffect(() => {
    if (contador <= 0) { window.location.href = "/"; return; }
    const t = setTimeout(() => setContador(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [contador]);

  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Nunito Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      <nav style={{ background: "rgba(255,255,255,.97)", borderBottom: `1px solid ${C.line}`, boxShadow: "0 4px 20px rgba(13,39,86,.06)", padding: "0 20px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ textDecoration: "none" }}><LogoLockup /></a>
          <a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, color: C.text, background: "#fff", border: `1px solid ${C.line}`, textDecoration: "none" }}>
            <Icon name="whatsapp" size={15} color={C.brandDark} />WhatsApp
          </a>
        </div>
      </nav>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

        <div style={{ width: 100, height: 100, borderRadius: "50%", background: `linear-gradient(135deg, ${C.brand}, #2b8f78)`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28, boxShadow: "0 20px 50px rgba(63,184,201,.25)", animation: "popIn .5s cubic-bezier(.175,.885,.32,1.275) forwards" }}>
          <Icon name="check" size={48} color="#fff" stroke={2.2} />
        </div>

        <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 900, color: C.text, lineHeight: 1.15, letterSpacing: "-.04em", marginBottom: 12 }}>
          ¡Cita registrada con éxito!
        </h1>
        <p style={{ fontSize: 16, color: C.muted, lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
          Hemos recibido tu solicitud. Una enfermera profesional se comunicará contigo en breve para confirmar los detalles de tu cita.
        </p>

        <div style={{ width: "100%", background: C.surface, borderRadius: 20, border: `1px solid ${C.line}`, padding: 28, marginBottom: 28, boxShadow: "0 8px 30px rgba(13,39,86,.06)" }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 20 }}>¿Qué sigue ahora?</h2>
          {[
            { icon: "phone",    color: "#3fb8c9", bg: "#ecf9fb", titulo: "Te llamaremos pronto",    desc: "Una enfermera te contactará al número que registraste para confirmar tu cita." },
            { icon: "calendar", color: "#2b8f78", bg: "#e8f5f1", titulo: "Confirmamos fecha y hora", desc: "Verificamos disponibilidad y coordinamos el horario más conveniente para ti." },
            { icon: "shield",   color: "#e9b86d", bg: "#fff4de", titulo: "Atención en tu hogar",    desc: "El día acordado, nuestra enfermera llegará puntual con todos los materiales." },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: i < 2 ? 18 : 0, paddingBottom: i < 2 ? 18 : 0, borderBottom: i < 2 ? `1px solid ${C.line}` : "none" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name={item.icon} size={18} color={item.color} />
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text, marginBottom: 3 }}>{item.titulo}</div>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ width: "100%", background: "linear-gradient(135deg, #eef9f7, #f3fbfc)", borderRadius: 16, border: "1px solid #c9ece7", padding: "18px 24px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
          <Icon name="phone" size={16} color={C.brandDark} />
          <span style={{ fontSize: 14, color: "#2f9c95", fontWeight: 700 }}>¿Urgente? Llama o escribe al</span>
          <a href="tel:+51973591964" style={{ fontSize: 15, fontWeight: 900, color: C.text, textDecoration: "none" }}>+51 973 591 964</a>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
          <a href="/" style={{ padding: "13px 24px", background: `linear-gradient(135deg, ${C.brand}, ${C.brandDark})`, color: "#fff", fontWeight: 800, borderRadius: 14, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", boxShadow: "0 10px 24px rgba(63,184,201,.22)" }}>
            <Icon name="home" size={15} color="#fff" />Volver al inicio
          </a>
          <a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer"
            style={{ padding: "13px 24px", background: "#fff", color: C.text, fontWeight: 800, borderRadius: 14, fontSize: 14, display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", border: `1px solid ${C.line}`, boxShadow: "0 8px 20px rgba(13,39,86,.07)" }}>
            <Icon name="whatsapp" size={15} color="#2b8f78" />WhatsApp
          </a>
        </div>

        <p style={{ fontSize: 12, color: "#9ab3b9" }}>
          Redirigiendo al inicio en <span style={{ fontWeight: 700, color: C.brandDark }}>{contador}s</span>
        </p>
      </main>

      <footer style={{ borderTop: `1px solid ${C.line}`, padding: "20px", textAlign: "center", fontSize: 12, color: "#9ab3b9" }}>
        2026 Enfermeria a Domicilio Cusco · Todos los derechos reservados
      </footer>

      <style>{`@keyframes popIn { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }`}</style>
    </div>
  );
}
