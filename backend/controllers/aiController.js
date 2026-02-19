const geminiService = require("../services/geminiService");
const doctorModel = require("../models/doctorModel");

const normalizeText = (v) =>
  String(v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (v) =>
  normalizeText(v)
    .split(" ")
    .filter((t) => t.length >= 3);

const SPECIALTY_HINTS = {
  infectopediatra: [
    "febre",
    "infecc",
    "tosse",
    "otite",
    "pneumonia",
    "diarreia",
    "vomito",
    "dengue",
    "gripe",
  ],
  "pediatria geral": ["dor", "mal estar", "viral", "acompanhamento"],
  neuropediatra: ["convuls", "cefale", "neurolog", "desmaio"],
  pneumopediatra: ["asma", "chiado", "dispne", "bronq", "respir"],
  gastroenteropediatra: ["abdominal", "diarreia", "vomito", "refluxo", "constip"],
  cardiopediatra: ["palpit", "cianose", "sopro", "cardi"],
};

const scoreDoctorBySpecialtyFit = (doctor, contextTokens, suggestedSpecialty) => {
  const spec = normalizeText(doctor?.specialization || "");
  if (!spec) return { score: 5, reason: "Sem especializacao cadastrada" };

  let score = 10;
  let reason = "Especializacao sem match direto";

  if (suggestedSpecialty && spec.includes(normalizeText(suggestedSpecialty))) {
    score += 80;
    reason = "Match direto com especializacao sugerida";
  }

  const hints = Object.entries(SPECIALTY_HINTS).find(([k]) => spec.includes(k))?.[1] || [];
  const hintMatches = hints.filter((h) => contextTokens.some((t) => t.includes(h) || h.includes(t))).length;
  if (hintMatches > 0) {
    score += hintMatches * 10;
    if (reason === "Especializacao sem match direto") {
      reason = "Match por sintomas com especializacao";
    }
  }

  return { score, reason };
};

const recommendDoctor = ({ doctors, suggestedSpecialty, chiefComplaint, clinicalNotes }) => {
  const available = (Array.isArray(doctors) ? doctors : []).filter(
    (d) => d && d.is_busy === false && d.is_available !== false
  );
  if (available.length === 0) return null;

  const contextTokens = tokenize(`${chiefComplaint || ""} ${clinicalNotes || ""}`);

  const ranked = available
    .map((d) => {
      const fit = scoreDoctorBySpecialtyFit(d, contextTokens, suggestedSpecialty);
      return {
        id: d.id,
        username: d.username,
        full_name: d.full_name,
        specialization: d.specialization || null,
        match_score: fit.score,
        match_reason: fit.reason,
      };
    })
    .sort((a, b) => b.match_score - a.match_score || a.full_name.localeCompare(b.full_name));

  return ranked[0] || null;
};

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
      return res.status(400).json({ error: "chief_complaint e obrigatorio" });
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

    const allowed = ["URGENT", "LESS_URGENT", "NON_URGENT"];
    if (!allowed.includes(result.suggested_priority)) {
      result.suggested_priority = "LESS_URGENT";
    }
    if (typeof result.suggested_specialization !== "string") {
      result.suggested_specialization = "";
    }

    const doctors = await doctorModel.listDoctorsWithAvailability();
    const suggestedDoctor = recommendDoctor({
      doctors,
      suggestedSpecialty: result.suggested_specialization,
      chiefComplaint: chief_complaint,
      clinicalNotes: clinical_notes,
    });

    return res.json({
      disclaimer:
        "Sugestao gerada por IA. Nao substitui decisao clinica. Casos emergentes devem seguir protocolo fora do sistema.",
      suggested_doctor: suggestedDoctor,
      ...result,
    });
  } catch (err) {
    console.error("AI TRIAGE ERROR:", err);
    return res.status(500).json({
      error: "Erro ao gerar sugestao de triagem por IA",
      debug: {
        message: err.message,
        name: err.name,
        stack: (err.stack || "").split("\n").slice(0, 6).join("\n"),
      },
    });
  }
};

module.exports = { nurseTriageAI };
