import { useMemo } from "react";
import DataTable from "../../../components/shared/ui/DataTable";
import NursePage from "../NursePage";

const getInitials = (name) =>
  String(name || "?")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const hospitalPillStyle = (visit, hospitalStatus) => {
  const status = String(visit.hospital_status || visit.disposition_plan || "").toUpperCase();
  if (
    status === "DISCHARGED" ||
    status === "HOME" ||
    hospitalStatus === "Alta" ||
    hospitalStatus === "Alta com Retorno"
  ) {
    return "bg-[#eaf6f0] text-[#0f6e54]";
  }
  if (status === "IN_HOSPITAL") return "bg-[#eaf1fd] text-[#1d54c0]";
  if (status === "REFER_SPECIALIST") return "bg-[#eef2ff] text-[#3730a3]";
  if (status === "BED_REST") return "bg-[#fdf3e3] text-[#b45309]";
  if (status === "TRANSFERRED") return "bg-[#f4eefb] text-[#6b21a8]";
  if (status === "DECEASED") return "bg-[#fdeceb] text-[#b91c1c]";
  return "bg-[#f1f2f4] text-[#6c7689]";
};

export function NursePatientsView({
  pastVisits = [],
  loadingPastVisits,
  loadPastVisits,
  inferHospitalStatus,
  inferVitalStatus,
  openPastVisitModal,
}) {
  const columns = useMemo(
    () => [
      {
        key: "visit",
        label: "Visita",
        render: (visit) => (
          <span className="font-semibold tabular-nums text-[#6c7689]">#{visit.id}</span>
        ),
      },
      {
        key: "patient",
        label: "Paciente",
        render: (visit) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#eaf6f0] text-[12.5px] font-bold text-[#0f6e54]">
              {getInitials(visit.full_name)}
            </div>
            <div className="min-w-0">
              <div className="truncate font-bold text-[#161a23]">{visit.full_name || "-"}</div>
              <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{visit.clinical_code || "-"}</div>
            </div>
          </div>
        ),
      },
      {
        key: "chief_complaint",
        label: "Queixa principal",
        render: (visit) => (
          <span className="block max-w-[220px] truncate" title={visit.chief_complaint || visit.triage_chief_complaint || "-"}>
            {visit.chief_complaint || visit.triage_chief_complaint || "-"}
          </span>
        ),
      },
      {
        key: "diagnosis",
        label: "Diagnostico / resumo",
        render: (visit) => (
          <div className="max-w-[260px]">
            <div className="truncate font-semibold text-[#161a23]" title={visit.likely_diagnosis || "-"}>
              {visit.likely_diagnosis || "-"}
            </div>
            {(visit.clinical_reasoning || visit.prescription_text) && (
              <div className="mt-0.5 truncate text-[11.5px] text-[#6c7689]">
                {visit.clinical_reasoning || visit.prescription_text}
              </div>
            )}
          </div>
        ),
      },
      {
        key: "doctor",
        label: "Medico",
        render: (visit) => (
          <div>
            <div className="truncate text-[#2b3140]">
              {visit.doctor_full_name || visit.doctor_username || "-"}
            </div>
            {visit.doctor_specialization && (
              <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{visit.doctor_specialization}</div>
            )}
          </div>
        ),
      },
      {
        key: "destination",
        label: "Destino",
        render: (visit) => {
          const status = inferHospitalStatus(visit);
          return (
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${hospitalPillStyle(visit, status)}`}>
              {status}
            </span>
          );
        },
      },
      {
        key: "vital",
        label: "Vital",
        render: (visit) => {
          const vital = inferVitalStatus(visit);
          const normalizedVital = String(vital || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toUpperCase();
          const isObit = normalizedVital === "OBITO";
          return (
            <span className={`font-semibold ${isObit ? "text-[#b91c1c]" : "text-[#0f6e54]"}`}>
              {vital}
            </span>
          );
        },
      },
      {
        key: "date",
        label: "Data",
        render: (visit) => formatDate(visit.consultation_ended_at || visit.arrival_time),
      },
    ],
    [inferHospitalStatus, inferVitalStatus]
  );

  return (
    <div className="dash-animate dash-animate-delay-1">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 text-[24px] font-semibold tracking-[-0.4px] text-[#0f172a]">
            Pacientes antigos
          </h1>
          <p className="mb-0 mt-1 text-[13px] text-[#6b7280]">
            {pastVisits.length} {pastVisits.length === 1 ? "visita" : "visitas"} - historico clinico completo
          </p>
        </div>
        <button
          type="button"
          onClick={loadPastVisits}
          disabled={loadingPastVisits}
          className="inline-flex min-h-10 items-center justify-center rounded-[9px] border border-[#0f6e54] bg-[#0f6e54] px-4 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingPastVisits ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={pastVisits}
        minWidth={1100}
        emptyMessage={loadingPastVisits ? "A carregar historico..." : "Nenhum historico encontrado"}
        onRowClick={openPastVisitModal}
      />
    </div>
  );
}

export default function NursePatients() {
  return <NursePage forcedView="patients" />;
}
