import { createContext, useContext, useState, useEffect } from "react";

const API = "/api";
const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem("staff_token");
    if (!t) { setLoading(false); return; }
    fetch(`${API}/auth.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${t}`, "X-Staff-Token": t },
      body: JSON.stringify({ action: "validate" }),
    })
      .then(r => r.json())
      .then(d => { if (d.ok) setUser(d.user); else localStorage.removeItem("staff_token"); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const r = await fetch(`${API}/auth.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });
    const d = await r.json();
    if (!d.ok) throw new Error(d.message || "Credenciales incorrectas");
    localStorage.setItem("staff_token", d.token);
    setUser(d.user);
  };

  const logout = async () => {
    const t = localStorage.getItem("staff_token");
    if (t) {
      fetch(`${API}/auth.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        body: JSON.stringify({ action: "logout" }),
      }).catch(() => {});
    }
    localStorage.removeItem("staff_token");
    setUser(null);
    window.location.href = "/";
  };

  const authFetch = (url, opts = {}) => {
    const t = localStorage.getItem("staff_token") || "";
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${t}`,
        "X-Staff-Token": t,
        ...(opts.headers || {}),
      },
    });
  };

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, authFetch }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
