import { useMemo, useState } from "react";

const GREEN = "#165034";
const BORDER = "#E7ECE8";
const SURFACE = "#FBFCFB";
const HEADER_BG = "#F7F8F7";
const CARD_RADIUS = 24;

const AVATAR_PALETTES = [
  { bg: "#D1FAE5", color: "#065F46" },
  { bg: "#DBEAFE", color: "#1E40AF" },
  { bg: "#EDE9FE", color: "#5B21B6" },
  { bg: "#FCE7F3", color: "#9D174D" },
  { bg: "#FEF3C7", color: "#92400E" },
  { bg: "#CFFAFE", color: "#155E75" },
];

const getAvatarPalette = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || "").length; i += 1) hash += name.charCodeAt(i);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
};

const getInitials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const Avatar = ({ name, size = 38 }) => {
  const p = getAvatarPalette(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: p.bg,
        color: p.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 700,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </div>
  );
};

const getProgressTheme = (pct, isReady) => {
  if (isReady || pct >= 100) return { text: "#047857", track: "#D1FAE5", fill: "#10B981" };
  if (pct < 35) return { text: "#B45309", track: "#FDE68A", fill: "#F59E0B" };
  if (pct < 70) return { text: "#B45309", track: "#FEF3C7", fill: "#FBBF24" };
  return { text: "#0F766E", track: "#CCFBF1", fill: "#14B8A6" };
};

const ProgressBar = ({ pct, isReady }) => {
  const theme = getProgressTheme(pct, isReady);
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, color: theme.text }}>{pct}% concluído</span>
        {isReady && (
          <span style={{ fontSize: 10, fontWeight: 700, color: "#047857" }}>✓ Pronto</span>
        )}
      </div>
      <div style={{ height: 5, borderRadius: 999, background: theme.track, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 999,
            width: `${Math.min(100, pct)}%`,
            background: theme.fill,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
};

const WorkflowBadge = ({ label, isReady }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 600,
      background: isReady ? "#ECFDF5" : "#FFF7ED",
      color: isReady ? "#065F46" : "#92400E",
      border: `1px solid ${isReady ? "#A7F3D0" : "#FED7AA"}`,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: isReady ? "#10B981" : "#F97316",
        flexShrink: 0,
      }}
    />
    {label}
  </span>
);

const COLS_ALL = ["Paciente", "Exame", "Estado", "Progresso", "Previsão", "Notificado", "Ação"];
const COLS_PEND = ["Paciente", "Exame", "Estado", "Progresso", "Previsão"];

