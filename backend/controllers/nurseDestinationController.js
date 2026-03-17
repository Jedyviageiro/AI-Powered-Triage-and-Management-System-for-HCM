const visitModel = require("../models/visitModel");

const updateDestinationStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "id inválido" });
    }

    const nextStatus = String(req.body?.hospital_status || "")
      .trim()
      .toUpperCase();
    const allowedStatuses = new Set(["DISCHARGED", "TRANSFERRED"]);
    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ error: "hospital_status inválido" });
    }

    const updated = await visitModel.updateDestinationStatusByNurse(id, {
      hospital_status: nextStatus,
      nurse_discharge_note: req.body?.nurse_discharge_note ?? null,
    });

    if (!updated) {
      return res.status(403).json({
        error:
          nextStatus === "DISCHARGED"
            ? "Alta só é permitida após o médico definir destino como alta."
            : "Transferência só é permitida após o médico definir internamento/urgência.",
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("NURSE DESTINATION STATUS ERROR:", err);
    return res.status(500).json({ error: "Erro ao atualizar destino do paciente" });
  }
};

const registerAdmission = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "id inválido" });
    }

    const nextStatus = String(req.body?.hospital_status || "")
      .trim()
      .toUpperCase();
    const allowedStatuses = new Set(["IN_HOSPITAL", "BED_REST"]);
    if (!allowedStatuses.has(nextStatus)) {
      return res.status(400).json({ error: "hospital_status inválido" });
    }

    const updated = await visitModel.registerAdmissionByNurse(id, {
      hospital_status: nextStatus,
      inpatient_unit: req.body?.inpatient_unit ?? null,
      inpatient_bed: req.body?.inpatient_bed ?? null,
      nurse_discharge_note: req.body?.nurse_discharge_note ?? null,
    });

    if (!updated) {
      return res.status(403).json({
        error:
          nextStatus === "IN_HOSPITAL"
            ? "Internamento só é permitido após o médico definir internamento/urgência."
            : "Repouso só é permitido após o médico definir repouso/acamado.",
      });
    }

    return res.json(updated);
  } catch (err) {
    console.error("NURSE ADMISSION REGISTRATION ERROR:", err);
    return res.status(500).json({ error: "Erro ao registrar admissão do paciente" });
  }
};

module.exports = {
  registerAdmission,
  updateDestinationStatus,
};
