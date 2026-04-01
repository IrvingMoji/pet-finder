"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  useEffect(() => {
    const fetch = async () => {
      if (user) {
        const notifs = await dataService.getNotifications(user.id);
        setNotifications(notifs);
        setFetching(false);
      }
    };
    fetch();
  }, [user]);

  const markAsRead = async (id) => {
    const success = await dataService.markNotificationAsRead(id);
    if (success) {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(unread.map(n => dataService.markNotificationAsRead(n.id)));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <main style={{ maxWidth: "700px", margin: "0 auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>🔔 Notificaciones</h1>
          {unreadCount > 0 && (
            <p style={{ margin: "0.25rem 0 0", color: "var(--text-light)", fontSize: "0.9rem" }}>
              Tienes <strong style={{ color: "var(--primary)" }}>{unreadCount}</strong> notificaci{unreadCount === 1 ? "ón" : "ones"} sin leer
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.5rem 1rem",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
              color: "var(--text-light)",
              transition: "all 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.borderColor = "var(--primary)"}
            onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            Marcar todas como leídas
          </button>
        )}
      </header>

      {/* Notification List */}
      {fetching ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-light)" }}>Cargando notificaciones...</div>
      ) : notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📭</div>
          <h3 style={{ color: "var(--text-light)", fontWeight: "600" }}>No tienes notificaciones</h3>
          <p style={{ color: "var(--text-light)" }}>Cuando alguien reporte que vio a una de tus mascotas, te avisaremos aquí.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {notifications.map(n => (
            <div
              key={n.id}
              className="card"
              style={{
                padding: "1.25rem 1.5rem",
                borderLeft: n.read ? "4px solid var(--border)" : "4px solid var(--primary)",
                background: n.read ? "var(--surface)" : "#FFF5F5",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem"
              }}
            >
              {/* Badge + Message */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>
                  {n.read ? "📬" : "📩"}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    margin: 0,
                    fontWeight: n.read ? "400" : "600",
                    color: "var(--text)",
                    lineHeight: "1.5"
                  }}>
                    {n.message}
                  </p>
                  {!n.read && (
                    <span style={{
                      display: "inline-block",
                      marginTop: "0.4rem",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      color: "var(--primary)",
                      background: "rgba(255, 107, 107, 0.1)",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "20px"
                    }}>
                      NUEVA
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                {n.reporterId && (
                  <Link
                    href={`/chat?with=${n.reporterId}`}
                    className="btn btn-primary"
                    style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", textDecoration: "none" }}
                  >
                    💬 Ir al Chat
                  </Link>
                )}
                <Link
                  href="/pets"
                  style={{
                    padding: "0.4rem 1rem",
                    fontSize: "0.85rem",
                    textDecoration: "none",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    color: "var(--text-light)",
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center"
                  }}
                >
                  🐾 Mis Mascotas
                </Link>
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-light)",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "600",
                      padding: "0.4rem 0",
                      textDecoration: "underline"
                    }}
                  >
                    Marcar como leída
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
