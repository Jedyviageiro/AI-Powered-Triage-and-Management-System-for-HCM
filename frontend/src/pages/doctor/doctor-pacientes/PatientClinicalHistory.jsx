import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DoctorPage from "../DoctorPage";
import PatientHistoryModal from "./PatientHistoryModal";

const G = "#165034";
const BORDER = "#E7ECE8";
const SURF = "#FCFDFC";
const R = 24;

const PALS = [
  { bg: "#D1FAE5", fg: "#065F46" },
  { bg: "#DBEAFE", fg: "#1E40AF" },
  { bg: "#EDE9FE", fg: "#5B21B6" },
  { bg: "#FCE7F3", fg: "#9D174D" },
  { bg: "#FEF3C7", fg: "#92400E" },
  { bg: "#CFFAFE", fg: "#155E75" },
];

const pal = (name) => {
  let hash = 0;
  for (const c of name || "") hash += c.charCodeAt(0);
  return PALS[hash % PALS.length];
};

const ini = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const Avatar = ({ name, size = 40 }) => {
  const { bg, fg } = pal(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: "0.01em",
      }}
    >
      {ini(name)}
    </div>
  );
};

const calcAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  return Math.max(
    0,
    now.getFullYear() -
      birth.getFullYear() -
      (now >= new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 0 : 1)
  );
};

const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const Suggestion = ({ patient, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const age = calcAge(patient.birth_date);
  return (
    <button
      type="button"
      onClick={() => onClick(patient)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        textAlign: "left",
        border: "none",
        background: hovered ? "#F3F7F4" : "#fff",
        padding: "12px 16px",
        cursor: "pointer",
        transition: "background 0.1s",
        display: "flex",
        alignItems: "center",
        gap: 13,
        borderBottom: `1px solid ${BORDER}`,
      }}
    >
      <Avatar name={patient.full_name} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3 }}>
          {patient.full_name || "-"}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {patient.clinical_code ? (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                background: "#F3F4F6",
                borderRadius: 999,
                padding: "1px 8px",
                fontSize: 11,
                color: "#4B5563",
              }}
            >
              {patient.clinical_code}
            </span>
          ) : null}
          {age != null ? <span style={{ fontSize: 11, color: "#9CA3AF" }}>{age} anos</span> : null}
          {patient.birth_date ? (
            <span style={{ fontSize: 11, color: "#9CA3AF" }}>
              Nasc. {fmtDate(patient.birth_date)}
            </span>
          ) : null}
        </div>
      </div>
      <svg
        width="13"
        height="13"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#C4CFC9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
};

export function PatientClinicalHistoryView({
  historyQuery,
  setHistoryQuery,
  historySearchLoading,
  historySearchResults,
  historySuggestOpen,
  setHistorySuggestOpen,
  historySearchRef,
  historyModal,
  onOpenHistoryPatient,
  onCloseHistoryModal,
  onSearchHistoryPatients,
}) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
      `}</style>

      <div
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            background: SURF,
            borderRadius: R + 4,
            border: `1px solid ${BORDER}`,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 20,
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
                Histórico Clínico
              </h2>
              <p style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
                Pesquisa por paciente · histórico completo pediátrico
              </p>
            </div>
            <span
              style={{
                borderRadius: 999,
                border: "1px solid #DBE7DF",
                background: "#fff",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: G,
              }}
            >
              Histórico
            </span>
          </div>

          <div ref={historySearchRef} style={{ position: "relative" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fff",
                border: `1.5px solid ${focused ? "#86EFAC" : BORDER}`,
                borderRadius: 999,
                padding: "10px 18px",
                transition: "border-color 0.15s, box-shadow 0.15s",
                boxShadow: focused ? "0 0 0 3px rgba(134,239,172,0.14)" : "none",
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                placeholder="Digite o nome do paciente..."
                value={historyQuery}
                onFocus={() => {
                  setFocused(true);
                  setHistorySuggestOpen(true);
                }}
                onBlur={() => setFocused(false)}
                onChange={(event) => {
                  setHistoryQuery(event.target.value);
                  setHistorySuggestOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSearchHistoryPatients?.();
                  if (event.key === "Escape") setHistorySuggestOpen(false);
                }}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  flex: 1,
                  fontSize: 14,
                  color: "#374151",
                }}
              />
              {historyQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setHistoryQuery("");
                    setHistorySuggestOpen(false);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: "#9CA3AF",
                    padding: 2,
                    flexShrink: 0,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : null}
            </div>

            {historyQuery.trim() && historySuggestOpen ? (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "calc(100% + 8px)",
                  zIndex: 20,
                  background: "#fff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: R,
                  boxShadow: "0 16px 40px rgba(12,58,36,0.09)",
                  overflow: "hidden",
                  maxHeight: 320,
                  overflowY: "auto",
                }}
              >
                {historySearchLoading ? (
                  [1, 2, 3].map((item) => (
                    <div
                      key={item}
                      style={{
                        height: 56,
                        margin: "8px",
                        borderRadius: 12,
                        background: "#F3F4F6",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                  ))
                ) : historySearchResults.length === 0 ? (
                  <div
                    style={{
                      padding: "20px 18px",
                      fontSize: 13,
                      color: "#9CA3AF",
                      textAlign: "center",
                    }}
                  >
                    Nenhum paciente encontrado para "{historyQuery}"
                  </div>
                ) : (
                  historySearchResults.map((patient, index) => (
                    <Suggestion
                      key={patient.id || index}
                      patient={patient}
                      onClick={onOpenHistoryPatient}
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>

          {!historyQuery.trim() ? (
            <p style={{ marginTop: 14, fontSize: 13, color: "#9CA3AF" }}>
              Comece a escrever para ver sugestoes de pacientes.
            </p>
          ) : null}
        </div>
      </div>

      {historyModal?.open && historyModal?.patient && typeof document !== "undefined"
        ? createPortal(
            <PatientHistoryModal modal={historyModal} onClose={onCloseHistoryModal} />,
            document.body
          )
        : null}
    </>
  );
}

export default function PatientClinicalHistory() {
  return <DoctorPage forcedView="clinicalHistory" />;
}
