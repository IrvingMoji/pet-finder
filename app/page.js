import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "4rem 1rem",
        gap: "2rem"
      }}>
        <h1 style={{ fontSize: "3.5rem", maxWidth: "800px", lineHeight: "1.2" }}>
          Reencuentra a tu mejor amigo con <span style={{ color: "var(--primary)" }}>Inteligencia Artificial</span>
        </h1>
        <p style={{ fontSize: "1.25rem", maxWidth: "600px" }}>
          Nuestra tecnología de reconocimiento de imagen ayuda a conectar mascotas extraviadas con personas que las han visto. Juntos, podemos traerlos de vuelta a casa.
        </p>
        
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <Link href="/lost" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
            He perdido mi mascota
          </Link>
          <Link href="/spotted" className="btn btn-secondary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
            He visto una mascota
          </Link>
        </div>
      </section>

      <section style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "2rem",
        marginTop: "4rem"
      }}>
        <div className="card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📸</div>
          <h3>Carga Fotos</h3>
          <p>Sube imágenes de tu mascota o de una que hayas visto en la calle desde tu galería.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📍</div>
          <h3>Ubica el Punto</h3>
          <p>Indica en el mapa el último lugar donde se vio a la mascota para facilitar la búsqueda.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤖</div>
          <h3>Comparación IA</h3>
          <p>Nuestro sistema analiza las fotos reportadas y te notifica si hay una coincidencia visual.</p>
        </div>
        <div className="card">
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>💬</div>
          <h3>Chat Directo</h3>
          <p>Habla directamente con quien encontró a tu mascota para coordinar el reencuentro.</p>
        </div>
      </section>

      <footer style={{ marginTop: "6rem", padding: "2rem", borderTop: "1px solid var(--border)", textAlign: "center" }}>
        <p>© 2026 PetFinder - Hecho con ❤️ para los amantes de los animales.</p>
      </footer>
    </main>
  );
}
