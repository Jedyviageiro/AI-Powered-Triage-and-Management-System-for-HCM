const visitModel = require("../models/visitModel");

// ========================
// CREATE VISIT (chegada)
// POST /visits
// body: { patient_id }
// ========================
const createVisit = async (req, res) => {
  try {
    const { patient_id } = req.body;

    if (!patient_id) {
      return res.status(400).json({ error: "patient_id é obrigatório" });
    }

    const visit = await visitModel.createVisit(patient_id);
    return res.status(201).json(visit);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao criar visita" });
  }
};

// ========================
// GET VISIT BY ID
// GET /visits/:id
// ========================
const getVisitById = async (req, res) => {
  try {
    const { id } = req.params;

    const visit = await visitModel.getVisitById(id);
    if (!visit) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(visit);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao buscar visita" });
  }
};

// ========================
// LIST ACTIVE VISITS (fila)
// GET /visits/active
// ========================
const listActiveVisits = async (req, res) => {
  try {
    const visits = await visitModel.listActiveVisits();
    return res.json(visits);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar visitas ativas" });
  }
};

// ========================
// SET TRIAGE PRIORITY
// PATCH /visits/:id/priority
// body: { priority, max_wait_minutes }
// ========================
const setTriagePriority = async (req, res) => {
  try {
    const { id } = req.params;
    const { priority, max_wait_minutes } = req.body;

    if (!priority || !max_wait_minutes) {
      return res.status(400).json({ error: "priority e max_wait_minutes são obrigatórios" });
    }

    const updated = await visitModel.setTriagePriority(id, priority, max_wait_minutes);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    // ✅ DEBUG COMPLETO
    console.log("ERROR setTriagePriority:", err);

    return res.status(500).json({
      error: "Erro ao definir prioridade da visita",
      debug: {
        message: err.message,
        code: err.code,
        detail: err.detail,
        hint: err.hint,
        where: err.where
      }
    });
  }
};

// ========================
// UPDATE STATUS
// PATCH /visits/:id/status
// body: { status }
// ========================
const updateVisitStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "status é obrigatório" });
    }

    const updated = await visitModel.updateVisitStatus(id, status);
    if (!updated) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar status da visita" });
  }
};

// ========================
// FINISH VISIT
// PATCH /visits/:id/finish
// ========================
const finishVisit = async (req, res) => {
  try {
    const { id } = req.params;

    const finished = await visitModel.finishVisit(id);
    if (!finished) return res.status(404).json({ error: "Visita não encontrada" });

    return res.json(finished);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao finalizar visita" });
  }
};

module.exports = {
  createVisit,
  getVisitById,
  listActiveVisits,
  setTriagePriority,
  updateVisitStatus,
  finishVisit,
};
