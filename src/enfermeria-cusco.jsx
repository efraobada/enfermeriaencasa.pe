import { useState, useEffect, useRef } from "react";

const C = {
  bg: "#f5f7f8",
  surface: "#ffffff",
  surfaceSoft: "#eef4f6",
  line: "#d8e1e6",
  text: "#0d2756",
  muted: "#607089",
  brand: "#3fb8c9",
  brandDark: "#2ca9bc",
  brandDeep: "#dbe8ea",
  brandDeep2: "#f3f8f8",
  brandTint: "#ecf9fb",
  accent: "#e9b86d",
  accentSoft: "#fff4de",
  success: "#3fb8c9",
  successSoft: "#edf9fb",
};

const WA = "51977134583";
const WA_DISPLAY = "977134583";
const WAM = encodeURIComponent("Hola, deseo solicitar información sobre el servicio de enfermería en casa en Cusco.");
const TESTIMONIALS_API = "/api/testimonials.php";
const ENABLE_CHAT_TEASER_ANIMATION = true;
const buildAppointmentMessage = f => encodeURIComponent([
  "Hola, deseo agendar una atención de enfermería en casa.",
  "",
  `Nombre: ${f.nombre}`,
  `Teléfono: ${f.telefono}`,
  `Distrito: ${f.distrito}`,
  `Dirección: ${f.direccion}`,
  `Servicio: ${f.servicio}`,
  `Fecha: ${f.fecha}`,
  `Hora: ${f.hora}`,
].join("\n"));
const DIST = ["Cusco","Wanchaq","Santiago","San Sebastián","San Jerónimo","Saylla"];
const SVCS = [
  {id:1,em:"syringe",t:"Aplicación de Inyecciones a Domicilio",d:"Brindamos aplicación segura de inyecciones intramusculares, subcutáneas e intravenosas en la comodidad de su hogar. Nuestro personal de enfermería sigue estrictos protocolos de bioseguridad y utiliza material estéril para garantizar un procedimiento seguro y confiable. Este servicio es ideal para pacientes que requieren tratamiento médico con receta y desean evitar desplazamientos innecesarios.",cl:"#2f9c95"},
  {id:2,em:"drop",t:"Sueros Vitamínicos e Hidratación",d:"Ofrecemos aplicación de sueros intravenosos con vitaminas y soluciones hidratantes para mejorar el bienestar general, favorecer la recuperación física y combatir la deshidratación. Este servicio es útil para personas con fatiga, debilidad o que requieren apoyo en su recuperación, siempre realizado por personal de enfermería capacitado.",cl:"#227a74"},
  {id:3,em:"bandage",t:"Curación Profesional de Heridas",d:"Realizamos curación de heridas quirúrgicas, lesiones y úlceras por presión, aplicando técnicas de limpieza, desinfección y cambio de apósitos para promover una adecuada cicatrización. Nuestro servicio ayuda a prevenir infecciones y asegura un seguimiento adecuado del proceso de recuperación del paciente.",cl:"#184c61"},
  {id:4,em:"elder",t:"Cuidado del Adulto Mayor",d:"Brindamos atención especializada para adultos mayores en su domicilio, enfocada en el monitoreo de su estado de salud, administración de medicamentos y acompañamiento profesional. Nuestro objetivo es mejorar la calidad de vida del paciente, brindando cuidado humano, respeto y apoyo tanto al paciente como a su familia.",cl:"#e9b86d"},
  {id:5,em:"cross",t:"Atención Postoperatoria",d:"Ofrecemos cuidados de enfermería para pacientes que se encuentran en proceso de recuperación después de una cirugía. El servicio incluye control de signos vitales, curación de heridas, administración de medicamentos y seguimiento del estado general del paciente, contribuyendo a una recuperación segura y adecuada en casa.",cl:"#2e6f8e"},
  {id:6,em:"alert",t:"Suero para Mal de Altura (Soroche)",d:"Atendemos a pacientes que presentan síntomas de mal de altura o soroche, frecuentes en visitantes que llegan a Cusco. Aplicamos sueros intravenosos para mejorar la hidratación y aliviar molestias como dolor de cabeza, náuseas, mareos y fatiga. El servicio puede realizarse en hoteles, hospedajes o domicilios, permitiendo una recuperación más rápida y segura.",cl:"#d97745"},
];
const FAQS = [
  {q:"¿Qué tipo de personal realiza la atención?",a:"Personal de enfermeria titulados, colegiados, con especialización y experiencia en atención domiciliaria."},
  {q:"¿Puedo agendar por WhatsApp?",a:"Sí. Escríbanos al 977134583 para coordinar la fecha, la hora y el tipo de atención que necesita."},
  {q:"¿Atienden emergencias?",a:"Sí. Brindamos atención urgente para aplicación de medicamentos, sueros, control de crisis y evaluación de signos de alarma."},
  {q:"¿Qué medidas de bioseguridad utilizan?",a:"Lavado de manos, uso de guantes, desinfección de insumos y manejo seguro de residuos."},
  {q:"¿Pueden estar presentes los familiares?",a:"Sí, es recomendable, especialmente si se trata de menores, adultos mayores o pacientes que requieren apoyo."},
  {q:"¿Cómo sé si su cobertura llega a mi zona?",a:"Envíenos su dirección por WhatsApp y le confirmaremos la cobertura en pocos minutos."},
  {q:"¿Atienden a adultos mayores que viven solos?",a:"Sí. Ofrecemos monitoreo clínico, control de medicamentos, acompañamiento y apoyo emocional."},
];
const TESTS = [
  {n:"Maria C.",di:"Wanchaq",tx:"El trato fue muy cálido y profesional. La enfermera fue atenta y nos explicó cada paso con mucha claridad. 100% recomendado.",r:5},
  {n:"Carlos R.",di:"Cusco",tx:"Atención postoperatoria excelente para mi padre. Puntuales, amables y con todos los protocolos.",r:5},
  {n:"Ana L.",di:"San Sebastián",tx:"Mi abuelita necesitaba control diario. Las enfermeras son como familia, siempre con cariño.",r:5},
];

