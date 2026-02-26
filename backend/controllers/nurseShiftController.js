const nurseShiftModel = require("../models/nurseShiftModel");
const requireRoleNurse = (req) => String(req.user?.role || "").toUpperCase() === "NURSE";

const SHIFTS = {
  MORNING: { startHour: 7, startMinute: 30, endHour: 13, endMinute: 0 },
  AFTERNOON: { startHour: 13, startMinute: 0, endHour: 20, endMinute: 0 },
  NIGHT: { startHour: 20, startMinute: 0, endHour: 7, endMinute: 30 },
};

const isAnaNurse = (user) => {
  const role = String(user?.role || "").toUpperCase();
  const username = String(user?.username || "").trim().toLowerCase();
  const fullName = String(user?.full_name || "").trim().toLowerCase();
  return role === "NURSE" && (username === "ana" || fullName === "ana");
};

const getAssignedShiftType = async (user) => {
  const assignment = await nurseShiftModel.getAssignmentByUserId(user.id);
  if (assignment?.shift_type) return assignment.shift_type;
  if (isAnaNurse(user)) {
    const seeded = await nurseShiftModel.upsertAssignment(user.id, "MORNING");
    return seeded?.shift_type || "MORNING";
  }
  return null;
};

const buildSchedule = (type, now = new Date()) => {
  const cfg = SHIFTS[type];
  if (!cfg) return null;
  const start = new Date(now);
  start.setHours(cfg.startHour, cfg.startMinute, 0, 0);
  const end = new Date(now);
  end.setHours(cfg.endHour, cfg.endMinute, 0, 0);
  if (type === "NIGHT" && end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
};

const toMinutesLate = (clockInAt, scheduledStart) => {
  if (!clockInAt || !scheduledStart) return 0;
  return Math.max(0, Math.floor((clockInAt.getTime() - scheduledStart.getTime()) / 60000));
};

const getSessionWindow = (session) => {
  if (!session?.clock_in_at || !session?.scheduled_start || !session?.scheduled_end) return null;
  const start = new Date(session.scheduled_start);
  const end = new Date(session.extended_until || session.scheduled_end);
  const clockInAt = new Date(session.clock_in_at);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || Number.isNaN(clockInAt.getTime())) return null;
  return { start, end, clockInAt };
};

const isSessionActiveNow = (session, now = new Date()) => {
  const window = getSessionWindow(session);
  if (!window) return false;
  const nowTs = now.getTime();
  if (nowTs < window.clockInAt.getTime() || nowTs > window.end.getTime()) return false;
  const maxSessionHours = 18;
  if (nowTs - window.clockInAt.getTime() > maxSessionHours * 60 * 60 * 1000) return false;
  return true;
};

const buildStatusPayload = async (user) => {
  const shiftType = await getAssignedShiftType(user);
  if (!shiftType) {
    return {
      assigned: false,
      message: "Nenhum turno atribuído para este utilizador.",
    };
  }

  const latestSession = await nurseShiftModel.getLatestSessionByUserId(user.id);
  const schedule = latestSession
    ? {
        start: new Date(latestSession.scheduled_start),
        end: new Date(latestSession.scheduled_end),
      }
    : buildSchedule(shiftType, new Date());
  const clockInAt = latestSession?.clock_in_at ? new Date(latestSession.clock_in_at) : null;
  const extendedUntil = latestSession?.extended_until ? new Date(latestSession.extended_until) : null;
  const effectiveEnd = extendedUntil || schedule.end;
  const now = Date.now();
  const isActive = isSessionActiveNow(latestSession, new Date(now));
  const onBreak = Boolean(latestSession?.break_started_at) && isActive;

  return {
    assigned: true,
    shift_type: shiftType,
    shift_window: shiftType === "MORNING" ? "07:30-13:00" : shiftType === "AFTERNOON" ? "13:00-20:00" : "20:00-07:30",
    scheduled_start: schedule.start.toISOString(),
    scheduled_end: schedule.end.toISOString(),
    clock_in_at: clockInAt ? clockInAt.toISOString() : null,
    delay_minutes:
      latestSession && Number.isFinite(Number(latestSession.delay_minutes))
        ? Number(latestSession.delay_minutes)
        : clockInAt
        ? toMinutesLate(clockInAt, schedule.start)
        : null,
    extended_until: extendedUntil ? extendedUntil.toISOString() : null,
    break_started_at: latestSession?.break_started_at ? new Date(latestSession.break_started_at).toISOString() : null,
    break_total_minutes: Number.isFinite(Number(latestSession?.break_total_minutes))
      ? Number(latestSession.break_total_minutes)
      : 0,
    is_on_break: onBreak,
    is_on_shift: isActive && !onBreak,
    can_extend: isActive && !onBreak,
    can_break: isActive && !onBreak,
    can_resume: isActive && onBreak,
    can_stop: isActive,
  };
};

