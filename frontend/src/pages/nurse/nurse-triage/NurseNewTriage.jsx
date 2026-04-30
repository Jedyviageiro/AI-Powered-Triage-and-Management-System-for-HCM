import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import NursePage from "../NursePage";
import { DoctorAvatar } from "../nurse-helpers/nurseHelpers";

const formatEtaLabel = (minutes) => {
  const safeMinutes = Math.max(0, Number(minutes) || 0);
  if (!safeMinutes) return "Atendimento pode iniciar agora";
  if (safeMinutes < 60) return `Paciente tera que esperar cerca de ${safeMinutes} minutos na fila`;
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  if (!remainingMinutes) return `Paciente tera que esperar cerca de ${hours}h na fila`;
  return `Paciente tera que esperar cerca de ${hours}h ${remainingMinutes}min na fila`;
};

/* ── Vital stepper card ───────────────────────────────────────── */
function VitalCard({ label, unit, value, onChange, icon, getBadge }) {
  const badge = getBadge ? getBadge(parseFloat(value)) : null;

  const step = (delta) => {
    const next = parseFloat((parseFloat(value || 0) + delta).toFixed(1));
    onChange(String(next));
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: "14px",
      padding: "15px",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280", letterSpacing: "0.03em" }}>{label}</div>
          <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "1px" }}>{unit}</div>
        </div>
        <div style={{
          width: "32px", height: "32px",
          borderRadius: "8px",
          background: icon.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {icon.svg}
        </div>
      </div>

      {badge && (
        <span style={{
          position: "absolute",
          top: "10px", left: "50%", transform: "translateX(-50%)",
          fontSize: "9px", fontWeight: 700,
          padding: "2px 8px",
          borderRadius: "99px",
          background: badge.bg, color: badge.color,
          whiteSpace: "nowrap",
        }}>{badge.label}</span>
      )}

      <div style={{
        display: "flex",
        alignItems: "center",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#f9fafb",
        minHeight: "40px",
      }}>
        <button
          type="button"
          onClick={() => step(-icon.delta)}
          style={{
            width: "38px", height: "40px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            outline: "none",
            fontSize: "18px",
            fontWeight: 300,
            color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >−</button>
        <input
          style={{
            flex: 1,
            minWidth: "76px",
            border: "none",
            background: "transparent",
            textAlign: "center",
            fontSize: "16px",
            fontWeight: 600,
            color: "#111827",
            outline: "none",
            boxShadow: "none",
            fontFamily: "'DM Mono', monospace",
            padding: "0",
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => step(icon.delta)}
          style={{
            width: "38px", height: "40px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            outline: "none",
            fontSize: "16px",
            fontWeight: 400,
            color: "#374151",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >+</button>
      </div>
    </div>
  );
}

/* ── Patient header bar (modern version) ──────────────────────── */
function PatientBar({ patient, visit }) {
  if (!patient) return null;
  const initials = (patient.full_name || "P").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      background: "linear-gradient(135deg, #0c3a24 0%, #165034 60%, #1a6b45 100%)",
      borderRadius: "14px",
      marginBottom: "20px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* decorative circle */}
      <div style={{
        position: "absolute", right: "-18px", top: "-18px",
        width: "80px", height: "80px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.06)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", right: "30px", bottom: "-24px",
        width: "60px", height: "60px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        pointerEvents: "none",
      }} />
      <div style={{
        width: "38px", height: "38px",
        borderRadius: "10px",
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
        fontSize: "14px",
        fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}>
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "14px", color: "#fff", letterSpacing: "0.01em" }}>
          {patient.full_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
          <span style={{
            fontSize: "10px", fontWeight: 600,
            background: "rgba(255,255,255,0.15)",
            color: "#a7f3d0",
            padding: "2px 7px",
            borderRadius: "6px",
            letterSpacing: "0.04em",
          }}>{patient.clinical_code}</span>
          {visit?.id && (
            <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.55)" }}>
              · Visita #{visit.id}
            </span>
          )}
        </div>
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: "5px",
        background: "rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "5px 9px",
        flexShrink: 0,
      }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80" }} />
        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Em triagem</span>
      </div>
    </div>
  );
}

/* ── Sign toggle row ──────────────────────────────────────────── */
function SignRow({ label, checked, onChange }) {
  return (
    <label style={{
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 12px",
      borderRadius: "10px",
      border: `1px solid ${checked ? "#fde68a" : "#f3f4f6"}`,
      background: checked ? "#fffbeb" : "#fafafa",
      cursor: "pointer",
      transition: "all 0.15s",
    }}>
      <div style={{
        width: "18px", height: "18px",
        borderRadius: "5px",
        border: `1.5px solid ${checked ? "#165034" : "#d1d5db"}`,
        background: checked ? "#165034" : "#fff",
        flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <polyline points="1 4 4 7 9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: "none" }} />
      <span style={{ fontSize: "12px", fontWeight: 500, color: "#374151" }}>{label}</span>
    </label>
  );
}

const NURSE_INTERVENTION_OPTIONS = [
  { key: "vaccinated", label: "Vacina administrada" },
  { key: "medication", label: "Medicação administrada" },
  { key: "oralHydration", label: "Hidratação oral / SRO" },
  { key: "woundCare", label: "Curativo ou cuidado local" },
  { key: "none", label: "Nenhuma intervenção antes da fila" },
];

const INTERVENTION_NOTE_PREFIX = "Intervenções de enfermagem:";

export function NurseNewTriageView({
  viewMode = "newTriage",
  triageSteps,
  getStepStatus,
  triageStep,
  setTriageStep,
  searchMode,
  setSearchMode,
  code,
  setCode,
  nameQuery,
  setNameQuery,
  searchPatient,
  searchLoading,
  searchResults,
  setPatient,
  setAiSuggestion,
  setVisit,
  setSelectedDoctorId,
  setForceTriageForLabFollowup,
  patient,
  patientAgeYears,
  latestRecordedWeight,
  patientLabFollowup,
  visit,
  forceTriageForLabFollowup,
  createVisit,
  creatingVisit,
  pClinicalCode,
  pFullName,
  setPFullName,
  pSex,
  setPSex,
  pBirthDate,
  setPBirthDate,
  pGuardianName,
  setPGuardianName,
  pGuardianPhone,
  setPGuardianPhone,
  pAltPhone,
  setPAltPhone,
  pAddress,
  setPAddress,
  createPatient,
  creatingPatient,
  resetAll,
  skipTriageReturnEligible,
  GENERAL_STATE_OPTIONS,
  generalState,
  setGeneralState,
  needsOxygen,
  setNeedsOxygen,
  suspectedSevereDehydration,
  setSuspectedSevereDehydration,
  excessiveLethargy,
  setExcessiveLethargy,
  difficultyMaintainingSitting,
  setDifficultyMaintainingSitting,
  historySyncopeCollapse,
  setHistorySyncopeCollapse,
  temperature,
  setTemperature,
  spo2,
  setSpo2,
  heartRate,
  setHeartRate,
  respRate,
  setRespRate,
  weight,
  setWeight,
  chiefComplaint,
  setChiefComplaint,
  clinicalNotes,
  setClinicalNotes,
  PRIORITIES,
  priority,
  setPriority,
  customMaxWait,
  setCustomMaxWait,
  selectedPriority,
  aiSuggestion,
  aiShortReason,
  aiLoading,
  priorityLabel,
  recommendedRoomLabel,
  bypassToER,
  hasRoomAvailable,
  assignableDoctors,
  doctorQueueEtaById,
  selectedDoctorId,
  assignDoctor,
  assigning,
  hasDoctorAvailable,
  erBypassRecommended,
  erBypassReasons,
  holdInWaitingLine,
  setHoldInWaitingLine,
  setBypassToER,
  saveTriage,
  savingTriage,
}) {
  const isQuickSearch = viewMode === "quickSearch";
  const [patientEntryMode, setPatientEntryMode] = useState("locate");
  const [triagePart, setTriagePart] = useState("vitals");
  const [nurseInterventions, setNurseInterventions] = useState({});
  const [manualOpen, setManualOpen] = useState(false);
  const [manualPage, setManualPage] = useState(0);
  const canProceedToTriage = !!patient?.id;
  const hasLegacyClinicalRiskFlags =
    needsOxygen ||
    suspectedSevereDehydration ||
    excessiveLethargy ||
    difficultyMaintainingSitting ||
    historySyncopeCollapse;

  const cancelTriageStart = () => {
    resetAll?.();
    setPatientEntryMode("locate");
    setTriagePart("vitals");
    setNurseInterventions({});
    setManualPage(0);
    setNeedsOxygen?.(false);
    setSuspectedSevereDehydration?.(false);
    setExcessiveLethargy?.(false);
    setDifficultyMaintainingSitting?.(false);
    setHistorySyncopeCollapse?.(false);
  };

  const proceedToTriage = async () => {
    if (!patient?.id) return;
    if (!visit?.id) {
      const created = await createVisit({ forceNewConsultation: !!forceTriageForLabFollowup });
      if (!created?.id) return;
    }
    setTriagePart("vitals");
    setTriageStep(2);
  };

  useEffect(() => {
    if (triageStep !== 2 || !patient?.id || latestRecordedWeight == null) return;
    if (String(weight || "").trim()) return;
    setWeight(String(latestRecordedWeight));
  }, [triageStep, patient?.id, latestRecordedWeight, weight, setWeight]);

  const toggleNurseIntervention = (key, checked) => {
    setNurseInterventions((current) => {
      if (key === "none" && checked) {
        return { none: true };
      }
      return {
        ...current,
        none: false,
        [key]: checked,
      };
    });
  };

  const proceedToQueueStep = () => {
    const selectedInterventions = NURSE_INTERVENTION_OPTIONS
      .filter((item) => nurseInterventions[item.key])
      .map((item) => item.label);
    const interventionNote = `${INTERVENTION_NOTE_PREFIX} ${
      selectedInterventions.length ? selectedInterventions.join(", ") : "não registadas"
    }.`;
    const riskNote = hasLegacyClinicalRiskFlags
      ? "\nSinais clínicos de risco previamente marcados nesta triagem."
      : "";

    setClinicalNotes((current) => {
      const cleaned = String(current || "")
        .split("\n")
        .filter((line) => !line.trim().startsWith(INTERVENTION_NOTE_PREFIX))
        .join("\n")
        .trim();
      return cleaned ? `${cleaned}\n${interventionNote}${riskNote}` : `${interventionNote}${riskNote}`;
    });
    setTriageStep(3);
  };

  const renderStartActions = (className = "") => (
    <div className={`triage-start-actions ${className}`.trim()}>
      <button type="button" className="btn-secondary" onClick={cancelTriageStart}>
        Cancelar
      </button>
      <button
        type="button"
        className="btn-primary"
        disabled={!canProceedToTriage || creatingVisit || creatingPatient}
        onClick={proceedToTriage}
      >
        {creatingVisit ? "Criando visita..." : "Proximo: Triagem"}
      </button>
    </div>
  );

  /* vital badge helpers */
  const tempBadge = (v) => {
    if (isNaN(v)) return null;
    if (v < 36) return { label: "Hipotermia", bg: "#dbeafe", color: "#1e40af" };
    if (v < 37.5) return { label: "Normal", bg: "#dcf0e7", color: "#165034" };
    if (v < 38.5) return { label: "Febre leve", bg: "#fef3c7", color: "#92400e" };
    return { label: "Febre alta", bg: "#fee2e2", color: "#991b1b" };
  };
  const spo2Badge = (v) => {
    if (isNaN(v)) return null;
    if (v >= 95) return { label: "Normal", bg: "#dcf0e7", color: "#165034" };
    if (v >= 90) return { label: "Baixa", bg: "#fef3c7", color: "#92400e" };
    return { label: "Crítica", bg: "#fee2e2", color: "#991b1b" };
  };
  const hrBadge = (v) => {
    if (isNaN(v)) return null;
    if (v < 60) return { label: "Bradicárdia", bg: "#fef3c7", color: "#92400e" };
    if (v <= 100) return { label: "Normal", bg: "#dcf0e7", color: "#165034" };
    if (v <= 150) return { label: "Taquicárdia", bg: "#fef3c7", color: "#92400e" };
    return { label: "Crítica", bg: "#fee2e2", color: "#991b1b" };
  };
  const rrBadge = (v) => {
    if (isNaN(v)) return null;
    if (v < 12) return { label: "Baixa", bg: "#fef3c7", color: "#92400e" };
    if (v <= 40) return { label: "Normal", bg: "#dcf0e7", color: "#165034" };
    return { label: "Taquipneia", bg: "#fee2e2", color: "#991b1b" };
  };

  const VITAL_CHIPS = ["Febre", "Tosse", "Dificuldade respiratória", "Dor abdominal", "Vómitos", "Diarreia"];

  return (
    <div className="dash-animate dash-animate-delay-1">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {isQuickSearch ? "Pesquisa Rápida" : "Nova Triagem"}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {isQuickSearch
          ? "Busque rapidamente e inicie o atendimento."
          : "Siga os passos abaixo para registrar a triagem"}
      </p>

      {/* Step indicator */}
      <div className="form-card mb-6">
        <div style={{ display: "flex", alignItems: "center" }}>
          {triageSteps.map((step, idx) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "center",
                flex: idx < triageSteps.length - 1 ? "1" : "0",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div className={`step-circle ${getStepStatus(step.num)}`}>
                  {getStepStatus(step.num) === "done" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span style={{ fontSize: "11px", fontWeight: "600", color: getStepStatus(step.num) === "pending" ? "#9ca3af" : "#0c3a24", whiteSpace: "nowrap" }}>
                  {step.label}
                </span>
              </div>
              {idx < triageSteps.length - 1 && (
                <div className={`step-line ${getStepStatus(step.num) === "done" ? "done" : ""}`} style={{ marginBottom: "20px" }} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1 ── */}
      {triageStep === 1 && (
        <div className="form-card">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Localizar ou Cadastrar Paciente
          </h2>
          <p className="text-xs text-gray-400 mb-5">
            Busque pelo código clínico ou nome do paciente
          </p>

          <div className="patient-entry-slider">
            <div
              className="patient-entry-track"
              style={{ transform: patientEntryMode === "register" ? "translateX(-50%)" : "translateX(0)" }}
            >
              <section className={`patient-entry-panel ${patientEntryMode === "locate" ? "active" : "inactive"}`}>
                <div className="search-segment" style={{ marginBottom: "16px" }}>
                  <span className="search-segment-indicator" style={{ transform: searchMode === "NAME" ? "translateX(100%)" : "translateX(0)" }} />
                  <button type="button" onClick={() => setSearchMode("CODE")} className={`search-tab ${searchMode === "CODE" ? "active" : "inactive"}`}>Por Código</button>
                  <button type="button" onClick={() => setSearchMode("NAME")} className={`search-tab ${searchMode === "NAME" ? "active" : "inactive"}`}>Por Nome</button>
                </div>

                {searchMode === "CODE" ? (
                  <div className="mb-4">
                    <label className="triage-label">Código Clínico</label>
                    <div style={{ position: "relative" }}>
                      <input className="triage-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex: P0001" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="triage-label">Nome do Paciente</label>
                    <div style={{ position: "relative" }}>
                      <input className="triage-input" value={nameQuery} onChange={(e) => setNameQuery(e.target.value)} placeholder="Ex: João" style={{ paddingRight: "40px" }} onKeyDown={(e) => e.key === "Enter" && searchPatient()} />
                      <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                      </span>
                    </div>
                  </div>
                )}

                <button onClick={searchPatient} disabled={searchLoading} className="btn-primary" style={{ marginBottom: "16px" }}>
                  {searchLoading ? "Buscando..." : "Buscar Paciente"}
                </button>

                <button type="button" className="patient-register-cta" onClick={() => setPatientEntryMode("register")}>
                  <span className="patient-register-cta-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
                  </span>
                  <span><strong>Novo paciente?</strong><span>Ir para cadastro rapido</span></span>
                </button>

                {!patient && renderStartActions("triage-start-actions-inline")}

                {searchMode === "NAME" && searchResults.length > 0 && (
                  <div style={{ marginBottom: "16px" }}>
                    <div className="triage-label" style={{ marginBottom: "8px" }}>Resultados encontrados</div>
                    <div className="patient-results-list" style={{ display: "flex", flexDirection: "column", maxHeight: "200px", overflowY: "auto" }}>
                      {searchResults.map((p) => (
                        <button key={p.id} onClick={() => { setPatient(p); setAiSuggestion(null); setVisit(null); setSelectedDoctorId(""); setForceTriageForLabFollowup(false); }} className="patient-result-card">
                          <div className="patient-result-name">{p.full_name}</div>
                          <div className="patient-result-code">{p.clinical_code}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {patient && (
                  <div className="patient-confirmed" style={{ marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>{patient.full_name}</div>
                        <div style={{ fontSize: "12px", color: "#0c3a24", fontWeight: "500", marginTop: "2px" }}>{patient.clinical_code}</div>
                      </div>
                      <span style={{ background: "#165034", color: "white", fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px" }}>Encontrado</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px", color: "#4b5563", marginBottom: "12px" }}>
                      <div>Idade: <strong>{patientAgeYears != null ? `${patientAgeYears} anos` : "-"}</strong></div>
                      <div>Sexo: <strong>{patient.sex}</strong></div>
                      <div>Nasc.: <strong>{patient.birth_date}</strong></div>
                      {latestRecordedWeight != null && <div>Último peso: <strong>{latestRecordedWeight} kg</strong></div>}
                      <div style={{ gridColumn: "1/-1" }}>Acompanhante: <strong>{patient.guardian_name}</strong></div>
                    </div>
                    {!!patientLabFollowup && !visit && (
                      <div style={{ marginBottom: "12px", border: "1px solid #f59e0b", background: "#fffbeb", borderRadius: "10px", padding: "10px 12px" }}>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>Atenção: este paciente tem retorno laboratorial.</div>
                        <div style={{ fontSize: "12px", color: "#78350f", marginTop: "4px" }}>
                          {patientLabFollowup.note || (patientLabFollowup.isResult ? "Resultados prontos." : patientLabFollowup.readyLabel ? `Exame disponível em ${patientLabFollowup.readyLabel}.` : "Exame pendente / retorno para colheita.")}
                        </div>
                      </div>
                    )}
                    {!visit && (
                      <div style={{ marginBottom: "14px", border: "1px solid #dcebe2", background: "#f8fbf9", borderRadius: "12px", padding: "12px 14px", fontSize: "12px", color: "#4b5563", lineHeight: 1.5 }}>
                        Todo retorno, inclusive para resultado ou colheita laboratorial, passa por triagem. Atualize sinais vitais e sintomas para confirmar se houve melhoria, agravamento ou necessidade de nova intervenção.
                      </div>
                    )}
                    {renderStartActions("triage-start-actions-patient")}
                  </div>
                )}
              </section>

              <section className={`patient-entry-panel ${patientEntryMode === "register" ? "active" : "inactive"}`}>
                <div className="patient-register-head">
                  <div>
                    <div className="triage-label" style={{ marginBottom: "4px" }}>Cadastrar Novo Paciente</div>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>Preencha os dados essenciais para criar o registo pediatrico.</div>
                  </div>
                  <button type="button" className="patient-register-cta patient-entry-back" onClick={() => setPatientEntryMode("locate")}>
                    <span className="patient-register-cta-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></svg>
                    </span>
                    <span>Voltar para pesquisa</span>
                  </button>
                </div>

                <form onSubmit={createPatient} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label className="triage-label">Código Clínico</label>
                    <input className="triage-input" value={pClinicalCode} readOnly disabled placeholder="A gerar automaticamente" title="Codigo clinico gerado automaticamente" style={{ background: "#f8fafc", color: "#0f172a", cursor: "not-allowed" }} />
                  </div>
                  <div>
                    <label className="triage-label">Nome Completo</label>
                    <input className="triage-input" value={pFullName} onChange={(e) => setPFullName(e.target.value)} placeholder="João Pedro" required />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <label className="triage-label">Sexo</label>
                      <select className="triage-input" value={pSex} onChange={(e) => setPSex(e.target.value)}>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                      </select>
                    </div>
                    <div>
                      <label className="triage-label">Data de Nascimento</label>
                      <input type="date" className="triage-input" value={pBirthDate} onChange={(e) => setPBirthDate(e.target.value)} required />
                    </div>
                  </div>
                  <div>
                    <label className="triage-label">Acompanhante</label>
                    <input className="triage-input" value={pGuardianName} onChange={(e) => setPGuardianName(e.target.value)} required />
                  </div>
                  <div>
                    <label className="triage-label">Telefone do Acompanhante</label>
                    <input className="triage-input" value={pGuardianPhone} onChange={(e) => setPGuardianPhone(e.target.value)} placeholder="84 XXX XXXX" required />
                  </div>
                  <div>
                    <label className="triage-label">Contacto alternativo</label>
                    <input className="triage-input" value={pAltPhone} onChange={(e) => setPAltPhone(e.target.value)} placeholder="Opcional" />
                  </div>
                  <div>
                    <label className="triage-label">Morada</label>
                    <input className="triage-input" value={pAddress} onChange={(e) => setPAddress(e.target.value)} placeholder="Opcional" />
                  </div>
                  <button disabled={creatingPatient} className="btn-secondary">
                    {creatingPatient ? "Cadastrando..." : "Cadastrar Paciente"}
                  </button>
                </form>
                {renderStartActions("triage-start-actions-register")}
              </section>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {triageStep === 2 && (
        <div className="form-card">
          <PatientBar patient={patient} visit={visit} />

          <div className="triage-title-row">
            <h2 className="text-base font-semibold text-gray-900 mb-1">Triagem Clínica</h2>
            <button
              type="button"
              className="triage-manual-button"
              onClick={() => {
                setManualPage(0);
                setManualOpen(true);
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 7.2c-1.7-1.35-4.1-2-7-2v12.9c2.9 0 5.3.65 7 2" />
                <path d="M12 7.2c1.7-1.35 4.1-2 7-2v12.9c-2.9 0-5.3.65-7 2" />
                <path d="M12 7.2v12.9" />
                <path d="M7.3 8.2c1.3.1 2.4.4 3.2.9" />
                <path d="M16.7 8.2c-1.3.1-2.4.4-3.2.9" />
              </svg>
              Manual
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            {skipTriageReturnEligible
              ? "Triagem simplificada de seguimento: atualize sinais vitais, crescimento/peso e a situação clínica atual antes de enviar para a fila médica."
              : "Registe os sinais vitais e a queixa principal antes de enviar para a fila médica"}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              proceedToQueueStep();
            }}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div className="triage-part-segment">
              <span
                className="triage-part-indicator"
                style={{ transform: triagePart === "clinical" ? "translateX(100%)" : "translateX(0)" }}
              />
              <button
                type="button"
                className={`triage-part-tab ${triagePart === "vitals" ? "active" : ""}`}
                onClick={() => setTriagePart("vitals")}
              >
                Sinais vitais
              </button>
              <button
                type="button"
                className={`triage-part-tab ${triagePart === "clinical" ? "active" : ""}`}
                onClick={() => setTriagePart("clinical")}
              >
                Avaliação clínica
              </button>
            </div>

            <div className="triage-part-slider">
              <div
                className="triage-part-track"
                style={{ transform: triagePart === "clinical" ? "translateX(-50%)" : "translateX(0)" }}
              >
                <div className={`triage-part-panel ${triagePart === "vitals" ? "active" : "inactive"}`}>
            {/* Section label */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "12px" }}>
                Sinais Vitais
              </div>

              {/* 2×2 vital stepper grid */}
              <div className="vital-group" style={{ marginBottom: "12px" }}>
                <VitalCard
                  label="Temperatura" unit="°C"
                  value={temperature} onChange={setTemperature}
                  getBadge={tempBadge}
                  icon={{
                    delta: 0.1, bg: "#fef3c7",
                    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#92400e" strokeWidth="2"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>,
                  }}
                />
                <VitalCard
                  label="SpO2" unit="%"
                  value={spo2} onChange={setSpo2}
                  getBadge={spo2Badge}
                  icon={{
                    delta: 1, bg: "#dbeafe",
                    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 12h4l2-4 2 8 2-4h2"/></svg>,
                  }}
                />
                <VitalCard
                  label="Freq. Cardíaca" unit="bpm"
                  value={heartRate} onChange={setHeartRate}
                  getBadge={hrBadge}
                  icon={{
                    delta: 1, bg: "#fce7f3",
                    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9d174d" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
                  }}
                />
                <VitalCard
                  label="Freq. Respiratória" unit="rpm"
                  value={respRate} onChange={setRespRate}
                  getBadge={rrBadge}
                  icon={{
                    delta: 1, bg: "#d1fae5",
                    svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2"><path d="M3 12h4l3 8 4-16 3 8h4"/></svg>,
                  }}
                />
              </div>

              {/* Weight — single row */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 14px",
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
              }}>
                <div style={{
                  width: "30px", height: "30px",
                  borderRadius: "8px",
                  background: "#f3f4f6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4H8a4 4 0 0 1 4-4z"/><rect x="3" y="6" width="18" height="16" rx="2"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "#6b7280" }}>Peso</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af" }}>kg · para cálculo de dose</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", background: "#f9fafb", minHeight: "40px" }}>
                  <button type="button" onClick={() => setWeight(String(parseFloat((parseFloat(weight || 0) - 0.5).toFixed(1))))} style={{ width: "32px", height: "34px", background: "transparent", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: 300, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                  <input
                    style={{ width: "78px", border: "none", background: "transparent", textAlign: "center", fontSize: "16px", fontWeight: 600, color: "#111827", outline: "none", boxShadow: "none", fontFamily: "monospace", padding: 0 }}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="14.5"
                  />
                  <button type="button" onClick={() => setWeight(String(parseFloat((parseFloat(weight || 0) + 0.5).toFixed(1))))} style={{ width: "32px", height: "34px", background: "transparent", border: "none", cursor: "pointer", fontSize: "16px", fontWeight: 400, color: "#374151", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                </div>
              </div>
            </div>

                </div>
                <div className={`triage-part-panel ${triagePart === "clinical" ? "active" : "inactive"}`}>
            {/* General state */}
            <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 0, padding: "14px" }}>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "4px" }}>Estado Geral</div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "12px" }}>Como está a criança neste momento?</div>
              <div className="general-state-grid">
                {GENERAL_STATE_OPTIONS.map((opt) => {
                  const active = generalState === opt.value;
                  const dotColors = { ACTIVE: "#16a34a", LETHARGIC: "#f59e0b", IMMOBILE: "#f97316", UNCONSCIOUS: "#dc2626" };
                  const dot = dotColors[opt.value] || "#9ca3af";
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setGeneralState(opt.value)}
                      className={`general-state-option ${active ? "active" : ""}`}
                    >
                      <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: dot, marginBottom: "6px" }} />
                      <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>{opt.label}</div>
                      <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "2px" }}>{opt.hint}</div>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "8px" }}>Intervenções rápidas da enfermagem</div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>Marque apenas o que foi feito antes de enviar para a fila.</div>
              <div style={{ display: "grid", gap: "6px" }}>
                {NURSE_INTERVENTION_OPTIONS.map((item) => (
                  <SignRow
                    key={item.key}
                    label={item.label}
                    checked={!!nurseInterventions[item.key]}
                    onChange={(checked) => toggleNurseIntervention(item.key, checked)}
                  />
                ))}
              </div>
            </div>

            <hr className="section-divider" style={{ margin: "0" }} />

            {/* Chief complaint */}
            <div>
              <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", marginBottom: "4px" }}>Queixa Principal *</div>
              <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "10px" }}>Descreva o motivo principal da visita</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {VITAL_CHIPS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setChiefComplaint((prev) => (prev ? `${prev}, ${c}` : c))}
                    style={{
                      padding: "5px 13px",
                      borderRadius: "99px",
                      border: chiefComplaint.includes(c) ? "1.5px solid #165034" : "1px solid #e5e7eb",
                      background: chiefComplaint.includes(c) ? "#165034" : "#fff",
                      color: chiefComplaint.includes(c) ? "#fff" : "#374151",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <textarea
                className="triage-input"
                rows="3"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Descreva em detalhes..."
                style={{ resize: "none" }}
                required
              />
            </div>

            {/* Clinical notes */}
            <div>
              <label className="triage-label">
                Notas Clínicas{" "}
                <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span>
              </label>
              <textarea
                className="triage-input"
                rows="2"
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Observações adicionais..."
                style={{ resize: "none" }}
              />
            </div>

                </div>
              </div>
            </div>

            <div className="step-nav">
              <button
                type="button"
                onClick={() => {
                  if (triagePart === "clinical") {
                    setTriagePart("vitals");
                    return;
                  }
                  setTriageStep(1);
                }}
                className="btn-ghost"
                style={{ width: "auto", padding: "10px 20px" }}
              >
                Voltar
              </button>
              {triagePart === "vitals" ? (
                <button type="button" onClick={() => setTriagePart("clinical")} className="btn-primary">
                  Próximo: Avaliação clínica
                </button>
              ) : (
                <button type="submit" disabled={!chiefComplaint.trim()} className="btn-primary">
                  Próximo: Fila de Espera
                </button>
              )}
            </div>
          </form>

          {manualOpen &&
            typeof document !== "undefined" &&
            createPortal(
            <div className="triage-manual-overlay" role="dialog" aria-modal="true" aria-labelledby="triage-manual-title">
              <div className="triage-manual-card">
                <div className="triage-manual-head">
                  <div className="triage-manual-icon">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 7.2c-1.7-1.35-4.1-2-7-2v12.9c2.9 0 5.3.65 7 2" />
                      <path d="M12 7.2c1.7-1.35 4.1-2 7-2v12.9c-2.9 0-5.3.65-7 2" />
                      <path d="M12 7.2v12.9" />
                      <path d="M7.3 8.2c1.3.1 2.4.4 3.2.9" />
                      <path d="M16.7 8.2c-1.3.1-2.4.4-3.2.9" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="triage-manual-title">Manual de triagem</h3>
                    <p>Guia rápido para preencher e encaminhar o paciente.</p>
                  </div>
                  <button type="button" className="triage-manual-close" onClick={() => setManualOpen(false)} aria-label="Fechar manual">
                    ×
                  </button>
                </div>

                <div className="triage-manual-pages">
                  <div
                    className="triage-manual-track"
                    style={{ transform: manualPage === 1 ? "translateX(-50%)" : "translateX(0)" }}
                  >
                    <div className="triage-manual-page">
                      <div className="triage-manual-item">
                        <strong>Sinais vitais</strong>
                        <span>Registe os valores reais medidos. O sistema usa estes limites como alerta visual durante a triagem.</span>
                        <div className="triage-thresholds compact">
                          <div className="triage-threshold-row">
                            <span>Temperatura</span>
                            <div className="triage-threshold-line">
                              <i className="zone low" />
                              <i className="zone normal" />
                              <i className="zone danger" />
                            </div>
                            <small>&lt;36 baixa · 36-37.4 normal · ≥38.5 alta</small>
                          </div>
                          <div className="triage-threshold-row">
                            <span>SpO2</span>
                            <div className="triage-threshold-line">
                              <i className="zone danger" />
                              <i className="zone warn" />
                              <i className="zone normal" />
                            </div>
                            <small>&lt;90 crítica · 90-94 baixa · ≥95 normal</small>
                          </div>
                          <div className="triage-threshold-row">
                            <span>FC / FR</span>
                            <div className="triage-threshold-line">
                              <i className="zone warn" />
                              <i className="zone normal" />
                              <i className="zone danger" />
                            </div>
                            <small>FC: 60-100 normal · &gt;150 crítica. FR: 12-40 normal · &gt;40 elevada.</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="triage-manual-page">
                      <div className="triage-manual-item">
                        <strong>Avaliação clínica</strong>
                        <span>Escolha o estado geral, marque intervenções já feitas pela enfermagem e descreva a queixa principal com clareza.</span>
                      </div>
                      <div className="triage-manual-item">
                        <strong>Prioridade e fila</strong>
                        <span>A prioridade inicial pode ser ajustada pelo sistema com base nos sinais vitais e sintomas antes de enviar para a fila médica.</span>
                      </div>
                      <div className="triage-manual-route">
                        <div>
                          <strong>Encaminhamento</strong>
                          <span>Depois da avaliação, confirme a prioridade e escolha o destino adequado.</span>
                        </div>
                        <div className="triage-route-steps">
                          <span>Fila médica</span>
                          <span>Sala recomendada</span>
                          <span className="danger">ER / crítico</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="triage-manual-nav">
                  <span>{manualPage + 1}/2</span>
                  <button
                    type="button"
                    onClick={() => setManualPage((page) => (page === 0 ? 1 : 0))}
                    className="triage-manual-arrow"
                    aria-label={manualPage === 0 ? "Ver avaliação clínica" : "Voltar aos sinais vitais"}
                  >
                    {manualPage === 0 ? (
                      <>
                        Avaliação clínica
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12h14" />
                          <path d="m13 6 6 6-6 6" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 12H5" />
                          <path d="m11 6-6 6 6 6" />
                        </svg>
                        Sinais vitais
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>,
              document.body
            )}
        </div>
      )}

      {/* ── STEP 3 ── */}
      {triageStep === 3 && (
        <div className="form-card">
          <PatientBar patient={patient} visit={visit} />

          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Fila de Espera e Encaminhamento
          </h2>
          <p className="text-xs text-gray-400 mb-6">
            Defina prioridade, sala e o envio do paciente para a fila do médico
          </p>
          <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
            <div style={{ marginBottom: "20px" }}>
              <label className="triage-label" style={{ marginBottom: "10px" }}>
                Prioridade da Triagem
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.value;
                  const selClass = isSelected
                    ? p.value === "URGENT" ? "selected-urgent" : p.value === "LESS_URGENT" ? "selected-less" : "selected-non"
                    : "";
                  const radioClass = isSelected
                    ? p.value === "URGENT" ? "checked-urgent" : p.value === "LESS_URGENT" ? "checked-less" : "checked-non"
                    : "";
                  return (
                    <div key={p.value} className={`priority-card ${selClass}`} onClick={() => setPriority(p.value)}>
                      <div className={`priority-radio ${radioClass}`}>
                        {isSelected && <div className="priority-radio-dot" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: isSelected ? p.color : "#374151" }}>{p.label}</div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>Espera máxima: {p.maxWait} minutos</div>
                      </div>
                      {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label className="triage-label">
                Espera Máxima Personalizada (min){" "}
                <span style={{ color: "#9ca3af", fontWeight: "400" }}>(opcional)</span>
              </label>
              <input className="triage-input" value={customMaxWait} onChange={(e) => setCustomMaxWait(e.target.value)} placeholder={`Padrão: ${selectedPriority?.maxWait ?? ""} min`} style={{ maxWidth: "200px" }} />
            </div>

            <div style={{ marginBottom: "20px" }}>
              {aiSuggestion && (
                <div className="ai-card" style={{ marginTop: "10px" }}>
                  <div className="ai-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="10" /></svg>
                    IA automática
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>{priorityLabel(aiSuggestion.suggested_priority)}</div>
                      <div style={{ fontSize: "12px", color: "#4b5563", marginTop: "2px", wordBreak: "break-word" }}>Motivo: {aiShortReason || "Sem motivo detalhado"}</div>
                      <div style={{ fontSize: "11px", color: "#166534", marginTop: "4px", fontWeight: 600 }}>Prioridade aplicada automaticamente com base nos sinais vitais e sintomas.</div>
                      {aiSuggestion?.suggested_doctor && (
                        <div style={{ fontSize: "11px", color: "#0f172a", marginTop: "6px", fontWeight: 600 }}>
                          Medico recomendado:{" "}
                          {aiSuggestion.suggested_doctor.full_name || aiSuggestion.suggested_doctor.username || `Medico #${aiSuggestion.suggested_doctor.id}`}
                        </div>
                      )}
                    </div>
                    {aiLoading && <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>Atualizando...</span>}
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <div style={{ marginBottom: "18px", padding: "12px 14px", borderRadius: "10px", border: "1px solid #dcebe2", background: "#f8fafc" }}>
            <label className="triage-label" style={{ marginBottom: "8px" }}>Sala Recomendada</label>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
              {recommendedRoomLabel || (bypassToER ? "Sala de Reanimação / ER" : "Sem sala disponível no momento")}
            </div>
            {!bypassToER && <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>Baseado na prioridade atual: {priorityLabel(priority)}</div>}
            {!hasRoomAvailable && !bypassToER && <div style={{ marginTop: "6px", fontSize: "11px", fontWeight: "700", color: "#b45309" }}>Nenhuma sala disponível para esta prioridade agora.</div>}
          </div>

          <hr className="section-divider" />

          {erBypassRecommended && !bypassToER && (
            <div style={{ marginBottom: "18px", padding: "14px 16px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fef2f2" }}>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#991b1b" }}>Sinais de risco de vida detectados</div>
              <div style={{ fontSize: "12px", color: "#7f1d1d", marginTop: "4px" }}>Este paciente pode seguir diretamente para a Sala de Reanimacao / ER sem aguardar a fila do medico.</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                {erBypassReasons.map((reason) => (
                  <span key={reason} style={{ fontSize: "11px", fontWeight: "700", color: "#991b1b", background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "999px", padding: "4px 8px" }}>{reason}</span>
                ))}
              </div>
              <button type="button" onClick={() => setBypassToER(true)} className="btn-primary" style={{ marginTop: "12px", width: "auto", padding: "10px 16px" }}>
                Encaminhar direto para ER
              </button>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label className="triage-label" style={{ marginBottom: "10px" }}>Atribuir Médico</label>
            {assignableDoctors.length === 0 ? (
              <div style={{ padding: "16px", background: "#fafafa", border: "1.5px dashed #e5e7eb", borderRadius: "10px", textAlign: "center", color: "#9ca3af", fontSize: "13px" }}>
                Nenhum médico disponível no momento
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }}>
                {assignableDoctors.map((d) => {
                  const isDocSelected = selectedDoctorId === String(d.id);
                  const doctorQueueMeta = doctorQueueEtaById?.get?.(Number(d.id)) || null;
                  const etaMinutes = Number(doctorQueueMeta?.etaMinutes || 0);
                  const isBusyDoctor = !!d?.is_busy;
                  return (
                    <div
                      key={d.id}
                      className={`doctor-card ${isDocSelected ? "selected" : ""}`}
                      title={`${isBusyDoctor ? "Medico ocupado" : "Medico livre"} - ${formatEtaLabel(etaMinutes)}`}
                      onClick={() => !visit?.doctor_id && setSelectedDoctorId(String(d.id))}
                    >
                      <DoctorAvatar doctor={d} size={34} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>{d.full_name || d.username || `Médico #${d.id}`}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>{d.specialization || "Clínica Geral"}</div>
                      </div>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: isBusyDoctor ? "#f59e0b" : "#165034", flexShrink: 0 }} />
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={assignDoctor} disabled={!visit?.id || !!visit?.doctor_id || assigning || !selectedDoctorId} className="btn-secondary" style={{ marginTop: "10px", fontSize: "13px" }}>
              {visit?.doctor_id ? "Médico já atribuído" : assigning ? "Atribuindo..." : "Confirmar Atribuição"}
            </button>
            {!hasDoctorAvailable && <div style={{ marginTop: "8px", fontSize: "11px", color: "#b45309", fontWeight: "700" }}>Sem médico disponível agora. Pode manter em fila de espera.</div>}
          </div>

          {selectedDoctorId && doctorQueueEtaById?.get?.(Number(selectedDoctorId)) && (
            <div style={{ marginBottom: "20px", fontSize: "11px", color: "#4b5563", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "8px 10px", lineHeight: 1.45 }}>
              {assignableDoctors.some((doctor) => Number(doctor?.id) === Number(selectedDoctorId) && Boolean(doctor?.is_busy))
                ? "Medico ocupado, mas o paciente sera adicionado na fila deste medico. "
                : "Medico livre. "}
              {formatEtaLabel(doctorQueueEtaById.get(Number(selectedDoctorId)).etaMinutes)}.
            </div>
          )}

          <div style={{ marginBottom: "20px", display: "grid", gap: "8px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", fontWeight: "600", cursor: "pointer" }}>
              <input type="checkbox" checked={holdInWaitingLine} onChange={(e) => setHoldInWaitingLine(e.target.checked)} />
              Manter paciente na fila de espera quando não houver médico/sala disponível
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#374151", fontWeight: "600", cursor: "pointer" }}>
              <input type="checkbox" checked={bypassToER} onChange={(e) => setBypassToER(e.target.checked)} />
              Caso super severo: bypass imediato para Sala de Reanimação / ER
            </label>
            {bypassToER && (
              <div style={{ fontSize: "11px", color: "#991b1b", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "8px 10px", fontWeight: "700" }}>
                Fluxo crítico ativo. O sistema regista bypass e não bloqueia por indisponibilidade de sala/médico.
              </div>
            )}
          </div>

          <div className="step-nav">
            <button type="button" onClick={() => setTriageStep(2)} className="btn-ghost" style={{ width: "auto", padding: "10px 20px" }}>
              Voltar
            </button>
            <button onClick={saveTriage} disabled={savingTriage || !visit?.id} className="btn-primary">
              {savingTriage ? "Salvando..." : "Concluir Triagem"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NurseNewTriage() {
  return <NursePage forcedView="newTriage" />;
}
