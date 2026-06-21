import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ModalCloseButton from "../../../components/shared/ModalCloseButton";

const EXAM_LABELS = {
  MALARIA_RDT: "Teste Rapido de Malaria",
  GLICEMIA_CAPILAR: "Glicemia capilar",
  HIV_RAPIDO: "Teste Rapido de HIV",
  LAB_CENTRAL: "Hemograma / ionograma / urina",
  RAIO_X: "Raio-X",
  PARASITOLOGIA_FEZES: "Parasitologia de fezes",
  CULTURA_HEMOCULTURA: "Cultura / hemocultura",
  OUTRO: "Outro exame",
};

const getExamLabel = (row) =>
  EXAM_LABELS[String(row?.lab_exam_type || "").toUpperCase()] ||
  row?.lab_tests ||
  row?.lab_exam_type ||
  "Exame laboratorial";

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
  if (Number.isNaN(date.getTime())) return String(value).replace("T", " ").slice(0, 16);
  return date.toLocaleString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("pt-MZ", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const calculateAge = (birthDate) => {
  if (!birthDate) return "-";
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return "-";
  const today = new Date();
  let years = today.getFullYear() - dob.getFullYear();
  const monthDelta = today.getMonth() - dob.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dob.getDate())) years -= 1;
  return years >= 0 ? `${years} anos` : "-";
};

const sexLabel = (value) => {
  const v = String(value || "").toUpperCase();
  if (v.startsWith("M")) return "Masculino";
  if (v.startsWith("F")) return "Feminino";
  return "-";
};

const firstValue = (row, keys) => {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const getPatientCode = (row) =>
  firstValue(row, ["clinical_code", "patient_code"]) || `P${String(row?.patient_id || row?.id || "0000").padStart(4, "0")}`;

const getPatientBirthDate = (row) =>
  firstValue(row, ["birth_date", "patient_birth_date", "date_of_birth", "dob"]);

const getPatientSex = (row) => firstValue(row, ["sex", "patient_sex", "gender"]);

const getPatientGuardian = (row) =>
  firstValue(row, ["guardian_name", "patient_guardian_name", "parent_name", "caregiver_name"]);

const getPatientWeight = (row) =>
  firstValue(row, ["triage_weight", "weight", "patient_weight", "latest_weight"]);

const resultValue = (item, keys) => {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return "";
};

const normalizeResultRows = (row) => {
  const json = parseJson(row?.lab_result_json);
  const machine =
    json?.machine_results && typeof json.machine_results === "object"
      ? Object.values(json.machine_results)
      : [];
  const directRows =
    json?.parameters ||
    json?.results ||
    json?.rows ||
    json?.items ||
    json?.values ||
    json?.tests ||
    machine;

  if (Array.isArray(directRows) && directRows.length) {
    return directRows.map((item, index) => ({
      section: String(resultValue(item, ["section", "group", "category"]) || "RESULTADO").toUpperCase(),
      parameter: String(resultValue(item, ["parameter", "parametro", "name", "label"]) || `Parametro ${index + 1}`),
      result: String(resultValue(item, ["result", "resultado", "value", "valor"]) || "-"),
      unit: String(resultValue(item, ["unit", "unidade"]) || "-"),
      reference: String(resultValue(item, ["reference", "reference_range", "range", "valores_referencia"]) || "-"),
      interpretation: String(resultValue(item, ["interpretation", "interpretacao", "status", "flag"]) || "Registado"),
    }));
  }

  const machineObject = json?.machine_results && typeof json.machine_results === "object" ? json.machine_results : null;
  if (machineObject) {
    return Object.entries(machineObject).map(([key, value]) => ({
      section: "RESULTADO",
      parameter: String(value?.label || key),
      result: String(value?.value ?? "-"),
      unit: String(value?.unit || "-"),
      reference: "-",
      interpretation: "Registado",
    }));
  }

  const text = String(row?.lab_result_text || "").trim();
  if (text) {
    return text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [label, ...rest] = line.split(":");
        return {
          section: "RESULTADO",
          parameter: rest.length ? label.trim() : getExamLabel(row),
          result: rest.length ? rest.join(":").trim() : line,
          unit: "-",
          reference: "-",
          interpretation: "Registado",
        };
      });
  }

  return [
    {
      section: "RESULTADO",
      parameter: getExamLabel(row),
      result: "Resultado pronto, sem parametros estruturados.",
      unit: "-",
      reference: "-",
      interpretation: "Pronto",
    },
  ];
};

