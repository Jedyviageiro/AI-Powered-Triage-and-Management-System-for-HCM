import { Fragment, useEffect, useMemo, useState } from "react";
import DoctorPage from "../DoctorPage";

const priorityInfo = (value) => {
  const key = String(value || "").toUpperCase();
  if (["URGENT", "HIGH"].includes(key)) {
    return { label: "Urgente", bg: "#fdeceb", color: "#c0362c", dot: "#c0362c" };
  }
  if (["LESS_URGENT", "MEDIUM"].includes(key)) {
    return { label: "Pouco urgente", bg: "#fdf3e3", color: "#b45309", dot: "#b45309" };
  }
  return { label: "Nao urgente", bg: "#eaf6f0", color: "#0f6e54", dot: "#0f6e54" };
};

const statusInfo = (value) => {
  const key = String(value || "").toUpperCase();
  if (key === "IN_CONSULTATION") return { label: "Em consulta", color: "#1d54c0" };
  if (key === "WAITING_DOCTOR") return { label: "Aguardando medico", color: "#b45309" };
  return { label: value || "Aguardando", color: "#6c7689" };
};

const getInitials = (name) =>
  String(name || "Paciente")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

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

const formatVital = (value, unit = "") => {
  if (value == null || value === "" || Number.isNaN(Number(value))) return "-";
  return `${Number(value)}${unit}`;
};

const visitTypeLabel = (visit) => {
  const type = String(visit?.visit_type || "").toUpperCase();
  const motive = String(visit?.visit_motive || "").toUpperCase();
  const labKind = String(visit?.lab_return_kind || "").toUpperCase();
  if (type === "LAB_RETURN" || motive === "LAB_RESULTS" || motive === "LAB_SAMPLE_COLLECTION") {
    return labKind === "SAMPLE_COLLECTION" || motive === "LAB_SAMPLE_COLLECTION"
      ? "Lab: colheita"
      : "Lab: resultado";
  }
  if (type === "FOLLOW_UP" || visit?.parent_visit_id || visit?.return_visit_date) return "Retorno: seguimento";
  return "Nova consulta";
};

const isLabVisit = (visit) => {
  const type = String(visit?.visit_type || "").toUpperCase();
  const motive = String(visit?.visit_motive || "").toUpperCase();
  return type === "LAB_RETURN" || motive === "LAB_RESULTS" || motive === "LAB_SAMPLE_COLLECTION";
};

const isFollowupVisit = (visit) => {
  const type = String(visit?.visit_type || "").toUpperCase();
  return !isLabVisit(visit) && (type === "FOLLOW_UP" || visit?.parent_visit_id || visit?.return_visit_date);
};

