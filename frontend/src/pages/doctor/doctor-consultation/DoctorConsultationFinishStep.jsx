export default function DoctorConsultationFinishStep({
  askDoctorAI,
  aiLoading,
  aiEnabled,
  hasGeneratedAiSuggestion,
  finishMissingFields,
  finishChecklistItems = [],
  setConsultFormStep,
  planAccepted,
  finishConsultation,
  canFinishStrict,
  savingPlan,
}) {
  const checklistItems = finishChecklistItems.length
    ? finishChecklistItems
    : finishMissingFields.map((field) => ({ field, label: `Completar: ${field}.`, step: 4 }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <button
        type="button"
        onClick={askDoctorAI}
        disabled={aiLoading || !aiEnabled || hasGeneratedAiSuggestion}
        className="cf-btn-sec"
        style={{ justifyContent: "center" }}
      >
        {aiLoading
          ? "IA analisando..."
          : hasGeneratedAiSuggestion
            ? "Sugestao ja gerada"
            : "Consultar IA"}
      </button>

      {finishMissingFields.length > 0 && (
        <div
          style={{
            border: "1px solid #fecaca",
            background: "#fff1f2",
            color: "#9f1239",
            borderRadius: 14,
            padding: "14px 16px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 8 }}>
            Ainda falta completar antes de finalizar
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {checklistItems.map((item, index) => (
              <div
                key={`${item.field || item.label}-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  borderRadius: 10,
                  background: "#ffffff",
                  padding: "10px 12px",
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563" }}>
                  {item.label}
                </span>
                <button
                  type="button"
                  className="cf-btn-sec"
                  style={{ minHeight: 32, padding: "8px 12px", width: "auto" }}
                  onClick={() => setConsultFormStep?.(item.step || 4)}
                >
                  Corrigir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {planAccepted && (
        <div className="p-2 rounded border border-green-200 bg-green-50 text-xs text-green-700">
          Plano aceite, ainda pode editar.
        </div>
      )}

      <button
        type="button"
        onClick={finishConsultation}
        disabled={!canFinishStrict || savingPlan}
        className="cf-btn-primary"
        style={{
          width: "100%",
          justifyContent: "center",
          padding: "13px 20px",
          fontSize: 14,
          borderRadius: 999,
          background: canFinishStrict ? "linear-gradient(135deg,#0c3a24,#1a7048)" : "#d1d5db",
        }}
      >
        {savingPlan ? "A guardar..." : "Finalizar Consulta"}
      </button>
    </div>
  );
}
