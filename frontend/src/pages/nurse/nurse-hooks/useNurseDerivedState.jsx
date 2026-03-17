import { useCallback, useMemo } from "react";
import {
  NURSE_VIEW_ROUTES,
  PRIORITIES,
  buildLiveNurseNotifications,
  getShiftIcon,
  shouldShowNotificationByPreferences,
  ROOM_TYPES,
  calculateAgeYears,
  isValidNumber,
} from "../nurse-helpers/nurseHelpers";

export function useNurseDerivedState({
  navigate,
  locationPathname,
  setActiveView,
  queue,
  patient,
  patientHistory,
  pastVisitModal,
  pastVisits,
  shiftStatus,
  nowTs,
  localNotificationReads,
  notifications,
  preferences,
  priority,
  bypassToER,
  doctors,
  chiefComplaint,
  temperature,
  spo2,
  heartRate,
  respRate,
  weight,
  aiSuggestion,
  triageStep,
  queueSummary,
  loadingShift,
  startingShift,
}) {
  const openView = useCallback(
    (viewKey) => {
      setActiveView(viewKey);
      const path = NURSE_VIEW_ROUTES[viewKey];
      if (path && locationPathname !== path) navigate(path);
    },
    [locationPathname, navigate, setActiveView]
  );

  const selectedPriority = useMemo(() => PRIORITIES.find((p) => p.value === priority), [priority]);
  const availableDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === false), [doctors]);
  const busyDoctors = useMemo(() => doctors.filter((d) => d?.is_busy === true), [doctors]);
  const urgentQueue = useMemo(() => queue.filter((v) => v?.priority === "URGENT"), [queue]);
  const nonUrgentQueue = useMemo(() => queue.filter((v) => v?.priority !== "URGENT"), [queue]);
  const triageQueueRows = useMemo(
    () => queue.filter((v) => String(v?.status || "").toUpperCase() === "IN_TRIAGE"),
    [queue]
  );
  const triageUrgentQueue = useMemo(
    () => triageQueueRows.filter((v) => v?.priority === "URGENT"),
    [triageQueueRows]
  );
  const triageNonUrgentQueue = useMemo(
    () => triageQueueRows.filter((v) => v?.priority !== "URGENT"),
    [triageQueueRows]
  );
  const waitingQueueSections = useMemo(() => {
    const sections = [
      { key: "URGENT", label: "Urgentes", rows: [], color: "#ef4444", background: "#fff5f5" },
      {
        key: "LESS_URGENT",
        label: "Pouco Urgente",
        rows: [],
        color: "#f97316",
        background: "#fff7ed",
      },
      {
        key: "NON_URGENT",
        label: "Não Urgente",
        rows: [],
        color: "#165034",
        background: "#edf5f0",
      },
      {
        key: "LABS",
        label: "Exames Laboratoriais",
        rows: [],
        color: "#1d4ed8",
        background: "#eff6ff",
      },
      { key: "RETURNS", label: "Retornos", rows: [], color: "#7c3aed", background: "#f5f3ff" },
      { key: "OTHERS", label: "Outros", rows: [], color: "#6b7280", background: "#f8fafc" },
    ];
    const byKey = sections.reduce((acc, section) => ({ ...acc, [section.key]: section }), {});

    queue.forEach((row) => {
      const motive = String(row?.visit_motive || "").toUpperCase();
      const priorityValue = String(row?.priority || "").toUpperCase();
      const hasReturnReason = !!String(row?.return_visit_reason || "").trim();
      const isLab =
        motive === "LAB_SAMPLE_COLLECTION" || motive === "LAB_RESULTS" || !!row?.is_lab_followup;
      const isReturn = !isLab && hasReturnReason;
      const isOther = motive === "OTHER";

      let sectionKey = "OTHERS";
      if (isLab) sectionKey = "LABS";
      else if (isReturn) sectionKey = "RETURNS";
      else if (isOther) sectionKey = "OTHERS";
      else if (priorityValue === "URGENT") sectionKey = "URGENT";
      else if (priorityValue === "LESS_URGENT") sectionKey = "LESS_URGENT";
      else if (priorityValue === "NON_URGENT") sectionKey = "NON_URGENT";

      byKey[sectionKey].rows.push(row);
    });

    return sections.filter((section) => section.rows.length > 0);
  }, [queue]);
  const destinationRows = useMemo(
    () =>
      queue.filter((row) => {
        const hospital = String(row?.hospital_status || "")
          .trim()
          .toUpperCase();
        const disposition = String(row?.disposition_plan || "")
          .trim()
          .toUpperCase();
        return (
          hospital === "BED_REST" ||
          hospital === "IN_HOSPITAL" ||
          disposition === "BED_REST" ||
          disposition === "ADMIT_URGENT"
        );
      }),
    [queue]
  );
  const patientByVisitId = useMemo(() => {
    const map = new Map();
    queue.forEach((v) => {
      map.set(Number(v?.id), {
        full_name: v?.full_name || "-",
        clinical_code: v?.clinical_code || "-",
      });
    });
    return map;
  }, [queue]);
  const patientAgeYears = useMemo(
    () => calculateAgeYears(patient?.birth_date),
    [patient?.birth_date]
  );
  const pastVisitTimeline = useMemo(() => {
    const currentPatientId = Number(pastVisitModal?.visit?.patient_id);
    const patientVisitRows = pastVisits.filter(
      (row) => Number(row?.patient_id) === currentPatientId
    );
    const byVisitId = new Map(patientVisitRows.map((row) => [Number(row?.id), row]));
    return (Array.isArray(pastVisitModal.patientHistory) ? pastVisitModal.patientHistory : [])
      .map((row) => {
        const visitId = Number(row?.visit_id);
        const enriched = byVisitId.get(visitId) || {};
        return {
          ...row,
          ...enriched,
          id: visitId,
          visit_id: visitId,
          chief_complaint:
            row?.chief_complaint ?? enriched?.chief_complaint ?? enriched?.triage_chief_complaint,
          likely_diagnosis: row?.likely_diagnosis ?? enriched?.likely_diagnosis,
          prescription_text: row?.prescription_text ?? enriched?.prescription_text,
          doctor_full_name: enriched?.doctor_full_name,
          doctor_username: enriched?.doctor_username,
          doctor_specialization: enriched?.doctor_specialization,
          clinical_reasoning: enriched?.clinical_reasoning,
          hospital_status: enriched?.hospital_status,
          vital_status: enriched?.vital_status,
          is_deceased: enriched?.is_deceased,
          deceased_at: enriched?.deceased_at,
        };
      })
      .sort(
        (a, b) =>
          new Date(b?.arrival_time || 0).getTime() - new Date(a?.arrival_time || 0).getTime()
      );
  }, [pastVisitModal.patientHistory, pastVisitModal?.visit?.patient_id, pastVisits]);
  const pastVisitProfileRecord = pastVisitModal.patientProfile || null;
  const pastVisitProfileName =
    pastVisitProfileRecord?.full_name || pastVisitModal?.visit?.full_name || "-";
  const pastVisitProfileCode =
    pastVisitProfileRecord?.clinical_code || pastVisitModal?.visit?.clinical_code || "-";
  const pastVisitProfileDob = String(pastVisitProfileRecord?.birth_date || "").slice(0, 10);
  const pastVisitProfileAge = calculateAgeYears(pastVisitProfileDob);
  const pastVisitProfileGuardian = pastVisitProfileRecord?.guardian_name || "Nao informado";
  const pastVisitProfilePhone = pastVisitProfileRecord?.guardian_phone || "Nao informado";
  const pastVisitProfileAddress =
    pastVisitProfileRecord?.address ||
    pastVisitProfileRecord?.home_address ||
    pastVisitProfileRecord?.residential_address ||
    "Nao informado";
  const pastVisitProfilePhoto =
    pastVisitProfileRecord?.profile_photo_url ||
    pastVisitProfileRecord?.photo_url ||
    pastVisitProfileRecord?.avatar_url ||
    null;
  const roomTypeByPriority = useMemo(
    () => ROOM_TYPES.reduce((acc, type) => ({ ...acc, [type.priority]: type }), {}),
    []
  );
  const liveNotifications = useMemo(
    () =>
      buildLiveNurseNotifications({ queue, shiftStatus, nowTs, readMap: localNotificationReads }),
    [queue, shiftStatus, nowTs, localNotificationReads]
  );
  const allNotifications = useMemo(
    () =>
      [...liveNotifications, ...(Array.isArray(notifications) ? notifications : [])].sort(
        (a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
      ),
    [liveNotifications, notifications]
  );
  const filteredNotifications = useMemo(
    () => allNotifications.filter((n) => shouldShowNotificationByPreferences(n, preferences)),
    [allNotifications, preferences]
  );
  const notificationsUnread = useMemo(
    () => filteredNotifications.filter((n) => !n?.read_at).length,
    [filteredNotifications]
  );
  const latestNotification = useMemo(
    () => filteredNotifications[0] || null,
    [filteredNotifications]
  );
  const roomOccupancy = useMemo(() => {
    const byKey = ROOM_TYPES.reduce((acc, type) => ({ ...acc, [type.key]: 0 }), {});
    queue.forEach((v) => {
      if (!["WAITING_DOCTOR", "IN_CONSULTATION"].includes(v?.status)) return;
      const mappedType = roomTypeByPriority[v?.priority];
      if (mappedType) byKey[mappedType.key] += 1;
    });
    return byKey;
  }, [queue, roomTypeByPriority]);
  const roomInventory = useMemo(
    () =>
      ROOM_TYPES.map((type) => {
        const occupied = Math.min(type.total, Number(roomOccupancy[type.key] || 0));
        const rooms = Array.from({ length: type.total }, (_, idx) => {
          const available = idx >= occupied;
          return {
            roomNumber: idx + 1,
            label: `${type.shortTitle} ${idx + 1}`,
            status: available ? "available" : "occupied",
          };
        });
        return {
          ...type,
          occupied,
          available: Math.max(0, type.total - occupied),
          rooms,
        };
      }),
    [roomOccupancy]
  );
  const recommendedRoomType = useMemo(() => {
    if (bypassToER) return null;
    return roomTypeByPriority[priority] || null;
  }, [bypassToER, priority, roomTypeByPriority]);
  const recommendedRoomLabel = useMemo(() => {
    if (bypassToER) return "Sala de Reanimação / ER";
    if (availableDoctors.length === 0) return null;
    if (!recommendedRoomType) return null;
    const type = roomInventory.find((r) => r.key === recommendedRoomType.key);
    if (!type) return null;
    const firstAvailable = type.rooms.find((r) => r.status === "available");
    return firstAvailable?.label || null;
  }, [bypassToER, availableDoctors.length, recommendedRoomType, roomInventory]);
  const hasRoomAvailable = useMemo(() => {
    if (bypassToER) return true;
    return !!recommendedRoomLabel;
  }, [bypassToER, recommendedRoomLabel]);
  const hasDoctorAvailable = availableDoctors.length > 0;

  const latestRecordedWeight = useMemo(() => {
    if (!Array.isArray(patientHistory)) return null;
    for (const h of patientHistory) {
      if (h?.weight != null && Number.isFinite(Number(h.weight))) return Number(h.weight);
    }
    return null;
  }, [patientHistory]);
  const patientLabFollowup = useMemo(() => {
    const kind = String(patient?.lab_followup_kind || "").toUpperCase();
    if (!kind) return null;
    const readyAtRaw = patient?.latest_lab_result_ready_at || null;
    const readyAt = readyAtRaw ? new Date(readyAtRaw) : null;
    const readyLabel =
      readyAt && !Number.isNaN(readyAt.getTime())
        ? readyAt.toLocaleString("pt-PT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : null;
    return {
      kind,
      note: String(patient?.lab_followup_note || "").trim(),
      readyLabel,
      isResult: kind === "RESULT",
      isSample: kind === "SAMPLE",
    };
  }, [patient]);
  const skipTriageReturnEligible = useMemo(() => {
    if (!patient?.id) return false;
    const now = new Date();
    return (Array.isArray(patientHistory) ? patientHistory : []).some((entry) => {
      const status = String(entry?.status || "").toUpperCase();
      if (status === "CANCELLED") return false;
      const hasReturnReason = !!String(entry?.return_visit_reason || "").trim();
      const hasReturnDate = !!String(entry?.return_visit_date || "").trim();
      if (!hasReturnReason && !hasReturnDate) return false;
      if (
        ["WAITING_DOCTOR", "IN_CONSULTATION", "READY_FOR_REVIEW", "RETURN_SCHEDULED"].includes(
          status
        )
      )
        return true;
      if (hasReturnDate) {
        const date = new Date(entry.return_visit_date);
        if (!Number.isNaN(date.getTime())) {
          date.setHours(23, 59, 59, 999);
          if (date >= now) return true;
        }
      }
      return hasReturnReason;
    });
  }, [patient?.id, patientHistory]);
  const triageValidation = useMemo(() => {
    const hasChief = chiefComplaint.trim().length > 0;
    const okTemp = isValidNumber(temperature, { min: 25, max: 45 });
    const okSpo2 = isValidNumber(spo2, { min: 1, max: 100 });
    const okHR = isValidNumber(heartRate, { min: 20, max: 260 });
    const okRR = isValidNumber(respRate, { min: 5, max: 120 });
    const okWeight = isValidNumber(weight, { min: 0.5, max: 300 });
    return { hasChief, okTemp, okSpo2, okHR, okRR, okWeight };
  }, [chiefComplaint, temperature, spo2, heartRate, respRate, weight]);
  const triageFieldsOk = useMemo(
    () =>
      triageValidation.hasChief &&
      triageValidation.okTemp &&
      triageValidation.okSpo2 &&
      triageValidation.okHR &&
      triageValidation.okRR &&
      triageValidation.okWeight,
    [triageValidation]
  );
  const triageValidationErrors = useMemo(() => {
    const errors = [];
    if (!triageValidation.hasChief) errors.push("Queixa principal obrigatória.");
    if (!triageValidation.okTemp) errors.push("Temperatura inválida (25 a 45 °C).");
    if (!triageValidation.okSpo2) errors.push("SpO2 inválida (1 a 100%).");
    if (!triageValidation.okHR) errors.push("Frequência cardíaca inválida (20 a 260 bpm).");
    if (!triageValidation.okRR) errors.push("Frequência respiratória inválida (5 a 120 rpm).");
    if (!triageValidation.okWeight) errors.push("Peso inválido (0.5 a 300 kg).");
    return errors;
  }, [triageValidation]);
  const aiShortReason = useMemo(() => {
    if (!aiSuggestion) return "";
    if (Array.isArray(aiSuggestion?.reasons) && aiSuggestion.reasons.length > 0) {
      return aiSuggestion.reasons
        .map((r) => String(r || "").trim())
        .filter(Boolean)
        .slice(0, 1)
        .join("");
    }
    return String(
      aiSuggestion?.reason || aiSuggestion?.match_reason || aiSuggestion?.short_reason || ""
    ).trim();
  }, [aiSuggestion]);
  const inTriageCount = useMemo(
    () => queue.filter((v) => v?.status === "IN_TRIAGE").length,
    [queue]
  );
  const navSections = useMemo(
    () => [
      {
        title: "Dashboard",
        items: [
          {
            key: "home",
            label: "Dashboard",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Pacientes",
        items: [
          {
            key: "newTriage",
            label: "Nova Triagem",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            ),
          },
          {
            key: "queue",
            label: "Fila de Espera",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            ),
            badge: queue.length > 0 ? queue.length : null,
          },
          {
            key: "patientsInTriage",
            label: "Pacientes em Triagem",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h2.586a1 1 0 00.707-.293l1.414-1.414A1 1 0 0112.414 3h1.172a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H19a2 2 0 012 2v12a2 2 0 01-2 2z"
                />
              </svg>
            ),
            badge: inTriageCount > 0 ? inTriageCount : null,
          },
          {
            key: "quickSearch",
            label: "Pesquisa Rápida",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Fluxo e Recurso",
        items: [
          {
            key: "roomsAvailable",
            label: "Quartos Disponíveis",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7h18M5 7V5a2 2 0 012-2h10a2 2 0 012 2v2m-2 0v12m-10 0V7m-2 12h14"
                />
              </svg>
            ),
          },
          {
            key: "destination",
            label: "Destino",
            badge: destinationRows.length > 0 ? destinationRows.length : null,
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h11" />
              </svg>
            ),
          },
          {
            key: "doctors",
            label: "Médicos Disponíveis",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Histórico e Relatórios",
        items: [
          {
            key: "patients",
            label: "Pacientes Antigos",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ),
          },
          {
            key: "shiftReport",
            label: "Relatório do Turno",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17v-2m3 2V7m3 10v-4m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            ),
          },
        ],
      },
      {
        title: "Configurações",
        items: [
          {
            key: "notifications",
            label: "Notificações",
            badge: notificationsUnread > 0 ? notificationsUnread : null,
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
                />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            ),
          },
          {
            key: "preferences",
            label: "Preferências",
            icon: (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="3" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.02a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.02a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.02a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
                />
              </svg>
            ),
          },
        ],
      },
    ],
    [destinationRows.length, inTriageCount, notificationsUnread, queue.length]
  );
  const triageSteps = useMemo(
    () => [
      { num: 1, label: "Registo" },
      { num: 2, label: "Triagem" },
      { num: 3, label: "Fila de Espera" },
    ],
    []
  );
  const getStepStatus = useCallback(
    (stepNum) => (stepNum < triageStep ? "done" : stepNum === triageStep ? "active" : "pending"),
    [triageStep]
  );
  const totalQueue = Number.isFinite(Number(queueSummary?.total))
    ? Number(queueSummary.total)
    : queue.length;
  const urgentCount = Number.isFinite(Number(queueSummary?.urgent))
    ? Number(queueSummary.urgent)
    : urgentQueue.length;
  const weeklyData = useMemo(() => [12, 19, 8, 24, 15, 30, totalQueue + 5], [totalQueue]);
  const shiftEndIso = shiftStatus?.extended_until || shiftStatus?.scheduled_end || null;
  const shiftRemainingMs = useMemo(() => {
    if (!shiftStatus?.clock_in_at || !shiftEndIso) return null;
    const endTs = new Date(shiftEndIso).getTime();
    if (!Number.isFinite(endTs)) return null;
    return Math.max(0, endTs - nowTs);
  }, [shiftStatus?.clock_in_at, shiftEndIso, nowTs]);
  const shiftRemainingLabel = useMemo(() => {
    if (shiftRemainingMs == null) return null;
    const totalSec = Math.floor(shiftRemainingMs / 1000);
    const h = String(Math.floor(totalSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [shiftRemainingMs]);
  const shiftIsActive = Boolean(shiftStatus?.is_on_shift);
  const shiftStartDisabled = loadingShift || startingShift || shiftIsActive;
  const shiftMenuBusy = startingShift;
  const shiftHasStartedToday = Boolean(shiftStatus?.has_started_today ?? shiftStatus?.clock_in_at);
  const shiftIcon = getShiftIcon(shiftStatus?.shift_type);
  const shiftButtonMeta = useMemo(() => {
    if (loadingShift) {
      return {
        label: "Turno",
        detail: "A carregar...",
        subdetail: "",
        border: "#d1d5db",
        background: "#f9fafb",
        color: "#4b5563",
        dot: "#9ca3af",
      };
    }
    if (shiftIsActive) {
      return {
        label: "Turno",
        detail: shiftRemainingLabel || "Ativo",
        subdetail: "",
        border: "#86efac",
        background: "#ecfdf3",
        color: "#166534",
        dot: "#22c55e",
      };
    }
    if (!shiftHasStartedToday) {
      return {
        label: "Turno",
        detail: "Iniciar turno",
        subdetail: "",
        border: "#d1d5db",
        background: "#ffffff",
        color: "#0c3a24",
        dot: "#9ca3af",
      };
    }
    return {
      label: "Turno",
      detail: "Encerrado",
      subdetail: "",
      border: "#d1d5db",
      background: "#f9fafb",
      color: "#475569",
      dot: "#94a3b8",
    };
  }, [loadingShift, shiftHasStartedToday, shiftIsActive, shiftRemainingLabel]);
  const recentQueueItems = useMemo(() => queue.slice(0, 6), [queue]);
  const getQueueRowBg = useCallback((idx, { urgent = false, isCritical = false } = {}) => {
    if (isCritical) return idx % 2 === 0 ? "#fef2f2" : "#fddede";
    if (urgent) return idx % 2 === 0 ? "#fff9f9" : "#ffecec";
    return idx % 2 === 0 ? "#ffffff" : "#e8f3ed";
  }, []);

  return {
    openView,
    selectedPriority,
    availableDoctors,
    busyDoctors,
    urgentQueue,
    nonUrgentQueue,
    triageQueueRows,
    triageUrgentQueue,
    triageNonUrgentQueue,
    waitingQueueSections,
    destinationRows,
    patientByVisitId,
    patientAgeYears,
    pastVisitTimeline,
    pastVisitProfileName,
    pastVisitProfileCode,
    pastVisitProfileDob,
    pastVisitProfileAge,
    pastVisitProfileGuardian,
    pastVisitProfilePhone,
    pastVisitProfileAddress,
    pastVisitProfilePhoto,
    liveNotifications,
    filteredNotifications,
    notificationsUnread,
    latestNotification,
    roomInventory,
    recommendedRoomLabel,
    hasRoomAvailable,
    hasDoctorAvailable,
    latestRecordedWeight,
    patientLabFollowup,
    skipTriageReturnEligible,
    triageValidation,
    triageFieldsOk,
    triageValidationErrors,
    aiShortReason,
    getQueueRowBg,
    inTriageCount,
    navSections,
    triageSteps,
    getStepStatus,
    totalQueue,
    urgentCount,
    weeklyData,
    shiftIsActive,
    shiftStartDisabled,
    shiftMenuBusy,
    shiftIcon,
    shiftButtonMeta,
    recentQueueItems,
  };
}
