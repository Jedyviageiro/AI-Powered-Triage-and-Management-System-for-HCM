const geminiService = require("../services/geminiService");

const nurseTriageAI = async (req, res) => {
  try {
    const {
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      age_years,
    } = req.body;

    if (!chief_complaint) {
      return res.status(400).json({ error: "chief_complaint é obrigatório" });
    }

    const result = await geminiService.triageSeveritySuggestion({
      chief_complaint,
      clinical_notes,
      temperature,
      heart_rate,
      respiratory_rate,
      oxygen_saturation,
      weight,
      age_years,
    });

    // Hard safety: nunca permitir retorno fora do escopo
    const allowed = ["URGENT", "LESS_URGENT", "NON_URGENT"];
    if (!allowed.includes(result.suggested_priority)) {
      result.suggested_priority = "LESS_URGENT";
    }

    return res.json({
      disclaimer:
        "Sugestão gerada por IA. Não substitui decisão clínica. Casos emergentes devem seguir protocolo fora do sistema.",
      ...result,
    });
   } catch (err) {
    console.error("AI TRIAGE ERROR:", err);
    return res.status(500).json({
      error: "Erro ao gerar sugestão de triagem por IA",
      debug: {
        message: err.message,
        name: err.name,
        stack: (err.stack || "").split("\n").slice(0, 6).join("\n"),
      },
    });
  }

};

module.exports = { nurseTriageAI };
