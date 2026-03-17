export default function DoctorConsultationFinishStep({
  askDoctorAI,
  aiLoading,
  aiEnabled,
  hasGeneratedAiSuggestion,
  finishMissingFields,
  planAccepted,
  finishConsultation,
  canFinishStrict,
  savingPlan,
}) {
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
            ? "Sugestão já gerada"
            : "Consultar IA"}
      </button>
      {finishMissingFields.length > 0 && (
        <div className="p-2 rounded border border-red-200 bg-red-50 text-xs text-red-700">
          Campos obrigatórios: {finishMissingFields.join(", ")}
        </div>
      )}
      {planAccepted && (
        <div className="p-2 rounded border border-green-200 bg-green-50 text-xs text-green-700">
          Plano aceite — ainda pode editar.
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
