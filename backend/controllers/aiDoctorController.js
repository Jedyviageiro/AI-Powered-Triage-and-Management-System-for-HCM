const geminiService = require("../services/geminiService");

const normalizeList = (value) => (Array.isArray(value) ? value : []);
const clip = (value, max = 220) => {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return "";
  return s.length <= max ? s : `${s.slice(0, max - 3).trim()}...`;
};

const normalizePrescriptionPlan = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      medication: item?.medication || item?.item || "",
      dosage: item?.dosage || "",
      route: item?.route || "",
      frequency: item?.frequency || "",
      duration: item?.duration || "",
      instructions: item?.instructions || item?.note || "",
    }))
    .filter((p) => p.medication || p.instructions);
};

const normalizeDoctorResult = (result = {}) => {
  const prescription_plan = normalizePrescriptionPlan(
    result.prescription_plan || result.prescription_suggestions
  );

  return {
    red_flag: !!result.red_flag,
    summary: clip(result.summary, 260),
    likely_diagnosis: clip(result.likely_diagnosis || result.primary_diagnosis || "", 160),
    clinical_reasoning: clip(result.clinical_reasoning, 280),
    differential_diagnoses: normalizeList(result.differential_diagnoses).slice(0, 3),
    suggested_tests: normalizeList(result.suggested_tests).slice(0, 4),
    suggested_management: normalizeList(result.suggested_management).slice(0, 4),
    prescription_plan: prescription_plan.slice(0, 4),
    follow_up:
      result.follow_up && typeof result.follow_up === "object"
        ? result.follow_up
        : { when: "", instructions: "", return_if: "" },
    disposition:
      result.disposition && typeof result.disposition === "object"
        ? result.disposition
        : { plan: "", reason: "" },
    chronic_no_charge:
      result.chronic_no_charge && typeof result.chronic_no_charge === "object"
        ? result.chronic_no_charge
        : { suggested: false, reason: "" },
    questions_to_clarify: normalizeList(result.questions_to_clarify).slice(0, 3),
    confidence: Number.isFinite(Number(result.confidence))
      ? Number(result.confidence)
      : 0.5,
  };
};

const doctorAssistAI = async (req, res) => {
  try {
    const {
      age_years,
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      priority,
    } = req.body;

    if (!chief_complaint) {
      return res.status(400).json({ error: "chief_complaint é obrigatório" });
    }

    const result = await geminiService.doctorDiagnosisSuggestion({
      age_years,
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      priority,
    });

    return res.json({
      disclaimer:
        "Sugestão gerada por IA. Não substitui avaliação/decisão médica. Validar por protocolo local.",
      ...normalizeDoctorResult(result),
    });
  } catch (err) {
    console.error("AI DOCTOR ERROR:", err);
    return res.status(500).json({
      error: "Erro ao gerar sugestão de diagnóstico por IA",
      debug: { message: err.message },
    });
  }
};

module.exports = { doctorAssistAI };
