export default function DoctorConsultationQuestionnaireStep({
  questionnaireLoading,
  triage,
  hasGeneratedQuestionnaire,
  generateQuestionnaireQuestions,
  questionnaireNotice,
  useAIQuestionnaire,
  complaintQuestions,
  questionnaireAnswers,
  updateQuestionAnswer,
  questionnaireExtraNote,
  setQuestionnaireExtraNote,
  retakeVitals,
  setRetakeVitals,
}) {
  return (
    <div className="cf-card">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
        <div>
          <div className="cf-label" style={{ marginBottom: 2 }}>
            Questionário Clínico
          </div>
          <div className="text-xs text-gray-500">
            Opcional: gerar perguntas por IA ou usar padrão.
          </div>
        </div>
        <button
          type="button"
          onClick={generateQuestionnaireQuestions}
          disabled={questionnaireLoading || !triage?.chief_complaint || hasGeneratedQuestionnaire}
          className="cf-btn-sec"
        >
          {questionnaireLoading
            ? "Gerando..."
            : hasGeneratedQuestionnaire
              ? "Perguntas já geradas"
              : "Gerar por IA"}
        </button>
      </div>
      {questionnaireNotice && (
        <div className="p-2 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-700 mb-3">
          {questionnaireNotice}
        </div>
      )}
      {useAIQuestionnaire && complaintQuestions.length > 0 ? (
        <div className="space-y-2">
          {complaintQuestions.map((q, i) => (
            <div key={q}>
              <label className="text-xs font-medium text-gray-700">
                {i + 1}. {q}
              </label>
              <textarea
                className="cf-textarea"
                style={{ minHeight: 72, marginTop: 6 }}
                value={questionnaireAnswers[q] || ""}
                onChange={(e) => updateQuestionAnswer(q, e.target.value)}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Sem perguntas geradas.</div>
      )}
      <div className="mt-3">
        <label className="cf-label" style={{ marginBottom: 6 }}>
          Notas adicionais
        </label>
        <textarea
          className="cf-textarea"
          style={{ minHeight: 90 }}
          value={questionnaireExtraNote}
          onChange={(e) => setQuestionnaireExtraNote(e.target.value)}
        />
      </div>
      <div className="cf-grid-5" style={{ marginTop: 14 }}>
        <input
          className="cf-input"
          placeholder="Temp °C"
          value={retakeVitals.temperature}
          onChange={(e) => setRetakeVitals((p) => ({ ...p, temperature: e.target.value }))}
        />
        <input
          className="cf-input"
          placeholder="FC bpm"
          value={retakeVitals.heart_rate}
          onChange={(e) => setRetakeVitals((p) => ({ ...p, heart_rate: e.target.value }))}
        />
        <input
          className="cf-input"
          placeholder="FR rpm"
          value={retakeVitals.respiratory_rate}
          onChange={(e) => setRetakeVitals((p) => ({ ...p, respiratory_rate: e.target.value }))}
        />
        <input
          className="cf-input"
          placeholder="SpO2 %"
          value={retakeVitals.oxygen_saturation}
          onChange={(e) => setRetakeVitals((p) => ({ ...p, oxygen_saturation: e.target.value }))}
        />
        <input
          className="cf-input"
          placeholder="Peso kg"
          value={retakeVitals.weight}
          onChange={(e) => setRetakeVitals((p) => ({ ...p, weight: e.target.value }))}
        />
      </div>
    </div>
  );
}
