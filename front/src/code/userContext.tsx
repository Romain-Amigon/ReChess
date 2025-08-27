import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  username: string;
  email: string;
  tree: { [key: number]: any };
}

interface UserContextType {
  user: User | null;
  login: (username: string) => Promise<void>;
  register: (username: string, email: string) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // charger depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const login = async (username: string) => {
    const res = await fetch(`http://localhost:4000/users/${username}`);
    if (!res.ok) throw new Error("Utilisateur introuvable");
    const data = await res.json();
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const register = async (username: string, email: string) => {
    const res = await fetch("http://localhost:4000/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email }),
    });
    if (!res.ok) throw new Error("Erreur lors de l’inscription");
    const data = await res.json();
    setUser(data);
    localStorage.setItem("user", JSON.stringify(data));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider value={{ user, login, register, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser doit être utilisé dans un <UserProvider>");
  return ctx;
};
