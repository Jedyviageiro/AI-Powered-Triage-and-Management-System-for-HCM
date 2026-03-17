const pool = require("../config/db");

let ensureTriageColumnsPromise = null;
const ensureTriageColumns = async () => {
  if (!ensureTriageColumnsPromise) {
    ensureTriageColumnsPromise = pool.query(`
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS general_state VARCHAR(40) NULL;
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS needs_oxygen BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS suspected_severe_dehydration BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS excessive_lethargy BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS difficulty_maintaining_sitting BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE triage
        ADD COLUMN IF NOT EXISTS history_syncope_collapse BOOLEAN NOT NULL DEFAULT FALSE;
    `);
  }
  return ensureTriageColumnsPromise;
};

const createTriage = async ({
  visit_id,
  nurse_id,
  temperature,
  heart_rate,
  respiratory_rate,
  oxygen_saturation,
  weight,
  chief_complaint,
  clinical_notes,
  general_state = null,
  needs_oxygen = false,
  suspected_severe_dehydration = false,
  excessive_lethargy = false,
  difficulty_maintaining_sitting = false,
  history_syncope_collapse = false,
}) => {
  await ensureTriageColumns();
  const result = await pool.query(
    `INSERT INTO triage
    (visit_id, nurse_id, temperature, heart_rate, respiratory_rate, oxygen_saturation, weight, chief_complaint, clinical_notes, general_state, needs_oxygen, suspected_severe_dehydration, excessive_lethargy, difficulty_maintaining_sitting, history_syncope_collapse)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *`,
    [
      visit_id,
      nurse_id,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      chief_complaint,
      clinical_notes,
      general_state,
      !!needs_oxygen,
      !!suspected_severe_dehydration,
      !!excessive_lethargy,
      !!difficulty_maintaining_sitting,
      !!history_syncope_collapse,
    ]
  );

  await pool.query(`UPDATE visits SET status = 'IN_TRIAGE', updated_at = NOW() WHERE id = $1`, [
    visit_id,
  ]);

  return result.rows[0];
};

const getLastRecordedWeightForVisitPatient = async (visit_id) => {
  await ensureTriageColumns();
  const result = await pool.query(
    `SELECT t.weight
     FROM visits current_visit
     JOIN visits past_visit
       ON past_visit.patient_id = current_visit.patient_id
      AND past_visit.id <> current_visit.id
     JOIN triage t ON t.visit_id = past_visit.id
     WHERE current_visit.id = $1
       AND t.weight IS NOT NULL
     ORDER BY t.created_at DESC
     LIMIT 1`,
    [visit_id]
  );
  return result.rows[0] || null;
};

const getTriageById = async (id) => {
  await ensureTriageColumns();
  const result = await pool.query(`SELECT * FROM triage WHERE id = $1`, [id]);
  return result.rows[0];
};

const getTriageByVisitId = async (visit_id) => {
  await ensureTriageColumns();
  const result = await pool.query(`SELECT * FROM triage WHERE visit_id = $1`, [visit_id]);
  return result.rows[0];
};

const updateTriage = async (
  id,
  {
    temperature,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    chief_complaint,
    clinical_notes,
    general_state = null,
    needs_oxygen = false,
    suspected_severe_dehydration = false,
    excessive_lethargy = false,
    difficulty_maintaining_sitting = false,
    history_syncope_collapse = false,
  }
) => {
  await ensureTriageColumns();
  const result = await pool.query(
    `UPDATE triage
     SET temperature = $1,
         heart_rate = $2,
         respiratory_rate = $3,
         oxygen_saturation = $4,
         weight = $5,
         chief_complaint = $6,
         clinical_notes = $7,
         general_state = $8,
         needs_oxygen = $9,
         suspected_severe_dehydration = $10,
         excessive_lethargy = $11,
         difficulty_maintaining_sitting = $12,
         history_syncope_collapse = $13
     WHERE id = $14
     RETURNING *`,
    [
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      chief_complaint,
      clinical_notes,
      general_state,
      !!needs_oxygen,
      !!suspected_severe_dehydration,
      !!excessive_lethargy,
      !!difficulty_maintaining_sitting,
      !!history_syncope_collapse,
      id,
    ]
  );

  return result.rows[0];
};

const deleteTriage = async (id) => {
  await ensureTriageColumns();
  const result = await pool.query(`DELETE FROM triage WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0];
};

module.exports = {
  createTriage,
  getLastRecordedWeightForVisitPatient,
  getTriageById,
  getTriageByVisitId,
  updateTriage,
  deleteTriage,
};