const getResultComment = (row) => {
  const json = parseJson(row?.lab_result_json);
  return (
    json?.technical_notes ||
    json?.summary ||
    row?.clinical_reasoning ||
    row?.lab_result_text ||
    "Resultado disponivel para revisao clinica."
  );
};

const isDeliveredResult = (row) => Boolean(row?.patient_notified || row?.lab_patient_notified_at);

const isReadyResult = (row) =>
  Boolean(row?.is_ready) ||
  String(row?.lab_result_status || "").toUpperCase() === "READY" ||
  Boolean(String(row?.lab_result_text || "").trim());

const getInitials = (name) =>
  String(name || "Paciente")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const getExamCategory = (row) => {
  const type = String(row?.lab_exam_type || row?.lab_tests || "").toUpperCase();
  if (type.includes("RAIO") || type.includes("X") || type.includes("ECO")) return "Imagiologia";
  return "Analises clinicas";
};

const getAttachmentName = (row) => {
  const exam = getExamLabel(row).replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "") || "Resultado";
  const code = getPatientCode(row);
  return `${exam}_${code}.pdf`;
};

function CheckIcon({ className = "h-3 w-3" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function EyeIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PrintIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 9V2h12v7" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function UserIcon({ className = "h-7 w-7" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function DownloadIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  );
}

function CalendarIcon({ className = "h-4 w-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg className="h-8 w-7 flex-none" viewBox="0 0 32 38" fill="none" aria-hidden="true">
      <path d="M4 2h17l9 9v23a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#ffffff" stroke="#e2433d" strokeWidth="1.4" />
      <path d="M21 2v9h9" fill="#fde6e4" stroke="#e2433d" strokeWidth="1.4" strokeLinejoin="round" />
      <text x="15" y="27" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700" fill="#e2433d" textAnchor="middle">
        PDF
      </text>
    </svg>
  );
}

function ReadyResultsPage({ rows, loading, onRefresh, onOpenResult }) {
  return (
    <section className="mx-auto max-w-[1010px] px-4 py-9 text-[14px] text-[#2b3140] sm:px-5">
      <div className="overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eef0f3] px-7 py-6">
          <div>
            <h2 className="text-[16px] font-bold text-[#161a23]">Pacientes - Resultados de Exames</h2>
            <p className="mt-1 text-[12.5px] text-[#9aa3b2]">Lista de exames prontos para revisao medica</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#eef0f3] px-3 py-1.5 text-xs font-semibold text-[#6c7689]">
              {rows.length} {rows.length === 1 ? "paciente" : "pacientes"}
            </span>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 text-xs font-semibold text-[#3a4150] hover:bg-[#fafbfc]"
            >
              Atualizar
            </button>
          </div>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
                <th className="px-7 py-3.5 text-left text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Paciente</th>
                <th className="px-3.5 py-3.5 text-left text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Idade</th>
                <th className="px-3.5 py-3.5 text-left text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Exame</th>
                <th className="px-3.5 py-3.5 text-left text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Data</th>
                <th className="px-3.5 py-3.5 text-left text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Estado</th>
                <th className="px-7 py-3.5 text-right text-[11.5px] font-bold tracking-[0.02em] text-[#39405a]">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.id}-${row.lab_exam_type || row.lab_tests || "exam"}`} className="border-b border-[#eef0f3] last:border-b-0 hover:bg-[#f8faf9]">
                  <td className="px-7 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#eaf6f0] text-[12.5px] font-bold text-[#0f6e54]">
                        {getInitials(row?.full_name)}
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-[#161a23]">{row?.full_name || "Paciente"}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{getPatientCode(row)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3.5 text-[13px] text-[#6c7689]">
                    {calculateAge(getPatientBirthDate(row)) === "-" ? "Nao registada" : calculateAge(getPatientBirthDate(row))}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3.5">
                    <div className="text-[13px] text-[#2b3140]">{getExamLabel(row)}</div>
                    <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{getExamCategory(row)}</div>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3.5 text-[13px] text-[#6c7689]">
                    {formatDate(row?.lab_result_ready_at || row?.lab_sample_collected_at || row?.arrival_time)}
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe9dc] bg-[#eaf6f0] px-2.5 py-1 text-[11.5px] font-bold text-[#0f6e54]">
                      <CheckIcon />
                      Concluido
                    </span>
                  </td>
                  <td className="px-7 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenResult(row)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#dde1e7] bg-white px-3.5 py-2 text-[12.5px] font-semibold text-[#3a4150] hover:border-[#cfd4dc] hover:bg-[#fafbfc]"
                    >
                      <EyeIcon />
                      Ver resultado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="px-7 py-14 text-center">
            <div className="text-[15px] font-bold text-[#161a23]">Nenhum resultado pronto</div>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-6 text-[#6c7689]">
              Quando o laboratorio liberar um resultado ainda nao entregue, o paciente aparece aqui.
            </p>
          </div>
        )}

        {loading && rows.length === 0 && (
          <div className="px-7 py-14 text-center text-[13px] font-semibold text-[#6c7689]">A carregar resultados...</div>
        )}
      </div>
    </section>
  );
}

function ResultTable({ row }) {
  const rows = normalizeResultRows(row);
  let currentSection = "";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className="border-b border-[#eef0f3] pb-3 pr-2.5 text-left text-[11.5px] font-bold text-[#39405a]">Parametro</th>
            <th className="border-b border-[#eef0f3] pb-3 pr-2.5 text-left text-[11.5px] font-bold text-[#39405a]">Resultado</th>
            <th className="border-b border-[#eef0f3] pb-3 pr-2.5 text-left text-[11.5px] font-bold text-[#39405a]">Interpretacao</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const section = item.section || "RESULTADO";
            const showSection = section !== currentSection;
            currentSection = section;

            return (
              <Fragment key={`${item.parameter}-${index}`}>
                {showSection && (
                  <tr>
                    <td colSpan={3} className="border-b-0 pb-2 pt-4 text-[11px] font-bold uppercase tracking-[0.05em] text-[#0f6e54] first:pt-0">
                      {section}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] py-2.5 pr-2.5 text-[13px] text-[#3a4150]">{item.parameter}</td>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] py-2.5 pr-2.5 text-[13px] font-bold text-[#161a23]">{item.result}</td>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] py-2.5 pr-2.5 text-[13px] font-semibold text-[#0f6e54]">{item.interpretation || "-"}</td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultDetailCard({ row, onClose, onOpenLabTracking }) {
  const collectedAt = row?.lab_sample_collected_at || row?.arrival_time;
  const releasedAt = row?.lab_result_ready_at || row?.updated_at || row?.arrival_time;
  const weight = getPatientWeight(row);
  const birthDate = getPatientBirthDate(row);
  const age = calculateAge(birthDate);
  const sex = sexLabel(getPatientSex(row));
  const patientMeta = [getPatientCode(row), age !== "-" ? age : null, sex !== "-" ? sex : null]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="relative flex max-h-[calc(100vh-3rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
      <ModalCloseButton onClick={onClose} label="Fechar resultado" className="absolute right-3 top-3 z-10" />

      <header className="grid flex-none grid-cols-1 gap-4 px-4 py-3.5 pr-14 lg:grid-cols-[minmax(260px,1fr)_minmax(0,1.8fr)]">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#eaf6f0] text-[#0f6e54]">
            <UserIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[15px] font-bold text-[#161a23]">{row?.full_name || "Paciente"}</div>
            <div className="mt-0.5 text-[12px] leading-5 text-[#9aa3b2]">{patientMeta}</div>
            <div className="text-[12px] leading-5 text-[#9aa3b2]">
              Nasc.: {birthDate ? formatDate(birthDate) : "Nao registada"}
            </div>
            <div className="text-[12px] leading-5 text-[#9aa3b2]">
              Acompanhante: {getPatientGuardian(row) || "Nao registado"}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-x-5 gap-y-2 pt-0.5 md:grid-cols-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#9aa3b2]">Peso</span>
            <span className="text-[13px] font-semibold text-[#161a23]">{weight ? `${weight} kg` : "-"}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#9aa3b2]">Alergias</span>
            <span className="truncate text-[13px] font-semibold text-[#161a23]" title={row?.allergies || "Nenhuma conhecida"}>{row?.allergies || "Nenhuma conhecida"}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#9aa3b2]">Motivo da visita</span>
            <span className="truncate text-[13px] font-semibold text-[#161a23]" title="Resultado de Exame">Resultado de Exame</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-xs text-[#9aa3b2]">Medica responsavel</span>
            <span className="truncate text-[13px] font-semibold text-[#161a23]" title={row?.doctor_full_name || "Nao atribuida"}>{row?.doctor_full_name || "Nao atribuida"}</span>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#eef0f3] px-4 py-3.5">
        <div className="mb-3.5 grid grid-cols-1 gap-4 md:grid-cols-[1fr_210px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-[15px] font-bold text-[#161a23]">Exame: {getExamLabel(row)}</h3>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#cfe9dc] bg-[#eaf6f0] px-2.5 py-1 text-xs font-bold text-[#0f6e54]">
                <CheckIcon />
                Concluido
              </span>
            </div>
            <div className="whitespace-nowrap text-right text-xs leading-6 text-[#9aa3b2] md:text-right">
              <div>
                Coletado em: <b className="font-semibold text-[#2b3140]">{formatDateTime(collectedAt)}</b>
              </div>
              <div>
                Liberado em: <b className="font-semibold text-[#2b3140]">{formatDateTime(releasedAt)}</b>
              </div>
            </div>
          </div>

          <div className="flex items-start justify-end md:justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#dde1e7] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#3a4150] hover:bg-[#fafbfc]"
            >
              <PrintIcon />
              Imprimir
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[1fr_210px]">
          <main>
            <ResultTable row={row} />
            <div className="mt-4 border-t border-[#eef0f3] pt-3.5 text-xs leading-6 text-[#9aa3b2]">
              <div>
                Metodo: Automatizado <span className="mx-1.5 text-[#c7cdd6]">-</span> Material: {row?.lab_sample_type || "Conforme protocolo"}
              </div>
              <div>
                Responsavel tecnico: Laboratorio <span className="mx-1.5 text-[#c7cdd6]">-</span> CRM -
              </div>
            </div>
          </main>

          <aside className="flex flex-col gap-2.5">
            <section className="rounded-xl border border-[#e7e9ed] px-3 py-3">
              <h4 className="mb-2.5 text-[13.5px] font-bold text-[#161a23]">Resumo / Comentario</h4>
              <p className="text-[12px] leading-5 text-[#6c7689]">{getResultComment(row)}</p>
            </section>

            <section className="rounded-xl border border-[#e7e9ed] px-3 py-3">
              <h4 className="mb-2.5 text-[13.5px] font-bold text-[#161a23]">Anexos do exame</h4>
              <div className="flex items-center gap-2 rounded-[10px] bg-[#f6f7f9] px-2.5 py-2.5">
                <PdfIcon />
                <div className="min-w-0 flex-1">
                  <div className="break-words text-[11.8px] font-semibold leading-4 text-[#161a23]">{getAttachmentName(row)}</div>
                  <div className="mt-1 whitespace-nowrap text-[11px] text-[#9aa3b2]">{formatDateTime(releasedAt)} - gerado</div>
                </div>
                <button type="button" className="flex-none text-[#6c7689]" aria-label="Transferir anexo">
                  <DownloadIcon />
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-[#e7e9ed] px-3 py-3">
              <h4 className="mb-2.5 text-[13.5px] font-bold text-[#161a23]">Acoes</h4>
              <button
                type="button"
                onClick={() => onOpenLabTracking?.(row)}
                className="flex w-full items-center justify-center gap-2 rounded-[9px] border border-[#dde1e7] bg-white p-3 text-[13px] font-semibold text-[#3a4150] hover:bg-[#fafbfc]"
              >
                <CalendarIcon />
                Marcar outra consulta
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ row, onClose, onOpenLabTracking }) {
  return (
    <div
      className="fixed inset-0 z-[9998] grid place-items-center overflow-hidden bg-[#111827]/55 p-5 backdrop-blur-sm"
      style={{ animation: "infoModalFadeIn 160ms ease-out" }}
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="mx-auto w-full max-w-[900px] min-h-0"
        style={{ animation: "infoModalPopIn 180ms cubic-bezier(0.16,1,0.3,1)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <ResultDetailCard row={row} onClose={onClose} onOpenLabTracking={onOpenLabTracking} />
      </div>
    </div>
  );
}

export default function LabWorklistView({
  readyRows = [],
  loading = false,
  onRefresh,
  onOpenLabTracking,
}) {
  const readyForReviewRows = useMemo(
    () => readyRows.filter((row) => isReadyResult(row) && !isDeliveredResult(row)),
    [readyRows]
  );
  const [selectedVisitId, setSelectedVisitId] = useState(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const activeReadyRow =
    readyForReviewRows.find((row) => Number(row?.id) === Number(selectedVisitId)) ||
    readyForReviewRows[0] ||
    null;

  return (
    <div className="bg-transparent font-sans">
      <ReadyResultsPage
        rows={readyForReviewRows}
        loading={loading}
        onRefresh={onRefresh}
        onOpenResult={(row) => {
          setSelectedVisitId(Number(row?.id) || null);
          setResultModalOpen(true);
        }}
      />

      {resultModalOpen && activeReadyRow && typeof document !== "undefined"
        ? createPortal(
            <ResultModal
              row={activeReadyRow}
              onClose={() => setResultModalOpen(false)}
              onOpenLabTracking={onOpenLabTracking}
            />,
            document.body
          )
        : null}
    </div>
  );
}
