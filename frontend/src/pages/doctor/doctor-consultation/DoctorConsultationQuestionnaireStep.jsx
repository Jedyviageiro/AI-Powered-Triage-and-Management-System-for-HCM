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
}) {
  return (
    <div className="cf-card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="cf-label" style={{ marginBottom: 2 }}>
            Questionario Clinico
          </div>
          <div className="text-xs text-gray-500">
            Opcional: gerar perguntas por IA ou usar padrao.
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
              ? "Perguntas ja geradas"
              : "Gerar por IA"}
        </button>
      </div>

      {questionnaireNotice && (
        <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700">
          {questionnaireNotice}
        </div>
      )}

      {useAIQuestionnaire && complaintQuestions.length > 0 ? (
        <div className="space-y-2">
          {complaintQuestions.map((question, index) => (
            <div key={question}>
              <label className="text-xs font-medium text-gray-700">
                {index + 1}. {question}
              </label>
              <textarea
                className="cf-textarea"
                style={{ minHeight: 72, marginTop: 6 }}
                value={questionnaireAnswers[question] || ""}
                onChange={(event) => updateQuestionAnswer(question, event.target.value)}
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
          onChange={(event) => setQuestionnaireExtraNote(event.target.value)}
        />
      </div>
    </div>
  );
}
