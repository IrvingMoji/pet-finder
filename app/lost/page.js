"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { 
  ssr: false,
  loading: () => <div style={{ height: "300px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div>
});

export default function LostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState(null);
  const [lostInfo, setLostInfo] = useState({ date: "", location: "", coords: null, notes: "" });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPets = async () => {
      if (user) {
        const userPets = await dataService.getUserPets(user.id);
        setPets(userPets.filter(p => p.status !== 'lost'));
      }
    };
    fetchPets();
  }, [user]);

  const handleLocationSelect = useCallback((coords) => {
    setLostInfo(prev => ({ ...prev, coords }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !selectedPet) return;

    const success = await dataService.updatePetStatus(selectedPet.id, 'lost', lostInfo);
    
    if (success) {
      alert(`¡Reporte de ${selectedPet.name} creado! Te avisaremos si hay coincidencias.`);
      router.push("/pets");
    } else {
      alert("Error al crear el reporte. Por favor intenta de nuevo.");
    }
  };

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  return (
    <main style={{ maxWidth: "600px" }}>
      <h1>Reportar Mascota Extraviada</h1>
      <p>Selecciona a tu mascota y ayuda a que regrese pronto a casa.</p>

      {pets.length === 0 ? (
        <section className="card" style={{ marginTop: "2rem", textAlign: "center", padding: "3rem" }}>
          <h3>No tienes mascotas registradas (que no estén ya perdidas)</h3>
          <p>Primero debes registrar a tu mascota para poder reportarla como extraviada.</p>
          <button className="btn btn-primary" onClick={() => router.push("/pets")}>Ir a Mis Mascotas</button>
        </section>
      ) : (
        <section className="card" style={{ marginTop: "2rem" }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Selecciona Mascota</label>
              <select 
                className="input" 
                required 
                onChange={(e) => setSelectedPet(pets.find(p => p.id === e.target.value))}
              >
                <option value="">-- Seleccionar --</option>
                {pets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                ))}
              </select>
            </div>

            {selectedPet && (
              <>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>¿Cuándo ocurrió?</label>
                  <input 
                    type="date" 
                    className="input" 
                    required 
                    value={lostInfo.date}
                    onChange={(e) => setLostInfo({ ...lostInfo, date: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>¿Dónde se extravió?</label>
                  <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>Marca el punto en el mapa.</p>
                  <LocationPicker onLocationSelect={handleLocationSelect} />
                  <input 
                    type="text" 
                    className="input" 
                    placeholder="Referencia (ej. Cerca de la gasolinera)" 
                    required 
                    value={lostInfo.location}
                    onChange={(e) => setLostInfo({ ...lostInfo, location: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ padding: "1rem" }}>Crear Reporte de Extravío</button>
              </>
            )}
          </form>
        </section>
      )}
    </main>
  );
}
