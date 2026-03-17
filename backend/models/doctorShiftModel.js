const pool = require("../config/db");

let ensureShiftColumnsPromise = null;
const ensureShiftBreakColumns = async () => {
  if (!ensureShiftColumnsPromise) {
    ensureShiftColumnsPromise = pool.query(
      `ALTER TABLE doctor_shift_sessions
         ADD COLUMN IF NOT EXISTS break_started_at TIMESTAMP NULL,
         ADD COLUMN IF NOT EXISTS break_total_minutes INTEGER NOT NULL DEFAULT 0`
    );
  }
  return ensureShiftColumnsPromise;
};

const getAssignmentByUserId = async (userId) => {
  const result = await pool.query(
    `SELECT user_id, shift_type, is_active
     FROM doctor_shift_assignments
     WHERE user_id = $1 AND is_active = TRUE
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const upsertAssignment = async (userId, shiftType) => {
  const result = await pool.query(
    `INSERT INTO doctor_shift_assignments (user_id, shift_type, is_active)
     VALUES ($1, $2, TRUE)
     ON CONFLICT (user_id)
     DO UPDATE SET shift_type = EXCLUDED.shift_type, is_active = TRUE
     RETURNING user_id, shift_type, is_active`,
    [userId, shiftType]
  );
  return result.rows[0] || null;
};

const getLatestSessionByUserId = async (userId) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `SELECT id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
            to_char(scheduled_start, 'HH24:MI') AS scheduled_start_hm,
            to_char(scheduled_end, 'HH24:MI') AS scheduled_end_hm,
            CASE WHEN extended_until IS NOT NULL THEN to_char(extended_until, 'HH24:MI') ELSE NULL END AS extended_until_hm,
            break_started_at, break_total_minutes
     FROM doctor_shift_sessions
     WHERE user_id = $1
     ORDER BY clock_in_at DESC NULLS LAST, id DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const createShiftSession = async ({
  userId,
  shiftType,
  scheduledStart,
  scheduledEnd,
  clockInAt,
  delayMinutes,
}) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `INSERT INTO doctor_shift_sessions
      (user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
               break_started_at, break_total_minutes`,
    [userId, shiftType, scheduledStart, scheduledEnd, clockInAt, delayMinutes]
  );
  return result.rows[0] || null;
};

const extendLatestSession = async (sessionId, minutes) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `UPDATE doctor_shift_sessions
     SET extended_until = COALESCE(extended_until, scheduled_end) + ($2::text || ' minutes')::interval
     WHERE id = $1
     RETURNING id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
               break_started_at, break_total_minutes`,
    [sessionId, minutes]
  );
  return result.rows[0] || null;
};

const stopLatestSession = async (sessionId) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `UPDATE doctor_shift_sessions
     SET extended_until = NOW(),
         break_started_at = NULL
     WHERE id = $1
     RETURNING id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
               break_started_at, break_total_minutes`,
    [sessionId]
  );
  return result.rows[0] || null;
};

const startBreak = async (sessionId) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `UPDATE doctor_shift_sessions
     SET break_started_at = NOW()
     WHERE id = $1
       AND break_started_at IS NULL
     RETURNING id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
               break_started_at, break_total_minutes`,
    [sessionId]
  );
  return result.rows[0] || null;
};

const resumeBreak = async (sessionId) => {
  await ensureShiftBreakColumns();
  const result = await pool.query(
    `UPDATE doctor_shift_sessions
     SET extended_until = COALESCE(extended_until, scheduled_end) + (NOW() - break_started_at),
         break_total_minutes = COALESCE(break_total_minutes, 0) + GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (NOW() - break_started_at)) / 60))::int,
         break_started_at = NULL
     WHERE id = $1
       AND break_started_at IS NOT NULL
     RETURNING id, user_id, shift_type, scheduled_start, scheduled_end, clock_in_at, delay_minutes, extended_until,
               break_started_at, break_total_minutes`,
    [sessionId]
  );
  return result.rows[0] || null;
};

module.exports = {
  getAssignmentByUserId,
  upsertAssignment,
  getLatestSessionByUserId,
  createShiftSession,
  extendLatestSession,
  stopLatestSession,
  startBreak,
  resumeBreak,
};
