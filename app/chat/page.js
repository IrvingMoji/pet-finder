"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import { useRouter, useSearchParams } from "next/navigation";

function ChatContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetUserId = searchParams.get("with");
  
  const [chats, setChats] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [sharedLocation, setSharedLocation] = useState(null);
  const [showGallery, setShowGallery] = useState(false);
  const messagesEndRef = useRef(null);

  // Redirección si no hay sesión
  useEffect(() => {
    if (!loading && !user) router.push("/auth");
  }, [user, loading, router]);

  // Lógica CSS Global para ocultar Navbar en móvil cuando el chat está activo
  useEffect(() => {
    if (activeChat) {
      document.body.classList.add("chat-active");
    } else {
      document.body.classList.remove("chat-active");
    }
    return () => document.body.classList.remove("chat-active");
  }, [activeChat]);

  // Escuchar lista de chats del usuario
  useEffect(() => {
    if (!user) return;
    const unsubscribe = dataService.listenToUserChats(user.id, (userChats) => {
      setChats(userChats);
      
      // Obtener perfiles de los otros participantes
      userChats.forEach(chat => {
        const otherId = chat.participants.find(id => id !== user.id);
        if (otherId && !userProfiles[otherId]) {
          dataService.getUserProfile(otherId).then(profile => {
            if (profile) {
              setUserProfiles(prev => ({ ...prev, [otherId]: profile }));
            }
          });
        }
      });

      // Si venimos de un enlace "with", buscar o crear el chat
      if (targetUserId && !activeChat) {
        const existingChat = userChats.find(c => c.participants.includes(targetUserId));
        if (existingChat) {
          setActiveChat(existingChat);
        } else {
          // Crear chat si no existe
          dataService.getOrCreateChat(user.id, targetUserId).then(newChat => {
            setActiveChat(newChat);
          });
        }
      }
    });
    return () => unsubscribe();
  }, [user, targetUserId, activeChat, userProfiles]);

  // Escuchar mensajes del chat activo
  useEffect(() => {
    if (!activeChat) return;
    const unsubscribe = dataService.listenToMessages(activeChat.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsubscribe();
  }, [activeChat]);

  // Recuperar fotos y ubicación compartidas al abrir un chat
  useEffect(() => {
    if (activeChat && user) {
      const otherId = activeChat.participants.find(id => id !== user.id);
      dataService.getSharedPhotos(user.id, otherId).then(setSharedPhotos);
      dataService.getSharedLocation(user.id, otherId).then(setSharedLocation);
    } else {
      setSharedPhotos([]);
      setSharedLocation(null);
    }
  }, [activeChat, user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user) return;
    
    const text = newMessage;
    setNewMessage("");
    await dataService.sendMessage(activeChat.id, user.id, text);
  };

  const getUserName = (userId) => userProfiles[userId]?.name || `Usuario ${userId?.substring(0, 5)}...`;
  const getUserPhoto = (userId) => userProfiles[userId]?.photo || null;

  if (loading || !user) return <div style={{ padding: "4rem", textAlign: "center" }}>Cargando...</div>;

  return (
    <main className="chat-container">
      {/* Sidebar - Lista de Chats */}
      <div className={`chat-sidebar-wrapper ${activeChat ? 'mobile-hidden' : ''}`}>
        <section className="card" style={{ padding: 0, overflowY: "auto", display: "flex", flexDirection: "column", border: "1px solid var(--border)", flex: 1 }}>
        <h2 style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", margin: 0, fontSize: "1.2rem" }}>Mensajes</h2>
        <div style={{ flex: 1 }}>
          {chats.length === 0 ? (
            <div style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--text-light)" }}>
              <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💬</div>
              <p style={{ fontSize: "0.9rem" }}>No tienes conversaciones activas.</p>
            </div>
          ) : (
            chats.map(chat => {
              const otherId = chat.participants.find(id => id !== user.id);
              const profile = userProfiles[otherId];
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  style={{ 
                    padding: "1.2rem 1.5rem", 
                    cursor: "pointer", 
                    borderBottom: "1px solid var(--border)",
                    background: activeChat?.id === chat.id ? "rgba(255, 107, 107, 0.08)" : "transparent",
                    transition: "all 0.2s",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center"
                  }}
                >
                  <div style={{ 
                    width: "45px", 
                    height: "45px", 
                    borderRadius: "50%", 
                    background: "var(--secondary)", 
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white"
                  }}>
                    {profile?.photo ? (
                      <img 
                        src={profile.photo} 
                        alt="Avatar" 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = `https://ui-avatars.com/api/?name=${profile?.name || "?"}&background=FF6B6B&color=fff`; 
                        }}
                      />
                    ) : (
                      profile?.name?.charAt(0) || "?"
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                      <span style={{ fontWeight: "700", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {profile?.name || `Usuario ${otherId.substring(0, 5)}...`}
                      </span>
                    </div>
                    <p style={{ 
                      margin: 0, 
                      fontSize: "0.85rem", 
                      color: "var(--text-light)", 
                      whiteSpace: "nowrap", 
                      overflow: "hidden", 
                      textOverflow: "ellipsis" 
                    }}>
                      {chat.lastMessage || "Empezar chat..."}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </section>
      </div>

      {/* Ventana de Chat */}
      <div className={`chat-window-wrapper ${!activeChat ? 'mobile-hidden' : ''}`}>
        <section className="card" style={{ padding: 0, display: "flex", flexDirection: "column", background: "white", border: "1px solid var(--border)", flex: 1 }}>
          {activeChat ? (
            <>
              <header style={{ position: "sticky", top: 0, zIndex: 10, padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem", background: "#fcfcfc" }}>
                <button 
                  className="mobile-only"
                  style={{ background: "transparent", border: "none", fontSize: "1.5rem", color: "var(--text-light)", padding: "0 0.5rem 0 0", cursor: "pointer", display: "flex", alignItems: "center" }}
                  onClick={() => {
                    setActiveChat(null);
                    router.replace("/chat"); // Limpia el ?with= de la URL
                  }}
                >
                  <svg viewBox="0 0 24 24" style={{ width: "24px", height: "24px", fill: "currentColor" }}><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
                </button>
                <div style={{ width: "45px", height: "45px", flexShrink: 0, borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", overflow: "hidden" }}>
                {getUserPhoto(activeChat.participants.find(id => id !== user.id)) ? (
                  <img 
                    src={getUserPhoto(activeChat.participants.find(id => id !== user.id))} 
                    alt="Avatar" 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                    onError={(e) => { 
                      e.target.onerror = null; 
                      e.target.src = `https://ui-avatars.com/api/?name=${getUserName(activeChat.participants.find(id => id !== user.id))}&background=FF6B6B&color=fff`; 
                    }}
                  />
                ) : (
                  getUserName(activeChat.participants.find(id => id !== user.id)).charAt(0)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700" }}>{getUserName(activeChat.participants.find(id => id !== user.id))}</h3>
                <span style={{ fontSize: "0.75rem", color: "#2ecc71", fontWeight: "600" }}>● En línea</span>
              </div>
              {sharedPhotos.length > 0 && (
                <button 
                  className="btn" 
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem", border: "1px solid var(--secondary)", background: "white", color: "var(--secondary)", fontWeight: "600", borderRadius: "8px" }}
                  onClick={() => setShowGallery(true)}
                >
                  📸 Galería ({sharedPhotos.length})
                </button>
              )}
              {sharedLocation && (
                <a
                  href={`https://maps.google.com/?q=${sharedLocation.lat},${sharedLocation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem", border: "1px solid var(--primary)", background: "white", color: "var(--primary)", fontWeight: "600", borderRadius: "8px", textDecoration: "none" }}
                >
                  📍 Ubicación
                </a>
              )}
            </header>

            {/* Mensajes */}
            <div style={{ 
              flex: 1, 
              padding: "2rem", 
              overflowY: "auto", 
              display: "flex", 
              flexDirection: "column", 
              gap: "1.2rem",
              background: "#fafafa" 
            }}>
              {messages.map((msg, i) => {
                const isMine = msg.senderId === user.id;
                return (
                  <div key={i} style={{ 
                    alignSelf: isMine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    padding: "0.8rem 1.2rem",
                    borderRadius: isMine ? "20px 20px 2px 20px" : "20px 20px 20px 2px",
                    background: isMine ? "var(--primary)" : "white",
                    color: isMine ? "white" : "var(--text)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    border: isMine ? "none" : "1px solid #eee"
                  }}>
                    <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: "1.4", color: "inherit" }}>{msg.text}</p>
                    <span style={{ fontSize: "0.65rem", opacity: 0.8, marginTop: "0.4rem", display: "block", textAlign: "right", color: "inherit" }}>
                      {msg.createdAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ padding: "1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: "1rem", background: "white" }}>
              <input 
                className="input"
                type="text" 
                placeholder="Escribe un mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                style={{ flex: 1, height: "50px", borderRadius: "25px", padding: "0 1.5rem" }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: "0 2rem", borderRadius: "25px" }}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-light)", padding: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>📬</div>
            <h3>Tu bandeja de mensajes</h3>
            <p>Selecciona una conversación del lateral para empezar a chatear en tiempo real con otros usuarios de Pet Finder.</p>
          </div>
        )}
        </section>
      </div>

      {/* Modal de Galería */}
      {showGallery && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "2rem"
        }}>
          <div style={{ position: "relative", maxWidth: "800px", width: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <button 
              onClick={() => setShowGallery(false)}
              style={{ position: "absolute", top: "-40px", right: "0", background: "none", border: "none", color: "white", fontSize: "2rem", cursor: "pointer", padding: "0" }}
            >
              &times;
            </button>
            <div style={{ display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "1rem", scrollSnapType: "x mandatory", msOverflowStyle: "none", scrollbarWidth: "none" }}>
              {sharedPhotos.map((photo, idx) => (
                <div key={photo.id || idx} style={{ minWidth: "100%", scrollSnapAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={photo.url} alt="Evidencia de Avistamiento" style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "8px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
                  <span style={{ color: "white", marginTop: "1rem", fontSize: "0.9rem", opacity: 0.8 }}>
                    {photo.date ? photo.date.toLocaleString() : "Avistamiento reportado"}
                  </span>
                </div>
              ))}
            </div>
            {sharedPhotos.length > 1 && (
              <p style={{ color: "white", textAlign: "center", marginTop: "0.5rem", opacity: 0.6, fontSize: "0.85rem" }}>Desliza lateralmente para ver más fotos</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ padding: "4rem", textAlign: "center" }}>Cargando componentes...</div>}>
      <ChatContent />
    </Suspense>
  );
}
