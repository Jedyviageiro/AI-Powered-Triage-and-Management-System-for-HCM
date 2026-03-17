import { LAB_SAMPLE_PROTOCOLS, toSafeDate } from "./doctorHelpers";

const LAB_OPERATION_START_HOUR = 7;
const LAB_OPERATION_START_MIN = 30;
const LAB_OPERATION_END_HOUR = 20;
const LAB_OPERATION_END_MIN = 0;
const LAB_BREAK_WINDOWS = [{ startHour: 13, startMin: 0, endHour: 14, endMin: 0 }];

const LAB_MACHINE_PROFILES = {
  POC: { queuePenalty: 4, trafficPenalty: 1, handoffMinutes: 3, shiftPenalty: 8 },
  CHEMISTRY: { queuePenalty: 12, trafficPenalty: 2, handoffMinutes: 10, shiftPenalty: 18 },
  IMAGING: { queuePenalty: 10, trafficPenalty: 2, handoffMinutes: 12, shiftPenalty: 20 },
  MICROBIOLOGY: { queuePenalty: 20, trafficPenalty: 2, handoffMinutes: 15, shiftPenalty: 24 },
  MANUAL: { queuePenalty: 8, trafficPenalty: 2, handoffMinutes: 8, shiftPenalty: 14 },
};

export const getLabMachineKey = (examType) => {
  const exam = String(examType || "").toUpperCase();
  if (exam === "MALARIA_RDT" || exam === "GLICEMIA_CAPILAR" || exam === "HIV_RAPIDO") return "POC";
  if (exam === "LAB_CENTRAL") return "CHEMISTRY";
  if (exam === "RAIO_X") return "IMAGING";
  if (exam === "CULTURA_HEMOCULTURA") return "MICROBIOLOGY";
  return "MANUAL";
};

export const countQueuedExamsOnSameMachine = (examType, rows = []) => {
  const machineKey = getLabMachineKey(examType);
  return (Array.isArray(rows) ? rows : []).filter((row) => {
    const rowExam = row?.lab_exam_type || row?.lab_tests;
    return getLabMachineKey(rowExam) === machineKey;
  }).length;
};

export const getExamTurnaroundRange = (examType) => {
  const exam = String(examType || "").toUpperCase();
  const rangeByExam = {
    MALARIA_RDT: [5, 30],
    GLICEMIA_CAPILAR: [5, 30],
    HIV_RAPIDO: [10, 45],
    LAB_CENTRAL: [90, 300],
    RAIO_X: [45, 180],
    PARASITOLOGIA_FEZES: [24 * 60, 48 * 60],
    CULTURA_HEMOCULTURA: [48 * 60, 72 * 60],
    OUTRO: [120, 360],
  };
  return rangeByExam[exam] || [90, 360];
};

const isLabBusinessDay = (dateLike) => {
  const d = toSafeDate(dateLike);
  if (!d) return true;
  const day = d.getDay();
  return day !== 0 && day !== 6;
};

export const getLabWindowStart = (dateLike) => {
  const d = toSafeDate(dateLike) || new Date();
  const next = new Date(d);
  next.setHours(LAB_OPERATION_START_HOUR, LAB_OPERATION_START_MIN, 0, 0);
  return next;
};

const getLabWindowEnd = (dateLike) => {
  const d = toSafeDate(dateLike) || new Date();
  const next = new Date(d);
  next.setHours(LAB_OPERATION_END_HOUR, LAB_OPERATION_END_MIN, 0, 0);
  return next;
};

const getLabBreakRangesForDate = (dateLike) => {
  const d = toSafeDate(dateLike) || new Date();
  return LAB_BREAK_WINDOWS.map((item) => {
    const start = new Date(d);
    start.setHours(item.startHour, item.startMin, 0, 0);
    const end = new Date(d);
    end.setHours(item.endHour, item.endMin, 0, 0);
    return { start, end };
  });
};

