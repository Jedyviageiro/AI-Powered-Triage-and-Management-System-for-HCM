export default function DoctorAISuggestionModal({ open, loading, aiResult, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0a130f]/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      style={{ zIndex: 200 }}
    >
      <div className="w-full max-w-3xl bg-[#f8fbf9] rounded-2xl border border-emerald-100 shadow-[0_22px_70px_rgba(10,25,16,0.35)] max-h-[86vh] overflow-y-auto">
        <div
          className="px-5 py-4 border-b border-emerald-100 flex items-center justify-between text-white"
          style={{ background: "linear-gradient(135deg,#0c3a24,#165034 60%,#1a7048)" }}
        >
          <div>
            <h3 className="text-base font-semibold">Sugestão Clínica da IA</h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Assistência para revisão, sem substituir decisão médica.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-white border border-white/35 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            Fechar
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-11/12" />
              <div className="h-20 bg-gray-100 rounded" />
              <div className="h-20 bg-gray-100 rounded" />
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 bg-white border border-gray-200 rounded-xl p-3">
                {aiResult.disclaimer || "Sugestão gerada por IA. Validar por protocolo local."}
              </p>
              {aiResult.red_flag && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm font-semibold text-red-700">
                    Alerta: possível risco elevado - seguir protocolo do serviço.
                  </p>
                </div>
              )}
              {aiResult.likely_diagnosis && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Diagnóstico provável
                  </div>
                  <p className="text-sm text-gray-900">{aiResult.likely_diagnosis}</p>
                </div>
              )}
              {aiResult.summary && (
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                    Resumo
                  </div>
                  <p className="text-sm text-gray-800">{aiResult.summary}</p>
                </div>
              )}
              {aiResult.doctor_feedback && (
                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50 space-y-2">
                  <div className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                    Feedback ao médico
                  </div>
                  {aiResult.doctor_feedback.step1_comment && (
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Passo 1:</span>{" "}
                      {aiResult.doctor_feedback.step1_comment}
                    </p>
                  )}
                  {aiResult.doctor_feedback.step2_rectification && (
                    <p className="text-sm text-blue-900">
                      <span className="font-semibold">Passo 2:</span>{" "}
                      {aiResult.doctor_feedback.step2_rectification}
                    </p>
                  )}
                  {Array.isArray(aiResult.doctor_feedback.step3_alternatives) &&
                    aiResult.doctor_feedback.step3_alternatives.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-blue-900">
                          Passo 3: alternativas
                        </div>
                        <ul className="list-disc pl-5 text-sm text-blue-900">
                          {aiResult.doctor_feedback.step3_alternatives.map((alt, i) => (
                            <li key={`alt-${i}`}>{alt}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
              {aiResult.doctor_plan_alignment && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50">
                  <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                    Alinhamento com plano do médico
                  </div>
                  <p className="text-sm text-emerald-900">
                    Estado:{" "}
                    <span className="font-semibold">
                      {aiResult.doctor_plan_alignment.status || "-"}
                    </span>
                    {aiResult.doctor_plan_alignment.distance_percent != null
                      ? ` - Distância estimada: ${aiResult.doctor_plan_alignment.distance_percent}%`
                      : ""}
                  </p>
                  {aiResult.doctor_plan_alignment.rationale && (
                    <p className="text-xs text-emerald-800 mt-1">
                      {aiResult.doctor_plan_alignment.rationale}
                    </p>
                  )}
                  {aiResult.doctor_plan_alignment.supportive_suggestion && (
                    <p className="text-xs text-emerald-800 mt-1">
                      Sugestão: {aiResult.doctor_plan_alignment.supportive_suggestion}
                    </p>
                  )}
                </div>
              )}
              {aiResult.clinical_evolution && (
                <div className="p-3 rounded-lg border border-violet-200 bg-violet-50">
                  <div className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
                    Evolução clínica
                  </div>
                  <p className="text-sm text-violet-900">
                    Estado:{" "}
                    <span className="font-semibold">
                      {aiResult.clinical_evolution.status || "-"}
                    </span>
                  </p>
                  {aiResult.clinical_evolution.summary && (
                    <p className="text-xs text-violet-900 mt-1">
                      {aiResult.clinical_evolution.summary}
                    </p>
                  )}
                  {aiResult.clinical_evolution.symptom_trend && (
                    <p className="text-xs text-violet-800 mt-1">
                      Sintomas: {aiResult.clinical_evolution.symptom_trend}
                    </p>
                  )}
                  {aiResult.clinical_evolution.vital_trend && (
                    <p className="text-xs text-violet-800 mt-1">
                      Sinais vitais: {aiResult.clinical_evolution.vital_trend}
                    </p>
                  )}
                  {aiResult.clinical_evolution.growth_trend && (
                    <p className="text-xs text-violet-800 mt-1">
                      Crescimento/peso: {aiResult.clinical_evolution.growth_trend}
                    </p>
                  )}
                  {Array.isArray(aiResult.clinical_evolution.concerns) &&
                    aiResult.clinical_evolution.concerns.length > 0 && (
                      <div className="mt-2">
                        <div className="text-xs font-semibold text-violet-800">
                          Pontos de atenção
                        </div>
                        <ul className="list-disc pl-5 text-xs text-violet-900">
                          {aiResult.clinical_evolution.concerns.map((item, index) => (
                            <li key={`clinical-evolution-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
              {aiResult.follow_up_support && (
                <div className="p-3 rounded-lg border border-amber-200 bg-amber-50">
                  <div className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                    Sugestão estruturada para follow-up
                  </div>
                  {aiResult.follow_up_support.diagnosis_evolution && (
                    <p className="text-xs text-amber-900">
                      Evolução do diagnóstico:{" "}
                      <span className="font-semibold">
                        {aiResult.follow_up_support.diagnosis_evolution}
                      </span>
                    </p>
                  )}
                  {aiResult.follow_up_support.current_diagnosis && (
                    <p className="text-xs text-amber-900 mt-1">
                      Diagnóstico atual sugerido: {aiResult.follow_up_support.current_diagnosis}
                    </p>
                  )}
                  {aiResult.follow_up_support.prescription_decision && (
                    <p className="text-xs text-amber-900 mt-1">
                      Decisão sobre a prescrição:{" "}
                      <span className="font-semibold">
                        {aiResult.follow_up_support.prescription_decision}
                      </span>
                    </p>
                  )}
                  {aiResult.follow_up_support.prescription_adjustment && (
                    <p className="text-xs text-amber-900 mt-1">
                      Ajuste terapêutico: {aiResult.follow_up_support.prescription_adjustment}
                    </p>
                  )}
                  {aiResult.follow_up_support.final_decision && (
                    <p className="text-xs text-amber-900 mt-1">
                      Decisão final sugerida:{" "}
                      <span className="font-semibold">
                        {aiResult.follow_up_support.final_decision}
                      </span>
                    </p>
                  )}
                  {aiResult.follow_up_support.rationale && (
                    <p className="text-xs text-amber-800 mt-1">
                      {aiResult.follow_up_support.rationale}
                    </p>
                  )}
                </div>
              )}
              {Array.isArray(aiResult.differential_diagnoses) &&
                aiResult.differential_diagnoses.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Diferenciais
                    </div>
                    <div className="space-y-1">
                      {aiResult.differential_diagnoses.slice(0, 3).map((d, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900">{d.name}:</span> {d.why}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                Revise esta sugestão e preencha o formulário manualmente de acordo com a sua
                avaliação clínica.
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Nenhuma sugestão disponível.</p>
          )}
        </div>
      </div>
    </div>
  );
}
