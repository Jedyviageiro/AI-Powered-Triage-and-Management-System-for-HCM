export default function DoctorConsultationPlanStep(props) {
  const {
    isFollowUpConsultation,
    consultationMode,
    previousPrescription,
    followUpPrescriptionDecision,
    setFollowUpPrescriptionDecision,
    ModernSelect,
    openModernSelect,
    setOpenModernSelect,
    FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS,
    planDraft,
    updatePlanField,
    labOrderCardRef,
    highlightLabOrderCard,
    _cancelSampleCollectionRequest,
    setLabOrderConfirmed,
    selectedLabProtocol,
    LAB_EXAM_OPTIONS,
    _updateLabExamType,
    labOrderDraft,
    setLabOrderDraft,
    setPlanAccepted,
    LAB_ORDER_PRIORITY_OPTIONS,
    labRequestSupport,
    findLabExamLabel,
    currentLabEtaPreview,
    selectedLabCollectionRule,
    formatEtaPt,
    _autoScheduleSampleCollectionReturn,
    labOrderConfirmed,
    _confirmLabOrder,
    DISPOSITION_OPTIONS,
    setReturnVisitCount,
    setReturnVisitDates,
    setFollowUpRuleKey,
    extractFollowUpTimeValue,
    setSelectedRoomCode,
    VITAL_STATUS_OPTIONS,
    isClinicalReturnVisit,
    resolvedFollowUpRuleKey,
    buildFollowUpReasonText,
    buildFollowUpInstructionsText,
    selectedReturnDate,
    selectedFollowUpTime,
    _updateReturnVisitDateByIndex,
    FOLLOW_UP_RULE_OPTIONS,
  } = props;

  const SelectComponent = ModernSelect;
  const isLabFocusedVisit =
    consultationMode === "LAB_RESULT_REVIEW" || consultationMode === "LAB_SAMPLE_COLLECTION";
  const hideLegacyBlocks = false;
  const defaultReturnDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  })();
  const labOrderLocked = !!labOrderConfirmed;
  const nextStepLabelStyle = {
    display: "block",
    marginBottom: 9,
    color: "#9aa3b2",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  };
  const nextStepInputStyle = {
    width: "100%",
    border: "1px solid #e7e9ed",
    borderRadius: 10,
    background: "#ffffff",
    color: "#161a23",
    font: "inherit",
    fontSize: 14,
    fontWeight: 600,
    outline: "none",
    padding: "11px 40px 11px 14px",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div className="cf-card">
        <div style={{ marginBottom: 14 }}>
          <div className="cf-label" style={{ marginBottom: 4 }}>
            Tratamento
          </div>
          <p style={{ margin: 0, color: "#64748b", fontSize: 12, lineHeight: 1.45 }}>
            Registe apenas a orientacao que a familia precisa seguir depois desta decisao.
          </p>
        </div>
        {isFollowUpConsultation && (
          <div style={{ display: "grid", gap: 12, marginBottom: 14 }}>
            <div>
              <label className="cf-label">Prescrição anterior</label>
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  background: "#f8faf9",
                  padding: "12px 14px",
                  fontSize: 13,
                  color: "#374151",
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                }}
              >
                {previousPrescription || "Sem prescrição anterior registada."}
              </div>
            </div>
            <div style={{ maxWidth: 320 }}>
              <label className="cf-label">Nova decisão sobre a prescrição</label>
              <SelectComponent
                selectId="follow-up-prescription-decision"
                value={followUpPrescriptionDecision}
                onChange={(e) => setFollowUpPrescriptionDecision(e.target.value)}
                openModernSelect={openModernSelect}
                setOpenModernSelect={setOpenModernSelect}
              >
                {FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </SelectComponent>
            </div>
          </div>
        )}
        <label className="cf-label">
          {isFollowUpConsultation ? "Nova prescrição / ajuste de prescrição" : "Prescrição"}
        </label>
        <textarea
          className="cf-textarea"
          style={{
            minHeight: 130,
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            fontWeight: 400,
            fontSize: 13,
          }}
          value={planDraft.prescription_text}
          onChange={(e) => updatePlanField("prescription_text", e.target.value)}
        />
      </div>

      <div
        ref={labOrderCardRef}
        className="cf-card"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          borderColor: highlightLabOrderCard ? "#86efac" : undefined,
          boxShadow: highlightLabOrderCard ? "0 0 0 4px rgba(134,239,172,0.22)" : undefined,
          transition: "box-shadow 0.25s ease, border-color 0.25s ease",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="cf-label" style={{ marginBottom: 4 }}>
              Exame laboratorial
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280", lineHeight: 1.5 }}>
              {isLabFocusedVisit
                ? "Confirme o exame ligado a este retorno e deixe a decisao clara para a equipa."
                : "Use esta area apenas quando precisar pedir ou acompanhar um exame."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (planDraft.lab_requested) {
                _cancelSampleCollectionRequest();
                return;
              }
              updatePlanField("lab_requested", true);
              setLabOrderConfirmed(false);
            }}
            className={planDraft.lab_requested ? "cf-btn-sec" : "cf-btn-primary"}
            style={{ width: "auto", justifyContent: "center", minWidth: 164 }}
          >
            {planDraft.lab_requested ? "Remover Pedido" : "Solicitar Exame"}
          </button>
        </div>

        {planDraft.lab_requested ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              border: "1px solid #dcebe2",
              borderRadius: 16,
              background: "linear-gradient(180deg,#f8fbf9 0%,#ffffff 100%)",
              padding: 16,
            }}
          >
            <div className="cf-grid-2">
              <div>
                <label className="cf-label">Tipo de exame</label>
                <SelectComponent
                  selectId="lab-exam-type"
                  value={planDraft.lab_exam_type || ""}
                  disabled={labOrderLocked}
                  openModernSelect={openModernSelect}
                  setOpenModernSelect={setOpenModernSelect}
                  onChange={(e) => _updateLabExamType(e.target.value)}
                >
                  {LAB_EXAM_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectComponent>
              </div>
              <div>
                <label className="cf-label">Prioridade do exame</label>
                <SelectComponent
                  selectId="lab-order-priority"
                  value={labOrderDraft.priority || ""}
                  disabled={labOrderLocked}
                  openModernSelect={openModernSelect}
                  setOpenModernSelect={setOpenModernSelect}
                  onChange={(e) => {
                    setLabOrderDraft((prev) => ({ ...prev, priority: e.target.value }));
                    setLabOrderConfirmed(false);
                    setPlanAccepted(false);
                  }}
                >
                  <option value="">Selecionar prioridade</option>
                  {LAB_ORDER_PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </SelectComponent>
              </div>
            </div>

            {selectedLabProtocol && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Amostra gerada
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {selectedLabProtocol.sampleType || "A definir"}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Quantidade
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#14532d" }}>
                    {selectedLabProtocol.quantity || "Conforme protocolo"}
                  </div>
                </div>
                <div hidden
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Fluxo do pedido
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#14532d" }}>
                    Médico solicita, laboratório confirma receção, resultado técnico segue para
                    interpretação médica.
                  </div>
                </div>
              </div>
            )}

            {String(planDraft.lab_exam_type || "").toUpperCase() === "OUTRO" && (
              <div>
                <label className="cf-label">Detalhe do exame</label>
                <input
                  className="cf-input"
                  placeholder="Especifique o exame pretendido"
                  value={planDraft.lab_tests || ""}
                  disabled={labOrderLocked}
                  onChange={(e) => {
                    updatePlanField("lab_tests", e.target.value);
                    setLabOrderConfirmed(false);
                  }}
                />
              </div>
            )}

            <div className="cf-grid-2">
              <div>
                <label className="cf-label">Motivo clínico (opcional)</label>
                <textarea
                  className="cf-textarea"
                  style={{ minHeight: 104 }}
                  placeholder="Descreva o que justifica este exame."
                  value={labOrderDraft.clinicalReason || ""}
                  disabled={labOrderLocked}
                  onChange={(e) => {
                    setLabOrderDraft((prev) => ({ ...prev, clinicalReason: e.target.value }));
                    setLabOrderConfirmed(false);
                    setPlanAccepted(false);
                  }}
                />
              </div>
              <div>
                <label className="cf-label">Instruções especiais</label>
                <textarea
                  className="cf-textarea"
                  style={{ minHeight: 104 }}
                  placeholder="Jejum, prioridade de processamento, recolha guiada, etc."
                  value={labOrderDraft.specialInstructions || ""}
                  disabled={labOrderLocked}
                  onChange={(e) => {
                    setLabOrderDraft((prev) => ({ ...prev, specialInstructions: e.target.value }));
                    setLabOrderConfirmed(false);
                    setPlanAccepted(false);
                  }}
                />
              </div>
            </div>

            {hideLegacyBlocks && (
            <div
              style={{
                border: "1px solid #dcebe2",
                borderRadius: 14,
                background: "#f8faf9",
                padding: "12px 14px",
                display: "grid",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Quando pedir exame
              </div>
              <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}>
                Solicite exames quando precisar confirmar uma doença suspeita ou obter dados
                adicionais para o diagnóstico.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {labRequestSupport.examples.map((example) => (
                  <span
                    key={example}
                    style={{
                      borderRadius: 999,
                      background: "#ffffff",
                      border: "1px solid #e5e7eb",
                      padding: "5px 10px",
                      fontSize: 11,
                      color: "#374151",
                    }}
                  >
                    {example}
                  </span>
                ))}
              </div>
              {labRequestSupport.primary && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    flexWrap: "wrap",
                    background: "#ffffff",
                    border: "1px solid #bbf7d0",
                    borderRadius: 12,
                    padding: "10px 12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                      Sugestão clínica: {labRequestSupport.primary.example}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 11, color: "#4b5563" }}>
                      Exame sugerido: {findLabExamLabel(labRequestSupport.primary.examType)}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cf-btn-sec"
                    style={{ width: "auto" }}
                    onClick={() => {
                      _updateLabExamType(labRequestSupport.primary.examType);
                      setLabOrderDraft((prev) => ({
                        ...prev,
                        clinicalReason:
                          prev.clinicalReason || labRequestSupport.primary.reasonTemplate,
                      }));
                    }}
                  >
                    Aplicar sugestão
                  </button>
                </div>
              )}
            </div>
            )}

            {hideLegacyBlocks && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Previsão
                  </div>
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700, color: "#111827" }}>
                    {currentLabEtaPreview
                      ? `${formatEtaPt(currentLabEtaPreview.etaMin)} · ${currentLabEtaPreview.readyAtLabel}`
                      : "A definir"}
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: "12px 14px",
                    background: "#ffffff",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Fluxo
                  </div>
                  <div style={{ marginTop: 4, fontSize: 13, fontWeight: 600, color: "#14532d" }}>
                    {selectedLabCollectionRule
                      ? `Colheita em retorno (${selectedLabCollectionRule.window})`
                      : "Colheita no fluxo atual"}
                  </div>
                </div>
              </div>
            )}

            {hideLegacyBlocks && (
              <div
                style={{
                  border: "1px solid #fde68a",
                  borderRadius: 14,
                  background: "#fffbeb",
                  padding: "12px 14px",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>
                  Coleta agendada para retorno
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
                  {selectedLabCollectionRule.warning}
                </p>
                <button
                  type="button"
                  onClick={_autoScheduleSampleCollectionReturn}
                  className="cf-btn-sec"
                  style={{ width: "auto", marginTop: 10 }}
                >
                  Agendar Retorno para Colheita
                </button>
              </div>
            )}

            {labOrderConfirmed ? (
              <div
                style={{
                  border: "1px solid #bbf7d0",
                  borderRadius: 14,
                  background: "#f0fdf4",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#166534" }}>
                    Pedido confirmado
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#166534" }}>
                    O exame será salvo com a consulta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLabOrderConfirmed(false)}
                  className="cf-btn-sec"
                  style={{ width: "auto" }}
                >
                  Editar Pedido
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={_confirmLabOrder}
                disabled={
                  !String(planDraft.lab_exam_type || "").trim() ||
                  !String(labOrderDraft.priority || "").trim()
                }
                className="cf-btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                Confirmar Pedido de Exame
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              border: "1px dashed #d1d5db",
              borderRadius: 16,
              padding: "16px 18px",
              background: "#fafaf9",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            Nenhum exame solicitado. Se precisar de apoio laboratorial, clique em Solicitar Exame.
          </div>
        )}
      </div>

      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e7e9ed",
          borderRadius: 14,
          boxShadow: "0 1px 2px rgba(16,24,40,0.04), 0 1px 6px rgba(16,24,40,0.03)",
          padding: "26px 28px 28px",
        }}
      >
        <div style={{ marginBottom: 22 }}>
          <div style={{ ...nextStepLabelStyle, marginBottom: 7 }}>
            Proximo passo
          </div>
          <p style={{ margin: 0, color: "#6c7689", fontSize: 13.5, lineHeight: 1.5 }}>
            Escolha para onde o paciente segue depois desta consulta.
          </p>
        </div>
        <div>
          <div style={{ marginBottom: planDraft.disposition_plan === "RETURN_VISIT" ? 26 : 0 }}>
            <label style={nextStepLabelStyle}>Destino do paciente</label>
            <SelectComponent
              selectId="disposition-plan"
              value={planDraft.disposition_plan}
              variant="box"
              openModernSelect={openModernSelect}
              setOpenModernSelect={setOpenModernSelect}
              onChange={(e) => {
                const nextDisposition = e.target.value;
                updatePlanField("disposition_plan", nextDisposition);
                if (nextDisposition !== "RETURN_VISIT") {
                  setReturnVisitCount(1);
                  setReturnVisitDates([""]);
                  setFollowUpRuleKey("");
                  updatePlanField("follow_up_when", "");
                } else {
                  const suggestedTime = extractFollowUpTimeValue(planDraft.follow_up_when) || "07:30";
                  const suggestedDate = selectedReturnDate || defaultReturnDate;
                  if (!selectedReturnDate) {
                    setReturnVisitDates([suggestedDate]);
                    updatePlanField("return_visit_date", suggestedDate);
                  }
                  updatePlanField("follow_up_when", suggestedTime);
                }
                if (nextDisposition !== "BED_REST") {
                  setSelectedRoomCode("");
                }
              }}
            >
              {DISPOSITION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </SelectComponent>
          </div>
          {hideLegacyBlocks && (
          <div>
            <label className="cf-label">Estado hospitalar</label>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                background: "#f8faf9",
                padding: "11px 14px",
                fontSize: 12,
                color: "#4b5563",
                lineHeight: 1.45,
              }}
            >
              A decisão clínica é do médico. O registo de internamento formal, transferência ou
              leito fica a cargo da enfermagem ou da equipa administrativa.
            </div>
          </div>
          )}
        </div>

        {hideLegacyBlocks && (
          <div
            style={{
              marginTop: 16,
              border: "1px solid #dcebe2",
              borderRadius: 16,
              background: "#f8faf9",
              padding: "16px 18px",
            }}
          >
            <div className="cf-label" style={{ marginBottom: 6 }}>
              Opções da decisão final
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.55 }}>
              O médico pode dar alta, agendar novo follow-up, solicitar exame ou referir para outra
              avaliação clínica, conforme a evolução.
            </p>
          </div>
        )}

        {planDraft.disposition_plan === "RETURN_VISIT" && (
          <div
            style={{
              width: "100%",
              border: "1px solid #eef0f3",
              borderLeft: "3px solid #0f6e54",
              borderRadius: 12,
              background: "#f7f9f8",
              padding: "18px 20px 20px",
              display: "grid",
              gap: 16,
            }}
          >
            {isClinicalReturnVisit ? (
              <div style={{ display: "grid", gap: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      border: "1px solid #cfe9dc",
                      borderRadius: 7,
                      background: "#ffffff",
                      color: "#0c5a44",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "0 0 auto",
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M21 3v5h-5" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                      <path d="M3 21v-5h5" />
                    </svg>
                  </div>
                  <div style={{ color: "#161a23", fontSize: 13.5, fontWeight: 700 }}>
                    Detalhes do retorno agendado
                  </div>
                </div>

                <div>
                  <label style={nextStepLabelStyle}>Criterio de retorno</label>
                  <SelectComponent
                    selectId="follow-up-rule"
                    value={resolvedFollowUpRuleKey}
                    variant="box"
                    openModernSelect={openModernSelect}
                    setOpenModernSelect={setOpenModernSelect}
                    onChange={(e) => {
                      const nextRuleKey = e.target.value;
                      setFollowUpRuleKey(nextRuleKey);
                      if (!String(planDraft.return_visit_reason || "").trim()) {
                        updatePlanField(
                          "return_visit_reason",
                          buildFollowUpReasonText(nextRuleKey, "")
                        );
                      }
                      if (!String(planDraft.follow_up_instructions || "").trim()) {
                        updatePlanField(
                          "follow_up_instructions",
                          buildFollowUpInstructionsText({
                            ruleKey: nextRuleKey,
                            date: selectedReturnDate,
                            time: selectedFollowUpTime || "",
                          })
                        );
                      }
                    }}
                  >
                    <option value="">Selecionar critério</option>
                    {FOLLOW_UP_RULE_OPTIONS.filter((o) => o.value !== "CHRONIC_RECURRING").map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </SelectComponent>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 16,
                    maxWidth: "100%",
                  }}
                >
                  <div>
                    <label style={nextStepLabelStyle}>Data de retorno</label>
                    <input
                      type="date"
                      value={selectedReturnDate}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => _updateReturnVisitDateByIndex(0, e.target.value)}
                      required
                      style={nextStepInputStyle}
                    />
                  </div>
                  <div>
                    <label style={nextStepLabelStyle}>Hora da consulta</label>
                    <input
                      type="time"
                      value={selectedFollowUpTime}
                      onChange={(e) =>
                        updatePlanField(
                          "follow_up_when",
                          extractFollowUpTimeValue(e.target.value) || e.target.value
                        )
                      }
                      required
                      style={nextStepInputStyle}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 16, maxWidth: 660 }}>
                <div>
                  <div style={nextStepLabelStyle}>Destino</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#161a23" }}>
                    Retorno laboratorial
                  </div>
                </div>
                <div>
                  <label style={nextStepLabelStyle}>Data de retorno</label>
                  <input
                    type="date"
                    value={selectedReturnDate}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => _updateReturnVisitDateByIndex(0, e.target.value)}
                    required
                    style={nextStepInputStyle}
                  />
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#6c7689", lineHeight: 1.45 }}>
                  Este retorno está ligado ao fluxo laboratorial. O horário segue a janela
                  operacional definida para a colheita ou entrega de resultado.
                </p>
              </div>
            )}
          </div>
        )}

        {planDraft.disposition_plan === "BED_REST" && (
          <div
            style={{
              marginTop: 16,
              border: "1px solid #dcebe2",
              borderRadius: 16,
              background: "#f8faf9",
              padding: "16px 18px",
            }}
          >
            <div className="cf-label" style={{ marginBottom: 6 }}>
              Repouso e observação
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.55 }}>
              O médico recomenda repouso ou observação clínica. Qualquer internamento formal,
              transferência ou atribuição de leito fica a cargo da enfermagem/administrativo
              conforme o fluxo do hospital.
            </p>
          </div>
        )}
        {planDraft.disposition_plan === "HOME" && (
          <div
            style={{
              marginTop: 16,
              border: "1px solid #dcebe2",
              borderRadius: 16,
              background: "#f8faf9",
              padding: "16px 18px",
            }}
          >
            <div className="cf-label" style={{ marginBottom: 6 }}>
              Alta do paciente
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.55 }}>
              O médico decide pela alta. Depois disso, a enfermagem ou a equipa administrativa
              conclui os procedimentos de saída, entrega as orientações e confirma o seguimento
              quando necessário.
            </p>
          </div>
        )}
        {planDraft.disposition_plan === "REFER_SPECIALIST" && (
          <div
            style={{
              marginTop: 16,
              border: "1px solid #dcebe2",
              borderRadius: 16,
              background: "#f8faf9",
              padding: "16px 18px",
            }}
          >
            <div className="cf-label" style={{ marginBottom: 6 }}>
              Referência para especialista
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "#4b5563", lineHeight: 1.55 }}>
              Use o motivo do destino para indicar o especialista ou departamento de referência e a
              razão clínica do encaminhamento.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
