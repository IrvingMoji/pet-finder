"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { login, signup, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      const resp = await login(formData.email, formData.password);
      if (resp.success) router.push("/");
      else setError(resp.message);
    } else {
      const resp = await signup(formData.name, formData.email, formData.password);
      if (resp.success) router.push("/");
      else setError(resp.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    const resp = await loginWithGoogle();
    if (resp.success) router.push("/");
    else setError(resp.message);
  };

  return (
    <main style={{ maxWidth: "450px", margin: "4rem auto" }}>
      <div className="card">
        <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
          {isLogin ? "Iniciar Sesión" : "Crear Cuenta"}
        </h1>
        
        {error && <p style={{ color: "red", textAlign: "center", marginBottom: "1rem" }}>{error}</p>}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {!isLogin && (
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem" }}>Nombre Completo</label>
              <input 
                className="input" 
                type="text" 
                required 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Correo Electrónico</label>
            <input 
              className="input" 
              type="email" 
              required 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>Contraseña</label>
            <input 
              className="input" 
              type="password" 
              required 
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ padding: "1rem" }}>
            {isLogin ? "Entrar" : "Registrarse"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", margin: "1.5rem 0", color: "#888" }}>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border)" }} />
          <span style={{ padding: "0 1rem", fontSize: "0.85rem" }}>O continúa con</span>
          <hr style={{ flex: 1, border: "0", borderTop: "1px solid var(--border)" }} />
        </div>

        <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
          <button 
            onClick={handleGoogleLogin}
            className="btn btn-secondary" 
            style={{ 
              width: "50px", 
              height: "50px", 
              borderRadius: "50%",
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: "0",
              background: "white",
              border: "1px solid var(--border)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "transform 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            title="Inicia sesión con Google"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "24px" }} />
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: "2rem" }}>
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}
          <button 
            style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "600", cursor: "pointer", marginLeft: "0.5rem" }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Regístrate" : "Inicia Sesión"}
          </button>
        </p>
      </div>
    </main>
  );
}
