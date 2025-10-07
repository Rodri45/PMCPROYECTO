// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithPassword } from "../lib/auth";

const LoginPage: React.FC = () => {
  const nav = useNavigate();
  const [email, setEmail] = useState("asesor@pmc.com"); // precargado para prueba
  const [password, setPassword] = useState("123456");   // precargado para prueba
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const u = loginWithPassword(email.trim(), password.trim());
    if (!u) {
      setError("Credenciales inválidas. Intenta de nuevo.");
      return;
    }
    nav("/", { replace: true });
  };

  return (
    <div className="page" style={{ display: "grid", placeItems: "center", minHeight: "100dvh" }}>
      <form onSubmit={submit} className="card" style={{ width: 340, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: 12, background: "var(--ring)" }}>🔐</span>
          <div>
            <div className="card-title">Iniciar sesión</div>
            <div className="card-desc">CRM Inmobiliaria</div>
          </div>
        </div>

        <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <span>Email</span>
          <input
            type="email"
            value={email}
            placeholder="tucorreo@pmc.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label style={{ display: "grid", gap: 6, marginBottom: 10 }}>
          <span>Contraseña</span>
          <input
            type="password"
            value={password}
            placeholder="******"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && (
          <div style={{ color: "#ef4444", fontSize: 13, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          Entrar
        </button>

        <div className="card-desc" style={{ marginTop: 10, fontSize: 12 }}>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
    