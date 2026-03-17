export default function DoctorConsultationDiagnosisStep({
  isFollowUpConsultation,
  currentComplaintSummary,
  followUpGrowthSummary,
  followUpComparisonRows,
  previousDiagnosis,
  followUpDiagnosisEvolution,
  setFollowUpDiagnosisEvolution,
  ModernSelect,
  openModernSelect,
  setOpenModernSelect,
  FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS,
  planDraft,
  updatePlanField,
}) {
  const SelectComponent = ModernSelect;

  return (
    <div className="cf-card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {isFollowUpConsultation && (
        <>
          <div
            style={{
              border: "1px solid #dcebe2",
              borderRadius: 14,
              background: "#f8faf9",
              padding: "14px 16px",
              display: "grid",
              gap: 12,
            }}
          >
            <div className="cf-grid-2">
              <div>
                <label className="cf-label">Queixa atual</label>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#fff",
                    padding: "11px 13px",
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.45,
                  }}
                >
                  {currentComplaintSummary || "Sem queixa atual registada."}
                </div>
              </div>
              <div>
                <label className="cf-label">Comparação de crescimento</label>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    background: "#fff",
                    padding: "11px 13px",
                    fontSize: 13,
                    color: "#374151",
                    lineHeight: 1.45,
                  }}
                >
                  {followUpGrowthSummary}
                </div>
              </div>
            </div>
            {followUpComparisonRows.length > 0 && (
              <div>
                <label className="cf-label">Comparação dos sinais vitais</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: 10,
                  }}
                >
                  {followUpComparisonRows
                    .filter((row) => row.key !== "weight")
                    .map((row) => (
                      <div
                        key={row.key}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 12,
                          background: "#fff",
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: "#8a9a93",
                          }}
                        >
                          {row.label}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 12, color: "#4b5563" }}>
                          Antes: {row.previous ?? "-"} {row.previous != null ? row.unit : ""}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
                          Agora: {row.current ?? "-"} {row.current != null ? row.unit : ""}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
          <div className="cf-grid-2">
            <div>
              <label className="cf-label">Diagnóstico anterior</label>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#f8faf9",
                  padding: "11px 13px",
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.45,
                }}
              >
                {previousDiagnosis || "Sem diagnóstico anterior registado."}
              </div>
            </div>
            <div>
              <label className="cf-label">Evolução do diagnóstico</label>
              <SelectComponent
                selectId="follow-up-diagnosis-evolution"
                value={followUpDiagnosisEvolution}
                onChange={(e) => setFollowUpDiagnosisEvolution(e.target.value)}
                openModernSelect={openModernSelect}
                setOpenModernSelect={setOpenModernSelect}
              >
                {FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectComponent>
            </div>
          </div>
        </>
      )}
      <div>
        <label className="cf-label">
          {isFollowUpConsultation ? "Diagnóstico atual" : "Diagnóstico provável"}
        </label>
        <input
          className="cf-input"
          value={planDraft.likely_diagnosis}
          onChange={(e) => updatePlanField("likely_diagnosis", e.target.value)}
        />
      </div>
      <div>
        <label className="cf-label">
          {isFollowUpConsultation ? "Evolução clínica" : "Justificativa clínica"}
        </label>
        <textarea
          className="cf-textarea"
          style={{ minHeight: 140 }}
          value={planDraft.clinical_reasoning}
          onChange={(e) => updatePlanField("clinical_reasoning", e.target.value)}
        />
      </div>
    </div>
  );
}
