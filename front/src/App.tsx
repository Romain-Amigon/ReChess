import React, { useState } from "react";
import { Routes, Route, Link, BrowserRouter } from "react-router-dom";
import Home from "./pages/Home";
import Analyse from "./pages/Analyse";
import Arbre from "./pages/Arbre";
import Echiquier from "./code/echiquier";
import Test from "./pages/test";
import CV from "./pages/CV.js";
import { UserProvider, useUser } from "./code/userContext";

function AppContent() {
  const { user, login, register, logout } = useUser();

  const [modalOpen, setModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      setModalOpen(false);
      setPassword("");
      console.log(username, password, user);
    } catch (err) {
      alert("Incorrect username or password");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(username, password);
      setModalOpen(false);
      setPassword("");
    } catch (err) {
      alert(" Error during registration (username already taken)");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* En-tête */}
      <header
        style={{
          background: "linear-gradient(to right, rgba(181, 136, 100, 1), rgba(240,217, 181, 1)",
          color: "#fff",
          padding: "20px",
          textAlign: "center",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>ReChess</h1>
      </header>

      {/* Barre de navigation */}
      <nav
        style={{
          padding: "10px",
          background: "#f8f9fa",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #ddd",
          left: "50px"
        }}
      >
        <div style={{ flexGrow: 1 }}>
          <Link
            to="/"
            style={{
              marginRight: "15px",
              textDecoration: "none",
              color: "#007bff",
              fontWeight: "500",
            }}
          >
            Home
          </Link>
          <Link
            to="/analysis"
            style={{
              marginRight: "15px",
              textDecoration: "none",
              color: "#007bff",
              fontWeight: "500",
            }}
          >
            Analysis
          </Link>
          <Link
            to="/tree"
            style={{
              marginRight: "15px",
              textDecoration: "none",
              color: "#007bff",
              fontWeight: "500",
            }}
          >
            Search tree
          </Link>


        </div>
        {user ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ marginRight: "10px", color: "#333" }}>
              👤 {user.username}
            </span>
            <button
              onClick={logout}
              style={{
                padding: "5px 15px",
                background: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Log out
            </button>
          </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "5px 15px",
              background: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Log in / Register
          </button>
        )}
      </nav>

      {/* Contenu principal */}
      <main style={{ flex: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis" element={<Analyse />} />
          <Route path="/tree" element={<Arbre />} />
          <Route path="/cv" element={<CV />} />
        </Routes>
      </main>

      {/* Bas de page */}
      <footer
        style={{
          background: "#333",
          color: "#fff",
          padding: "20px",
          textAlign: "center",
          borderTop: "1px solid #444",
        }}
      >
        <p style={{ margin: 0 }}>
          ReChess

          License: Creative Commons BY-NC 4.0
          You are free to use, copy, modify, and share this project as long as it is **non-commercial** and you credit the author.

        </p>
        <div style={{ marginTop: "10px" }}>
          <Link
            to="/cv"
            style={{
              color: "#fff",
              textDecoration: "underline",
              marginRight: "15px",
            }}
          >
            My CV
          </Link>
          <a
            href="https://github.com/Romain-Amigon/ReChess"
            style={{ color: "#fff", textDecoration: "underline" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>
      </footer>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "8px",
              width: "500px",
            }}
          >
            <h2>Log in</h2>
            <form onSubmit={handleLogin}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />
              <input
                type="password"
                placeholder="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 15px",
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Log in
              </button>
            </form>

            <h2>Register</h2>
            <div
              style={{
                fontSize: "0.9em",
                color: "#bd2525cc",
                marginBottom: "10px",
              }}

            >
              ⚠️ This project is developed as part of a student work.
              <br />
              A protection (bcrypt) is implemented to secure passwords, but the system is not intended for production use.
              <br />
              <br />
              Only the following information is stored:
              <br />
              - a username
              <br />
              - an encrypted password (hashed with bcrypt)
              <br />
              No additional personal data is collected.
              <br />
              <br />
              Please choose a unique password, different from the ones you usually use.

            </div>
            <form onSubmit={handleRegister}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", marginBottom: "10px", padding: "8px" }}
              />
              <button
                type="submit"
                style={{
                  padding: "8px 15px",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Sign up
              </button>
            </form>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              style={{
                marginTop: "10px",
                padding: "8px 15px",
                background: "#6c757d",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
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