const pool = require('../config/db');

// ========================
// CREATE TRIAGE
// ========================
const createTriage = async ({
    visit_id,
    nurse_id,
    temperature,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    chief_complaint,
    clinical_notes
}) => {
    const result = await pool.query(
        `INSERT INTO triage
        (visit_id, nurse_id, temperature, heart_rate, respiratory_rate, oxygen_saturation, weight, chief_complaint, clinical_notes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
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
            clinical_notes
        ]
    );

    // opcional: marca a visita como "IN_TRIAGE" quando cria triagem
    await pool.query(
        `UPDATE visits SET status = 'IN_TRIAGE', updated_at = NOW() WHERE id = $1`,
        [visit_id]
    );

    return result.rows[0];
};

// ========================
// GET TRIAGE BY ID
// ========================
const getTriageById = async (id) => {
    const result = await pool.query(
        `SELECT * FROM triage WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};

// ========================
// GET TRIAGE BY VISIT
// ========================
const getTriageByVisitId = async (visit_id) => {
    const result = await pool.query(
        `SELECT * FROM triage WHERE visit_id = $1`,
        [visit_id]
    );
    return result.rows[0];
};

// ========================
// UPDATE TRIAGE
// ========================
const updateTriage = async (id, {
    temperature,
    heart_rate,
    respiratory_rate,
    oxygen_saturation,
    weight,
    chief_complaint,
    clinical_notes
}) => {
    const result = await pool.query(
        `UPDATE triage
         SET temperature = $1,
             heart_rate = $2,
             respiratory_rate = $3,
             oxygen_saturation = $4,
             weight = $5,
             chief_complaint = $6,
             clinical_notes = $7,
             updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
            temperature,
            heart_rate,
            respiratory_rate,
            oxygen_saturation,
            weight,
            chief_complaint,
            clinical_notes,
            id
        ]
    );

    return result.rows[0];
};

// ========================
// DELETE TRIAGE
// ========================
const deleteTriage = async (id) => {
    const result = await pool.query(
        `DELETE FROM triage WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

module.exports = {
    createTriage,
    getTriageById,
    getTriageByVisitId,
    updateTriage,
    deleteTriage
};
