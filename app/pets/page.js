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
        setPets(userPets);
      }
    };
    fetchData();
  }, [user]);

  // Detectar ubicación GPS al abrir el modal de extravío
  useEffect(() => {
    if (!showLostModal) return;

    if (!navigator.geolocation) {
      console.warn("Geolocalización no soportada");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLostInfo(prev => ({ ...prev, coords }));
      },
      (error) => {
        console.warn("Error obteniendo ubicación:", error.message);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, [showLostModal]);

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

  const handleMarkFound = async (petId) => {
    if (!user) return;
    const success = await dataService.updatePetStatus(petId, 'safe');
    if (success) {
      const updatedPets = await dataService.getUserPets(user.id);
      setPets(updatedPets);
    } else {
      alert("Error al actualizar el estado.");
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
                  <div style={{ marginTop: "1rem" }}>
                    <div style={{ padding: "0.5rem", background: "#FFEAA7", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "0.5rem", borderLeft: "3px solid #F1C40F" }}>
                      📍 Última vez en: {pet.lostInfo.location}
                    </div>
                    <button 
                      className="btn" 
                      style={{ width: "100%", background: "#2ecc71", color: "white" }}
                      onClick={() => handleMarkFound(pet.id)}
                    >
                      🏁 ¡La encontré!
                    </button>
                  </div>
                )}

                {pet.history && pet.history.length > 0 && (
                  <div style={{ marginTop: "1.5rem", borderTop: "1px dashed var(--border)", paddingTop: "1rem" }}>
                    <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: "700", color: "var(--text-light)", textTransform: "uppercase" }}>
                      📜 Historial
                    </p>
                    <div style={{ maxHeight: "150px", overflowY: "auto", marginTop: "0.5rem" }}>
                      {pet.history.map((event, idx) => (
                        <div key={idx} style={{ fontSize: "0.75rem", color: "var(--text-light)", marginBottom: "0.5rem", background: "#f8f9fa", padding: "0.6rem", borderRadius: "8px", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", color: "var(--text)" }}>
                            <span>Perdida: {event.lostDate}</span>
                            <span>Hallada: {event.foundDate}</span>
                          </div>
                          <div style={{ fontSize: "0.7rem", opacity: 0.8, marginTop: "0.2rem" }}>
                            📍 {event.location}
                          </div>
                        </div>
                      ))}
                    </div>
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
                  initialPosition={lostInfo.coords}
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
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }} 
                  onClick={() => {
                    setShowLostModal(null);
                    setLostInfo({ date: "", location: "", coords: null, notes: "" });
                  }}
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
