const pool = require('../config/db');

// ========================
// CREATE PATIENT
// ========================
const createPatient = async ({
    clinical_code,
    full_name,
    sex,
    birth_date,
    guardian_name,
    guardian_phone
}) => {

    const result = await pool.query(
        `INSERT INTO patients
        (clinical_code, full_name, sex, birth_date, guardian_name, guardian_phone)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [clinical_code, full_name, sex, birth_date, guardian_name, guardian_phone]
    );

    return result.rows[0];
};

// ========================
// GET PATIENT BY ID
// ========================
const getPatientById = async (id) => {
    const result = await pool.query(
        `SELECT * FROM patients WHERE id = $1`,
        [id]
    );
    return result.rows[0];
};

// ========================
// GET BY CLINICAL CODE
// ========================
const getPatientByCode = async (clinical_code) => {
    const result = await pool.query(
        `SELECT * FROM patients WHERE clinical_code = $1`,
        [clinical_code]
    );
    return result.rows[0];
};

// ========================
// SEARCH PATIENT (name)
// ========================
const searchPatients = async (name) => {
    const result = await pool.query(
        `SELECT * FROM patients
         WHERE full_name ILIKE $1
         ORDER BY full_name`,
        [`%${name}%`]
    );
    return result.rows;
};

// ========================
// UPDATE PATIENT
// ========================
const updatePatient = async (id, {
    full_name,
    sex,
    birth_date,
    guardian_name,
    guardian_phone
}) => {

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
    const result = await pool.query(
        `DELETE FROM patients WHERE id = $1 RETURNING *`,
        [id]
    );
    return result.rows[0];
};

// ========================
module.exports = {
    createPatient,
    getPatientById,
    getPatientByCode,
    searchPatients,
    updatePatient,
    deletePatient
};
