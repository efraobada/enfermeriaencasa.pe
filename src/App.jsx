import EnfermeriaADomicilio from "./enfermeria-cusco";
import Gracias from "./Gracias";

function App() {
  const path = window.location.pathname;

  if (path === "/gracias" || path === "/gracias/") {
    return <Gracias />;
  }

  return <EnfermeriaADomicilio />;
}

export default App;
