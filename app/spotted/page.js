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
  const [matches, setMatches] = useState(null); // null = no analizado, [] = sin coincidencias, [...] = con coincidencias
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
      // 1. Guardar el reporte en Firestore
      const spottedData = await dataService.saveSpottedReport(user.id, spottedPet);

      // 2. Obtener mascotas perdidas con foto para análisis
      const lostPets = await dataService.getAllLostPets();
      const petsWithPhoto = lostPets.filter(p => p.photo);

      // 3. Lanzar el análisis en SEGUNDO PLANO (no esperamos la respuesta)
      //    El servidor usará after() para procesar con Gemini sin bloquear al usuario
      if (petsWithPhoto.length > 0) {
        fetch("/api/match-pet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            spottedData: { id: spottedData.id, photo: spottedPet.photo },
            lostPets: petsWithPhoto.map(p => ({
              id: p.id, name: p.name, photo: p.photo, userId: p.userId,
            })),
            reporterId: user.id,
          }),
        }).catch(err => console.warn("[spotted] Error iniciando análisis:", err));
      }

      // 4. Redirigir al historial inmediatamente
      setViewMode("history");
      setMatches(null);
      setSpottedPet({ photo: null, location: "", coords: null, notes: "" });
    } catch (error) {
      alert("Error al guardar el reporte. Por favor intenta de nuevo.");
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
          onClick={() => { setViewMode('form'); setMatches(null); }}
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
                    {/* Estado del análisis de Gemini */}
                    {!report.analyzed && !report.matchInfo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#FFF9E6", padding: "0.75rem 1rem", borderRadius: "8px", borderLeft: "3px solid #F4C430" }}>
                        <span style={{ fontSize: "1.2rem", animation: "spin 2s linear infinite", display: "inline-block" }}>🧠</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: "600", fontSize: "0.85rem", color: "#9A7B00" }}>Gemini Vision analizando...</p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#9A7B00", opacity: 0.8 }}>El análisis tarda un par de minutos. Regresa pronto.</p>
                        </div>
                      </div>
                    ) : report.matchInfo ? (
                      <div style={{ background: "#F0FFF4", padding: "1rem", borderRadius: "8px", borderLeft: "3px solid #2ecc71" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: "0 0 0.25rem", fontSize: "0.75rem", fontWeight: "700", color: "#2ecc71", textTransform: "uppercase" }}>
                              🎯 Coincidencia · {report.matchInfo.score}%
                            </p>
                            <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem", color: "var(--text)", fontWeight: "600" }}>
                              {report.matchInfo.matchPetName}
                            </p>
                            {report.matchInfo.reasoning && (
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-light)", fontStyle: "italic" }}>
                                "{report.matchInfo.reasoning}"
                              </p>
                            )}
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", flexShrink: 0 }}
                            onClick={() => router.push(`/chat?with=${report.matchInfo.matchOwnerId}`)}
                          >
                            Contactar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", background: "#f8f9fa", borderRadius: "8px", borderLeft: "3px solid var(--border)" }}>
                        <span style={{ fontSize: "1rem" }}>✅</span>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-light)" }}>Análisis completado · Sin coincidencias por el momento</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : matching ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div style={{ fontSize: "3rem", animation: "pulse 1.5s infinite" }}>💾</div>
            <h3 style={{ marginTop: "1rem" }}>Guardando reporte...</h3>
            <p style={{ color: "var(--text-light)" }}>Estamos guardando tu avistamiento y preparando el análisis con Gemini Vision en segundo plano.</p>
            <style jsx>{`
              @keyframes pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.2); opacity: 0.6; }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        ) : matches !== null ? (
          <div style={{ padding: "0.5rem 0" }}>
            {matches.length > 0 ? (
              <>
                <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "2.5rem" }}>🎯</div>
                  <h2 style={{ color: "var(--primary)", margin: "0.5rem 0 0.25rem" }}>
                    {matches.length === 1 ? "¡Coincidencia encontrada!" : `${matches.length} coincidencias encontradas`}
                  </h2>
                  <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>
                    Los dueños ya han sido notificados. Puedes contactarlos directamente.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {matches.map((match, i) => (
                    <div key={i} className="card" style={{ padding: "1.25rem", borderLeft: "4px solid var(--primary)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                        <h3 style={{ margin: 0, fontSize: "1rem" }}>🐾 {match.petName}</h3>
                        <span style={{ fontWeight: "700", color: match.score >= 90 ? "#2ecc71" : "var(--primary)", fontSize: "1.1rem" }}>
                          {match.score}%
                        </span>
                      </div>
                      {/* Barra de confianza */}
                      <div style={{ background: "#f0f0f0", borderRadius: "99px", height: "8px", marginBottom: "0.75rem", overflow: "hidden" }}>
                        <div style={{ width: `${match.score}%`, height: "100%", borderRadius: "99px", background: match.score >= 90 ? "#2ecc71" : "var(--primary)", transition: "width 0.5s ease" }} />
                      </div>
                      <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--text-light)", fontStyle: "italic" }}>
                        💬 "{match.reasoning}"
                      </p>
                      <button
                        className="btn btn-primary"
                        style={{ width: "100%", padding: "0.6rem" }}
                        onClick={() => router.push(`/chat?with=${match.ownerId}`)}
                      >
                        Contactar al Dueño
                      </button>
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary" style={{ width: "100%", marginTop: "1.5rem" }} onClick={() => router.push("/")}>
                  Volver al inicio
                </button>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                <h3>Sin coincidencias por ahora</h3>
                <p style={{ color: "var(--text-light)" }}>
                  Gemini Vision analizó todas las mascotas extraviadas y no encontró una coincidencia confiable. Tu reporte quedó guardado y te notificaremos si aparece una coincidencia futura.
                </p>
                <button className="btn btn-primary" style={{ marginTop: "1.5rem" }} onClick={() => router.push("/")}>
                  Entendido
                </button>
              </div>
            )}
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
