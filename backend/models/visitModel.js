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
  const visitId = Number(id);
  if (!Number.isInteger(visitId) || visitId <= 0) return null;

  const result = await pool.query(`SELECT * FROM visits WHERE id = $1`, [visitId]);
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
       t.chief_complaint,
       n.full_name AS triage_nurse_name,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN LATERAL (
       SELECT t1.chief_complaint, t1.nurse_id
       FROM triage t1
       WHERE t1.visit_id = v.id
       ORDER BY t1.created_at DESC
       LIMIT 1
     ) t ON TRUE
     LEFT JOIN users n ON n.id = t.nurse_id
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
       t.chief_complaint,
       n.full_name AS triage_nurse_name,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN LATERAL (
       SELECT t1.chief_complaint, t1.nurse_id
       FROM triage t1
       WHERE t1.visit_id = v.id
       ORDER BY t1.created_at DESC
       LIMIT 1
     ) t ON TRUE
     LEFT JOIN users n ON n.id = t.nurse_id
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
       t.chief_complaint AS chief_complaint,
       v.likely_diagnosis,
       v.clinical_reasoning,
       v.prescription_text,
       v.disposition_plan,
       v.disposition_reason,
       v.follow_up_when,
       v.follow_up_instructions,
       v.follow_up_return_if,
       v.no_charge_chronic,
       v.no_charge_reason,
       v.return_visit_date,
       v.return_visit_reason,
       v.lab_requested,
       v.lab_exam_type,
       v.lab_tests,
       v.lab_sample_collected_at,
       v.lab_result_text,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.doctor_questionnaire_json,
       p.full_name,
       p.clinical_code,
       t.chief_complaint AS triage_chief_complaint,
       t.clinical_notes AS triage_clinical_notes,
       d.full_name AS doctor_full_name,
       d.username AS doctor_username,
       COALESCE(d.specialization, '') AS doctor_specialization
      FROM visits v
      JOIN patients p ON p.id = v.patient_id
      LEFT JOIN LATERAL (
        SELECT t1.chief_complaint, t1.clinical_notes
        FROM triage t1
        WHERE t1.visit_id = v.id
        ORDER BY t1.created_at DESC
        LIMIT 1
      ) t ON TRUE
      LEFT JOIN users d ON d.id = v.doctor_id
      WHERE v.status IN ('FINISHED','CANCELLED')
      ORDER BY COALESCE(v.consultation_ended_at, v.updated_at, v.arrival_time) DESC
      LIMIT $1`,
    [limit]
  );

  return result.rows;
};

const listDoctorAgenda = async (doctorId) => {
  const assignedTodayResult = await pool.query(
    `SELECT
       v.id,
       v.status,
       v.priority,
       v.arrival_time,
       v.return_visit_date,
       p.full_name,
       p.clinical_code
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     WHERE v.doctor_id = $1
       AND v.status IN ('WAITING_DOCTOR','IN_CONSULTATION')
       AND DATE(v.arrival_time) = CURRENT_DATE
     ORDER BY v.arrival_time ASC`,
    [doctorId]
  );

  const returnsTodayResult = await pool.query(
    `SELECT
       v.id,
       v.status,
       v.priority,
       v.arrival_time,
       v.return_visit_date,
       v.return_visit_reason,
       p.full_name,
       p.clinical_code
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     WHERE v.doctor_id = $1
       AND v.return_visit_date >= CURRENT_DATE
       AND v.status NOT IN ('CANCELLED')
     ORDER BY v.return_visit_date ASC, v.arrival_time ASC`,
     [doctorId]
  );

  return {
    assigned_today: assignedTodayResult.rows,
    returns_today: returnsTodayResult.rows,
  };
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
      AND status = 'IN_CONSULTATION'
      AND COALESCE(TRIM(likely_diagnosis), '') <> ''
      AND COALESCE(TRIM(clinical_reasoning), '') <> ''
      AND COALESCE(TRIM(prescription_text), '') <> ''
      AND COALESCE(TRIM(disposition_plan), '') <> ''
      AND EXISTS (
        SELECT 1
        FROM jsonb_each_text(
          CASE
            WHEN jsonb_typeof(doctor_questionnaire_json -> 'answers') = 'object'
              THEN doctor_questionnaire_json -> 'answers'
            WHEN jsonb_typeof(doctor_questionnaire_json) = 'object'
              THEN doctor_questionnaire_json
            ELSE '{}'::jsonb
          END
        ) AS qa(k, v)
        WHERE COALESCE(TRIM(v), '') <> ''
      )
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
  const nullIfBlank = (v) => {
    if (v == null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  };

  const params = [
    nullIfBlank(payload.likely_diagnosis),
    nullIfBlank(payload.clinical_reasoning),
    nullIfBlank(payload.prescription_text),
    nullIfBlank(payload.disposition_plan),
    nullIfBlank(payload.disposition_reason),
    nullIfBlank(payload.follow_up_when),
    nullIfBlank(payload.follow_up_instructions),
    nullIfBlank(payload.follow_up_return_if),
    !!payload.no_charge_chronic,
    nullIfBlank(payload.no_charge_reason),
    nullIfBlank(payload.return_visit_date),
    nullIfBlank(payload.return_visit_reason),
    !!payload.lab_requested,
    nullIfBlank(payload.lab_exam_type),
    nullIfBlank(payload.lab_tests),
    nullIfBlank(payload.lab_sample_collected_at),
    nullIfBlank(payload.lab_result_text),
    nullIfBlank(payload.lab_result_status),
    nullIfBlank(payload.lab_result_ready_at),
    payload.doctor_questionnaire_json ?? null,
    payload.accepted ? new Date() : null,
    payload.accepted ? actorId : null,
    id,
    actorId,
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
           lab_exam_type = $14,
           lab_tests = $15,
           lab_sample_collected_at = $16,
           lab_result_text = $17,
           lab_result_status = $18,
           lab_result_ready_at = $19,
            doctor_questionnaire_json = $20,
            plan_accepted_at = $21,
            plan_accepted_by = $22,
            updated_at = NOW()
       WHERE id = $23
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
         lab_exam_type = $14,
         lab_tests = $15,
         lab_sample_collected_at = $16,
         lab_result_text = $17,
         lab_result_status = $18,
          lab_result_ready_at = $19,
          doctor_questionnaire_json = $20,
          plan_accepted_at = $21,
          plan_accepted_by = $22,
          updated_at = NOW()
      WHERE id = $23
        AND status NOT IN ('FINISHED','CANCELLED')
        AND doctor_id = $24
      RETURNING *`,
    params
  );
  return result.rows[0];
};

const scheduleReturn = async (
  id,
  { return_visit_date = null, return_visit_reason = null } = {},
  { actorId = null, isAdmin = false } = {}
) => {
  const params = [return_visit_date, return_visit_reason, id, actorId];

  if (isAdmin) {
    const result = await pool.query(
      `UPDATE visits
       SET return_visit_date = $1,
           return_visit_reason = $2,
           updated_at = NOW()
       WHERE id = $3
         AND status NOT IN ('FINISHED','CANCELLED')
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  const result = await pool.query(
    `UPDATE visits
     SET return_visit_date = $1,
         return_visit_reason = $2,
         updated_at = NOW()
     WHERE id = $3
       AND status NOT IN ('FINISHED','CANCELLED')
       AND doctor_id = $4
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
  listDoctorAgenda,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
  assignDoctor,
  startConsultation,
  cancelVisit,
  editPriority,
  saveMedicalPlan,
  scheduleReturn,
};
