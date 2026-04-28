import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { saveAuth } from "../../lib/auth";

const logoImage = "/assets/logo_icon.svg";
const loginImage = "/assets/login-image.png";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.login(username, password);
      saveAuth(res.token, res.user);

      if (res.user.role === "ADMIN") navigate("/admin");
      else if (res.user.role === "DOCTOR") navigate("/doctor/dashboard");
      else if (res.user.role === "LAB_TECHNICIAN") navigate("/lab/dashboard");
      else navigate("/triage/dashboard");
    } catch (err) {
      setError(err.message);
      setErrorPopupOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        .login-root {
          min-height: 100svh;
          background: #eef5f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'IBM Plex Sans', system-ui, sans-serif;
          padding: 16px;
          color: #0f172a;
          overflow: hidden;
        }

        .login-card {
          display: grid;
          grid-template-columns: minmax(360px, 0.92fr) minmax(420px, 1.08fr);
          width: min(1040px, 100%);
          height: min(620px, calc(100svh - 32px));
          min-height: 540px;
          background: #ffffff;
          border: 1px solid #dbe7df;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 24px 70px rgba(12, 58, 36, 0.14);
        }

        .left-panel {
          padding: 34px 42px 28px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: #ffffff;
        }

        .login-form-shell {
          width: 100%;
          max-width: 350px;
          margin: 0 auto;
        }

        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .logo-img {
          width: 86px;
          height: 86px;
          object-fit: contain;
        }

        .logo-name {
          display: grid;
          gap: 1px;
          line-height: 1.1;
        }

        .logo-name strong {
          font-size: 15px;
          font-weight: 800;
          color: #0c3a24;
        }

        .logo-name span {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        .form-heading {
          font-size: 22px;
          line-height: 1.1;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px;
        }

        .form-subheading {
          font-size: 12.5px;
          color: #64748b;
          margin: 0 0 22px;
        }

        .field-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .input-wrap {
          position: relative;
          margin-bottom: 14px;
        }

        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          display: flex;
          align-items: center;
          pointer-events: none;
        }

        .field-input {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 10px 12px 10px 38px;
          min-height: 42px;
          font-size: 13px;
          font-family: inherit;
          color: #0f172a;
          background: #f8fbf9;
          outline: none;
          transition: box-shadow 0.18s, background 0.18s;
        }

        .field-input:focus {
          box-shadow: inset 0 0 0 1px rgba(22, 80, 52, 0.18);
          background: #ffffff;
        }

        .field-input::placeholder {
          color: #a8b5ad;
        }

        .toggle-pw {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: transparent;
          border: none;
          cursor: pointer;
          color: #94a3b8;
          padding: 4px;
          display: flex;
          align-items: center;
        }

        .remember-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin: 2px 0 18px;
        }

        .remember-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: #475569;
          cursor: pointer;
          white-space: nowrap;
        }

        .remember-checkbox {
          width: 15px;
          height: 15px;
          accent-color: #165034;
          cursor: pointer;
        }

        .forgot-btn {
          background: transparent;
          border: none;
          font-size: 12.5px;
          font-family: inherit;
          color: #165034;
          cursor: pointer;
          font-weight: 700;
          padding: 0;
          white-space: nowrap;
        }

        .login-btn {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 11px 14px;
          min-height: 42px;
          background: #0c3a24;
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          transition: background 0.18s, transform 0.12s;
        }

        .login-btn:hover:not(:disabled) {
          background: #165034;
        }

        .login-btn:active:not(:disabled) {
          transform: translateY(1px);
        }

        .login-btn:disabled {
          background: #7aa08c;
          cursor: not-allowed;
        }

        .footer-note {
          margin: 18px 0 0;
          font-size: 11.5px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .footer-note a {
          color: #165034;
          font-weight: 700;
          text-decoration: none;
        }

        .right-panel {
          position: relative;
          min-width: 0;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(12, 58, 36, 0.9), rgba(22, 80, 52, 0.68)),
            url("${loginImage}") center / cover no-repeat;
        }

        .right-panel::after {
          content: "";
          position: absolute;
          inset: auto 0 0;
          height: 46%;
          background: linear-gradient(0deg, rgba(5, 27, 17, 0.78), rgba(5, 27, 17, 0));
          pointer-events: none;
        }

        .right-content {
          position: absolute;
          left: 42px;
          right: 42px;
          bottom: 36px;
          z-index: 1;
          color: #ffffff;
        }

        .right-kicker {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 10px;
        }

        .right-headline {
          max-width: 430px;
          font-size: 34px;
          line-height: 1.04;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .right-copy {
          max-width: 410px;
          margin: 14px 0 0;
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.78);
        }

        @media (max-width: 860px) {
          .login-root {
            overflow: auto;
            padding: 12px;
          }

          .login-card {
            grid-template-columns: 1fr;
            height: auto;
            min-height: 0;
          }

          .left-panel {
            padding: 28px 24px;
          }

          .login-form-shell {
            max-width: 390px;
          }

          .right-panel {
            min-height: 220px;
            order: -1;
          }

          .right-content {
            left: 24px;
            right: 24px;
            bottom: 24px;
          }

          .right-headline {
            font-size: 26px;
          }
        }

        @media (max-height: 650px) and (min-width: 861px) {
          .login-card {
            height: calc(100svh - 24px);
            min-height: 500px;
          }

          .left-panel {
            padding-top: 24px;
            padding-bottom: 22px;
          }

          .logo-row {
            margin-bottom: 16px;
          }

          .logo-img {
            width: 72px;
            height: 72px;
          }

          .form-subheading {
            margin-bottom: 16px;
          }
    }

       .login-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(6px);
}

