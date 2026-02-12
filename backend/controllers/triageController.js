const triageModel = require("../models/triageModel");

// ========================
// CREATE TRIAGE
// POST /triages
// ========================
const createTriage = async (req, res) => {
  try {
    const {
      visit_id,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      chief_complaint,
      clinical_notes,
    } = req.body;

    // nurse_id vem do utilizador autenticado (vamos ligar isso depois no middleware)
    const nurse_id = req.user?.id || null;

    if (!visit_id || !chief_complaint) {
      return res.status(400).json({ error: "visit_id e chief_complaint são obrigatórios" });
    }

    const triage = await triageModel.createTriage({
      visit_id,
      nurse_id,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      chief_complaint,
      clinical_notes,
    });

    return res.status(201).json(triage);
  } catch (err) {
    // Unique constraint (visit_id único) -> já existe triagem para esta visita
    if (err.code === "23505") {
      return res.status(400).json({ error: "Já existe triagem para esta visita" });
    }
    return res.status(500).json({ error: "Erro ao criar triagem" });
  }
};

// ========================
// GET TRIAGE BY ID
// GET /triages/:id
// ========================
const getTriageById = async (req, res) => {
  try {
    const { id } = req.params;

    const triage = await triageModel.getTriageById(id);
    if (!triage) return res.status(404).json({ error: "Triagem não encontrada" });

    return res.json(triage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar triagem" });
  }
};

// ========================
// GET TRIAGE BY VISIT
// GET /triages/visit/:visit_id
// ========================
const getTriageByVisitId = async (req, res) => {
  try {
    const { visit_id } = req.params;

    const triage = await triageModel.getTriageByVisitId(visit_id);
    if (!triage) return res.status(404).json({ error: "Triagem não encontrada para esta visita" });

    return res.json(triage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar triagem da visita" });
  }
};

// ========================
// UPDATE TRIAGE
// PATCH /triages/:id
// ========================
const updateTriage = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await triageModel.updateTriage(id, req.body);
    if (!updated) return res.status(404).json({ error: "Triagem não encontrada" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar triagem" });
  }
};

// ========================
// DELETE TRIAGE
// DELETE /triages/:id
// ========================
const deleteTriage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await triageModel.deleteTriage(id);
    if (!deleted) return res.status(404).json({ error: "Triagem não encontrada" });

    return res.json({ message: "Triagem removida com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao remover triagem" });
  }
};

module.exports = {
  createTriage,
  getTriageById,
  getTriageByVisitId,
  updateTriage,
  deleteTriage,
};
