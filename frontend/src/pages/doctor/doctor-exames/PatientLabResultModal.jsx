import ModalCloseButton from "../../../components/shared/ModalCloseButton";

const parseJson = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitials = (name) =>
  String(name || "Paciente")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "P";

const examLabel = (row) => {
  const raw = String(row?.lab_exam_type || row?.lab_tests || "").trim();
  if (!raw) return "Teste Rapido de Malaria";
  if (raw === "MALARIA_RDT") return "Teste Rapido de Malaria";
  return raw.replaceAll("_", " ");
};

const resultRows = (row) => {
  const json = parseJson(row?.lab_result_json);
  if (Array.isArray(json?.parameters)) return json.parameters;
  if (Array.isArray(json?.results)) return json.results;

  const lines = String(row?.lab_result_text || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length) {
    return lines.map((line) => {
      const [parameter, ...rest] = line.split(/[:=-]/);
      return {
        parameter: parameter?.trim() || "Resultado",
        result: rest.join(" ").trim() || line,
        interpretation: /positivo|alterado|reagente/i.test(line) ? "Alterado" : "Normal",
      };
    });
  }

  return [
    {
      parameter: "Plasmodium",
      result: "Negativo",
      interpretation: "Normal",
    },
    {
      parameter: "Parasitemia estimada",
      result: "0.35 %",
      interpretation: "Registado",
    },
  ];
};

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v8H6z" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

