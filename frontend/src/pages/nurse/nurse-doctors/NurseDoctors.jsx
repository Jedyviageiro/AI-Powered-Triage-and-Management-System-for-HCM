import { useMemo, useState } from "react";
import { CalendarClock, RefreshCw, Search, UserRound } from "lucide-react";
import NursePage from "../NursePage";
import { DoctorAvatar } from "../nurse-helpers/nurseHelpers";

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "available", label: "Disponiveis" },
  { key: "busy", label: "Ocupados" },
  { key: "offline", label: "Indisponiveis" },
];

function getDoctorStatus(doctor) {
  if (doctor?.is_available === false && !doctor?.current_visit_id && !doctor?.is_busy) {
    return {
      key: "offline",
      label: "Indisponivel",
      color: "#b45309",
      bg: "#fff7ed",
      dot: "#f59e0b",
    };
  }

  if (doctor?.is_busy || doctor?.current_visit_id) {
    return {
      key: "busy",
      label: "Em consulta",
      color: "#be123c",
      bg: "#fff1f2",
      dot: "#ef4444",
    };
  }

  return {
    key: "available",
    label: "Disponivel",
    color: "#15803d",
    bg: "#eaf8ef",
    dot: "#22c55e",
  };
}

function getDoctorName(doctor) {
  return doctor?.full_name || doctor?.username || `Medico #${doctor?.id || "-"}`;
}

function DoctorCard({ doctor, patientByVisitId }) {
  const status = getDoctorStatus(doctor);
  const activeVisit = doctor.current_visit_id
    ? patientByVisitId?.get(Number(doctor.current_visit_id))
    : null;
  const patientName = activeVisit?.full_name || "";
  const code = activeVisit?.clinical_code || "";

  return (
    <article
      style={{
        background: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        borderRadius: 18,
        padding: 12,
        display: "grid",
        gridTemplateColumns: "86px minmax(0, 1fr)",
        gap: 12,
        minHeight: 122,
        boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
      }}
    >
      <div
        style={{
          minHeight: 96,
          borderRadius: 14,
          background: "linear-gradient(180deg, #f7faf8 0%, #edf5f0 100%)",
          border: "1px solid #e4ece7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <DoctorAvatar doctor={doctor} size={62} gradient="linear-gradient(135deg, #0c3a24, #2d6f4e)" />
      </div>

      <div style={{ minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: "#1f2f28",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {getDoctorName(doctor)}
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 600, color: "#66766d" }}>
                {doctor.specialization || "Clinica Geral"}
              </p>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "3px 8px",
                borderRadius: 999,
                background: status.bg,
                color: status.color,
                fontSize: 10,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: status.dot }} />
              {status.label}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
              color: "#66766d",
              fontSize: 11,
              fontWeight: 650,
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <CalendarClock size={13} />
              {doctor.current_visit_id ? `Consulta #${doctor.current_visit_id}` : "Sem consulta ativa"}
            </span>
            {patientName ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <UserRound size={13} />
                {patientName}
                {code ? ` (${code})` : ""}
              </span>
            ) : null}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
          <button
            type="button"
            style={{
              minHeight: 34,
              borderRadius: 999,
              border: "1px solid #e4ece7",
              background: "#ffffff",
              color: "#24352d",
              fontSize: 12,
              fontWeight: 750,
              cursor: "pointer",
            }}
          >
            Ver perfil
          </button>
          <button
            type="button"
            disabled={status.key !== "available"}
            style={{
              minHeight: 34,
              borderRadius: 999,
              border: "1px solid #d8e8de",
              background: status.key === "available" ? "#165034" : "#f3f6f4",
              color: status.key === "available" ? "#ffffff" : "#94a3b8",
              fontSize: 12,
              fontWeight: 800,
              cursor: status.key === "available" ? "pointer" : "not-allowed",
            }}
          >
            Atribuir
          </button>
        </div>
      </div>
    </article>
  );
}

export function NurseDoctorsView({
  doctors,
  loadDoctors,
  loadingDoctors,
  availableDoctors,
  busyDoctors,
  patientByVisitId,
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return doctors
      .map((doctor) => ({ doctor, status: getDoctorStatus(doctor) }))
      .filter(({ doctor, status }) => {
        if (filter !== "all" && status.key !== filter) return false;
        if (!normalizedQuery) return true;
        return [getDoctorName(doctor), doctor?.specialization, doctor?.username]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        const order = { available: 0, busy: 1, offline: 2 };
        return (
          (order[a.status.key] ?? 9) - (order[b.status.key] ?? 9) ||
          getDoctorName(a.doctor).localeCompare(getDoctorName(b.doctor))
        );
      })
      .map(({ doctor }) => doctor);
  }, [doctors, filter, query]);

  return (
    <div className="dash-animate dash-animate-delay-1">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "start",
          gap: 18,
          marginBottom: 22,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 850, color: "#1f2f28", lineHeight: 1.1 }}>
            Medicos disponiveis
          </h1>
          <p style={{ margin: "8px 0 0", color: "#66766d", fontSize: 14, fontWeight: 550 }}>
            {availableDoctors.length} disponiveis, {busyDoctors.length} ocupados, {doctors.length} no total
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: 360,
              maxWidth: "38vw",
              minHeight: 44,
              borderRadius: 999,
              background: "#ffffff",
              border: "1px solid #e4ece7",
              padding: "0 16px",
              boxShadow: "none",
            }}
          >
            <Search size={17} color="#66766d" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Pesquisar medico ou especialidade..."
              style={{
                border: 0,
                outline: "none",
                background: "transparent",
                width: "100%",
                fontSize: 13,
                color: "#24352d",
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                style={{
                  minHeight: 38,
                  borderRadius: 999,
                  border: active ? "1px solid #24352d" : "1px solid #dce7e1",
                  background: active ? "#24352d" : "#ffffff",
                  color: active ? "#ffffff" : "#66766d",
                  padding: "0 16px",
                  fontSize: 13,
                  fontWeight: 750,
                  cursor: "pointer",
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            onClick={() => loadDoctors()}
            disabled={loadingDoctors}
            style={{
              minHeight: 38,
              borderRadius: 999,
              border: "1px solid #165034",
              background: "#165034",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 14px",
              fontSize: 13,
              fontWeight: 750,
              cursor: loadingDoctors ? "not-allowed" : "pointer",
              opacity: loadingDoctors ? 0.65 : 1,
            }}
          >
            <RefreshCw size={15} />
            {loadingDoctors ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      {loadingDoctors && doctors.length === 0 ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`doc-skeleton-${index}`} className="form-card" style={{ display: "grid", gap: 12 }}>
              <div className="skeleton-line" style={{ height: 120, width: "100%" }} />
              <div className="skeleton-line" style={{ height: 18, width: "60%" }} />
              <div className="skeleton-line" style={{ height: 14, width: "80%" }} />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="form-card" style={{ textAlign: "center", padding: 34, color: "#94a3b8", fontSize: 13 }}>
          Nenhum medico encontrado.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
          {rows.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} patientByVisitId={patientByVisitId} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NurseDoctors() {
  return <NursePage forcedView="doctors" />;
}