const canAttend = (row) => {
  const status = String(row?.status || "").toUpperCase();
  return status === "WAITING_DOCTOR" || status === "IN_CONSULTATION";
};

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function GroupIcon({ type }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {type === "lab" ? (
        <>
          <path d="M9 2v6.5L4.5 17a2 2 0 0 0 1.8 3h11.4a2 2 0 0 0 1.8-3L15 8.5V2" />
          <path d="M9 2h6" />
          <path d="M7.5 14h9" />
        </>
      ) : type === "followup" ? (
        <>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          <path d="M3 21v-5h5" />
        </>
      ) : (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 11h-6" />
          <path d="M19 8v6" />
        </>
      )}
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

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function DoctorWaitingQueueView({
  queue = [],
  loading = false,
  onRefresh,
  onOpenVisit,
  onAttendVisit,
  onOpenLabResult,
  selectedVisitId,
  title = "Fila de Espera",
  subtitle = "Fila de espera do departamento",
  pageSize = 8,
}) {
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const todayLabel = new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "long" });

  const rows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const base = Array.isArray(queue) ? [...queue] : [];
    const filtered = query
      ? base.filter(
          (visit) =>
            String(visit?.full_name || "").toLowerCase().includes(query) ||
            String(visit?.clinical_code || "").toLowerCase().includes(query) ||
            visitTypeLabel(visit).toLowerCase().includes(query)
        )
      : base;

    return filtered.sort((a, b) => {
      const rank = (visit) => {
        const p = String(visit?.priority || "").toUpperCase();
        if (["URGENT", "HIGH"].includes(p)) return 0;
        if (["LESS_URGENT", "MEDIUM"].includes(p)) return 1;
        if (["NON_URGENT", "NOT_URGENT", "LOW"].includes(p)) return 2;
        return 3;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
      return new Date(a?.arrival_time || 0).getTime() - new Date(b?.arrival_time || 0).getTime();
    });
  }, [queue, searchQuery]);

  const selectedRow = useMemo(
    () => rows.find((row) => Number(row?.id) === Number(selectedId)) || null,
    [rows, selectedId]
  );

  const waitingCount = rows.filter((visit) => visit.status === "WAITING_DOCTOR").length;
  const inConsultCount = rows.filter((visit) => visit.status === "IN_CONSULTATION").length;
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, queue.length]);

  const groups = useMemo(
    () =>
      [
        {
          key: "lab",
          name: "Resultados de Exames",
          desc: "Pacientes aguardando entrega de resultados de laboratorio",
          rows: paginatedRows.filter(isLabVisit),
          bg: "#eaf1fd",
          color: "#1e40af",
          border: "#cddff8",
        },
        {
          key: "followup",
          name: "Consultas de Retorno",
          desc: "Pacientes em seguimento ou retorno de tratamento",
          rows: paginatedRows.filter(isFollowupVisit),
          bg: "#f4eefb",
          color: "#6b21a8",
          border: "#e3d2f3",
        },
        {
          key: "normal",
          name: "Novas Consultas",
          desc: "Pacientes a espera da primeira consulta",
          rows: paginatedRows.filter((visit) => !isLabVisit(visit) && !isFollowupVisit(visit)),
          bg: "#eaf6f0",
          color: "#0c5a44",
          border: "#cfe9dc",
        },
      ].filter((group) => group.rows.length > 0),
    [paginatedRows]
  );

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white text-[14px] text-[#2b3140] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
      <header className="flex flex-wrap items-start justify-between gap-5 px-7 py-6">
        <div>
          <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] text-[#161a23]">{title}</h2>
          <p className="mt-1 text-[12.5px] text-[#9aa3b2]">{subtitle} - {todayLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#f3ddb2] bg-[#fdf3e3] px-3.5 py-2 text-[12.5px] font-bold text-[#b45309]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#b45309]" />
            {waitingCount} aguardando
          </span>
          <span className="inline-flex items-center gap-2 rounded-[9px] border border-[#cddff8] bg-[#eaf1fd] px-3.5 py-2 text-[12.5px] font-bold text-[#1d54c0]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#1d54c0]" />
            {inConsultCount} em consulta
          </span>

          <label className="flex w-[220px] items-center gap-2 rounded-[9px] border border-[#dde1e7] bg-white px-3.5 py-2.5 text-[#9aa3b2]">
            <SearchIcon />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full border-none bg-transparent text-[13px] text-[#2b3140] outline-none placeholder:text-[#9aa3b2]"
              placeholder="Pesquisar..."
            />
          </label>

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
          {loading ? "A carregar pacientes..." : "Sem pacientes na fila no momento."}
        </div>
      ) : (
        <div className="overflow-x-auto border-t border-[#eef0f3]">
          <table className="w-full min-w-[920px] border-collapse">
            <thead>
              <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
                {["Chegada", "Paciente", "Espera", "Prioridade", "Codigo", "Acao"].map((header, index) => (
                  <th
                    key={header}
                    className={`px-3.5 py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#39405a] ${index === 0 ? "pl-7" : ""} ${index === 5 ? "pr-7 text-right" : ""}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <Fragment key={group.key}>
                  <tr className="border-b border-[#eef0f3]">
                    <td colSpan={6} className="p-0">
                      <div className="flex items-center justify-between gap-3 px-7 py-[11px]" style={{ background: group.bg }}>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] border bg-white"
                            style={{ borderColor: group.border, color: group.color }}
                          >
                            <GroupIcon type={group.key} />
                          </span>
                          <span className="text-[12.5px] font-bold" style={{ color: group.color }}>
                            {group.name}
                          </span>
                          <span className="ml-2 text-[11.5px] text-[#9aa3b2]">{group.desc}</span>
                        </div>
                        <span
                          className="whitespace-nowrap rounded-full border bg-white px-2.5 py-1 text-[11px] font-bold"
                          style={{ borderColor: group.border, color: group.color }}
                        >
                          {group.rows.length} paciente{group.rows.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {group.rows.map((row) => {
                    const selected = Number(row?.id) === Number(selectedId);
                    const isActive = Number(row?.id) === Number(selectedVisitId);
                    const priority = priorityInfo(row.priority);
                    const wait = Number(row.wait_minutes);
                    const waitTheme =
                      wait >= 60
                        ? "border border-[#f6d0cd] bg-[#fdeceb] text-[#c0362c]"
                        : wait >= 30
                          ? "border border-[#f3ddb2] bg-[#fdf3e3] text-[#b45309]"
                          : "bg-[#f1f2f4] text-[#5b6472]";
                    const avatarBg =
                      group.key === "lab" ? "#eaf1fd" : group.key === "followup" ? "#f4eefb" : "#eaf6f0";

                    return (
                      <tr
                        key={row.id}
                        onClick={() => setSelectedId(row.id)}
                        className="border-b border-[#eef0f3] hover:bg-[#fafbfb]"
                        style={{ background: selected || isActive ? "#fafbfb" : "#fff", cursor: "pointer" }}
                      >
                        <td className="whitespace-nowrap px-3.5 py-[13px] pl-7 text-[13px] font-bold text-[#161a23]">
                          {formatTime(row.arrival_time)}
                        </td>
                        <td className="px-3.5 py-[13px]">
                          <div className="flex items-center gap-[11px]">
                            <div
                              className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12.5px] font-bold"
                              style={{ background: avatarBg, color: group.color }}
                            >
                              {getInitials(row.full_name)}
                            </div>
                            <div>
                              <div className="text-[13px] font-bold text-[#161a23]">{row.full_name || "-"}</div>
                              <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{visitTypeLabel(row)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-[13px]">
                          <span className={`inline-flex items-center rounded-[7px] px-[11px] py-[5px] text-xs font-bold ${waitTheme}`}>
                            {formatWait(row.wait_minutes)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-[13px]">
                          <span className="inline-flex items-center gap-1.5 rounded-[7px] px-[11px] py-[5px] text-xs font-bold" style={{ background: priority.bg, color: priority.color }}>
                            <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: priority.dot }} />
                            {priority.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-[13px] text-[12.5px] font-semibold text-[#9aa3b2]">
                          {row.clinical_code || "-"}
                        </td>
                        <td className="px-3.5 py-[13px] pr-7 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedId(row.id);
                              if (isLabVisit(row)) {
                                onOpenLabResult?.(row);
                                return;
                              }
                              if (canAttend(row)) onAttendVisit?.(row.id, row);
                            }}
                            disabled={!isLabVisit(row) && !canAttend(row)}
                            className="inline-flex items-center gap-2 rounded-[7px] border-0 px-4 py-2 text-[12.5px] font-bold text-white transition disabled:cursor-not-allowed disabled:bg-[#f1f2f4] disabled:text-[#9aa3b2]"
                            style={{ background: isLabVisit(row) || canAttend(row) ? "#0f6e54" : undefined }}
                          >
                            {isLabVisit(row)
                              ? "Ver resultado"
                              : row.status === "IN_CONSULTATION"
                                ? "Continuar"
                                : canAttend(row)
                                  ? "Atender"
                                  : "Aguardando"}
                            {isLabVisit(row) ? <EyeIcon /> : <ArrowIcon />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              ))}
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
      )}

      {selectedRow && (
        <div className="m-4 overflow-hidden rounded-2xl border border-[#e7e9ed] bg-white">
          <div className="flex items-center justify-between gap-4 border-b border-[#e7e9ed] bg-[#fafbfc] px-5 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf6f0] text-sm font-bold text-[#0f6e54]">
                {getInitials(selectedRow.full_name)}
              </div>
              <div>
                <div className="text-[18px] font-bold text-[#111827]">{selectedRow.full_name || "-"}</div>
                <div className="mt-0.5 text-xs text-[#6b7280]">
                  {selectedRow.clinical_code || "Sem codigo"} - Visita #{selectedRow.id}
                </div>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedId(null)} className="h-9 w-9 rounded-full border border-[#e7e9ed] bg-white text-[#6b7280]">
              x
            </button>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-3">
            {[
              { label: "Chegada", value: formatTime(selectedRow.arrival_time) },
              { label: "Tempo de espera", value: formatWait(selectedRow.wait_minutes) },
              { label: "Codigo clinico", value: selectedRow.clinical_code || "-" },
              { label: "Temp.", value: formatVital(selectedRow.temperature, " C") },
              { label: "SpO2", value: formatVital(selectedRow.oxygen_saturation, "%") },
              { label: "Peso", value: formatVital(selectedRow.weight, " kg") },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-[#e7e9ed] bg-white p-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#9ca3af]">{item.label}</div>
                <div className="text-[13px] font-semibold text-[#1f2937]">{item.value}</div>
              </div>
            ))}
          </div>

          {(selectedRow.chief_complaint || selectedRow.triage_chief_complaint) && (
            <div className="mx-5 mb-5 rounded-xl border border-[#e7e9ed] border-l-[#0f6e54] bg-[#f8faf9] p-4 text-[13px] leading-6 text-[#374151]">
              {selectedRow.chief_complaint || selectedRow.triage_chief_complaint}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[#e7e9ed] px-5 py-4">
            <button type="button" onClick={() => setSelectedId(null)} className="rounded-full border border-[#e7e9ed] bg-white px-5 py-2 text-xs font-semibold text-[#6b7280]">
              Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLabVisit(selectedRow)) {
                  onOpenLabResult?.(selectedRow);
                  return;
                }
                onOpenVisit?.(selectedRow.id, selectedRow);
              }}
              className="rounded-full bg-[#0f6e54] px-5 py-2 text-xs font-bold text-white"
            >
              {isLabVisit(selectedRow) ? "Ver resultado" : "Abrir Consulta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorWaitingQueue() {
  return <DoctorPage forcedView="waitingQueue" />;
}
