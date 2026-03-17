import { useMemo, useState } from "react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_LABELS = {
  WAITING: "Aguardando triagem",
  IN_TRIAGE: "Em triagem",
  WAITING_DOCTOR: "Aguardando médico",
  IN_CONSULTATION: "Em consulta",
  FINISHED: "Finalizado",
  SCHEDULED: "Agendado",
};

const STATUS_PILL = {
  WAITING: { bg: "#FFF7ED", color: "#C2410C" },
  IN_TRIAGE: { bg: "#FEFCE8", color: "#854D0E" },
  WAITING_DOCTOR: { bg: "#FEF2F2", color: "#B91C1C" },
  IN_CONSULTATION: { bg: "#EFF6FF", color: "#1D4ED8" },
  FINISHED: { bg: "#F0FDF4", color: "#15803D" },
  SCHEDULED: { bg: "#ECFEFF", color: "#0F766E" },
};

const EVENT_STYLE = {
  Consulta: { bg: "#EEF4FF", border: "#3B82F6", color: "#1E3A8A" },
  Retorno: { bg: "#EDFDF4", border: "#22C55E", color: "#166534" },
  default: { bg: "#FFF7ED", border: "#F97316", color: "#C2410C" },
};

const BORDER = "1px solid rgba(148, 163, 184, 0.16)";
const GRID = "1px solid rgba(148, 163, 184, 0.12)";
const SHELL_BG = "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%)";
const HEADER_BG = "rgba(248, 250, 252, 0.92)";
const ROW_A = "rgba(248, 250, 252, 0.72)";
const ROW_B = "rgba(241, 245, 249, 0.78)";
const SELECTED = "rgba(226, 232, 240, 0.72)";
const GUTTER = 56;
const SYSTEM_GREEN = "#165034";
const SYSTEM_GREEN_DARK = "#0c3a24";
const baseButton = { border: "none", fontFamily: "inherit", outline: "none" };

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toDate = (value) => {
  if (!value) return null;
  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? null : next;
};

