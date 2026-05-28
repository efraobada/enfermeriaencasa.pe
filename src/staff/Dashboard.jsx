import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

// ── Palette & shared styles ───────────────────────────────────────────────────
const C = {
  bg:"#f0f4f8", surface:"#ffffff", border:"#d8e1e6",
  text:"#0d2756", muted:"#607089",
  brand:"#3fb8c9", brandDark:"#2ca9bc", brandDeep:"#dbe8ea",
  accent:"#e9b86d", ok:"#22c55e", okSoft:"#f0fdf4",
  warn:"#f59e0b", warnSoft:"#fffbeb",
  err:"#ef4444", errSoft:"#fef2f2",
};
const inp = { width:"100%",padding:"11px 14px",background:"#f8fafc",border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,outline:"none",color:C.text,fontFamily:"inherit",boxSizing:"border-box" };
const btn = (bg="#2f9c95") => ({padding:"10px 18px",background:bg,color:"#fff",fontWeight:700,borderRadius:10,fontSize:13,border:"none",cursor:"pointer",fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:6,transition:"opacity .15s"});

// ── Tiny Icon SVG ─────────────────────────────────────────────────────────────
function Ic({n,s=16,c="currentColor"}){
  const p={width:s,height:s,viewBox:"0 0 24 24",fill:"none",stroke:c,strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};
  const icons={
    user:<><circle cx="12" cy="8" r="3"/><path d="M8 19a4 4 0 0 1 8 0"/></>,
    plus:<><path d="M12 5v14M5 12h14"/></>,
    search:<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></>,
    menu:<><path d="M3 12h18M3 6h18M3 18h18"/></>,
    logout:<><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/></>,
    heart:<><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1A5.5 5.5 0 0 0 3.2 12.4L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/></>,
    activity:<><path d="M3 13h4l2-5 4 9 2-4h6"/></>,
    pill:<><path d="M8 8a4 4 0 0 1 5.7 0l2.3 2.3a4 4 0 0 1-5.7 5.7L8 13.7A4 4 0 0 1 8 8z"/><path d="M10 10l4 4"/></>,
    thermo:<><path d="M14 14.76V4a2 2 0 0 0-4 0v10.76a4 4 0 1 0 4 0z"/></>,
    drop:<><path d="M12 4c3 4 5 6.4 5 9a5 5 0 1 1-10 0c0-2.6 2-5 5-9z"/></>,
    trash:<><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 4 0v2"/></>,
    close:<><path d="M6 6l12 12M18 6L6 18"/></>,
    edit:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2 2 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    check:<><path d="M5 12l4 4 10-10"/></>,
    pin:<><path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2"/></>,
    back:<><path d="M19 12H5M5 12l7-7M5 12l7 7"/></>,
    users:<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  };
  return <svg {...p} aria-hidden="true">{icons[n]||null}</svg>;
}

// ── Vital sign badge ──────────────────────────────────────────────────────────
function Badge({label,value,unit,status}){
  const colors = status==="ok"?[C.ok,"#dcfce7"]:status==="warn"?[C.warn,"#fef3c7"]:[C.err,"#fee2e2"];
  return(
    <div style={{background:colors[1],borderRadius:10,padding:"10px 14px",minWidth:110}}>
      <div style={{fontSize:11,fontWeight:700,color:colors[0],textTransform:"uppercase",letterSpacing:".05em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:20,fontWeight:900,color:C.text,lineHeight:1}}>{value||"—"}<span style={{fontSize:12,fontWeight:600,color:C.muted,marginLeft:3}}>{value?unit:""}</span></div>
    </div>
  );
}

function vitalStatus(key,val){
  const n=Number(val);
  if(isNaN(n)||val===null||val==="") return "none";
  if(key==="sis") return n<90||n>139?"warn":"ok";
  if(key==="dia") return n<60||n>89?"warn":"ok";
  if(key==="temp") return n<36||n>37.5?(n>38.5||n<35?"err":"warn"):"ok";
  if(key==="sat") return n<90?"err":n<95?"warn":"ok";
  return "ok";
}

// ── Format date ───────────────────────────────────────────────────────────────
function fmt(dt){
  if(!dt) return "";
  const d=new Date(dt.replace(" ","T"));
  return d.toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"});
}

// ── Vitals record row ─────────────────────────────────────────────────────────
function VitalRow({item,onDelete,isAdmin}){
  const [conf,setConf]=useState(false);
  return(
    <div style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 20px",marginBottom:10}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#35b5c5,#227a74)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Ic n="user" s={13} c="#fff"/>
            </div>
            <span style={{fontSize:13,fontWeight:800,color:C.text}}>{item.registrado_por}</span>
            {item.tipo_atencion&&<span style={{fontSize:11,fontWeight:700,background:"#e0f7fa",color:"#0e7490",padding:"2px 10px",borderRadius:99,border:"1px solid #a5f3fc"}}>{item.tipo_atencion}</span>}
          </div>
          <div style={{fontSize:11,color:C.muted,fontWeight:600,paddingLeft:36}}>{fmt(item.registrado_en)}</div>
        </div>
        {isAdmin&&(conf
          ?<div style={{display:"flex",gap:6}}>
            <button onClick={onDelete} style={{...btn(C.err),padding:"4px 10px",fontSize:12}}>Eliminar</button>
            <button onClick={()=>setConf(false)} style={{...btn("#94a3b8"),padding:"4px 10px",fontSize:12}}>Cancelar</button>
          </div>
          :<button onClick={()=>setConf(true)} style={{background:"none",border:"none",cursor:"pointer",color:C.muted,padding:4}}><Ic n="trash" s={14}/></button>
        )}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:10}}>
        {(item.presion_sistolica||item.presion_diastolica)&&(
          <Badge label="Presión Art." value={`${item.presion_sistolica||"?"}/${item.presion_diastolica||"?"}`} unit="mmHg" status={vitalStatus("sis",item.presion_sistolica)}/>
        )}
        {item.temperatura!==null&&item.temperatura!==undefined&&(
          <Badge label="Temperatura" value={Number(item.temperatura).toFixed(1)} unit="°C" status={vitalStatus("temp",item.temperatura)}/>
        )}
        {item.saturacion!==null&&item.saturacion!==undefined&&(
          <Badge label="Saturación" value={item.saturacion} unit="%" status={vitalStatus("sat",item.saturacion)}/>
        )}
      </div>
      {item.medicamentos&&<div style={{marginTop:10,padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:13,color:C.text}}><span style={{fontWeight:700,color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:".04em",marginRight:6}}>Medicamentos:</span>{item.medicamentos}</div>}
      {item.observaciones&&<div style={{marginTop:6,fontSize:13,color:C.muted,fontStyle:"italic"}}>"{item.observaciones}"</div>}
    </div>
  );
}

// ── Tipos de atención ─────────────────────────────────────────────────────────
const SVCS=[
  "Aplicación de Inyecciones a Domicilio",
  "Sueros Vitamínicos e Hidratación",
  "Curación Profesional de Heridas",
  "Cuidado del Adulto Mayor",
  "Atención Postoperatoria",
  "Suero para Mal de Altura (Soroche)",
  "Visita Domiciliaria",
];

// ── Add/Edit vitals modal ─────────────────────────────────────────────────────
function todayStr(){ const d=new Date(); return d.toISOString().slice(0,10); }
function nowTimeStr(){ const d=new Date(); return d.toTimeString().slice(0,5); }

