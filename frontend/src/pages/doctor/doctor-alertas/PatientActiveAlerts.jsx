import DoctorPage from "../DoctorPage";

export function PatientActiveAlertsView({
  activeAlertRows,
  filteredQueue,
  formatPriorityPt,
  formatStatus,
  onOpenVisit,
}) {
  return (
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
          background: "#FBFCFB",
          border: "1px solid #E7ECE8",
          borderRadius: 28,
          padding: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 18,
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
              Alertas Ativas
            </h2>
            <p style={{ marginTop: 4, fontSize: 12, color: "#6B7280" }}>
              Pacientes urgentes e casos que precisam de revisão imediata
            </p>
          </div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              borderRadius: 999,
              border: "1px solid #FECACA",
              background: "#FEF2F2",
              padding: "4px 12px",
              fontSize: 12,
              fontWeight: 700,
              color: "#B91C1C",
            }}
          >
            {activeAlertRows.length} alerta{activeAlertRows.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 10,
            marginBottom: 18,
          }}
        >
          {[
            {
              label: "Urgentes",
              value: activeAlertRows.length,
              bg: "#FEF2F2",
              border: "#FECACA",
              color: "#B91C1C",
            },
            {
              label: "Em consulta",
              value: filteredQueue.filter(
                (visit) =>
                  String(visit?.status || "").toUpperCase() === "IN_CONSULTATION" &&
                  String(visit?.priority || "").toUpperCase() === "URGENT"
              ).length,
              bg: "#EFF6FF",
              border: "#BFDBFE",
              color: "#1D4ED8",
            },
            {
              label: "Aguardando médico",
              value: activeAlertRows.filter(
                (visit) => String(visit?.status || "").toUpperCase() === "WAITING_DOCTOR"
              ).length,
              bg: "#FFF7ED",
              border: "#FED7AA",
              color: "#C2610C",
            },
          ].map((card) => (
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
        {activeAlertRows.length === 0 ? (
          <div
            style={{
              borderRadius: 24,
              border: "1.5px dashed #DBE3DE",
              background: "#fff",
              padding: "48px 24px",
              textAlign: "center",
              fontSize: 13,
              color: "#9CA3AF",
            }}
          >
            Sem alertas críticos no momento.
          </div>
        ) : (
          <div
            style={{
              borderRadius: 24,
              border: "1px solid #E3E8E4",
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                borderBottom: "1px solid #EDF1ED",
                background: "#F7F8F7",
                display: "grid",
                gridTemplateColumns: "90px 150px 1fr 120px",
                gap: 14,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B7280",
              }}
            >
              <span>Chegada</span>
              <span>Prioridade</span>
              <span>Paciente / Estado</span>
              <span>Ação</span>
            </div>
            {activeAlertRows.map((visit, index) => (
              <div
                key={visit.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 150px 1fr 120px",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: index === activeAlertRows.length - 1 ? "none" : "1px solid #EDF1ED",
                  background: index % 2 === 0 ? "#fff" : "#FBFCFB",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
                  {visit?.arrival_time
                    ? new Date(visit.arrival_time).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    borderRadius: 999,
                    padding: "3px 10px",
                    fontSize: 11,
                    fontWeight: 600,
                    background: "#FEF2F2",
                    color: "#B91C1C",
                    width: "fit-content",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#EF4444",
                      flexShrink: 0,
                    }}
                  />
                  {formatPriorityPt(visit.priority)}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "#FEE2E2",
                      color: "#B91C1C",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {(visit?.full_name || "P").slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {visit.full_name || "Paciente"}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                      {formatStatus(visit?.status)} · Visita #{visit.id}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenVisit(visit)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: "#165034",
                    color: "#fff",
                    border: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Abrir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientActiveAlerts() {
  return <DoctorPage forcedView="activeAlerts" />;
}