export default function LabWorklistView({
  pendingRows = [],
  readyRows = [],
  loading = false,
  notifyingPatientVisitId = null,
  markingDeliveredVisitId = null,
  onRefresh,
  onOpenLabResult,
  onNotifyPatient,
  onMarkDelivered,
}) {
  const [tab, setTab] = useState("pending");
  const [selectedId, setSelectedId] = useState(null);

  const rows = tab === "pending" ? pendingRows : readyRows;
  const cols = tab === "ready" ? COLS_ALL : COLS_PEND;
  const selectedRow = useMemo(
    () => rows.find((r) => Number(r?.id) === Number(selectedId)) || null,
    [rows, selectedId]
  );
  const totalCount = pendingRows.length + readyRows.length;

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');`}</style>

      <div
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          background: SURFACE,
          borderRadius: CARD_RADIUS + 4,
          border: `1px solid ${BORDER}`,
          padding: "24px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 20,
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
              Exames Solicitados
            </h2>
            <p style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
              Fluxo laboratorial · acompanhamento de pedidos e resultados
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                border: "1px solid #DBE7DF",
                background: "#fff",
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: GREEN,
              }}
            >
              {totalCount} em acompanhamento
            </span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Pendentes",
              value: pendingRows.length,
              bg: "#FFF7ED",
              color: "#C2610C",
              border: "#FED7AA",
            },
            {
              label: "Resultados prontos",
              value: readyRows.length,
              bg: "#ECFDF5",
              color: "#065F46",
              border: "#A7F3D0",
            },
            {
              label: "Total em acomp.",
              value: totalCount,
              bg: "#F0F9FF",
              color: "#0369A1",
              border: "#BAE6FD",
            },
          ].map((c) => (
            <div
              key={c.label}
              style={{
                borderRadius: 18,
                border: `1px solid ${c.border}`,
                background: c.bg,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: c.color,
                  marginBottom: 6,
                }}
              >
                {c.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "inline-flex",
            borderRadius: 999,
            border: `1px solid ${BORDER}`,
            background: "#fff",
            padding: 4,
            marginBottom: 16,
          }}
        >
          {[
            { key: "pending", label: `Pendentes (${pendingRows.length})` },
            { key: "ready", label: `Prontos (${readyRows.length})` },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setSelectedId(null);
              }}
              style={{
                borderRadius: 999,
                border: "none",
                padding: "7px 18px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s",
                background: tab === t.key ? GREEN : "transparent",
                color: tab === t.key ? "#fff" : "#6B7280",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div
            style={{
              borderRadius: CARD_RADIUS,
              border: "1.5px dashed #DBE3DE",
              background: "#fff",
              padding: "48px 24px",
              textAlign: "center",
              fontSize: 13,
              color: "#9CA3AF",
            }}
          >
            {loading
              ? "A carregar exames..."
              : tab === "pending"
                ? "Sem exames pendentes."
                : "Nenhum resultado pronto de momento."}
          </div>
        ) : (
          <div
            style={{
              borderRadius: CARD_RADIUS,
              border: "1px solid #E3E8E4",
              background: "#fff",
              overflowX: "auto",
            }}
          >
            <table
              style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 720 }}
            >
              <thead>
                <tr style={{ background: HEADER_BG }}>
                  {cols.map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#6B7280",
                        whiteSpace: "nowrap",
                        borderTopLeftRadius: i === 0 ? 20 : 0,
                        borderTopRightRadius: i === cols.length - 1 ? 20 : 0,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const selected = Number(row?.id) === Number(selectedId);
                  const isLast = idx === rows.length - 1;
                  const tdBase = {
                    padding: "14px 16px",
                    borderBottom: isLast ? "none" : "1px solid #EDF1ED",
                    fontSize: 13,
                    color: "#374151",
                    verticalAlign: "middle",
                  };

                  return (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      style={{
                        background: selected ? "#F3F7F4" : idx % 2 === 0 ? "#fff" : "#FBFCFB",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                    >
                      <td
                        style={{
                          ...tdBase,
                          borderLeft: selected ? `3px solid ${GREEN}` : "3px solid transparent",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={row.full_name} size={36} />
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#111827",
                                marginBottom: 3,
                              }}
                            >
                              {row.full_name || "-"}
                            </div>
                            <span
                              style={{
                                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                                background: "#F3F4F6",
                                borderRadius: 999,
                                padding: "2px 8px",
                                fontSize: 10,
                                color: "#4B5563",
                              }}
                            >
                              #{row.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {tab === "ready" ? (
                        <td style={tdBase}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#374151",
                              marginBottom: 2,
                            }}
                          >
                            {row.lab_exam_type || row.lab_tests || "Exame"}
                          </div>
                          <WorkflowBadge
                            label={row.workflow_label || "Exame"}
                            isReady={row.is_ready}
                          />
                        </td>
                      ) : null}

                      <td style={tdBase}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            borderRadius: 999,
                            padding: "4px 10px",
                            fontSize: 11,
                            fontWeight: 600,
                            background: row.is_ready ? "#ECFDF5" : "#FFF7ED",
                            color: row.is_ready ? "#065F46" : "#92400E",
                          }}
                        >
                          {row.state_label || (row.is_ready ? "Pronto" : "Pendente")}
                        </span>
                      </td>

                      <td style={{ ...tdBase, minWidth: 150 }}>
                        <ProgressBar pct={row.progress_percent || 0} isReady={row.is_ready} />
                      </td>

                      <td style={tdBase}>
                        <div style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>
                          {row.eta_label || "-"}
                        </div>
                        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                          {row.ready_at_label || ""}
                        </div>
                      </td>

                      {tab === "ready" && (
                        <td style={tdBase}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              borderRadius: 999,
                              padding: "3px 10px",
                              fontSize: 11,
                              fontWeight: 600,
                              background: row.patient_notified ? "#ECFDF5" : "#F9FAFB",
                              color: row.patient_notified ? "#065F46" : "#9CA3AF",
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: row.patient_notified ? "#10B981" : "#D1D5DB",
                              }}
                            />
                            {row.patient_notified ? "Avisado" : "Não avisado"}
                          </span>
                        </td>
                      )}

                      <td style={tdBase}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {row.is_ready ? (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenLabResult?.(row);
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: 999,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 700,
                                  border: "none",
                                  cursor: "pointer",
                                  background: GREEN,
                                  color: "#fff",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Abrir resultado
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onNotifyPatient?.(row);
                                }}
                                disabled={
                                  row.patient_notified || notifyingPatientVisitId === row.id
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: 999,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: `1px solid ${BORDER}`,
                                  cursor: row.patient_notified ? "default" : "pointer",
                                  background: row.patient_notified ? "#F0FDF4" : "#fff",
                                  color: row.patient_notified ? "#065F46" : "#374151",
                                  opacity: notifyingPatientVisitId === row.id ? 0.6 : 1,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.patient_notified
                                  ? "Avisado ✓"
                                  : notifyingPatientVisitId === row.id
                                    ? "A avisar..."
                                    : "Avisar paciente"}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMarkDelivered?.(row);
                                }}
                                disabled={
                                  row.patient_notified || markingDeliveredVisitId === row.id
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  borderRadius: 999,
                                  padding: "6px 14px",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  border: `1px solid ${BORDER}`,
                                  cursor: row.patient_notified ? "default" : "pointer",
                                  background: row.patient_notified ? "#F0FDF4" : "#fff",
                                  color: row.patient_notified ? "#065F46" : "#374151",
                                  opacity: markingDeliveredVisitId === row.id ? 0.6 : 1,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {row.patient_notified
                                  ? "Entregue ?"
                                  : markingDeliveredVisitId === row.id
                                    ? "A registar..."
                                    : "Resultado entregue"}
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {selectedRow && (
          <div
            style={{
              marginTop: 16,
              borderRadius: CARD_RADIUS,
              border: `1px solid ${BORDER}`,
              background: "#fff",
              overflow: "hidden",
              animation: "slideDown 0.2s ease",
            }}
          >
            <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                borderBottom: `1px solid ${BORDER}`,
                padding: "18px 22px",
                background: HEADER_BG,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={selectedRow.full_name} size={46} />
                <div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#111827",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {selectedRow.full_name || "-"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                    Visita #{selectedRow.id} · {selectedRow.lab_exam_type || "Exame"}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#6B7280",
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
            </div>

            <div
              style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}
            >
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <WorkflowBadge
                  label={selectedRow.workflow_label || "Exame"}
                  isReady={selectedRow.is_ready}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Estado", value: selectedRow.state_label || "-" },
                  { label: "Previsão", value: selectedRow.eta_label || "-" },
                  { label: "Pronto em", value: selectedRow.ready_at_label || "-" },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 18,
                      border: `1px solid ${BORDER}`,
                      background: "#fff",
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#9CA3AF",
                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1F2937" }}>{value}</div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "#9CA3AF",
                    marginBottom: 8,
                  }}
                >
                  Progresso do exame
                </div>
                <ProgressBar
                  pct={selectedRow.progress_percent || 0}
                  isReady={selectedRow.is_ready}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                borderTop: `1px solid ${BORDER}`,
                background: "#fff",
                padding: "14px 22px",
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  padding: "8px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#6B7280",
                  cursor: "pointer",
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                }}
              >
                Fechar
              </button>
              {selectedRow.is_ready ? (
                <>
                <button
                  type="button"
                  onClick={() => onMarkDelivered?.(selectedRow)}
                  disabled={
                    selectedRow.patient_notified || markingDeliveredVisitId === selectedRow.id
                  }
                  style={{
                    borderRadius: 999,
                    border: `1px solid ${BORDER}`,
                    background: selectedRow.patient_notified ? "#F0FDF4" : "#fff",
                    padding: "8px 18px",
                    fontSize: 12,
                    fontWeight: 600,
                    color: selectedRow.patient_notified ? "#065F46" : "#374151",
                    cursor: selectedRow.patient_notified ? "default" : "pointer",
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    opacity: markingDeliveredVisitId === selectedRow.id ? 0.6 : 1,
                  }}
                >
                  {selectedRow.patient_notified
                    ? "Resultado Entregue ✓"
                    : markingDeliveredVisitId === selectedRow.id
                      ? "A registar..."
                      : "Marcar Entregue"}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLabResult?.(selectedRow)}
                  style={{
                    borderRadius: 999,
                    border: "none",
                    padding: "8px 20px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: GREEN,
                    color: "#fff",
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  }}
                >
                  Abrir Resultado
                </button>
              </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