function VitalsModal({patientName,onClose,onSave}){
  const [f,setF]=useState({sis:"",dia:"",temp:"",sat:"",meds:"",obs:"",tipo:"",fecha:todayStr(),hora:nowTimeStr()});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setF(s=>({...s,[k]:v}));

  const submit=async e=>{
    e.preventDefault();
    setErr("");
    if(!f.sis&&!f.dia&&!f.temp&&!f.sat&&!f.meds){setErr("Ingrese al menos un signo vital o medicamentos.");return;}
    setSaving(true);
    try{
      await onSave({presion_sistolica:f.sis,presion_diastolica:f.dia,temperatura:f.temp,saturacion:f.sat,medicamentos:f.meds,observaciones:f.obs,tipo_atencion:f.tipo,registered_at:`${f.fecha} ${f.hora}:00`});
      onClose();
    }catch(e){setErr(e.message);}
    finally{setSaving(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,borderRadius:22,width:"100%",maxWidth:480,maxHeight:"92vh",overflowY:"auto",padding:"28px 28px",boxShadow:"0 24px 64px rgba(13,39,86,.22)",animation:"mIn .25s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <h3 style={{fontSize:18,fontWeight:900,color:C.text}}>Registrar Signos Vitales</h3>
            <p style={{fontSize:13,color:C.muted,marginTop:2}}>{patientName}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><Ic n="close" s={18}/></button>
        </div>

        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:16}}>
          {/* Presión arterial */}
          <fieldset style={{border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
            <legend style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",padding:"0 6px"}}><Ic n="heart" s={12} c={C.brand}/> Presión Arterial (mmHg)</legend>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:4}}>Sistólica</label>
                <input type="number" min="60" max="260" placeholder="120" value={f.sis} onChange={e=>set("sis",e.target.value)} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:4}}>Diastólica</label>
                <input type="number" min="40" max="160" placeholder="80" value={f.dia} onChange={e=>set("dia",e.target.value)} style={inp}/>
              </div>
            </div>
          </fieldset>

          {/* Temperatura + Saturación */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <fieldset style={{border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
              <legend style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",padding:"0 6px"}}><Ic n="thermo" s={12} c={C.brand}/> Temperatura (°C)</legend>
              <input type="number" step="0.1" min="34" max="43" placeholder="36.5" value={f.temp} onChange={e=>set("temp",e.target.value)} style={{...inp,marginTop:8}}/>
            </fieldset>
            <fieldset style={{border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px"}}>
              <legend style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",padding:"0 6px"}}><Ic n="drop" s={12} c={C.brand}/> Saturación (%)</legend>
              <input type="number" min="70" max="100" placeholder="98" value={f.sat} onChange={e=>set("sat",e.target.value)} style={{...inp,marginTop:8}}/>
            </fieldset>
          </div>

          {/* Tipo de atención */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:6}}>Tipo de Atención</label>
            <select value={f.tipo} onChange={e=>set("tipo",e.target.value)} style={inp}>
              <option value="">— Seleccionar tipo —</option>
              {SVCS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Medicamentos */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:6}}><Ic n="pill" s={12} c={C.brand}/> Medicamentos</label>
            <textarea value={f.meds} onChange={e=>set("meds",e.target.value)} placeholder="Paracetamol 500mg c/8h, Omeprazol 20mg c/24h..." rows={3} style={{...inp,resize:"vertical",minHeight:72}}/>
          </div>

          {/* Fecha y hora */}
          <fieldset style={{border:`1px solid ${C.brand}`,borderRadius:12,padding:"14px 16px",background:"#f0fdfe"}}>
            <legend style={{fontSize:12,fontWeight:700,color:C.brandDark,textTransform:"uppercase",letterSpacing:".05em",padding:"0 6px"}}>Fecha y hora del registro</legend>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:8}}>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:4}}>Fecha</label>
                <input type="date" value={f.fecha} onChange={e=>set("fecha",e.target.value)} required style={inp}/>
              </div>
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.muted,display:"block",marginBottom:4}}>Hora</label>
                <input type="time" value={f.hora} onChange={e=>set("hora",e.target.value)} required style={inp}/>
              </div>
            </div>
          </fieldset>

          {/* Observaciones */}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:6}}>Observaciones</label>
            <textarea value={f.obs} onChange={e=>set("obs",e.target.value)} placeholder="Estado general del paciente..." rows={2} style={{...inp,resize:"vertical"}}/>
          </div>

          {err&&<div style={{background:C.errSoft,border:`1px solid #fca5a5`,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.err,fontWeight:600}}>{err}</div>}

          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button type="button" onClick={onClose} style={{...btn("#94a3b8")}}>Cancelar</button>
            <button type="submit" disabled={saving} style={{...btn(),opacity:saving?.7:1}}><Ic n="check" s={15} c="#fff"/>{saving?"Guardando...":"Guardar registro"}</button>
          </div>
        </form>
      </div>
      <style>{`@keyframes mIn{from{opacity:0;transform:scale(.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}

// ── Add Patient modal ─────────────────────────────────────────────────────────
const DIST=["Cusco","Wanchaq","Santiago","San Sebastián","San Jerónimo","Saylla"];
function PatientModal({initial,onClose,onSave}){
  const [f,setF]=useState(initial||{nombre:"",edad:"",genero:"",dni:"",telefono:"",direccion:"",distrito:"",diagnostico:"",estado:"activo"});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setF(s=>({...s,[k]:v}));

  const submit=async e=>{
    e.preventDefault();
    if(!f.nombre.trim()){setErr("El nombre es requerido.");return;}
    setSaving(true);
    try{ await onSave(f); onClose(); }
    catch(e){ setErr(e.message); }
    finally{ setSaving(false); }
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,borderRadius:22,width:"100%",maxWidth:460,maxHeight:"92vh",overflowY:"auto",padding:"28px",boxShadow:"0 24px 64px rgba(13,39,86,.22)",animation:"mIn .25s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontSize:18,fontWeight:900,color:C.text}}>{initial?"Editar Paciente":"Nuevo Paciente"}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><Ic n="close" s={18}/></button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Nombre completo *</label>
            <input value={f.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Ej: María García López" required style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Edad</label>
              <input type="number" min="0" max="120" value={f.edad} onChange={e=>set("edad",e.target.value)} placeholder="65" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Género</label>
              <select value={f.genero} onChange={e=>set("genero",e.target.value)} style={inp}>
                <option value="">Sin especificar</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>DNI</label>
              <input value={f.dni} onChange={e=>set("dni",e.target.value)} placeholder="12345678" maxLength={15} style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Estado del paciente</label>
            <select value={f.estado||"activo"} onChange={e=>set("estado",e.target.value)} style={inp}>
              <option value="activo">Activo</option>
              <option value="en_tratamiento">En tratamiento</option>
              <option value="dado_de_alta">Dado de alta</option>
              <option value="derivado">Derivado</option>
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Teléfono</label>
              <input value={f.telefono} onChange={e=>set("telefono",e.target.value)} placeholder="977 000 000" style={inp}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Distrito</label>
              <select value={f.distrito} onChange={e=>set("distrito",e.target.value)} style={inp}>
                <option value="">Seleccionar</option>
                {DIST.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Dirección</label>
            <input value={f.direccion} onChange={e=>set("direccion",e.target.value)} placeholder="Av. El Sol 123" style={inp}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,display:"block",marginBottom:4}}>Diagnóstico / Motivo</label>
            <textarea value={f.diagnostico} onChange={e=>set("diagnostico",e.target.value)} placeholder="Hipertensión arterial, recuperación postoperatoria..." rows={3} style={{...inp,resize:"vertical"}}/>
          </div>
          {err&&<div style={{background:C.errSoft,border:`1px solid #fca5a5`,borderRadius:9,padding:"10px 14px",fontSize:13,color:C.err,fontWeight:600}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button type="button" onClick={onClose} style={btn("#94a3b8")}>Cancelar</button>
            <button type="submit" disabled={saving} style={{...btn(),opacity:saving?.7:1}}><Ic n="check" s={15} c="#fff"/>{saving?"Guardando...":"Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const generoLabel = g => g==="masculino"?"Masculino":g==="femenino"?"Femenino":g==="otro"?"Otro":"—";
const generoIcon  = g => g==="femenino"?"♀":g==="masculino"?"♂":"⚥";

const ESTADOS={
  activo:        {label:"Activo",        bg:"#dcfce7",color:"#15803d"},
  en_tratamiento:{label:"En tratamiento",bg:"#fef9c3",color:"#a16207"},
  dado_de_alta:  {label:"Dado de alta",  bg:"#e0f2fe",color:"#0369a1"},
  derivado:      {label:"Derivado",      bg:"#f3e8ff",color:"#7e22ce"},
};
const estadoBadge = e => {
  const s=ESTADOS[e]||ESTADOS.activo;
  return <span style={{fontSize:11,fontWeight:700,background:s.bg,color:s.color,padding:"2px 10px",borderRadius:99}}>{s.label}</span>;
};

function downloadCSV(patient, vitals) {
  const BOM = "﻿";
  const headers = ["Fecha","Hora","Tipo de Atención","Presión Sistólica","Presión Diastólica","Temperatura (°C)","Saturación O2 (%)","Medicamentos","Observaciones","Registrado por"];
  const rows = vitals.map(v => {
    const dt = v.registrado_en ? new Date(v.registrado_en.replace(" ","T")) : null;
    return [
      dt ? dt.toLocaleDateString("es-PE") : "",
      dt ? dt.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}) : "",
      v.tipo_atencion      || "",
      v.presion_sistolica  || "",
      v.presion_diastolica || "",
      v.temperatura        || "",
      v.saturacion         || "",
      (v.medicamentos  || "").replace(/\n/g," "),
      (v.observaciones || "").replace(/\n/g," "),
      v.registrado_por || "",
    ].map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(",");
  });
  const csv = BOM + [headers.join(","), ...rows].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], {type:"text/csv;charset=utf-8"}));
  a.download = `signos_vitales_${patient.nombre.replace(/\s+/g,"_")}.csv`;
  a.click();
}