const getShiftStatus = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    return res.json(await buildStatusPayload(req.user));
  } catch {
    return res.status(500).json({ error: "Erro ao consultar turno." });
  }
};

const startShift = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    const shiftType = await getAssignedShiftType(req.user);
    if (!shiftType) return res.status(400).json({ error: "Sem turno atribuído para este utilizador." });

    const schedule = buildSchedule(shiftType, new Date());
    const latestSession = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    const now = new Date();
    const isExistingActive = isSessionActiveNow(latestSession, now);

    if (!isExistingActive) {
      const delayMinutes = toMinutesLate(now, schedule.start);
      await nurseShiftModel.createShiftSession({
        userId: req.user.id,
        shiftType,
        scheduledStart: schedule.start,
        scheduledEnd: schedule.end,
        clockInAt: now,
        delayMinutes,
      });
    }

    const status = await buildStatusPayload(req.user);
    return res.json({
      message: "Turno iniciado com sucesso.",
      delay_minutes: status.delay_minutes ?? 0,
      status,
    });
  } catch {
    return res.status(500).json({ error: "Erro ao iniciar turno." });
  }
};

const extendShift = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    const session = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    if (!session?.clock_in_at || !isSessionActiveNow(session, new Date())) {
      return res.status(400).json({ error: "Inicie o turno antes de estender." });
    }
    if (session?.break_started_at) return res.status(400).json({ error: "Retome o turno antes de estender." });

    const minutesRaw = Number(req.body?.minutes ?? 60);
    const minutes = Number.isFinite(minutesRaw) ? Math.max(15, Math.min(240, Math.floor(minutesRaw))) : 60;

    await nurseShiftModel.extendLatestSession(session.id, minutes);
    return res.json({
      message: `Turno estendido em ${minutes} minutos.`,
      status: await buildStatusPayload(req.user),
    });
  } catch {
    return res.status(500).json({ error: "Erro ao estender turno." });
  }
};

const stopShift = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    const session = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    if (!session?.clock_in_at || !isSessionActiveNow(session, new Date())) {
      return res.status(400).json({ error: "Nenhum turno ativo para parar." });
    }
    await nurseShiftModel.stopLatestSession(session.id);
    return res.json({
      message: "Turno encerrado com sucesso.",
      status: await buildStatusPayload(req.user),
    });
  } catch {
    return res.status(500).json({ error: "Erro ao encerrar turno." });
  }
};

const startBreak = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    const session = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    if (!session?.clock_in_at || !isSessionActiveNow(session, new Date())) {
      return res.status(400).json({ error: "Inicie o turno antes de fazer pausa." });
    }
    if (session?.break_started_at) {
      return res.status(400).json({ error: "Turno já está em pausa." });
    }
    await nurseShiftModel.startBreak(session.id);
    return res.json({
      message: "Pausa iniciada.",
      status: await buildStatusPayload(req.user),
    });
  } catch {
    return res.status(500).json({ error: "Erro ao iniciar pausa." });
  }
};

const resumeBreak = async (req, res) => {
  try {
    if (!requireRoleNurse(req)) return res.status(403).json({ error: "Apenas enfermeiros." });
    const session = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    if (!session?.clock_in_at || !isSessionActiveNow(session, new Date())) {
      return res.status(400).json({ error: "Nenhum turno ativo para retomar." });
    }
    if (!session?.break_started_at) {
      return res.status(400).json({ error: "Turno não está em pausa." });
    }
    await nurseShiftModel.resumeBreak(session.id);
    return res.json({
      message: "Pausa encerrada. Turno retomado.",
      status: await buildStatusPayload(req.user),
    });
  } catch {
    return res.status(500).json({ error: "Erro ao retomar turno." });
  }
};

module.exports = {
  getShiftStatus,
  startShift,
  extendShift,
  stopShift,
  startBreak,
  resumeBreak,
};
