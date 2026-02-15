const geminiService = require("../services/geminiService");

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
      ...result,
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
