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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
        gridTemplateColumns: "1fr 1fr",
        background: "#f0f4f2",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <section
        style={{
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {/* Top: logo + form */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 400 }}>
          {/* Logo badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "#0e4f35",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.05em",
              }}
            >
              {/* stethoscope icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
                <path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4" />
                <circle cx="20" cy="10" r="2" />
              </svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#0e4f35", letterSpacing: "0.08em" }}>HCM</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: "0 0 8px", lineHeight: 1.15 }}>
            Sistema de Triagem<br />Pediátrica
          </h1>
          <p style={{ fontSize: 13.5, color: "#64748b", margin: "0 0 32px", lineHeight: 1.6 }}>
            Acesso restrito a profissionais de saúde autorizados.
          </p>

          {/* Card */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 20,
              padding: "28px 24px 24px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}
          >
            {error && (
              <div
                style={{
                  background: "#fff1f2",
                  color: "#9f1239",
                  border: "1px solid #fecdd3",
                  padding: "9px 12px",
                  borderRadius: 10,
                  marginBottom: 18,
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
              {/* Nome de utilizador */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Nome de utilizador
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Insira seu identificador"
                    style={{
                      width: "100%",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "12px 14px 12px 38px",
                      fontSize: 13.5,
                      outline: "none",
                      background: "#f8fafc",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0e4f35")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                </div>
              </div>

              {/* Palavra-passe */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: 7,
                  }}
                >
                  Palavra-passe
                </label>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#94a3b8",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      border: "1px solid #e2e8f0",
                      borderRadius: 12,
                      padding: "12px 42px 12px 38px",
                      fontSize: 13.5,
                      outline: "none",
                      background: "#f8fafc",
                      color: "#0f172a",
                      boxSizing: "border-box",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "#0e4f35")}
                    onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: 13,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#94a3b8",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Lembrar acesso + Recuperar senha */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#475569" }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{
                      width: 15,
                      height: 15,
                      accentColor: "#0e4f35",
                      cursor: "pointer",
                    }}
                  />
                  Lembrar acesso
                </label>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 13,
                    color: "#0e7a4f",
                    cursor: "pointer",
                    fontWeight: 600,
                    padding: 0,
                  }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4,
                  width: "100%",
                  border: "none",
                  borderRadius: 12,
                  padding: "13px 18px",
                  background: loading ? "#3d7a5e" : "#0e4f35",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s",
                  boxShadow: "0 4px 16px rgba(14,79,53,0.25)",
                }}
                onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#0c3f2a"; }}
                onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#0e4f35"; }}
              >
                {loading ? "Entrando..." : (
                  <>
                    Entrar
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: 24 }}>
          <p style={{ fontSize: 11, color: "#94a3b8", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>
            Ambiente de triagem de alta precisão &nbsp;•&nbsp; © 2024 HCM
          </p>
        </div>
      </section>

      {/* ── RIGHT PANEL ── */}
      <section style={{ padding: "16px 16px 16px 8px" }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            borderRadius: 24,
            overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          }}
        >
          {/* Background image */}
          <img
            src={loginImage}
            alt="Equipa pediatrica"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, rgba(6,28,58,0.55) 0%, rgba(4,18,40,0.85) 100%)",
            }}
          />

          {/* Top-right icon buttons */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              display: "flex",
              gap: 8,
            }}
          >
            {[
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>,
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
            ].map((icon, i) => (
              <div
                key={i}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.75)",
                  cursor: "pointer",
                }}
              >
                {icon}
              </div>
            ))}
          </div>

          {/* Bottom content */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              padding: "0 28px 28px",
            }}
          >
            {/* Live badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                borderRadius: 999,
                padding: "5px 12px",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#4ade80",
                  boxShadow: "0 0 0 2px rgba(74,222,128,0.3)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Protocolos atualizados
              </span>
            </div>

            {/* Headline */}
            <h2
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#ffffff",
                lineHeight: 1.15,
                margin: "0 0 14px",
                maxWidth: 380,
              }}
            >
              Atendimento pediátrico com mais contexto e menos atrito.
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: 14,
                color: "rgba(255,255,255,0.72)",
                lineHeight: 1.65,
                margin: "0 0 24px",
                maxWidth: 380,
              }}
            >
              Nossa plataforma integra dados clínicos em tempo real para reduzir o tempo de espera e garantir que cada pequeno paciente receba o cuidado exato no momento certo.
            </p>

            {/* Feature badges */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                {
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
                  label: "Triagem Ágil",
                },
                {
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
                  label: "Protocolo Seguro",
                },
                {
                  icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
                  label: "Dados em Tempo Real",
                },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    background: "rgba(255,255,255,0.10)",
                    border: "1px solid rgba(255,255,255,0.18)",
                    backdropFilter: "blur(8px)",
                    borderRadius: 10,
                    padding: "8px 14px",
                    color: "rgba(255,255,255,0.88)",
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {icon}
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
