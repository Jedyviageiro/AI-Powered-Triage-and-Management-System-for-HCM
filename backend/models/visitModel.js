const pool = require("../config/db");

// ========================
// CREATE VISIT (chegada)
// ========================
const findOpenVisitByPatientId = async (patient_id) => {
  const result = await pool.query(
    `SELECT *
     FROM visits
     WHERE patient_id = $1
       AND status NOT IN ('FINISHED','CANCELLED')
     ORDER BY updated_at DESC
     LIMIT 1`,
    [patient_id]
  );

  return result.rows[0];
};

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
    `SELECT
       v.*,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     WHERE v.status NOT IN ('FINISHED','CANCELLED')
     ORDER BY
       CASE v.priority
         WHEN 'URGENT' THEN 1
         WHEN 'LESS_URGENT' THEN 2
         WHEN 'NON_URGENT' THEN 3
         ELSE 4
       END ASC,
       v.arrival_time ASC`
  );

  return result.rows;
};

const listActiveVisitsByDoctor = async (doctorId) => {
  const result = await pool.query(
    `SELECT
       v.*,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     WHERE v.status NOT IN ('FINISHED','CANCELLED')
       AND v.doctor_id = $1
     ORDER BY
       CASE v.priority
         WHEN 'URGENT' THEN 1
         WHEN 'LESS_URGENT' THEN 2
         WHEN 'NON_URGENT' THEN 3
         ELSE 4
       END ASC,
       v.arrival_time ASC`,
    [doctorId]
  );

  return result.rows;
};

const listPastVisits = async (limit = 200) => {
  const result = await pool.query(
    `SELECT
       v.id,
       v.patient_id,
       v.doctor_id,
       v.status,
       v.priority,
       v.arrival_time,
       v.consultation_started_at,
       v.consultation_ended_at,
       v.likely_diagnosis,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username,
       COALESCE(d.specialization, '') AS doctor_specialization
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     WHERE v.status IN ('FINISHED','CANCELLED')
     ORDER BY COALESCE(v.consultation_ended_at, v.updated_at, v.arrival_time) DESC
     LIMIT $1`,
    [limit]
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
      AND v.doctor_id = $1
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

const saveMedicalPlan = async (
  id,
  payload,
  { actorId = null, isAdmin = false } = {}
) => {
  const params = [
    payload.likely_diagnosis ?? null,
    payload.clinical_reasoning ?? null,
    payload.prescription_text ?? null,
    payload.disposition_plan ?? null,
    payload.disposition_reason ?? null,
    payload.follow_up_when ?? null,
    payload.follow_up_instructions ?? null,
    payload.follow_up_return_if ?? null,
    !!payload.no_charge_chronic,
    payload.no_charge_reason ?? null,
    payload.return_visit_date ?? null,
    payload.return_visit_reason ?? null,
    !!payload.lab_requested,
    payload.lab_tests ?? null,
    payload.lab_sample_collected_at ?? null,
    payload.accepted ? new Date() : null,
    payload.accepted ? actorId : null,
    id,
  ];

  if (isAdmin) {
    const result = await pool.query(
      `UPDATE visits
       SET likely_diagnosis = $1,
           clinical_reasoning = $2,
           prescription_text = $3,
           disposition_plan = $4,
           disposition_reason = $5,
           follow_up_when = $6,
           follow_up_instructions = $7,
           follow_up_return_if = $8,
           no_charge_chronic = $9,
           no_charge_reason = $10,
           return_visit_date = $11,
           return_visit_reason = $12,
           lab_requested = $13,
           lab_tests = $14,
           lab_sample_collected_at = $15,
           plan_accepted_at = $16,
           plan_accepted_by = $17,
           updated_at = NOW()
       WHERE id = $18
         AND status NOT IN ('FINISHED','CANCELLED')
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `UPDATE visits
     SET likely_diagnosis = $1,
         clinical_reasoning = $2,
         prescription_text = $3,
         disposition_plan = $4,
         disposition_reason = $5,
         follow_up_when = $6,
         follow_up_instructions = $7,
         follow_up_return_if = $8,
         no_charge_chronic = $9,
         no_charge_reason = $10,
         return_visit_date = $11,
         return_visit_reason = $12,
         lab_requested = $13,
         lab_tests = $14,
         lab_sample_collected_at = $15,
         plan_accepted_at = $16,
         plan_accepted_by = $17,
         updated_at = NOW()
     WHERE id = $18
       AND status NOT IN ('FINISHED','CANCELLED')
       AND doctor_id = $17
     RETURNING *`,
    params
  );
  return result.rows[0];
};


module.exports = {
  findOpenVisitByPatientId,
  createVisit,
  getVisitById,
  listActiveVisits,
  listActiveVisitsByDoctor,
  listPastVisits,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
  assignDoctor,
  startConsultation,
  cancelVisit,
  editPriority,
  saveMedicalPlan,
};
