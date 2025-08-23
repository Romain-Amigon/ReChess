import React, { useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Analyse from "./pages/Analyse";
import Arbre from "./pages/Arbre";
import Echiquier from "./code/echiquier";
import Test from "./pages/test";
import { UserProvider, useUser } from "./code/userContext";
import { BrowserRouter } from "react-router-dom";

function AppContent() {
  const { user, login, register, logout } = useUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username);
      setModalOpen(false);
    } catch (err) {
      alert("Utilisateur introuvable");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, email);
      setModalOpen(false);
    } catch (err) {
      alert("Erreur lors de l’inscription");
    }
  };

  return (
    <>
      <nav style={{ padding: "10px", background: "#ddd", display: "flex", alignItems: "center" }}>
        <div style={{ flexGrow: 1 }}>
          <Link to="/" style={{ marginRight: "10px" }}>Accueil</Link>
          <Link to="/analyse" style={{ marginRight: "10px" }}>Analyse</Link>
          <Link to="/arbre" style={{ marginRight: "10px" }}>Arbre</Link>
          <Link to="/echiquier" style={{ marginRight: "10px" }}>Échiquier</Link>
          <Link to="/test" style={{ marginRight: "10px" }}>Test</Link>
        </div>
        {user ? (
          <div>
            👤 {user.username}
            <button onClick={logout} style={{ marginLeft: "10px" }}>Déconnexion</button>
          </div>
        ) : (
          <button onClick={() => setModalOpen(true)} style={{ padding: "5px 10px", cursor: "pointer" }}>
            Connexion / Inscription
          </button>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyse" element={<Analyse />} />
        <Route path="/arbre" element={<Arbre />} />
        <Route path="/echiquier" element={<Echiquier />} />
        <Route path="/test" element={<Test />} />
      </Routes>

      {/* Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center",
        }}>
          <div style={{ background: "#fff", padding: "20px", borderRadius: "8px", width: "300px" }}>
            <h2>Connexion</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Nom"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <button type="submit">Connexion</button>
            </form>

            <h2>Inscription</h2>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Nom"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <button type="submit">Créer</button>
            </form>

            <button type="button" onClick={() => setModalOpen(false)} style={{ marginTop: "10px" }}>Annuler</button>
          </div>
        </div>
      )}
    </>
  );
}


export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </UserProvider>
  );
}
