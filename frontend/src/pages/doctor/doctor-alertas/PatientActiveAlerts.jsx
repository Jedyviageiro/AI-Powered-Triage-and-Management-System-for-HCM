import { useEffect, useMemo, useState } from "react";
import DoctorPage from "../DoctorPage";

const getInitials = (name) =>
  String(name || "Paciente")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "P";

const formatTime = (iso) => {
  if (!iso) return "-";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

const formatWait = (mins) => {
  if (mins == null || Number.isNaN(Number(mins))) return "-";
  const value = Math.max(0, Math.round(Number(mins)));
  if (value < 60) return `${value} min`;
  return `${Math.floor(value / 60)}h ${value % 60}min`;
};

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.3 3.86 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function PatientActiveAlertsView({
  activeAlertRows = [],
  filteredQueue = [],
  formatPriorityPt,
  formatStatus,
  onOpenVisit,
  pageSize = 8,
}) {
  const [page, setPage] = useState(1);
  const rows = useMemo(() => (Array.isArray(activeAlertRows) ? activeAlertRows : []), [activeAlertRows]);
  const inConsultCount = filteredQueue.filter(
    (visit) =>
      String(visit?.status || "").toUpperCase() === "IN_CONSULTATION" &&
      String(visit?.priority || "").toUpperCase() === "URGENT"
  ).length;
  const waitingCount = rows.filter((visit) => String(visit?.status || "").toUpperCase() === "WAITING_DOCTOR").length;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white text-[14px] text-[#2b3140] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
      <header className="flex flex-wrap items-start justify-between gap-5 px-7 py-6">
        <div>
          <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] text-[#161a23]">Alertas Ativos</h2>
          <p className="mt-1 text-[12.5px] text-[#9aa3b2]">Pacientes urgentes e casos que precisam de revisao imediata</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#f6d0cd] bg-[#fdeceb] px-3.5 py-2 text-[12.5px] font-bold text-[#c0362c]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#c0362c]" />
            {rows.length} alerta{rows.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#cddff8] bg-[#eaf1fd] px-3.5 py-2 text-[12.5px] font-bold text-[#1d54c0]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#1d54c0]" />
            {inConsultCount} em consulta
          </span>
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#f3ddb2] bg-[#fdf3e3] px-3.5 py-2 text-[12.5px] font-bold text-[#b45309]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#b45309]" />
            {waitingCount} aguardando
          </span>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="border-t border-[#eef0f3] px-7 py-14 text-center text-[13px] text-[#9aa3b2]">
          Sem alertas criticos no momento.
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-[#eef0f3]">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
                {["Chegada", "Paciente", "Espera", "Prioridade", "Estado", "Acao"].map((header, index) => (
                  <th key={header} className={`px-3.5 py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#39405a] ${index === 0 ? "pl-7" : ""} ${index === 5 ? "pr-7 text-right" : ""}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#eef0f3]">
                <td colSpan={6} className="p-0">
                  <div className="flex items-center justify-between gap-3 bg-[#fdeceb] px-7 py-[11px]">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border border-[#f6d0cd] bg-white text-[#c0362c]">
                        <AlertIcon />
                      </span>
                      <span className="text-[12.5px] font-bold text-[#c0362c]">Prioridade clinica</span>
                      <span className="ml-2 text-[11.5px] text-[#9aa3b2]">Pacientes que precisam de acao imediata</span>
                    </div>
                    <span className="whitespace-nowrap rounded-full border border-[#f6d0cd] bg-white px-2.5 py-1 text-[11px] font-bold text-[#c0362c]">
                      {rows.length} paciente{rows.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </td>
              </tr>

              {paginatedRows.map((visit) => (
                <tr key={visit.id} className="border-b border-[#eef0f3] bg-white hover:bg-[#fafbfb]">
                  <td className="whitespace-nowrap px-3.5 py-[13px] pl-7 text-[13px] font-bold text-[#161a23]">{formatTime(visit.arrival_time)}</td>
                  <td className="px-3.5 py-[13px]">
                    <div className="flex items-center gap-[11px]">
                      <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#fdeceb] text-[12.5px] font-bold text-[#c0362c]">{getInitials(visit.full_name)}</div>
                      <div>
                        <div className="text-[13px] font-bold text-[#161a23]">{visit.full_name || "Paciente"}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{visit.clinical_code || `Visita #${visit.id}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px]">
                    <span className="inline-flex items-center rounded-[7px] border border-[#f6d0cd] bg-[#fdeceb] px-[11px] py-[5px] text-xs font-bold text-[#c0362c]">{formatWait(visit.wait_minutes)}</span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px]">
                    <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-[#fdeceb] px-[11px] py-[5px] text-xs font-bold text-[#c0362c]">
                      <span className="h-1.5 w-1.5 flex-none rounded-full bg-[#c0362c]" />
                      {formatPriorityPt(visit.priority)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3.5 py-[13px] text-[12.5px] font-semibold text-[#9aa3b2]">{formatStatus(visit.status)}</td>
                  <td className="px-3.5 py-[13px] pr-7 text-right">
                    <button type="button" onClick={() => onOpenVisit?.(visit)} className="inline-flex items-center gap-2 rounded-[7px] border-0 bg-[#0f6e54] px-4 py-2 text-[12.5px] font-bold text-white transition hover:bg-[#0c5a44]">
                      Abrir <ArrowIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] bg-white px-7 py-4 text-[12.5px] text-[#6c7689]">
            <span>{`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, rows.length)} de ${rows.length} alertas`}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45">Anterior</button>
              <span className="rounded-lg bg-[#f4f6f8] px-3 py-1.5 font-semibold text-[#3a4150]">{currentPage} / {totalPages}</span>
              <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages} className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45">Proximo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PatientActiveAlerts() {
  return <DoctorPage forcedView="activeAlerts" />;
}
