const pool = require("../config/db");

let ensureNotificationsTablePromise = null;
const ensureNotificationsTable = async () => {
  if (!ensureNotificationsTablePromise) {
    ensureNotificationsTablePromise = pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(160) NOT NULL,
        message TEXT NOT NULL,
        level VARCHAR(20) NOT NULL DEFAULT 'INFO' CHECK (level IN ('INFO','WARNING','CRITICAL')),
        source VARCHAR(40) NULL,
        visit_id INTEGER NULL REFERENCES visits(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        read_at TIMESTAMP NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read_at);
    `);
  }
  return ensureNotificationsTablePromise;
};

const listByUserId = async (userId, limit = 100) => {
  await ensureNotificationsTable();
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Math.floor(Number(limit)))) : 100;
  const result = await pool.query(
    `SELECT id, user_id, title, message, level, source, visit_id, created_at, read_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, safeLimit]
  );
  return result.rows;
};

const getLatestByUserId = async (userId) => {
  await ensureNotificationsTable();
  const result = await pool.query(
    `SELECT id, user_id, title, message, level, source, visit_id, created_at, read_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
};

const countUnreadByUserId = async (userId) => {
  await ensureNotificationsTable();
  const result = await pool.query(
    `SELECT COUNT(*)::int AS unread_count
     FROM notifications
     WHERE user_id = $1 AND read_at IS NULL`,
    [userId]
  );
  return result.rows[0]?.unread_count || 0;
};

const markRead = async (id, userId) => {
  await ensureNotificationsTable();
  const result = await pool.query(
    `UPDATE notifications
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, title, message, level, source, visit_id, created_at, read_at`,
    [id, userId]
  );
  return result.rows[0] || null;
};

const markAllRead = async (userId) => {
  await ensureNotificationsTable();
  const result = await pool.query(
    `UPDATE notifications
     SET read_at = NOW()
     WHERE user_id = $1 AND read_at IS NULL
     RETURNING id`,
    [userId]
  );
  return result.rowCount || 0;
};

module.exports = {
  listByUserId,
  getLatestByUserId,
  countUnreadByUserId,
  markRead,
  markAllRead,
};