function useVis(th=0.1){const r=useRef(null);const[v,s]=useState(false);useEffect(()=>{const e=r.current;if(!e)return;const o=new IntersectionObserver(([x])=>{if(x.isIntersecting){s(true);o.disconnect()}},{threshold:th});o.observe(e);return()=>o.disconnect()},[]);return[r,v]}
function F({children,delay=0,className=""}){const[r,v]=useVis();return<div ref={r} className={className} style={{opacity:v?1:0,transform:v?"translateY(0)":"translateY(24px)",transition:`all .6s cubic-bezier(.22,.61,.36,1) ${delay}s`}}>{children}</div>}
function Icon({name,size=20,color="currentColor",stroke=1.8}){
  const p={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:stroke,strokeLinecap:"round",strokeLinejoin:"round","aria-hidden":"true"};
  const icons={
    brand:<><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8v8M8 12h8"/></>,
    whatsapp:<><path d="M6 18l1.2-3A7 7 0 1 1 18 15.8z"/><path d="M10 9.5c.4 2 1.9 3.5 3.9 3.9"/><path d="M13.2 13.6l1.4 1"/><path d="M9.3 9.4l1 1.4"/></>,
    menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close:<><path d="M6 6l12 12M18 6L6 18"/></>,
    arrow:<><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></>,
    shield:<><path d="M12 3l7 3v5c0 4.3-2.7 8.1-7 10-4.3-1.9-7-5.7-7-10V6z"/><path d="M9 12l2 2 4-4"/></>,
    check:<><path d="M5 12l4 4 10-10"/></>,
    care:<><path d="M12 20s-6-4.5-8-8.1C2.2 8.7 4.3 6 7.3 6c1.8 0 3 1 4.7 3 1.7-2 2.9-3 4.7-3 3 0 5.1 2.7 3.3 5.9C18 15.5 12 20 12 20z"/></>,
    clock:<><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></>,
    home:<><path d="M4 11.5L12 5l8 6.5"/><path d="M7 10.5V19h10v-8.5"/></>,
    users:<><path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 12a2.5 2.5 0 1 0 0-5"/><path d="M4.5 19a5 5 0 0 1 9 0M15.5 19a4 4 0 0 1 4-3"/></>,
    spark:<><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/></>,
    stethoscope:<><path d="M8 4v5a4 4 0 0 0 8 0V4"/><path d="M10 4H6M18 4h-4"/><path d="M16 14v2a3 3 0 1 0 3-3h-1"/></>,
    phone:<><path d="M7 5h3l1 4-2 1.5a14 14 0 0 0 4.5 4.5L15 13l4 1v3a2 2 0 0 1-2 2A15 15 0 0 1 5 7a2 2 0 0 1 2-2z"/></>,
    nurse:<><circle cx="12" cy="8" r="3"/><path d="M8 19a4 4 0 0 1 8 0"/><path d="M10 4h4M12 2v4"/></>,
    pin:<><path d="M12 21s6-5.6 6-11a6 6 0 1 0-12 0c0 5.4 6 11 6 11z"/><circle cx="12" cy="10" r="2"/></>,
    chevron:<><path d="M7 10l5 5 5-5"/></>,
    success:<><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></>,
    chat:<><path d="M5 6h14v9H9l-4 3z"/></>,
    send:<><path d="M4 20l16-8L4 4l2 6 8 2-8 2z"/></>,
    syringe:<><path d="M14 5l5 5"/><path d="M11 8l5 5"/><path d="M4 20l7-7"/><path d="M8 16l-2-2"/><path d="M15 4l2-2"/><path d="M18 9l2-2"/></>,
    bandage:<><rect x="4" y="9" width="16" height="6" rx="3"/><path d="M9 9l6 6M15 9l-6 6"/><path d="M12 10.5h.01M12 13.5h.01"/></>,
    pulse:<><path d="M3 12h4l2-4 3 8 2-4h7"/></>,
    elder:<><circle cx="12" cy="7" r="3"/><path d="M10 10l-1 5 3 2 3-2-1-5"/><path d="M8 21l2-4h4l2 4"/></>,
    cross:<><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M12 8v8M8 12h8"/></>,
    drop:<><path d="M12 4c3 4 5 6.4 5 9a5 5 0 1 1-10 0c0-2.6 2-5 5-9z"/></>,
    activity:<><path d="M3 13h4l2-5 4 9 2-4h6"/></>,
    scissors:<><circle cx="7" cy="17" r="2"/><circle cx="7" cy="7" r="2"/><path d="M9 8.5L19 3M9 15.5L19 21"/></>,
    alert:<><path d="M12 4l8 14H4z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    pill:<><path d="M8 8a4 4 0 0 1 5.7 0l2.3 2.3a4 4 0 0 1-5.7 5.7L8 13.7A4 4 0 0 1 8 8z"/><path d="M10 10l4 4"/></>,
    gauge:<><path d="M5 16a7 7 0 1 1 14 0"/><path d="M12 13l4-2"/></>,
  };
  return <svg {...p}>{icons[name] || icons.brand}</svg>;
}
function LogoLockup({sc=false,small=false}){
  const boxSize = small ? 48 : 60;
  const titleSize = small ? 14 : 20;
  const subSize = small ? 10 : 13;
  return (
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{
        width:boxSize,
        height:boxSize,
        borderRadius:14,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        background:"#ffffff",
        border:`1px solid ${sc ? "rgba(63,184,201,.28)" : "rgba(63,184,201,.20)"}`,
        boxShadow:sc ? "0 10px 24px rgba(63,184,201,.14)" : "0 8px 18px rgba(13,39,86,.06)",
        flexShrink:0,
        overflow:"hidden",
        padding: small ? 4 : 5,
      }}>
        <img src="/logobotica.png" alt="Logo Enfermería en Casa" style={{width:"100%",height:"100%",objectFit:"contain",display:"block"}} />
      </div>
      <div>
  <span style={{display:"block",fontWeight:900,fontSize:titleSize,color:C.text,lineHeight:1.02,letterSpacing:"-.04em"}}>Enfermería en Casa</span>
  <span style={{display:"block",fontSize:subSize,fontWeight:700,color:C.brandDark,lineHeight:1.1,marginTop:4}}>Atención las 24 horas del día</span>

  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:4}}>
    <Icon name="phone" size={12} color={C.brandDark} />
    <span style={{fontSize: small ? 10 : 13, fontWeight: 700, color: C.muted}}>977 134 583</span>
  </div>
</div>

    </div>
  );
}

