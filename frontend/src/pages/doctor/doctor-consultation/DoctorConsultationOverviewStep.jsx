const cardStyle = {
  background: "#fff",
  border: "1px solid #e7e9ed",
  borderRadius: 13,
  padding: "20px 22px",
};

const labelStyle = {
  fontSize: 10.5,
  fontWeight: 700,
  letterSpacing: "0.04em",
  color: "#9aa3b2",
  textTransform: "uppercase",
  marginBottom: 7,
};

const valueStyle = {
  fontSize: 14.5,
  fontWeight: 700,
  color: "#161a23",
};

const parsePreviousQuestionnaire = (visit) => {
  const raw = String(visit?.clinical_reasoning || visit?.clinical_notes || "").trim();
  const marker = "Question";
  const start = raw.toLowerCase().indexOf(marker.toLowerCase());
  const source = start >= 0 ? raw.slice(start) : raw;
  const pairs = [];
  const regex = /-\s*([^\n\r?]+?\?)\s*[\r\n]+\s*Resposta:\s*([^\r\n]+)/gi;
  let match = regex.exec(source);
  while (match) {
    pairs.push({ question: match[1].trim(), answer: match[2].trim() });
    match = regex.exec(source);
  }
  return pairs;
};

const getPreviousClinicalNote = (visit) => {
  const raw = String(visit?.clinical_reasoning || visit?.clinical_notes || "").trim();
  if (!raw) return "Sem resumo clinico anterior.";
  const chunks = raw
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  return chunks.find((part) => !/question|resposta:|^-/i.test(part)) || raw;
};

const getDoctorName = (visit) =>
  String(
    visit?.doctor_full_name ||
      visit?.doctor_name ||
      visit?.doctor_username ||
      visit?.doctor?.full_name ||
      visit?.doctor?.username ||
      ""
  ).trim();

function MiniCell({ label, value, mono = false }) {
  return (
    <div style={{ border: "1px solid #e7e9ed", borderRadius: 11, padding: "14px 16px" }}>
      <div style={labelStyle}>{label}</div>
      <div style={{ ...valueStyle, fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : "inherit" }}>
        {value}
      </div>
    </div>
  );
}

