export const buildDoctorLabWorklistRows = ({
  pendingLabVisits,
  doctorLabReadyResults,
  doctorLabFollowupQueueRows,
  isLabReadyStatus,
  queue,
  labPendingRequests,
  toSafeDate,
  estimateExamReadyMeta,
  countQueuedExamsOnSameMachine,
  formatLabDateTimeLabel,
  formatEtaPt,
}) => {
  const byId = new Map();
  [...pendingLabVisits, ...doctorLabReadyResults, ...doctorLabFollowupQueueRows].forEach((row) => {
    if (!row?.id) return;
    const hasResult = !!String(row?.lab_result_text || "").trim();
    const ready = hasResult || isLabReadyStatus(row?.lab_result_status);
    const previous = byId.get(row.id);
    if (!previous || (ready && !previous.is_ready)) {
      byId.set(row.id, { ...row, is_ready: ready });
    }
  });

  const pendingLoad = Math.max(1, pendingLabVisits.length);
  const hospitalTrafficCount = Math.max(
    0,
    (Array.isArray(queue) ? queue.length : 0) +
      (Array.isArray(labPendingRequests) ? labPendingRequests.length : 0)
  );
  const sameMachineRows = [
    ...pendingLabVisits,
    ...doctorLabFollowupQueueRows,
    ...labPendingRequests,
  ];
  const nowTs = Date.now();

  return [...byId.values()]
    .map((row, index) => {
      const workflowStatus = String(row?.lab_result_status || "").toUpperCase();
      const sampleCollectedAt = toSafeDate(row?.lab_sample_collected_at);
      const isCollectionWorkflow =
        String(row?.visit_motive || "").toUpperCase() === "LAB_SAMPLE_COLLECTION" ||
        workflowStatus === "COLLECTION_PENDING" ||
        (!sampleCollectedAt && !row.is_ready);
      const scheduledCollectionAt =
        isCollectionWorkflow && row?.return_visit_date
          ? `${String(row.return_visit_date).slice(0, 10)}T07:30:00`
          : null;
      const requestedAt =
        sampleCollectedAt?.toISOString() ||
        scheduledCollectionAt ||
        row?.arrival_time ||
        new Date().toISOString();

      let readyAt = toSafeDate(row?.lab_result_ready_at);
      let etaMeta = null;
      if (!readyAt && !row.is_ready) {
        etaMeta = estimateExamReadyMeta({
          examType: row?.lab_exam_type || row?.lab_tests,
          requestedAt,
          pendingCount: Math.max(1, pendingLoad + index),
          sampleCollectedAt: sampleCollectedAt?.toISOString() || null,
          scheduledCollectionAt,
          sameMachinePendingCount: countQueuedExamsOnSameMachine(
            row?.lab_exam_type || row?.lab_tests,
            sameMachineRows
          ),
          hospitalTrafficCount,
        });
        readyAt = etaMeta.readyAt;
      }

      const etaMinutes =
        !row.is_ready && readyAt ? Math.max(0, Math.round((readyAt.getTime() - nowTs) / 60000)) : 0;
      const openedByLab = workflowStatus === "PROCESSING" || workflowStatus === "RECEIVED";
      const hasSample = !!sampleCollectedAt;
      const scheduledCollectionDate = toSafeDate(scheduledCollectionAt);
      const isFutureCollection =
        !!scheduledCollectionDate && scheduledCollectionDate.getTime() > nowTs && !hasSample;
      const processingStartedAt = hasSample
        ? sampleCollectedAt.getTime()
        : etaMeta?.processingStart?.getTime?.() || nowTs;
      const stateLabel = row.is_ready
        ? "Resultado pronto"
        : isFutureCollection
          ? "Coleta agendada"
          : hasSample
            ? "Em processamento"
            : openedByLab
              ? "Em revisão laboratorial"
              : "Aguarda colheita";

      const progressPercent = row.is_ready
        ? 100
        : isFutureCollection
          ? 6
          : hasSample && readyAt
            ? (() => {
                const totalWindow = Math.max(1, readyAt.getTime() - processingStartedAt);
                const remainingWindow = Math.max(0, readyAt.getTime() - nowTs);
                const pct = Math.round((1 - remainingWindow / totalWindow) * 100);
                return Math.max(38, Math.min(94, pct));
              })()
            : openedByLab
              ? 28
              : 12;

      const etaLabel = row.is_ready
        ? readyAt
          ? `Pronto desde ${formatLabDateTimeLabel(readyAt)}`
          : "Disponível agora"
        : isFutureCollection
          ? `Coleta em ${formatLabDateTimeLabel(scheduledCollectionDate)}`
          : !hasSample
            ? "Aguarda receção da amostra"
            : readyAt
              ? `~${formatEtaPt(etaMinutes)}`
              : "Sem estimativa";

      return {
        ...row,
        workflow_label:
          String(row?.visit_motive || "").toUpperCase() === "LAB_SAMPLE_COLLECTION"
            ? "Coleta"
            : String(row?.visit_motive || "").toUpperCase() === "LAB_RESULTS"
              ? "Resultado"
              : String(row?.lab_result_status || "").toUpperCase() === "COLLECTION_PENDING"
                ? "Coleta"
                : row.is_ready
                  ? "Resultado"
                  : "Coleta",
        eta_minutes: etaMinutes,
        eta_label: etaLabel,
        ready_at_label:
          !row.is_ready && !hasSample
            ? isFutureCollection && readyAt
              ? formatLabDateTimeLabel(readyAt)
              : "apos rececao"
            : readyAt
              ? formatLabDateTimeLabel(readyAt)
              : "-",
        state_label: stateLabel,
        patient_notified: !!row?.lab_patient_notified_at,
        patient_notified_label: row?.lab_patient_notified_at
          ? (() => {
              const notifiedAt = toSafeDate(row.lab_patient_notified_at);
              return notifiedAt
                ? `Paciente avisado as ${notifiedAt.toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Paciente avisado";
            })()
          : "Paciente ainda não avisado",
        progress_percent: progressPercent,
      };
    })
    .sort((a, b) => {
      if (a.is_ready !== b.is_ready) return a.is_ready ? 1 : -1;
      if ((a.eta_minutes || 0) !== (b.eta_minutes || 0))
        return (a.eta_minutes || 0) - (b.eta_minutes || 0);
      return new Date(a?.arrival_time || 0).getTime() - new Date(b?.arrival_time || 0).getTime();
    });
};

export const buildDoctorDashboardPriorityRows = ({ filteredQueue, dashboardPriorityMeta }) => {
  const counts = { URGENT: 0, LESS_URGENT: 0, NON_URGENT: 0 };
  filteredQueue.forEach((visit) => {
    const key = String(visit?.priority || "").toUpperCase();
    if (counts[key] != null) counts[key] += 1;
  });
  const total = Math.max(1, filteredQueue.length);
  return Object.entries(counts).map(([key, count]) => ({
    key,
    label: dashboardPriorityMeta[key]?.label || key,
    color: dashboardPriorityMeta[key]?.color || "#374151",
    bg: dashboardPriorityMeta[key]?.bg || "#f9fafb",
    count,
    pct: Math.round((count / total) * 100),
  }));
};

export const buildDoctorDashboardStatusRows = ({
  filteredQueueLength,
  waitingCount,
  inConsultCount,
  activeAlertCount,
}) => {
  const total = Math.max(1, filteredQueueLength);
  return [
    {
      key: "WAITING_DOCTOR",
      label: "Aguardando médico",
      count: waitingCount,
      color: "#a16207",
      bg: "#fef3c7",
    },
    {
      key: "IN_CONSULTATION",
      label: "Em consulta",
      count: inConsultCount,
      color: "#166534",
      bg: "#dcfce7",
    },
    {
      key: "URGENT_ALERTS",
      label: "Alertas urgentes",
      count: activeAlertCount,
      color: "#b91c1c",
      bg: "#fee2e2",
    },
  ].map((row) => ({ ...row, pct: Math.round((row.count / total) * 100) }));
};

export const buildDoctorDashboardNextPatients = ({ dashboardFocusQueue, dashboardPriorityMeta }) =>
  [...dashboardFocusQueue]
    .sort((a, b) => {
      const pa = dashboardPriorityMeta[String(a?.priority || "").toUpperCase()]?.rank ?? 99;
      const pb = dashboardPriorityMeta[String(b?.priority || "").toUpperCase()]?.rank ?? 99;
      if (pa !== pb) return pa - pb;
      const ta = new Date(a?.arrival_time || 0).getTime();
      const tb = new Date(b?.arrival_time || 0).getTime();
      return ta - tb;
    })
    .slice(0, 5);

export const buildDoctorDashboardHourSeries = ({ assignedToday }) => {
  const startHour = 6;
  const endHour = 13;
  const labels = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    labels.push(`${String(hour).padStart(2, "0")}h`);
  }
  const consults = labels.map(() => 0);
  const triages = labels.map(() => 0);

  const applyCount = (iso, target) => {
    if (!iso) return;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return;
    const idx = date.getHours() - startHour;
    if (idx < 0 || idx >= target.length) return;
    target[idx] += 1;
  };

  (Array.isArray(assignedToday) ? assignedToday : []).forEach((visit) => {
    applyCount(visit?.consultation_started_at || visit?.arrival_time, consults);
    applyCount(visit?.triage_completed_at || visit?.arrival_time, triages);
  });

  const max = Math.max(1, ...consults, ...triages);
  return { labels, consults, triages, max };
};

export const buildDoctorDashboardAlertPreview = ({ activeAlertRows, formatStatus }) => {
  const rows = Array.isArray(activeAlertRows) ? activeAlertRows : [];
  return rows.slice(0, 3).map((visit, idx) => ({
    id: visit?.id || idx,
    title: `${visit?.full_name || "Paciente"}${visit?.room_name ? ` - ${visit.room_name}` : ""}`,
    detail: `${formatStatus(visit?.status)}${visit?.arrival_time ? ` - ${new Date(visit.arrival_time).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}` : ""}`,
    tone: idx === 0 ? "red" : idx === 1 ? "orange" : "amber",
  }));
};
