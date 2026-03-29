"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { compressImage } from "@/lib/imageUtils";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { 
  ssr: false,
  loading: () => <div style={{ height: "300px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div>
});

export default function PetsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showLostModal, setShowLostModal] = useState(null);
  const [lostInfo, setLostInfo] = useState({ date: "", location: "", coords: null, notes: "" });
  const [newPet, setNewPet] = useState({ name: "", type: "", breed: "", photo: null });

  const handleLocationSelect = useCallback((coords) => {
    setLostInfo(prev => ({ ...prev, coords }));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userPets = await dataService.getUserPets(user.id);
        const userNotifs = await dataService.getNotifications(user.id);
        setPets(userPets);
        setNotifications(userNotifs);
      }
    };
    fetchData();
  }, [user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const optimizedImage = await compressImage(file);
        setNewPet({ ...newPet, photo: optimizedImage });
      } catch (error) {
        console.error("Error comprimiendo imagen:", error);
        alert("Error al procesar la imagen. Intenta con otra.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const pet = await dataService.savePet(user.id, { ...newPet, status: 'safe' });
      setPets([...pets, pet]);
      setShowForm(false);
      setNewPet({ name: "", type: "", breed: "", photo: null });
    } catch (error) {
      alert("Error al guardar la mascota.");
    }
  };

  const handleReportLost = async (e) => {
    e.preventDefault();
    if (!user || !showLostModal) return;

    const success = await dataService.updatePetStatus(showLostModal.id, 'lost', lostInfo);
    
    if (success) {
      const updatedPets = await dataService.getUserPets(user.id);
      setPets(updatedPets);
      setShowLostModal(null);
      setLostInfo({ date: "", location: "", coords: null, notes: "" });
    } else {
      alert("Error al reportar extravío.");
    }
  };

  const markAsRead = async (id) => {
    const success = await dataService.markNotificationAsRead(id);
    if (success) {
      const userNotifs = await dataService.getNotifications(user.id);
      setNotifications(userNotifs);
    }
  };

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  return (
    <main>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Mis Mascotas</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "Registrar Mascota"}
        </button>
      </header>

      {notifications.length > 0 && (
        <section style={{ marginBottom: "3rem" }}>
          <h2>Notificaciones</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {notifications.map(n => (
              <div key={n.id} className="card" style={{ 
                borderLeft: n.read ? "1px solid var(--border)" : "5px solid var(--primary)",
                background: n.read ? "var(--surface)" : "#FFF5F5",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <div>
                  <p style={{ margin: 0, fontWeight: n.read ? "400" : "600", color: "var(--text)" }}>{n.message}</p>
                </div>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <a href={`/chat?with=${n.ownerPetId}`} className="btn btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>
                    Ir al Chat
                  </a>
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", fontWeight: "600" }}>
                      Marcar como leída
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <section className="card" style={{ maxWidth: "500px", margin: "0 auto 3rem" }}>
          <h2>Nueva Mascota</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Nombre</label>
              <input 
                className="input" 
                type="text" 
                required 
                value={newPet.name}
                onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                placeholder="Ej. Max"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Tipo</label>
              <select 
                className="input" 
                required
                value={newPet.type}
                onChange={(e) => setNewPet({ ...newPet, type: e.target.value })}
              >
                <option value="">Selecciona tipo</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Raza</label>
              <input 
                className="input" 
                type="text" 
                value={newPet.breed}
                onChange={(e) => setNewPet({ ...newPet, breed: e.target.value })}
                placeholder="Ej. Labrador"
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Foto</label>
              <input 
                className="input" 
                type="file" 
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {newPet.photo && (
                <img src={newPet.photo} alt="Preview" style={{ width: "100%", height: "200px", objectFit: "cover", marginTop: "1rem", borderRadius: "var(--radius)" }} />
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: "1rem" }}>Guardar Mascota</button>
          </form>
        </section>
      )}

      <section style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
        gap: "2rem" 
      }}>
        {pets.length === 0 ? (
          <p style={{ gridColumn: "1/-1", textAlign: "center", padding: "4rem" }}>
            Aún no tienes mascotas registradas. ¡Agrega la primera!
          </p>
        ) : (
          pets.map(pet => (
            <div key={pet.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ height: "200px", position: "relative" }}>
                {pet.photo ? (
                  <img src={pet.photo} alt={pet.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>🐾</div>
                )}
                {pet.status === 'lost' && (
                  <div style={{ position: "absolute", top: "1rem", right: "1rem", background: "var(--primary)", color: "white", padding: "0.25rem 0.75rem", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "600" }}>
                    EXTRAVIADO
                  </div>
                )}
              </div>
              <div style={{ padding: "1.5rem" }}>
                <h3 style={{ margin: 0 }}>{pet.name}</h3>
                <p style={{ margin: "0.5rem 0" }}>{pet.type} • {pet.breed}</p>
                {pet.status === 'safe' ? (
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: "100%", marginTop: "1rem" }}
                    onClick={() => setShowLostModal(pet)}
                  >
                    Reportar Extravío
                  </button>
                ) : (
                  <div style={{ marginTop: "1rem", padding: "0.5rem", background: "#FFEAA7", borderRadius: "8px", fontSize: "0.9rem" }}>
                    📍 Reportado en: {pet.lostInfo.location}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </section>

      {showLostModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: "400px", width: "90%" }}>
            <h2>Reportar Extravío: {showLostModal.name}</h2>
            <form onSubmit={handleReportLost} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>¿Cuándo se perdió?</label>
                <input 
                  type="date" 
                  className="input" 
                  required
                  value={lostInfo.date}
                  onChange={(e) => setLostInfo({ ...lostInfo, date: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem" }}>¿Dónde lo viste por última vez?</label>
                <p style={{ fontSize: "0.8rem", color: "var(--text-light)", marginBottom: "0.5rem" }}>Marca la ubicación en el mapa.</p>
                <LocationPicker 
                  onLocationSelect={handleLocationSelect}
                />
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Referencia (ej. Frente al parque)"
                  required
                  value={lostInfo.location}
                  onChange={(e) => setLostInfo({ ...lostInfo, location: e.target.value })}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Reportar</button>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowLostModal(null)}>Cerrar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
