"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { dataService } from "@/lib/dataService";
import dynamic from "next/dynamic";
import { compressImage } from "@/lib/imageUtils";

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
  const [viewMode, setViewMode] = useState("form");
  const [myReports, setMyReports] = useState([]);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("detecting"); // 'detecting' | 'found' | 'denied'

  const handleLocationSelect = useCallback((coords) => {
    setSpottedPet(prev => ({ ...prev, coords }));
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // Detectar ubicación GPS al cargar la página
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setGpsCoords(coords);
        setGpsStatus("found");
        // Pre-llenar las coords del formulario
        setSpottedPet(prev => ({ ...prev, coords }));
      },
      () => {
        // El usuario rechazó el permiso o hubo error
        setGpsStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (user && viewMode === "history") {
      dataService.getUserSpottedReports(user.id).then(setMyReports);
    }
  }, [user, viewMode]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const optimizedImage = await compressImage(file);
        setSpottedPet({ ...spottedPet, photo: optimizedImage });
      } catch (error) {
        console.error("Error comprimiendo imagen:", error);
        alert("Error al procesar la imagen.");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setMatching(true);

    try {
      // Simulate Image Recognition Matching (still mock, but source is Firestore)
      const lostPets = await dataService.getAllLostPets();
      const spottedData = await dataService.saveSpottedReport(user.id, spottedPet);
      
      // Mock match logic
      if (lostPets.length > 0) {
        const match = lostPets[0]; // For demo purposes, pick the first one
        setMatchFound(match);
        
        await dataService.updateSpottedReportMatch(spottedData.id, {
          matchOwnerId: match.userId,
          matchPetName: match.name,
          matchPetId: match.id,
        });
        
        await dataService.saveNotification({
          ownerId: match.userId,
          ownerPetId: match.id,
          reporterId: user.id, // El ID del usuario actual que reporta el avistamiento
          spottedId: spottedData.id,
          message: `¡Posible coincidencia! Alguien vio una mascota similar a ${match.name} en ${spottedData.location}.`,
        });
      } else {
        alert("Reporte guardado. Te avisaremos si alguien busca una mascota similar.");
        router.push("/");
      }
    } catch (error) {
      alert("Error al procesar el reporte. Por favor intenta de nuevo.");
      console.error(error);
    } finally {
      setMatching(false);
    }
  };

  if (loading || !user) return <div style={{ textAlign: "center", padding: "4rem" }}>Cargando...</div>;

  return (
    <main style={{ maxWidth: "600px", margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>Avistamientos</h1>
      </header>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button 
          className={`btn ${viewMode === 'form' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, padding: "0.8rem", background: viewMode === 'form' ? 'var(--primary)' : 'transparent', color: viewMode === 'form' ? 'white' : 'var(--primary)', border: '1px solid var(--primary)' }}
          onClick={() => { setViewMode('form'); setMatchFound(null); }}
        >
          Nuevo Reporte
        </button>
        <button 
          className={`btn ${viewMode === 'history' ? 'btn-primary' : 'btn-secondary'}`} 
          style={{ flex: 1, padding: "0.8rem", background: viewMode === 'history' ? 'var(--primary)' : 'transparent', color: viewMode === 'history' ? 'white' : 'var(--primary)', border: '1px solid var(--primary)' }}
          onClick={() => setViewMode('history')}
        >
          Mis Reportes
        </button>
      </div>

      <section className={viewMode === 'form' ? "card" : ""} style={{ marginTop: "1rem" }}>
        {viewMode === 'history' ? (
          <div>
            {myReports.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "4rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🐾</div>
                <p>Aún no has hecho reportes de avistamientos.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {myReports.map(report => (
                  <div key={report.id} className="card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", gap: "1rem" }}>
                      {report.photo && (
                        <div style={{ width: "80px", height: "80px", flexShrink: 0, borderRadius: "12px", overflow: "hidden" }}>
                          <img src={report.photo} alt="Avistamiento" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div>
                        <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", color: "var(--text)" }}>📍 {report.location}</p>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-light)" }}>Fecha: {new Date(report.createdAt).toLocaleDateString()}</p>
                        {report.notes && (
                          <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.85rem", fontStyle: "italic", color: "var(--text-light)" }}>"{report.notes}"</p>
                        )}
                      </div>
                    </div>
                    {report.matchInfo && (
                      <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "8px", borderLeft: "3px solid var(--secondary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: "700", color: "var(--secondary)", textTransform: "uppercase" }}>Posible Coincidencia</p>
                          <p style={{ margin: "0.2rem 0 0 0", fontSize: "0.9rem", color: "var(--text)" }}>Parecido a <strong>{report.matchInfo.matchPetName}</strong></p>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                          onClick={() => router.push(`/chat?with=${report.matchInfo.matchOwnerId}`)}
                        >
                          Chat Dueño
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : matching ? (
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
                onClick={() => router.push(`/chat?with=${matchFound.userId}`)}
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
              
              {/* Estado del GPS */}
              {gpsStatus === "detecting" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--text-light)" }}>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                  Detectando tu ubicación GPS...
                </div>
              )}
              {gpsStatus === "found" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", color: "#2ecc71", fontWeight: "600" }}>
                  ✅ Ubicación detectada automáticamente. Puedes ajustar tocando el mapa.
                </div>
              )}
              {gpsStatus === "denied" && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", fontSize: "0.85rem", color: "var(--text-light)" }}>
                  📍 Toca el mapa para marcar la ubicación exacta.
                </div>
              )}

              <LocationPicker 
                onLocationSelect={handleLocationSelect}
                initialPosition={gpsCoords}
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
