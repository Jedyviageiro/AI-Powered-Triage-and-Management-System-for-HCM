const pool = require("../config/db");
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;
let ensureUserProfilePhotoColumnsPromise = null;

const ensureUserProfilePhotoColumns = async () => {
  if (!ensureUserProfilePhotoColumnsPromise) {
    ensureUserProfilePhotoColumnsPromise = pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_photo_public_id TEXT;
    `);
  }

  return ensureUserProfilePhotoColumnsPromise;
};

// ========================
// CREATE USER
// ========================
const createUser = async ({
  username,
  password,
  full_name,
  role,
  specialization = null,
  profile_photo_url = null,
  profile_photo_public_id = null,
}) => {
  await ensureUserProfilePhotoColumns();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = await pool.query(
    `INSERT INTO users (
        username,
        password_hash,
        full_name,
        role,
        specialization,
        profile_photo_url,
        profile_photo_public_id
      )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, full_name, specialization, role, is_active, profile_photo_url, profile_photo_public_id, created_at, updated_at, last_login_at`,
    [
      username,
      passwordHash,
      full_name,
      role,
      specialization,
      profile_photo_url,
      profile_photo_public_id,
    ]
  );

  return result.rows[0];
};

// ========================
// GET USER BY ID
// ========================
const getUserById = async (id) => {
  await ensureUserProfilePhotoColumns();
  const result = await pool.query(
    `SELECT id, username, full_name, specialization, role, is_active, profile_photo_url, profile_photo_public_id, created_at, updated_at, last_login_at
         FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

// ========================
// GET USER BY USERNAME (login)
// ========================
const getUserByUsername = async (username) => {
  await ensureUserProfilePhotoColumns();
  const result = await pool.query(
    `SELECT id, username, password_hash, full_name, specialization, role, is_active, profile_photo_url, profile_photo_public_id, created_at, updated_at, last_login_at
     FROM users
     WHERE username = $1`,
    [username]
  );
  return result.rows[0];
};

// ========================
// LIST USERS
// ========================
const listUsers = async () => {
  await ensureUserProfilePhotoColumns();
  const result = await pool.query(
    `SELECT
            u.id,
            u.username,
            u.full_name,
            u.specialization,
            u.role,
            u.is_active,
            u.profile_photo_url,
            u.profile_photo_public_id,
            u.created_at,
            u.updated_at,
            u.last_login_at,
            CASE
                WHEN u.role = 'NURSE' THEN nsa.shift_type
                WHEN u.role = 'DOCTOR' THEN dsa.shift_type
                ELSE NULL
            END AS assigned_shift_type
         FROM users u
         LEFT JOIN nurse_shift_assignments nsa
           ON nsa.user_id = u.id AND nsa.is_active = TRUE
         LEFT JOIN doctor_shift_assignments dsa
           ON dsa.user_id = u.id AND dsa.is_active = TRUE
         ORDER BY u.id ASC`
  );
  return result.rows;
};

const listUsersByRole = async (role, { onlyActive = true } = {}) => {
  await ensureUserProfilePhotoColumns();
  const normalizedRole = String(role || "")
    .trim()
    .toUpperCase();
  if (!normalizedRole) return [];

  const result = await pool.query(
    `SELECT
        id,
        username,
        full_name,
        specialization,
        role,
        is_active,
        profile_photo_url,
        profile_photo_public_id,
        created_at,
        updated_at,
        last_login_at
     FROM users
     WHERE role = $1
       AND ($2::boolean = FALSE OR is_active = TRUE)
     ORDER BY full_name ASC, id ASC`,
    [normalizedRole, !!onlyActive]
  );

  return result.rows;
};

// ========================
// UPDATE USER (dados)
// ========================
const updateUser = async (
  id,
  { username, full_name, role, is_active, specialization, profile_photo_url, profile_photo_public_id }
) => {
  await ensureUserProfilePhotoColumns();
  const result = await pool.query(
    `UPDATE users
     SET username   = COALESCE($1, username),
         full_name  = COALESCE($2, full_name),
         role       = COALESCE($3, role),
         is_active  = COALESCE($4, is_active),
         specialization = COALESCE($5, specialization),
         profile_photo_url = COALESCE($6, profile_photo_url),
         profile_photo_public_id = COALESCE($7, profile_photo_public_id),
         updated_at = NOW()
     WHERE id = $8
     RETURNING id, username, full_name, specialization, role, is_active, profile_photo_url, profile_photo_public_id, created_at, updated_at, last_login_at`,
    [
      username ?? null,
      full_name ?? null,
      role ?? null,
      is_active ?? null,
      specialization ?? null,
      profile_photo_url ?? null,
      profile_photo_public_id ?? null,
      id,
    ]
  );

  return result.rows[0];
};

// ========================
// UPDATE PASSWORD (admin reset)
// ========================
const updatePassword = async (id, newPassword) => {
  await ensureUserProfilePhotoColumns();
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const result = await pool.query(
    `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, username, full_name, specialization, role, is_active, profile_photo_url, profile_photo_public_id`,
    [passwordHash, id]
  );

  return result.rows[0];
};

// ========================
// DELETE USER
// ========================
const deleteUser = async (id) => {
  const result = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id, username, role`, [
    id,
  ]);
  return result.rows[0];
};

// ========================
// AUTHENTICATE LOGIN
// ========================
const authenticate = async (username, password) => {
  const user = await getUserByUsername(username);

  if (!user) return { ok: false, reason: "INVALID_CREDENTIALS" };
  if (!user.is_active) return { ok: false, reason: "ACCOUNT_DISABLED" };

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return { ok: false, reason: "INVALID_CREDENTIALS" };

  await pool.query(`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`, [
    user.id,
  ]);

  // remove password before returning
  delete user.password_hash;

  return { ok: true, user };
};

// ========================
// EXPORTS
// ========================
module.exports = {
  createUser,
  getUserById,
  getUserByUsername,
  listUsers,
  listUsersByRole,
  updateUser,
  updatePassword,
  deleteUser,
  authenticate,
};
