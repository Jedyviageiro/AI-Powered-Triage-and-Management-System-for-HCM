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
  const hintMatches = hints.filter((h) =>
    contextTokens.some((t) => t.includes(h) || h.includes(t))
  ).length;
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

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const buildTriageFallback = ({
  chiefComplaint,
  clinicalNotes,
  temperature,
  heartRate,
  respiratoryRate,
  oxygenSaturation,
}) => {
  const reasons = [];
  const complaint = String(chiefComplaint || "").trim();
  const notes = String(clinicalNotes || "").trim();
  const combinedText = normalizeText(`${complaint} ${notes}`);
  const temp = toNumber(temperature);
  const hr = toNumber(heartRate);
  const rr = toNumber(respiratoryRate);
  const spo2 = toNumber(oxygenSaturation);

  let suggested_priority = "NON_URGENT";
  let suggested_specialization = "Pediatria Geral";
  let red_flag = false;
  let confidence = 0.45;

  if (spo2 != null && spo2 <= 89) {
    red_flag = true;
    suggested_priority = "URGENT";
    reasons.push("SpO2 criticamente baixa");
  } else if (spo2 != null && spo2 <= 92) {
    suggested_priority = "URGENT";
    reasons.push("Saturacao de oxigenio reduzida");
  }

  if (temp != null && temp >= 39.5) {
    suggested_priority = "URGENT";
    reasons.push("Febre alta");
  } else if (temp != null && temp >= 38) {
    reasons.push("Febre");
  }

  if (hr != null && hr >= 160) {
    suggested_priority = "URGENT";
    reasons.push("Frequencia cardiaca elevada");
  }

  if (rr != null && rr >= 40) {
    suggested_priority = "URGENT";
    reasons.push("Frequencia respiratoria elevada");
  }

  if (
    /(falta de ar|dificuldade respiratoria|dispne|chiado|convuls|desmaio|letarg|inconsciente)/.test(
      combinedText
    )
  ) {
    suggested_priority = "URGENT";
    reasons.push("Sintomas com potencial gravidade");
  } else if (
    /(febre|tosse|vomito|v[oô]mito|diarre|dor abdominal|rash|erup)/.test(combinedText)
  ) {
    suggested_priority = suggested_priority === "URGENT" ? "URGENT" : "LESS_URGENT";
    reasons.push("Queixa clinica requer avaliacao medica");
  } else {
    reasons.push("Sem sinais de alarme maiores nos dados informados");
  }

  if (/(respira|tosse|chiado|asma|pulm)/.test(combinedText)) {
    suggested_specialization = "Pneumopediatra";
  } else if (/(diarre|vomito|abd|barriga|refluxo)/.test(combinedText)) {
    suggested_specialization = "Gastroenteropediatra";
  } else if (/(convuls|cefale|desmaio|neurol)/.test(combinedText)) {
    suggested_specialization = "Neuropediatra";
  } else if (/(febre|infecc|otite|gripe|pneumonia)/.test(combinedText)) {
    suggested_specialization = "Infectopediatra";
  }

  return {
    suggested_priority,
    suggested_specialization,
    confidence,
    red_flag,
    reasons: [...new Set(reasons)].slice(0, 4),
    questions_to_ask: [
      "Quando os sintomas comecaram?",
      "Os sintomas estao a piorar ou a melhorar?",
      "A crianca consegue beber liquidos e manter-se ativa?",
    ],
  };
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
    const fallback = buildTriageFallback({
      chiefComplaint: req.body?.chief_complaint,
      clinicalNotes: req.body?.clinical_notes,
      temperature: req.body?.temperature,
      heartRate: req.body?.heart_rate,
      respiratoryRate: req.body?.respiratory_rate,
      oxygenSaturation: req.body?.oxygen_saturation,
    });
    try {
      const doctors = await doctorModel.listDoctorsWithAvailability();
      const suggestedDoctor = recommendDoctor({
        doctors,
        suggestedSpecialty: fallback.suggested_specialization,
        chiefComplaint: req.body?.chief_complaint,
        clinicalNotes: req.body?.clinical_notes,
      });
      return res.json({
        disclaimer:
          "Sugestao de contingencia gerada por regras locais porque a IA falhou. Confirmar clinicamente antes de decidir.",
        suggested_doctor: suggestedDoctor,
        fallback_used: true,
        ...fallback,
      });
    } catch (doctorError) {
      console.error("AI TRIAGE FALLBACK DOCTOR ERROR:", doctorError);
      return res.json({
        disclaimer:
          "Sugestao de contingencia gerada por regras locais porque a IA falhou. Confirmar clinicamente antes de decidir.",
        suggested_doctor: null,
        fallback_used: true,
        ...fallback,
      });
    }
  }
};

module.exports = { nurseTriageAI };
