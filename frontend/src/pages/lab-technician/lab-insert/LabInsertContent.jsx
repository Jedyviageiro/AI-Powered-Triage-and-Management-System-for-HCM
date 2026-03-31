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

export default function LabInsertContent({ filteredPending, search, examLabel, onOpenVisit }) {
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
          Inserir resultados
        </h1>
        <p style={{ fontSize: "13px", color: "#8e8e93", marginTop: "2px" }}>
          Selecione um pedido para abrir o formulário
        </p>
      </div>
      <div className="card">
        {filteredPending.length > 0 ? (
          filteredPending.map((visit) => (
            <div
              key={visit.id}
              className="quick-item"
              onClick={() => onOpenVisit(visit.id)}
              style={{ borderLeft: `4px solid ${visit.urgencyMeta?.accent || "#9CA3AF"}` }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                  {visit.full_name || "-"}
                </div>
                <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "1px" }}>
                  {examLabel(visit.lab_exam_type, visit.lab_tests)} · #{visit.id}
                </div>
                <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px" }}>
                  Médico solicitante: {visit.requestingDoctorName || "-"}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <UrgencyBadge urgencyMeta={visit.urgencyMeta} />
                <button className="open-btn">Abrir</button>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "48px 16px",
              textAlign: "center",
              fontSize: "13px",
              color: "#aeaeb2",
            }}
          >
            {search.trim() ? "Nenhum pedido encontrado." : "Nenhum pedido pendente."}
          </div>
        )}
      </div>
    </div>
  );
}
