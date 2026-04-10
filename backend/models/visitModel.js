const pool = require("../config/db");

let ensureVisitMotiveColumnsPromise = null;
const ensureVisitMotiveColumns = async () => {
  if (!ensureVisitMotiveColumnsPromise) {
    ensureVisitMotiveColumnsPromise = pool.query(`
      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS visit_motive VARCHAR(40) NOT NULL DEFAULT 'MEDICAL_CONSULTATION';

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS visit_motive_other TEXT;
    `);
  }
  return ensureVisitMotiveColumnsPromise;
};

let ensureNurseDestinationColumnsPromise = null;
const ensureNurseDestinationColumns = async () => {
  if (!ensureNurseDestinationColumnsPromise) {
    ensureNurseDestinationColumnsPromise = pool.query(`
      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS nurse_discharge_note TEXT;
    `);
  }
  return ensureNurseDestinationColumnsPromise;
};

let ensureLabPatientNotificationColumnsPromise = null;
const ensureLabPatientNotificationColumns = async () => {
  if (!ensureLabPatientNotificationColumnsPromise) {
    ensureLabPatientNotificationColumnsPromise = pool.query(`
      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_patient_notified_at TIMESTAMP NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_patient_notified_by INTEGER NULL REFERENCES users(id) ON DELETE SET NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_patient_notification_note TEXT;
    `);
  }
  return ensureLabPatientNotificationColumnsPromise;
};

let ensureLabStructuredResultColumnsPromise = null;
const ensureLabStructuredResultColumns = async () => {
  if (!ensureLabStructuredResultColumnsPromise) {
    ensureLabStructuredResultColumnsPromise = pool.query(`
      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_sample_type TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_result_json JSONB;
    `);
  }
  return ensureLabStructuredResultColumnsPromise;
};

let ensureVisitHistoryColumnsPromise = null;
const ensureVisitHistoryColumns = async () => {
  if (!ensureVisitHistoryColumnsPromise) {
    ensureVisitHistoryColumnsPromise = pool.query(`
      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS hospital_status VARCHAR(30);

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS vital_status VARCHAR(20);

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS is_bedridden BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS inpatient_unit TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS inpatient_bed TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS discharged_at TIMESTAMP NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS doctor_questionnaire_json JSONB;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_requested BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_exam_type TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_tests TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_sample_collected_at TIMESTAMP NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_result_text TEXT;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_result_status VARCHAR(30);

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS lab_result_ready_at TIMESTAMP NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS return_visit_date DATE NULL;

      ALTER TABLE visits
      ADD COLUMN IF NOT EXISTS return_visit_reason TEXT;

      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN NOT NULL DEFAULT FALSE;

      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS deceased_at TIMESTAMP NULL;

      ALTER TABLE patients
      ADD COLUMN IF NOT EXISTS death_note TEXT;
    `);
  }

  await ensureLabStructuredResultColumns();
  return ensureVisitHistoryColumnsPromise;
};

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

