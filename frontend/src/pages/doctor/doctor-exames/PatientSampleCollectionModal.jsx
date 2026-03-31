import DoctorModernSelect from "../doctor-consultation/DoctorModernSelect";

export default function PatientSampleCollectionModal({
  open,
  shouldShow,
  findLabExamLabel,
  planDraft,
  onClose,
  selectedLabProtocol,
  sampleCollectionDraft,
  setSampleCollectionDraft,
  openModernSelect,
  setOpenModernSelect,
}) {
  const SelectComponent = DoctorModernSelect;

  if (!open || !shouldShow) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center p-4"
      style={{ zIndex: 215 }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Colheita de Amostra</h3>
            <p className="text-xs text-gray-500 mt-1">
              Protocolo para {findLabExamLabel(planDraft.lab_exam_type)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-50"
          >
            Fechar
          </button>
        </div>
        <div className="p-5 max-h-[68vh] overflow-y-auto space-y-3">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
            <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
              Protocolo de Colheita ({findLabExamLabel(planDraft.lab_exam_type)})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-700">
              <div>
                <span className="font-semibold">Tipo de amostra:</span>{" "}
                {selectedLabProtocol?.sampleType || "-"}
              </div>
              <div>
                <span className="font-semibold">Quantidade:</span>{" "}
                {selectedLabProtocol?.quantity || "-"}
              </div>
              <div>
                <span className="font-semibold">Tempo ideal:</span>{" "}
                {selectedLabProtocol?.idealTime || "-"}
              </div>
              <div>
                <span className="font-semibold">Notas:</span> {selectedLabProtocol?.notes || "-"}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Hora da colheita
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                value={sampleCollectionDraft.collectionTime || ""}
                onChange={(e) =>
                  setSampleCollectionDraft((prev) => ({ ...prev, collectionTime: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Responsável pela colheita
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Nome do profissional"
                value={sampleCollectionDraft.collectorName || ""}
                onChange={(e) =>
                  setSampleCollectionDraft((prev) => ({ ...prev, collectorName: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Condição da amostra
              </label>
              <SelectComponent
                selectId="sample-condition-modal"
                value={sampleCollectionDraft.sampleCondition || "ADEQUADA"}
                openModernSelect={openModernSelect}
                setOpenModernSelect={setOpenModernSelect}
                onChange={(e) =>
                  setSampleCollectionDraft((prev) => ({ ...prev, sampleCondition: e.target.value }))
                }
              >
                <option value="ADEQUADA">Adequada</option>
                <option value="LIMITE">Limítrofe</option>
                <option value="INADEQUADA">Inadequada</option>
              </SelectComponent>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-1 block">
                Notas da colheita
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm min-h-[72px]"
                placeholder="Observações sobre a colheita e envio da amostra"
                value={sampleCollectionDraft.notes || ""}
                onChange={(e) =>
                  setSampleCollectionDraft((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