function VitalCell({ label, value, unit, warn }) {
  const hasWarn = Boolean(warn && value != null);
  return (
    <div
      style={{
        border: `1px solid ${hasWarn ? "#f3ddb2" : "#e7e9ed"}`,
        borderRadius: 11,
        padding: "13px 14px",
        background: hasWarn ? "#fdf3e3" : "#f6f7f9",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
        {hasWarn && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.3 3.86 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        )}
        <span style={{ ...labelStyle, marginBottom: 0, color: hasWarn ? "#b45309" : "#9aa3b2" }}>{label}</span>
      </div>
      <div>
        <span style={{ fontSize: 18, fontWeight: 800, color: "#161a23" }}>{value ?? "-"}</span>
        {value != null && <span style={{ fontSize: 11.5, color: "#9aa3b2", marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  );
}

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
  const age =
    calculateAgeYears(patientDetails?.birth_date) != null
      ? `${calculateAgeYears(patientDetails.birth_date)} anos`
      : "-";
  const previousQuestionnaire = parsePreviousQuestionnaire(previousConsultation);
  const previousClinicalNote = getPreviousClinicalNote(previousConsultation);
  const previousDoctorName = getDoctorName(previousConsultation);
  const previousDiagnosis = String(
    previousConsultation?.likely_diagnosis || selectedVisit?.parent_likely_diagnosis || ""
  ).trim();
  const previousPrescription = String(
    previousConsultation?.prescription_text || selectedVisit?.parent_prescription_text || ""
  ).trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section style={cardStyle}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14 }}>
          <MiniCell label="Paciente" value={patientDetails?.full_name || selectedVisit?.full_name || "-"} />
          <MiniCell label="Codigo clinico" value={patientDetails?.clinical_code || selectedVisit?.clinical_code || "-"} mono />
          <MiniCell label="Idade" value={age} />
          <MiniCell label="Estado" value={formatStatus(selectedVisit?.status)} />
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #eef0f3" }}>
          <div style={labelStyle}>Motivo da presenca</div>
          <div style={{ fontSize: 13.5, color: "#2b3140", lineHeight: 1.6 }}>
            {getVisitReasonLabel(selectedVisit) || "Sem motivo registado"}
          </div>
        </div>
      </section>

      <section style={cardStyle}>
        <div style={{ ...labelStyle, fontSize: 11, marginBottom: 14 }}>Sinais vitais da triagem</div>
        {!triage ? (
          <p style={{ fontSize: 13, color: "#9aa3b2", fontStyle: "italic" }}>Triagem ainda nao registada.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12, marginBottom: 16 }}>
              <VitalCell label="Temperatura" value={triage.temperature} unit="C" warn={triage.temperature > 37.5} />
              <VitalCell label="SpO2" value={triage.oxygen_saturation} unit="%" warn={triage.oxygen_saturation < 94} />
              <VitalCell label="Freq. Cardiaca" value={triage.heart_rate} unit="bpm" warn={triage.heart_rate > 100 || triage.heart_rate < 60} />
              <VitalCell label="Freq. Resp." value={triage.respiratory_rate} unit="rpm" warn={triage.respiratory_rate > 20} />
              <VitalCell label="Peso" value={triage.weight} unit="kg" />
            </div>
            <div style={{ display: "flex", background: "#f6f7f9", borderRadius: 10, overflow: "hidden" }}>
              <div style={{ width: 4, background: "#0f6e54", flexShrink: 0 }} />
              <div style={{ padding: "13px 16px" }}>
                <div style={{ ...labelStyle, marginBottom: 5 }}>Queixa principal</div>
                <div style={{ fontSize: 13.5, color: "#161a23", fontWeight: 600 }}>
                  {triage.chief_complaint || "Nao registada"}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <section style={cardStyle}>
        <div style={{ ...labelStyle, fontSize: 11, marginBottom: 14 }}>Consulta anterior</div>
        {!previousConsultation ? (
          <p style={{ fontSize: 13, color: "#9aa3b2", fontStyle: "italic" }}>Sem consulta anterior registada.</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 14, marginBottom: 18 }}>
              <MiniCell label="Data" value={formatLabDateTimeLabel(previousConsultation?.arrival_time)} />
              <MiniCell label="Motivo" value={getVisitReasonLabel(previousConsultation)} />
              <MiniCell label="Diagnostico anterior" value={previousDiagnosis || "-"} />
              <MiniCell label="Medico" value={previousDoctorName || "-"} />
            </div>
            <div style={{ border: "1px solid #e7e9ed", borderRadius: 11, padding: "14px 16px", marginBottom: 18 }}>
              <div style={labelStyle}>Prescricao anterior</div>
              <div style={{ fontSize: 13.2, color: "#2b3140", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {previousPrescription || "Sem prescricao anterior registada."}
              </div>
            </div>
            {previousQuestionnaire.length > 0 && (
              <>
                <div style={{ ...labelStyle, paddingTop: 18, paddingBottom: 14, borderTop: "1px solid #eef0f3", marginBottom: 0 }}>
                  Resumo clinico anterior - questionario
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 13, marginBottom: 16 }}>
                  {previousQuestionnaire.map((item) => (
                    <div key={item.question} style={{ fontSize: 13 }}>
                      <div style={{ color: "#6c7689", lineHeight: 1.5, marginBottom: 3 }}>
                        {item.question}
                      </div>
                      <div style={{ color: "#161a23", fontWeight: 700 }}>{item.answer}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fdf3e3", border: "1px solid #f3ddb2", borderRadius: 10, padding: "13px 14px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.3 3.86 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.86a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <div style={{ fontSize: 12.8, color: "#7c4a14", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {previousClinicalNote}
              </div>
            </div>
          </>
        )}
      </section>

      {followUpComparisonRows.length > 0 && (
        <section style={cardStyle}>
          <div style={{ ...labelStyle, fontSize: 11, marginBottom: 14 }}>Comparacao automatica de seguimento</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
            {followUpComparisonRows.map((row) => {
              const delta = row.delta == null ? null : Number(row.delta);
              const improving = delta != null && delta < 0;
              return (
                <div key={row.key} style={{ border: "1px solid #e7e9ed", borderRadius: 11, padding: "14px 15px" }}>
                  <div style={{ ...labelStyle, marginBottom: 10 }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: "#9aa3b2", marginBottom: 4 }}>
                    Antes: <b style={{ color: "#2b3140" }}>{row.previous ?? "-"} {row.previous != null ? row.unit : ""}</b>
                  </div>
                  <div style={{ fontSize: 13, color: "#2b3140", marginBottom: 9 }}>
                    Agora: <b style={{ color: "#161a23" }}>{row.current ?? "-"} {row.current != null ? row.unit : ""}</b>
                  </div>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "3px 9px",
                      borderRadius: 7,
                      background: improving ? "#eaf6f0" : "#eef0f3",
                      color: improving ? "#0c5a44" : "#6c7689",
                    }}
                  >
                    {delta == null ? "Sem delta" : `${delta > 0 ? "+" : ""}${delta} ${row.unit}`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
