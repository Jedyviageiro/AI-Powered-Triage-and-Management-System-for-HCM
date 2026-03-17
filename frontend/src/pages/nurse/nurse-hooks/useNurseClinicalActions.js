import { api } from "../../../lib/api";
import { PRIORITIES, isLabOrReturnQueueRow, parseNumberish } from "../nurse-helpers/nurseHelpers";

export function useNurseClinicalActions({
  patient,
  patientEditModal,
  pastVisitModal,
  destinationNotes,
  destinationPlacement,
  setPatient,
  setQueue,
  setQueueErr,
  setPatientEditModal,
  setPastVisitModal,
  setPastVisits,
  setDestinationNotes,
  setDestinationSavingId,
  loadQueue,
  showPopup,
  openConfirmPopup,
  closePatientEditModal,
  closePastVisitModal,
}) {
  const openPatientEditModal = async (visitRow) => {
    const patientId = Number(visitRow?.patient_id);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setQueueErr("Não foi possível identificar o paciente desta visita.");
      return;
    }

    setPatientEditModal({
      open: true,
      loading: true,
      saving: false,
      page: "patient",
      visitId: visitRow?.id || null,
      patientId,
      clinical_code: "",
      full_name: "",
      sex: "M",
      birth_date: "",
      guardian_name: "",
      guardian_phone: "",
      triageLoading: true,
      triageSaving: false,
      triageId: null,
      triage_temperature: "",
      triage_heart_rate: "",
      triage_respiratory_rate: "",
      triage_oxygen_saturation: "",
      triage_weight: "",
      triage_chief_complaint: "",
      triage_clinical_notes: "",
      triage_general_state: "",
      triage_needs_oxygen: false,
      triage_suspected_severe_dehydration: false,
      triage_excessive_lethargy: false,
      triage_difficulty_maintaining_sitting: false,
      triage_history_syncope_collapse: false,
      triage_priority: String(visitRow?.priority || "URGENT"),
      triage_max_wait_minutes:
        visitRow?.max_wait_minutes != null ? String(visitRow.max_wait_minutes) : "",
    });

    try {
      const [p, triageByVisit] = await Promise.all([
        api.getPatientById(patientId),
        visitRow?.id
          ? api.getTriageByVisitId(visitRow.id).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPatientEditModal((prev) => ({
        ...prev,
        loading: false,
        triageLoading: false,
        clinical_code: String(p?.clinical_code || ""),
        full_name: String(p?.full_name || ""),
        sex: String(p?.sex || "M"),
        birth_date: String(p?.birth_date || "").slice(0, 10),
        guardian_name: String(p?.guardian_name || ""),
        guardian_phone: String(p?.guardian_phone || ""),
        triageId: triageByVisit?.id ?? null,
        triage_temperature:
          triageByVisit?.temperature != null ? String(triageByVisit.temperature) : "",
        triage_heart_rate:
          triageByVisit?.heart_rate != null ? String(triageByVisit.heart_rate) : "",
        triage_respiratory_rate:
          triageByVisit?.respiratory_rate != null ? String(triageByVisit.respiratory_rate) : "",
        triage_oxygen_saturation:
          triageByVisit?.oxygen_saturation != null ? String(triageByVisit.oxygen_saturation) : "",
        triage_weight: triageByVisit?.weight != null ? String(triageByVisit.weight) : "",
        triage_chief_complaint: String(triageByVisit?.chief_complaint || ""),
        triage_clinical_notes: String(triageByVisit?.clinical_notes || ""),
        triage_general_state: String(triageByVisit?.general_state || ""),
        triage_needs_oxygen: !!triageByVisit?.needs_oxygen,
        triage_suspected_severe_dehydration: !!triageByVisit?.suspected_severe_dehydration,
        triage_excessive_lethargy: !!triageByVisit?.excessive_lethargy,
        triage_difficulty_maintaining_sitting: !!triageByVisit?.difficulty_maintaining_sitting,
        triage_history_syncope_collapse: !!triageByVisit?.history_syncope_collapse,
      }));
    } catch (e) {
      setPatientEditModal((prev) => ({ ...prev, loading: false, triageLoading: false }));
      setQueueErr(e.message);
    }
  };

  const savePatientEdit = async () => {
    const patientId = Number(patientEditModal?.patientId);
    if (!Number.isFinite(patientId) || patientId <= 0) return;

    const payload = {
      clinical_code: patientEditModal.clinical_code.trim(),
      full_name: patientEditModal.full_name.trim(),
      sex: patientEditModal.sex,
      birth_date: patientEditModal.birth_date,
      guardian_name: patientEditModal.guardian_name.trim(),
      guardian_phone: patientEditModal.guardian_phone.trim(),
    };

    if (
      !payload.clinical_code ||
      !payload.full_name ||
      !payload.sex ||
      !payload.birth_date ||
      !payload.guardian_name ||
      !payload.guardian_phone
    ) {
      setQueueErr("Preencha todos os campos do paciente.");
      return;
    }

    setPatientEditModal((prev) => ({ ...prev, saving: true }));
    setQueueErr("");
    try {
      const updated = await api.updatePatient(patientId, payload);
      if (Number(patient?.id) === patientId) setPatient(updated);
      await loadQueue();
      showPopup("success", "Paciente atualizado", "Dados do paciente atualizados com sucesso.");
      closePatientEditModal();
    } catch (e) {
      setQueueErr(e.message);
      setPatientEditModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const saveQueueTriageEdit = async () => {
    const visitId = Number(patientEditModal?.visitId);
    if (!Number.isFinite(visitId) || visitId <= 0) return;
    const chief = String(patientEditModal.triage_chief_complaint || "").trim();
    if (!chief) {
      setQueueErr("Queixa principal da triagem é obrigatória.");
      return;
    }

    const priorityValue = String(patientEditModal.triage_priority || "URGENT");
    const defaultMax = PRIORITIES.find((p) => p.value === priorityValue)?.maxWait ?? 60;
    const customMax = String(patientEditModal.triage_max_wait_minutes || "").trim();
    const maxWait = customMax === "" ? defaultMax : Number(customMax);
    if (!Number.isFinite(maxWait) || maxWait <= 0) {
      setQueueErr("Espera máxima inválida.");
      return;
    }

    setPatientEditModal((prev) => ({ ...prev, triageSaving: true }));
    setQueueErr("");
    try {
      const triagePayload = {
        temperature: parseNumberish(patientEditModal.triage_temperature),
        heart_rate: parseNumberish(patientEditModal.triage_heart_rate),
        respiratory_rate: parseNumberish(patientEditModal.triage_respiratory_rate),
        oxygen_saturation: parseNumberish(patientEditModal.triage_oxygen_saturation),
        weight: parseNumberish(patientEditModal.triage_weight),
        chief_complaint: chief,
        clinical_notes: String(patientEditModal.triage_clinical_notes || "").trim() || null,
        general_state: String(patientEditModal.triage_general_state || "").trim() || null,
        needs_oxygen: !!patientEditModal.triage_needs_oxygen,
        suspected_severe_dehydration: !!patientEditModal.triage_suspected_severe_dehydration,
        excessive_lethargy: !!patientEditModal.triage_excessive_lethargy,
        difficulty_maintaining_sitting: !!patientEditModal.triage_difficulty_maintaining_sitting,
        history_syncope_collapse: !!patientEditModal.triage_history_syncope_collapse,
      };

      if (patientEditModal.triageId) {
        await api.updateTriage(patientEditModal.triageId, triagePayload);
      } else {
        const created = await api.createTriage({ visit_id: visitId, ...triagePayload });
        setPatientEditModal((prev) => ({ ...prev, triageId: created?.id || prev.triageId }));
      }

      await api.setVisitPriority(visitId, { priority: priorityValue, max_wait_minutes: maxWait });
      await loadQueue();
      showPopup("success", "Triagem atualizada", "Informações da triagem atualizadas com sucesso.");
      closePatientEditModal();
    } catch (e) {
      setQueueErr(e.message);
      setPatientEditModal((prev) => ({ ...prev, triageSaving: false }));
    }
  };

  const startPastVisitPatientEdit = async () => {
    const patientId = Number(pastVisitModal?.visit?.patient_id);
    const visitId = Number(pastVisitModal?.visit?.id);
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setQueueErr("Não foi possível identificar o paciente deste histórico.");
      return;
    }
    setPastVisitModal((prev) => ({
      ...prev,
      editingPatient: true,
      patientLoading: true,
      patientSaving: false,
    }));
    try {
      const [p, triage] = await Promise.all([
        api.getPatientById(patientId),
        Number.isFinite(visitId) && visitId > 0
          ? api.getTriageByVisitId(visitId).catch(() => null)
          : Promise.resolve(null),
      ]);
      setPastVisitModal((prev) => ({
        ...prev,
        patientLoading: false,
        patientForm: {
          patientId,
          clinical_code: String(p?.clinical_code || ""),
          full_name: String(p?.full_name || ""),
          sex: String(p?.sex || "M"),
          birth_date: String(p?.birth_date || "").slice(0, 10),
          guardian_name: String(p?.guardian_name || ""),
          guardian_phone: String(p?.guardian_phone || ""),
          triage_id: triage?.id ?? null,
          triage_temperature: triage?.temperature ?? null,
          triage_heart_rate: triage?.heart_rate ?? null,
          triage_respiratory_rate: triage?.respiratory_rate ?? null,
          triage_oxygen_saturation: triage?.oxygen_saturation ?? null,
          triage_weight: triage?.weight ?? null,
          triage_clinical_notes: String(triage?.clinical_notes || ""),
          triage_general_state: String(triage?.general_state || ""),
          triage_needs_oxygen: !!triage?.needs_oxygen,
          triage_suspected_severe_dehydration: !!triage?.suspected_severe_dehydration,
          triage_excessive_lethargy: !!triage?.excessive_lethargy,
          triage_difficulty_maintaining_sitting: !!triage?.difficulty_maintaining_sitting,
          triage_history_syncope_collapse: !!triage?.history_syncope_collapse,
          chief_complaint: String(
            (
              triage?.chief_complaint ||
              prev?.visit?.chief_complaint ||
              prev?.visit?.triage_chief_complaint ||
              ""
            ).trim()
          ),
          likely_diagnosis: String(prev?.visit?.likely_diagnosis || ""),
          clinical_reasoning: String(prev?.visit?.clinical_reasoning || ""),
          prescription_text: String(prev?.visit?.prescription_text || ""),
          doctor_id: prev?.visit?.doctor_id != null ? String(prev.visit.doctor_id) : "",
          hospital_status: String(prev?.visit?.hospital_status || ""),
        },
      }));
    } catch (e) {
      setPastVisitModal((prev) => ({ ...prev, patientLoading: false }));
      setQueueErr(e.message);
    }
  };

  const savePastVisitPatientEdit = async () => {
    const patientId = Number(pastVisitModal?.patientForm?.patientId);
    const visitId = Number(pastVisitModal?.visit?.id);
    if (!Number.isFinite(patientId) || patientId <= 0) return;
    const payload = {
      clinical_code: String(pastVisitModal.patientForm.clinical_code || "").trim(),
      full_name: String(pastVisitModal.patientForm.full_name || "").trim(),
      sex: String(pastVisitModal.patientForm.sex || "M"),
      birth_date: String(pastVisitModal.patientForm.birth_date || ""),
      guardian_name: String(pastVisitModal.patientForm.guardian_name || "").trim(),
      guardian_phone: String(pastVisitModal.patientForm.guardian_phone || "").trim(),
    };
    if (
      !payload.clinical_code ||
      !payload.full_name ||
      !payload.sex ||
      !payload.birth_date ||
      !payload.guardian_name ||
      !payload.guardian_phone
    ) {
      setQueueErr("Preencha todos os campos do paciente.");
      return;
    }
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setQueueErr("Visita antiga inválida.");
      return;
    }

    setPastVisitModal((prev) => ({ ...prev, patientSaving: true }));
    setQueueErr("");
    try {
      const updatedPatient = await api.updatePatient(patientId, payload);
      const chiefComplaint = String(pastVisitModal.patientForm.chief_complaint || "").trim();
      if (pastVisitModal.patientForm.triage_id && chiefComplaint) {
        await api.updateTriage(pastVisitModal.patientForm.triage_id, {
          temperature: pastVisitModal.patientForm.triage_temperature,
          heart_rate: pastVisitModal.patientForm.triage_heart_rate,
          respiratory_rate: pastVisitModal.patientForm.triage_respiratory_rate,
          oxygen_saturation: pastVisitModal.patientForm.triage_oxygen_saturation,
          weight: pastVisitModal.patientForm.triage_weight,
          chief_complaint: chiefComplaint,
          clinical_notes:
            String(pastVisitModal.patientForm.triage_clinical_notes || "").trim() || null,
          general_state:
            String(pastVisitModal.patientForm.triage_general_state || "").trim() || null,
          needs_oxygen: !!pastVisitModal.patientForm.triage_needs_oxygen,
          suspected_severe_dehydration:
            !!pastVisitModal.patientForm.triage_suspected_severe_dehydration,
          excessive_lethargy: !!pastVisitModal.patientForm.triage_excessive_lethargy,
          difficulty_maintaining_sitting:
            !!pastVisitModal.patientForm.triage_difficulty_maintaining_sitting,
          history_syncope_collapse: !!pastVisitModal.patientForm.triage_history_syncope_collapse,
        });
      }

      await api.updatePastVisitSummary(visitId, {
        likely_diagnosis: String(pastVisitModal.patientForm.likely_diagnosis || "").trim() || null,
        clinical_reasoning:
          String(pastVisitModal.patientForm.clinical_reasoning || "").trim() || null,
        prescription_text:
          String(pastVisitModal.patientForm.prescription_text || "").trim() || null,
        doctor_id: pastVisitModal.patientForm.doctor_id
          ? Number(pastVisitModal.patientForm.doctor_id)
          : null,
        hospital_status:
          String(pastVisitModal.patientForm.hospital_status || "")
            .trim()
            .toUpperCase() || null,
      });

      setPastVisits((prev) =>
        prev.map((v) =>
          Number(v?.id) === visitId
            ? {
                ...v,
                full_name: updatedPatient?.full_name || v.full_name,
                clinical_code: updatedPatient?.clinical_code || v.clinical_code,
                chief_complaint: chiefComplaint || v.chief_complaint,
                triage_chief_complaint: chiefComplaint || v.triage_chief_complaint,
                likely_diagnosis:
                  String(pastVisitModal.patientForm.likely_diagnosis || "").trim() ||
                  v.likely_diagnosis,
                clinical_reasoning:
                  String(pastVisitModal.patientForm.clinical_reasoning || "").trim() ||
                  v.clinical_reasoning,
                prescription_text:
                  String(pastVisitModal.patientForm.prescription_text || "").trim() ||
                  v.prescription_text,
                doctor_id: pastVisitModal.patientForm.doctor_id
                  ? Number(pastVisitModal.patientForm.doctor_id)
                  : null,
                hospital_status:
                  String(pastVisitModal.patientForm.hospital_status || "")
                    .trim()
                    .toUpperCase() || null,
              }
            : v
        )
      );
      closePastVisitModal();
      showPopup(
        "success",
        "Dados atualizados",
        "Paciente e dados clínicos da visita foram atualizados com sucesso."
      );
    } catch (e) {
      closePastVisitModal();
      showPopup("warning", "Erro ao salvar", e.message || "Não foi possível atualizar os dados.");
    }
  };

  const removeVisitTriageFromQueue = (visitRow) => {
    const isLabOrReturn = isLabOrReturnQueueRow(visitRow);
    if (String(visitRow?.status || "").toUpperCase() === "IN_CONSULTATION") {
      showPopup(
        "warning",
        "Atenção",
        isLabOrReturn
          ? "Não é permitido remover da fila um paciente já em consulta."
          : "Não é permitido remover triagem de paciente já em consulta."
      );
      return;
    }
    const visitId = Number(visitRow?.id);
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setQueueErr(
        isLabOrReturn
          ? "Não foi possível identificar a visita para remover da fila."
          : "Não foi possível identificar a visita para remover a triagem."
      );
      return;
    }
    const patientName = String(visitRow?.full_name || "Paciente");
    openConfirmPopup({
      title: isLabOrReturn ? "Remover da fila" : "Remover triagem",
      message: isLabOrReturn
        ? `Tem certeza que deseja remover ${patientName} da fila atual? O paciente continuará registado no sistema.`
        : `Tem certeza que deseja remover a triagem de ${patientName}? O paciente continuará registado no sistema.`,
      confirmLabel: isLabOrReturn ? "Remover da Fila" : "Remover Triagem",
      onConfirm: async () => {
        try {
          await api.removeVisitTriage(visitId);
          setQueue((prev) => prev.filter((v) => Number(v?.id) !== visitId));
          await loadQueue();
          showPopup(
            "success",
            isLabOrReturn ? "Removido da fila" : "Triagem removida",
            isLabOrReturn
              ? "A visita foi removida da fila ativa."
              : "A triagem foi removida e a visita saiu da fila ativa."
          );
        } catch (e) {
          showPopup(
            "warning",
            "Atenção",
            e.message || (isLabOrReturn ? "Erro ao remover da fila." : "Erro ao remover triagem.")
          );
        }
      },
    });
  };

  const updateDestinationStatus = async (visitRow, hospitalStatus) => {
    const visitId = Number(visitRow?.id);
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setQueueErr("Não foi possível identificar a visita para atualizar o destino.");
      return;
    }
    setDestinationSavingId(visitId);
    try {
      await api.updateVisitDestinationStatus(visitId, {
        hospital_status: hospitalStatus,
        nurse_discharge_note: String(destinationNotes[visitId] || "").trim() || null,
      });
      setDestinationNotes((prev) => {
        const next = { ...(prev || {}) };
        delete next[visitId];
        return next;
      });
      await loadQueue();
      showPopup(
        "success",
        hospitalStatus === "TRANSFERRED" ? "Paciente transferido" : "Alta registrada",
        hospitalStatus === "TRANSFERRED"
          ? "O paciente foi marcado como transferido e removido da lista de destino."
          : "A alta foi registrada e o paciente foi removido da lista de destino."
      );
    } catch (e) {
      showPopup(
        "warning",
        "Atenção",
        e.message || "Não foi possível atualizar o destino do paciente."
      );
    } finally {
      setDestinationSavingId(null);
    }
  };

  const registerAdmissionPlacement = async (visitRow, hospitalStatus) => {
    const visitId = Number(visitRow?.id);
    if (!Number.isFinite(visitId) || visitId <= 0) {
      setQueueErr("Não foi possível identificar a visita para registrar a admissão.");
      return;
    }

    const draft = destinationPlacement[visitId] || {};
    const inpatientUnit = String(draft?.inpatient_unit || "").trim();
    const inpatientBed = String(draft?.inpatient_bed || "").trim();
    if (!inpatientBed) {
      showPopup(
        "warning",
        "Atenção",
        "Indique pelo menos o leito/local antes de registrar a admissão."
      );
      return;
    }

    setDestinationSavingId(visitId);
    try {
      await api.updateVisitAdmissionStatus(visitId, {
        hospital_status: hospitalStatus,
        inpatient_unit: inpatientUnit || null,
        inpatient_bed: inpatientBed,
        nurse_discharge_note: String(destinationNotes[visitId] || "").trim() || null,
      });
      await loadQueue();
      showPopup(
        "success",
        hospitalStatus === "IN_HOSPITAL" ? "Internamento registrado" : "Repouso registrado",
        hospitalStatus === "IN_HOSPITAL"
          ? "A admissão foi registrada e o leito foi atribuído ao paciente."
          : "O repouso foi registrado e o leito/local foi atribuído ao paciente."
      );
    } catch (e) {
      showPopup(
        "warning",
        "Atenção",
        e.message || "Não foi possível registrar a admissão do paciente."
      );
    } finally {
      setDestinationSavingId(null);
    }
  };

  return {
    openPatientEditModal,
    savePatientEdit,
    saveQueueTriageEdit,
    startPastVisitPatientEdit,
    savePastVisitPatientEdit,
    removeVisitTriageFromQueue,
    updateDestinationStatus,
    registerAdmissionPlacement,
  };
}
