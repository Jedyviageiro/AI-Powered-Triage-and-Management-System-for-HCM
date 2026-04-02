const pool = require("../config/db");

const formatClinicalCode = (value) => `P${String(value).padStart(4, "0")}`;

const listClinicalCodeNumbers = async (db = pool) => {
  const result = await db.query(
    `SELECT NULLIF(SUBSTRING(clinical_code FROM '[0-9]+$'), '')::INTEGER AS code_number
     FROM patients
     WHERE clinical_code ~ '[0-9]+$'
     ORDER BY code_number ASC`
  );
  return result.rows
    .map((row) => Number(row?.code_number))
    .filter((value) => Number.isInteger(value) && value > 0);
};

const getSmallestMissingClinicalCodeNumber = async (db = pool) => {
  const numbers = await listClinicalCodeNumbers(db);
  let expected = 1;

  for (const value of numbers) {
    if (value < expected) continue;
    if (value > expected) break;
    expected += 1;
  }

  return expected;
};

const getNextClinicalCode = async () => {
  const nextNumber = await getSmallestMissingClinicalCodeNumber();
  return formatClinicalCode(nextNumber);
};

// ========================
// CREATE PATIENT
// ========================
const createPatient = async ({
  full_name,
  sex,
  birth_date,
  guardian_name,
  guardian_phone,
}) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("LOCK TABLE patients IN SHARE ROW EXCLUSIVE MODE");

    const nextNumber = await getSmallestMissingClinicalCodeNumber(client);
    const clinical_code = formatClinicalCode(nextNumber);
    const result = await client.query(
      `INSERT INTO patients
          (clinical_code, full_name, sex, birth_date, guardian_name, guardian_phone)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *`,
      [clinical_code, full_name, sex, birth_date, guardian_name, guardian_phone]
    );

    await client.query("COMMIT");
    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ========================
// GET PATIENT BY ID
// ========================
const getPatientById = async (id) => {
  const result = await pool.query(`SELECT * FROM patients WHERE id = $1`, [id]);
  return result.rows[0];
};

// ========================
// GET BY CLINICAL CODE
// ========================
const getPatientByCode = async (clinical_code) => {
  const result = await pool.query(
    `SELECT
            p.*,
            lf.id AS latest_lab_visit_id,
            lf.lab_result_ready_at AS latest_lab_result_ready_at,
            lf.lab_result_status AS latest_lab_result_status,
            lf.lab_result_text AS latest_lab_result_text,
            lf.lab_sample_collected_at AS latest_lab_sample_collected_at,
            lf.return_visit_reason AS latest_lab_return_visit_reason,
            CASE
                WHEN lf.id IS NULL THEN NULL
                WHEN UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
                    OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
                    THEN 'RESULT'
                WHEN lf.return_visit_reason ILIKE 'Colheita de amostra%'
                    OR lf.lab_sample_collected_at IS NULL
                    THEN 'SAMPLE'
                ELSE 'PENDING'
            END AS lab_followup_kind,
            CASE
                WHEN lf.id IS NULL THEN NULL
                WHEN UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
                    OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
                    THEN 'Resultados prontos'
                WHEN lf.lab_result_ready_at IS NOT NULL
                    THEN CONCAT('Exame disponível em ', TO_CHAR(lf.lab_result_ready_at, 'DD/MM/YYYY HH24:MI'))
                WHEN lf.return_visit_date IS NOT NULL
                    THEN CONCAT('Exame disponível em ', TO_CHAR(lf.return_visit_date::timestamp, 'DD/MM/YYYY 08:00'))
                ELSE 'Exame pendente (a definir)'
            END AS lab_followup_note
         FROM patients p
         LEFT JOIN LATERAL (
            SELECT
                v.id,
                v.lab_result_ready_at,
                v.lab_result_status,
                v.lab_result_text,
                v.lab_sample_collected_at,
                v.return_visit_reason,
                v.return_visit_date
            FROM visits v
            WHERE v.patient_id = p.id
              AND v.status = 'FINISHED'
              AND v.lab_requested = TRUE
            ORDER BY COALESCE(v.updated_at, v.consultation_ended_at, v.arrival_time) DESC
            LIMIT 1
         ) lf ON TRUE
         WHERE p.clinical_code = $1`,
    [clinical_code]
  );
  return result.rows[0];
};