const S={nav:{position:"fixed",top:0,left:0,right:0,zIndex:50,transition:"all .4s",padding:"8px 0"},navS:{background:"rgba(255,255,255,.96)",backdropFilter:"blur(16px)",boxShadow:"0 8px 30px rgba(13,39,86,.08)",padding:"4px 0",borderBottom:`1px solid ${C.line}`},navIn:{maxWidth:1200,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:68},logo:{display:"flex",alignItems:"center",gap:10,cursor:"pointer"},logoIc:{width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"},sect:{padding:"80px 20px",maxWidth:1200,margin:"0 auto"},sectBg:{padding:"80px 20px",background:C.bg},head:{textAlign:"center",marginBottom:48},badge:(bg,co,bd)=>({display:"inline-block",padding:"6px 16px",borderRadius:50,fontSize:13,fontWeight:700,marginBottom:14,background:bg,color:co,border:`1px solid ${bd}`}),h2:{fontSize:"clamp(1.7rem,3vw,2.4rem)",fontWeight:900,color:C.text,lineHeight:1.15,marginTop:14,letterSpacing:"-.04em"},p:{color:C.muted,fontSize:16,marginTop:10,lineHeight:1.75},card:{background:C.surface,borderRadius:18,padding:24,border:`1px solid ${C.line}`,cursor:"pointer",transition:"all .25s",height:"100%",display:"flex",flexDirection:"column",boxShadow:"0 12px 30px rgba(13,39,86,.04)"},btn1:{padding:"16px 28px",background:"linear-gradient(135deg,#35b5c5,#227a74)",color:"#fff",fontWeight:800,borderRadius:16,fontSize:16,boxShadow:"0 14px 30px rgba(47,156,149,.28)",display:"inline-flex",alignItems:"center",gap:8,cursor:"pointer",border:"1px solid rgba(255,255,255,.22)",fontFamily:"inherit",transition:"transform .2s",letterSpacing:".01em"},btnWa:{padding:"16px 28px",background:"#ffffff",color:C.text,fontWeight:800,borderRadius:16,fontSize:16,display:"inline-flex",alignItems:"center",gap:8,boxShadow:"0 10px 24px rgba(13,39,86,.08)",border:`1px solid ${C.line}`},inp:{width:"100%",padding:"12px 16px",background:C.surfaceSoft,border:`1px solid ${C.line}`,borderRadius:12,fontSize:14,outline:"none",color:C.text,fontFamily:"inherit"}};

function Navbar({onReq}){
  const[open,setOpen]=useState(false);
  const[sc,setSc]=useState(false);
  useEffect(()=>{const f=()=>setSc(window.scrollY>50);window.addEventListener("scroll",f,{passive:true});return()=>window.removeEventListener("scroll",f)},[]);
  const go=h=>{setOpen(false);document.querySelector(h)?.scrollIntoView({behavior:"smooth"})};
  const links=[["Inicio","#inicio"],["Servicios","#servicios"],["Nosotros","#nosotros"],["Proceso","#proceso"],["Cobertura","#cobertura"]];
  return(
    <nav style={{...S.nav,...S.navS}}>
      <div style={S.navIn}>
        <div onClick={()=>go("#inicio")} style={S.logo}>
          <LogoLockup sc={sc}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}} className="dsk-nav">
          {links.map(([l,h])=><a key={h} onClick={()=>go(h)} style={{padding:"8px 14px",borderRadius:10,fontSize:13,fontWeight:700,color:C.text,cursor:"pointer",transition:"all .2s"}}>{l}</a>)}
          <button onClick={onReq} style={{marginLeft:12,padding:"14px 28px",borderRadius:18,fontSize:15,fontWeight:800,color:"#fff",background:"linear-gradient(135deg,#35b5c5,#227a74)",boxShadow:"0 16px 34px rgba(47,156,149,.30)",border:"1px solid rgba(255,255,255,.22)",display:"inline-flex",alignItems:"center",gap:10,letterSpacing:".01em"}}>Agendar Cita <Icon name="arrow" size={17} color="#fff"/></button>
        </div>
        <button onClick={()=>setOpen(!open)} style={{display:"none",padding:8,color:C.text,background:"none",border:"none"}} className="mob-btn">{open?<Icon name="close" size={22} color="currentColor"/>:<Icon name="menu" size={22} color="currentColor"/>}</button>
      </div>
      {open&&<div style={{background:"rgba(255,255,255,.98)",borderTop:"1px solid #d6e6e5",padding:16,animation:"slideIn .25s ease-out"}} className="mob-menu">
        {links.map(([l,h])=><a key={h} onClick={()=>go(h)} style={{display:"block",padding:"12px 16px",borderRadius:12,fontSize:14,fontWeight:500,color:"#24444d",cursor:"pointer"}}>{l}</a>)}
        <a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer" style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:12,borderRadius:12,background:"#e7f7f1",color:"#2b8f78",fontWeight:600,fontSize:14,marginTop:8}}><Icon name="whatsapp" size={16} color="#25D366"/>WhatsApp</a>
        <button onClick={()=>{setOpen(false);onReq()}} style={{width:"100%",padding:"12px 18px",borderRadius:14,background:"linear-gradient(135deg,#35b5c5,#227a74)",color:"#fff",fontWeight:800,fontSize:14,marginTop:8,border:"1px solid rgba(255,255,255,.18)",boxShadow:"0 12px 26px rgba(47,156,149,.24)",display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8}}>Agendar Cita <Icon name="arrow" size={17} color="#fff"/></button>
      </div>}
      <style>{`@media(max-width:900px){.dsk-nav{display:none !important}.mob-btn{display:flex !important}}`}</style>
    </nav>
  );
}

function Hero({onReq}){
  const slides = [
    {src:"/Enfermera-inyecciones.png",alt:"Enfermera aplicando un inyectable a domicilio",title:"Aplicación de inyecciones",tag:"Atención segura en casa"},
    {src:"/enfermera-adulto-mayor.png",alt:"Enfermera atendiendo a un adulto mayor en casa",title:"Cuidado del adulto mayor",tag:"Acompañamiento profesional"},
    {src:"/enfermera-extranjero.png",alt:"Enfermera atendiendo a un paciente extranjero",title:"Atención a visitantes",tag:"Apoyo para mal de altura"},
    {src:"/enfermera-vitaminas.png",alt:"Enfermera preparando suero vitamínico",title:"Sueros vitamínicos",tag:"Recuperación e hidratación"},
  ];
  const [slideIndex,setSlideIndex] = useState(0);

  useEffect(()=>{
    const id = window.setInterval(()=>{
      setSlideIndex(v=>(v+1)%slides.length);
    },4000);
    return()=>window.clearInterval(id);
  },[slides.length]);

  return(
    <section id="inicio" style={{position:"relative",minHeight:"100vh",display:"flex",alignItems:"center",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,background:`linear-gradient(90deg,${C.brandDeep} 0%,${C.brandDeep2} 56%,#ffffff 100%)`}}/>
      <div style={{position:"absolute",top:"10%",left:"-5%",width:420,height:420,background:"rgba(63,184,201,.10)",borderRadius:"50%",filter:"blur(90px)"}}/>
      <div style={{position:"absolute",bottom:"-8%",left:"20%",width:340,height:340,background:"rgba(13,39,86,.06)",borderRadius:"50%",filter:"blur(90px)"}}/>
      <div style={{position:"absolute",top:100,left:"42%",width:8,height:8,background:"rgba(63,184,201,.35)",borderRadius:"50%",animation:"float 6s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"38%",left:"58%",width:6,height:6,background:"rgba(13,39,86,.22)",borderRadius:"50%",animation:"float 8s ease-in-out 1s infinite"}}/>
      <div style={{position:"relative",maxWidth:1200,margin:"0 auto",padding:"140px 20px 100px",width:"100%"}}>
        <div className="hero-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.05fr) minmax(320px,.95fr)",alignItems:"center",gap:44}}>
          <div>
            <F delay={0.1}><div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.72)",border:`1px solid ${C.line}`,borderRadius:50,padding:"8px 18px",marginBottom:28,backdropFilter:"blur(8px)"}}><Icon name="care" size={16} color={C.brandDark}/><span style={{color:C.text,fontSize:14,fontWeight:700}}>Cuidado profesional de enfermería en la comodidad de su hogar</span></div></F>
            <F delay={0.2}><h1 style={{fontSize:"clamp(2.35rem,5vw,4rem)",fontWeight:900,color:C.text,lineHeight:1.1,letterSpacing:"-.05em",maxWidth:680}}>Enfermería en Casa</h1></F>
            <F delay={0.35}><p style={{marginTop:24,fontSize:18,color:C.muted,lineHeight:1.8,maxWidth:620}}>Atención médica <strong style={{color:C.text}}>personalizada y de calidad</strong> en la comodidad de su hogar. Personal de enfermería profesional con vocación, calidez y compromiso.</p></F>
            <F delay={0.5}><div style={{marginTop:32,display:"flex",flexWrap:"wrap",gap:12}}>
              <button onClick={onReq} style={S.btn1}>Agendar Cita <Icon name="arrow" size={16} color="#fff"/></button>
              <a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer" style={S.btnWa}><Icon name="whatsapp" size={16} color="#25D366"/>WhatsApp</a>
            </div></F>
            <F delay={0.65}><div style={{marginTop:40,display:"flex",gap:16,flexWrap:"wrap"}}>
              {[{v:"100%",l:"Bioseguridad"},{v:"Rápida",l:"Respuesta"},{v:"Personal",l:"Experto"}].map((s,i)=>( 
                <div key={i} style={{textAlign:"center",padding:14,borderRadius:16,background:"rgba(255,255,255,.78)",border:`1px solid ${C.line}`,minWidth:100,boxShadow:"0 10px 30px rgba(13,39,86,.04)"}}>
                  <div style={{color:C.text,fontWeight:800,fontSize:14}}>{s.v}</div>
                  <div style={{color:C.muted,fontSize:11}}>{s.l}</div>
                </div>
              ))}
            </div></F>
          </div>
          <F delay={0.28}>
            <div className="hero-media-wrap" style={{position:"relative",display:"flex",justifyContent:"flex-end"}}>
              <div style={{position:"absolute",top:-18,right:18,width:120,height:120,borderRadius:28,background:"rgba(63,184,201,.14)",filter:"blur(8px)"}}/>
              <div style={{position:"absolute",bottom:-18,left:18,width:160,height:160,borderRadius:"50%",background:"rgba(13,39,86,.07)",filter:"blur(18px)"}}/>
              <div className="hero-media-card" style={{position:"relative",width:"100%",maxWidth:494,borderRadius:30,overflow:"hidden",background:"#ffffff",border:`1px solid ${C.line}`,boxShadow:"0 26px 70px rgba(13,39,86,.14)"}}>
                <div style={{position:"relative",aspectRatio:"4 / 4.1",overflow:"hidden"}}>
                  {slides.map((slide,i)=>(
                    <img
                      key={slide.src}
                      src={slide.src}
                      alt={slide.alt}
                      style={{
                        position:"absolute",
                        inset:0,
                        display:"block",
                        width:"100%",
                        height:"100%",
                        objectFit:"cover",
                        opacity:i===slideIndex?1:0,
                        transform:i===slideIndex?"scale(1)":"scale(1.04)",
                        transition:"opacity .8s ease, transform 1.2s ease",
                      }}
                    />
                  ))}
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(13,39,86,.02) 30%,rgba(13,39,86,.42) 100%)"}}/>
                  <div style={{position:"absolute",left:20,right:20,bottom:20,display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16}}>
                    <div style={{maxWidth:280}}>
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:999,background:"rgba(255,255,255,.16)",backdropFilter:"blur(8px)",border:"1px solid rgba(255,255,255,.18)",color:"#fff",fontSize:12,fontWeight:700,marginBottom:10}}>{slides[slideIndex].tag}</div>
                      <div style={{color:"#fff",fontSize:24,fontWeight:800,lineHeight:1.15,textShadow:"0 8px 24px rgba(13,39,86,.25)"}}>{slides[slideIndex].title}</div>
                    </div>
                    <div style={{display:"flex",gap:8,alignItems:"center"}}>
                      {slides.map((slide,i)=>(
                        <button
                          key={slide.src+"-dot"}
                          onClick={()=>setSlideIndex(i)}
                          aria-label={`Ver imagen ${i+1}`}
                          style={{
                            width:i===slideIndex?26:9,
                            height:9,
                            borderRadius:999,
                            border:"none",
                            background:i===slideIndex?"#fff":"rgba(255,255,255,.45)",
                            cursor:"pointer",
                            transition:"all .25s ease",
                            padding:0,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </F>
        </div>
      </div>
      <div style={{position:"absolute",bottom:0,left:0,right:0}}><svg viewBox="0 0 1440 100" fill="none" style={{display:"block",width:"100%"}}><path d="M0 100L48 87.5C96 75 192 50 288 41.7C384 33.3 480 41.7 576 50C672 58.3 768 66.7 864 62.5C960 58.3 1056 41.7 1152 35.4C1248 29.2 1344 33.3 1392 35.4L1440 37.5V100H0Z" fill="white"/></svg></div>
      <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}@keyframes slideIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}@media(max-width:960px){.hero-grid{grid-template-columns:1fr !important;gap:28px !important}.hero-media-wrap{justify-content:center !important}.hero-media-card{max-width:100% !important}}`}</style>
    </section>
  );
}

function TrustBar(){
  return<div style={{padding:"18px 20px",borderBottom:"1px solid #d6e6e5",display:"flex",justifyContent:"center",flexWrap:"wrap",gap:24}}>
    {[["shield","Bioseguridad Garantizada"],["check","Enfermeras Colegiadas"],["care","Atención con calidez Humana"],["clock","Respuesta Inmediata"],["home","Servicio a Domicilio"]].map(([icon,t],i)=><span key={i} style={{fontSize:13,fontWeight:500,color:"#5e7b84",display:"inline-flex",alignItems:"center",gap:8}}><Icon name={icon} size={14} color={C.brand}/>{t}</span>)}
  </div>;
}

function About(){
  return(
    <section id="nosotros" style={S.sect}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:60,alignItems:"center"}} className="grid-r">
        <F><div>
          <span style={S.badge("#eef9f7","#227a74","#c9ece7")}>Sobre Nosotros</span>
          <h2 style={{fontSize:"clamp(1.6rem,3vw,2.2rem)",fontWeight:800,color:"#17323a",lineHeight:1.2}}>Cuidamos su salud con <span style={{color:"#2f9c95"}}>calidez, respeto y profesionalismo</span></h2>
          <p style={{marginTop:18,fontSize:16,color:"#5e7b84",lineHeight:1.7}}>Somos un equipo de enfermeras profesionales que brindan atención médica a domicilio en Cusco. Ofrecemos cuidados clínicos seguros, seguimiento personalizado y acompañamiento para mejorar la salud y bienestar de nuestros pacientes en la comodidad de su hogar.</p>
          <div style={{marginTop:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {[{v:"100%",l:"Personalizado"},{v:"24/7",l:"Disponibilidad"},{v:"6",l:"Distritos"},{v:"12+",l:"Servicios"}].map((s,i)=>(
              <div key={i} style={{padding:16,background:"#f4fbfb",borderRadius:16,textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#2f9c95"}}>{s.v}</div><div style={{fontSize:13,color:"#5e7b84",marginTop:2}}>{s.l}</div></div>
            ))}
          </div>
        </div></F>
        <F delay={0.2}><div style={{background:"linear-gradient(135deg,#eef9f7,#eaf7f6)",borderRadius:24,padding:32,border:"1px solid #d6e6e5"}}>
          {[{icon:"care",t:"Vocación de servicio",d:"Cada profesional trabaja con vocación de servicio y enfoque humano."},{icon:"users",t:"Seguimiento familiar",d:"Mantenemos comunicación clara y constante con la familia."},{icon:"shield",t:"Seguridad garantizada",d:"Protocolos estrictos de bioseguridad."},{icon:"spark",t:"Experiencia comprobada",d:"Contamos con experiencia comprobada en cuidados postquirúrgicos y atención geriátrica."}].map((b,i)=>( 
            <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",marginBottom:i<3?20:0}}>
              <div style={{width:42,height:42,borderRadius:12,background:"#fff",border:"1px solid #d6e6e5",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:18}}><Icon name={b.icon} size={18} color={C.brandDark}/></div>
              <div><div style={{fontWeight:700,fontSize:14,color:"#17323a"}}>{b.t}</div><div style={{fontSize:13,color:"#5e7b84",marginTop:2,lineHeight:1.5}}>{b.d}</div></div>
            </div>
          ))}
        </div></F>
      </div>
      <style>{`@media(max-width:768px){.grid-r{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}

function Services({onSvc}){
  const vis=SVCS;
  return(
    <section id="servicios" style={S.sectBg}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <F><div style={S.head}><span style={{...S.badge("#eaf7f6","#2f9c95","#b8e2e6"),display:"inline-flex",alignItems:"center",gap:8}}><Icon name="stethoscope" size={15} color={C.brand}/>Nuestros Servicios</span><h2 style={S.h2}>Atención profesional en su hogar</h2><p style={S.p}>Servicios de enfermería en casa adaptados a sus necesidades.</p></div></F>
        <div className="svc-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:20}}>
          {vis.map((s,i)=>(
            <F key={s.id} delay={i*0.04} className="svc-item">
              <div onClick={()=>onSvc(s.t)} style={{...S.card,height:"100%",padding:26,alignItems:"center",textAlign:"center"}} onMouseOver={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 12px 30px rgba(0,0,0,.06)"}} onMouseOut={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                <div style={{width:56,height:56,borderRadius:16,background:s.cl+"12",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,marginBottom:16}}><Icon name={s.em} size={26} color={s.cl}/></div>
                <h3 style={{fontWeight:700,color:"#17323a",fontSize:15,marginBottom:10,lineHeight:1.35,minHeight:52,display:"flex",alignItems:"center",justifyContent:"center"}}>{s.t}</h3>
                <p style={{fontSize:13,color:"#5e7b84",lineHeight:1.7,flex:1,textAlign:"justify",textJustify:"inter-word",margin:0}}>{s.d}</p>
                <div style={{marginTop:16,color:"#2f9c95",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6,justifyContent:"center"}}>Solicitar atención <Icon name="arrow" size={14} color={C.brand}/></div>
              </div>
            </F>
          ))}
        </div>
        <style>{`@media(max-width:980px){.svc-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}}@media(max-width:640px){.svc-grid{grid-template-columns:1fr !important}}`}</style>
      </div>
    </section>
  );
}

function HowItWorks(){
  const steps=[{n:"1",em:"phone",t:"Contáctenos",d:"Puede contactarnos por WhatsApp, chatbot o formulario web.",bg:"linear-gradient(135deg,#0ea5e9,#2f9c95)"},{n:"2",em:"nurse",t:"Asignamos personal",d:"Asignamos a la profesional adecuada para atenderle.",bg:"linear-gradient(135deg,#2f9c95,#227a74)"},{n:"3",em:"home",t:"Recibe atención",d:"En la comodidad de su hogar.",bg:"linear-gradient(135deg,#2b8f78,#2b8f78)"}];
  return(
    <section id="proceso" style={S.sect}>
      <F><div style={S.head}><span style={{...S.badge("#f0fdfa","#3caea3","#bde8e2"),display:"inline-flex",alignItems:"center",gap:8}}><Icon name="spark" size={15} color={C.brand}/>Proceso Simple</span><h2 style={S.h2}>¿Cómo funciona?</h2></div></F>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:32}}>
        {steps.map((s,i)=><F key={i} delay={i*0.15}><div style={{textAlign:"center"}}>
          <div style={{width:88,height:88,borderRadius:24,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:40,boxShadow:`0 20px 40px ${i===0?"rgba(47,156,149,.18)":i===1?"rgba(24,76,97,.16)":"rgba(233,184,109,.18)"}`}}><Icon name={s.em} size={34} color="#fff"/></div>
          <div style={{fontWeight:700,fontSize:18,color:"#17323a",marginBottom:8}}>{s.t}</div>
          <div style={{color:"#5e7b84",lineHeight:1.6}}>{s.d}</div>
        </div></F>)}
      </div>
    </section>
  );
}

function Testimonials(){
  const [items,setItems] = useState(TESTS);
  const [form,setForm] = useState({nombre:"",distrito:"",resena:"",puntuacion:"5"});
  const [submitting,setSubmitting] = useState(false);
  const [status,setStatus] = useState({type:"",msg:""});

  useEffect(()=>{
    let active = true;
    fetch(TESTIMONIALS_API)
      .then(async r => {
        if(!r.ok) throw new Error("fetch_failed");
        return r.json();
      })
      .then(data => {
        if(!active || !data?.ok || !Array.isArray(data.items) || !data.items.length) return;
        setItems(data.items.map(x => ({
          n: x.nombre,
          di: x.distrito,
          tx: x.resena,
          r: Number(x.puntuacion || 5),
        })));
      })
      .catch(()=>{});
    return()=>{active=false};
  },[]);

  const onChange = (key,value) => setForm(s=>({...s,[key]:value}));

  const onSubmit = async e => {
    e.preventDefault();
    const payload = {
      nombre: form.nombre.trim(),
      distrito: form.distrito.trim(),
      resena: form.resena.trim(),
      puntuacion: Number(form.puntuacion),
    };
    if(!payload.nombre || !payload.distrito || !payload.resena){
      setStatus({type:"error",msg:"Complete nombre, distrito y reseña."});
      return;
    }
    setSubmitting(true);
    setStatus({type:"",msg:""});
    try{
      const r = await fetch(TESTIMONIALS_API,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      const data = await r.json();
      if(!r.ok || !data?.ok) throw new Error(data?.message || "submit_failed");
      setStatus({type:"ok",msg:"Su reseña fue enviada correctamente. Se publicará después de la revisión."});
      setForm({nombre:"",distrito:"",resena:"",puntuacion:"5"});
    }catch{
      setStatus({type:"error",msg:"Ocurrió un error al enviar. Intente nuevamente"});
    }finally{
      setSubmitting(false);
    }
  };

  return(
    <section style={{padding:"80px 20px",background:"linear-gradient(180deg,#f7fcfc,#fff)"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <F><div style={S.head}><span style={S.badge("#fff4de","#e9b86d","#f3d4a0")}>⭐ Testimonios</span><h2 style={S.h2}>Lo que dicen nuestros pacientes</h2><p style={{...S.p,maxWidth:700,margin:"10px auto 0",textAlign:"center"}}>Puede revisar reseñas reales y enviar su propia experiencia para publicación.</p></div></F>
        <div className="test-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(320px,.75fr)",gap:24,alignItems:"start"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:20}}>
            {items.map((t,i)=><F key={`${t.n}-${t.di}-${i}`} delay={i*0.08}><div style={{background:"#fff",borderRadius:18,padding:28,border:"1px solid #d6e6e5",height:"100%",display:"flex",flexDirection:"column",boxShadow:"0 10px 24px rgba(13,39,86,.04)"}}>
              <div style={{marginBottom:14,color:"#d5a34f",letterSpacing:2,fontSize:18}}>{"★".repeat(Number(t.r || 5))}{"☆".repeat(Math.max(0,5-Number(t.r || 5)))}</div>
              <p style={{color:"#43646d",lineHeight:1.7,flex:1,fontStyle:"italic",fontSize:14}}>"{t.tx}"</p>
              <div style={{display:"flex",alignItems:"center",gap:10,marginTop:18,paddingTop:16,borderTop:"1px solid #d6e6e5"}}>
                <div style={{width:42,height:42,borderRadius:"50%",background:"linear-gradient(135deg,#63bdb3,#2f9c95)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>{t.n[0]}</div>
                <div><div style={{fontWeight:700,fontSize:14,color:"#17323a"}}>{t.n}</div><div style={{fontSize:12,color:"#4f6479"}}>Zona: {t.di}</div></div>
              </div>
            </div></F>)}
          </div>
          <F delay={0.1}><div style={{background:"#fff",borderRadius:24,padding:28,border:"1px solid #d6e6e5",boxShadow:"0 16px 36px rgba(13,39,86,.06)",position:"sticky",top:110}}>
            <div style={{fontWeight:800,fontSize:22,color:C.text,lineHeight:1.2}}>Deje su reseña</div>
            <p style={{fontSize:14,color:C.muted,lineHeight:1.65,marginTop:10}}>Las reseñas enviadas quedan pendientes de revisión antes de publicarse.</p>
            <form onSubmit={onSubmit} style={{marginTop:18,display:"grid",gap:12}}>
              <input value={form.nombre} onChange={e=>onChange("nombre",e.target.value)} placeholder="Nombre" style={S.inp} />
              <input value={form.distrito} onChange={e=>onChange("distrito",e.target.value)} placeholder="Distrito" style={S.inp} />
              <select value={form.puntuacion} onChange={e=>onChange("puntuacion",e.target.value)} style={S.inp}>
                <option value="5">5 estrellas</option>
                <option value="4">4 estrellas</option>
                <option value="3">3 estrellas</option>
                <option value="2">2 estrellas</option>
                <option value="1">1 estrella</option>
              </select>
              <textarea value={form.resena} onChange={e=>onChange("resena",e.target.value)} placeholder="Escriba su reseña" rows={5} style={{...S.inp,resize:"vertical",minHeight:120}} />
              <button type="submit" disabled={submitting} style={{...S.btn1,justifyContent:"center",opacity:submitting?0.8:1}}>{submitting ? "Enviando..." : "Enviar reseña"}</button>
              {status.msg && <div style={{fontSize:13,fontWeight:700,color:status.type==="ok"?"#227a74":"#a14b3b",background:status.type==="ok"?"#eef9f7":"#fff3ef",border:`1px solid ${status.type==="ok"?"#c9ece7":"#f0c5bb"}`,padding:"12px 14px",borderRadius:12}}>{status.msg}</div>}
            </form>
            <div style={{fontSize:12,color:"#6a7b8c",lineHeight:1.6,marginTop:14}}>Las reseñas aprobadas se publicarán próximamente</div>
          </div></F>
        </div>
      </div>
      <style>{`@media(max-width:980px){.test-grid{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}

function Coverage(){
  return(
    <section id="cobertura" style={S.sect}>
      <F><div style={S.head}><span style={{...S.badge("#f0fdfa","#3caea3","#bde8e2"),display:"inline-flex",alignItems:"center",gap:8}}><Icon name="pin" size={15} color={C.brand}/>Cobertura</span><h2 style={S.h2}>Distritos donde atendemos</h2></div></F>
      <div className="cov-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:14,maxWidth:880,margin:"0 auto",alignItems:"stretch"}}>
        {DIST.map((d,i)=><F key={d} delay={i*0.06}><div style={{display:"flex",alignItems:"center",gap:14,padding:"18px 18px",background:"#f4fbfb",borderRadius:16,minHeight:82,border:"1px solid #e1efee",boxShadow:"0 8px 18px rgba(13,39,86,.03)"}}>
          <div style={{width:40,height:40,borderRadius:12,background:"#c9ece7",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Icon name="pin" size={17} color={C.brandDark}/></div>
          <span style={{fontWeight:600,fontSize:14,color:"#24444d"}}>{d}</span>
        </div></F>)}
      </div>
      <F delay={0.3}><div style={{textAlign:"center",marginTop:32}}>
        <a href={`https://wa.me/${WA}?text=${encodeURIComponent("Hola, quisiera saber si cuentan con cobertura en mi zona.")}`} target="_blank" rel="noopener noreferrer" style={{...S.btnWa,fontSize:14,padding:"14px 24px",minWidth:405,justifyContent:"center"}}><Icon name="whatsapp" size={16} color="currentColor"/>¿No encuentra su zona? Consulte aquí</a>
      </div></F>
      <style>{`@media(max-width:880px){.cov-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}}@media(max-width:580px){.cov-grid{grid-template-columns:1fr !important}}`}</style>
    </section>
  );
}

function Faq(){
  const[oi,setOi]=useState(null);
  return(
    <section id="faq" style={S.sectBg}>
      <div style={{maxWidth:700,margin:"0 auto"}}>
        <F><div style={S.head}><span style={{...S.badge("#fff4de","#e9b86d","#f3d4a0"),display:"inline-flex",alignItems:"center",gap:8}}><Icon name="chat" size={15} color={C.accent}/>FAQ</span><h2 style={S.h2}>Preguntas Frecuentes</h2></div></F>
        {FAQS.map((f,i)=><F key={i} delay={i*0.05}><div style={{background:"#fff",borderRadius:16,border:"1px solid #d6e6e5",marginBottom:10,overflow:"hidden"}}>
          <button onClick={()=>setOi(oi===i?null:i)} style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 20px",textAlign:"left",gap:12}}>
            <span style={{fontWeight:700,fontSize:14,color:"#17323a"}}>{f.q}</span>
            <span style={{flexShrink:0,transition:"transform .3s",transform:oi===i?"rotate(180deg)":"rotate(0)",display:"inline-flex"}}><Icon name="chevron" size={14} color={C.muted}/></span>
          </button>
          <div style={{maxHeight:oi===i?200:0,overflow:"hidden",transition:"max-height .3s"}}>
            <p style={{padding:"0 20px 18px",fontSize:14,color:"#5e7b84",lineHeight:1.6}}>{f.a}</p>
          </div>
        </div></F>)}
      </div>
    </section>
  );
}

function CTA({onReq}){
  return(
    <section style={{padding:"80px 20px",background:`linear-gradient(135deg,${C.brandDeep2},${C.brandDeep},${C.brandDark})`,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,right:0,width:300,height:300,background:"rgba(233,184,109,.10)",borderRadius:"50%",filter:"blur(80px)"}}/>
      <div style={{maxWidth:700,margin:"0 auto",textAlign:"center",position:"relative"}}>
        <F>
          <h2 style={{fontSize:"clamp(1.6rem,4vw,2.5rem)",fontWeight:800,color:C.text,lineHeight:1.2}}>¿Necesita atención de enfermería en casa?</h2>
          <p style={{color:"#4f6479",fontSize:16,marginTop:16}}>Contáctenos ahora y reciba atención profesional con calidez humana.</p>
          <div style={{marginTop:32,display:"flex",flexWrap:"wrap",justifyContent:"center",gap:12}}>
            <button onClick={onReq} style={S.btn1}>Agendar Cita <Icon name="arrow" size={16} color="#fff"/></button>
            <a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer" style={S.btnWa}><Icon name="whatsapp" size={16} color="#25D366"/>WhatsApp</a>
          </div>
          <div style={{marginTop:28,display:"flex",flexWrap:"wrap",justifyContent:"center",gap:20,color:"#43586c",fontSize:13,fontWeight:700}}>
            <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="pin" size={14} color={C.accent}/>Cusco, Perú</span><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="clock" size={14} color={C.accent}/>24 horas al dia</span><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="phone" size={14} color={C.accent}/>+51 977 134 583</span>
          </div>
        </F>
      </div>
    </section>
  );
}

function Footer(){
  return(
    <footer style={{background: C.brandDeep2, color:"#4f6479", padding:"48px 20px 24px"}}>
      <div style={{maxWidth:1200,margin:"0 auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16,paddingBottom:24,borderBottom:"1px solid #17323a"}}>
          <LogoLockup sc small/>
          <div style={{display:"flex",gap:20,fontSize:13}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="phone" size={13} color={C.accent}/>+51 977134583</span><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Icon name="pin" size={13} color={C.accent}/>Cusco, Perú</span></div>
        </div>
        <div style={{paddingTop:20,textAlign:"center",fontSize:12}}>2026 Enfermería en Casa Cusco. Todos los derechos reservados.</div>
        <div style={{paddingTop:8,textAlign:"center",fontSize:12,color:"#9ab3b9"}}>Elaborado por obadel</div>
      </div>
    </footer>
  );
}

function RequestForm({isOpen,onClose,pre}){
  const[f,setF]=useState({nombre:"",telefono:"",distrito:"",direccion:"",servicio:"",fecha:"",hora:""});
  const[done,setDone]=useState(false);
  const[lastUrl,setLastUrl]=useState("");
  useEffect(()=>{if(pre)setF(v=>({...v,servicio:pre}))},[pre]);
  useEffect(()=>{if(isOpen){setDone(false);setLastUrl("")}},[isOpen]);
  if(!isOpen)return null;
  const h=e=>setF({...f,[e.target.name]:e.target.value});
  const submit=e=>{
    e.preventDefault();
    const url = `https://wa.me/${WA}?text=${buildAppointmentMessage(f)}`;
    setLastUrl(url);
    window.open(url,"_blank","noopener,noreferrer");
    setDone(true);
  };
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.6)",backdropFilter:"blur(8px)"}}/>
      <div onClick={e=>e.stopPropagation()} style={{position:"relative",background:"#fff",borderRadius:24,width:"100%",maxWidth:440,maxHeight:"90vh",overflow:"auto",padding:28,animation:"modalIn .3s ease-out"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div><h2 style={{fontSize:22,fontWeight:800,color:"#17323a"}}>Agendar Cita</h2><p style={{fontSize:13,color:"#5e7b84"}}>Nos pondremos en contacto con usted pronto</p></div>
          <button onClick={onClose} style={{padding:8,color:"#4f6479",background:"none",border:"none"}}><Icon name="close" size={18} color="currentColor"/></button>
        </div>
        {done?(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:48,marginBottom:16,display:"inline-flex"}}><Icon name="success" size={44} color={C.success}/></div>
            <h3 style={{fontSize:20,fontWeight:700,color:"#17323a"}}>¡Solicitud enviada!</h3>
            <p style={{color:"#5e7b84",marginTop:8,fontSize:14}}>Hemos abierto WhatsApp con su solicitud lista para enviarse al número principal.</p><a href={lastUrl} target="_blank" rel="noopener noreferrer" style={{...S.btnWa,marginTop:16,justifyContent:"center"}}><Icon name="whatsapp" size={16} color="#25D366"/>Continuar en WhatsApp</a>
            <button onClick={onClose} style={{...S.btn1,marginTop:24,fontSize:14,padding:"12px 28px"}}>Cerrar</button>
          </div>
        ):(
          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Nombre</label><input name="nombre" value={f.nombre} onChange={h} placeholder="Nombre completo" required style={S.inp}/></div>
            <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Teléfono</label><input name="telefono" type="tel" value={f.telefono} onChange={h} placeholder="977134583" required style={S.inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Distrito</label><select name="distrito" value={f.distrito} onChange={h} required style={S.inp}><option value="">Seleccionar</option>{DIST.map(d=><option key={d}>{d}</option>)}</select></div>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Servicio</label><select name="servicio" value={f.servicio} onChange={h} required style={S.inp}><option value="">Seleccionar</option>{SVCS.map(s=><option key={s.id} value={s.t}>{s.t}</option>)}</select></div>
            </div>
            <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Dirección</label><input name="direccion" value={f.direccion} onChange={h} placeholder="Av. El Sol 123" required style={S.inp}/></div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Fecha</label><input name="fecha" type="date" value={f.fecha} onChange={h} required style={S.inp}/></div>
              <div><label style={{display:"block",fontSize:13,fontWeight:600,color:"#24444d",marginBottom:6}}>Hora</label><input name="hora" type="time" value={f.hora} onChange={h} required style={S.inp}/></div>
            </div>
            <button type="submit" style={{...S.btn1,width:"100%",justifyContent:"center",marginTop:4}}>Agendar Cita</button>
          </form>
        )}
      </div>
      <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

function ChatBot(){
  const[open,setOpen]=useState(false);
  const[msgs,setMsgs]=useState([]);
  const[step,setStep]=useState("init");
  const[draft,setDraft]=useState({service:"",district:"",time:"",phone:""});
  const endRef=useRef(null);
  const MENU=[
    {id:"1",label:"Solicitar atención"},
    {id:"2",label:"Ver servicios"},
    {id:"3",label:"Cobertura"},
    {id:"4",label:"WhatsApp directo"},
  ];
  const SVC=SVCS.map((s,i)=>({id:String(i+1),label:s.t}));
  const DIST_OPTS=DIST.map((d,i)=>({id:String(i+1),label:d}));

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"})},[msgs]);
  useEffect(()=>{
    if(open&&msgs.length===0){
      setDraft({service:"",district:"",time:"",phone:""});
      setMsgs([
        {f:"b",t:"Hola. Soy el asistente virtual de Enfermería en Casa.\n\nSeleccione una opción para continuar."},
        {f:"b",t:`Opciones disponibles:\n${MENU.map(o=>`${o.id}. ${o.label}`).join("\n")}`},
      ]);
      setStep("menu");
    }
  },[open,msgs.length]);

  const add=(f,t)=>setMsgs(p=>[...p,{f,t}]);
  const optionsForStep=step==="menu"?MENU:step==="svc"?SVC:step==="dist"?DIST_OPTS:null;
  const formatOptions=items=>items.map(o=>`${o.id}. ${o.label}`).join("\n");
  const resolveOption=(value,items)=>{
    const clean=value.trim().toLowerCase();
    return items.find(o=>o.id===value.trim()||o.label.toLowerCase()===clean||`${o.id}. ${o.label}`.toLowerCase()===clean);
  };
  const reopenMenu=()=>{
    add("b",`Opciones disponibles:\n${formatOptions(MENU)}`);
    setStep("menu");
  };
  const pickOption=option=>{
    add("u",`${option.id}. ${option.label}`);
    if(step==="menu"){
      if(option.label==="Solicitar atención"||option.label==="Ver servicios"){
        setTimeout(()=>{
          add("b",`Seleccione el servicio que necesita:\n${formatOptions(SVC)}`);
          setStep("svc");
        },250);
      }else if(option.label==="Cobertura"){
        setTimeout(()=>{
          add("b",`Cobertura disponible:\n${formatOptions(DIST_OPTS)}\n\nSi su zona no aparece, escríbanos por WhatsApp.`);
          reopenMenu();
        },250);
      }else if(option.label==="WhatsApp directo"){
        setTimeout(()=>{
          add("b","Le conectaremos por WhatsApp ahora mismo.");
          add("b",`wa:https://wa.me/${WA}?text=${WAM}`);
          reopenMenu();
        },250);
      }
    }else if(step==="svc"){
      setDraft(v=>({...v,service:option.label}));
      setTimeout(()=>{
        add("b",`Servicio seleccionado: ${option.label}.\n\nSeleccione su distrito:\n${formatOptions(DIST_OPTS)}`);
        setStep("dist");
      },250);
    }else if(step==="dist"){
      setDraft(v=>({...v,district:option.label}));
      setTimeout(()=>{
        add("b",`Distrito seleccionado: ${option.label}.\n\nIndíquenos la hora en la que requiere la atención.`);
        setStep("time");
      },250);
    }
  };
  const txt=t=>{
    const current=optionsForStep;
    if(current){
      const found=resolveOption(t,current);
      if(found){
        pickOption(found);
      }else{
        add("u",t);
        add("b",`No reconocí esa opción. Seleccione una opción válida:\n${formatOptions(current)}`);
      }
      return;
    }
    add("u",t);
    if(step==="time"){
      setDraft(v=>({...v,time:t}));
      setTimeout(()=>{
        add("b","Indíquenos su teléfono de contacto.");
        setStep("phone");
      },250);
    }else if(step==="phone"){
      const next={...draft,phone:t};
      setDraft(next);
      setTimeout(()=>{
        add("b",`Solicitud registrada:\n1. Servicio: ${next.service}\n2. Distrito: ${next.district}\n3. Hora: ${next.time}\n4. Teléfono: ${next.phone}`);
        add("b","Una enfermera se pondrá en contacto con usted pronto.");
        add("b",`wa:https://wa.me/${WA}?text=${encodeURIComponent(`Hola, deseo solicitar ${next.service} en ${next.district} a las ${next.time}. Mi teléfono de contacto es ${next.phone}.`)}`);
        reopenMenu();
      },250);
    }
  };

  return(
    <>
      {!open&&<div style={{position:"fixed",bottom:18,right:18,zIndex:54,width:84,height:84,borderRadius:"50%",background:"rgba(47,156,149,.16)",pointerEvents:"none",animation:"ping 2s ease-out infinite"}}/>}
      {!open&&<div onClick={()=>setOpen(true)} style={{position:"fixed",bottom:104,right:20,zIndex:54,width:148,background:"linear-gradient(180deg,rgba(255,255,255,.98),rgba(247,252,252,.98))",color:C.text,padding:"9px 11px",borderRadius:15,border:`1px solid ${C.line}`,boxShadow:"0 10px 20px rgba(13,39,86,.09)",cursor:"pointer",animation:ENABLE_CHAT_TEASER_ANIMATION?"teaserIn .28s ease-out":"none",transformOrigin:"bottom right",willChange:ENABLE_CHAT_TEASER_ANIMATION?"transform, opacity":"auto"}}><div style={{fontSize:12,fontWeight:800,color:C.text,lineHeight:1.15}}>Chatea con nosotros</div><div style={{fontSize:10,fontWeight:700,color:C.brandDark,marginTop:6,display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:7,height:7,borderRadius:"50%",background:"#8de1bb",display:"inline-block"}}/>En línea</div></div>}
      <button onClick={()=>setOpen(!open)} style={{position:"fixed",bottom:24,right:24,zIndex:55,width:70,height:70,borderRadius:"50%",background:"linear-gradient(135deg,#2f9c95,#227a74)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 18px 38px rgba(47,156,149,.34)",border:"4px solid rgba(255,255,255,.98)",cursor:"pointer"}}>{open?<Icon name="close" size={24} color="#fff"/>:<Icon name="chat" size={28} color="#fff"/>}</button>
      {open&&<div style={{position:"fixed",bottom:98,right:16,zIndex:55,width:"min(410px,calc(100vw - 28px))",background:"#fff",borderRadius:22,boxShadow:"0 20px 54px rgba(13,39,86,.22)",border:`1px solid ${C.line}`,display:"flex",flexDirection:"column",maxHeight:"72vh",overflow:"hidden",animation:"slideIn .25s ease-out"}}>
        <div style={{background:"linear-gradient(135deg,#2f9c95,#227a74)",padding:18,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:"rgba(255,255,255,.24)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"inset 0 0 0 1px rgba(255,255,255,.18)"}}><Icon name="brand" size={20} color="#fff"/></div>
          <div style={{flex:1}}><div style={{color:"#fff",fontWeight:800,fontSize:15}}>Enfermería en Casa</div><div style={{color:"rgba(230,245,243,.92)",fontSize:12,display:"inline-flex",alignItems:"center",gap:6}}><span style={{width:8,height:8,borderRadius:"50%",background:"#b8f2dc",display:"inline-block",boxShadow:"0 0 0 4px rgba(184,242,220,.12)"}}/>En línea</div></div>
          <button onClick={()=>setOpen(false)} style={{color:"rgba(255,255,255,.7)",background:"none",border:"none",cursor:"pointer"}}><Icon name="close" size={18} color="currentColor"/></button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:14,background:"#f7fcfc",display:"flex",flexDirection:"column",gap:10,minHeight:180}}>
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.f==="u"?"flex-end":"flex-start"}}>
            {m.t.startsWith("wa:")?<a href={m.t.replace("wa:","")} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:6,padding:"10px 16px",background:"#2b8f78",color:"#fff",borderRadius:12,fontSize:13,fontWeight:600}}><Icon name="whatsapp" size={14} color="#fff"/>WhatsApp</a>:
            <div style={{maxWidth:"84%",padding:"10px 16px",borderRadius:16,fontSize:13,lineHeight:1.6,whiteSpace:"pre-line",...(m.f==="u"?{background:"linear-gradient(135deg,#2f9c95,#227a74)",color:"#fff",borderBottomRightRadius:4}:{background:"#fff",color:"#24444d",border:"1px solid #d6e6e5",borderBottomLeftRadius:4})}}>{m.t}</div>}
          </div>)}
          <div ref={endRef}/>
        </div>
        <div style={{padding:12,borderTop:`1px solid ${C.line}`,background:"#fff"}}>
          {optionsForStep&&<>
            <div style={{fontSize:12,color:C.muted,fontWeight:700,marginBottom:8}}>Seleccione una opción o escriba el número.</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>{optionsForStep.map(o=><button key={o.id} onClick={()=>pickOption(o)} style={{padding:"8px 14px",borderRadius:50,fontSize:12,fontWeight:700,background:"#eef9f7",color:"#227a74",border:"1px solid #c9ece7",cursor:"pointer",boxShadow:"0 4px 10px rgba(47,156,149,.08)"}}>{`${o.id}. ${o.label}`}</button>)}</div>
          </>}
          <div style={{display:"flex",gap:8}}><input id="ci" onKeyDown={e=>{if(e.key==="Enter"&&e.target.value.trim()){txt(e.target.value.trim());e.target.value=""}}} placeholder={optionsForStep?"Escriba el número de la opción...":"Escriba su mensaje..."} style={{...S.inp,flex:1,padding:"10px 14px",fontSize:13}}/><button onClick={()=>{const el=document.getElementById("ci");if(el?.value.trim()){txt(el.value.trim());el.value=""}}} style={{padding:10,borderRadius:12,background:"linear-gradient(135deg,#2f9c95,#227a74)",color:"#fff",border:"none",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center"}}><Icon name="send" size={16} color="#fff"/></button></div>
        </div>
      </div>}
      <style>{`@keyframes ping{0%{transform:scale(1);opacity:.5}100%{transform:scale(1.8);opacity:0}}@keyframes slideIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes teaserIn{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
    </>
  );
}

function WABtn(){
  return<a href={`https://wa.me/${WA}?text=${WAM}`} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:24,left:24,zIndex:55,width:56,height:56,borderRadius:"50%",background:"#2b8f78",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(16,185,129,.3)"}}><Icon name="whatsapp" size={22} color="#fff"/></a>;
}

export default function App(){
  const[fo,setFo]=useState(false);
  const[ss,setSs]=useState("");
  const open=(s="")=>{setSs(s);setFo(true)};
  return(
    <div style={{minHeight:"100vh",background:"#fff",fontFamily:"'Nunito Sans',system-ui,sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <Navbar onReq={()=>open()}/>
      <Hero onReq={()=>open()}/>
      <TrustBar/>
      <About/>
      <Services onSvc={s=>open(s)}/>
      <HowItWorks/>
      <Testimonials/>
      <Coverage/>
      <Faq/>
      <CTA onReq={()=>open()}/>
      <Footer/>
      <RequestForm isOpen={fo} onClose={()=>setFo(false)} pre={ss}/>
      <ChatBot/>
      <WABtn/>
    </div>
  );
}































