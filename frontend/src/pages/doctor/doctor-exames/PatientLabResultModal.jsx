export default function PatientLabResultModal({ modal, onClose }) {
  if (!modal?.open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      style={{ zIndex: 210 }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Resultado Laboratorial</h3>
            <p className="text-xs text-gray-500 mt-1">
              {modal.row?.full_name || "Paciente"} · Visita #{modal.row?.id || "-"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
          >
            Fechar
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Exame
            </div>
            <p className="text-sm text-gray-900">
              {modal.row?.lab_exam_type || modal.row?.lab_tests || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
              Resultado
            </div>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {modal.row?.lab_result_text || "-"}
            </p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
              Explicação da IA
            </div>
            {modal.loading ? (
              <p className="text-sm text-blue-800">Analisando resultado...</p>
            ) : modal.error ? (
              <p className="text-sm text-red-700">{modal.error}</p>
            ) : (
              <p className="text-sm text-blue-900 whitespace-pre-wrap">
                {modal.explanation || "Sem explicação disponível."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