const canOpen = (value) => toDate(value)?.getTime() <= Date.now();
const pad = (n) => String(n).padStart(2, "0");
const fmtTime = (h, m = 0) => `${pad(h)}:${pad(m)}`;
const extractTimeValue = (value) => {
  const match = String(value || "").match(/\b(\d{2}):(\d{2})\b/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
};

const normalizeAssigned = (rows) =>
  (rows || [])
    .map((row) => {
      const date = toDate(row.arrival_time);
      if (!date) return null;
      return {
        id: row.id,
        visit_id: row.id,
        patient_name: row.full_name || "-",
        clinical_code: row.clinical_code || "",
        date,
        status: row.status || "WAITING_DOCTOR",
        type: "Consulta",
      };
    })
    .filter(Boolean);

const normalizeReturns = (rows) =>
  (rows || [])
    .map((row) => {
      const date = toDate(row.return_visit_date);
      if (!date) return null;
      const arrival = toDate(row.arrival_time);
      const scheduled = extractTimeValue(row.follow_up_when);
      date.setHours(
        scheduled?.hours ?? arrival?.getHours() ?? 9,
        scheduled?.minutes ?? arrival?.getMinutes() ?? 0,
        0,
        0
      );
      return {
        id: `r-${row.id}`,
        visit_id: row.id,
        patient_name: row.full_name || "-",
        clinical_code: row.clinical_code || "",
        date,
        status: "SCHEDULED",
        type: "Retorno",
        follow_up_when: row.follow_up_when || "",
      };
    })
    .filter(Boolean);

function AgendaEvent({ appointment, onOpenVisit }) {
  const style = EVENT_STYLE[appointment.type] || EVENT_STYLE.default;
  const allowed = canOpen(appointment.date);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (allowed) onOpenVisit?.(appointment.visit_id, appointment);
      }}
      style={{
        ...baseButton,
        width: "100%",
        padding: "8px 10px",
        borderRadius: 12,
        border: `1px solid ${style.border}2F`,
        background: `linear-gradient(180deg, rgba(255,255,255,0.96) 0%, ${style.bg} 100%)`,
        color: style.color,
        textAlign: "left",
        cursor: allowed ? "pointer" : "not-allowed",
        opacity: allowed ? 1 : 0.5,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: style.border,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {appointment.patient_name.split(" ").slice(0, 2).join(" ")}
        </span>
      </div>
      <div
        style={{
          marginTop: 3,
          paddingLeft: 12,
          fontSize: 10,
          color: "rgba(51, 65, 85, 0.78)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}
        {appointment.clinical_code ? ` · ${appointment.clinical_code}` : ""}
        {appointment.type === "Retorno" ? " · Retorno" : ""}
      </div>
    </button>
  );
}

export default function DoctorAgenda({
  assignedToday = [],
  returnsToday = [],
  loading = false,
  onRefresh,
  onOpenVisit,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week");

  const assignedAppointments = useMemo(() => normalizeAssigned(assignedToday), [assignedToday]);
  const returnAppointments = useMemo(() => normalizeReturns(returnsToday), [returnsToday]);
  const appointments = useMemo(
    () => [...assignedAppointments, ...returnAppointments].sort((a, b) => a.date - b.date),
    [assignedAppointments, returnAppointments]
  );

  const today = new Date();
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const next = new Date(start);
      next.setDate(start.getDate() + i);
      return next;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const last = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const days = [];
    const current = new Date(start);
    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((item) => sameDay(item.date, selectedDate))
        .sort((a, b) => a.date - b.date),
    [appointments, selectedDate]
  );

  const slotAppointments = (date, hour) =>
    appointments.filter((item) => sameDay(item.date, date) && item.date.getHours() === hour);

  const navigate = (direction) => {
    const next = new Date(selectedDate);
    if (view === "day") next.setDate(next.getDate() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setSelectedDate(next);
  };

  const headerLabel = useMemo(() => {
    if (view === "month") return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (view === "week") {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)} ${end.getFullYear()}`;
    }
    return `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`;
  }, [selectedDate, view, weekDays]);

  const summaryCards = [
    {
      label: "Consultas",
      value: assignedAppointments.length,
      bg: "#ECFDF5",
      border: "#A7F3D0",
      color: "#065F46",
    },
    {
      label: "Retornos",
      value: returnAppointments.length,
      bg: "#EFF6FF",
      border: "#BFDBFE",
      color: "#1D4ED8",
    },
    {
      label: "No dia",
      value: dayAppointments.length,
      bg: "#F8FAFC",
      border: "#E2E8F0",
      color: "#334155",
    },
  ];

  const shell = {
    background: SHELL_BG,
    border: BORDER,
    borderRadius: 20,
    overflow: "hidden",
    backdropFilter: "blur(12px)",
  };
  const gutterCell = {
    width: `${GUTTER}px`,
    flexShrink: 0,
    boxSizing: "border-box",
    padding: "10px 12px 0 0",
    textAlign: "right",
    fontSize: 10,
    color: "rgba(100, 116, 139, 0.92)",
    borderRight: GRID,
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        color: "var(--color-text-primary)",
      }}
    >
      <div
        style={{
          background: "#FBFCFB",
          border: "1px solid #E7ECE8",
          borderRadius: 28,
          padding: 24,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 20,
            gap: 16,
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
              Minha agenda
            </h2>
            <p style={{ fontSize: 11, fontWeight: 400, color: "#6B7280", marginTop: 3 }}>
              {sameDay(selectedDate, today)
                ? "Hoje"
                : `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`}
              {" · "}
              {dayAppointments.length} compromisso{dayAppointments.length !== 1 ? "s" : ""} no dia
              selecionado
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: 4,
                borderRadius: 999,
                background: "rgba(255,255,255,0.88)",
                border: BORDER,
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  ...baseButton,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(248,250,252,0.96)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span
                style={{
                  minWidth: 210,
                  padding: "0 4px",
                  textAlign: "center",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#111827",
                }}
              >
                {headerLabel}
              </span>
              <button
                type="button"
                onClick={() => navigate(1)}
                style={{
                  ...baseButton,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(248,250,252,0.96)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#334155",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: 4,
                padding: 4,
                borderRadius: 999,
                background: "rgba(255,255,255,0.88)",
                border: BORDER,
              }}
            >
              {[
                ["day", "Dia"],
                ["week", "Semana"],
                ["month", "Mes"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setView(value)}
                  style={{
                    ...baseButton,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: view === value ? SYSTEM_GREEN : "transparent",
                    color: view === value ? "#fff" : "#475569",
                    boxShadow: view === value ? "inset 0 0 0 1px rgba(12,58,36,0.08)" : "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                ...baseButton,
                fontSize: 13,
                padding: "9px 16px",
                borderRadius: 999,
                border: "1px solid #E7ECE8",
                background: "#fff",
                color: "#374151",
                cursor: "pointer",
                fontWeight: 700,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
          }}
        >
          {summaryCards.map((card) => (
            <div
              key={card.label}
              style={{
                borderRadius: 20,
                border: `1px solid ${card.border}`,
                background: card.bg,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: card.color,
                  marginBottom: 6,
                }}
              >
                {card.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", lineHeight: 1 }}>
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...shell, marginBottom: 14 }}>
        {view === "week" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))`,
                borderBottom: GRID,
                background: HEADER_BG,
              }}
            >
              <div style={{ borderRight: GRID }} />
              {weekDays.map((date, index) => {
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setView("day");
                    }}
                    style={{
                      ...baseButton,
                      padding: "11px 4px 10px",
                      textAlign: "center",
                      borderRight: index < 6 ? GRID : "none",
                      background: isSelected ? "rgba(255,255,255,0.5)" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {DAYS[date.getDay()]}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {isToday ? (
                        <span
                          style={{
                            display: "inline-flex",
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: `linear-gradient(180deg, ${SYSTEM_GREEN} 0%, ${SYSTEM_GREEN_DARK} 100%)`,
                            color: "#fff",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          {date.getDate()}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 16,
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? SYSTEM_GREEN : "var(--color-text-primary)",
                          }}
                        >
                          {date.getDate()}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {hours.map((hour, rowIndex) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px repeat(7, minmax(0, 1fr))`,
                    borderBottom: GRID,
                    background: rowIndex % 2 === 0 ? ROW_A : ROW_B,
                  }}
                >
                  <div style={gutterCell}>{fmtTime(hour)}</div>
                  {weekDays.map((date, index) => (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      style={{
                        minHeight: 44,
                        padding: 4,
                        borderRight: index < 6 ? GRID : "none",
                        background: sameDay(date, selectedDate)
                          ? "rgba(255,255,255,0.42)"
                          : "transparent",
                      }}
                    >
                      {slotAppointments(date, hour).map((appointment) => (
                        <AgendaEvent
                          key={appointment.id}
                          appointment={appointment}
                          onOpenVisit={onOpenVisit}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {view === "day" && (
          <>
            <div
              style={{ padding: "13px 16px 13px 72px", borderBottom: GRID, background: HEADER_BG }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
                {DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} de{" "}
                {MONTHS[selectedDate.getMonth()]}
              </span>
            </div>
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {hours.map((hour, rowIndex) => (
                <div
                  key={hour}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px minmax(0, 1fr)`,
                    borderBottom: GRID,
                    background: rowIndex % 2 === 0 ? ROW_A : ROW_B,
                  }}
                >
                  <div style={gutterCell}>{fmtTime(hour)}</div>
                  <div style={{ padding: "5px 6px", display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {slotAppointments(selectedDate, hour).map((appointment) => (
                      <div key={appointment.id} style={{ minWidth: 200, flex: "1 1 220px" }}>
                        <AgendaEvent appointment={appointment} onOpenVisit={onOpenVisit} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {view === "month" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                borderBottom: GRID,
                background: HEADER_BG,
              }}
            >
              {DAYS.map((day) => (
                <div
                  key={day}
                  style={{
                    padding: "9px 0",
                    textAlign: "center",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}>
              {monthDays.map((date, index) => {
                const dayItems = appointments.filter((item) => sameDay(item.date, date));
                const isOther = date.getMonth() !== selectedDate.getMonth();
                const isToday = sameDay(date, today);
                const isSelected = sameDay(date, selectedDate);
                return (
                  <button
                    key={date.toISOString()}
                    type="button"
                    onClick={() => {
                      setSelectedDate(date);
                      setView("day");
                    }}
                    style={{
                      ...baseButton,
                      minHeight: 82,
                      padding: 8,
                      borderRight: (index + 1) % 7 !== 0 ? GRID : "none",
                      borderBottom: GRID,
                      cursor: "pointer",
                      opacity: isOther ? 0.38 : 1,
                      background: isSelected ? SELECTED : "rgba(255,255,255,0.55)",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ marginBottom: 6 }}>
                      {isToday ? (
                        <span
                          style={{
                            display: "inline-flex",
                            width: 22,
                            height: 22,
                            borderRadius: "50%",
                            background: `linear-gradient(180deg, ${SYSTEM_GREEN} 0%, ${SYSTEM_GREEN_DARK} 100%)`,
                            color: "#fff",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          {date.getDate()}
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: isSelected ? 700 : 500,
                            color: isSelected ? SYSTEM_GREEN : "var(--color-text-primary)",
                          }}
                        >
                          {date.getDate()}
                        </span>
                      )}
                    </div>
                    {dayItems.slice(0, 2).map((appointment) => {
                      const style = EVENT_STYLE[appointment.type] || EVENT_STYLE.default;
                      return (
                        <div
                          key={appointment.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            if (canOpen(appointment.date))
                              onOpenVisit?.(appointment.visit_id, appointment);
                          }}
                          style={{
                            fontSize: 10,
                            fontWeight: 500,
                            padding: "3px 7px",
                            borderRadius: 999,
                            marginBottom: 4,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            background: `linear-gradient(180deg, rgba(255,255,255,0.95) 0%, ${style.bg} 100%)`,
                            color: style.color,
                            border: `1px solid ${style.border}26`,
                          }}
                        >
                          {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}{" "}
                          {appointment.patient_name.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--color-text-tertiary)",
                          paddingLeft: 4,
                        }}
                      >
                        +{dayItems.length - 2}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={shell}>
        <div
          style={{
            padding: "15px 18px",
            borderBottom: GRID,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: HEADER_BG,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
              {sameDay(selectedDate, today)
                ? "Hoje"
                : `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 2 }}>
              {dayAppointments.length} compromisso{dayAppointments.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {dayAppointments.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              color: "var(--color-text-tertiary)",
              fontSize: 13,
            }}
          >
            Nenhum compromisso neste dia.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: 600,
                borderCollapse: "collapse",
                tableLayout: "fixed",
              }}
            >
              <colgroup>
                <col style={{ width: 72 }} />
                <col style={{ width: 180 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 150 }} />
                <col style={{ width: 80 }} />
              </colgroup>
              <thead style={{ background: HEADER_BG }}>
                <tr>
                  {["Hora", "Paciente", "Tipo", "Estado", ""].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: "9px 16px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--color-text-secondary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        borderBottom: GRID,
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayAppointments.map((appointment, index) => {
                  const pill = STATUS_PILL[appointment.status] || STATUS_PILL.SCHEDULED;
                  const allowed = canOpen(appointment.date);
                  return (
                    <tr
                      key={appointment.id}
                      style={{
                        borderBottom: GRID,
                        background: index % 2 === 0 ? "rgba(255,255,255,0.52)" : ROW_A,
                      }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--color-text-primary)",
                          }}
                        >
                          {appointment.patient_name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-tertiary)",
                            marginTop: 1,
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {appointment.clinical_code || "-"}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 12,
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {appointment.type}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 9px",
                            borderRadius: 20,
                            background: pill.bg,
                            color: pill.color,
                          }}
                        >
                          {STATUS_LABELS[appointment.status] || appointment.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (allowed) onOpenVisit?.(appointment.visit_id, appointment);
                          }}
                          disabled={!allowed}
                          style={{
                            ...baseButton,
                            fontSize: 11,
                            padding: "5px 13px",
                            borderRadius: 20,
                            border: BORDER,
                            background: "rgba(255,255,255,0.7)",
                            color: "var(--color-text-primary)",
                            cursor: allowed ? "pointer" : "not-allowed",
                            opacity: allowed ? 1 : 0.4,
                          }}
                        >
                          Abrir
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
    </div>
  );
}
