import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import DoctorPage from "../DoctorPage";

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const parsed = toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatTime = (value) => {
  const parsed = toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractScheduledTime = (row) => {
  const embedded = String(row?.follow_up_when || "").match(/\b(\d{2}:\d{2})\b/);
  if (embedded) return embedded[1];
  const fallback = formatTime(row?.arrival_time || row?.return_visit_date);
  return fallback === "-" ? "" : fallback;
};

const extractClinicalReturnReason = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "-";
  return (
    raw
      .replace(/retornos previstos:\s*\d+\s*\|\s*datas:\s*[^|]+/i, "")
      .replace(/^\s*\|\s*/, "")
      .trim() || "-"
  );
};

const STATUS_CONFIG = {
  WAITING_DOCTOR: { label: "Aguardando", bg: "#FFF7ED", color: "#C2610C", dot: "#F97316" },
  IN_CONSULTATION: { label: "Em consulta", bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  FINISHED: { label: "Consulta fechada", bg: "#F9FAFB", color: "#6B7280", dot: "#9CA3AF" },
  CANCELLED: { label: "Cancelada", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
};

const getStatusConfig = (value) => {
  const key = String(value || "").toUpperCase();
  return (
    STATUS_CONFIG[key] || { label: key || "-", bg: "#F3F4F6", color: "#374151", dot: "#9CA3AF" }
  );
};

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
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const CARD_RADIUS = 24;
const GREEN = "#165034";
const BORDER = "#E7ECE8";
const SURFACE = "#FBFCFB";
const HEADER_BG = "#F7F8F7";

function Avatar({ name, size = 40 }) {
  const palette = getAvatarPalette(name);
  const initials = getInitials(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: palette.bg,
        color: palette.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.3,
        fontWeight: 700,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: cfg.bg,
        color: cfg.color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
      {cfg.label}
    </span>
  );
}

const RefreshIcon = () => (
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
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const SpinIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    style={{ animation: "spin 0.8s linear infinite" }}
  >
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export function DoctorScheduledFollowupsView({
  returnsToday = [],
  loading = false,
  onRefresh,
  onOpenVisit,
}) {
  const [selectedId, setSelectedId] = useState(null);

  const todayLabel = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long" });

  const isFutureDate = (value) => {
    const parsed = toDate(value);
    if (!parsed) return false;
    const d = new Date(parsed);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d.getTime() > t.getTime();
  };

  const rows = useMemo(() => {
    return (Array.isArray(returnsToday) ? returnsToday : [])
      .filter((row) => String(row?.status || "").toUpperCase() !== "CANCELLED")
      .slice()
      .sort(
        (a, b) =>
          new Date(
            `${String(a?.return_visit_date || a?.arrival_time || "").slice(0, 10)}T${extractScheduledTime(a) || "23:59"}:00`
          ) -
          new Date(
            `${String(b?.return_visit_date || b?.arrival_time || "").slice(0, 10)}T${extractScheduledTime(b) || "23:59"}:00`
          )
      );
  }, [returnsToday]);

  const selectedRow = useMemo(
    () => rows.find((row) => Number(row?.id) === Number(selectedId)) || null,
    [rows, selectedId]
  );

  const cols = ["Data", "Hora", "Paciente", "Código", "Motivo", "Ação"];

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>

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
                lineHeight: 1.2,
              }}
            >
              Consultas marcadas
            </h2>
            <p style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
              Retornos agendados · {todayLabel}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
              {rows.length} marcadas
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
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? (
                <>
                  <SpinIcon />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshIcon />
                  Atualizar
                </>
              )}
            </button>
          </div>
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
            Sem consultas marcadas no momento.
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
              style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 640 }}
            >
              <thead>
                <tr>
                  {cols.map((header, index) => (
                    <th
                      key={header}
                      style={{
                        background: HEADER_BG,
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#6B7280",
                        borderTopLeftRadius: index === 0 ? 20 : 0,
                        borderTopRightRadius: index === cols.length - 1 ? 20 : 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const selected = Number(row?.id) === Number(selectedId);
                  const canOpen = !isFutureDate(row?.return_visit_date);
                  const isLast = index === rows.length - 1;
                  const tdBase = {
                    padding: "14px 16px",
                    borderBottom: isLast ? "none" : "1px solid #EDF1ED",
                    fontSize: 13,
                    color: "#374151",
                    verticalAlign: "middle",
                  };

                  return (
                    <tr
                      key={`scheduled-${row.id}`}
                      onClick={() => setSelectedId(row.id)}
                      style={{
                        background: selected ? "#F3F7F4" : index % 2 === 0 ? "#fff" : "#FBFCFB",
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                    >
                      <td
                        style={{
                          ...tdBase,
                          borderLeft: selected ? `3px solid ${GREEN}` : "3px solid transparent",
                          fontWeight: 500,
                          color: "#1F2937",
                        }}
                      >
                        {formatDate(row.return_visit_date)}
                      </td>
                      <td style={{ ...tdBase, fontWeight: 600, color: "#111827" }}>
                        {extractScheduledTime(row)}
                      </td>
                      <td style={tdBase}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <Avatar name={row.full_name} size={38} />
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                color: "#111827",
                                marginBottom: 4,
                              }}
                            >
                              {row.full_name || "-"}
                            </div>
                            <StatusBadge status={row.status} />
                          </div>
                        </div>
                      </td>
                      <td style={tdBase}>
                        <span
                          style={{
                            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                            background: "#F3F4F6",
                            borderRadius: 999,
                            padding: "3px 10px",
                            fontSize: 12,
                            color: "#4B5563",
                          }}
                        >
                          {row.clinical_code || "-"}
                        </span>
                      </td>
                      <td
                        style={{ ...tdBase, maxWidth: 260, overflow: "hidden" }}
                        title={extractClinicalReturnReason(row.return_visit_reason)}
                      >
                        <div
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            lineHeight: "1.45",
                          }}
                        >
                          {extractClinicalReturnReason(row.return_visit_reason)}
                        </div>
                      </td>
                      <td style={tdBase}>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedId(row.id);
                            if (canOpen) onOpenVisit?.(row.id, row);
                          }}
                          disabled={!canOpen}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            borderRadius: 999,
                            padding: "6px 16px",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: canOpen ? "pointer" : "default",
                            background: canOpen ? GREEN : "#F3F4F6",
                            color: canOpen ? "#fff" : "#9CA3AF",
                            border: "none",
                            transition: "background 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          title={canOpen ? "Abrir consulta" : "So pode abrir no dia da consulta."}
                        >
                          {canOpen ? "Abrir" : "Aguardando"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRow && typeof document !== "undefined"
        ? createPortal(
            <div
              onClick={(event) => {
                if (event.target === event.currentTarget) setSelectedId(null);
              }}
              style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                zIndex: 400,
                background: "rgba(15,23,42,0.40)",
                backdropFilter: "blur(5px)",
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 720,
                  background: SURFACE,
                  borderRadius: 30,
                  border: "1px solid rgba(255,255,255,0.7)",
                  boxShadow: "0 24px 80px rgba(15,23,42,0.18)",
                  overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
                  <div style={{ width: 40, height: 4, borderRadius: 999, background: "#D1D5DB" }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    borderBottom: `1px solid ${BORDER}`,
                    padding: "20px 24px",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#9CA3AF",
                        marginBottom: 10,
                      }}
                    >
                      Detalhes da consulta
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <Avatar name={selectedRow.full_name} size={48} />
                      <div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#111827",
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {selectedRow.full_name || "-"}
                        </div>
                        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
                          {selectedRow.clinical_code || "Sem código"} · Consulta de retorno
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Fechar"
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      border: `1px solid ${BORDER}`,
                      background: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      flexShrink: 0,
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
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                  }}
                >
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <StatusBadge status={selectedRow.status} />
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        borderRadius: 999,
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        background: isFutureDate(selectedRow.return_visit_date)
                          ? "#FFF7ED"
                          : "#ECFDF5",
                        color: isFutureDate(selectedRow.return_visit_date) ? "#C2610C" : "#065F46",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          display: "inline-block",
                          background: isFutureDate(selectedRow.return_visit_date)
                            ? "#F97316"
                            : "#10B981",
                        }}
                      />
                      {isFutureDate(selectedRow.return_visit_date) ? "Agendada" : "Disponivel"}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { label: "Data", value: formatDate(selectedRow.return_visit_date) },
                      { label: "Hora", value: extractScheduledTime(selectedRow) },
                      { label: "Estado", value: getStatusConfig(selectedRow.status).label },
                      {
                        label: "Abertura",
                        value: isFutureDate(selectedRow.return_visit_date)
                          ? "Disponivel no dia agendado"
                          : "Disponivel agora",
                        highlight: !isFutureDate(selectedRow.return_visit_date),
                      },
                    ].map(({ label, value, highlight }) => (
                      <div
                        key={label}
                        style={{
                          borderRadius: 20,
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
                            marginBottom: 6,
                          }}
                        >
                          {label}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: highlight ? "#065F46" : "#1F2937",
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      borderRadius: 22,
                      border: `1px solid ${BORDER}`,
                      background: "#fff",
                      padding: "16px 18px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "#9CA3AF",
                        marginBottom: 10,
                      }}
                    >
                      Motivo da consulta
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: "1.65",
                        color: "#374151",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {extractClinicalReturnReason(selectedRow.return_visit_reason)}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    borderTop: `1px solid ${BORDER}`,
                    background: "#fff",
                    padding: "14px 24px",
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
                  <button
                    type="button"
                    onClick={() => onOpenVisit?.(selectedRow.id, selectedRow)}
                    disabled={isFutureDate(selectedRow.return_visit_date)}
                    style={{
                      borderRadius: 999,
                      border: "none",
                      padding: "8px 18px",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: isFutureDate(selectedRow.return_visit_date) ? "default" : "pointer",
                      background: isFutureDate(selectedRow.return_visit_date) ? "#F3F4F6" : GREEN,
                      color: isFutureDate(selectedRow.return_visit_date) ? "#9CA3AF" : "#fff",
                      transition: "background 0.15s",
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    }}
                    title={
                      isFutureDate(selectedRow.return_visit_date)
                        ? "So pode abrir no dia da consulta."
                        : "Abrir consulta"
                    }
                  >
                    Abrir Consulta
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export default function DoctorScheduledFollowups() {
  return <DoctorPage forcedView="scheduledFollowups" />;
}
