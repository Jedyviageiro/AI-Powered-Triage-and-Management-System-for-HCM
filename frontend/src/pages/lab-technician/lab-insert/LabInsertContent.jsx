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
            <div key={visit.id} className="quick-item" onClick={() => onOpenVisit(visit.id)}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1c1c1e" }}>
                  {visit.full_name || "-"}
                </div>
                <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "1px" }}>
                  {examLabel(visit.lab_exam_type, visit.lab_tests)} · #{visit.id}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
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