function ReportModal({patient, vitals, onClose}) {
  const print = () => {
    const el = document.getElementById('report-content');
    const win = window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reporte ${patient.nombre}</title><style>*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:16px}table{border-collapse:collapse}.no-print{display:none!important}@media print{body{padding:0}.no-print{display:none!important}}</style></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(()=>{ win.print(); },400);
  };
  const gIcon = generoIcon(patient.genero);

  return(
    <div style={{position:"fixed",inset:0,zIndex:400,display:"flex",alignItems:"flex-start",justifyContent:"center",overflowY:"auto",background:"rgba(15,23,42,.7)",backdropFilter:"blur(6px)",padding:"20px 16px"}}>
      <div style={{background:"#fff",borderRadius:20,width:"100%",maxWidth:800,boxShadow:"0 32px 80px rgba(13,39,86,.25)",animation:"mIn .25s ease-out"}} id="report-content">

        {/* Header del reporte */}
        <div style={{background:"linear-gradient(135deg,#0d2756,#2ca9bc)",borderRadius:"20px 20px 0 0",padding:"28px 32px",color:"#fff"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,opacity:.75,textTransform:"uppercase",letterSpacing:".1em",marginBottom:6}}>Reporte de Signos Vitales</div>
              <div style={{fontSize:26,fontWeight:900,lineHeight:1.1}}>{patient.nombre}</div>
              <div style={{display:"flex",flexWrap:"wrap",gap:16,marginTop:10,fontSize:13,opacity:.9}}>
                {patient.edad   && <span>Edad: <b>{patient.edad} años</b></span>}
                {patient.genero && <span>Género: <b>{gIcon} {generoLabel(patient.genero)}</b></span>}
                {patient.dni    && <span>DNI: <b>{patient.dni}</b></span>}
                {patient.distrito && <span>Distrito: <b>{patient.distrito}</b></span>}
              </div>
              {patient.diagnostico && <div style={{marginTop:8,fontSize:13,opacity:.85,fontStyle:"italic"}}>{patient.diagnostico}</div>}
            </div>
            <div style={{textAlign:"right",fontSize:12,opacity:.8}}>
              <div style={{fontWeight:700,fontSize:14}}>Enfermería en Casa</div>
              <div>Cusco, Perú · 977 134 583</div>
              <div style={{marginTop:4}}>Generado: {new Date().toLocaleDateString("es-PE",{day:"2-digit",month:"long",year:"numeric"})}</div>
            </div>
          </div>
        </div>

        {/* Tabla de registros */}
        <div style={{padding:"24px 32px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:800,color:C.text}}>Historial de signos vitales <span style={{color:C.muted,fontWeight:600,fontSize:13}}>({vitals.length} registros)</span></div>
            <div style={{display:"flex",gap:8}} className="no-print">
              <button onClick={()=>downloadCSV(patient,vitals)} style={{...btn("#16a34a"),fontSize:13,padding:"9px 16px"}}>⬇ Descargar CSV</button>
              <button onClick={print} style={{...btn(),fontSize:13,padding:"9px 16px"}}> Imprimir / PDF</button>
              <button onClick={onClose} style={{...btn("#94a3b8"),fontSize:13,padding:"9px 16px"}}>Cerrar</button>
            </div>
          </div>

          {vitals.length===0
            ? <div style={{textAlign:"center",padding:"40px 0",color:C.muted,fontSize:14}}>No hay registros de signos vitales.</div>
            : <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:"#f0f4f8"}}>
                    {["Fecha y Hora","Tipo de Atención","Presión Art.","Temp.","SpO2","Personal","Medicamentos / Observaciones"].map(h=>(
                      <th key={h} style={{padding:"10px 12px",textAlign:"left",fontWeight:800,color:C.text,borderBottom:`2px solid ${C.border}`,whiteSpace:"nowrap",fontSize:12}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vitals.map((v,i)=>{
                    const dt = v.registrado_en ? new Date(v.registrado_en.replace(" ","T")) : null;
                    const pa = (v.presion_sistolica||v.presion_diastolica) ? `${v.presion_sistolica||"?"}/${v.presion_diastolica||"?"} mmHg` : "—";
                    const paSt = vitalStatus("sis",v.presion_sistolica);
                    const tSt  = vitalStatus("temp",v.temperatura);
                    const sSt  = vitalStatus("sat",v.saturacion);
                    const cell = (val,unit,st) => {
                      const color = st==="ok"?C.ok:st==="warn"?C.warn:st==="err"?C.err:C.muted;
                      return <span style={{fontWeight:700,color:val?color:C.muted}}>{val?`${val}${unit}`:"—"}</span>;
                    };
                    return(
                      <tr key={v.id} style={{background:i%2===0?"#fff":"#f8fafc",borderBottom:`1px solid ${C.border}`}}>
                        <td style={{padding:"10px 12px",whiteSpace:"nowrap",color:C.muted,fontSize:12}}>
                          {dt ? <><div style={{fontWeight:700,color:C.text}}>{dt.toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})}</div><div>{dt.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</div></> : "—"}
                        </td>
                        <td style={{padding:"10px 12px",fontSize:12,color:"#0e7490",fontWeight:600,maxWidth:160}}>{v.tipo_atencion||<span style={{color:C.muted}}>—</span>}</td>
                        <td style={{padding:"10px 12px"}}>{cell(pa,"",paSt)}</td>
                        <td style={{padding:"10px 12px"}}>{cell(v.temperatura,"°C",tSt)}</td>
                        <td style={{padding:"10px 12px"}}>{cell(v.saturacion,"%",sSt)}</td>
                        <td style={{padding:"10px 12px",fontSize:12,color:C.text,whiteSpace:"nowrap"}}>{v.registrado_por||"—"}</td>
                        <td style={{padding:"10px 12px",fontSize:12,color:C.muted,maxWidth:220}}>
                          {v.medicamentos && <div><b style={{color:C.text}}>Meds:</b> {v.medicamentos}</div>}
                          {v.observaciones && <div style={{fontStyle:"italic"}}>{v.observaciones}</div>}
                          {!v.medicamentos&&!v.observaciones && "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          }
        </div>

        {/* Footer */}
        <div style={{padding:"16px 32px 24px",borderTop:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:C.muted}}>
          <span>Enfermería en Casa Cusco — enfermeriaencasa.net</span>
          <span>{vitals.length} registro{vitals.length!==1?"s":""} en total</span>
        </div>
      </div>

    </div>
  );
}

// ── Staff member modal (create / edit) ───────────────────────────────────────
function StaffModal({initial,onClose,onSave}){
  const isEdit = !!initial;
  const [f,setF]=useState({
    nombre:   initial?.nombre    || "",
    username: initial?.username  || "",
    rol:      initial?.rol       || "enfermera",
    password: "",
    password2:"",
  });
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setF(s=>({...s,[k]:v}));

  const submit=async e=>{
    e.preventDefault();
    setErr("");
    if(!isEdit){
      if(f.password.length<8){setErr("La contraseña debe tener al menos 8 caracteres.");return;}
      if(f.password!==f.password2){setErr("Las contraseñas no coinciden.");return;}
    }
    if(isEdit && f.password && f.password!==f.password2){setErr("Las contraseñas no coinciden.");return;}
    setSaving(true);
    try{
      const payload={nombre:f.nombre,username:f.username,rol:f.rol};
      if(isEdit) payload.id=initial.id;
      if(f.password) payload.password=f.password;
      await onSave(payload);
      onClose();
    }catch(e){setErr(e.message);}
    finally{setSaving(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,borderRadius:22,width:"100%",maxWidth:420,padding:"28px",boxShadow:"0 24px 64px rgba(13,39,86,.22)",animation:"mIn .25s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <div>
            <h3 style={{fontSize:18,fontWeight:900,color:C.text,margin:0}}>{isEdit?"Editar Personal":"Nuevo Usuario"}</h3>
            <p style={{fontSize:13,color:C.muted,marginTop:2}}>Acceso al panel de enfermería</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><Ic n="close" s={18}/></button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Nombre completo *</label>
            <input value={f.nombre} onChange={e=>set("nombre",e.target.value)} placeholder="Lic. María García" required style={inp}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Usuario *</label>
            <input type="text" value={f.username} onChange={e=>set("username",e.target.value.toLowerCase().replace(/\s/g,""))} placeholder="maria.quispe" required autoComplete="off" style={inp}/>
            <span style={{fontSize:11,color:C.muted,marginTop:3,display:"block"}}>Solo letras, números, punto y guión. Ej: maria.quispe</span>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Rol</label>
            <select value={f.rol} onChange={e=>set("rol",e.target.value)} style={inp}>
              <option value="enfermera">Enfermera / Enfermero</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div style={{borderTop:`1px solid ${C.border}`,paddingTop:14}}>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>
              {isEdit?"Nueva contraseña (dejar vacío para no cambiar)":"Contraseña *"}
            </label>
            <input type="password" value={f.password} onChange={e=>set("password",e.target.value)} placeholder="Mínimo 8 caracteres" required={!isEdit} style={inp}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Confirmar contraseña</label>
            <input type="password" value={f.password2} onChange={e=>set("password2",e.target.value)} placeholder="Repite la contraseña" required={!isEdit&&!!f.password} style={inp}/>
          </div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.err,fontWeight:600}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button type="button" onClick={onClose} style={btn("#94a3b8")}>Cancelar</button>
            <button type="submit" disabled={saving} style={{...btn(),opacity:saving?.7:1}}>
              <Ic n="check" s={15} c="#fff"/>{saving?"Guardando...":isEdit?"Guardar cambios":"Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Staff management panel ────────────────────────────────────────────────────
function StaffPanel(){
  const {authFetch,user:me}=useAuth();
  const [members,setMembers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [err,setErr]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);
    try{
      const r=await authFetch("/api/staff.php");
      const d=await r.json();
      if(d.ok) setMembers(d.items);
    }catch(_){}finally{setLoading(false);}
  },[authFetch]);

  useEffect(()=>{load();},[load]);

  const save=async(payload)=>{
    const method=payload.id?"PUT":"POST";
    const r=await authFetch("/api/staff.php",{method,body:JSON.stringify(payload)});
    const d=await r.json();
    if(!d.ok) throw new Error(d.message);
    load();
  };

  const toggleActivo=async(m)=>{
    setErr("");
    const r=await authFetch("/api/staff.php",{method:"PUT",body:JSON.stringify({id:m.id,activo:m.activo?"0":"1"})});
    const d=await r.json();
    if(!d.ok){setErr(d.message);return;}
    setMembers(ms=>ms.map(x=>x.id===m.id?{...x,activo:m.activo?"0":"1"}:x));
  };

  const rolColor=rol=>rol==="admin"?["#7c3aed","#ede9fe"]:["#2ca9bc","#e0f7fa"];

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:900,color:C.text,margin:0}}>Gestión de Personal</h2>
          <p style={{fontSize:13,color:C.muted,marginTop:4}}>Crea y administra los accesos del personal de enfermería</p>
        </div>
        <button onClick={()=>{setEditing(null);setShowModal(true);}} style={{...btn(),fontSize:13}}>
          <Ic n="plus" s={15} c="#fff"/>Nuevo usuario
        </button>
      </div>

      {err&&<div style={{background:"#fef2f2",border:"1px solid #fca5a5",borderRadius:10,padding:"10px 16px",fontSize:13,color:C.err,fontWeight:600,marginBottom:16}}>{err}</div>}

      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Cargando personal...</div>}

      {!loading&&(
        <div style={{display:"grid",gap:12}}>
          {members.map(m=>{
            const [rc,rbg]=rolColor(m.rol);
            const esYo=m.id===me?.id;
            return(
              <div key={m.id} style={{background:C.surface,borderRadius:14,border:`1px solid ${C.border}`,padding:"16px 20px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap",opacity:m.activo==="0"||m.activo===0?.5:1,transition:"opacity .2s"}}>
                {/* Avatar */}
                <div style={{width:46,height:46,borderRadius:12,background:`linear-gradient(135deg,${rbg},${rc}22)`,border:`1.5px solid ${rc}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18,fontWeight:900,color:rc}}>
                  {m.nombre.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontSize:15,fontWeight:800,color:C.text}}>{m.nombre}</span>
                    {esYo&&<span style={{fontSize:10,fontWeight:700,background:"#e0f7fa",color:C.brandDark,padding:"2px 8px",borderRadius:99,border:`1px solid ${C.brandDark}44`}}>Tú</span>}
                    <span style={{fontSize:11,fontWeight:700,background:rbg,color:rc,padding:"2px 10px",borderRadius:99,textTransform:"capitalize"}}>{m.rol==="admin"?"Administrador":"Enfermera/o"}</span>
                    {(m.activo==="0"||m.activo===0)&&<span style={{fontSize:11,fontWeight:700,background:"#f1f5f9",color:"#94a3b8",padding:"2px 10px",borderRadius:99}}>Inactivo</span>}
                  </div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>@{m.username}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>Creado: {new Date(m.creado_en).toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})}</div>
                </div>
                {/* Actions */}
                {!esYo&&(
                  <div style={{display:"flex",gap:8,flexShrink:0}}>
                    <button onClick={()=>{setEditing(m);setShowModal(true);}} style={{...btn("#f1f5f9"),color:C.muted,padding:"8px 12px",fontSize:12}}>
                      <Ic n="edit" s={13} c={C.muted}/>Editar
                    </button>
                    <button onClick={()=>toggleActivo(m)} style={{...btn(m.activo==="0"||m.activo===0?"#dcfce7":"#fef2f2"),color:m.activo==="0"||m.activo===0?C.ok:C.err,padding:"8px 12px",fontSize:12}}>
                      {m.activo==="0"||m.activo===0?"Activar":"Desactivar"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showModal&&(
        <StaffModal initial={editing} onClose={()=>{setShowModal(false);setEditing(null);}} onSave={save}/>
      )}
    </div>
  );
}

// ── Turnos panel ─────────────────────────────────────────────────────────────
const DIAS=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const ROL_COLOR={admin:["#7c3aed","#ede9fe"],enfermera:[C.brandDark,"#e0f7fa"]};

function mondayOf(date){
  const d=new Date(date);
  const day=d.getDay()||7;
  d.setDate(d.getDate()-day+1);
  return d;
}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d;}
function isoDate(d){return d.toISOString().slice(0,10);}
function fmtTime(t){if(!t)return"";const[h,m]=t.split(":");return `${h}:${m}`;}
function fmtFecha(iso){
  const d=new Date(iso+"T00:00:00");
  return d.toLocaleDateString("es-PE",{weekday:"short",day:"2-digit",month:"short"});
}

function TurnoModal({personal,initial,fecha,onClose,onSave}){
  const [f,setF]=useState({
    personal_id: initial?.personal_id||"",
    fecha:       initial?.fecha||fecha||isoDate(new Date()),
    hora_inicio: initial?.hora_inicio?.slice(0,5)||"08:00",
    hora_fin:    initial?.hora_fin?.slice(0,5)||"16:00",
    notas:       initial?.notas||"",
  });
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setF(s=>({...s,[k]:v}));

  const submit=async e=>{
    e.preventDefault();setErr("");
    setSaving(true);
    try{
      const payload={...f};
      if(initial) payload.id=initial.id;
      await onSave(payload);
      onClose();
    }catch(e){setErr(e.message);}
    finally{setSaving(false);}
  };

  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,borderRadius:22,width:"100%",maxWidth:420,padding:"28px",boxShadow:"0 24px 64px rgba(13,39,86,.22)",animation:"mIn .25s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <h3 style={{fontSize:18,fontWeight:900,color:C.text,margin:0}}>{initial?"Editar turno":"Asignar turno"}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><Ic n="close" s={18}/></button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          {!initial&&(
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Personal *</label>
              <select value={f.personal_id} onChange={e=>set("personal_id",e.target.value)} required style={inp}>
                <option value="">— Seleccionar —</option>
                {personal.map(p=><option key={p.id} value={p.id}>{p.nombre} ({p.rol==="admin"?"Admin":"Enf."})</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Fecha *</label>
            <input type="date" value={f.fecha} onChange={e=>set("fecha",e.target.value)} required style={inp}/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Hora inicio *</label>
              <input type="time" value={f.hora_inicio} onChange={e=>set("hora_inicio",e.target.value)} required style={inp}/>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Hora fin *</label>
              <input type="time" value={f.hora_fin} onChange={e=>set("hora_fin",e.target.value)} required style={inp}/>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Notas</label>
            <input value={f.notas} onChange={e=>set("notas",e.target.value)} placeholder="Turno de guardia, cobertura..." style={inp}/>
          </div>
          {err&&<div style={{background:C.errSoft,border:"1px solid #fca5a5",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.err,fontWeight:600}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button type="button" onClick={onClose} style={btn("#94a3b8")}>Cancelar</button>
            <button type="submit" disabled={saving} style={{...btn(),opacity:saving?.7:1}}><Ic n="check" s={15} c="#fff"/>{saving?"Guardando...":"Guardar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MESES=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function TurnosPanel({isAdmin}){
  const {authFetch}=useAuth();
  const now=new Date();
  const [mes,setMes]=useState(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`);
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);
  const [editing,setEditing]=useState(null);
  const [fechaClick,setFechaClick]=useState(null);
  const [err,setErr]=useState("");

  const load=useCallback(async(m)=>{
    setLoading(true);setErr("");
    try{
      const r=await authFetch(`/api/turnos.php?mes=${m}`);
      const d=await r.json();
      if(d.ok) setData(d); else setErr(d.message);
    }catch(_){setErr("Error al cargar turnos.");}
    finally{setLoading(false);}
  },[authFetch]);

  useEffect(()=>{load(mes);},[mes,load]);

  const mesActual=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  const prevMes=()=>{const[y,m]=mes.split("-").map(Number);const d=new Date(y,m-2,1);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const nextMes=()=>{const[y,m]=mes.split("-").map(Number);const d=new Date(y,m,1);setMes(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};

  const save=async(payload)=>{
    const method=payload.id?"PUT":"POST";
    const r=await authFetch("/api/turnos.php",{method,body:JSON.stringify(payload)});
    const d=await r.json();
    if(!d.ok) throw new Error(d.message);
    load(mes);
  };
  const del=async(id)=>{
    const r=await authFetch("/api/turnos.php",{method:"DELETE",body:JSON.stringify({id})});
    const d=await r.json();
    if(!d.ok){setErr(d.message);return;}
    load(mes);
  };

  // Construir celdas del mes (lunes=0 … domingo=6)
  const [year,month]=mes.split("-").map(Number);
  const primerDia=new Date(year,month-1,1);
  const diasEnMes=new Date(year,month,0).getDate();
  // offset: lunes=0, pero getDay() devuelve 0=dom,1=lun...
  const offset=(primerDia.getDay()+6)%7; // 0=lun
  const totalCeldas=Math.ceil((offset+diasEnMes)/7)*7;

  const porFecha={};
  (data?.turnos||[]).forEach(t=>{
    if(!porFecha[t.fecha]) porFecha[t.fecha]=[];
    porFecha[t.fecha].push(t);
  });

  const hoy=isoDate(new Date());

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:900,color:C.text,margin:0}}>Control de Turnos</h2>
          <p style={{fontSize:13,color:C.muted,marginTop:4}}>Horario mensual del personal de enfermería</p>
        </div>
        {isAdmin&&(
          <button onClick={()=>{setEditing(null);setFechaClick(hoy);setShowModal(true);}} style={{...btn(),fontSize:13}}>
            <Ic n="plus" s={15} c="#fff"/>Asignar turno
          </button>
        )}
      </div>

      {/* Quién está de turno AHORA */}
      {data&&data.ahora.length>0&&(
        <div style={{background:"linear-gradient(135deg,#0d2756,#2ca9bc)",borderRadius:16,padding:"16px 22px",marginBottom:16,color:"#fff"}}>
          <div style={{fontSize:10,fontWeight:700,opacity:.75,textTransform:"uppercase",letterSpacing:".1em",marginBottom:8}}>De turno ahora mismo</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
            {data.ahora.map(t=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:10,background:"rgba(255,255,255,.15)",borderRadius:12,padding:"8px 14px"}}>
                <div style={{width:32,height:32,borderRadius:9,background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:16}}>{t.nombre.charAt(0)}</div>
                <div>
                  <div style={{fontWeight:800,fontSize:13}}>{t.nombre}</div>
                  <div style={{fontSize:11,opacity:.85}}>{fmtTime(t.hora_inicio)} – {fmtTime(t.hora_fin)}</div>
                </div>
                <div style={{width:9,height:9,borderRadius:"50%",background:"#4ade80",boxShadow:"0 0 0 3px rgba(74,222,128,.3)",marginLeft:2}}/>
              </div>
            ))}
          </div>
        </div>
      )}
      {data&&data.ahora.length===0&&(
        <div style={{background:"#f8fafc",border:`1px dashed ${C.border}`,borderRadius:12,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:10,color:C.muted,fontSize:13}}>
          <div style={{width:9,height:9,borderRadius:"50%",background:"#94a3b8",flexShrink:0}}/>
          Sin personal de turno en este momento
        </div>
      )}

      {err&&<div style={{background:C.errSoft,border:"1px solid #fca5a5",borderRadius:10,padding:"10px 16px",fontSize:13,color:C.err,fontWeight:600,marginBottom:12}}>{err}</div>}

      {/* Navegación mes */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,background:C.surface,borderRadius:14,padding:"12px 20px",border:`1px solid ${C.border}`}}>
        <button onClick={prevMes} style={{...btn("#f1f5f9"),color:C.muted,padding:"7px 14px",fontSize:13}}><Ic n="back" s={14} c={C.muted}/></button>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:17,fontWeight:900,color:C.text}}>{MESES[month-1]} {year}</div>
          {mes===mesActual&&<div style={{fontSize:11,color:C.brandDark,fontWeight:700,marginTop:1}}>Mes actual</div>}
        </div>
        <button onClick={nextMes} style={{...btn("#f1f5f9"),color:C.muted,padding:"7px 14px",fontSize:13,transform:"scaleX(-1)"}}><Ic n="back" s={14} c={C.muted}/></button>
      </div>

      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted,fontSize:14}}>Cargando turnos...</div>}

      {/* Calendario mensual */}
      {!loading&&(
        <div style={{background:"#eef1f5",borderRadius:16,border:`1px solid ${C.border}`,padding:6,display:"flex",flexDirection:"column",gap:6}}>
          {/* Cabecera días */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {DIAS.map((d,i)=>(
              <div key={d} style={{padding:"8px 4px",textAlign:"center",fontSize:11,fontWeight:800,color:i>=5?C.brand:C.muted,textTransform:"uppercase",letterSpacing:".06em",background:C.surface,borderRadius:8}}>{d}</div>
            ))}
          </div>
          {/* Celdas */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:6}}>
            {Array.from({length:totalCeldas},(_,i)=>{
              const diaNum=i-offset+1;
              const valid=diaNum>=1&&diaNum<=diasEnMes;
              const fecha=valid?`${year}-${String(month).padStart(2,"0")}-${String(diaNum).padStart(2,"0")}`:null;
              const esHoy=fecha===hoy;
              const turnos=fecha?(porFecha[fecha]||[]):[];
              const col=i%7; // 5=sáb, 6=dom
              const esFinDeSemana=col===5||col===6;
              return(
                <div key={i} style={{
                  minHeight:100,
                  padding:"8px 6px",
                  border: !valid
                    ? `1.5px solid #eef0f3`
                    : esHoy
                      ? `2px solid ${C.brand}`
                      : turnos.length>0
                        ? `2px solid #86efac`
                        : `1.5px solid #dde3e9`,
                  background:!valid?"#fafbfc":esHoy?`${C.brand}14`:turnos.length>0?"#f0fdf4":esFinDeSemana?"#f8fafc":C.surface,
                  borderRadius:10,
                  position:"relative",
                }}>
                  {valid&&(
                    <>
                      {/* Número del día */}
                      <div style={{
                        display:"inline-flex",alignItems:"center",justifyContent:"center",
                        width:26,height:26,borderRadius:"50%",marginBottom:6,
                        background:esHoy?C.brand:turnos.length>0?"#dcfce7":"transparent",
                        color:esHoy?"#fff":turnos.length>0?"#15803d":esFinDeSemana?C.muted:C.text,
                        fontSize:13,fontWeight:esHoy||turnos.length>0?900:700,
                      }}>{diaNum}</div>
                      {/* Turnos */}
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        {turnos.map(t=>{
                          const [rc,rbg]=ROL_COLOR[t.personal_rol]||ROL_COLOR.enfermera;
                          return(
                            <div key={t.id} style={{background:rbg,borderRadius:6,padding:"4px 6px",border:`1px solid ${rc}33`}}>
                              <div style={{fontSize:10,fontWeight:800,color:rc,lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                                {t.personal_nombre.split(" ")[0]}
                              </div>
                              <div style={{fontSize:9,color:rc,opacity:.8}}>{fmtTime(t.hora_inicio)}–{fmtTime(t.hora_fin)}</div>
                              {isAdmin&&(
                                <div style={{display:"flex",gap:4,marginTop:2}}>
                                  <button onClick={()=>{setEditing(t);setShowModal(true);}} style={{background:"none",border:"none",cursor:"pointer",color:rc,padding:0,fontSize:9,fontWeight:700}}>✏</button>
                                  <button onClick={()=>del(t.id)} style={{background:"none",border:"none",cursor:"pointer",color:C.err,padding:0,fontSize:9,fontWeight:700}}>✕</button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {isAdmin&&(
                          <button onClick={()=>{setEditing(null);setFechaClick(fecha);setShowModal(true);}} style={{background:"none",border:`1px dashed ${C.border}`,borderRadius:6,padding:"3px 0",cursor:"pointer",color:C.muted,fontSize:10,width:"100%",marginTop:2}}>+</button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resumen mensual por personal */}
      {!loading&&data&&(
        <div style={{marginTop:16,background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"18px 22px"}}>
          <h3 style={{fontSize:14,fontWeight:900,color:C.text,margin:"0 0 14px"}}>
            Resumen del mes — {MESES[month-1]}
          </h3>
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {(data.personal||[]).map(p=>{
              const misTurnos=(data.turnos||[]).filter(t=>String(t.personal_id)===String(p.id));
              const [rc,rbg]=ROL_COLOR[p.rol]||ROL_COLOR.enfermera;
              return(
                <div key={p.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"10px 0",borderBottom:`1px solid #f0f4f8`}}>
                  <div style={{width:34,height:34,borderRadius:9,background:rbg,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:15,fontWeight:900,color:rc}}>
                    {p.nombre.charAt(0)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:800,color:C.text}}>{p.nombre} <span style={{fontSize:11,color:rc,fontWeight:700}}>({p.rol==="admin"?"Admin":"Enf."})</span></div>
                    {misTurnos.length===0
                      ? <div style={{fontSize:12,color:C.muted,marginTop:2}}>Sin turnos este mes</div>
                      : <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:5}}>
                          {misTurnos.map(t=>{
                            const dNum=new Date(t.fecha+"T00:00:00").getDate();
                            return(
                              <span key={t.id} style={{fontSize:10,fontWeight:700,background:rbg,color:rc,padding:"2px 8px",borderRadius:99,border:`1px solid ${rc}33`}}>
                                {dNum} {fmtTime(t.hora_inicio)}–{fmtTime(t.hora_fin)}
                              </span>
                            );
                          })}
                        </div>
                    }
                  </div>
                  <div style={{fontSize:22,fontWeight:900,color:misTurnos.length>0?C.brandDark:C.border,flexShrink:0,minWidth:28,textAlign:"right"}}>{misTurnos.length}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal&&(
        <TurnoModal
          personal={data?.personal||[]}
          initial={editing}
          fecha={fechaClick}
          onClose={()=>{setShowModal(false);setEditing(null);}}
          onSave={save}
        />
      )}
    </div>
  );
}

// ── Caja / Cobros ─────────────────────────────────────────────────────────────
const METODOS={efectivo:"💵 Efectivo",transferencia:"🏦 Transferencia",yape:"📱 Yape",plin:"📱 Plin",otro:"🔄 Otro"};
const ESTADO_COBRO={
  pagado:   {label:"Pagado",   bg:"#dcfce7",color:"#15803d"},
  pendiente:{label:"Pendiente",bg:"#fef9c3",color:"#a16207"},
  cancelado:{label:"Cancelado",bg:"#fee2e2",color:"#b91c1c"},
};
function fmtMonto(n){ return `S/ ${Number(n).toFixed(2)}`; }

function CobroModal({paciente,onClose,onSave}){
  const [f,setF]=useState({monto:"",metodo_pago:"efectivo",estado:"pagado",tipo_atencion:"",notas:""});
  const [saving,setSaving]=useState(false);
  const [err,setErr]=useState("");
  const set=(k,v)=>setF(s=>({...s,[k]:v}));
  const submit=async e=>{
    e.preventDefault();setErr("");
    if(!f.monto||Number(f.monto)<=0){setErr("Ingrese un monto válido.");return;}
    setSaving(true);
    try{ await onSave({...f,monto:Number(f.monto),paciente_id:paciente.id}); onClose(); }
    catch(e){ setErr(e.message); }
    finally{ setSaving(false); }
  };
  return(
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(6px)"}} onClick={onClose}/>
      <div style={{position:"relative",background:C.surface,borderRadius:22,width:"100%",maxWidth:420,padding:"28px",boxShadow:"0 24px 64px rgba(13,39,86,.22)",animation:"mIn .25s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div>
            <h3 style={{fontSize:18,fontWeight:900,color:C.text,margin:0}}>Registrar Cobro</h3>
            <p style={{fontSize:13,color:C.muted,marginTop:2}}>{paciente.nombre}</p>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.muted}}><Ic n="close" s={18}/></button>
        </div>
        <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Monto (S/) *</label>
            <input type="number" step="0.50" min="0.50" value={f.monto} onChange={e=>set("monto",e.target.value)} placeholder="50.00" required style={{...inp,fontSize:22,fontWeight:900,color:C.text}}/>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Tipo de atención</label>
            <select value={f.tipo_atencion} onChange={e=>set("tipo_atencion",e.target.value)} style={inp}>
              <option value="">— Sin especificar —</option>
              {SVCS.map(s=><option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Método de pago</label>
              <select value={f.metodo_pago} onChange={e=>set("metodo_pago",e.target.value)} style={inp}>
                {Object.entries(METODOS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Estado</label>
              <select value={f.estado} onChange={e=>set("estado",e.target.value)} style={inp}>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
            </div>
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em",display:"block",marginBottom:5}}>Notas</label>
            <input value={f.notas} onChange={e=>set("notas",e.target.value)} placeholder="Detalle adicional..." style={inp}/>
          </div>
          {err&&<div style={{background:C.errSoft,border:"1px solid #fca5a5",borderRadius:9,padding:"10px 14px",fontSize:13,color:C.err,fontWeight:600}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
            <button type="button" onClick={onClose} style={btn("#94a3b8")}>Cancelar</button>
            <button type="submit" disabled={saving} style={{...btn("#16a34a"),opacity:saving?.7:1}}><Ic n="check" s={15} c="#fff"/>{saving?"Guardando...":"Registrar cobro"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CobroRow({item,onEstado,onDelete,isAdmin}){
  const est=ESTADO_COBRO[item.estado]||ESTADO_COBRO.pendiente;
  const dt=item.registrado_en?new Date(item.registrado_en.replace(" ","T")):null;
  return(
    <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:C.surface,borderRadius:12,border:`1px solid ${C.border}`,marginBottom:8,flexWrap:"wrap"}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:16,fontWeight:900,color:C.text}}>{fmtMonto(item.monto)}</span>
          <span style={{fontSize:11,fontWeight:700,background:est.bg,color:est.color,padding:"2px 10px",borderRadius:99}}>{est.label}</span>
          <span style={{fontSize:11,color:C.muted}}>{METODOS[item.metodo_pago]||item.metodo_pago}</span>
        </div>
        {item.tipo_atencion&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{item.tipo_atencion}</div>}
        <div style={{fontSize:11,color:C.muted,marginTop:2}}>
          {item.personal_nombre&&<span>{item.personal_nombre} · </span>}
          {dt&&<span>{dt.toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})} {dt.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</span>}
        </div>
        {item.notas&&<div style={{fontSize:11,color:C.muted,fontStyle:"italic",marginTop:2}}>{item.notas}</div>}
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        {item.estado==="pendiente"&&(
          <button onClick={()=>onEstado(item.id,"pagado")} style={{...btn("#16a34a"),padding:"5px 12px",fontSize:11}}>✓ Cobrado</button>
        )}
        {item.estado==="pagado"&&(
          <button onClick={()=>onEstado(item.id,"pendiente")} style={{...btn("#f1f5f9"),color:C.muted,padding:"5px 12px",fontSize:11}}>↩ Pendiente</button>
        )}
        {isAdmin&&<button onClick={()=>onDelete(item.id)} style={{...btn("#fef2f2"),color:C.err,padding:"5px 10px",fontSize:11}}>✕</button>}
      </div>
    </div>
  );
}

function CajaPanel({isAdmin}){
  const {authFetch}=useAuth();
  const hoy=new Date();
  const [desde,setDesde]=useState(hoy.toISOString().slice(0,8)+"01");
  const [hasta,setHasta]=useState(hoy.toISOString().slice(0,10));
  const [filtroEstado,setFiltroEstado]=useState("");
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");

  const load=useCallback(async()=>{
    setLoading(true);setErr("");
    try{
      const params=new URLSearchParams({desde,hasta});
      if(filtroEstado) params.set("estado",filtroEstado);
      const r=await authFetch(`/api/cobros.php?${params}`);
      const d=await r.json();
      if(d.ok) setData(d); else setErr(d.message);
    }catch(_){setErr("Error al cargar caja.");}
    finally{setLoading(false);}
  },[authFetch,desde,hasta,filtroEstado]);

  useEffect(()=>{load();},[load]);

  const cambiarEstado=async(id,estado)=>{
    await authFetch("/api/cobros.php",{method:"PUT",body:JSON.stringify({id,estado})});
    load();
  };
  const eliminar=async(id)=>{
    if(!confirm("¿Eliminar este cobro?")) return;
    await authFetch("/api/cobros.php",{method:"DELETE",body:JSON.stringify({id})});
    load();
  };

  const r=data?.resumen;
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div>
          <h2 style={{fontSize:22,fontWeight:900,color:C.text,margin:0}}>Caja</h2>
          <p style={{fontSize:13,color:C.muted,marginTop:4}}>Control de cobros y pagos por atención</p>
        </div>
      </div>

      {/* Tarjetas resumen hoy */}
      {data&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12,marginBottom:24}}>
          <div style={{background:"linear-gradient(135deg,#16a34a,#15803d)",borderRadius:16,padding:"18px 20px",color:"#fff"}}>
            <div style={{fontSize:11,fontWeight:700,opacity:.8,textTransform:"uppercase",letterSpacing:".08em"}}>Cobrado hoy</div>
            <div style={{fontSize:28,fontWeight:900,marginTop:6}}>{fmtMonto(data.hoy.pagado)}</div>
          </div>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"18px 20px"}}>
            <div style={{fontSize:11,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".08em"}}>Total período</div>
            <div style={{fontSize:26,fontWeight:900,color:C.text,marginTop:6}}>{fmtMonto(r?.monto_total||0)}</div>
          </div>
          <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:16,padding:"18px 20px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#15803d",textTransform:"uppercase",letterSpacing:".08em"}}>Pagado</div>
            <div style={{fontSize:26,fontWeight:900,color:"#15803d",marginTop:6}}>{fmtMonto(r?.monto_pagado||0)}</div>
          </div>
          <div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:16,padding:"18px 20px"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#a16207",textTransform:"uppercase",letterSpacing:".08em"}}>Pendiente</div>
            <div style={{fontSize:26,fontWeight:900,color:"#a16207",marginTop:6}}>{fmtMonto(r?.monto_pendiente||0)}</div>
          </div>
        </div>
      )}

      {/* Por método de pago */}
      {data?.por_metodo?.length>0&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:14,padding:"16px 20px",marginBottom:20,display:"flex",flexWrap:"wrap",gap:14,alignItems:"center"}}>
          <span style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:".05em"}}>Métodos:</span>
          {data.por_metodo.map(m=>(
            <div key={m.metodo_pago} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:13}}>{METODOS[m.metodo_pago]||m.metodo_pago}</span>
              <span style={{fontSize:13,fontWeight:800,color:C.text}}>{fmtMonto(m.total)}</span>
              <span style={{fontSize:11,color:C.muted}}>({m.cantidad})</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:12,fontWeight:700,color:C.muted}}>Desde</label>
          <input type="date" value={desde} onChange={e=>setDesde(e.target.value)} style={{...inp,width:"auto",padding:"8px 12px"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <label style={{fontSize:12,fontWeight:700,color:C.muted}}>Hasta</label>
          <input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} style={{...inp,width:"auto",padding:"8px 12px"}}/>
        </div>
        <select value={filtroEstado} onChange={e=>setFiltroEstado(e.target.value)} style={{...inp,width:"auto",padding:"8px 12px"}}>
          <option value="">Todos los estados</option>
          <option value="pagado">Pagados</option>
          <option value="pendiente">Pendientes</option>
          <option value="cancelado">Cancelados</option>
        </select>
      </div>

      {err&&<div style={{background:C.errSoft,border:"1px solid #fca5a5",borderRadius:10,padding:"10px 16px",fontSize:13,color:C.err,fontWeight:600,marginBottom:12}}>{err}</div>}
      {loading&&<div style={{textAlign:"center",padding:40,color:C.muted}}>Cargando...</div>}

      {!loading&&data&&(
        data.items.length===0
          ? <div style={{textAlign:"center",padding:"48px 20px",background:C.surface,borderRadius:16,border:`1px dashed ${C.border}`,color:C.muted}}>
              <div style={{fontSize:36,marginBottom:12}}>💰</div>
              <div style={{fontSize:14,fontWeight:600}}>Sin cobros en este período</div>
            </div>
          : data.items.map(item=>(
              <CobroRow key={item.id} item={item} isAdmin={isAdmin} onEstado={cambiarEstado} onDelete={eliminar}/>
            ))
      )}
    </div>
  );
}

// ── Stats / Resumen panel (admin only) ───────────────────────────────────────
const TIPO_COLORS={
  "Aplicación de Inyecciones a Domicilio": "#2f9c95",
  "Sueros Vitamínicos e Hidratación":      "#227a74",
  "Curación Profesional de Heridas":       "#184c61",
  "Cuidado del Adulto Mayor":              "#e9b86d",
  "Atención Postoperatoria":               "#2e6f8e",
  "Suero para Mal de Altura (Soroche)":    "#d97745",
  "Visita Domiciliaria":                   "#7c3aed",
  "Sin especificar":                       "#94a3b8",
};

function StatCard({label,value,sub,color="#2ca9bc",icon}){
  return(
    <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",display:"flex",alignItems:"center",gap:16}}>
      <div style={{width:52,height:52,borderRadius:14,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <span style={{fontSize:24}}>{icon}</span>
      </div>
      <div>
        <div style={{fontSize:32,fontWeight:900,color:C.text,lineHeight:1}}>{value}</div>
        <div style={{fontSize:13,fontWeight:700,color:C.muted,marginTop:4}}>{label}</div>
        {sub&&<div style={{fontSize:11,color:color,fontWeight:700,marginTop:2}}>{sub}</div>}
      </div>
    </div>
  );
}

function MiniBar({label,value,max,color}){
  const pct = max>0 ? Math.round((value/max)*100) : 0;
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <span style={{fontSize:13,color:C.text,fontWeight:600,flex:1,marginRight:8,lineHeight:1.3}}>{label}</span>
        <span style={{fontSize:13,fontWeight:900,color:C.text,flexShrink:0}}>{value}</span>
      </div>
      <div style={{height:8,background:"#f0f4f8",borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${pct}%`,background:color||C.brand,borderRadius:99,transition:"width .6s ease"}}/>
      </div>
    </div>
  );
}

function MiniSpark({data}){
  if(!data||data.length===0) return null;
  const max=Math.max(...data.map(d=>d.total),1);
  const W=340, H=60, pad=4;
  const pts=data.map((d,i)=>{
    const x=pad + (i/(data.length-1||1))*(W-pad*2);
    const y=H-pad - ((d.total/max)*(H-pad*2));
    return `${x},${y}`;
  }).join(" ");
  return(
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{display:"block",overflow:"visible"}}>
      <polyline points={pts} fill="none" stroke={C.brand} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {data.map((d,i)=>{
        const x=pad + (i/(data.length-1||1))*(W-pad*2);
        const y=H-pad - ((d.total/max)*(H-pad*2));
        return <circle key={i} cx={x} cy={y} r="3.5" fill={C.brand}/>;
      })}
    </svg>
  );
}

function StatsPanel(){
  const {authFetch}=useAuth();
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState("");
  const [lastUpdate,setLastUpdate]=useState(null);

  const loadStats = useCallback(()=>{
    authFetch("/api/stats.php")
      .then(r=>r.json())
      .then(d=>{ if(d.ok){setData(d);setLastUpdate(new Date());} else setErr(d.message); })
      .catch(()=>setErr("Error al cargar estadísticas."))
      .finally(()=>setLoading(false));
  },[authFetch]);

  useEffect(()=>{
    loadStats();
    const t=setInterval(loadStats, 5*60*1000);
    return ()=>clearInterval(t);
  },[loadStats]);

  if(loading) return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:15}}>Cargando estadísticas...</div>;
  if(err)     return <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",color:C.err,fontSize:14}}>{err}</div>;

  const {resumen,por_tipo,por_personal,recientes,por_dia}=data;
  const maxTipo = por_tipo.reduce((m,t)=>Math.max(m,t.total),0);
  const maxPers = por_personal.reduce((m,p)=>Math.max(m,p.total),0);

  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px"}}>
      <div style={{marginBottom:24}}>
        <h2 style={{fontSize:22,fontWeight:900,color:C.text,margin:0}}>Resumen de Atenciones</h2>
        <p style={{fontSize:13,color:C.muted,marginTop:4}}>Vista general del servicio — solo visible para administradores{lastUpdate&&<span style={{marginLeft:8,fontSize:11,color:C.brandDark}}>· Actualizado {lastUpdate.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</span>}</p>
      </div>

      {/* Tarjetas principales */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:14,marginBottom:28}}>
        <StatCard label="Pacientes activos"   value={resumen.pacientes}  icon="👤" color="#2ca9bc"/>
        <StatCard label="Atenciones totales"  value={resumen.atenciones} icon="📋" color="#2f9c95"/>
        <StatCard label="Personal activo"     value={resumen.personal}   icon="👩‍⚕️" color="#7c3aed"/>
        <StatCard label="Atenciones hoy"      value={resumen.hoy}        icon="📅" color="#e9b86d" sub={`${resumen.semana} esta semana · ${resumen.mes} este mes`}/>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>

        {/* Por tipo de atención */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
          <h3 style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 18px"}}>Por tipo de atención</h3>
          {por_tipo.length===0
            ? <p style={{color:C.muted,fontSize:13}}>Sin registros aún.</p>
            : por_tipo.map(t=>(
                <MiniBar key={t.tipo} label={t.tipo} value={t.total} max={maxTipo} color={TIPO_COLORS[t.tipo]||C.brand}/>
              ))
          }
        </div>

        {/* Por personal */}
        <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
          <h3 style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 18px"}}>Por personal</h3>
          {por_personal.map(p=>(
            <div key={p.nombre} style={{marginBottom:14}}>
              <MiniBar label={`${p.nombre} (${p.rol==="admin"?"Admin":"Enf."})`} value={p.total} max={maxPers||1} color={p.rol==="admin"?"#7c3aed":C.brand}/>
              {p.ultima_atencion&&<div style={{fontSize:11,color:C.muted,marginTop:-8,marginBottom:4}}>Última: {new Date(p.ultima_atencion.replace(" ","T")).toLocaleDateString("es-PE",{day:"2-digit",month:"short",year:"numeric"})}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Gráfico de actividad 14 días */}
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <h3 style={{fontSize:15,fontWeight:900,color:C.text,margin:0}}>Actividad — últimos 14 días</h3>
          <span style={{fontSize:12,color:C.muted}}>{por_dia.reduce((s,d)=>s+d.total,0)} atenciones</span>
        </div>
        {por_dia.length===0
          ? <p style={{color:C.muted,fontSize:13}}>Sin registros en este período.</p>
          : <>
              <MiniSpark data={por_dia}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:10,color:C.muted}}>
                <span>{por_dia[0]?.dia}</span>
                <span>{por_dia[por_dia.length-1]?.dia}</span>
              </div>
            </>
        }
      </div>

      {/* Actividad reciente */}
      <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px"}}>
        <h3 style={{fontSize:15,fontWeight:900,color:C.text,margin:"0 0 16px"}}>Últimas atenciones</h3>
        {recientes.length===0
          ? <p style={{color:C.muted,fontSize:13}}>Sin registros aún.</p>
          : <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["Fecha","Paciente","Tipo","Personal"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontWeight:800,color:C.muted,fontSize:11,textTransform:"uppercase",letterSpacing:".05em",borderBottom:`1px solid ${C.border}`}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recientes.map(r=>{
                  const dt=r.registrado_en?new Date(r.registrado_en.replace(" ","T")):null;
                  const color=TIPO_COLORS[r.tipo_atencion]||C.muted;
                  return(
                    <tr key={r.id} style={{borderBottom:`1px solid #f0f4f8`}}>
                      <td style={{padding:"9px 12px",color:C.muted,whiteSpace:"nowrap",fontSize:12}}>
                        {dt?<><div style={{fontWeight:700,color:C.text}}>{dt.toLocaleDateString("es-PE",{day:"2-digit",month:"short"})}</div><div>{dt.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</div></>:"—"}
                      </td>
                      <td style={{padding:"9px 12px",fontWeight:700,color:C.text}}>{r.paciente}</td>
                      <td style={{padding:"9px 12px"}}>
                        {r.tipo_atencion
                          ? <span style={{fontSize:11,fontWeight:700,background:`${color}18`,color,padding:"2px 10px",borderRadius:99,whiteSpace:"nowrap"}}>{r.tipo_atencion}</span>
                          : <span style={{color:C.muted,fontSize:12}}>—</span>}
                      </td>
                      <td style={{padding:"9px 12px",color:C.muted,fontSize:12}}>{r.personal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
        }
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, logout, authFetch } = useAuth();

  const [vista, setVista]                 = useState("pacientes"); // "pacientes" | "personal" | "stats"
  const [patients, setPatients]           = useState([]);
  const [selected, setSelected]           = useState(null);
  const [vitals, setVitals]               = useState([]);
  const [search, setSearch]               = useState("");
  const [loadingP, setLoadingP]           = useState(false);
  const [loadingV, setLoadingV]           = useState(false);
  const [showVitalsModal, setShowVitals]  = useState(false);
  const [showPatModal, setShowPat]        = useState(false);
  const [showReport, setShowReport]       = useState(false);
  const [showCobro, setShowCobro]         = useState(false);
  const [cobros, setCobros]               = useState([]);
  const [editingPat, setEditingPat]       = useState(null);
  const [sideOpen, setSideOpen]           = useState(false);

  const isAdmin = user?.rol === "admin";
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Load patients
  const loadPatients = useCallback(async (q="") => {
    setLoadingP(true);
    try {
      const r = await authFetch(`/api/patients.php?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      if (d.ok) setPatients(d.items);
    } catch(_) {}
    finally { setLoadingP(false); }
  }, [authFetch]);

  useEffect(() => { loadPatients(); }, [loadPatients]);
  useEffect(() => {
    const t = setTimeout(() => loadPatients(search), 280);
    return () => clearTimeout(t);
  }, [search, loadPatients]);

  // Load vitals for selected patient
  const loadVitals = useCallback(async (pid) => {
    setLoadingV(true);
    try {
      const r = await authFetch(`/api/vitals.php?patient_id=${pid}`);
      const d = await r.json();
      if (d.ok) setVitals(d.items);
    } catch(_) {}
    finally { setLoadingV(false); }
  }, [authFetch]);

  const loadCobros = useCallback(async (pid) => {
    try {
      const r = await authFetch(`/api/cobros.php?paciente_id=${pid}`);
      const d = await r.json();
      if (d.ok) setCobros(d.items);
    } catch(_) {}
  }, [authFetch]);

  const selectPatient = (p) => { setSelected(p); loadVitals(p.id); loadCobros(p.id); setSideOpen(false); };

  // Auto-open sidebar on mobile when no patient is selected
  useEffect(() => {
    const mq = window.matchMedia("(max-width:860px)");
    if (mq.matches && !selected && vista === "pacientes") setSideOpen(true);
  }, [selected, vista]);

  // Save vital signs
  const saveVitals = async (data) => {
    const r = await authFetch("/api/vitals.php", { method:"POST", body: JSON.stringify({ patient_id: selected.id, ...data }) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.message);
    setVitals(v => [d.item, ...v]);
  };

  // Save patient
  const savePatient = async (data) => {
    if (editingPat) {
      const r = await authFetch("/api/patients.php", { method:"PUT", body: JSON.stringify({ id: editingPat.id, ...data }) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setPatients(ps => ps.map(p => p.id===editingPat.id ? {...p,...data} : p));
      if (selected?.id===editingPat.id) setSelected(s=>({...s,...data}));
    } else {
      const r = await authFetch("/api/patients.php", { method:"POST", body: JSON.stringify(data) });
      const d = await r.json();
      if (!d.ok) throw new Error(d.message);
      setPatients(ps => [d.patient, ...ps]);
    }
  };

  const deleteVital = async (id) => {
    const r = await authFetch("/api/vitals.php", { method:"DELETE", body: JSON.stringify({ id }) });
    const d = await r.json();
    if (!d.ok) throw new Error(d.message);
    setVitals(vs => vs.filter(v => v.id !== id));
  };

  return (
    <div style={{minHeight:"100vh",width:"100%",background:C.bg,fontFamily:"'Nunito Sans',system-ui,sans-serif",display:"flex",flexDirection:"column",overflowX:"hidden"}}>
      {/* Top bar */}
      <header style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:100,boxShadow:"0 4px 20px rgba(13,39,86,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          {vista==="pacientes"&&<button onClick={()=>setSideOpen(o=>!o)} style={{display:"none",background:"none",border:"none",cursor:"pointer",color:C.text,padding:"4px 8px",borderRadius:8,gap:6,alignItems:"center",fontSize:13,fontWeight:700}} className="mob-ham"><Ic n="menu" s={22} c={C.text}/><span>Pacientes</span></button>}
          <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
            <div style={{width:38,height:38,borderRadius:10,overflow:"hidden",border:`1px solid ${C.border}`}}>
              <img src="/logobotica.png" alt="Logo" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
            </div>
          </a>
          <div>
            <div style={{fontSize:15,fontWeight:900,color:C.text,lineHeight:1,letterSpacing:"-.03em"}}>Panel de Enfermería</div>
            <div style={{fontSize:11,fontWeight:600,color:C.brandDark,marginTop:2}}>Enfermería en Casa · Cusco</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{textAlign:"right",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#35b5c5,#227a74)",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Ic n="user" s={16} c="#fff"/>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}} className="usr-info">
              <span style={{fontSize:13,fontWeight:800,color:C.text,lineHeight:1}}>{user?.nombre}</span>
              <span style={{fontSize:11,color:C.muted,textTransform:"capitalize"}}>{user?.rol}</span>
            </div>
          </div>
          <div className="desk-nav" style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={()=>setVista("pacientes")} style={{...btn(vista==="pacientes"?"linear-gradient(135deg,#2ca9bc,#0d2756)":"#f1f5f9"),color:vista==="pacientes"?"#fff":C.muted,padding:"8px 14px",fontSize:13}}>
              <Ic n="user" s={14} c={vista==="pacientes"?"#fff":C.muted}/>
              Pacientes
            </button>
            <button onClick={()=>setVista(v=>v==="caja"?"pacientes":"caja")} style={{...btn(vista==="caja"?"linear-gradient(135deg,#16a34a,#15803d)":"#f1f5f9"),color:vista==="caja"?"#fff":C.muted,padding:"8px 14px",fontSize:13}}>
              <span style={{fontSize:14,lineHeight:1}}>💰</span>
              Caja
            </button>
            {isAdmin&&(<>
              <button onClick={()=>setVista(v=>v==="stats"?"pacientes":"stats")} style={{...btn(vista==="stats"?"linear-gradient(135deg,#2f9c95,#184c61)":"#f1f5f9"),color:vista==="stats"?"#fff":C.muted,padding:"8px 14px",fontSize:13}}>
                <Ic n="activity" s={14} c={vista==="stats"?"#fff":C.muted}/>
                Dashboard
              </button>
              <button onClick={()=>setVista(v=>v==="turnos"?"pacientes":"turnos")} style={{...btn(vista==="turnos"?"linear-gradient(135deg,#e9b86d,#d97745)":"#f1f5f9"),color:vista==="turnos"?"#fff":C.muted,padding:"8px 14px",fontSize:13}}>
                <Ic n="check" s={14} c={vista==="turnos"?"#fff":C.muted}/>
                Turnos
              </button>
              <button onClick={()=>setVista(v=>v==="personal"?"pacientes":"personal")} style={{...btn(vista==="personal"?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#f1f5f9"),color:vista==="personal"?"#fff":C.muted,padding:"8px 14px",fontSize:13}}>
                <Ic n="users" s={14} c={vista==="personal"?"#fff":C.muted}/>
                Personal
              </button>
            </>)}
            <button onClick={()=>setConfirmLogout(true)} style={{...btn("#f1f5f9"),color:C.muted,padding:"8px 14px",fontSize:13}}>
              <Ic n="logout" s={14} c={C.muted}/>
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Mobile tab bar */}
      <nav className="mob-tabs" style={{display:"none",background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:"auto",flexShrink:0}}>
        <div style={{display:"flex",gap:6,padding:"8px 12px",minWidth:"max-content"}}>
          <button onClick={()=>setVista("pacientes")} style={{...btn(vista==="pacientes"?"linear-gradient(135deg,#2ca9bc,#0d2756)":"#f1f5f9"),color:vista==="pacientes"?"#fff":C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
            <Ic n="user" s={14} c={vista==="pacientes"?"#fff":C.muted}/>Pacientes
          </button>
          <button onClick={()=>setVista("caja")} style={{...btn(vista==="caja"?"linear-gradient(135deg,#16a34a,#15803d)":"#f1f5f9"),color:vista==="caja"?"#fff":C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
            <span style={{fontSize:14,lineHeight:1}}>💰</span>Caja
          </button>
          {isAdmin&&<>
            <button onClick={()=>setVista("stats")} style={{...btn(vista==="stats"?"linear-gradient(135deg,#2f9c95,#184c61)":"#f1f5f9"),color:vista==="stats"?"#fff":C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
              <Ic n="activity" s={14} c={vista==="stats"?"#fff":C.muted}/>Dashboard
            </button>
            <button onClick={()=>setVista("turnos")} style={{...btn(vista==="turnos"?"linear-gradient(135deg,#e9b86d,#d97745)":"#f1f5f9"),color:vista==="turnos"?"#fff":C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
              <Ic n="check" s={14} c={vista==="turnos"?"#fff":C.muted}/>Turnos
            </button>
            <button onClick={()=>setVista("personal")} style={{...btn(vista==="personal"?"linear-gradient(135deg,#7c3aed,#6d28d9)":"#f1f5f9"),color:vista==="personal"?"#fff":C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
              <Ic n="users" s={14} c={vista==="personal"?"#fff":C.muted}/>Personal
            </button>
          </>}
          <button onClick={()=>setConfirmLogout(true)} style={{...btn("#f1f5f9"),color:C.muted,padding:"8px 14px",fontSize:13,whiteSpace:"nowrap"}}>
            <Ic n="logout" s={14} c={C.muted}/>Salir
          </button>
        </div>
      </nav>

      <div style={{display:"flex",flex:1,overflow:"hidden",width:"100%",minWidth:0}}>
        {vista==="personal"&&isAdmin&&<StaffPanel/>}
        {vista==="stats"&&isAdmin&&<StatsPanel/>}
        {vista==="turnos"&&<TurnosPanel isAdmin={isAdmin}/>}
        {vista==="caja"&&<CajaPanel isAdmin={isAdmin}/>}
        {/* Overlay to close sidebar on mobile */}
        {sideOpen&&<div onClick={()=>setSideOpen(false)} className="mob-overlay" style={{display:"none",position:"fixed",inset:0,zIndex:89,background:"rgba(13,39,86,.35)"}}/>}
        {/* Sidebar — patient list */}
        <aside className={`dash-side${sideOpen?" side-open":""}`} style={{width:280,background:C.surface,borderRight:`1px solid ${C.border}`,display:vista==="personal"||vista==="stats"||vista==="turnos"||vista==="caja"?"none":"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
          <div style={{padding:"16px 14px 10px",position:"sticky",top:0,background:C.surface,zIndex:10,borderBottom:`1px solid ${C.border}`}}>
            <div style={{position:"relative",marginBottom:10}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic n="search" s={14} c={C.muted}/></span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar paciente..." style={{...inp,paddingLeft:32,fontSize:13}}/>
            </div>
            <button onClick={()=>{setEditingPat(null);setShowPat(true);}} style={{...btn(),width:"100%",justifyContent:"center",fontSize:13}}>
              <Ic n="plus" s={15} c="#fff"/>Agregar paciente
            </button>
          </div>

          <div style={{flex:1,overflowY:"auto",padding:"8px 8px"}}>
            {loadingP && <div style={{textAlign:"center",padding:24,color:C.muted,fontSize:13}}>Cargando...</div>}
            {!loadingP && patients.length===0 && (
              <div style={{textAlign:"center",padding:32,color:C.muted,fontSize:13}}>
                <Ic n="user" s={28} c={C.border}/><br/>
                <span style={{display:"block",marginTop:10}}>No hay pacientes aún</span>
              </div>
            )}
            {patients.map(p=>(
              <button key={p.id} onClick={()=>selectPatient(p)} style={{width:"100%",textAlign:"left",padding:"12px 12px",borderRadius:12,border:`1px solid ${selected?.id===p.id?C.brand:C.border}`,background:selected?.id===p.id?"#eef9fb":C.surface,cursor:"pointer",marginBottom:6,transition:"all .15s",fontFamily:"inherit"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:36,height:36,borderRadius:10,background:selected?.id===p.id?"linear-gradient(135deg,#35b5c5,#227a74)":"#f0f4f8",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Ic n="user" s={16} c={selected?.id===p.id?"#fff":C.muted}/>
                  </div>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.text,lineHeight:1.2}}>{p.nombre}</div>
                    <div style={{fontSize:11,color:C.muted,marginTop:3}}>{p.edad?""+p.edad+" años · ":""}{p.distrito||"Sin distrito"}</div>
                    <div style={{marginTop:4}}>{estadoBadge(p.estado)}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        {vista==="pacientes"&&<main style={{flex:1,overflowY:"auto",padding:"24px 24px"}}>
          {!selected ? (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:16,opacity:.6}}>
              <Ic n="activity" s={56} c={C.border}/>
              <div style={{fontSize:18,fontWeight:700,color:C.muted}}>Seleccione un paciente</div>
              <div style={{fontSize:13,color:C.muted}}>Haga clic en un nombre de la lista para ver su historial</div>
            </div>
          ) : (
            <>
              {/* Patient header */}
              <div style={{background:C.surface,borderRadius:16,border:`1px solid ${C.border}`,padding:"20px 24px",marginBottom:20,display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#35b5c5,#227a74)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Ic n="user" s={24} c="#fff"/>
                  </div>
                  <div>
                    <h2 style={{fontSize:20,fontWeight:900,color:C.text,margin:0}}>{selected.nombre}</h2>
                    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:6}}>
                      {selected.edad&&<span style={{fontSize:12,color:C.muted,fontWeight:600}}>{selected.edad} años</span>}
                      {selected.genero&&<span style={{fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:99,background:selected.genero==="femenino"?"#fce7f3":selected.genero==="masculino"?"#e0f2fe":"#f3f4f6",color:selected.genero==="femenino"?"#be185d":selected.genero==="masculino"?"#0369a1":"#6b7280"}}>{generoIcon(selected.genero)} {generoLabel(selected.genero)}</span>}
                      {selected.distrito&&<span style={{fontSize:12,color:C.muted,fontWeight:600,display:"inline-flex",alignItems:"center",gap:4}}><Ic n="pin" s={11} c={C.muted}/>{selected.distrito}</span>}
                      {selected.telefono&&<span style={{fontSize:12,color:C.muted,fontWeight:600}}>{selected.telefono}</span>}
                      {selected.dni&&<span style={{fontSize:12,color:C.muted,fontWeight:600}}>DNI: {selected.dni}</span>}
                      {estadoBadge(selected.estado)}
                    </div>
                    {selected.diagnostico&&<div style={{fontSize:13,color:C.text,marginTop:6,fontStyle:"italic",opacity:.8}}>{selected.diagnostico}</div>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {isAdmin&&<button onClick={()=>{setEditingPat(selected);setShowPat(true);}} style={{...btn("#f1f5f9"),color:C.muted,fontSize:12}}><Ic n="edit" s={13} c={C.muted}/>Editar</button>}
                  <button onClick={()=>setShowCobro(true)} style={{...btn("#16a34a"),fontSize:13}}>💰 Cobro</button>
                  <button onClick={()=>setShowReport(true)} style={{...btn("#0369a1"),fontSize:13}}> Reporte</button>
                  <button onClick={()=>setShowVitals(true)} style={{...btn(),fontSize:13}}><Ic n="plus" s={15} c="#fff"/>Registrar signos</button>
                </div>
              </div>

              {/* Vitals history */}
              <div style={{marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <h3 style={{fontSize:15,fontWeight:800,color:C.text,margin:0}}>Historial de signos vitales</h3>
                <span style={{fontSize:12,color:C.muted}}>{vitals.length} registro{vitals.length!==1?"s":""}</span>
              </div>

              {loadingV && <div style={{textAlign:"center",padding:32,color:C.muted,fontSize:13}}>Cargando historial...</div>}
              {!loadingV && vitals.length===0 && (
                <div style={{textAlign:"center",padding:"48px 20px",background:C.surface,borderRadius:16,border:`1px dashed ${C.border}`,color:C.muted}}>
                  <Ic n="activity" s={36} c={C.border}/><br/>
                  <div style={{marginTop:12,fontSize:14,fontWeight:600}}>Sin registros aún</div>
                  <div style={{fontSize:12,marginTop:6}}>Use el botón "Registrar signos" para agregar el primer registro</div>
                </div>
              )}
              {vitals.map(v=>(
                <VitalRow key={v.id} item={v} isAdmin={isAdmin} onDelete={()=>deleteVital(v.id)}/>
              ))}

              {/* Cobros del paciente */}
              {cobros.length>0&&(
                <div style={{marginTop:28}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <h3 style={{fontSize:15,fontWeight:800,color:C.text,margin:0}}>Cobros</h3>
                    <div style={{display:"flex",gap:10,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#15803d",fontWeight:700}}>
                        Pagado: {fmtMonto(cobros.filter(c=>c.estado==="pagado").reduce((s,c)=>s+Number(c.monto),0))}
                      </span>
                      {cobros.some(c=>c.estado==="pendiente")&&(
                        <span style={{fontSize:12,color:"#a16207",fontWeight:700}}>
                          Pendiente: {fmtMonto(cobros.filter(c=>c.estado==="pendiente").reduce((s,c)=>s+Number(c.monto),0))}
                        </span>
                      )}
                    </div>
                  </div>
                  {cobros.map(c=>(
                    <CobroRow key={c.id} item={c} isAdmin={isAdmin}
                      onEstado={async(id,estado)=>{
                        await authFetch("/api/cobros.php",{method:"PUT",body:JSON.stringify({id,estado})});
                        loadCobros(selected.id);
                      }}
                      onDelete={async(id)=>{
                        await authFetch("/api/cobros.php",{method:"DELETE",body:JSON.stringify({id})});
                        loadCobros(selected.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </main>}
      </div>

      {/* Modals */}
      {showReport && selected && (
        <ReportModal patient={selected} vitals={vitals} onClose={()=>setShowReport(false)}/>
      )}
      {showVitalsModal && selected && (
        <VitalsModal patientName={selected.nombre} onClose={()=>setShowVitals(false)} onSave={saveVitals}/>
      )}
      {showCobro && selected && (
        <CobroModal paciente={selected} onClose={()=>setShowCobro(false)} onSave={async(data)=>{
          const r=await authFetch("/api/cobros.php",{method:"POST",body:JSON.stringify(data)});
          const d=await r.json();
          if(!d.ok) throw new Error(d.message);
          loadCobros(selected.id);
        }}/>
      )}
      {showPatModal && (
        <PatientModal initial={editingPat||null} onClose={()=>{setShowPat(false);setEditingPat(null);}} onSave={savePatient}/>
      )}

      {/* Confirmar logout */}
      {confirmLogout&&(
        <div style={{position:"fixed",inset:0,zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(15,23,42,.5)",backdropFilter:"blur(4px)"}}>
          <div style={{background:C.surface,borderRadius:20,padding:"32px 36px",maxWidth:360,width:"100%",boxShadow:"0 24px 64px rgba(13,39,86,.2)",textAlign:"center",animation:"mIn .2s ease-out"}}>
            <div style={{fontSize:36,marginBottom:12}}>👋</div>
            <h3 style={{fontSize:18,fontWeight:900,color:C.text,margin:"0 0 8px"}}>¿Cerrar sesión?</h3>
            <p style={{fontSize:13,color:C.muted,margin:"0 0 24px"}}>Se cerrará tu sesión como <strong>{user?.nombre}</strong>.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmLogout(false)} style={{...btn("#f1f5f9"),color:C.muted,padding:"10px 24px"}}>Cancelar</button>
              <button onClick={logout} style={{...btn(C.err),padding:"10px 24px"}}>Sí, salir</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        body{margin:0;overflow-x:hidden}
        .dash-side{transition:transform .25s}
        .mob-tabs{scrollbar-width:none}
        .mob-tabs::-webkit-scrollbar{display:none}
        @media(max-width:860px){
          .dash-side{position:fixed;left:0;top:112px;bottom:0;z-index:90;transform:translateX(-100%);box-shadow:4px 0 24px rgba(13,39,86,.12);width:min(300px,85vw) !important}
          .dash-side.side-open{transform:translateX(0)}
          .mob-ham{display:flex !important}
          .mob-overlay{display:block !important}
          .mob-tabs{display:flex !important}
          .desk-nav{display:none !important}
          .usr-info{display:none !important}
        }
      `}</style>
    </div>
  );
}
