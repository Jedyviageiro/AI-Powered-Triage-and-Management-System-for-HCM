import { useMemo, useState } from "react";
import DoctorPage from "../DoctorPage";

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

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgente", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
  HIGH: { label: "Urgente", bg: "#FEF2F2", color: "#B91C1C", dot: "#EF4444" },
  LESS_URGENT: { label: "Pouco urgente", bg: "#FFF7ED", color: "#C2610C", dot: "#F97316" },
  MEDIUM: { label: "Pouco urgente", bg: "#FFF7ED", color: "#C2610C", dot: "#F97316" },
  NON_URGENT: { label: "Não urgente", bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
  NOT_URGENT: { label: "Não urgente", bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
  LOW: { label: "Não urgente", bg: "#ECFDF5", color: "#065F46", dot: "#10B981" },
};

const STATUS_CONFIG = {
  WAITING_DOCTOR: { label: "Aguardando médico", bg: "#FFF7ED", color: "#C2610C", dot: "#F97316" },
  IN_CONSULTATION: { label: "Em consulta", bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" },
  WAITING: { label: "Aguardando triagem", bg: "#F9FAFB", color: "#6B7280", dot: "#9CA3AF" },
  IN_TRIAGE: { label: "Em triagem", bg: "#F5F3FF", color: "#6D28D9", dot: "#8B5CF6" },
  FINISHED: { label: "Finalizado", bg: "#F9FAFB", color: "#6B7280", dot: "#9CA3AF" },
};

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

const getPriority = (value) =>
  PRIORITY_CONFIG[String(value || "").toUpperCase()] || {
    label: value || "-",
    bg: "#F3F4F6",
    color: "#374151",
    dot: "#9CA3AF",
  };

const getStatus = (value) =>
  STATUS_CONFIG[String(value || "").toUpperCase()] || {
    label: value || "-",
    bg: "#F3F4F6",
    color: "#374151",
    dot: "#9CA3AF",
  };

const formatTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

const formatWait = (mins) => {
  if (mins == null || Number.isNaN(Number(mins))) return "-";
  const value = Math.max(0, Math.round(Number(mins)));
  if (value < 60) return `${value} min`;
  return `${Math.floor(value / 60)}h ${value % 60}min`;
};

function Avatar({ name, size = 38 }) {
  const palette = getAvatarPalette(name);
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
      {getInitials(name)}
    </div>
  );
}

function StatusBadge({ value }) {
  const cfg = getStatus(value);
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
        style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }}
      />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ value }) {
  const cfg = getPriority(value);
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
        style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }}
      />
      {cfg.label}
    </span>
  );
}

