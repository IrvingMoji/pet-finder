"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { dataService } from "@/lib/dataService";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones no leídas para mostrar la insignia
  useEffect(() => {
    const fetchUnread = async () => {
      if (user) {
        const notifs = await dataService.getNotifications(user.id);
        setUnreadCount(notifs.filter(n => !n.read).length);
      } else {
        setUnreadCount(0);
      }
    };
    fetchUnread();
  }, [user, pathname]); // Re-check badge on every page change

  return (
    <>
      <nav className="top-nav" style={{
        padding: "0.75rem 1.5rem",
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
        {/* Logo */}
        <Link href="/" style={{
          fontSize: "1.5rem",
          fontWeight: "700",
          color: "var(--primary)",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          textDecoration: "none"
        }}>
          🐾 PetFinder
        </Link>

        {/* Desktop Navigation Links */}
        <div className="desktop-only" style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link href="/lost" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Reportar Extravío</Link>
          <Link href="/spotted" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Vi una Mascota</Link>
          {user && <Link href="/pets" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Mis Mascotas</Link>}
          {user && <Link href="/chat" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none" }}>Mensajes</Link>}
          {user && (
            <Link href="/notifications" style={{ fontWeight: "500", color: "var(--text)", textDecoration: "none", display: "flex", alignItems: "center", gap: "0.4rem", position: "relative" }}>
              Notificaciones
              {unreadCount > 0 && (
                <span style={{
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}

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

        {/* === Mobile: Right side icons (Bell + Avatar) === */}
        {user && (
          <div className="mobile-only" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            {/* Bell icon with badge */}
            <Link href="/notifications" style={{ position: "relative", color: pathname === "/notifications" ? "var(--primary)" : "var(--text-light)", display: "flex" }}>
              <svg viewBox="0 0 24 24" style={{ width: "26px", height: "26px", fill: "currentColor" }}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--primary)",
                  color: "white",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  fontSize: "0.6rem",
                  fontWeight: "700",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid var(--surface)"
                }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User Avatar */}
            <Link href="/profile" style={{ display: "flex", textDecoration: "none" }}>
              {user.photo ? (
                <img src={user.photo} alt={user.name} style={{ width: "34px", height: "34px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary)" }} />
              ) : (
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.9rem",
                  fontWeight: "bold"
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
          </div>
        )}
        {!user && (
          <Link href="/auth" className="mobile-only btn btn-primary" style={{ padding: "0.4rem 0.9rem", fontSize: "0.9rem" }}>
            Ingresar
          </Link>
        )}
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="bottom-nav mobile-only">
        <Link href="/" className={`bottom-nav-item ${pathname === '/' ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
          <span>Inicio</span>
        </Link>
        <Link href="/lost" className={`bottom-nav-item ${pathname === '/lost' ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <span>Extraviada</span>
        </Link>
        <Link href="/spotted" className={`bottom-nav-item ${pathname === '/spotted' ? 'active' : ''}`}>
          <svg viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" /></svg>
          <span>Vi a uno</span>
        </Link>
        {user ? (
          <>
            <Link href="/chat" className={`bottom-nav-item ${pathname === '/chat' ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" /></svg>
              <span>Chat</span>
            </Link>
            <Link href="/pets" className={`bottom-nav-item ${pathname === '/pets' ? 'active' : ''}`}>
              <svg viewBox="0 0 24 24"><path d="M4.5 11c.83 0 1.5-.67 1.5-1.5v-3C6 5.67 5.33 5 4.5 5S3 5.67 3 6.5v3C3 10.33 3.67 11 4.5 11zm5-1.5c.83 0 1.5-.67 1.5-1.5V5c0-.83-.67-1.5-1.5-1.5S8 4.17 8 5v3c0 .83.67 1.5 1.5 1.5zm5.5 0c.83 0 1.5-.67 1.5-1.5v-3C16.5 5.17 15.83 4.5 15 4.5S13.5 5.17 13.5 6v3c0 .83.67 1.5 1.5 1.5zM20 6.5c0-.83-.67-1.5-1.5-1.5S17 5.67 17 6.5v3c0 .83.67 1.5 1.5 1.5S20 10.33 20 9.5v-3zM12 13c-2.5 0-7.5 1.67-7.5 4v1.5c0 .28.22.5.5.5h14c.28 0 .5-.22.5-.5V17c0-2.33-5-4-7.5-4z"/></svg>
              <span>Mascotas</span>
            </Link>
          </>
        ) : (
          <Link href="/auth" className={`bottom-nav-item ${pathname === '/auth' ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            <span>Ingresar</span>
          </Link>
        )}
      </nav>
    </>
  );
}
