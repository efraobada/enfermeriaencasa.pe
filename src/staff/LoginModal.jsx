import { useState } from "react";
import { useAuth } from "./AuthContext";

const C = {
  text: "#0d2756", muted: "#607089", brand: "#3fb8c9",
  brandDark: "#2ca9bc", line: "#d8e1e6", surface: "#ffffff",
  surfaceSoft: "#eef4f6", error: "#c0392b", errorSoft: "#fef2f2",
};

const S = {
  overlay: { position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16 },
  backdrop: { position:"absolute",inset:0,background:"rgba(15,23,42,.65)",backdropFilter:"blur(8px)" },
  card: { position:"relative",background:C.surface,borderRadius:24,width:"100%",maxWidth:400,padding:"36px 32px",boxShadow:"0 32px 80px rgba(13,39,86,.22)",animation:"modalIn .28s ease-out" },
  inp: { width:"100%",padding:"13px 16px",background:C.surfaceSoft,border:`1px solid ${C.line}`,borderRadius:12,fontSize:14,outline:"none",color:C.text,fontFamily:"inherit",boxSizing:"border-box" },
  btn: { width:"100%",padding:"14px",background:"linear-gradient(135deg,#35b5c5,#227a74)",color:"#fff",fontWeight:800,borderRadius:14,fontSize:15,border:"1px solid rgba(255,255,255,.22)",cursor:"pointer",fontFamily:"inherit",boxShadow:"0 12px 28px rgba(47,156,149,.28)",transition:"opacity .2s" },
};

export default function LoginModal({ onClose }) {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [pass, setPass]         = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), pass);
      window.location.href = "/panel";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.overlay}>
      <div style={S.backdrop} onClick={onClose} />
      <div style={S.card}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:20,lineHeight:1}}>✕</button>

        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,borderRadius:16,background:"linear-gradient(135deg,#35b5c5,#227a74)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",boxShadow:"0 12px 28px rgba(47,156,149,.28)"}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3"/><path d="M8 19a4 4 0 0 1 8 0"/><path d="M10 4h4M12 2v4"/></svg>
          </div>
          <h2 style={{fontSize:22,fontWeight:900,color:C.text,letterSpacing:"-.03em"}}>Panel de Personal</h2>
          <p style={{color:C.muted,fontSize:13,marginTop:6}}>Enfermería en Casa — Área restringida</p>
        </div>

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Usuario</label>
            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="nombre.apellido" required autoFocus autoComplete="username" style={S.inp} />
          </div>
          <div>
            <label style={{display:"block",fontSize:12,fontWeight:700,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:".05em"}}>Contraseña</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" required style={S.inp} />
          </div>

          {error && (
            <div style={{background:C.errorSoft,border:`1px solid #fecaca`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.error,fontWeight:600}}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{...S.btn,opacity:loading?.7:1,marginTop:4}}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}
