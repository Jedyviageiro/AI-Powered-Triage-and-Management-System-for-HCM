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
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <div className={`step-circle ${getStepStatus(step.num)}`}>
                  {getStepStatus(step.num) === "done" ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "600",
                    color: getStepStatus(step.num) === "pending" ? "#9ca3af" : "#0c3a24",
                    whiteSpace: "nowrap",
                  }}
                >
                  {step.label}
                </span>
              </div>
              {idx < triageSteps.length - 1 && (
                <div
                  className={`step-line ${getStepStatus(step.num) === "done" ? "done" : ""}`}
                  style={{ marginBottom: "20px" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {triageStep === 1 && (
        <div className="form-card">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Localizar ou Cadastrar Paciente
          </h2>
          <p className="text-xs text-gray-400 mb-5">
            Busque pelo código clínico ou nome do paciente
          </p>

          <div
            style={{
              display: "flex",
              background: "#f3f4f6",
              padding: "4px",
              borderRadius: "10px",
              marginBottom: "16px",
              gap: "4px",
            }}
          >
            <button
              onClick={() => setSearchMode("CODE")}
              className={`search-tab ${searchMode === "CODE" ? "active" : "inactive"}`}
            >
              Por Código
            </button>
            <button
              onClick={() => setSearchMode("NAME")}
              className={`search-tab ${searchMode === "NAME" ? "active" : "inactive"}`}
            >
              Por Nome
            </button>
          </div>

          {searchMode === "CODE" ? (
            <div className="mb-4">
              <label className="triage-label">Código Clínico</label>
              <div style={{ position: "relative" }}>
                <input
                  className="triage-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: P0001"
                  style={{ paddingRight: "40px" }}
                  onKeyDown={(e) => e.key === "Enter" && searchPatient()}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <label className="triage-label">Nome do Paciente</label>
              <div style={{ position: "relative" }}>
                <input
                  className="triage-input"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Ex: João"
                  style={{ paddingRight: "40px" }}
                  onKeyDown={(e) => e.key === "Enter" && searchPatient()}
                />
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#9ca3af",
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={searchPatient}
            disabled={searchLoading}
            className="btn-primary"
            style={{ marginBottom: "16px" }}
          >
            {searchLoading ? "Buscando..." : "Buscar Paciente"}
          </button>

          {searchMode === "NAME" && searchResults.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div className="triage-label" style={{ marginBottom: "8px" }}>
                Resultados encontrados
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPatient(p);
                      setAiSuggestion(null);
                      setVisit(null);
                      setSelectedDoctorId("");
                      setForceTriageForLabFollowup(false);
                    }}
                    className="patient-result-card"
                  >
                    <div style={{ fontWeight: "600", fontSize: "14px", color: "#111827" }}>
                      {p.full_name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      {p.clinical_code}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {patient && (
            <div className="patient-confirmed" style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <div>
                  <div style={{ fontWeight: "700", fontSize: "15px", color: "#111827" }}>
                    {patient.full_name}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#0c3a24",
                      fontWeight: "500",
                      marginTop: "2px",
                    }}
                  >
                    {patient.clinical_code}
                  </div>
                </div>
                <span
                  style={{
                    background: "#165034",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "3px 8px",
                    borderRadius: "20px",
                  }}
                >
                  Encontrado
                </span>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                  fontSize: "12px",
                  color: "#4b5563",
                  marginBottom: "12px",
                }}
              >
                <div>
                  Idade:{" "}
                  <strong>{patientAgeYears != null ? `${patientAgeYears} anos` : "-"}</strong>
                </div>
                <div>
                  Sexo: <strong>{patient.sex}</strong>
                </div>
                <div>
                  Nasc.: <strong>{patient.birth_date}</strong>
                </div>
                {latestRecordedWeight != null && (
                  <div>
                    Último peso: <strong>{latestRecordedWeight} kg</strong>
                  </div>
                )}
                <div style={{ gridColumn: "1/-1" }}>
                  Acompanhante: <strong>{patient.guardian_name}</strong>
                </div>
              </div>
              {!!patientLabFollowup && !visit && (
                <div
                  style={{
                    marginBottom: "12px",
                    border: "1px solid #f59e0b",
                    background: "#fffbeb",
                    borderRadius: "10px",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "#92400e" }}>
                    Atenção: este paciente tem retorno laboratorial.
                  </div>
                  <div style={{ fontSize: "12px", color: "#78350f", marginTop: "4px" }}>
                    {patientLabFollowup.note ||
                      (patientLabFollowup.isResult
                        ? "Resultados prontos."
                        : patientLabFollowup.readyLabel
                          ? `Exame disponível em ${patientLabFollowup.readyLabel}.`
                          : "Exame pendente / retorno para colheita.")}
                  </div>
                </div>
              )}
              {!visit && (
                <div
                  style={{
                    marginBottom: "14px",
                    border: "1px solid #dcebe2",
                    background: "#f8fbf9",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    fontSize: "12px",
                    color: "#4b5563",
                    lineHeight: 1.5,
                  }}
                >
                  Todo retorno, inclusive para resultado ou colheita laboratorial, passa por
                  triagem. Atualize sinais vitais e sintomas para confirmar se houve melhoria,
                  agravamento ou necessidade de nova intervenção.
                </div>
              )}
              <button
                onClick={() => createVisit({ forceNewConsultation: !!forceTriageForLabFollowup })}
                disabled={creatingVisit || !!visit}
                className="btn-primary"
                style={{ fontSize: "13px", padding: "9px 16px", borderRadius: "8px" }}
              >
                {visit
                  ? `Visita #${visit.id} Criada`
                  : creatingVisit
                    ? "Criando..."
                    : forceTriageForLabFollowup
                      ? "Registrar Chegada (Nova Consulta)"
                      : "Registrar Chegada"}
              </button>
            </div>
          )}

          <hr className="section-divider" />
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#374151",
              marginBottom: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Cadastrar Novo Paciente
          </div>

          <form
            onSubmit={createPatient}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <div>
              <label className="triage-label">Código Clínico</label>
              <input
                className="triage-input"
                value={pClinicalCode}
                readOnly
                disabled
                placeholder="A gerar automaticamente"
                title="Codigo clinico gerado automaticamente"
                style={{ background: "#f8fafc", color: "#0f172a", cursor: "not-allowed" }}
              />
            </div>
            <div>
              <label className="triage-label">Nome Completo</label>
              <input
                className="triage-input"
                value={pFullName}
                onChange={(e) => setPFullName(e.target.value)}
                placeholder="João Pedro"
                required
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label className="triage-label">Sexo</label>
                <select
                  className="triage-input"
                  value={pSex}
                  onChange={(e) => setPSex(e.target.value)}
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
              <div>
                <label className="triage-label">Data de Nascimento</label>
                <input
                  type="date"
                  className="triage-input"
                  value={pBirthDate}
                  onChange={(e) => setPBirthDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="triage-label">Acompanhante</label>
              <input
                className="triage-input"
                value={pGuardianName}
                onChange={(e) => setPGuardianName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="triage-label">Telefone do Acompanhante</label>
              <input
                className="triage-input"
                value={pGuardianPhone}
                onChange={(e) => setPGuardianPhone(e.target.value)}
                placeholder="84 XXX XXXX"
                required
              />
            </div>
            <div>
              <label className="triage-label">Contacto alternativo</label>
              <input
                className="triage-input"
                value={pAltPhone}
                onChange={(e) => setPAltPhone(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="triage-label">Morada</label>
              <input
                className="triage-input"
                value={pAddress}
                onChange={(e) => setPAddress(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <button disabled={creatingPatient} className="btn-secondary">
              {creatingPatient ? "Cadastrando..." : "Cadastrar Paciente"}
            </button>
          </form>

          <div className="step-nav">
            <button
              onClick={() => setTriageStep(2)}
              disabled={!patient || !visit}
              className="btn-primary"
            >
              Próximo: Triagem
            </button>
          </div>
        </div>
      )}

      {triageStep === 2 && (
        <div className="form-card">
          {patient && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: "#e7f1ec",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                className="doc-avatar"
                style={{ width: "30px", height: "30px", fontSize: "12px" }}
              >
                {(patient.full_name || "P")[0]}
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                  {patient.full_name}
                </div>
                <div style={{ fontSize: "11px", color: "#0c3a24" }}>
                  {patient.clinical_code} · Visita #{visit?.id}
                </div>
              </div>
            </div>
          )}

          <h2 className="text-base font-semibold text-gray-900 mb-1">Triagem Clínica</h2>
          <p className="text-xs text-gray-400 mb-5">
            {skipTriageReturnEligible
              ? "Triagem simplificada de seguimento: atualize sinais vitais, crescimento/peso e a situação clínica atual antes de enviar para a fila médica."
              : "Registe os sinais vitais e a queixa principal antes de enviar para a fila médica"}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setTriageStep(3);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <fieldset
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                border: "none",
                padding: 0,
                margin: 0,
              }}
            >
              <div>
                <div
                  className="triage-label"
                  style={{
                    marginBottom: "10px",
                    color: "#0c3a24",
                    textTransform: "uppercase",
                    fontSize: "11px",
                    letterSpacing: "0.05em",
                  }}
                >
                  Sinais Vitais
                </div>
                <div className="vital-group">
                  <div>
                    <label className="triage-label">Temperatura (°C)</label>
                    <div className="triage-hint">Febre ou hipotermia</div>
                    <input
                      className="triage-input"
                      value={temperature}
                      onChange={(e) => setTemperature(e.target.value)}
                      placeholder="38.2"
                    />
                  </div>
                  <div>
                    <label className="triage-label">SpO2 (%)</label>
                    <div className="triage-hint">Saturação de oxigênio</div>
                    <input
                      className="triage-input"
                      value={spo2}
                      onChange={(e) => setSpo2(e.target.value)}
                      placeholder="96"
                    />
                  </div>
                  <div>
                    <label className="triage-label">Freq. Cardíaca (bpm)</label>
                    <div className="triage-hint">Batimentos por minuto</div>
                    <input
                      className="triage-input"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      placeholder="120"
                    />
                  </div>
                  <div>
                    <label className="triage-label">Freq. Respiratória (rpm)</label>
                    <div className="triage-hint">Respirações por minuto</div>
                    <input
                      className="triage-input"
                      value={respRate}
                      onChange={(e) => setRespRate(e.target.value)}
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="triage-label">Peso (kg)</label>
                <div className="triage-hint">Para cálculo de dose e avaliação clínica</div>
                <input
                  className="triage-input"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="14.5"
                  style={{ maxWidth: "200px" }}
                />
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "12px 14px",
                }}
              >
                <label className="triage-label" style={{ marginBottom: "2px" }}>
                  Estado Geral do Paciente
                </label>
                <div className="triage-hint" style={{ marginBottom: "10px" }}>
                  Como está a criança neste momento?
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {GENERAL_STATE_OPTIONS.map((opt) => {
                    const active = generalState === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGeneralState(opt.value)}
                        style={{
                          border: active ? "1.5px solid #2d6f4e" : "1px solid #e5e7eb",
                          background: active ? "#edf5f0" : "#ffffff",
                          borderRadius: "10px",
                          padding: "8px 10px",
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                          {opt.hint}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div style={{ marginTop: "12px" }}>
                  <div className="triage-label">Sinais adicionais preocupantes</div>
                  <div style={{ display: "grid", gap: "6px", marginTop: "6px" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={needsOxygen}
                        onChange={(e) => setNeedsOxygen(e.target.checked)}
                      />{" "}
                      Necessita de oxigénio
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={suspectedSevereDehydration}
                        onChange={(e) => setSuspectedSevereDehydration(e.target.checked)}
                      />{" "}
                      Suspeita de desidratação grave
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={excessiveLethargy}
                        onChange={(e) => setExcessiveLethargy(e.target.checked)}
                      />{" "}
                      Letargia excessiva
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={difficultyMaintainingSitting}
                        onChange={(e) => setDifficultyMaintainingSitting(e.target.checked)}
                      />{" "}
                      Dificuldade em manter posição sentada
                    </label>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "12px",
                        color: "#374151",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={historySyncopeCollapse}
                        onChange={(e) => setHistorySyncopeCollapse(e.target.checked)}
                      />{" "}
                      História de síncope / colapso
                    </label>
                  </div>
                </div>
              </div>

              <hr className="section-divider" style={{ margin: "4px 0" }} />

              <div>
                <label className="triage-label">Queixa Principal *</label>
                <div className="triage-hint">Descreva o motivo principal da visita</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                  {[
                    "Febre",
                    "Tosse",
                    "Dificuldade respiratória",
                    "Dor abdominal",
                    "Vómitos",
                    "Diarreia",
                  ].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChiefComplaint((prev) => (prev ? `${prev}, ${c}` : c))}
                      className={`chip ${chiefComplaint.includes(c) ? "chip-selected" : ""}`}
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
            </fieldset>

            <div className="step-nav">
              <button
                type="button"
                onClick={() => setTriageStep(1)}
                className="btn-ghost"
                style={{ width: "auto", padding: "10px 20px" }}
              >
                Voltar
              </button>
              <button type="submit" disabled={!chiefComplaint.trim()} className="btn-primary">
                Próximo: Fila de Espera
              </button>
            </div>
          </form>
        </div>
      )}

      {triageStep === 3 && (
        <div className="form-card">
          {patient && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 14px",
                background: "#e7f1ec",
                borderRadius: "10px",
                marginBottom: "20px",
              }}
            >
              <div
                className="doc-avatar"
                style={{ width: "30px", height: "30px", fontSize: "12px" }}
              >
                {(patient.full_name || "P")[0]}
              </div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                  {patient.full_name}
                </div>
                <div style={{ fontSize: "11px", color: "#0c3a24" }}>
                  {patient.clinical_code} · Visita #{visit?.id}
                </div>
              </div>
            </div>
          )}

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
                    ? p.value === "URGENT"
                      ? "selected-urgent"
                      : p.value === "LESS_URGENT"
                        ? "selected-less"
                        : "selected-non"
                    : "";
                  const radioClass = isSelected
                    ? p.value === "URGENT"
                      ? "checked-urgent"
                      : p.value === "LESS_URGENT"
                        ? "checked-less"
                        : "checked-non"
                    : "";
                  return (
                    <div
                      key={p.value}
                      className={`priority-card ${selClass}`}
                      onClick={() => setPriority(p.value)}
                    >
                      <div className={`priority-radio ${radioClass}`}>
                        {isSelected && <div className="priority-radio-dot" />}
                        
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "600",
                            fontSize: "13px",
                            color: isSelected ? p.color : "#374151",
                          }}
                        >
                          {p.label}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                          Espera máxima: {p.maxWait} minutos
                        </div>
                      </div>
                      {isSelected && (
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: p.color,
                            flexShrink: 0,
                          }}
                        />
                      )}
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
              <input
                className="triage-input"
                value={customMaxWait}
                onChange={(e) => setCustomMaxWait(e.target.value)}
                placeholder={`Padrão: ${selectedPriority?.maxWait ?? ""} min`}
                style={{ maxWidth: "200px" }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              {aiSuggestion && (
                <div className="ai-card" style={{ marginTop: "10px" }}>
                  <div className="ai-badge">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    IA automática
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>
                        {priorityLabel(aiSuggestion.suggested_priority)}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#4b5563",
                          marginTop: "2px",
                          wordBreak: "break-word",
                        }}
                      >
                        Motivo: {aiShortReason || "Sem motivo detalhado"}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#166534",
                          marginTop: "4px",
                          fontWeight: 600,
                        }}
                      >
                        Prioridade aplicada automaticamente com base nos sinais vitais e sintomas.
                      </div>
                      {aiSuggestion?.suggested_doctor && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#0f172a",
                            marginTop: "6px",
                            fontWeight: 600,
                          }}
                        >
                          Medico recomendado:{" "}
                          {aiSuggestion.suggested_doctor.full_name ||
                            aiSuggestion.suggested_doctor.username ||
                            `Medico #${aiSuggestion.suggested_doctor.id}`}
                        </div>
                      )}
                    </div>
                    {aiLoading && (
                      <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600 }}>
                        Atualizando...
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </fieldset>

          <div
            style={{
              marginBottom: "18px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid #dcebe2",
              background: "#f8fafc",
            }}
          >
            <label className="triage-label" style={{ marginBottom: "8px" }}>
              Sala Recomendada
            </label>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
              {recommendedRoomLabel ||
                (bypassToER ? "Sala de Reanimação / ER" : "Sem sala disponível no momento")}
            </div>
            {!bypassToER && (
              <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "4px" }}>
                Baseado na prioridade atual: {priorityLabel(priority)}
              </div>
            )}
            {!hasRoomAvailable && !bypassToER && (
              <div
                style={{ marginTop: "6px", fontSize: "11px", fontWeight: "700", color: "#b45309" }}
              >
                Nenhuma sala disponível para esta prioridade agora.
              </div>
            )}
          </div>

          <hr className="section-divider" />

          {erBypassRecommended && !bypassToER && (
            <div
              style={{
                marginBottom: "18px",
                padding: "14px 16px",
                borderRadius: "12px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
              }}
            >
              <div style={{ fontSize: "13px", fontWeight: "800", color: "#991b1b" }}>
                Sinais de risco de vida detectados
              </div>
              <div style={{ fontSize: "12px", color: "#7f1d1d", marginTop: "4px" }}>
                Este paciente pode seguir diretamente para a Sala de Reanimacao / ER sem aguardar
                a fila do medico.
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                {erBypassReasons.map((reason) => (
                  <span
                    key={reason}
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#991b1b",
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: "999px",
                      padding: "4px 8px",
                    }}
                  >
                    {reason}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBypassToER(true)}
                className="btn-primary"
                style={{ marginTop: "12px", width: "auto", padding: "10px 16px" }}
              >
                Encaminhar direto para ER
              </button>
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label className="triage-label" style={{ marginBottom: "10px" }}>
              Atribuir Médico
            </label>
            {assignableDoctors.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  background: "#fafafa",
                  border: "1.5px dashed #e5e7eb",
                  borderRadius: "10px",
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: "13px",
                }}
              >
                Nenhum médico disponível no momento
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
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
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                          {d.full_name || d.username || `Médico #${d.id}`}
                        </div>
                        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "1px" }}>
                          {d.specialization || "Clínica Geral"}
                        </div>
                      </div>
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: isBusyDoctor ? "#f59e0b" : "#165034",
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            )}
            <button
              onClick={assignDoctor}
              disabled={!visit?.id || !!visit?.doctor_id || assigning || !selectedDoctorId}
              className="btn-secondary"
              style={{ marginTop: "10px", fontSize: "13px" }}
            >
              {visit?.doctor_id
                ? "Médico já atribuído"
                : assigning
                  ? "Atribuindo..."
                  : "Confirmar Atribuição"}
            </button>
            {!hasDoctorAvailable && (
              <div
                style={{ marginTop: "8px", fontSize: "11px", color: "#b45309", fontWeight: "700" }}
              >
                Sem médico disponível agora. Pode manter em fila de espera.
              </div>
            )}
          </div>

          {selectedDoctorId && doctorQueueEtaById?.get?.(Number(selectedDoctorId)) && (
            <div
              style={{
                marginBottom: "20px",
                fontSize: "11px",
                color: "#4b5563",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "8px 10px",
                lineHeight: 1.45,
              }}
            >
              {assignableDoctors.some(
                (doctor) => Number(doctor?.id) === Number(selectedDoctorId) && Boolean(doctor?.is_busy)
              )
                ? "Medico ocupado, mas o paciente sera adicionado na fila deste medico. "
                : "Medico livre. "}
              {formatEtaLabel(doctorQueueEtaById.get(Number(selectedDoctorId)).etaMinutes)}.
            </div>
          )}

          <div style={{ marginBottom: "20px", display: "grid", gap: "8px" }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#374151",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={holdInWaitingLine}
                onChange={(e) => setHoldInWaitingLine(e.target.checked)}
              />
              Manter paciente na fila de espera quando não houver médico/sala disponível
            </label>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                color: "#374151",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={bypassToER}
                onChange={(e) => setBypassToER(e.target.checked)}
              />
              Caso super severo: bypass imediato para Sala de Reanimação / ER
            </label>
            {bypassToER && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#991b1b",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  fontWeight: "700",
                }}
              >
                Fluxo crítico ativo. O sistema regista bypass e não bloqueia por indisponibilidade
                de sala/médico.
              </div>
            )}
          </div>

          <div className="step-nav">
            <button
              type="button"
              onClick={() => setTriageStep(2)}
              className="btn-ghost"
              style={{ width: "auto", padding: "10px 20px" }}
            >
              Voltar
            </button>
            <button
              onClick={saveTriage}
              disabled={savingTriage || !visit?.id}
              className="btn-primary"
            >
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
