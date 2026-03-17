import { useCallback, useEffect } from "react";
import { api } from "../../../lib/api";
import { parseNumberish } from "../nurse-helpers/nurseHelpers";

export function useNurseTriageActions({
  visit,
  patient,
  selectedDoctorId,
  topNavSearch,
  searchMode,
  triageStep,
  triageFieldsOk,
  triageValidationErrors,
  patientAgeYears,
  chiefComplaint,
  clinicalNotes,
  temperature,
  heartRate,
  respRate,
  spo2,
  weight,
  latestRecordedWeight,
  bypassToER,
  recommendedRoomLabel,
  holdInWaitingLine,
  hasDoctorAvailable,
  hasRoomAvailable,
  needsOxygen,
  suspectedSevereDehydration,
  excessiveLethargy,
  difficultyMaintainingSitting,
  historySyncopeCollapse,
  generalState,
  customMaxWait,
  selectedPriority,
  priority,
  loadDoctors,
  loadQueue,
  resetAll,
  showPopup,
  searchPatient,
  createVisit,
  setErr,
  setAiLoading,
  setAiSuggestion,
  setPriority,
  setAssigning,
  setVisit,
  setSearchLoading,
  setActiveView,
  setSearchMode,
  setNameQuery,
  setSearchResults,
  setPatient,
  setSelectedDoctorId,
  setTriageStep,
  setForceTriageForLabFollowup,
  setSavingTriage,
}) {
  const requestAISuggestion = useCallback(async () => {
    if (!triageFieldsOk) {
      return;
    }
    setErr("");
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await api.aiTriageSuggest({
        age_years: patientAgeYears,
        chief_complaint: chiefComplaint.trim(),
        clinical_notes: clinicalNotes.trim() || null,
        temperature: parseNumberish(temperature),
        heart_rate: parseNumberish(heartRate),
        respiratory_rate: parseNumberish(respRate),
        oxygen_saturation: parseNumberish(spo2),
        weight: parseNumberish(weight),
      });
      setAiSuggestion(res);
      if (res?.suggested_priority) {
        setPriority(String(res.suggested_priority).toUpperCase());
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setAiLoading(false);
    }
  }, [
    chiefComplaint,
    clinicalNotes,
    heartRate,
    patientAgeYears,
    respRate,
    setAiLoading,
    setAiSuggestion,
    setErr,
    setPriority,
    spo2,
    temperature,
    triageFieldsOk,
    weight,
  ]);

  useEffect(() => {
    if (triageStep !== 2 || !visit?.id || !triageFieldsOk) {
      if (!triageFieldsOk) setAiSuggestion(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      requestAISuggestion();
    }, 450);
    return () => clearTimeout(timer);
  }, [requestAISuggestion, setAiSuggestion, triageFieldsOk, triageStep, visit?.id]);

  const assignDoctor = useCallback(async () => {
    if (!visit?.id) {
      setErr("Crie a visita antes de atribuir médico.");
      return;
    }
    if (!selectedDoctorId) {
      setErr("Selecione um médico disponível.");
      return;
    }
    setErr("");
    setAssigning(true);
    try {
      const updated = await api.assignDoctor(visit.id, Number(selectedDoctorId));
      setVisit(updated || visit);
      showPopup("success", "Atribuição concluída", "Paciente atribuído ao médico com sucesso.");
      await loadDoctors();
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setAssigning(false);
    }
  }, [loadDoctors, loadQueue, selectedDoctorId, setAssigning, setErr, setVisit, showPopup, visit]);

  const searchFromTopNav = useCallback(async () => {
    const q = topNavSearch.trim();
    if (!q) {
      showPopup("warning", "Pesquisa vazia", "Escreva um nome para pesquisar.");
      return;
    }
    setSearchLoading(true);
    setErr("");
    try {
      const data = await api.searchPatients(q);
      setActiveView("newTriage");
      setSearchMode("NAME");
      setNameQuery(q);
      setSearchResults(Array.isArray(data) ? data : []);
      setPatient(null);
      setVisit(null);
      setAiSuggestion(null);
      setSelectedDoctorId("");
      setTriageStep(1);
      setForceTriageForLabFollowup(false);
      if (!Array.isArray(data) || data.length === 0) {
        showPopup("warning", "Sem resultados", "Nenhum paciente encontrado com esse nome.");
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSearchLoading(false);
    }
  }, [
    setActiveView,
    setAiSuggestion,
    setErr,
    setForceTriageForLabFollowup,
    setNameQuery,
    setPatient,
    setSearchLoading,
    setSearchMode,
    setSearchResults,
    setSelectedDoctorId,
    setTriageStep,
    setVisit,
    showPopup,
    topNavSearch,
  ]);

  const saveTriage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!visit?.id) {
        setErr("Crie a visita (chegada) antes de registrar a triagem.");
        return;
      }
      if (!triageFieldsOk) {
        showPopup(
          "warning",
          "Não é possível concluir a triagem",
          triageValidationErrors.join("\n") || "Revise os dados."
        );
        return;
      }
      const currentWeight = parseNumberish(weight);
      if (currentWeight != null && latestRecordedWeight != null) {
        const ratio = currentWeight / latestRecordedWeight;
        if (ratio < 0.7 || ratio > 1.5) {
          setErr(`Peso inconsistente com histórico recente (${latestRecordedWeight} kg).`);
          return;
        }
      }
      setErr("");
      setSavingTriage(true);
      try {
        const flowNotes = [];
        if (bypassToER) flowNotes.push("Fluxo crítico: bypass para Sala de Reanimação / ER.");
        if (!bypassToER && recommendedRoomLabel)
          flowNotes.push(`Sala recomendada: ${recommendedRoomLabel}.`);
        if (holdInWaitingLine || (!bypassToER && (!hasDoctorAvailable || !hasRoomAvailable))) {
          flowNotes.push(
            "Encaminhamento: manter em fila de espera até haver médico e sala disponíveis."
          );
        }
        const mergedClinicalNotes = [clinicalNotes.trim(), ...flowNotes].filter(Boolean).join("\n");
        let triageAlreadyExisted = false;
        try {
          await api.createTriage({
            visit_id: visit.id,
            temperature: parseNumberish(temperature),
            heart_rate: parseNumberish(heartRate),
            respiratory_rate: parseNumberish(respRate),
            oxygen_saturation: parseNumberish(spo2),
            weight: parseNumberish(weight),
            chief_complaint: chiefComplaint.trim(),
            clinical_notes: mergedClinicalNotes || null,
            general_state: String(generalState || "").trim() || null,
            needs_oxygen: !!needsOxygen,
            suspected_severe_dehydration: !!suspectedSevereDehydration,
            excessive_lethargy: !!excessiveLethargy,
            difficulty_maintaining_sitting: !!difficultyMaintainingSitting,
            history_syncope_collapse: !!historySyncopeCollapse,
          });
        } catch (triageErr) {
          const msg = String(triageErr?.message || "");
          if (!/ja existe triagem/i.test(msg)) throw triageErr;
          triageAlreadyExisted = true;
        }
        const maxWait = customMaxWait !== "" ? Number(customMaxWait) : selectedPriority?.maxWait;
        await api.setVisitPriority(visit.id, { priority, max_wait_minutes: maxWait });
        if (selectedDoctorId) {
          await api.assignDoctor(visit.id, Number(selectedDoctorId));
        }

        const keepWaiting =
          !bypassToER && (holdInWaitingLine || !selectedDoctorId || !hasRoomAvailable);
        await loadDoctors();
        resetAll();
        await loadQueue();
        setActiveView("queue");
        if (bypassToER) {
          showPopup(
            "success",
            "Triagem crítica concluída",
            "Paciente marcado como bypass para Sala de Reanimação / ER."
          );
        } else if (keepWaiting) {
          showPopup(
            "success",
            "Triagem concluída",
            triageAlreadyExisted
              ? "Triagem já existia e foi finalizada com prioridade atualizada. Paciente permanece na fila."
              : "Triagem registrada. Paciente permanece na fila por indisponibilidade de sala/médico."
          );
        } else {
          showPopup(
            "success",
            "Triagem concluída",
            triageAlreadyExisted
              ? `Triagem já existia e foi finalizada com sucesso. Sala sugerida: ${recommendedRoomLabel || "definir na admissão"}.`
              : `Triagem registrada com sucesso. Sala sugerida: ${recommendedRoomLabel || "definir na admissão"}.`
          );
        }
      } catch (e2) {
        setErr(e2.message);
      } finally {
        setSavingTriage(false);
      }
    },
    [
      bypassToER,
      chiefComplaint,
      clinicalNotes,
      customMaxWait,
      difficultyMaintainingSitting,
      excessiveLethargy,
      generalState,
      hasDoctorAvailable,
      hasRoomAvailable,
      heartRate,
      historySyncopeCollapse,
      holdInWaitingLine,
      latestRecordedWeight,
      loadDoctors,
      loadQueue,
      needsOxygen,
      priority,
      recommendedRoomLabel,
      resetAll,
      respRate,
      selectedDoctorId,
      selectedPriority?.maxWait,
      setActiveView,
      setErr,
      setSavingTriage,
      showPopup,
      spo2,
      suspectedSevereDehydration,
      temperature,
      triageFieldsOk,
      triageValidationErrors,
      visit,
      weight,
    ]
  );

  const searchPatientByMode = useCallback(async () => {
    await searchPatient(searchMode);
  }, [searchMode, searchPatient]);

  const createVisitForCurrentPatient = useCallback(
    async (options = {}) => {
      await createVisit({ patient, ...(options || {}) });
    },
    [createVisit, patient]
  );

  return {
    requestAISuggestion,
    assignDoctor,
    searchFromTopNav,
    saveTriage,
    searchPatientByMode,
    createVisitForCurrentPatient,
  };
}
