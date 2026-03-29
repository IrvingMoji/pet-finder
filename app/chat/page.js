"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { dataService } from "@/lib/dataService";

function ChatContent() {
  const searchParams = useSearchParams();
  const withPetId = searchParams.get("with");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [pet, setPet] = useState(null);

  useEffect(() => {
    const fetchPetAndMessages = async () => {
      if (withPetId) {
        // En un escenario real buscaríamos por petId, aquí reutilizamos getAllLostPets para encontrarlo
        const lostPets = await dataService.getAllLostPets();
        const foundPet = lostPets.find(p => p.id === withPetId);
        setPet(foundPet);

        const savedMessages = JSON.parse(localStorage.getItem(`msgs_${withPetId}`) || "[]");
        setMessages(savedMessages);
      }
    };
    fetchPetAndMessages();
  }, [withPetId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = {
      id: Date.now(),
      text: newMessage,
      sender: 'reporter', // Simulation: current user is the reporter
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...messages, msg];
    setMessages(updated);
    localStorage.setItem(`msgs_${withPetId}`, JSON.stringify(updated));
    setNewMessage("");

    // Simulate auto-reply from owner
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        text: "¡Hola! Muchísimas gracias por contactar. ¿Podrías darme más detalles de dónde lo viste exactamente?",
        sender: 'owner',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const final = [...updated, reply];
      setMessages(final);
      localStorage.setItem(`msgs_${withPetId}`, JSON.stringify(final));
    }, 1500);
  };

  if (!pet) return <main><p>Cargando chat...</p></main>;

  return (
    <main style={{ maxWidth: "600px", height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", gap: "1rem", borderBottom: "1px solid var(--border)", paddingBottom: "1rem" }}>
        <img src={pet.photo} alt={pet.name} style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover" }} />
        <div>
          <h2 style={{ margin: 0 }}>Dueño de {pet.name}</h2>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--secondary)" }}>En línea</p>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 0", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--text-light)" }}>Inicia la conversación para ayudar a {pet.name}.</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} style={{
            alignSelf: msg.sender === 'reporter' ? 'flex-end' : 'flex-start',
            maxWidth: "80%",
            background: msg.sender === 'reporter' ? 'var(--primary)' : 'var(--surface)',
            color: msg.sender === 'reporter' ? 'white' : 'var(--text)',
            padding: "0.75rem 1rem",
            borderRadius: msg.sender === 'reporter' ? "15px 15px 0 15px" : "15px 15px 15px 0",
            boxShadow: "var(--shadow)",
            position: "relative"
          }}>
            {msg.text}
            <span style={{ 
              fontSize: "0.65rem", 
              position: "absolute", 
              bottom: "-1.2rem", 
              right: msg.sender === 'reporter' ? "0" : "auto",
              left: msg.sender === 'owner' ? "0" : "auto",
              color: "var(--text-light)" 
            }}>
              {msg.timestamp}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "0.5rem", padding: "1rem 0" }}>
        <input 
          className="input" 
          placeholder="Escribe un mensaje..." 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Enviar</button>
      </form>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<p>Cargando...</p>}>
      <ChatContent />
    </Suspense>
  );
}
