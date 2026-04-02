import NursePage from "../NursePage";
import { DoctorAvatar } from "../nurse-helpers/nurseHelpers";

export function NurseDoctorsView({
  doctors,
  loadDoctors,
  loadingDoctors,
  availableDoctors,
  busyDoctors,
  patientByVisitId,
}) {
  return (
    <div className="dash-animate dash-animate-delay-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Disponibilidade de Médicos</h1>
          <p className="text-sm text-gray-500">{doctors.length} médico(s) registados</p>
        </div>
        <button
          onClick={() => loadDoctors()}
          disabled={loadingDoctors}
          className="btn-primary"
          style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}
        >
          {loadingDoctors ? "Atualizando..." : "Atualizar"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-5">
        {loadingDoctors && doctors.length === 0
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={`doc-skeleton-${i}`}
                className="form-card"
                style={{ display: "grid", gap: "10px" }}
              >
                <div className="skeleton-line" style={{ height: "18px", width: "55%" }} />
                <div className="skeleton-line" style={{ height: "14px", width: "100%" }} />
                <div className="skeleton-line" style={{ height: "14px", width: "92%" }} />
                <div className="skeleton-line" style={{ height: "14px", width: "88%" }} />
              </div>
            ))
          : [
              { title: "Disponíveis", list: availableDoctors, color: "#165034", bg: "#edf5f0" },
              { title: "Ocupados", list: busyDoctors, color: "#ef4444", bg: "#fef2f2" },
            ].map(({ title, list, color, bg }) => (
              <div key={title} className="form-card">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: color,
                    }}
                  />
                  <h2 style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                    {title} ({list.length})
                  </h2>
                </div>
                {list.length === 0 ? (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#9ca3af",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    Nenhum médico {title.toLowerCase()}
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {list.map((d) => {
                      const activeVisit = d.current_visit_id
                        ? patientByVisitId.get(Number(d.current_visit_id))
                        : null;
                      return (
                        <div
                          key={d.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            background: bg,
                            borderRadius: "10px",
                            border: `1px solid ${color}20`,
                          }}
                        >
                          <DoctorAvatar
                            doctor={d}
                            size={34}
                            gradient={`linear-gradient(135deg, ${color}, ${color}aa)`}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                              {d.full_name || d.username || `Médico #${d.id}`}
                            </div>
                            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>
                              {d.specialization || "Clínica Geral"}
                            </div>
                            {d.current_visit_id && (
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                Consulta #{d.current_visit_id}
                                {activeVisit
                                  ? ` · Paciente: ${activeVisit.full_name} (${activeVisit.clinical_code})`
                                  : ""}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              background: color,
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
      </div>
    </div>
  );
}

export default function NurseDoctors() {
  return <NursePage forcedView="doctors" />;
}
