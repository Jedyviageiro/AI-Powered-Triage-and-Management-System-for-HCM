import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { saveAuth } from "../../lib/auth";
const loginImage = "/assets/foto-de-medico-enfermeiro-pediatrico.png";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(username, password);
      saveAuth(res.token, res.user);

      if (res.user.role === "ADMIN") {
        navigate("/admin");
      } else if (res.user.role === "DOCTOR") {
        navigate("/doctor/dashboard");
      } else if (res.user.role === "LAB_TECHNICIAN") {
        navigate("/lab/dashboard");
      } else {
        navigate("/triage/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1.05fr 0.95fr",
        background: "linear-gradient(180deg, #f2f8f3 0%, #eef6f0 100%)",
      }}
    >
      <section
        style={{
          padding: "56px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 430,
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #dbe9df",
            borderRadius: 28,
            padding: 32,
            boxShadow: "0 30px 80px rgba(12, 58, 36, 0.10)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "#0c3a24",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              HCM
            </div>
            <h1 style={{ fontSize: 30, lineHeight: 1.05, fontWeight: 800, color: "#0f172a", margin: "18px 0 10px" }}>
              Sistema de Triagem Pediatrica
            </h1>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#64748b", margin: 0 }}>
              Entre com a sua conta para continuar o atendimento clinico no sistema do HCM.
            </p>
          </div>

          {error ? (
            <div
              style={{
                background: "#fff1f2",
                color: "#9f1239",
                border: "1px solid #fecdd3",
                padding: "10px 12px",
                borderRadius: 14,
                marginBottom: 16,
                fontSize: 13,
              }}
            >
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Username
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: "13px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 16,
                  padding: "13px 14px",
                  fontSize: 14,
                  outline: "none",
                  background: "#fff",
                }}
              />
            </div>

            <button
              disabled={loading}
              style={{
                marginTop: 6,
                width: "100%",
                border: "none",
                borderRadius: 999,
                padding: "14px 18px",
                background: "linear-gradient(180deg, #1a5b39 0%, #0f4428 100%)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 16px 36px rgba(12, 58, 36, 0.16)",
              }}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </section>

      <section
        style={{
          padding: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "min(86vh, 860px)",
            borderRadius: 34,
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(12, 58, 36, 0.12)",
          }}
        >
          <img
            src={loginImage}
            alt="Equipa pediatrica"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(12,58,36,0.06) 0%, rgba(12,58,36,0.56) 100%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 28,
              right: 28,
              bottom: 28,
              background: "rgba(248, 252, 249, 0.92)",
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: 22,
              padding: "18px 20px",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#1f6a48" }}>
              HCM
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.08, color: "#0f172a", marginTop: 8 }}>
              Atendimento pediatrico com mais contexto e menos atrito.
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.7, color: "#475569", marginTop: 10 }}>
              A triagem, a consulta e o seguimento clinico ficam ligados na mesma plataforma.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
