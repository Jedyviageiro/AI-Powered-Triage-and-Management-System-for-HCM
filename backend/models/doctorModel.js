const pool = require("../config/db");

// Considera "online" se last_seen foi nos últimos X segundos.
// (O nurse panel vai chamar /doctors/availability frequentemente,
// então last_seen vai manter atualizado enquanto o médico estiver na app.)
const ONLINE_TTL_SECONDS = 60;
const STALE_CONSULTATION_OFFLINE_MINUTES = 10;
const STALE_CONSULTATION_MAX_MINUTES = 180;

const recoverStaleConsultations = async () => {
  await pool.query(
    `
    UPDATE visits v
    SET status = 'WAITING_DOCTOR',
        consultation_started_at = NULL,
        updated_at = NOW()
    FROM users u
    WHERE v.doctor_id = u.id
      AND v.status = 'IN_CONSULTATION'
      AND v.consultation_ended_at IS NULL
      AND (
        (
          (
            u.is_online = FALSE
            OR u.last_seen IS NULL
            OR u.last_seen < NOW() - ($1::int * INTERVAL '1 minute')
          )
          AND COALESCE(v.updated_at, v.consultation_started_at, v.arrival_time)
            < NOW() - ($1::int * INTERVAL '1 minute')
        )
        OR (
          v.consultation_started_at IS NOT NULL
          AND v.consultation_started_at < NOW() - ($2::int * INTERVAL '1 minute')
        )
      )
    `,
    [STALE_CONSULTATION_OFFLINE_MINUTES, STALE_CONSULTATION_MAX_MINUTES]
  );
};

const listDoctorsWithAvailability = async () => {
  await recoverStaleConsultations();
  const result = await pool.query(`
    SELECT
      u.id,
      u.username,
      u.full_name,
      COALESCE(u.specialization, '') AS specialization,
      u.profile_photo_url,
      u.is_available,
      u.is_online,
      u.last_seen,
      u.is_active,
      CASE
        WHEN u.is_online = TRUE
         AND u.last_seen IS NOT NULL
         AND u.last_seen >= NOW() - ($1::int * INTERVAL '1 second')
        THEN TRUE
        ELSE FALSE
      END AS is_online_now,

      EXISTS (
        SELECT 1
        FROM visits v
        WHERE v.doctor_id = u.id
          AND v.status = 'IN_CONSULTATION'
          AND v.consultation_ended_at IS NULL
      ) AS is_busy,

      (
        SELECT v.id
        FROM visits v
        WHERE v.doctor_id = u.id
          AND (
            v.status = 'IN_CONSULTATION'
            OR v.status = 'WAITING_DOCTOR'
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
  `, [ONLINE_TTL_SECONDS]);

  return result.rows;
};
// Médico "entra" no sistema (marca online)
const checkin = async (doctorId) => {
  const result = await pool.query(
    `
    UPDATE users
    SET is_online = TRUE,
        is_available = TRUE,
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
