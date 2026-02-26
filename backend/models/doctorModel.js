const pool = require("../config/db");

// Considera "online" se last_seen foi nos últimos X segundos.
// (O nurse panel vai chamar /doctors/availability frequentemente,
// então last_seen vai manter atualizado enquanto o médico estiver na app.)
const ONLINE_TTL_SECONDS = 60;

const listDoctorsWithAvailability = async () => {
  const result = await pool.query(`
    SELECT
      u.id,
      u.username,
      u.full_name,
      COALESCE(u.specialization, '') AS specialization,
      u.is_available,
      u.is_active,

      EXISTS (
        SELECT 1
        FROM visits v
        WHERE v.doctor_id = u.id
          AND (
            v.status = 'WAITING_DOCTOR'
            OR (
              v.status = 'IN_CONSULTATION'
              AND v.consultation_ended_at IS NULL
            )
          )
      ) AS is_busy,

      (
        SELECT v.id
        FROM visits v
        WHERE v.doctor_id = u.id
          AND (
            v.status = 'WAITING_DOCTOR'
            OR (
              v.status = 'IN_CONSULTATION'
              AND v.consultation_ended_at IS NULL
            )
          )
        ORDER BY
          CASE
            WHEN v.status = 'IN_CONSULTATION' THEN 1
            WHEN v.status = 'WAITING_DOCTOR' THEN 2
            ELSE 3
          END,
          COALESCE(v.consultation_started_at, v.updated_at, v.arrival_time) DESC
        LIMIT 1
      ) AS current_visit_id

    FROM users u
    WHERE u.role = 'DOCTOR'
      AND u.is_active = TRUE
    ORDER BY u.full_name ASC;
  `);

  return result.rows;
};
// Médico "entra" no sistema (marca online)
const checkin = async (doctorId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = TRUE,
        last_seen = NOW()
    WHERE id = $1
      AND role = 'DOCTOR'
      AND is_active = TRUE
    RETURNING id, is_online, last_seen;
  `,
    [doctorId]
  );

  return result.rows[0];
};

// Médico "sai" do sistema (marca offline)
const checkout = async (doctorId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = FALSE,
        is_available = FALSE,
        last_seen = NOW()
    WHERE id = $1
      AND role = 'DOCTOR'
      AND is_active = TRUE
    RETURNING id, is_online, is_available, last_seen;
  `,
    [doctorId]
  );

  return result.rows[0];
};

// Médico alterna disponibilidade (Disponível / Ocupado)
// Mesmo se ele estiver "online", isso controla se aparece como AVAILABLE.
const setAvailability = async (doctorId, isAvailable) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_available = $2,
        is_online = TRUE,        -- se o médico mexeu nisso, assume que está online
        last_seen = NOW()
    WHERE id = $1
      AND role = 'DOCTOR'
      AND is_active = TRUE
    RETURNING id, is_online, is_available, last_seen;
  `,
    [doctorId, isAvailable]
  );

  return result.rows[0];
};

// Opcional: "heartbeat" pra manter online (chamado por polling do frontend)
const heartbeat = async (doctorId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = TRUE,
        last_seen = NOW()
    WHERE id = $1
      AND role = 'DOCTOR'
      AND is_active = TRUE
    RETURNING id, is_online, last_seen;
  `,
    [doctorId]
  );
  return result.rows[0];
};

module.exports = {
  listDoctorsWithAvailability,
  checkin,
  checkout,
  setAvailability,
  heartbeat,
};
