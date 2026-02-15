const { GoogleGenAI } = require("@google/genai");
const { loadPrompt } = require("../utils/promptLoader");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Melhor opção para triagem (rápido e atual)
const MODEL = "gemini-2.5-flash";

function extractJson(text) {
  if (!text) throw new Error("Resposta vazia da IA");

  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("IA não retornou JSON (sem chaves {})");
  }

  const slice = cleaned.slice(start, end + 1);
  return JSON.parse(slice);
}

async function triageSeveritySuggestion(payload) {
  const basePrompt = loadPrompt("triageSeverity.txt");

  const dynamicData = `
DADOS DO PACIENTE:
- idade(anos): ${payload.age_years ?? "desconhecida"}
- queixa: ${payload.chief_complaint ?? ""}
- notas: ${payload.clinical_notes ?? ""}
- temperatura: ${payload.temperature ?? "n/a"}
- FC: ${payload.heart_rate ?? "n/a"}
- FR: ${payload.respiratory_rate ?? "n/a"}
- SpO2: ${payload.oxygen_saturation ?? "n/a"}
- peso: ${payload.weight ?? "n/a"}
`;

  const fullPrompt = basePrompt + "\n\n" + dynamicData;

  const resp = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });

  const text = resp.text?.trim?.() || "";
  return extractJson(text);
}

async function doctorDiagnosisSuggestion(payload) {
  const basePrompt = loadPrompt("doctorDiagnosis.txt");

  const dynamicData = `
DADOS DO CASO:
- idade(anos): ${payload.age_years ?? "desconhecida"}
- queixa: ${payload.chief_complaint ?? ""}
- notas: ${payload.clinical_notes ?? ""}
- temperatura: ${payload.temperature ?? "n/a"}
- FC: ${payload.heart_rate ?? "n/a"}
- FR: ${payload.respiratory_rate ?? "n/a"}
- SpO2: ${payload.oxygen_saturation ?? "n/a"}
- peso(kg): ${payload.weight ?? "n/a"}
- prioridade: ${payload.priority ?? "n/a"}
`;

  const fullPrompt = basePrompt + "\n\n" + dynamicData;

  const resp = await ai.models.generateContent({
    model: MODEL, // continua gemini-2.5-flash
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });

  const text = resp.text?.trim?.() || "";
  return extractJson(text);
}


module.exports = { triageSeveritySuggestion, doctorDiagnosisSuggestion };
