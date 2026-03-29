"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <main style={{ maxWidth: "600px", margin: "2rem auto" }}>
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {user.photo ? (
            <img 
              src={user.photo} 
              alt={user.name} 
              style={{ 
                width: "120px", 
                height: "120px", 
                borderRadius: "50%", 
                border: "4px solid white", 
                boxShadow: "var(--shadow-lg)",
                objectFit: "cover" 
              }} 
            />
          ) : (
            <div style={{ 
              width: "120px", 
              height: "120px", 
              borderRadius: "50%", 
              background: "var(--primary)", 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontSize: "3rem", 
              fontWeight: "bold",
              boxShadow: "var(--shadow-lg)"
            }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 style={{ marginTop: "1.5rem", fontSize: "2rem" }}>{user.name}</h1>
        <p style={{ 
          color: "var(--text-muted)", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: "0.5rem",
          fontSize: "1.1rem"
        }}>
          {user.provider === 'google.com' ? (
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px" }} />
          ) : (
            <span style={{ fontSize: "1.2rem", filter: "grayscale(100%)", opacity: 0.7 }}>📧</span>
          )}
          {user.email}
        </p>
      </header>

      <section className="card" style={{ padding: "2rem" }}>
        <h2 style={{ marginBottom: "1.5rem", fontSize: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: "0.5rem" }}>
          Datos de la Cuenta
        </h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: "600", fontSize: "0.9rem", margin: 0 }}>Nombre</p>
              <p style={{ margin: 0, color: "var(--text)" }}>{user.name}</p>
            </div>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: "600", fontSize: "0.9rem", margin: 0 }}>Email</p>
              <p style={{ margin: 0, color: "var(--text)" }}>{user.email}</p>
            </div>
            <span style={{ 
              fontSize: "0.75rem", 
              background: "rgba(46, 213, 115, 0.1)", 
              color: "#2ed573", 
              padding: "0.25rem 0.5rem", 
              borderRadius: "1rem" 
            }}>
              Verificado
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontWeight: "600", fontSize: "0.9rem", margin: 0 }}>ID de Usuario</p>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem", fontFamily: "monospace" }}>{user.id}</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: "3rem", display: "flex", gap: "1rem" }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, padding: "0.8rem" }}
            onClick={() => router.push("/pets")}
          >
            Ver mis mascotas
          </button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1, padding: "0.8rem" }}
            onClick={handleLogout}
          >
            Cerrar Sesión
          </button>
        </div>
      </section>

      <footer style={{ marginTop: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
        Pet Finder • Tu seguridad es nuestra prioridad
      </footer>
    </main>
  );
}