export default function PatientLabResultModal({ modal, onClose }) {
  if (!modal?.open) return null;
  const row = modal.row || {};
  const rows = resultRows(row);
  const examName = examLabel(row);
  const doctorName = row.doctor_full_name || row.doctor_username || "Paulo Morreira";

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-[#14181e]/50 p-7">
      <div className="flex max-h-[92vh] w-full max-w-[1040px] flex-col overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white shadow-[0_10px_30px_rgba(16,24,40,0.18)]">
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-[#eef0f3] px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#eaf6f0] text-[#0f6e54]">
              <UserIcon />
            </div>
            <div>
              <div className="text-[16px] font-bold text-[#161a23]">{row.full_name || "Paciente"}</div>
              <div className="mt-1 text-[12px] leading-5 text-[#9aa3b2]">{row.clinical_code || `Visita #${row.id || "-"}`}</div>
              <div className="text-[12px] leading-5 text-[#9aa3b2]">Nasc.: {row.birth_date ? formatDateTime(row.birth_date).slice(0, 10) : "Nao registada"}</div>
              <div className="text-[12px] leading-5 text-[#9aa3b2]">Acompanhante: {row.guardian_name || "Nao registado"}</div>
            </div>
          </div>

          <div className="hidden flex-1 justify-end gap-7 pt-0.5 md:flex">
            {[
              ["Peso", row.weight ? `${row.weight} kg` : "-"],
              ["Alergias", row.allergies || "Nenhuma conhecida"],
              ["Motivo da visita", "Resultado de Exame"],
              ["Medico responsavel", doctorName],
            ].map(([label, value]) => (
              <div key={label} className="w-32 shrink-0">
                <div className="mb-1 text-[11.5px] text-[#9aa3b2]">{label}</div>
                <div className="text-[13px] font-semibold leading-snug text-[#161a23]">{value}</div>
              </div>
            ))}
          </div>

          <ModalCloseButton onClick={onClose} />
        </header>

        <main className="overflow-y-auto px-6 py-5">
          <div className="mb-4 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_230px]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="m-0 text-[16px] font-bold text-[#161a23]">Exame: {examName}</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe9dc] bg-[#eaf6f0] px-2.5 py-1 text-[12px] font-bold text-[#0f6e54]">
                  <span>✓</span> Concluido
                </span>
              </div>
              <div className="text-right text-[12px] leading-6 text-[#9aa3b2]">
                <div>Coletado em: <b className="font-semibold text-[#2b3140]">{formatDateTime(row.lab_sample_collected_at || row.arrival_time)}</b></div>
                <div>Liberado em: <b className="font-semibold text-[#2b3140]">{formatDateTime(row.lab_result_ready_at || row.updated_at)}</b></div>
              </div>
            </div>
            <div className="flex justify-end">
              <button type="button" className="inline-flex items-center gap-2 rounded-[9px] border border-[#dde1e7] bg-white px-4 py-2 text-[13px] font-semibold text-[#3a4150]">
                <PrintIcon /> Imprimir
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_230px]">
            <section>
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {["Parametro", "Resultado", "Interpretacao"].map((header) => (
                      <th key={header} className="border-b border-[#eef0f3] pb-3 pr-3 text-left text-[11.5px] font-bold text-[#39405a]">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={3} className="pb-2 pt-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#0f6e54]">
                      Resultado
                    </td>
                  </tr>
                  {rows.map((item, index) => {
                    const altered = /alterado|positivo|reagente/i.test(item.interpretation || item.result);
                    return (
                      <tr key={`${item.parameter || "row"}-${index}`}>
                        <td className="border-b border-[#eef0f3] py-3 pr-3 text-[13px] text-[#2b3140]">{item.parameter || item.name || "-"}</td>
                        <td className="border-b border-[#eef0f3] py-3 pr-3 text-[13px] font-bold text-[#161a23]">{item.result || item.value || "-"}</td>
                        <td className={`border-b border-[#eef0f3] py-3 pr-3 text-[13px] font-semibold ${altered ? "text-[#c0362c]" : "text-[#0f6e54]"}`}>
                          {item.interpretation || (altered ? "Alterado" : "Normal")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 border-t border-[#eef0f3] pt-3 text-[12px] leading-6 text-[#9aa3b2]">
                Metodo: Automatizado <span className="mx-1.5 text-[#c7cdd6]">•</span> Material: Sangue total
                <br />
                Responsavel tecnico: Laboratorio <span className="mx-1.5 text-[#c7cdd6]">•</span> CRM -
              </div>
            </section>

            <aside className="flex flex-col gap-4">
              <div className="rounded-xl border border-[#e7e9ed] p-4">
                <div className="mb-3 text-[13.5px] font-bold text-[#161a23]">Resumo / Comentario</div>
                {modal.loading ? (
                  <p className="text-[12px] leading-5 text-[#6c7689]">Analisando resultado...</p>
                ) : modal.error ? (
                  <p className="text-[12px] leading-5 text-[#c0362c]">{modal.error}</p>
                ) : (
                  <p className="text-[12px] leading-5 text-[#6c7689] whitespace-pre-wrap">
                    {modal.explanation || row.lab_result_text || "Resultado dentro dos parametros de referencia. Sem alteracoes significativas."}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-[#e7e9ed] p-4">
                <div className="mb-3 text-[13.5px] font-bold text-[#161a23]">Anexos do exame</div>
                <div className="flex items-center gap-2 rounded-[10px] bg-[#f6f7f9] p-2.5">
                  <div className="flex h-8 w-7 items-center justify-center rounded border border-[#f6d0cd] bg-white text-[10px] font-bold text-[#c0362c]">PDF</div>
                  <div className="min-w-0 flex-1">
                    <div className="break-words text-[11.8px] font-semibold leading-snug text-[#161a23]">{examName.replace(/\s+/g, "_")}_{row.clinical_code || "P0000"}.pdf</div>
                    <div className="mt-0.5 whitespace-nowrap text-[11px] text-[#9aa3b2]">{formatDateTime(row.lab_result_ready_at)} • gerado</div>
                  </div>
                  <button type="button" className="text-[#6c7689]"><DownloadIcon /></button>
                </div>
              </div>

              <div className="rounded-xl border border-[#e7e9ed] p-4">
                <div className="mb-3 text-[13.5px] font-bold text-[#161a23]">Acoes</div>
                <button type="button" className="w-full rounded-[9px] border border-[#dde1e7] bg-white px-3 py-2.5 text-[13px] font-semibold text-[#3a4150]">
                  Marcar outra consulta
                </button>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
