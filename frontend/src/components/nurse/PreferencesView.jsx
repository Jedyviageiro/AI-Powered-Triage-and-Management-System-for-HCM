import { useEffect, useMemo, useRef, useState } from "react";

const defaultPrefs = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

const shiftLabel = (shiftType, shiftWindow) => {
  const type = String(shiftType || "").toUpperCase();
  if (type === "MORNING") return `Manha ${shiftWindow || "08:00-13:00"}`;
  if (type === "AFTERNOON") return `Tarde ${shiftWindow || "13:00-20:00"}`;
  if (type === "NIGHT") return `Noite ${shiftWindow || "20:00-07:30"}`;
  return shiftWindow || "Nao definido";
};

export default function PreferencesView({
  me,
  shiftStatus,
  onLogout,
  preferences,
  loading = false,
  saving = false,
  onSave,
  onPreview,
}) {
  const [prefs, setPrefs] = useState(() => ({ ...defaultPrefs, ...(preferences || {}) }));
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [fontMenuOpen, setFontMenuOpen] = useState(false);
  const fontMenuRef = useRef(null);

  const avatarFallback = useMemo(
    () => String(me?.full_name || "U").trim().charAt(0).toUpperCase() || "U",
    [me?.full_name]
  );

  const lastLoginLabel = me?.last_login_at ? new Date(me.last_login_at).toLocaleString("pt-PT") : "-";

  useEffect(() => {
    if (!fontMenuOpen) return undefined;
    const onClickOutside = (event) => {
      if (!fontMenuRef.current?.contains(event.target)) setFontMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [fontMenuOpen]);

  const savePrefs = async () => {
    setSavedMsg("");
    setErrorMsg("");
    try {
      await onSave?.(prefs);
      setSavedMsg("Preferencias guardadas com sucesso.");
    } catch (e) {
      setErrorMsg(e?.message || "Erro ao guardar preferencias.");
    }
  };

  const chooseFontScale = (scale) => {
    const next = {
      font_scale_percent: scale,
      font_size: scale > 100 ? "LARGE" : "NORMAL",
    };
    const nextPrefs = { ...prefs, ...next };
    setPrefs(nextPrefs);
    setFontMenuOpen(false);
    onPreview?.(next);
    Promise.resolve(onSave?.(nextPrefs)).catch((err) => {
      setErrorMsg(err?.message || "Erro ao guardar preferencias.");
    });
  };

  const selectedFontLabel = Number(prefs.font_scale_percent || 100) === 105 ? "Grande (+5%)" : "Normal";

  return (
    <div className="dash-animate dash-animate-delay-1">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Preferencias</h1>
          <p className="text-sm text-gray-500">Configuracao pessoal da enfermeira</p>
        </div>
        <button
          type="button"
          disabled={loading || saving}
          onClick={savePrefs}
          className="btn-primary"
          style={{ width: "auto", padding: "9px 14px", fontSize: "13px" }}
        >
          {saving ? "A guardar..." : "Guardar"}
        </button>
      </div>

      {savedMsg && (
        <div style={{ marginBottom: "12px", background: "#ecfdf3", color: "#166534", border: "1px solid #86efac", borderRadius: "10px", padding: "8px 10px", fontSize: "12px", fontWeight: 700 }}>
          {savedMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ marginBottom: "12px", background: "#fff1f2", color: "#9f1239", border: "1px solid #fda4af", borderRadius: "10px", padding: "8px 10px", fontSize: "12px", fontWeight: 700 }}>
          {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gap: "12px", opacity: loading ? 0.7 : 1 }}>
        <div className="form-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>1. Meu Perfil / Informacoes Pessoais</h2>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "14px", alignItems: "start" }}>
            <div style={{ display: "grid", gap: "8px", justifyItems: "center" }}>
              <div style={{ width: "92px", height: "92px", borderRadius: "50%", background: "linear-gradient(135deg,#165034,#2d6f4e)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800 }}>
                {avatarFallback}
              </div>
              <div style={{ fontSize: "11px", color: "#6b7280", textAlign: "center" }}>
                Foto sera integrada via Cloudinary.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <div className="triage-label">Nome completo</div>
                <div className="triage-input" style={{ background: "#f9fafb" }}>{me?.full_name || "-"}</div>
              </div>
              <div>
                <div className="triage-label">Cargo / Funcao</div>
                <div className="triage-input" style={{ background: "#f9fafb" }}>Enfermeira de Triagem</div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <div className="triage-label">Contacto de emergencia</div>
                <input
                  className="triage-input"
                  value={prefs.emergency_phone}
                  onChange={(e) => setPrefs((p) => ({ ...p, emergency_phone: e.target.value }))}
                  placeholder="Ex: +258 84 000 0000"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="form-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>2. Turno Atual / Configuracao de Turno</h2>
          <div className="triage-label">Turno atual</div>
          <div className="triage-input" style={{ background: "#f9fafb" }}>
            {shiftLabel(shiftStatus?.shift_type, shiftStatus?.shift_window)}
          </div>
        </div>

        <div className="form-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>3. Preferencias de Interface</h2>
          <div className="triage-label">Tamanho da letra</div>
          <div ref={fontMenuRef} style={{ position: "relative", maxWidth: "280px" }}>
            <button
              type="button"
              onClick={() => setFontMenuOpen((prev) => !prev)}
              style={{
                width: "100%",
                minHeight: "40px",
                border: "1px solid #2d6f4e",
                background: "#ffffff",
                borderRadius: "10px",
                padding: "10px 42px 10px 12px",
                fontWeight: 700,
                fontSize: "13px",
                color: "#0c3a24",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>{selectedFontLabel}</span>
            </button>
            <span
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#0c3a24",
                pointerEvents: "none",
                display: "inline-flex",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: fontMenuOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
            {fontMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  right: 0,
                  background: "#ffffff",
                  border: "1px solid #dcebe2",
                  borderRadius: "12px",
                  boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
                  padding: "6px",
                  zIndex: 30,
                }}
              >
                {[{ value: 100, label: "Normal", hint: "Tamanho padrao" }, { value: 105, label: "Grande", hint: "Aumenta 5%" }].map((opt) => {
                  const active = Number(prefs.font_scale_percent || 100) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => chooseFontScale(opt.value)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        border: "none",
                        borderRadius: "10px",
                        background: active ? "#edf5f0" : "transparent",
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        marginBottom: "4px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{opt.label}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{opt.hint}</div>
                      </div>
                      {active && (
                        <span
                          style={{
                            color: "#0c3a24",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="form-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>4. Configuracoes de Notificacoes</h2>
          <div style={{ display: "grid", gap: "8px", fontSize: "13px", color: "#374151" }}>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}><input type="checkbox" checked={prefs.notify_new_urgent} onChange={(e) => setPrefs((p) => ({ ...p, notify_new_urgent: e.target.checked }))} /> Novos pacientes Urgent</label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}><input type="checkbox" checked={prefs.notify_wait_over_30} onChange={(e) => setPrefs((p) => ({ ...p, notify_wait_over_30: e.target.checked }))} /> Tempo de espera {">"} 30 min (qualquer prioridade)</label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}><input type="checkbox" checked={prefs.notify_critical_alerts} onChange={(e) => setPrefs((p) => ({ ...p, notify_critical_alerts: e.target.checked }))} /> Alertas criticos (SpO2 baixo, febre {">"}39.5C, suspeita HCM)</label>
            <label style={{ display: "flex", gap: "8px", alignItems: "center" }}><input type="checkbox" checked={prefs.notify_shift_ending} onChange={(e) => setPrefs((p) => ({ ...p, notify_shift_ending: e.target.checked }))} /> Fim de turno aproximando-se (15 min antes)</label>
          </div>
        </div>

        <div className="form-card" style={{ margin: 0 }}>
          <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#111827", marginBottom: "10px" }}>5. Seguranca & Privacidade</h2>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
            <div>
              <div className="triage-label">Ultimo login</div>
              <div className="triage-input" style={{ background: "#f9fafb", minWidth: "260px" }}>{lastLoginLabel}</div>
            </div>
            <button type="button" className="btn-secondary" style={{ width: "auto", minHeight: "36px", padding: "8px 14px", color: "#b91c1c" }} onClick={onLogout}>Terminar sessao</button>
          </div>
        </div>
      </div>
    </div>
  );
}
