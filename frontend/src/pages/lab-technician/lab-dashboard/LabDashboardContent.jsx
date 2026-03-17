const StatusBadge = ({ status }) => {
  const cfg = {
    WAITING_DOCTOR: { bg: "#fff3e0", color: "#c07700", label: "Aguardando médico" },
    IN_CONSULTATION: { bg: "#e3f2fd", color: "#0077cc", label: "Em consulta" },
    FINISHED: { bg: "#e8f5e9", color: "#1a7a3c", label: "Finalizado" },
    RECEIVED: { bg: "#e3f2fd", color: "#0077cc", label: "Amostra recebida" },
    PROCESSING: { bg: "#f3e8ff", color: "#7c3aed", label: "Em análise" },
    READY: { bg: "#e8f5e9", color: "#1a7a3c", label: "Pronto" },
    PENDING: { bg: "#fff3e0", color: "#c07700", label: "Pendente" },
  };
  const current = cfg[String(status || "").toUpperCase()] || {
    bg: "#f2f2f7",
    color: "#8e8e93",
    label: status || "-",
  };

  return (
    <span
      style={{
        background: current.bg,
        color: current.color,
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {current.label}
    </span>
  );
};

export default function LabDashboardContent({
  dashboardStats,
  filteredPending,
  examLabel,
  onOpenVisit,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
          Laboratório
        </h1>
        <p style={{ fontSize: "13px", color: "#8e8e93", marginTop: "2px" }}>
          Turno em curso ·{" "}
          {new Date().toLocaleDateString("pt-PT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {[
          { label: "Pendentes", value: dashboardStats.pending },
          { label: "Prontos", value: dashboardStats.ready },
          { label: "Concluídos hoje", value: dashboardStats.today },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: "11px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: ".06em",
                color: "#8e8e93",
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: "700",
                color: "#1c1c1e",
                letterSpacing: "-1px",
                lineHeight: 1,
                marginTop: "6px",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "12px" }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Fila de pedidos</div>
            <div className="card-sub">Aguardando processamento laboratorial</div>
          </div>
          <table className="tbl">
            <thead>
              <tr>
                <th>#</th>
                <th>Paciente</th>
                <th>Exame</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredPending.slice(0, 6).length > 0 ? (
                filteredPending.slice(0, 6).map((visit) => (
                  <tr key={visit.id} onClick={() => onOpenVisit(visit.id)}>
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
                      <StatusBadge status={visit.lab_result_status || "PENDING"} />
                    </td>
                    <td>
                      <button
                        className="open-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenVisit(visit.id);
                        }}
                      >
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: "36px 14px",
                      textAlign: "center",
                      fontSize: "13px",
                      color: "#aeaeb2",
                    }}
                  >
                    Sem pedidos pendentes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