export const moveToNextLabBusinessStart = (dateLike) => {
  let cursor = toSafeDate(dateLike) || new Date();

  while (!isLabBusinessDay(cursor)) {
    cursor = new Date(getLabWindowStart(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  let start = getLabWindowStart(cursor);
  let end = getLabWindowEnd(cursor);
  while (!isLabBusinessDay(start)) {
    start.setDate(start.getDate() + 1);
    end.setDate(end.getDate() + 1);
  }

  if (cursor < start) cursor = new Date(start);
  if (cursor >= end) {
    const next = new Date(start);
    next.setDate(next.getDate() + 1);
    return moveToNextLabBusinessStart(next);
  }

  const activeBreak = getLabBreakRangesForDate(cursor).find(
    (range) => cursor >= range.start && cursor < range.end
  );
  if (activeBreak) return new Date(activeBreak.end);

  return cursor;
};

const alignToLabOperation = (dateLike) => moveToNextLabBusinessStart(dateLike);

const addLabWorkingMinutes = (dateLike, totalMinutes) => {
  let cursor = moveToNextLabBusinessStart(dateLike);
  let remainingMinutes = Math.max(0, Math.round(Number(totalMinutes) || 0));

  while (remainingMinutes > 0) {
    cursor = moveToNextLabBusinessStart(cursor);
    const dayEnd = getLabWindowEnd(cursor);
    const upcomingBreak = getLabBreakRangesForDate(cursor).find((range) => range.start > cursor);
    const segmentEnd = upcomingBreak && upcomingBreak.start < dayEnd ? upcomingBreak.start : dayEnd;
    const available = Math.max(0, Math.floor((segmentEnd.getTime() - cursor.getTime()) / 60000));

    if (available <= 0) {
      if (upcomingBreak && segmentEnd.getTime() === upcomingBreak.start.getTime()) {
        cursor = new Date(upcomingBreak.end);
      } else {
        const nextDay = new Date(dayEnd);
        nextDay.setMinutes(nextDay.getMinutes() + 1);
        cursor = moveToNextLabBusinessStart(nextDay);
      }
      continue;
    }

    if (available >= remainingMinutes) {
      return new Date(cursor.getTime() + remainingMinutes * 60000);
    }

    remainingMinutes -= available;
    if (upcomingBreak && segmentEnd.getTime() === upcomingBreak.start.getTime()) {
      cursor = new Date(upcomingBreak.end);
    } else {
      const nextDay = new Date(dayEnd);
      nextDay.setMinutes(nextDay.getMinutes() + 1);
      cursor = moveToNextLabBusinessStart(nextDay);
    }
  }

  return cursor;
};

export const estimateExamReadyMeta = ({
  examType,
  requestedAt,
  pendingCount = 0,
  sampleCollectedAt = null,
  scheduledCollectionAt = null,
  sameMachinePendingCount = 0,
  hospitalTrafficCount = 0,
}) => {
  const [minMins, maxMins] = getExamTurnaroundRange(examType);
  const machineProfile =
    LAB_MACHINE_PROFILES[getLabMachineKey(examType)] || LAB_MACHINE_PROFILES.MANUAL;
  const base = Math.round((minMins + maxMins) / 2);
  const scheduleAnchorRaw = sampleCollectedAt || scheduledCollectionAt || requestedAt;
  const req = alignToLabOperation(scheduleAnchorRaw);
  const hour = req.getHours();
  const demandPenalty = Math.max(
    0,
    (Math.max(1, Number(pendingCount) || 1) - 1) * Math.max(6, Math.round(minMins * 0.1))
  );
  const machinePenalty = Math.max(
    0,
    Math.round(Math.max(0, Number(sameMachinePendingCount) || 0) * machineProfile.queuePenalty)
  );
  const hospitalTrafficPenalty = Math.max(
    0,
    Math.round(Math.max(0, Number(hospitalTrafficCount) || 0) * machineProfile.trafficPenalty)
  );
  const lateAfternoonFactor = hour >= 17 ? 1.35 : hour >= 15 ? 1.18 : 1;
  const morningBacklogFactor = hour < 9 && pendingCount >= 5 ? 1.12 : 1;
  const shiftPenalty =
    hour >= 18
      ? machineProfile.shiftPenalty
      : hour >= 16
        ? Math.round(machineProfile.shiftPenalty * 0.6)
        : hour >= 12 && hour < 14
          ? Math.round(machineProfile.shiftPenalty * 0.4)
          : 0;
  const turnaroundMinutes = Math.max(
    minMins,
    Math.min(
      maxMins * 1.45,
      Math.round(
        (base +
          demandPenalty +
          machinePenalty +
          hospitalTrafficPenalty +
          machineProfile.handoffMinutes +
          shiftPenalty) *
          lateAfternoonFactor *
          morningBacklogFactor
      )
    )
  );
  const cursor = addLabWorkingMinutes(req, turnaroundMinutes);
  const etaMin = Math.max(minMins, Math.round((cursor.getTime() - req.getTime()) / 60000));
  return {
    etaMin,
    readyAt: cursor,
    processingStart: req,
    turnaroundMinutes,
    machineKey: getLabMachineKey(examType),
  };
};

export const formatEtaPt = (etaMin) => {
  const mins = Math.max(0, Number(etaMin) || 0);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
};

export const formatLabDateTimeLabel = (dateLike) => {
  const d = toSafeDate(dateLike);
  if (!d) return "-";
  return d.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getLabProgressTheme = (progress, isReady) => {
  const pct = Math.max(0, Math.min(100, Number(progress) || 0));
  if (isReady || pct >= 100) {
    return { text: "#047857", track: "#d1fae5", fill: "#10b981" };
  }
  if (pct < 35) {
    return { text: "#b45309", track: "#fde68a", fill: "#f59e0b" };
  }
  if (pct < 70) {
    return { text: "#b45309", track: "#fef3c7", fill: "#fbbf24" };
  }
  return { text: "#0f766e", track: "#ccfbf1", fill: "#14b8a6" };
};

export const getLabSampleProtocol = (examType) => {
  const key = String(examType || "").toUpperCase();
  return LAB_SAMPLE_PROTOCOLS[key] || null;
};
