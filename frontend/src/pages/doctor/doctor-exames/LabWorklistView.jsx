import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import ModalCloseButton from "../../../components/shared/ModalCloseButton";

const EXAM_LABELS = {
  MALARIA_RDT: "Teste Rapido de Malaria",
};

const getExamLabel = (row) =>
  EXAM_LABELS[String(row?.lab_exam_type || "").toUpperCase()] ||
  "Teste Rapido de Malaria";

const isMalariaExam = (row) => {
  const exam = String(row?.lab_exam_type || row?.lab_tests || "").toUpperCase();
  return !exam || exam.includes("MALARIA") || exam === "MALARIA_RDT";
};

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
  if (type && !type.includes("MALARIA")) return "Analises clinicas";
  return "Teste rapido";
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

const matchesVisit = (row, visitId) => {
  const target = typeof visitId === "object" ? Number(visitId?.visitId) : Number(visitId);
  const targetPatient = typeof visitId === "object" ? Number(visitId?.patientId) : null;
  return [
    row?.id,
    row?.lab_source_visit_id,
    row?.parent_visit_id,
    row?.visit_id,
    row?.source_visit_id,
  ].some((value) => target && Number(value) === target) || Boolean(targetPatient && Number(row?.patient_id) === targetPatient);
};

function ReadyResultsPage({
  rows,
  loading,
  onRefresh,
  onOpenResult,
  highlightedVisitId,
  onClearHighlight,
  pageSize = 8,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="text-[14px] text-[#2b3140]">
      <div className="overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
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
          <table className="w-full min-w-[920px] border-collapse">
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
              {paginatedRows.map((row) => {
                const highlighted = matchesVisit(row, highlightedVisitId);
                return (
                <tr
                  key={`${row.id}-${row.lab_exam_type || row.lab_tests || "exam"}`}
                  className={`border-b border-[#eef0f3] last:border-b-0 hover:bg-[#f8faf9] ${highlighted ? "bg-[#fff7ed] shadow-[inset_4px_0_0_#f59e0b]" : ""}`}
                >
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
                      onClick={() => {
                        onClearHighlight?.();
                        onOpenResult(row);
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-semibold hover:border-[#cfd4dc] hover:bg-[#fafbfc] ${
                        highlighted
                          ? "border-[#f59e0b] bg-[#fff7ed] text-[#9a5a00] shadow-[0_0_0_3px_rgba(245,158,11,0.16)]"
                          : "border-[#dde1e7] bg-white text-[#3a4150]"
                      }`}
                    >
                      <EyeIcon />
                      Ver resultado
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] bg-white px-7 py-4 text-[12.5px] text-[#6c7689]">
            <span>
              {rows.length === 0
                ? "0 pacientes"
                : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, rows.length)} de ${rows.length} pacientes`}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage <= 1}
                className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Anterior
              </button>
              <span className="rounded-lg bg-[#f4f6f8] px-3 py-1.5 font-semibold text-[#3a4150]">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage >= totalPages}
                className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Proximo
              </button>
            </div>
          </div>
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

  return (
    <div className="overflow-x-auto rounded-xl border border-[#e7e9ed]">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="bg-[#fafbfc]">
            <th className="border-b border-[#e7e9ed] px-5 py-3.5 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#39405a]">Parametro</th>
            <th className="border-b border-[#e7e9ed] px-5 py-3.5 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#39405a]">Resultado</th>
            <th className="border-b border-[#e7e9ed] px-5 py-3.5 text-left text-[11.5px] font-bold uppercase tracking-[0.04em] text-[#39405a]">Interpretacao</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const section = item.section || "RESULTADO";
            const previousSection = rows[index - 1]?.section || "RESULTADO";
            const showSection = index === 0 || section !== previousSection;

            return (
              <Fragment key={`${item.parameter}-${index}`}>
                {showSection && (
                  <tr>
                    <td colSpan={3} className="border-b border-[#eef0f3] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.05em] text-[#0f6e54]">
                      {section}
                    </td>
                  </tr>
                )}
                <tr>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] px-5 py-3.5 text-[13px] text-[#3a4150]">{item.parameter}</td>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] px-5 py-3.5 text-[13px] font-bold text-[#161a23]">{item.result}</td>
                  <td className="whitespace-nowrap border-b border-[#eef0f3] px-5 py-3.5 text-[13px] font-semibold text-[#0f6e54]">{item.interpretation || "-"}</td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ResultDetailCard({ row, onClose, onMarkDelivered, markingDelivered = false }) {
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
        <div className="mb-3.5 flex flex-wrap items-start justify-between gap-4">
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

          <div className="flex flex-wrap items-start justify-end gap-2">
            <button
              type="button"
              disabled={markingDelivered || isDeliveredResult(row)}
              onClick={async () => {
                if (!onMarkDelivered || !row?.id) return;
                const ok = await onMarkDelivered(row);
                if (ok !== false) onClose?.();
              }}
              className="inline-flex items-center gap-2 rounded-[9px] border border-[#0f6e54] bg-[#0f6e54] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#0c5a44] disabled:cursor-not-allowed disabled:border-[#cfe9dc] disabled:bg-[#eaf6f0] disabled:text-[#0f6e54]"
            >
              {markingDelivered ? "A confirmar..." : isDeliveredResult(row) ? "Resultado entregue" : "Confirmar entrega"}
            </button>
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

        <div>
          <main>
            <ResultTable row={row} />
          </main>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ row, onClose, onMarkDelivered, markingDelivered = false }) {
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
        <ResultDetailCard
          row={row}
          onClose={onClose}
          onMarkDelivered={onMarkDelivered}
          markingDelivered={markingDelivered}
        />
      </div>
    </div>
  );
}

export default function LabWorklistView({
  readyRows = [],
  loading = false,
  onRefresh,
  onMarkDelivered,
  markingDeliveredVisitId = null,
  highlightedVisitId,
  onClearHighlight,
}) {
  const readyForReviewRows = useMemo(
    () => readyRows.filter((row) => isMalariaExam(row) && isReadyResult(row) && !isDeliveredResult(row)),
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
        highlightedVisitId={highlightedVisitId}
        onClearHighlight={onClearHighlight}
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
              onMarkDelivered={onMarkDelivered}
              markingDelivered={
                Boolean(activeReadyRow?.id) &&
                Number(markingDeliveredVisitId) === Number(activeReadyRow.id)
              }
            />,
            document.body
          )
        : null}
    </div>
  );
}
