import { useEffect, useMemo, useState } from "react";
import DoctorPage from "../DoctorPage";

const toDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
  const parsed = toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatTime = (value) => {
  const parsed = toDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

const extractScheduledTime = (row) => {
  const embedded = String(row?.follow_up_when || "").match(/\b(\d{2}:\d{2})\b/);
  if (embedded) return embedded[1];
  const fallback = formatTime(row?.arrival_time || row?.return_visit_date);
  return fallback === "-" ? "" : fallback;
};

const extractClinicalReturnReason = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "Retorno agendado";
  return (
    raw
      .replace(/retornos previstos:\s*\d+\s*\|\s*datas:\s*[^|]+/i, "")
      .replace(/^\s*\|\s*/, "")
      .trim() || "Retorno agendado"
  );
};

const getInitials = (name) =>
  String(name || "Paciente")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "P";

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
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

export function DoctorScheduledFollowupsView({
  returnsToday = [],
  loading = false,
  onRefresh,
  onOpenVisit,
  pageSize = 8,
}) {
  const [page, setPage] = useState(1);
  const todayLabel = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long" });

  const rows = useMemo(
    () =>
      (Array.isArray(returnsToday) ? returnsToday : [])
        .filter((row) => {
          const status = String(row?.status || "").toUpperCase();
          const childStatus = String(row?.active_child_status || "").toUpperCase();
          return status !== "CANCELLED" && childStatus !== "CANCELLED";
        })
        .slice()
        .sort(
          (a, b) =>
            new Date(`${String(a?.return_visit_date || a?.arrival_time || "").slice(0, 10)}T${extractScheduledTime(a) || "23:59"}:00`) -
            new Date(`${String(b?.return_visit_date || b?.arrival_time || "").slice(0, 10)}T${extractScheduledTime(b) || "23:59"}:00`)
        ),
    [returnsToday]
  );

  const isFutureDate = (value) => {
    const parsed = toDate(value);
    if (!parsed) return false;
    const scheduled = new Date(parsed);
    scheduled.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return scheduled.getTime() > today.getTime();
  };

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
          <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] text-[#161a23]">Consultas Marcadas</h2>
          <p className="mt-1 text-[12.5px] text-[#9aa3b2]">Retornos agendados - {todayLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#cfe9dc] bg-[#eaf6f0] px-3.5 py-2 text-[12.5px] font-bold text-[#0f6e54]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#0f6e54]" />
            {rows.length} marcadas
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[9px] border-0 bg-[#0f6e54] px-[18px] py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0c5a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshIcon />
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="border-t border-[#eef0f3] px-7 py-14 text-center text-[13px] text-[#9aa3b2]">
          {loading ? "A carregar consultas..." : "Sem consultas marcadas no momento."}
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-[#eef0f3]">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
                {["Data", "Hora", "Paciente", "Motivo", "Codigo", "Acao"].map((header, index) => (
                  <th key={header} className={`px-3.5 py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#39405a] ${index === 0 ? "pl-7" : ""} ${index === 5 ? "pr-7 text-right" : ""}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row) => {
                const canOpen = !isFutureDate(row?.return_visit_date);
                return (
                  <tr key={row.id} className="border-b border-[#eef0f3] bg-white hover:bg-[#fafbfb]">
                    <td className="whitespace-nowrap px-3.5 py-[13px] pl-7 text-[13px] font-bold text-[#161a23]">{formatDate(row.return_visit_date || row.arrival_time)}</td>
                    <td className="whitespace-nowrap px-3.5 py-[13px] text-[13px] font-bold text-[#161a23]">{extractScheduledTime(row) || "-"}</td>
                    <td className="px-3.5 py-[13px]">
                      <div className="flex items-center gap-[11px]">
                        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#eaf6f0] text-[12.5px] font-bold text-[#0f6e54]">{getInitials(row.full_name)}</div>
                        <div>
                          <div className="text-[13px] font-bold text-[#161a23]">{row.full_name || "-"}</div>
                          <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">Retorno agendado</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[320px] px-3.5 py-[13px] text-[12.5px] leading-5 text-[#6c7689]">{extractClinicalReturnReason(row.return_visit_reason)}</td>
                    <td className="whitespace-nowrap px-3.5 py-[13px] text-[12.5px] font-semibold text-[#9aa3b2]">{row.clinical_code || "-"}</td>
                    <td className="px-3.5 py-[13px] pr-7 text-right">
                      <button
                        type="button"
                        onClick={() => canOpen && onOpenVisit?.(row.id, row)}
                        disabled={!canOpen}
                        className="inline-flex items-center gap-2 rounded-[7px] border-0 bg-[#0f6e54] px-4 py-2 text-[12.5px] font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#f1f2f4] disabled:text-[#9aa3b2]"
                      >
                        {canOpen ? "Abrir" : "Aguardando"}
                        {canOpen && <ArrowIcon />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] bg-white px-7 py-4 text-[12.5px] text-[#6c7689]">
            <span>{`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, rows.length)} de ${rows.length} consultas`}</span>
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

export default function DoctorScheduledFollowups() {
  return <DoctorPage forcedView="scheduledFollowups" />;
}