// ========================
// SEARCH PATIENT (name)
// ========================
const searchPatients = async (name) => {
  const result = await pool.query(
    `SELECT
            p.*,
            lf.id AS latest_lab_visit_id,
            lf.lab_result_ready_at AS latest_lab_result_ready_at,
            lf.lab_result_status AS latest_lab_result_status,
            lf.lab_result_text AS latest_lab_result_text,
            lf.lab_sample_collected_at AS latest_lab_sample_collected_at,
            lf.return_visit_reason AS latest_lab_return_visit_reason,
            CASE
                WHEN lf.id IS NULL THEN NULL
                WHEN UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
                    OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
                    THEN 'RESULT'
                WHEN lf.return_visit_reason ILIKE 'Colheita de amostra%'
                    OR lf.lab_sample_collected_at IS NULL
                    THEN 'SAMPLE'
                ELSE 'PENDING'
            END AS lab_followup_kind,
            CASE
                WHEN lf.id IS NULL THEN NULL
                WHEN UPPER(COALESCE(TRIM(lf.lab_result_status), '')) = 'READY'
                    OR COALESCE(TRIM(lf.lab_result_text), '') <> ''
                    THEN 'Resultados prontos'
                WHEN lf.lab_result_ready_at IS NOT NULL
                    THEN CONCAT('Exame disponível em ', TO_CHAR(lf.lab_result_ready_at, 'DD/MM/YYYY HH24:MI'))
                WHEN lf.return_visit_date IS NOT NULL
                    THEN CONCAT('Exame disponível em ', TO_CHAR(lf.return_visit_date::timestamp, 'DD/MM/YYYY 08:00'))
                ELSE 'Exame pendente (a definir)'
            END AS lab_followup_note
         FROM patients p
         LEFT JOIN LATERAL (
            SELECT
                v.id,
                v.lab_result_ready_at,
                v.lab_result_status,
                v.lab_result_text,
                v.lab_sample_collected_at,
                v.return_visit_reason,
                v.return_visit_date
            FROM visits v
            WHERE v.patient_id = p.id
              AND v.status = 'FINISHED'
              AND v.lab_requested = TRUE
            ORDER BY COALESCE(v.updated_at, v.consultation_ended_at, v.arrival_time) DESC
            LIMIT 1
         ) lf ON TRUE
         WHERE p.full_name ILIKE $1
         ORDER BY p.full_name`,
    [`%${name}%`]
  );
  return result.rows;
};

// ========================
// UPDATE PATIENT
// ========================
const updatePatient = async (id, { full_name, sex, birth_date, guardian_name, guardian_phone }) => {
  const result = await pool.query(
    `UPDATE patients
         SET full_name = $1,
             sex = $2,
             birth_date = $3,
             guardian_name = $4,
             guardian_phone = $5,
             updated_at = NOW()
         WHERE id = $6
         RETURNING *`,
    [full_name, sex, birth_date, guardian_name, guardian_phone, id]
  );

  return result.rows[0];
};

// ========================
// DELETE PATIENT
// ========================
const deletePatient = async (id) => {
  const result = await pool.query(`DELETE FROM patients WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

const getPatientHistory = async (patientId) => {
  const result = await pool.query(
    `SELECT
            v.id,
            v.id AS visit_id,
            v.arrival_time,
            v.status,
            v.priority,
            v.likely_diagnosis,
            v.clinical_reasoning,
            v.prescription_text,
            v.disposition_plan,
            v.disposition_reason,
            v.finished_at,
            v.consultation_ended_at,
            v.doctor_questionnaire_json,
            v.return_visit_date,
            v.return_visit_reason,
            v.lab_requested,
            v.lab_exam_type,
            v.lab_sample_collected_at,
            v.lab_result_text,
            v.lab_result_status,
            v.lab_result_ready_at,
            v.lab_tests,
            t.temperature,
            t.heart_rate,
            t.respiratory_rate,
            t.oxygen_saturation,
            t.weight,
            t.chief_complaint,
            t.clinical_notes
         FROM visits v
         LEFT JOIN triage t ON t.visit_id = v.id
         WHERE v.patient_id = $1
         ORDER BY COALESCE(v.consultation_ended_at, v.finished_at, v.updated_at, v.arrival_time) DESC`,
    [patientId]
  );
  return result.rows;
};

// ========================
module.exports = {
  createPatient,
  getNextClinicalCode,
  getPatientById,
  getPatientByCode,
  searchPatients,
  updatePatient,
  deletePatient,
  getPatientHistory,
};
