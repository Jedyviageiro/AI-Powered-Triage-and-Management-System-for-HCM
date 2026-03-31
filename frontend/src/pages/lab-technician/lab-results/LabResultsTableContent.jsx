const StatusBadge = ({ status }) => {
  const cfg = {
    WAITING_DOCTOR: { bg: "#FFF7ED", color: "#C2610C", label: "Aguardando médico" },
    IN_CONSULTATION: { bg: "#DBEAFE", color: "#1D4ED8", label: "Em consulta" },
    FINISHED: { bg: "#ECFDF5", color: "#047857", label: "Finalizado" },
    RECEIVED: { bg: "#E0F2FE", color: "#0369A1", label: "Amostra recebida" },
    PROCESSING: { bg: "#F3E8FF", color: "#7C3AED", label: "Em análise" },
    READY: { bg: "#ECFDF5", color: "#047857", label: "Pronto" },
    PENDING: { bg: "#FFF7ED", color: "#C2610C", label: "Pendente" },
  };
  const current = cfg[String(status || "").toUpperCase()] || {
    bg: "#F3F4F6",
    color: "#6B7280",
    label: status || "-",
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: "999px",
        background: current.bg,
        color: current.color,
        fontSize: "10px",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {current.label}
    </span>
  );
};

const UrgencyBadge = ({ urgencyMeta }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 8px",
      borderRadius: "999px",
      background: urgencyMeta?.bg || "#F3F4F6",
      color: urgencyMeta?.color || "#6B7280",
      border: `1px solid ${urgencyMeta?.border || "#E5E7EB"}`,
      fontSize: "10px",
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "999px",
        background: urgencyMeta?.accent || "#9CA3AF",
      }}
    />
    {urgencyMeta?.label || "Sem prioridade"}
  </span>
);

export default function LabResultsTableContent({
  activeView,
  filteredRows,
  examLabel,
  onOpenVisit,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#1c1c1e",
              letterSpacing: "-.4px",
              margin: 0,
            }}
          >
            {activeView === "pending"
              ? "Pedidos pendentes"
              : activeView === "ready"
                ? "Resultados prontos"
                : "Histórico do dia"}
          </h1>
          <p style={{ fontSize: "13px", color: "#8e8e93", marginTop: "2px" }}>
            {activeView === "pending"
              ? "Aguardam processamento"
              : activeView === "ready"
                ? "Disponíveis para revisão"
                : "Processados hoje"}
          </p>
        </div>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#8e8e93",
            padding: "4px 12px",
            borderRadius: "20px",
            background: "#fff",
            border: "0.5px solid rgba(0,0,0,.09)",
          }}
        >
          {filteredRows.length}
        </span>
      </div>
      <div className="card">
        <table className="tbl">
          <thead>
            <tr>
              <th>Visita</th>
              <th>Paciente</th>
              <th>Exame</th>
              <th>Urgência</th>
              <th>Médico</th>
              <th>Estado</th>
              {activeView !== "history" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length > 0 ? (
              filteredRows.map((visit) => (
                <tr
                  key={visit.id}
                  onClick={() => activeView !== "history" && onOpenVisit(visit.id)}
                  style={{
                    boxShadow:
                      activeView === "pending"
                        ? `inset 3px 0 0 ${visit.urgencyMeta?.accent || "#9CA3AF"}`
                        : "none",
                  }}
                >
                  <td
                    style={{
                      fontSize: "11px",
                      color: "#aeaeb2",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    #{visit.id}
                  </td>
                  <td>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#1c1c1e" }}>
                      {visit.full_name || "-"}
                    </div>
                    <div style={{ fontSize: "10px", color: "#aeaeb2", marginTop: "1px" }}>
                      {visit.clinical_code || "-"}
                    </div>
                  </td>
                  <td style={{ fontSize: "11px", color: "#8e8e93" }}>
                    {examLabel(visit.lab_exam_type, visit.lab_tests)}
                  </td>
                  <td>
                    <UrgencyBadge urgencyMeta={visit.urgencyMeta} />
                  </td>
                  <td style={{ fontSize: "11px", color: "#8e8e93" }}>
                    {visit.requestingDoctorName || "-"}
                  </td>
                  <td>
                    <StatusBadge
                      status={
                        activeView === "ready"
                          ? visit.lab_result_status || "READY"
                          : activeView === "history"
                            ? visit.status || "FINISHED"
                            : visit.lab_result_status || "PENDING"
                      }
                    />
                  </td>
                  {activeView !== "history" && (
                    <td>
                      <button
                        className="open-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenVisit(visit.id);
                        }}
                      >
                        {activeView === "ready" ? "Rever" : "Abrir"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={activeView !== "history" ? 7 : 6}
                  style={{
                    padding: "44px 14px",
                    textAlign: "center",
                    fontSize: "13px",
                    color: "#aeaeb2",
                  }}
                >
                  Sem registos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
