const patientModel = require("../models/patientModel");

// ========================
// CREATE PATIENT
// ========================
const createPatient = async (req, res) => {
  try {
    const {
      clinical_code,
      full_name,
      sex,
      birth_date,
      guardian_name,
      guardian_phone,
    } = req.body;

    if (
      !clinical_code ||
      !full_name ||
      !sex ||
      !birth_date ||
      !guardian_name ||
      !guardian_phone
    ) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }

    const patient = await patientModel.createPatient({
      clinical_code,
      full_name,
      sex,
      birth_date,
      guardian_name,
      guardian_phone,
    });

    return res.status(201).json(patient);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "clinical_code já existe" });
    }
    return res.status(500).json({ error: "Erro ao criar paciente" });
  }
};

// ========================
// GET PATIENT BY ID
// ========================
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await patientModel.getPatientById(id);
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });

    return res.json(patient);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar paciente" });
  }
};

// ========================
// GET PATIENT BY CLINICAL CODE
// ========================
const getPatientByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const patient = await patientModel.getPatientByCode(code);
    if (!patient) return res.status(404).json({ error: "Paciente não encontrado" });

    return res.json(patient);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar paciente" });
  }
};

// ========================
// SEARCH PATIENTS (?name=...)
// ========================
const searchPatients = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Informe pelo menos 2 letras no parâmetro name" });
    }

    const patients = await patientModel.searchPatients(name.trim());
    return res.json(patients);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao pesquisar pacientes" });
  }
};

// ========================
// UPDATE PATIENT
// ========================
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await patientModel.updatePatient(id, req.body);
    if (!updated) return res.status(404).json({ error: "Paciente não encontrado" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar paciente" });
  }
};

// ========================
// DELETE PATIENT
// ========================
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await patientModel.deletePatient(id);
    if (!deleted) return res.status(404).json({ error: "Paciente não encontrado" });

    return res.json({ message: "Paciente removido com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao remover paciente" });
  }
};

const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await patientModel.getPatientHistory(id);
    return res.json(Array.isArray(history) ? history : []);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar historico do paciente" });
  }
};

module.exports = {
  createPatient,
  getPatientById,
  getPatientByCode,
  searchPatients,
  updatePatient,
  deletePatient,
  getPatientHistory,
};