.login-popup {
  width: min(360px, 100%);
  background: #ffffff;
  border: 1px solid #e4ece7;
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(15, 23, 42, 0.22);
  padding: 28px 24px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: loginPopupIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.login-popup-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #fff1f2;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}

.login-popup-icon-inner {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #ffe0e3;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #be123c;
}

.login-popup-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.01em;
}

.login-popup-message {
  margin: 0 0 24px;
  font-size: 13px;
  line-height: 1.65;
  color: #64748b;
  max-width: 280px;
}

.login-popup-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.login-popup-btn-primary {
  width: 100%;
  border: none;
  border-radius: 14px;
  min-height: 44px;
  padding: 11px 18px;
  background: #0c3a24;
  color: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
}

.login-popup-btn-primary:hover {
  background: #165034;
}

.login-popup-btn-primary:active {
  transform: translateY(1px);
}

.login-popup-btn-ghost {
  width: 100%;
  border: none;
  border-radius: 14px;
  min-height: 40px;
  padding: 10px 18px;
  background: transparent;
  color: #64748b;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.login-popup-btn-ghost:hover {
  background: #f1f5f2;
  color: #334155;
}

.login-popup-drag-handle {
  width: 36px;
  height: 4px;
  border-radius: 999px;
  background: #e2e8f0;
  margin: 0 auto 24px;
}

@keyframes loginPopupIn {
  from { opacity: 0; transform: translateY(18px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <section className="left-panel">
            <div className="login-form-shell">
              <div className="logo-row">
                <img src={logoImage} alt="HCM" className="logo-img" />
                <div className="logo-name">
                  <strong>HCM</strong>
                  <span>Sistema de Triagem e Gestao Pediatrica</span>
                </div>
              </div>

              <h1 className="form-heading">Entrar no sistema</h1>
              <p className="form-subheading">Acesso restrito a profissionais autorizados.</p>

              <form onSubmit={handleSubmit}>
                <label className="field-label" htmlFor="username">
                  Utilizador
                </label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21a8 8 0 0 0-16 0" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="username"
                    className="field-input"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="Nome de utilizador"
                    autoComplete="username"
                  />
                </div>

                <label className="field-label" htmlFor="password">
                  Palavra-passe
                </label>
                <div className="input-wrap">
                  <span className="input-icon">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    id="password"
                    className="field-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Palavra-passe"
                    autoComplete="current-password"
                    style={{ paddingRight: 42 }}
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  >
                    {showPassword ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="remember-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      className="remember-checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    Lembrar sessao
                  </label>
                  <button type="button" className="forgot-btn">
                    Recuperar acesso
                  </button>
                </div>

                <button type="submit" className="login-btn" disabled={loading}>
                  {loading ? "A entrar..." : "Entrar"}
                </button>
              </form>

              <p className="footer-note">
                Ao entrar, confirma que esta a usar uma conta autorizada do <a href="#">HCM</a>.
              </p>
            </div>
          </section>

          <section className="right-panel" aria-label="Equipa pediatrica do HCM">
            <div className="right-content">
              <div className="right-kicker">Sistema Pediatrico HCM</div>
              <h2 className="right-headline">
                Cuidado pediatrico com mais contexto e continuidade.
              </h2>
              <p className="right-copy">
                Registo, triagem, consultas e laboratorio num unico fluxo para apoiar a equipa
                clinica.
              </p>
            </div>
          </section>
        </div>
      </div>

      {errorPopupOpen ? (
        <div
          className="login-popup-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setErrorPopupOpen(false);
          }}
        >
          <div
            className="login-popup"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="login-error-title"
          >
            <div className="login-popup-drag-handle" aria-hidden="true" />

            <div className="login-popup-icon-wrap" aria-hidden="true">
              <div className="login-popup-icon-inner">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="7" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
            </div>

            <h2 id="login-error-title" className="login-popup-title">
              Não foi possível entrar
            </h2>
            <p className="login-popup-message">
              {error || "Verifique o nome de utilizador e a palavra-passe, depois tente novamente."}
            </p>

            <div className="login-popup-actions">
              <button
                type="button"
                className="login-popup-btn-primary"
                onClick={() => setErrorPopupOpen(false)}
                autoFocus
              >
                Tentar novamente
              </button>
              <button
                type="button"
                className="login-popup-btn-ghost"
                onClick={() => setErrorPopupOpen(false)}
              >
                Recuperar acesso
              </button>
            </div>
          </div>
        </div>
      ) : null}
     
    </>
  );
}
