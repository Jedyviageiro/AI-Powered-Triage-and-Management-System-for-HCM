import {
  inferHospitalStatus,
  inferVitalStatus,
  statusLabelForVisit,
} from "../nurse-helpers/nurseHelpers";

// Mini bar chart component for dashboard
export function MiniBarChart({ data, color = "#165034", height = 60 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: `${height}px` }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : `${color}55`,
            borderRadius: "4px 4px 0 0",
            height: `${(v / max) * 100}%`,
            minHeight: "4px",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// Donut chart SVG
export function DonutChart({ segments, size = 120, stroke = 22 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const arcs = segments.reduce((acc, seg) => {
    const dash = (seg.value / total) * circ;
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    acc.push({ seg, dash, offset: prevOffset, nextOffset: prevOffset + dash + 2 });
    return acc;
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      {arcs.map(({ seg, dash, offset }, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function InfoTile({ label, value, accent }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "10px",
        background: "#f8f8fa",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".07em",
          color: "#8e8e93",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: accent || "#1c1c1e",
          lineHeight: 1.4,
        }}
      >
        {value || "Não informado"}
      </div>
    </div>
  );
}

function VitalTile({ label, value, unit, accent }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "10px",
        background: "#f8f8fa",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          color: "#8e8e93",
          fontWeight: 700,
          marginBottom: "2px",
          textTransform: "uppercase",
          letterSpacing: ".07em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: accent || "#1c1c1e",
          lineHeight: 1.2,
        }}
      >
        {value ?? "—"}
      </div>
      {unit && (
        <div style={{ fontSize: "10px", color: "#8e8e93", marginTop: "1px" }}>{unit}</div>
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "#8e8e93",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        style={{
          height: "2px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, rgba(22,80,52,.24), rgba(134,214,163,.38), rgba(229,231,235,0))",
        }}
      />
    </div>
  );
}

function AbstractSectionLine() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "10px",
        display: "grid",
        gridTemplateColumns: "42px 1fr 18px",
        alignItems: "center",
        gap: "8px",
        margin: "2px 0",
      }}
    >
      <span style={{ height: "2px", borderRadius: "999px", background: "#165034" }} />
      <span
        style={{
          height: "1px",
          background: "linear-gradient(90deg, rgba(22,80,52,.18), rgba(226,232,240,.35))",
        }}
      />
      <span style={{ height: "2px", borderRadius: "999px", background: "#86d6a3" }} />
    </div>
  );
}

function SoftCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "0.5px solid rgba(0,0,0,.06)",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

