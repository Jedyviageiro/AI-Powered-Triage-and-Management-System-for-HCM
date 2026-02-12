const pool = require('../config/db');

// ========================
// CREATE VISIT (chegada)
// ========================
const createVisit = async (patient_id) => {
    const result = await pool.query(
        `INSERT INTO visits (patient_id)
         VALUES ($1)
         RETURNING *`,
        [patient_id]
    );

    return result.rows[0];
};

// ========================
// GET VISIT BY ID
// ========================
const getVisitById = async (id) => {
    const result = await pool.query(
        `SELECT * FROM visits WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};

// ========================
// LIST ACTIVE VISITS (fila)
// ========================
const listActiveVisits = async () => {
    const result = await pool.query(
        `SELECT v.*, p.full_name, p.clinical_code
         FROM visits v
         JOIN patients p ON p.id = v.patient_id
         WHERE v.status NOT IN ('FINISHED','CANCELLED')
         ORDER BY v.priority DESC NULLS LAST, v.arrival_time ASC`
    );

    return result.rows;
};

// ========================
// SET TRIAGE RESULT
// ========================
const setTriagePriority = async (id, priority, max_wait_minutes) => {
  const result = await pool.query(
    `UPDATE visits
     SET priority = $1,
         max_wait_minutes = $2::int,
         reeval_at = NOW() + ($2::int * INTERVAL '1 minute'),
         status = 'WAITING_DOCTOR',
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [priority, max_wait_minutes, id]
  );

  return result.rows[0];
};


// ========================
// UPDATE STATUS
// ========================
const updateVisitStatus = async (id, status) => {
    const result = await pool.query(
        `UPDATE visits
         SET status = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [status, id]
    );

    return result.rows[0];
};

// ========================
// FINISH VISIT
// ========================
const finishVisit = async (id) => {
    const result = await pool.query(
        `UPDATE visits
         SET status = 'FINISHED',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
    );

    return result.rows[0];
};

module.exports = {
    createVisit,
    getVisitById,
    listActiveVisits,
    setTriagePriority,
    updateVisitStatus,
    finishVisit
};
