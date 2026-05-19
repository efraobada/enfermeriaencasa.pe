import { AuthProvider, useAuth } from "./staff/AuthContext";
import EnfermeriaADomicilio from "./enfermeria-cusco";
import Gracias from "./Gracias";
import Dashboard from "./staff/Dashboard";

function Router() {
  const { user, loading } = useAuth();
  const path = window.location.pathname;

  if (path === "/panel" || path.startsWith("/panel/")) {
    if (loading) return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui",color:"#607089",fontSize:14}}>
        Verificando sesión...
      </div>
    );
    if (!user) {
      window.location.href = "/";
      return null;
    }
    return <Dashboard />;
  }

  if (path === "/gracias" || path === "/gracias/") return <Gracias />;

  return <EnfermeriaADomicilio />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