function ProfilePage({
  modal,
  profileDob,
  profileAge,
  profileGuardian,
  profilePhone,
  profileAddress,
  doctors,
  visit,
  setPastVisitModal,
  onSave,
}) {
  const isEditing = modal.editingPatient && !modal.patientLoading;

  const vitalAccent = (val, high, low) => {
    if (val == null) return undefined;
    if (val > high || val < low) return "#c05c00";
    return undefined;
  };

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {modal.detailLoading && !modal.patientProfile ? (
        <SoftCard style={{ color: "#6b7280" }}>Carregando perfil do paciente...</SoftCard>
      ) : (
        <>
          {/* Row 1: Patient profile + Visit info */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "12px" }}>
            {/* Patient profile */}
            <SoftCard>
              <SectionLabel>Perfil do paciente</SectionLabel>
              {isEditing ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <input
                    className="triage-input"
                    value={modal.patientForm.full_name}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, full_name: e.target.value },
                      }))
                    }
                    placeholder="Nome completo"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.clinical_code}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, clinical_code: e.target.value },
                      }))
                    }
                    placeholder="Código clínico"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <select
                      className="triage-input"
                      value={modal.patientForm.sex}
                      onChange={(e) =>
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: { ...prev.patientForm, sex: e.target.value },
                        }))
                      }
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                    <input
                      type="date"
                      className="triage-input"
                      value={modal.patientForm.birth_date}
                      onChange={(e) =>
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: { ...prev.patientForm, birth_date: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <input
                    className="triage-input"
                    value={modal.patientForm.guardian_name}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, guardian_name: e.target.value },
                      }))
                    }
                    placeholder="Nome do acompanhante"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.guardian_phone}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, guardian_phone: e.target.value },
                      }))
                    }
                    placeholder="Telefone do acompanhante"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.alt_phone}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, alt_phone: e.target.value },
                      }))
                    }
                    placeholder="Contacto alternativo"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.address}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, address: e.target.value },
                      }))
                    }
                    placeholder="Morada"
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile
                      label="Data de nascimento"
                      value={
                        profileDob
                          ? new Date(`${profileDob}T00:00:00`).toLocaleDateString("pt-PT")
                          : null
                      }
                    />
                    <InfoTile
                      label="Idade"
                      value={profileAge != null ? `${profileAge} ano${profileAge === 1 ? "" : "s"}` : null}
                    />
                  </div>
                  <InfoTile label="Acompanhante" value={profileGuardian} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile label="Telefone" value={profilePhone} />
                    <InfoTile label="Contacto alt." value={modal.patientProfile?.alt_phone} />
                  </div>
                  <InfoTile label="Morada" value={profileAddress} />
                  <InfoTile label="Email" value={modal.patientProfile?.email} />
                </div>
              )}
            </SoftCard>

            {/* Right column: Visit info + Vitals */}
            <div style={{ display: "grid", gap: "12px", alignContent: "start" }}>
              <SoftCard>
                <SectionLabel>Consulta selecionada</SectionLabel>
                <div style={{ display: "grid", gap: "8px" }}>
                  <InfoTile
                    label="Médico"
                    value={
                      (visit.doctor_full_name || visit.doctor_username || "—") +
                      (visit.doctor_specialization ? ` (${visit.doctor_specialization})` : "")
                    }
                  />
                  <InfoTile
                    label="Data"
                    value={
                      visit.consultation_ended_at || visit.arrival_time
                        ? new Date(
                            visit.consultation_ended_at || visit.arrival_time
                          ).toLocaleString("pt-PT")
                        : "—"
                    }
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile label="Estado hospitalar" value={inferHospitalStatus(visit)} />
                    <InfoTile label="Estado vital" value={inferVitalStatus(visit)} />
                  </div>
                </div>
              </SoftCard>

              {/* Vitals grid */}
              {(visit.temperature != null ||
                visit.heart_rate != null ||
                visit.respiratory_rate != null ||
                visit.oxygen_saturation != null ||
                visit.weight != null ||
                visit.height != null ||
                visit.blood_pressure_systolic != null) && (
                <SoftCard>
                  <SectionLabel>Sinais vitais</SectionLabel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {visit.blood_pressure_systolic != null && (
                      <VitalTile
                        label="PA"
                        value={`${visit.blood_pressure_systolic}/${visit.blood_pressure_diastolic}`}
                        unit="mmHg"
                        accent={
                          visit.blood_pressure_systolic > 140 || visit.blood_pressure_systolic < 90
                            ? "#c05c00"
                            : undefined
                        }
                      />
                    )}
                    {visit.heart_rate != null && (
                      <VitalTile
                        label="FC"
                        value={visit.heart_rate}
                        unit="bpm"
                        accent={vitalAccent(visit.heart_rate, 100, 60)}
                      />
                    )}
                    {visit.temperature != null && (
                      <VitalTile
                        label="Temp"
                        value={visit.temperature}
                        unit="°C"
                        accent={visit.temperature > 37.5 ? "#c05c00" : undefined}
                      />
                    )}
                    {visit.oxygen_saturation != null && (
                      <VitalTile
                        label="SpO2"
                        value={`${visit.oxygen_saturation}%`}
                        unit="oxig."
                        accent={visit.oxygen_saturation < 95 ? "#c05c00" : undefined}
                      />
                    )}
                    {visit.respiratory_rate != null && (
                      <VitalTile
                        label="FR"
                        value={visit.respiratory_rate}
                        unit="rpm"
                        accent={vitalAccent(visit.respiratory_rate, 20, 12)}
                      />
                    )}
                    {visit.weight != null && (
                      <VitalTile label="Peso" value={visit.weight} unit="kg" />
                    )}
                    {visit.height != null && (
                      <VitalTile label="Altura" value={visit.height} unit="cm" />
                    )}
                  </div>
                </SoftCard>
              )}
            </div>
          </div>

          <AbstractSectionLine />

          {/* Row 2: Clinical summary */}
          <SoftCard>
            <SectionLabel>Resumo clínico</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
              }}
            >
              {[
                ["Queixa principal", visit.chief_complaint || visit.triage_chief_complaint],
                ["Diagnóstico", visit.likely_diagnosis],
                ["Justificativa clínica", visit.clinical_reasoning],
                ["Prescrição", visit.prescription_text],
              ].map(([label, value]) => (
                <div
                  key={label}
                  style={{ padding: "10px 12px", borderRadius: "10px", background: "#f8f8fa" }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      color: "#8e8e93",
                      marginBottom: "6px",
                    }}
                  >
                    {label}
                  </div>
                  {isEditing ? (
                    <textarea
                      className="triage-input"
                      rows={3}
                      value={
                        modal.patientForm[
                          label === "Queixa principal"
                            ? "chief_complaint"
                            : label === "Diagnóstico"
                            ? "likely_diagnosis"
                            : label === "Justificativa clínica"
                            ? "clinical_reasoning"
                            : "prescription_text"
                        ]
                      }
                      onChange={(e) => {
                        const fieldMap = {
                          "Queixa principal": "chief_complaint",
                          "Diagnóstico": "likely_diagnosis",
                          "Justificativa clínica": "clinical_reasoning",
                          "Prescrição": "prescription_text",
                        };
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: {
                            ...prev.patientForm,
                            [fieldMap[label]]: e.target.value,
                          },
                        }));
                      }}
                      style={{ resize: "none", background: "#fff" }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#1c1c1e",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {value || "—"}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isEditing && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <select
                  className="triage-input"
                  value={modal.patientForm.doctor_id}
                  onChange={(e) =>
                    setPastVisitModal((prev) => ({
                      ...prev,
                      patientForm: { ...prev.patientForm, doctor_id: e.target.value },
                    }))
                  }
                >
                  <option value="">Sem médico</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {(d.full_name || d.username || `Médico #${d.id}`) +
                        (d.specialization ? ` (${d.specialization})` : "")}
                    </option>
                  ))}
                </select>
                <select
                  className="triage-input"
                  value={modal.patientForm.hospital_status}
                  onChange={(e) =>
                    setPastVisitModal((prev) => ({
                      ...prev,
                      patientForm: { ...prev.patientForm, hospital_status: e.target.value },
                    }))
                  }
                >
                  <option value="">Sem registo</option>
                  <option value="DISCHARGED">Alta</option>
                  <option value="IN_HOSPITAL">Internado</option>
                  <option value="BED_REST">Repouso / Acamado</option>
                  <option value="TRANSFERRED">Transferido</option>
                  <option value="DECEASED">Óbito</option>
                </select>
              </div>
            )}
          </SoftCard>

          {isEditing && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: "auto", padding: "10px 16px", borderRadius: "999px" }}
                onClick={() => setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "auto", padding: "10px 16px", borderRadius: "999px" }}
                disabled={modal.patientSaving}
                onClick={onSave}
              >
                {modal.patientSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── History page ─────────────────────────────────────────────────────────────

function HistoryPage({ modal, timeline }) {
  const softCardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    border: "0.5px solid rgba(0,0,0,.06)",
    padding: "14px",
  };

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {/* Visit count header */}
      {timeline.length > 0 && (
        <div
          style={{
            ...softCardStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SectionLabel style={{ margin: 0 }}>Histórico de visitas</SectionLabel>
          <span style={{ fontSize: "12px", color: "#8e8e93" }}>
            {timeline.length} visita{timeline.length !== 1 ? "s" : ""} anterior
            {timeline.length !== 1 ? "es" : ""}
          </span>
        </div>
      )}

      {modal.detailLoading && timeline.length === 0 ? (
        <div style={{ ...softCardStyle, color: "#6b7280" }}>Carregando histórico clínico...</div>
      ) : timeline.length === 0 ? (
        <div
          style={{
            ...softCardStyle,
            padding: "22px",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          Sem histórico adicional para este paciente.
        </div>
      ) : (
        /* Timeline */
        <div style={{ position: "relative", paddingLeft: "20px" }}>
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              left: "7px",
              top: "14px",
              bottom: "14px",
              width: "1px",
              background: "rgba(0,0,0,.1)",
            }}
          />

          <div style={{ display: "grid", gap: "10px" }}>
            {timeline.map((row, idx) => {
              const vitals = [
                row?.temperature != null ? `Temp ${row.temperature}°C` : null,
                row?.heart_rate != null ? `FC ${row.heart_rate} bpm` : null,
                row?.respiratory_rate != null ? `FR ${row.respiratory_rate} rpm` : null,
                row?.oxygen_saturation != null ? `SpO2 ${row.oxygen_saturation}%` : null,
                row?.weight != null ? `Peso ${row.weight} kg` : null,
              ].filter(Boolean);

              const isRecent = idx === 0;

              return (
                <div
                  key={row.visit_id || row.id}
                  style={{
                    ...softCardStyle,
                    position: "relative",
                    opacity: idx > 2 ? 0.65 : 1,
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-17px",
                      top: "18px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: isRecent ? "#165034" : "rgba(0,0,0,.2)",
                      border: "2px solid #fbfbfc",
                    }}
                  />

                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1c1c1e",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {row?.chief_complaint ||
                          row?.return_visit_reason ||
                          (row?.lab_requested
                            ? row?.lab_exam_type || "Retorno laboratorial"
                            : "Sem motivo registado")}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "2px" }}>
                        {row?.arrival_time
                          ? new Date(row.arrival_time).toLocaleString("pt-PT")
                          : "—"}{" "}
                        · Visita #{row.visit_id || row.id}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#f4f4f5",
                        color: "#636366",
                        fontSize: "10px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {statusLabelForVisit(row)}
                    </span>
                  </div>

                  {/* Doctor + Diagnosis */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: vitals.length > 0 ? "8px" : "0",
                    }}
                  >
                    <InfoTile
                      label="Médico"
                      value={
                        (row?.doctor_full_name || row?.doctor_username || "Não registado") +
                        (row?.doctor_specialization ? ` (${row.doctor_specialization})` : "")
                      }
                    />
                    <InfoTile
                      label="Diagnóstico"
                      value={row?.likely_diagnosis || "Não registado"}
                    />
                  </div>

                  {/* Vitals */}
                  {vitals.length > 0 && (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        background: "#f8f8fa",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          color: "#8e8e93",
                          marginBottom: "6px",
                        }}
                      >
                        Sinais vitais
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {vitals.map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "#ffffff",
                              border: "1px solid rgba(0,0,0,.05)",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#4b5563",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical notes + Prescription */}
                  {(row?.clinical_notes || row?.clinical_reasoning || row?.prescription_text) && (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {(row?.clinical_notes || row?.clinical_reasoning) && (
                        <InfoTile
                          label="Resumo clínico"
                          value={row?.clinical_notes || row?.clinical_reasoning}
                        />
                      )}
                      {row?.prescription_text && (
                        <InfoTile label="Prescrição" value={row.prescription_text} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function PastVisitHistoryModal({
  modal,
  profileName,
  profileCode,
  profileDob,
  profileAge,
  profileGuardian,
  profilePhone,
  profileAddress,
  profilePhoto,
  timeline,
  doctors,
  pdfLoadingId,
  setPastVisitModal,
  onStartEdit,
  onSave,
  onClose,
  onDownloadPdf,
}) {
  if (!modal?.open || !modal?.visit) return null;
  const visit = modal.visit;

  const isDeceased = inferVitalStatus(visit) === "Óbito";

  const initials = String(profileName || "P")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="popup-overlay">
      <div
        className="popup-card"
        style={{
          maxWidth: "960px",
          width: "95%",
          height: "min(88vh, 760px)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: "24px",
          border: "0.5px solid rgba(0,0,0,.08)",
          background: "#ffffff",
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "#d1d5db",
            margin: "10px auto 0",
            flexShrink: 0,
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 20px 0",
            borderBottom: "0.5px solid rgba(0,0,0,.08)",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "14px",
            }}
          >
            {/* Avatar + identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profileName}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,.06)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #eef5f0, #dbe9e0)",
                    color: "#165034",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              )}

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "#1c1c1e",
                    letterSpacing: "-0.3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {profileName}
                </div>
                <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "2px" }}>
                  {profileCode} · Consulta #{visit.id}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {/* Hospital status badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: "#f4f4f5",
                      color: "#636366",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {inferHospitalStatus(visit)}
                  </span>
                  {/* Vital status badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: isDeceased ? "#fff1f1" : "#eef8f1",
                      color: isDeceased ? "#7f1d1d" : "#1a7a3c",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {inferVitalStatus(visit)}
                  </span>
                  {/* Surgery required badge — example of contextual flag */}
                  {visit.surgery_required && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "#fff8e6",
                        color: "#854F0B",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      Cirurgia Requerida
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={
                  modal.editingPatient
                    ? () => setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))
                    : onStartEdit
                }
                className="btn-secondary"
                style={{
                  width: "auto",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "#f6f6f7",
                  borderColor: "rgba(0,0,0,.08)",
                  fontSize: "12px",
                }}
              >
                {modal.editingPatient ? "Cancelar edição" : "Editar perfil"}
              </button>
              <button
                type="button"
                disabled={pdfLoadingId === visit.id}
                onClick={() => onDownloadPdf(visit)}
                className="btn-primary"
                style={{
                  width: "auto",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                }}
              >
                {pdfLoadingId === visit.id ? "Gerando..." : "Baixar PDF"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{
                  width: "auto",
                  padding: "8px 12px",
                  borderRadius: "999px",
                  fontSize: "14px",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div
            style={{
              display: "inline-flex",
              padding: "4px",
              background: "#f5f5f7",
              borderRadius: "14px",
              gap: "4px",
            }}
          >
            {["profile", "history"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPastVisitModal((prev) => ({ ...prev, page: tab }))}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: modal.page === tab ? "#ffffff" : "transparent",
                  color: modal.page === tab ? "#1c1c1e" : "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "background 0.18s ease, color 0.18s ease",
                }}
              >
                {tab === "profile" ? "Perfil" : "Histórico clínico"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sliding content ── */}
        <div style={{ overflow: "hidden", flex: 1, minHeight: 0, background: "#fbfbfc" }}>
          <div
            style={{
              display: "flex",
              width: "200%",
              height: "100%",
              minHeight: 0,
              transform: modal.page === "profile" ? "translateX(0%)" : "translateX(-50%)",
              transition: "transform 0.28s ease",
            }}
          >
            {/* Profile pane */}
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                height: "100%",
                minHeight: 0,
                padding: "16px",
                overflowY: "auto",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              <ProfilePage
                modal={modal}
                profileDob={profileDob}
                profileAge={profileAge}
                profileGuardian={profileGuardian}
                profilePhone={profilePhone}
                profileAddress={profileAddress}
                doctors={doctors}
                visit={visit}
                setPastVisitModal={setPastVisitModal}
                onSave={onSave}
              />
            </div>

            {/* History pane */}
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                height: "100%",
                minHeight: 0,
                padding: "16px",
                overflowY: "auto",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              <HistoryPage modal={modal} timeline={timeline} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
