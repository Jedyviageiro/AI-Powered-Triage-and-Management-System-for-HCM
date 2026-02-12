const pool = require('../config/db');
const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;

// ========================
// CREATE USER
// ========================
const createUser = async ({ username, password, full_name, role }) => {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const result = await pool.query(
        `INSERT INTO users (username, password_hash, full_name, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, full_name, role, is_active, created_at, updated_at, last_login_at`,
        [username, passwordHash, full_name, role]
    );

    return result.rows[0];
};

// ========================
// GET USER BY ID
// ========================
const getUserById = async (id) => {
    const result = await pool.query(
        `SELECT id, username, full_name, role, is_active, created_at, updated_at, last_login_at
         FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};

// ========================
// GET USER BY USERNAME (login)
// ========================
const getUserByUsername = async (username) => {
    const result = await pool.query(
        `SELECT * FROM users WHERE username = $1`,
        [username]
    );
    return result.rows[0];
};

// ========================
// LIST USERS
// ========================
const listUsers = async () => {
    const result = await pool.query(
        `SELECT id, username, full_name, role, is_active, created_at, updated_at, last_login_at
         FROM users ORDER BY id ASC`
    );
    return result.rows;
};

// ========================
// UPDATE USER (dados)
// ========================
const updateUser = async (id, { username, full_name, role, is_active }) => {
  const result = await pool.query(
    `UPDATE users
     SET username   = COALESCE($1, username),
         full_name  = COALESCE($2, full_name),
         role       = COALESCE($3, role),
         is_active  = COALESCE($4, is_active),
         updated_at = NOW()
     WHERE id = $5
     RETURNING id, username, full_name, role, is_active, created_at, updated_at, last_login_at`,
    [username ?? null, full_name ?? null, role ?? null, is_active ?? null, id]
  );

  return result.rows[0];
};


// ========================
// UPDATE PASSWORD (admin reset)
// ========================
const updatePassword = async (id, newPassword) => {
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const result = await pool.query(
        `UPDATE users
         SET password_hash = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, username, full_name, role, is_active`,
        [passwordHash, id]
    );

    return result.rows[0];
};

// ========================
// DELETE USER
// ========================
const deleteUser = async (id) => {
    const result = await pool.query(
        `DELETE FROM users WHERE id = $1 RETURNING id, username, role`,
        [id]
    );
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

    await pool.query(
        `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
        [user.id]
    );

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
    updateUser,
    updatePassword,
    deleteUser,
    authenticate
};
