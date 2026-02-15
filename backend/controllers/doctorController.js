const doctorModel = require("../models/doctorModel");

// GET /doctors/availability
const listAvailability = async (req, res) => {
  try {
    const data = await doctorModel.listDoctorsWithAvailability();
    return res.json(data);
  } catch (err) {
    console.error("DOCTORS AVAIL ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar médicos" });
  }
};

// PATCH /doctors/checkin  (DOCTOR)
const checkin = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    const updated = await doctorModel.checkin(doctorId);
    if (!updated) {
      return res.status(404).json({ error: "Médico não encontrado/ativo" });
    }

    return res.json({ ok: true, doctor: updated });
  } catch (err) {
    console.error("DOCTOR CHECKIN ERROR:", err);
    return res.status(500).json({ error: "Erro ao fazer check-in" });
  }
};

// PATCH /doctors/checkout  (DOCTOR)
const checkout = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    const updated = await doctorModel.checkout(doctorId);
    if (!updated) {
      return res.status(404).json({ error: "Médico não encontrado/ativo" });
    }

    return res.json({ ok: true, doctor: updated });
  } catch (err) {
    console.error("DOCTOR CHECKOUT ERROR:", err);
    return res.status(500).json({ error: "Erro ao fazer check-out" });
  }
};

// PATCH /doctors/availability  (DOCTOR)
// body: { is_available: true|false }
const setAvailability = async (req, res) => {
  try {
    const doctorId = req.user?.id;
    const { is_available } = req.body;

    if (typeof is_available !== "boolean") {
      return res
        .status(400)
        .json({ error: "is_available deve ser boolean (true/false)" });
    }

    const updated = await doctorModel.setAvailability(doctorId, is_available);
    if (!updated) {
      return res.status(404).json({ error: "Médico não encontrado/ativo" });
    }

    return res.json({ ok: true, doctor: updated });
  } catch (err) {
    console.error("DOCTOR SET AVAIL ERROR:", err);
    return res.status(500).json({ error: "Erro ao atualizar disponibilidade" });
  }
};

// PATCH /doctors/heartbeat (DOCTOR)
// (mantém last_seen atualizado para aparecer online)
const heartbeat = async (req, res) => {
  try {
    const doctorId = req.user?.id;

    const updated = await doctorModel.heartbeat(doctorId);
    if (!updated) {
      return res.status(404).json({ error: "Médico não encontrado/ativo" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("DOCTOR HEARTBEAT ERROR:", err);
    return res.status(500).json({ error: "Erro no heartbeat" });
  }
};

module.exports = {
  listAvailability,
  checkin,
  checkout,
  setAvailability,
  heartbeat,
};
