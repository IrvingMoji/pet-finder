import "./globals.css";
import Navbar from "@/components/Navbar";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Pet Finder - Reencuentra a tu mejor amigo",
  description: "Plataforma para encontrar mascotas extraviadas usando IA",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Navbar />
          <div className="container">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
