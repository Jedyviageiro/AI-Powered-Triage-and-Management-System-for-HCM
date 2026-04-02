const patientModel = require("../models/patientModel");

const calculateAgeYears = (birthDate) => {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const monthDiff = now.getMonth() - date.getMonth();
  const dayDiff = now.getDate() - date.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age;
};

const validatePediatricBirthDate = (birthDate) => {
  const ageYears = calculateAgeYears(birthDate);
  if (!Number.isInteger(ageYears) || ageYears < 0) {
    return "Data de nascimento invalida.";
  }
  if (ageYears < 6) {
    return "A triagem nao e para recem-nascidos, lactentes ou criancas menores de 6 anos.";
  }
  if (ageYears > 17) {
    return "O sistema e somente para triagem pediatrica, nao para adultos.";
  }
  return null;
};

const createPatient = async (req, res) => {
  try {
    const { full_name, sex, birth_date, guardian_name, guardian_phone } = req.body;

    if (!full_name || !sex || !birth_date || !guardian_name || !guardian_phone) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }

    const ageValidationError = validatePediatricBirthDate(birth_date);
    if (ageValidationError) {
      return res.status(400).json({ error: ageValidationError });
    }

    const patient = await patientModel.createPatient({
      full_name,
      sex,
      birth_date,
      guardian_name,
      guardian_phone,
    });

    return res.status(201).json(patient);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "clinical_code ja existe" });
    }
    return res.status(500).json({ error: "Erro ao criar paciente" });
  }
};

const getNextClinicalCode = async (_req, res) => {
  try {
    const clinical_code = await patientModel.getNextClinicalCode();
    return res.json({ clinical_code });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao obter proximo codigo clinico" });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await patientModel.getPatientById(id);
    if (!patient) return res.status(404).json({ error: "Paciente nao encontrado" });

    return res.json(patient);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar paciente" });
  }
};

const getPatientByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const patient = await patientModel.getPatientByCode(code);
    if (!patient) return res.status(404).json({ error: "Paciente nao encontrado" });

    return res.json(patient);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar paciente" });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length < 1) {
      return res.status(400).json({ error: "Informe pelo menos 1 letra no parametro name" });
    }

    const patients = await patientModel.searchPatients(name.trim());
    return res.json(patients);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao pesquisar pacientes" });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const ageValidationError = validatePediatricBirthDate(req.body?.birth_date);
    if (ageValidationError) {
      return res.status(400).json({ error: ageValidationError });
    }

    const updated = await patientModel.updatePatient(id, req.body);
    if (!updated) return res.status(404).json({ error: "Paciente nao encontrado" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar paciente" });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await patientModel.deletePatient(id);
    if (!deleted) return res.status(404).json({ error: "Paciente nao encontrado" });

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
  getNextClinicalCode,
  getPatientById,
  getPatientByCode,
  searchPatients,
  updatePatient,
  deletePatient,
  getPatientHistory,
};
