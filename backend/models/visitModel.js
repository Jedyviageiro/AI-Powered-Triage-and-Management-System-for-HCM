const pool = require("../config/db");

// ========================
// CREATE VISIT (chegada)
// ========================
const createVisit = async (patient_id) => {
  const result = await pool.query(
    `INSERT INTO visits (patient_id, status, arrival_time)
     VALUES ($1, 'WAITING', NOW())
     RETURNING *`,
    [patient_id]
  );

  return result.rows[0];
};

// ========================
// GET VISIT BY ID
// ========================
const getVisitById = async (id) => {
  const result = await pool.query(`SELECT * FROM visits WHERE id = $1`, [id]);
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
// SET TRIAGE RESULT (priority + max_wait + status)
// ========================
const setTriagePriority = async (id, priority, max_wait_minutes) => {
  const result = await pool.query(
    `UPDATE visits
     SET priority = $1,
         max_wait_minutes = $2::int,
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
    `
    UPDATE visits
    SET status = 'FINISHED',
        consultation_ended_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );

  return result.rows[0];
};

// ========================
// ASSIGN DOCTOR (não muda status)
// ========================
const assignDoctor = async (visitId, doctorId) => {
  const result = await pool.query(
    `UPDATE visits
     SET doctor_id = $1,
         updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [doctorId, visitId]
  );
  return result.rows[0];
};

// ========================
// START CONSULTATION (PROTEGIDO)
// Só permite iniciar se:
// 1) status = WAITING_DOCTOR
// 2) existe triagem (triages.visit_id = visits.id)
// ========================
const startConsultation = async (visitId, doctorId) => {
  const result = await pool.query(
    `
    UPDATE visits v
    SET status = 'IN_CONSULTATION',
        doctor_id = $1,
        consultation_started_at = COALESCE(v.consultation_started_at, NOW()),
        consultation_ended_at = NULL,
        updated_at = NOW()
    WHERE v.id = $2
      AND v.status = 'WAITING_DOCTOR'
      AND EXISTS (SELECT 1 FROM triage t WHERE t.visit_id = v.id)
    RETURNING v.*;
    `,
    [doctorId, visitId]
  );

  return result.rows[0];
};


// CANCEL VISIT
const cancelVisit = async (id, reason, cancelledBy = null) => {
  const result = await pool.query(
    `UPDATE visits
     SET status = 'CANCELLED',
         cancel_reason = $2,
         cancelled_by = $3,
         cancelled_at = NOW(),
         updated_at = NOW()
     WHERE id = $1
       AND status NOT IN ('FINISHED','CANCELLED')
     RETURNING *`,
    [id, reason || null, cancelledBy]
  );

  return result.rows[0];
};

// EDIT TRIAGE PRIORITY (sem mexer em status se ainda não está WAITING_DOCTOR)
// Útil se o enfermeiro errou prioridade/max_wait depois de registrar.
const editPriority = async (id, priority, max_wait_minutes) => {
  const result = await pool.query(
    `UPDATE visits
     SET priority = $1,
         max_wait_minutes = $2::int,
         reeval_at = NOW() + ($2::int * INTERVAL '1 minute'),
         updated_at = NOW()
     WHERE id = $3
       AND status NOT IN ('FINISHED','CANCELLED')
     RETURNING *`,
    [priority, max_wait_minutes, id]
  );
  return result.rows[0];
};


module.exports = {
  createVisit,
  getVisitById,
  listActiveVisits,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
  assignDoctor,
  startConsultation,
  cancelVisit,
  editPriority,
};
