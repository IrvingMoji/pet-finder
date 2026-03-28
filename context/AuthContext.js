"use client";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("petfinder_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem("petfinder_users") || "[]");
    const foundUser = users.find(u => u.email === email && u.password === password);
    
    if (foundUser) {
      const sessionUser = { id: foundUser.id, email: foundUser.email, name: foundUser.name };
      setUser(sessionUser);
      localStorage.setItem("petfinder_user", JSON.stringify(sessionUser));
      return { success: true };
    }
    return { success: false, message: "Credenciales inválidas" };
  };

  const signup = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem("petfinder_users") || "[]");
    if (users.find(u => u.email === email)) {
      return { success: false, message: "El usuario ya existe" };
    }
    
    const newUser = { id: Date.now().toString(), name, email, password };
    users.push(newUser);
    localStorage.setItem("petfinder_users", JSON.stringify(users));
    
    const sessionUser = { id: newUser.id, email: newUser.email, name: newUser.name };
    setUser(sessionUser);
    localStorage.setItem("petfinder_user", JSON.stringify(sessionUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("petfinder_user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