export function DoctorPacientesView({
  queue = [],
  loading = false,
  onRefresh,
  onOpenVisit,
  onAttendVisit,
  selectedVisitId,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const title = "Meus Pacientes";
  const subtitle = "Pacientes atribuídos a si neste turno";
  const todayLabel = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long" });

  const rows = useMemo(() => {
    const base = Array.isArray(queue) ? [...queue] : [];
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? base.filter(
          (visit) =>
            (visit?.full_name || "").toLowerCase().includes(query) ||
            (visit?.clinical_code || "").toLowerCase().includes(query)
        )
      : base;

    return filtered.sort((a, b) => {
      const priorityIndex = (visit) => {
        const priority = String(visit?.priority || "").toUpperCase();
        if (["URGENT", "HIGH"].includes(priority)) return 0;
        if (["LESS_URGENT", "MEDIUM"].includes(priority)) return 1;
        if (["NON_URGENT", "NOT_URGENT", "LOW"].includes(priority)) return 2;
        return 3;
      };

      const diff = priorityIndex(a) - priorityIndex(b);
      if (diff !== 0) return diff;
      return new Date(a?.arrival_time || 0) - new Date(b?.arrival_time || 0);
    });
  }, [queue, searchQuery]);

  const selectedRow = useMemo(
    () => rows.find((row) => Number(row?.id) === Number(selectedId)) || null,
    [rows, selectedId]
  );

  const waitingCount = rows.filter((visit) => visit.status === "WAITING_DOCTOR").length;
  const inConsultCount = rows.filter((visit) => visit.status === "IN_CONSULTATION").length;
  const urgentCount = rows.filter((visit) =>
    ["URGENT", "HIGH"].includes(String(visit?.priority || "").toUpperCase())
  ).length;

  const canAttend = (row) => {
    const status = String(row?.status || "").toUpperCase();
    return status === "WAITING_DOCTOR" || status === "IN_CONSULTATION";
  };

  return (
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
            {title}
          </h2>
          <p style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
            {subtitle} · {todayLabel}
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {[
            {
              label: `${waitingCount} aguardando`,
              bg: "#FFF7ED",
              color: "#C2610C",
              border: "#FED7AA",
            },
            {
              label: `${inConsultCount} em consulta`,
              bg: "#EFF6FF",
              color: "#1D4ED8",
              border: "#BFDBFE",
            },
            ...(urgentCount > 0
              ? [
                  {
                    label: `${urgentCount} urgente${urgentCount > 1 ? "s" : ""}`,
                    bg: "#FEF2F2",
                    color: "#B91C1C",
                    border: "#FECACA",
                  },
                ]
              : []),
          ].map((pill) => (
            <span
              key={pill.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: 999,
                border: `1px solid ${pill.border}`,
                background: pill.bg,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 700,
                color: pill.color,
              }}
            >
              {pill.label}
            </span>
          ))}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: `1px solid ${BORDER}`,
              borderRadius: 999,
              padding: "6px 14px",
            }}
          >
            <svg
              width="13"
              height="13"
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
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                fontSize: 12,
                color: "#374151",
                width: 130,
              }}
            />
          </div>
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
          {loading ? "A carregar pacientes..." : "Sem pacientes na fila no momento."}
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
            style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, minWidth: 680 }}
          >
            <thead>
              <tr style={{ background: HEADER_BG }}>
                {["Chegada", "Espera", "Paciente", "Prioridade", "Código", "Ação"].map(
                  (header, index, all) => (
                    <th
                      key={header}
                      style={{
                        padding: "12px 16px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "#6B7280",
                        borderTopLeftRadius: index === 0 ? 20 : 0,
                        borderTopRightRadius: index === all.length - 1 ? 20 : 0,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const selected = Number(row?.id) === Number(selectedId);
                const isActive = Number(row?.id) === Number(selectedVisitId);
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
                    key={row.id}
                    onClick={() => setSelectedId(row.id)}
                    style={{
                      background: isActive
                        ? "#F0F7F3"
                        : selected
                          ? "#F3F7F4"
                          : index % 2 === 0
                            ? "#fff"
                            : "#FBFCFB",
                      cursor: "pointer",
                      transition: "background 0.1s",
                    }}
                  >
                    <td
                      style={{
                        ...tdBase,
                        borderLeft:
                          selected || isActive ? `3px solid ${GREEN}` : "3px solid transparent",
                        fontWeight: 500,
                        color: "#1F2937",
                      }}
                    >
                      {formatTime(row.arrival_time)}
                    </td>
                    <td style={tdBase}>
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                          fontSize: 12,
                          fontWeight: 600,
                          color:
                            row.wait_minutes >= 60
                              ? "#B91C1C"
                              : row.wait_minutes >= 30
                                ? "#C2610C"
                                : "#374151",
                          background:
                            row.wait_minutes >= 60
                              ? "#FEF2F2"
                              : row.wait_minutes >= 30
                                ? "#FFF7ED"
                                : "#F3F4F6",
                          borderRadius: 999,
                          padding: "3px 10px",
                        }}
                      >
                        {formatWait(row.wait_minutes)}
                      </span>
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
                          <StatusBadge value={row.status} />
                        </div>
                      </div>
                    </td>
                    <td style={tdBase}>
                      <PriorityBadge value={row.priority} />
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
                    <td style={tdBase}>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedId(row.id);
                          if (canAttend(row)) onAttendVisit?.(row.id, row);
                        }}
                        disabled={!canAttend(row)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          borderRadius: 999,
                          padding: "6px 16px",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: canAttend(row) ? "pointer" : "default",
                          background: canAttend(row) ? GREEN : "#F3F4F6",
                          color: canAttend(row) ? "#fff" : "#9CA3AF",
                          border: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.status === "IN_CONSULTATION"
                          ? "Continuar"
                          : canAttend(row)
                            ? "Atender"
                            : "Aguardando"}
                      </button>
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
                  {selectedRow.clinical_code || "Sem código"} · Visita #{selectedRow.id}
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

          <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <StatusBadge value={selectedRow.status} />
              <PriorityBadge value={selectedRow.priority} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Chegada", value: formatTime(selectedRow.arrival_time) },
                { label: "Tempo de espera", value: formatWait(selectedRow.wait_minutes) },
                { label: "Código clínico", value: selectedRow.clinical_code || "-", mono: true },
              ].map(({ label, value, mono }) => (
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
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#1F2937",
                      fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : "inherit",
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {(selectedRow.chief_complaint || selectedRow.triage_chief_complaint) && (
              <div
                style={{
                  borderRadius: 18,
                  border: `1px solid ${BORDER}`,
                  background: "#F8FAF9",
                  padding: "14px 16px",
                  borderLeft: `3px solid ${GREEN}`,
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
                  Queixa principal
                </div>
                <div style={{ fontSize: 13, lineHeight: "1.6", color: "#374151" }}>
                  {selectedRow.chief_complaint || selectedRow.triage_chief_complaint}
                </div>
              </div>
            )}
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
            <button
              type="button"
              onClick={() => onOpenVisit?.(selectedRow.id, selectedRow)}
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
              Abrir Consulta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorPacientes() {
  return <DoctorPage forcedView="myPatients" />;
}
