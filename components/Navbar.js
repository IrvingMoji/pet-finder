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
        <Link href="/lost" style={{ fontWeight: "500", color: "var(--text)" }}>Reportar Extravío</Link>
        <Link href="/spotted" style={{ fontWeight: "500", color: "var(--text)" }}>Vi una Mascota</Link>
        {user && <Link href="/pets" style={{ fontWeight: "500", color: "var(--text)" }}>Mis Mascotas</Link>}
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Hola, {user.name}</span>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: "0.5rem 1rem" }}>
              Salir
            </button>
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