const createVisit = async (
  patient_id,
  {
    visit_motive = "MEDICAL_CONSULTATION",
    visit_motive_other = null,
    return_visit_reason = null,
    status = "WAITING",
    priority = null,
    max_wait_minutes = null,
  } = {}
) => {
  await ensureVisitMotiveColumns();
  const result = await pool.query(
    `INSERT INTO visits (patient_id, status, arrival_time, visit_motive, visit_motive_other, return_visit_reason, priority, max_wait_minutes)
     VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      patient_id,
      status,
      visit_motive,
      visit_motive_other,
      return_visit_reason,
      priority,
      max_wait_minutes,
    ]
  );

  return result.rows[0];
};

// ========================
// GET VISIT BY ID
// ========================
const getVisitById = async (id) => {
  const visitId = Number(id);
  if (!Number.isInteger(visitId) || visitId <= 0) return null;

  await ensureLabStructuredResultColumns();
  const result = await pool.query(`SELECT * FROM visits WHERE id = $1`, [visitId]);
  return result.rows[0];
};

const getLabNotificationContextByVisitId = async (id) => {
  const visitId = Number(id);
  if (!Number.isInteger(visitId) || visitId <= 0) return null;

  await ensureLabPatientNotificationColumns();
  await ensureLabStructuredResultColumns();

  const result = await pool.query(
    `SELECT
       v.id AS visit_id,
       v.patient_id,
       v.doctor_id,
       v.lab_exam_type,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.lab_result_text,
       v.lab_patient_notified_at,
       p.full_name AS patient_full_name,
       p.guardian_name,
       p.guardian_phone,
       d.full_name AS doctor_full_name
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     WHERE v.id = $1
       AND v.lab_requested = TRUE
       AND v.status NOT IN ('CANCELLED')
     LIMIT 1`,
    [visitId]
  );

  return result.rows[0] || null;
};

const findLatestFinishedLabFollowup = async (patient_id) => {
  const result = await pool.query(
    `SELECT
       v.id,
       v.doctor_id,
       v.lab_requested,
       v.lab_exam_type,
       v.lab_result_text,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.lab_sample_collected_at,
       v.return_visit_reason
     FROM visits v
     WHERE v.patient_id = $1
       AND v.status = 'FINISHED'
       AND v.lab_requested = TRUE
     ORDER BY COALESCE(v.updated_at, v.consultation_ended_at, v.arrival_time) DESC
     LIMIT 1`,
    [patient_id]
  );
  return result.rows[0] || null;
};

const createVisitForLabFollowup = async (
  patient_id,
  sourceVisit = null,
  { visit_motive = null, visit_motive_other = null, return_visit_reason = null } = {}
) => {
  await ensureVisitMotiveColumns();
  const normalizedMotive =
    visit_motive ||
    (String(sourceVisit?.lab_result_status || "").toUpperCase() === "READY" ||
    String(sourceVisit?.lab_result_text || "").trim()
      ? "LAB_RESULTS"
      : "LAB_SAMPLE_COLLECTION");
  const result = await pool.query(
    `INSERT INTO visits (patient_id, status, arrival_time, doctor_id, priority, max_wait_minutes, return_visit_reason, visit_motive, visit_motive_other)
     VALUES ($1, 'WAITING_DOCTOR', NOW(), $2, 'NON_URGENT', 120, $3, $4, $5)
     RETURNING *`,
    [
      patient_id,
      null,
      return_visit_reason ||
        (sourceVisit?.id
          ? `Retorno laboratorial (origem visita #${sourceVisit.id})`
          : "Retorno laboratorial"),
      normalizedMotive,
      visit_motive_other,
    ]
  );
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
       COALESCE(
         t.chief_complaint,
         NULLIF(TRIM(v.return_visit_reason), ''),
         CASE
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'OTHER'
             THEN NULLIF(TRIM(v.visit_motive_other), '')
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'LAB_RESULTS'
             THEN 'Veio para resultado'
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'LAB_SAMPLE_COLLECTION'
             THEN 'Veio para colheita de amostra'
           ELSE NULL
         END,
         CASE
           WHEN lf.id IS NOT NULL AND (
             UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
             OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
           ) THEN 'Veio para resultado'
           WHEN lf.id IS NOT NULL AND (
             lf.return_visit_reason ILIKE 'Colheita de amostra%'
             OR lf.lab_sample_collected_at IS NULL
           ) THEN 'Veio para colheita de amostra'
           ELSE NULL
         END
       ) AS chief_complaint,
       (lf.id IS NOT NULL AND t.chief_complaint IS NULL) AS is_lab_followup,
       CASE
         WHEN lf.id IS NULL THEN NULL
         WHEN (
           UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
           OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
         ) THEN 'RESULT'
         WHEN (
           lf.return_visit_reason ILIKE 'Colheita de amostra%'
           OR lf.lab_sample_collected_at IS NULL
         ) THEN 'SAMPLE'
         ELSE 'PENDING'
       END AS lab_followup_kind,
       CASE
         WHEN lf.id IS NOT NULL AND (
           UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
           OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
         ) THEN 'Resultados prontos'
         WHEN lf.id IS NOT NULL THEN CONCAT(
           'Exame disponível em ',
           COALESCE(
             TO_CHAR(lf.lab_result_ready_at, 'DD/MM/YYYY HH24:MI'),
             TO_CHAR(lf.return_visit_date::timestamp, 'DD/MM/YYYY 08:00'),
             'a definir'
           )
         )
         ELSE NULL
       END AS lab_followup_note,
       lf.id AS lab_source_visit_id,
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
     LEFT JOIN LATERAL (
       SELECT v2.id, v2.lab_result_status, v2.lab_result_text, v2.lab_result_ready_at, v2.return_visit_date, v2.return_visit_reason, v2.lab_sample_collected_at
       FROM visits v2
       WHERE v2.patient_id = v.patient_id
         AND v2.status = 'FINISHED'
         AND v2.lab_requested = TRUE
       ORDER BY COALESCE(v2.updated_at, v2.consultation_ended_at, v2.arrival_time) DESC
       LIMIT 1
     ) lf ON TRUE
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
       COALESCE(
         t.chief_complaint,
         NULLIF(TRIM(v.return_visit_reason), ''),
         CASE
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'OTHER'
             THEN NULLIF(TRIM(v.visit_motive_other), '')
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'LAB_RESULTS'
             THEN 'Veio para resultado'
           WHEN UPPER(COALESCE(TRIM(v.visit_motive), '')) = 'LAB_SAMPLE_COLLECTION'
             THEN 'Veio para colheita de amostra'
           ELSE NULL
         END,
         CASE
           WHEN lf.id IS NOT NULL AND (
             UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
             OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
           ) THEN 'Veio para resultado'
           WHEN lf.id IS NOT NULL AND (
             lf.return_visit_reason ILIKE 'Colheita de amostra%'
             OR lf.lab_sample_collected_at IS NULL
           ) THEN 'Veio para colheita de amostra'
           ELSE NULL
         END
       ) AS chief_complaint,
       (lf.id IS NOT NULL AND t.chief_complaint IS NULL) AS is_lab_followup,
       CASE
         WHEN lf.id IS NULL THEN NULL
         WHEN (
           UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
           OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
         ) THEN 'RESULT'
         WHEN (
           lf.return_visit_reason ILIKE 'Colheita de amostra%'
           OR lf.lab_sample_collected_at IS NULL
         ) THEN 'SAMPLE'
         ELSE 'PENDING'
       END AS lab_followup_kind,
       CASE
         WHEN lf.id IS NOT NULL AND (
           UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
           OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
         ) THEN 'Resultados prontos'
         WHEN lf.id IS NOT NULL THEN CONCAT(
           'Exame disponível em ',
           COALESCE(
             TO_CHAR(lf.lab_result_ready_at, 'DD/MM/YYYY HH24:MI'),
             TO_CHAR(lf.return_visit_date::timestamp, 'DD/MM/YYYY 08:00'),
             'a definir'
           )
         )
         ELSE NULL
       END AS lab_followup_note,
       lf.id AS lab_source_visit_id,
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
     LEFT JOIN LATERAL (
       SELECT v2.id, v2.lab_result_status, v2.lab_result_text, v2.lab_result_ready_at, v2.return_visit_date, v2.return_visit_reason, v2.lab_sample_collected_at
       FROM visits v2
       WHERE v2.patient_id = v.patient_id
         AND v2.status = 'FINISHED'
         AND v2.lab_requested = TRUE
       ORDER BY COALESCE(v2.updated_at, v2.consultation_ended_at, v2.arrival_time) DESC
       LIMIT 1
     ) lf ON TRUE
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
  await ensureVisitHistoryColumns();
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
        v.hospital_status,
        v.vital_status,
        v.is_bedridden,
        v.inpatient_unit,
        v.inpatient_bed,
        v.discharged_at,
        v.follow_up_when,
        v.follow_up_instructions,
        v.follow_up_return_if,
       v.no_charge_chronic,
       v.no_charge_reason,
       v.return_visit_date,
       v.return_visit_reason,
      v.lab_requested,
      v.lab_exam_type,
      v.lab_sample_type,
      v.lab_tests,
      v.lab_sample_collected_at,
      v.lab_result_text,
      v.lab_result_json,
      v.lab_result_status,
       v.lab_result_ready_at,
       v.doctor_questionnaire_json,
        p.full_name,
        p.clinical_code,
        p.is_deceased,
        p.deceased_at,
        p.death_note,
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
       v.follow_up_when,
       v.return_visit_reason,
       p.full_name,
       p.clinical_code
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     WHERE v.doctor_id = $1
       AND v.return_visit_date >= CURRENT_DATE
       AND v.status NOT IN ('CANCELLED')
     ORDER BY v.return_visit_date ASC, COALESCE(v.follow_up_when, TO_CHAR(v.arrival_time, 'HH24:MI')) ASC, v.arrival_time ASC`,
    [doctorId]
  );

  return {
    assigned_today: assignedTodayResult.rows,
    returns_today: returnsTodayResult.rows,
  };
};

const listLabPendingRequests = async () => {
  await ensureLabPatientNotificationColumns();
  await ensureLabStructuredResultColumns();
  const result = await pool.query(
    `SELECT
       v.id,
       v.patient_id,
       v.doctor_id,
       v.status,
       v.priority,
       v.arrival_time,
       v.lab_requested,
       v.lab_exam_type,
       v.lab_sample_type,
       v.lab_tests,
       v.lab_sample_collected_at,
       v.lab_result_text,
       v.lab_result_json,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.lab_patient_notified_at,
       v.lab_patient_notified_by,
       v.lab_patient_notification_note,
       v.likely_diagnosis,
       v.clinical_reasoning,
       v.prescription_text,
       t.chief_complaint AS triage_chief_complaint,
       t.clinical_notes AS triage_clinical_notes,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     LEFT JOIN LATERAL (
       SELECT t1.chief_complaint, t1.clinical_notes
       FROM triage t1
       WHERE t1.visit_id = v.id
       ORDER BY t1.created_at DESC
       LIMIT 1
     ) t ON TRUE
     WHERE v.lab_requested = TRUE
       AND v.status NOT IN ('CANCELLED')
       AND (
         COALESCE(TRIM(v.lab_result_text), '') = ''
         OR UPPER(COALESCE(TRIM(v.lab_result_status), '')) <> 'READY'
       )
     ORDER BY COALESCE(v.updated_at, v.arrival_time) DESC,
              COALESCE(v.lab_sample_collected_at, v.arrival_time) DESC`
  );
  return result.rows;
};

const listLabReadyResults = async (limit = 200) => {
  await ensureLabPatientNotificationColumns();
  await ensureLabStructuredResultColumns();
  const safeLimit = Number.isFinite(Number(limit))
    ? Math.max(1, Math.min(1000, Number(limit)))
    : 200;
  const result = await pool.query(
    `SELECT
       v.id,
       v.patient_id,
       v.doctor_id,
       v.status,
       v.priority,
       v.arrival_time,
       v.lab_requested,
       v.lab_exam_type,
       v.lab_sample_type,
       v.lab_tests,
       v.lab_sample_collected_at,
       v.lab_result_text,
       v.lab_result_json,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.lab_patient_notified_at,
       v.lab_patient_notified_by,
       v.lab_patient_notification_note,
       v.likely_diagnosis,
       v.clinical_reasoning,
       v.prescription_text,
       t.chief_complaint AS triage_chief_complaint,
       t.clinical_notes AS triage_clinical_notes,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     LEFT JOIN LATERAL (
       SELECT t1.chief_complaint, t1.clinical_notes
       FROM triage t1
       WHERE t1.visit_id = v.id
       ORDER BY t1.created_at DESC
       LIMIT 1
     ) t ON TRUE
     WHERE v.lab_requested = TRUE
       AND (
         COALESCE(TRIM(v.lab_result_text), '') <> ''
         OR UPPER(COALESCE(TRIM(v.lab_result_status), '')) = 'READY'
       )
     ORDER BY COALESCE(v.lab_result_ready_at, v.updated_at, v.arrival_time) DESC
     LIMIT $1`,
    [safeLimit]
  );
  return result.rows;
};

const listLabHistoryToday = async () => {
  await ensureLabPatientNotificationColumns();
  await ensureLabStructuredResultColumns();
  const result = await pool.query(
    `SELECT
       v.id,
       v.patient_id,
       v.doctor_id,
       v.status,
       v.priority,
       v.arrival_time,
       v.lab_requested,
       v.lab_exam_type,
       v.lab_sample_type,
       v.lab_tests,
       v.lab_sample_collected_at,
       v.lab_result_text,
       v.lab_result_json,
       v.lab_result_status,
       v.lab_result_ready_at,
       v.lab_patient_notified_at,
       v.lab_patient_notified_by,
       v.lab_patient_notification_note,
       v.likely_diagnosis,
       v.clinical_reasoning,
       v.prescription_text,
       t.chief_complaint AS triage_chief_complaint,
       t.clinical_notes AS triage_clinical_notes,
       p.full_name,
       p.clinical_code,
       d.full_name AS doctor_full_name
     FROM visits v
     JOIN patients p ON p.id = v.patient_id
     LEFT JOIN users d ON d.id = v.doctor_id
     LEFT JOIN LATERAL (
       SELECT t1.chief_complaint, t1.clinical_notes
       FROM triage t1
       WHERE t1.visit_id = v.id
       ORDER BY t1.created_at DESC
       LIMIT 1
     ) t ON TRUE
     WHERE v.lab_requested = TRUE
       AND DATE(COALESCE(v.lab_result_ready_at, v.updated_at, v.arrival_time)) = CURRENT_DATE
     ORDER BY COALESCE(v.lab_result_ready_at, v.updated_at, v.arrival_time) DESC`
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
      AND status = 'IN_CONSULTATION'
      AND COALESCE(TRIM(likely_diagnosis), '') <> ''
      AND COALESCE(TRIM(clinical_reasoning), '') <> ''
      AND COALESCE(TRIM(prescription_text), '') <> ''
      AND COALESCE(TRIM(disposition_plan), '') <> ''
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
      AND (v.doctor_id = $1 OR v.doctor_id IS NULL)
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

const holdVisitForPendingLab = async (id) => {
  const result = await pool.query(
    `
    UPDATE visits
    SET status = 'WAITING_DOCTOR',
        updated_at = NOW()
    WHERE id = $1
      AND status = 'IN_CONSULTATION'
      AND lab_requested = TRUE
      AND (
        COALESCE(TRIM(lab_result_text), '') = ''
        OR UPPER(COALESCE(TRIM(lab_result_status), '')) <> 'READY'
      )
      AND COALESCE(TRIM(likely_diagnosis), '') <> ''
      AND COALESCE(TRIM(clinical_reasoning), '') <> ''
      AND COALESCE(TRIM(prescription_text), '') <> ''
      AND COALESCE(TRIM(disposition_plan), '') <> ''
    RETURNING *;
    `,
    [id]
  );
  return result.rows[0];
};

const saveMedicalPlan = async (id, payload, { actorId = null, isAdmin = false } = {}) => {
  await ensureVisitHistoryColumns();
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
    nullIfBlank(payload.lab_sample_type),
    nullIfBlank(payload.lab_tests),
    nullIfBlank(payload.lab_sample_collected_at),
    nullIfBlank(payload.lab_result_text),
    payload.lab_result_json ?? null,
    nullIfBlank(payload.lab_result_status),
    nullIfBlank(payload.lab_result_ready_at),
    nullIfBlank(payload.hospital_status),
    nullIfBlank(payload.vital_status),
    !!payload.is_bedridden,
    nullIfBlank(payload.inpatient_unit),
    nullIfBlank(payload.inpatient_bed),
    nullIfBlank(payload.discharged_at),
    payload.doctor_questionnaire_json ?? null,
    payload.accepted ? new Date() : null,
    payload.accepted ? actorId : null,
    id,
    actorId,
  ];

  if (isAdmin) {
    const adminParams = params.slice(0, 31);
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
           lab_sample_type = $15,
           lab_tests = $16,
           lab_sample_collected_at = $17,
            lab_result_text = $18,
            lab_result_json = $19,
            lab_result_status = $20,
            lab_result_ready_at = $21,
            hospital_status = $22,
            vital_status = $23,
            is_bedridden = $24,
            inpatient_unit = $25,
            inpatient_bed = $26,
            discharged_at = $27,
             doctor_questionnaire_json = $28,
             plan_accepted_at = $29,
             plan_accepted_by = $30,
             updated_at = NOW()
       WHERE id = $31
         AND status NOT IN ('FINISHED','CANCELLED')
       RETURNING *`,
      adminParams
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
         lab_sample_type = $15,
         lab_tests = $16,
         lab_sample_collected_at = $17,
          lab_result_text = $18,
          lab_result_json = $19,
          lab_result_status = $20,
          lab_result_ready_at = $21,
          hospital_status = $22,
          vital_status = $23,
          is_bedridden = $24,
          inpatient_unit = $25,
          inpatient_bed = $26,
          discharged_at = $27,
           doctor_questionnaire_json = $28,
           plan_accepted_at = $29,
           plan_accepted_by = $30,
           updated_at = NOW()
      WHERE id = $31
        AND status NOT IN ('FINISHED','CANCELLED')
        AND doctor_id = $32
      RETURNING *`,
    params
  );
  const updated = result.rows[0];
  if (!updated) return null;

  const shouldMarkDeceased = String(payload?.vital_status || "").toUpperCase() === "DECEASED";
  const shouldMarkAlive = String(payload?.vital_status || "").toUpperCase() === "ALIVE";
  if (shouldMarkDeceased) {
    await pool.query(
      `UPDATE patients
       SET is_deceased = TRUE,
           deceased_at = COALESCE(deceased_at, NOW()),
           death_note = COALESCE($2, death_note),
           updated_at = NOW()
       WHERE id = $1`,
      [updated.patient_id, nullIfBlank(payload.death_note)]
    );
  } else if (shouldMarkAlive) {
    await pool.query(
      `UPDATE patients
       SET is_deceased = FALSE,
           deceased_at = NULL,
           updated_at = NOW()
       WHERE id = $1`,
      [updated.patient_id]
    );
  }

  return updated;
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

const updatePastVisitSummary = async (
  id,
  {
    likely_diagnosis = null,
    clinical_reasoning = null,
    prescription_text = null,
    doctor_id = null,
    hospital_status = null,
  } = {}
) => {
  await ensureVisitHistoryColumns();
  const nullIfBlank = (v) => {
    if (v == null) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  };

  const result = await pool.query(
    `UPDATE visits
     SET likely_diagnosis = $1,
         clinical_reasoning = $2,
         prescription_text = $3,
         doctor_id = $4,
         hospital_status = $5,
         updated_at = NOW()
     WHERE id = $6
       AND status IN ('FINISHED','CANCELLED')
     RETURNING *`,
    [
      nullIfBlank(likely_diagnosis),
      nullIfBlank(clinical_reasoning),
      nullIfBlank(prescription_text),
      doctor_id || null,
      nullIfBlank(hospital_status),
      id,
    ]
  );
  return result.rows[0];
};

const removeTriageFromVisit = async (visitId, { actorId = null } = {}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const triageRes = await client.query(
      `DELETE FROM triage
       WHERE visit_id = $1
       RETURNING id, visit_id`,
      [visitId]
    );
    const removedTriage = triageRes.rows[0] || null;

    const visitRes = await client.query(
      `UPDATE visits
       SET status = 'CANCELLED',
           priority = NULL,
           max_wait_minutes = NULL,
           doctor_id = NULL,
           consultation_started_at = NULL,
           consultation_ended_at = NULL,
           cancel_reason = 'TRIAGE_REMOVED',
           cancelled_by = $2,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
         AND status NOT IN ('FINISHED', 'CANCELLED', 'IN_CONSULTATION')
       RETURNING *`,
      [visitId, actorId]
    );

    const visit = visitRes.rows[0] || null;
    if (!visit) {
      await client.query("ROLLBACK");
      return null;
    }

    await client.query("COMMIT");
    return {
      removed_triage_id: removedTriage?.id || null,
      removed_triage_count: triageRes.rowCount || 0,
      visit,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

const saveLabResultByLabTechnician = async (
  id,
  {
    lab_result_text,
    lab_result_json = null,
    lab_result_status = "READY",
    lab_result_ready_at = null,
  }
) => {
  await ensureLabPatientNotificationColumns();
  await ensureLabStructuredResultColumns();
  const nullIfBlank = (v) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  };
  const result = await pool.query(
    `UPDATE visits
     SET lab_result_text = $1,
         lab_result_json = $2::jsonb,
         lab_result_status = $3,
         lab_result_ready_at = COALESCE($4::timestamp, NOW()),
         lab_patient_notified_at = NULL,
         lab_patient_notified_by = NULL,
         lab_patient_notification_note = NULL,
         updated_at = NOW()
     WHERE id = $5
       AND lab_requested = TRUE
       AND status NOT IN ('CANCELLED')
     RETURNING *`,
    [
      nullIfBlank(lab_result_text),
      lab_result_json ? JSON.stringify(lab_result_json) : null,
      nullIfBlank(String(lab_result_status || "READY").toUpperCase()) || "READY",
      nullIfBlank(lab_result_ready_at),
      id,
    ]
  );
  const updated = result.rows[0];
  if (!updated) return null;

  return updated;
};

const updateLabWorkflowByLabTechnician = async (
  id,
  { lab_result_status = "PROCESSING", lab_sample_collected_at = null } = {}
) => {
  const nullIfBlank = (v) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s : null;
  };
  const result = await pool.query(
    `UPDATE visits
     SET lab_result_status = $1,
         lab_sample_collected_at = COALESCE($2::timestamp, lab_sample_collected_at),
         updated_at = NOW()
     WHERE id = $3
       AND lab_requested = TRUE
       AND status NOT IN ('CANCELLED')
     RETURNING *`,
    [
      nullIfBlank(String(lab_result_status || "PROCESSING").toUpperCase()) || "PROCESSING",
      nullIfBlank(lab_sample_collected_at),
      id,
    ]
  );
  return result.rows[0] || null;
};

const markLabPatientNotified = async (id, { actorId = null, note = null } = {}) => {
  await ensureLabPatientNotificationColumns();
  const normalizedNote = typeof note === "string" && note.trim() ? note.trim() : null;
  const result = await pool.query(
    `UPDATE visits
     SET lab_patient_notified_at = NOW(),
         lab_patient_notified_by = $1,
         lab_patient_notification_note = $2,
         updated_at = NOW()
     WHERE id = $3
       AND lab_requested = TRUE
       AND (
         COALESCE(TRIM(lab_result_text), '') <> ''
         OR UPPER(COALESCE(TRIM(lab_result_status), '')) IN ('READY', 'RESULTED', 'VERIFIED')
       )
       AND status NOT IN ('CANCELLED')
     RETURNING *`,
    [actorId, normalizedNote, id]
  );
  return result.rows[0] || null;
};

const updateDestinationStatusByNurse = async (
  id,
  { hospital_status, nurse_discharge_note = null }
) => {
  await ensureNurseDestinationColumns();
  const normalizedStatus = String(hospital_status || "")
    .trim()
    .toUpperCase();
  const note =
    typeof nurse_discharge_note === "string" && nurse_discharge_note.trim()
      ? nurse_discharge_note.trim()
      : null;

  const result = await pool.query(
    `
    UPDATE visits
    SET hospital_status = $1,
        nurse_discharge_note = $2,
        discharged_at = CASE
          WHEN $1 IN ('DISCHARGED', 'TRANSFERRED') THEN COALESCE(discharged_at, NOW())
          ELSE discharged_at
        END,
        consultation_ended_at = CASE
          WHEN $1 IN ('DISCHARGED', 'TRANSFERRED') THEN COALESCE(consultation_ended_at, NOW())
          ELSE consultation_ended_at
        END,
        status = CASE
          WHEN $1 IN ('DISCHARGED', 'TRANSFERRED') THEN 'FINISHED'
          ELSE status
        END,
        updated_at = NOW()
    WHERE id = $3
      AND status NOT IN ('CANCELLED', 'FINISHED')
      AND (
        ($1 = 'DISCHARGED' AND UPPER(COALESCE(TRIM(disposition_plan), '')) = 'HOME')
        OR
        ($1 = 'TRANSFERRED' AND UPPER(COALESCE(TRIM(disposition_plan), '')) = 'ADMIT_URGENT')
      )
    RETURNING *
    `,
    [normalizedStatus, note, id]
  );

  return result.rows[0] || null;
};

const registerAdmissionByNurse = async (
  id,
  { hospital_status, inpatient_unit = null, inpatient_bed = null, nurse_discharge_note = null }
) => {
  await ensureNurseDestinationColumns();
  const normalizedStatus = String(hospital_status || "")
    .trim()
    .toUpperCase();
  const normalizedUnit =
    typeof inpatient_unit === "string" && inpatient_unit.trim() ? inpatient_unit.trim() : null;
  const normalizedBed =
    typeof inpatient_bed === "string" && inpatient_bed.trim() ? inpatient_bed.trim() : null;
  const note =
    typeof nurse_discharge_note === "string" && nurse_discharge_note.trim()
      ? nurse_discharge_note.trim()
      : null;

  const result = await pool.query(
    `
    UPDATE visits
    SET hospital_status = $1,
        inpatient_unit = COALESCE($2, inpatient_unit),
        inpatient_bed = COALESCE($3, inpatient_bed),
        nurse_discharge_note = COALESCE($4, nurse_discharge_note),
        updated_at = NOW()
    WHERE id = $5
      AND status NOT IN ('CANCELLED', 'FINISHED')
      AND (
        ($1 = 'IN_HOSPITAL' AND UPPER(COALESCE(TRIM(disposition_plan), '')) = 'ADMIT_URGENT')
        OR
        ($1 = 'BED_REST' AND UPPER(COALESCE(TRIM(disposition_plan), '')) = 'BED_REST')
      )
    RETURNING *
    `,
    [normalizedStatus, normalizedUnit, normalizedBed, note, id]
  );

  return result.rows[0] || null;
};

module.exports = {
  findOpenVisitByPatientId,
  createVisit,
  findLatestFinishedLabFollowup,
  createVisitForLabFollowup,
  getVisitById,
  getLabNotificationContextByVisitId,
  listActiveVisits,
  listActiveVisitsByDoctor,
  listPastVisits,
  listLabPendingRequests,
  listLabReadyResults,
  listLabHistoryToday,
  listDoctorAgenda,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
  holdVisitForPendingLab,
  assignDoctor,
  startConsultation,
  cancelVisit,
  editPriority,
  saveMedicalPlan,
  scheduleReturn,
  updatePastVisitSummary,
  removeTriageFromVisit,
  saveLabResultByLabTechnician,
  updateLabWorkflowByLabTechnician,
  markLabPatientNotified,
  registerAdmissionByNurse,
  updateDestinationStatusByNurse,
};
