import { useEffect, useMemo, useRef, useState } from "react";

const G = "#165034";
const GDARK = "#0c3a24";
const BORDER = "#E7ECE8";
const SURF = "#FCFDFC";

const DEFAULTS = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

const shiftLabel = (type, win) => {
  const t = String(type || "").toUpperCase();
  if (t === "MORNING") return `Manhã · ${win || "07:30 – 14:00"}`;
  if (t === "AFTERNOON") return `Tarde · ${win || "14:00 – 20:00"}`;
  if (t === "NIGHT") return `Noite · ${win || "20:00 – 08:00"}`;
  return win || "—";
};

const ini = (name) => {
  const p = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!p.length) return "U";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0]}${p[p.length - 1][0]}`.toUpperCase();
};

const Label = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#9CA3AF",
      marginBottom: 14,
    }}
  >
    {children}
  </div>
);

const Card = ({ children, style = {} }) => (
  <div
    style={{
      background: "#fff",
      border: `1px solid ${BORDER}`,
      borderRadius: 18,
      padding: "20px 22px",
      ...style,
    }}
  >
    {children}
  </div>
);

const StatChip = ({ label, value, mono, green }) => (
  <div
    style={{
      borderRadius: 14,
      border: `1px solid ${BORDER}`,
      background: SURF,
      padding: "12px 14px",
    }}
  >
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.09em",
        color: "#9CA3AF",
        marginBottom: 5,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        color: green ? "#065F46" : "#111827",
        fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : "inherit",
      }}
    >
      {value || "—"}
    </div>
  </div>
);

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    style={{
      width: 42,
      height: 24,
      borderRadius: 999,
      background: checked ? G : "#D1D5DB",
      border: "none",
      cursor: "pointer",
      padding: 3,
      display: "flex",
      alignItems: "center",
      transition: "background 0.2s",
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s",
      }}
    />
  </button>
);

const FontPicker = ({ value, onChange }) => (
  <div
    style={{
      display: "inline-flex",
      borderRadius: 999,
      border: `1px solid ${BORDER}`,
      background: "#fff",
      padding: 3,
    }}
  >
    {[
      { v: 100, label: "Normal" },
      { v: 105, label: "Grande" },
    ].map((o) => (
      <button
        key={o.v}
        type="button"
        onClick={() => onChange(o.v)}
        style={{
          borderRadius: 999,
          border: "none",
          padding: "6px 20px",
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          transition: "all 0.15s",
          background: value === o.v ? G : "transparent",
          color: value === o.v ? "#fff" : "#6B7280",
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export default function PreferencesView({
  me,
  shiftStatus,
  onLogout,
  preferences,
  loading = false,
  saving = false,
  onSave,
  onPreview,
  subtitle = "Configuração pessoal do médico",
  roleLabel = "Médico",
}) {
  const sourcePrefs = useMemo(() => ({ ...DEFAULTS, ...(preferences || {}) }), [preferences]);
  const [prefs, setPrefs] = useState(() => sourcePrefs);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    const syncTimer = setTimeout(() => {
      setPrefs(sourcePrefs);
    }, 0);
    return () => clearTimeout(syncTimer);
  }, [sourcePrefs]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = (type, msg) => {
    clearTimeout(timer.current);
    setToast({ type, msg });
    timer.current = setTimeout(() => setToast(null), 3000);
  };

  const save = async () => {
    try {
      await onSave?.(prefs);
      showToast("ok", "Preferências guardadas.");
    } catch (e) {
      showToast("err", e?.message || "Erro ao guardar.");
    }
  };

  const setFont = (scale) => {
    const patch = { font_scale_percent: scale, font_size: scale > 100 ? "LARGE" : "NORMAL" };
    const next = { ...prefs, ...patch };
    setPrefs(next);
    onPreview?.(patch);
    Promise.resolve(onSave?.(next)).catch((e) => showToast("err", e?.message || "Erro."));
  };

  const set = (k, v) => setPrefs((p) => ({ ...p, [k]: v }));
  const fontScale = Number(prefs.font_scale_percent || 100);
  const lastLogin = me?.last_login_at ? new Date(me.last_login_at).toLocaleString("pt-PT") : "—";

  const NOTIFS = [
    {
      key: "notify_new_urgent",
      label: "Novos pacientes urgentes",
      hint: "Avisa quando um caso prioritário entra na fila.",
    },
    {
      key: "notify_wait_over_30",
      label: "Espera acima de 30 min",
      hint: "Sinaliza pacientes a ultrapassar o tempo esperado.",
    },
    {
      key: "notify_critical_alerts",
      label: "Alertas clínicos críticos",
      hint: "Sinais graves ou revisão imediata necessária.",
    },
    {
      key: "notify_shift_ending",
      label: "Fim de turno próximo",
      hint: "Lembrete 15 min antes do fim do turno.",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(4px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      <div
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          width: "100%",
          maxWidth: 920,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 22,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
              }}
            >
              Preferências
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6B7280" }}>{subtitle}</p>
          </div>
          <button
            type="button"
            disabled={loading || saving}
            onClick={save}
            style={{
              borderRadius: 999,
              border: "none",
              background: G,
              color: "#fff",
              padding: "9px 22px",
              fontSize: 13,
              fontWeight: 700,
              cursor: loading || saving ? "not-allowed" : "pointer",
              opacity: loading || saving ? 0.65 : 1,
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              transition: "opacity 0.15s",
            }}
          >
            {saving ? "A guardar..." : "Guardar"}
          </button>
        </div>

        {toast && (
          <div
            style={{
              marginBottom: 14,
              borderRadius: 14,
              padding: "10px 14px",
              fontSize: 13,
              fontWeight: 600,
              animation: "fadeUp 0.2s ease",
              background: toast.type === "ok" ? "#F0FDF4" : "#FFF1F2",
              color: toast.type === "ok" ? "#065F46" : "#9F1239",
              border: `1px solid ${toast.type === "ok" ? "#A7F3D0" : "#FDA4AF"}`,
            }}
          >
            {toast.msg}
          </div>
        )}

        <div
          style={{ opacity: loading ? 0.65 : 1, display: "flex", flexDirection: "column", gap: 2 }}
        >
          <Card style={{ borderRadius: "22px 22px 8px 8px" }}>
            <Label>Perfil</Label>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg,${GDARK},#2d6f4e)`,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {ini(me?.full_name)}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {me?.full_name || "—"}
                </div>
                <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>{roleLabel}</div>
              </div>
            </div>

            {[
              { label: "Último login", value: lastLogin },
              { label: "Especialização", value: me?.specialization },
            ]
              .filter((r) => r.value)
              .map((r) => (
                <div
                  key={r.label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "10px 0",
                    borderBottom: `1px solid ${BORDER}`,
                  }}
                >
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{r.value}</span>
                </div>
              ))}

            <div style={{ marginTop: 16 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#374151",
                  display: "block",
                  marginBottom: 7,
                }}
              >
                Contacto de emergência
              </label>
              <input
                value={prefs.emergency_phone}
                onChange={(e) => set("emergency_phone", e.target.value)}
                placeholder="+258 84 000 0000"
                onFocus={(e) => {
                  e.target.style.borderColor = "#86EFAC";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = BORDER;
                }}
                style={{
                  width: "100%",
                  borderRadius: 999,
                  border: `1.5px solid ${BORDER}`,
                  padding: "9px 16px",
                  fontSize: 13,
                  background: SURF,
                  color: "#111827",
                  outline: "none",
                  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
              />
            </div>
          </Card>

          <Card style={{ borderRadius: 8 }}>
            <Label>Turno atual</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              <StatChip
                label="Período"
                value={shiftLabel(shiftStatus?.shift_type, shiftStatus?.shift_window)}
              />
              <StatChip
                label="Estado"
                value={shiftStatus?.is_on_shift ? "Em turno" : "Fora de turno"}
                green={shiftStatus?.is_on_shift}
              />
              <StatChip
                label="Entrada registada"
                mono
                value={
                  shiftStatus?.clock_in_at
                    ? new Date(shiftStatus.clock_in_at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"
                }
              />
            </div>
          </Card>

          <Card style={{ borderRadius: 8 }}>
            <Label>Interface</Label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 3 }}>
                  Tamanho da letra
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  Ajusta o tamanho do texto em todo o painel
                </div>
              </div>
              <FontPicker value={fontScale} onChange={setFont} />
            </div>
          </Card>

          <Card style={{ borderRadius: 8 }}>
            <Label>Notificações</Label>
            {NOTIFS.map((item, i) => (
              <div
                key={item.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "13px 0",
                  borderBottom: i < NOTIFS.length - 1 ? `1px solid ${BORDER}` : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.4 }}>{item.hint}</div>
                </div>
                <Toggle checked={!!prefs[item.key]} onChange={(v) => set(item.key, v)} />
              </div>
            ))}
          </Card>

          <Card style={{ borderRadius: "8px 8px 22px 22px" }}>
            <Label>Sessão</Label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
                  Terminar sessão
                </div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                  Encerra a sua sessão atual e regressa ao login.
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FEE2E2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#FFF1F2";
                }}
                style={{
                  borderRadius: 999,
                  border: "1px solid #FECACA",
                  background: "#FFF1F2",
                  color: "#B91C1C",
                  padding: "8px 20px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  transition: "background 0.15s",
                }}
              >
                Terminar sessão
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
