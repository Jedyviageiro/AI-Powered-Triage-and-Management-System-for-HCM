const nurseShiftModel = require("../models/nurseShiftModel");
const requireRoleNurse = (req) => String(req.user?.role || "").toUpperCase() === "NURSE";

const SHIFTS = {
  MORNING: { startHour: 7, startMinute: 30, endHour: 14, endMinute: 0 },
  AFTERNOON: { startHour: 14, startMinute: 0, endHour: 20, endMinute: 0 },
  NIGHT: { startHour: 20, startMinute: 0, endHour: 8, endMinute: 0 },
};

const toShiftMinutes = (date) => date.getHours() * 60 + date.getMinutes();

const isAnaNurse = (user) => {
  const role = String(user?.role || "").toUpperCase();
  const username = String(user?.username || "")
    .trim()
    .toLowerCase();
  const fullName = String(user?.full_name || "")
    .trim()
    .toLowerCase();
  if (role !== "NURSE") return false;

  const usernameParts = username.split(/[^a-z0-9]+/).filter(Boolean);
  const fullNameParts = fullName.split(/[^a-z0-9]+/).filter(Boolean);

  return usernameParts.includes("ana") || fullNameParts.includes("ana");
};

const getAssignedShiftType = async (user) => {
  const assignment = await nurseShiftModel.getAssignmentByUserId(user.id);
  if (assignment?.shift_type) return assignment.shift_type;
  if (isAnaNurse(user)) {
    const seeded = await nurseShiftModel.upsertAssignment(user.id, "AFTERNOON");
    return seeded?.shift_type || "AFTERNOON";
  }
  return null;
};

const buildSchedule = (type, now = new Date()) => {
  const cfg = SHIFTS[type];
  if (!cfg) return null;
  const anchor = new Date(now);
  if (
    type === "NIGHT" &&
    toShiftMinutes(anchor) < SHIFTS.NIGHT.endHour * 60 + SHIFTS.NIGHT.endMinute
  ) {
    anchor.setDate(anchor.getDate() - 1);
  }
  const start = new Date(anchor);
  start.setHours(cfg.startHour, cfg.startMinute, 0, 0);
  const end = new Date(anchor);
  end.setHours(cfg.endHour, cfg.endMinute, 0, 0);
  if (type === "NIGHT" && end <= start) end.setDate(end.getDate() + 1);
  return { start, end };
};

const isSameMinute = (a, b) =>
  a instanceof Date &&
  b instanceof Date &&
  !Number.isNaN(a.getTime()) &&
  !Number.isNaN(b.getTime()) &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate() &&
  a.getHours() === b.getHours() &&
  a.getMinutes() === b.getMinutes();

const isSessionFromCurrentShiftDay = (session, shiftType, now = new Date()) => {
  if (!session?.scheduled_start) return false;
  const currentSchedule = buildSchedule(shiftType, now);
  const sessionStart = new Date(session.scheduled_start);
  if (!currentSchedule || Number.isNaN(sessionStart.getTime())) return false;
  return isSameMinute(sessionStart, currentSchedule.start);
};

const isWithinShiftStartWindow = (shiftType, now = new Date()) => {
  const schedule = buildSchedule(shiftType, now);
  if (!schedule) return false;
  const nowTs = now.getTime();
  return nowTs >= schedule.start.getTime() && nowTs <= schedule.end.getTime();
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
  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    Number.isNaN(clockInAt.getTime())
  )
    return null;
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
  const nowDate = new Date();
  const currentSchedule = buildSchedule(shiftType, nowDate);
  const hasCurrentShiftSession = isSessionFromCurrentShiftDay(latestSession, shiftType, nowDate);
  const session = hasCurrentShiftSession ? latestSession : null;
  const schedule = session
    ? {
        start: new Date(session.scheduled_start),
        end: new Date(session.scheduled_end),
      }
    : currentSchedule;
  const clockInAt = session?.clock_in_at ? new Date(session.clock_in_at) : null;
  const extendedUntil = session?.extended_until ? new Date(session.extended_until) : null;
  const effectiveEnd = extendedUntil || schedule.end;
  const baseWindowFromDb =
    session?.scheduled_start_hm && session?.scheduled_end_hm
      ? `${session.scheduled_start_hm}-${session.scheduled_end_hm}`
      : null;
  const effectiveWindowFromDb =
    session?.scheduled_start_hm && (session?.extended_until_hm || session?.scheduled_end_hm)
      ? `${session.scheduled_start_hm}-${session.extended_until_hm || session.scheduled_end_hm}`
      : null;
  const extensionMinutes =
    session?.extended_until && session?.scheduled_end
      ? Math.max(
          0,
          Math.round(
            (new Date(session.extended_until).getTime() -
              new Date(session.scheduled_end).getTime()) /
              60000
          )
        )
      : 0;
  const now = Date.now();
  const isActive = isSessionActiveNow(session, new Date(now));

  return {
    assigned: true,
    has_started_today: Boolean(clockInAt),
    shift_type: shiftType,
    shift_window:
      effectiveWindowFromDb ||
      baseWindowFromDb ||
      (shiftType === "MORNING"
        ? "07:30-14:00"
        : shiftType === "AFTERNOON"
          ? "14:00-20:00"
          : "20:00-08:00"),
    original_shift_window:
      baseWindowFromDb ||
      (shiftType === "MORNING"
        ? "07:30-14:00"
        : shiftType === "AFTERNOON"
          ? "14:00-20:00"
          : "20:00-08:00"),
    is_extended: extensionMinutes > 0,
    extension_minutes: extensionMinutes,
    scheduled_start: schedule.start.toISOString(),
    scheduled_end: schedule.end.toISOString(),
    clock_in_at: clockInAt ? clockInAt.toISOString() : null,
    delay_minutes:
      session && Number.isFinite(Number(session.delay_minutes))
        ? Number(session.delay_minutes)
        : clockInAt
          ? toMinutesLate(clockInAt, schedule.start)
          : null,
    extended_until: extendedUntil ? extendedUntil.toISOString() : null,
    break_started_at: null,
    break_total_minutes: 0,
    is_on_break: false,
    is_on_shift: isActive,
    can_extend: isActive,
    can_break: false,
    can_resume: false,
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
    if (!shiftType)
      return res.status(400).json({ error: "Sem turno atribuído para este utilizador." });

    const schedule = buildSchedule(shiftType, new Date());
    const latestSession = await nurseShiftModel.getLatestSessionByUserId(req.user.id);
    const now = new Date();
    if (!isWithinShiftStartWindow(shiftType, now)) {
      return res.status(400).json({
        error:
          shiftType === "MORNING"
            ? "Fora da janela do turno da manhã (07:30-14:00)."
            : shiftType === "AFTERNOON"
              ? "Fora da janela do turno da tarde (14:00-20:00)."
              : "Fora da janela do turno da noite (20:00-08:00).",
      });
    }
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
    const minutesRaw = Number(req.body?.minutes ?? 60);
    const minutes = Number.isFinite(minutesRaw)
      ? Math.max(15, Math.min(240, Math.floor(minutesRaw)))
      : 60;

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
