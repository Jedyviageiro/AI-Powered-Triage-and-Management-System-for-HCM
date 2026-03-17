export default function DoctorConsultationOverviewStep({
  patientDetails,
  selectedVisit,
  calculateAgeYears,
  formatStatus,
  getVisitReasonLabel,
  triage,
  previousConsultation,
  formatLabDateTimeLabel,
  followUpComparisonRows,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="cf-grid-4">
        {[
          {
            label: "Paciente",
            value: patientDetails?.full_name || selectedVisit?.full_name || "-",
          },
          {
            label: "Código clínico",
            value: patientDetails?.clinical_code || selectedVisit?.clinical_code || "-",
            mono: true,
          },
          {
            label: "Idade",
            value:
              calculateAgeYears(patientDetails?.birth_date) != null
                ? `${calculateAgeYears(patientDetails.birth_date)} anos`
                : "-",
          },
          { label: "Estado", value: formatStatus(selectedVisit?.status) },
          { label: "Motivo da presença", value: getVisitReasonLabel(selectedVisit) },
        ].map(({ label, value, mono }) => (
          <div key={label} className="cf-card-sm">
            <p className="cf-label">{label}</p>
            <p
              style={{
                fontSize: 13,
                fontWeight: mono ? 500 : 600,
                color: "#111827",
                fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : "inherit",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="cf-card">
        <p className="cf-label">Sinais Vitais da Triagem</p>
        {!triage ? (
          <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
            Triagem ainda não registada.
          </p>
        ) : (
          <>
            <div className="cf-grid-5" style={{ marginBottom: 14 }}>
              {[
                {
                  label: "Temperatura",
                  value: triage.temperature,
                  unit: "°C",
                  warn: triage.temperature > 37.5,
                },
                {
                  label: "SpO2",
                  value: triage.oxygen_saturation,
                  unit: "%",
                  warn: triage.oxygen_saturation < 94,
                },
                {
                  label: "Freq. Cardíaca",
                  value: triage.heart_rate,
                  unit: "bpm",
                  warn: triage.heart_rate > 100 || triage.heart_rate < 60,
                },
                {
                  label: "Freq. Resp.",
                  value: triage.respiratory_rate,
                  unit: "rpm",
                  warn: triage.respiratory_rate > 20,
                },
                { label: "Peso", value: triage.weight, unit: "kg" },
              ].map(({ label, value, unit, warn }) => (
                <div
                  key={label}
                  style={{
                    background: warn && value != null ? "#fffbf0" : "#f5f8f6",
                    border: `1px solid ${warn && value != null ? "#fcd34d" : "#e3ebe6"}`,
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#8a9a93",
                      marginBottom: 5,
                    }}
                  >
                    {label}
                  </p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                    {value ?? "-"}
                    {value != null && (
                      <span
                        style={{ fontSize: 11, fontWeight: 400, color: "#9ca3af", marginLeft: 3 }}
                      >
                        {unit}
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#f8faf9",
                borderLeft: "3px solid #0c3a24",
                borderRadius: "0 8px 8px 0",
                padding: "10px 14px",
              }}
            >
              <p className="cf-label" style={{ marginBottom: 4 }}>
                Queixa principal
              </p>
              <p style={{ fontSize: 13, color: "#374151", margin: 0 }}>
                {triage.chief_complaint || "Não registada"}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="cf-card">
        <p className="cf-label">Consulta anterior</p>
        {!previousConsultation ? (
          <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
            Sem consulta anterior registada.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="cf-grid-4">
              {[
                {
                  label: "Data",
                  value: formatLabDateTimeLabel(previousConsultation?.arrival_time),
                },
                { label: "Motivo", value: getVisitReasonLabel(previousConsultation) },
                { label: "Diagnóstico", value: previousConsultation?.likely_diagnosis || "-" },
                {
                  label: "Médico",
                  value:
                    previousConsultation?.doctor_full_name ||
                    previousConsultation?.doctor_name ||
                    "-",
                },
              ].map(({ label, value }) => (
                <div key={label} className="cf-card-sm">
                  <p className="cf-label">{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{value}</p>
                </div>
              ))}
            </div>
            <div
              style={{
                background: "#f8faf9",
                border: "1px solid #e3ebe6",
                borderRadius: 12,
                padding: "12px 14px",
              }}
            >
              <p className="cf-label" style={{ marginBottom: 4 }}>
                Resumo clínico anterior
              </p>
              <p style={{ fontSize: 13, color: "#374151", margin: 0, whiteSpace: "pre-wrap" }}>
                {previousConsultation?.clinical_reasoning ||
                  previousConsultation?.clinical_notes ||
                  previousConsultation?.prescription_text ||
                  "Sem resumo clínico anterior."}
              </p>
            </div>
            {followUpComparisonRows.length > 0 && (
              <div
                style={{
                  background: "#f8faf9",
                  border: "1px solid #e3ebe6",
                  borderRadius: 12,
                  padding: "12px 14px",
                }}
              >
                <p className="cf-label" style={{ marginBottom: 8 }}>
                  Comparação automática de seguimento
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {followUpComparisonRows.map((row) => (
                    <div
                      key={row.key}
                      style={{
                        background: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 10,
                        padding: "10px 12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          color: "#8a9a93",
                        }}
                      >
                        {row.label}
                      </div>
                      <div style={{ marginTop: 6, fontSize: 12, color: "#4b5563" }}>
                        Antes: {row.previous ?? "-"} {row.previous != null ? row.unit : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#111827", fontWeight: 600 }}>
                        Agora: {row.current ?? "-"} {row.current != null ? row.unit : ""}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          color:
                            row.delta == null
                              ? "#9ca3af"
                              : row.delta > 0
                                ? "#b45309"
                                : row.delta < 0
                                  ? "#166534"
                                  : "#6b7280",
                        }}
                      >
                        {row.delta == null
                          ? "Sem delta"
                          : `Variação: ${row.delta > 0 ? "+" : ""}${row.delta} ${row.unit}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
