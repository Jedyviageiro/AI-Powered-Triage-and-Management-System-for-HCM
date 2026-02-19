const triageModel = require("../models/triageModel");

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

    const nurse_id = req.user?.id || null;

    if (!visit_id || !chief_complaint) {
      return res.status(400).json({ error: "visit_id e chief_complaint sao obrigatorios" });
    }

    const currentWeight = weight == null || weight === "" ? null : Number(weight);
    if (currentWeight != null && Number.isFinite(currentWeight)) {
      const lastWeightRow = await triageModel.getLastRecordedWeightForVisitPatient(visit_id);
      const lastWeight = lastWeightRow?.weight != null ? Number(lastWeightRow.weight) : null;

      if (lastWeight != null && Number.isFinite(lastWeight) && lastWeight > 0) {
        const ratio = currentWeight / lastWeight;
        if (ratio < 0.7 || ratio > 1.5) {
          return res.status(400).json({
            error: `Peso inconsistente com historico recente (${lastWeight} kg). Revise antes de salvar triagem.`,
          });
        }
      }
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
    if (err.code === "23505") {
      return res.status(400).json({ error: "Ja existe triagem para esta visita" });
    }
    return res.status(500).json({ error: "Erro ao criar triagem" });
  }
};

const getTriageById = async (req, res) => {
  try {
    const { id } = req.params;

    const triage = await triageModel.getTriageById(id);
    if (!triage) return res.status(404).json({ error: "Triagem nao encontrada" });

    return res.json(triage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar triagem" });
  }
};

const getTriageByVisitId = async (req, res) => {
  try {
    const { visit_id } = req.params;

    const triage = await triageModel.getTriageByVisitId(visit_id);
    if (!triage) return res.status(404).json({ error: "Triagem nao encontrada para esta visita" });

    return res.json(triage);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar triagem da visita" });
  }
};

const updateTriage = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await triageModel.updateTriage(id, req.body);
    if (!updated) return res.status(404).json({ error: "Triagem nao encontrada" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar triagem" });
  }
};

const deleteTriage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await triageModel.deleteTriage(id);
    if (!deleted) return res.status(404).json({ error: "Triagem nao encontrada" });

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
