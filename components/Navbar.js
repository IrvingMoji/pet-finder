"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      padding: "1rem 2rem",
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
      boxShadow: "var(--shadow)"
    }}>
      <Link href="/" style={{
        fontSize: "1.5rem",
        fontWeight: "700",
        color: "var(--primary)",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem"
      }}>
        🐾 PetFinder
      </Link>
      
      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <Link href="/lost" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Reportar Extravío</Link>
        <Link href="/spotted" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Vi una Mascota</Link>
        {user && <Link href="/pets" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Mis Mascotas</Link>}
        {user && <Link href="/chat" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Mensajes</Link>}
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <Link href="/profile" style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem", 
              textDecoration: "none",
              background: "rgba(255, 71, 87, 0.05)",
              padding: "0.4rem 0.8rem",
              borderRadius: "2rem",
              border: "1px solid rgba(255, 71, 87, 0.1)",
              transition: "all 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "rgba(255, 71, 87, 0.1)"}
            onMouseOut={(e) => e.currentTarget.style.background = "rgba(255, 71, 87, 0.05)"}
            >
              {user.photo ? (
                <img src={user.photo} alt={user.name} style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div style={{ 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  background: "var(--primary)", 
                  color: "white", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontSize: "0.85rem",
                  fontWeight: "bold" 
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text)" }}>{user.name}</span>
            </Link>
          </div>
        ) : (
          <Link href="/auth" className="btn btn-primary" style={{ padding: "0.5rem 1rem" }}>
            Ingresar
          </Link>
        )}
      </div>
    </nav>
  );
}
