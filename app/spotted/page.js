"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/LocationPicker"), { 
  ssr: false,
  loading: () => <div style={{ height: "300px", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center" }}>Cargando mapa...</div>
});

export default function SpottedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [spottedPet, setSpottedPet] = useState({ photo: null, location: "", coords: null, notes: "" });
  const [matching, setMatching] = useState(false);
  const [matchFound, setMatchFound] = useState(null);

  const handleLocationSelect = useCallback((coords) => {
    setSpottedPet(prev => ({ ...prev, coords }));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSpottedPet({ ...spottedPet, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) return;
    setMatching(true);

    // Simulate Image Recognition Matching
    setTimeout(() => {
      const lostPets = dataService.getAllLostPets();
      const spottedData = dataService.saveSpottedReport(user.id, spottedPet);
      
      // Mock match logic
      if (lostPets.length > 0) {
        const match = lostPets[0];
        setMatchFound(match);
        
        dataService.saveNotification({
          ownerPetId: match.id,
          spottedId: spottedData.id,
          message: `¡Posible coincidencia! Alguien vio una mascota similar a ${match.name} en ${spottedData.location}.`,
        });
      } else {
        alert("Reporte guardado. Te avisaremos si alguien busca una mascota similar.");
        router.push("/");
      }
      setMatching(false);
    }, 2000);
  };

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  return (
    <main style={{ maxWidth: "600px" }}>
      <h1>¿Viste una Mascota?</h1>
      <p>Tu reporte puede ayudar a que una mascota regrese a su hogar.</p>

      <section className="card" style={{ marginTop: "2rem" }}>
        {matching ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>🔍</div>
            <h3>Analizando imagen...</h3>
            <p>Buscando coincidencias con reportes de mascotas extraviadas.</p>
            <style jsx>{`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.7; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        ) : matchFound ? (
          <div style={{ textAlign: "center", padding: "1rem" }}>
            <div style={{ fontSize: "3rem" }}>🎉</div>
            <h2 style={{ color: "var(--secondary)" }}>¡Coincidencia Encontrada!</h2>
            <p>La mascota que viste se parece mucho a <strong>{matchFound.name}</strong>, que está reportado como extraviado.</p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => router.push(`/chat?with=${matchFound.id}`)}
              >
                Contactar al Dueño
              </button>
              <button 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => router.push("/")}
              >
                Listo
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Foto de la Mascota</label>
              <input 
                className="input" 
                type="file" 
                accept="image/*" 
                required 
                onChange={handlePhotoChange}
              />
              {spottedPet.photo && (
                <img src={spottedPet.photo} alt="Spotted" style={{ width: "100%", height: "250px", objectFit: "cover", marginTop: "1rem", borderRadius: "var(--radius)" }} />
              )}
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>¿Dónde la viste?</label>
              <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>Toca en el mapa para marcar la ubicación exacta.</p>
              <LocationPicker 
                onLocationSelect={handleLocationSelect}
              />
              <input 
                className="input" 
                type="text" 
                placeholder="Referencia (ej. Cerca del parque)" 
                required
                value={spottedPet.location}
                onChange={(e) => setSpottedPet({ ...spottedPet, location: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "600" }}>Notas adicionales</label>
              <textarea 
                className="input" 
                placeholder="Traía collar azul, se veía asustado..."
                style={{ height: "100px", resize: "none" }}
                value={spottedPet.notes}
                onChange={(e) => setSpottedPet({ ...spottedPet, notes: e.target.value })}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "1rem" }}>Enviar Reporte y Buscar Coincidencias</button>
          </form>
        )}
      </section>
    </main>
  );
}
