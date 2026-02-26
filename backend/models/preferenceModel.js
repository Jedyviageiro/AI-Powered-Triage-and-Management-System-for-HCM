const pool = require("../config/db");

let ensurePreferencesTablePromise = null;
const ensurePreferencesTable = async () => {
  if (!ensurePreferencesTablePromise) {
    ensurePreferencesTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        emergency_phone VARCHAR(40) NULL,
        font_size VARCHAR(12) NOT NULL DEFAULT 'NORMAL' CHECK (font_size IN ('NORMAL','LARGE')),
        font_scale_percent INTEGER NOT NULL DEFAULT 100 CHECK (font_scale_percent IN (100,105)),
        notify_new_urgent BOOLEAN NOT NULL DEFAULT TRUE,
        notify_wait_over_30 BOOLEAN NOT NULL DEFAULT TRUE,
        notify_critical_alerts BOOLEAN NOT NULL DEFAULT TRUE,
        notify_shift_ending BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      ALTER TABLE user_preferences
        ADD COLUMN IF NOT EXISTS font_scale_percent INTEGER NOT NULL DEFAULT 100;
      ALTER TABLE user_preferences
        DROP CONSTRAINT IF EXISTS chk_user_preferences_font_scale_percent;
      ALTER TABLE user_preferences
        ADD CONSTRAINT chk_user_preferences_font_scale_percent
        CHECK (font_scale_percent IN (100,105));
      CREATE INDEX IF NOT EXISTS idx_user_preferences_updated_at ON user_preferences(updated_at DESC);
    `);
  }
  return ensurePreferencesTablePromise;
};

const getByUserId = async (userId) => {
  await ensurePreferencesTable();
  const result = await pool.query(
    `SELECT user_id, emergency_phone, font_size, font_scale_percent,
            notify_new_urgent, notify_wait_over_30, notify_critical_alerts, notify_shift_ending
     FROM user_preferences
     WHERE user_id = $1
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const upsertByUserId = async (userId, payload = {}) => {
  await ensurePreferencesTable();
  const result = await pool.query(
    `INSERT INTO user_preferences (
        user_id, emergency_phone, font_size, font_scale_percent,
        notify_new_urgent, notify_wait_over_30, notify_critical_alerts, notify_shift_ending
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (user_id) DO UPDATE SET
        emergency_phone = EXCLUDED.emergency_phone,
        font_size = EXCLUDED.font_size,
        font_scale_percent = EXCLUDED.font_scale_percent,
        notify_new_urgent = EXCLUDED.notify_new_urgent,
        notify_wait_over_30 = EXCLUDED.notify_wait_over_30,
        notify_critical_alerts = EXCLUDED.notify_critical_alerts,
        notify_shift_ending = EXCLUDED.notify_shift_ending,
        updated_at = NOW()
      RETURNING user_id, emergency_phone, font_size, font_scale_percent,
                notify_new_urgent, notify_wait_over_30, notify_critical_alerts, notify_shift_ending`,
    [
      userId,
      payload.emergency_phone ?? null,
      payload.font_size ?? "NORMAL",
      payload.font_scale_percent ?? 100,
      !!payload.notify_new_urgent,
      !!payload.notify_wait_over_30,
      !!payload.notify_critical_alerts,
      !!payload.notify_shift_ending,
    ]
  );
  return result.rows[0] || null;
};

module.exports = {
  getByUserId,
  upsertByUserId,
};
