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
  const questionnaireBlock = Array.isArray(payload.questionnaire_answers)
    ? payload.questionnaire_answers
        .map((qa) => {
          const q = String(qa?.question || "").trim();
          const a = String(qa?.answer || "").trim();
          if (!q || !a) return null;
          return `  - ${q}: ${a}`;
        })
        .filter(Boolean)
        .join("\n")
    : "";

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
- respostas_questionario:
${questionnaireBlock || "  - n/a"}
- informacao_extra_paciente: ${payload.questionnaire_extra_note ?? "n/a"}
`;

  const fullPrompt = basePrompt + "\n\n" + dynamicData;

  const resp = await ai.models.generateContent({
    model: MODEL, // continua gemini-2.5-flash
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });

  const text = resp.text?.trim?.() || "";
  return extractJson(text);
}

async function doctorQuestionsSuggestion(payload) {
  const prompt = `
Voce e um medico pediatra assistente.
Gere APENAS JSON valido com este formato:
{
  "questions_to_clarify": ["pergunta 1", "pergunta 2", "pergunta 3"]
}

Regras:
- Maximo 5 perguntas.
- Perguntas curtas, objetivas, em portugues (uso local de Mocambique).
- Focadas na queixa principal e sinais vitais.
- Nao incluir diagnostico, prescricao, explicacoes longas ou texto fora de JSON.

DADOS DO CASO:
- idade(anos): ${payload.age_years ?? "desconhecida"}
- queixa principal: ${payload.chief_complaint ?? ""}
- notas clinicas: ${payload.clinical_notes ?? ""}
- temperatura: ${payload.temperature ?? "n/a"}
- FC: ${payload.heart_rate ?? "n/a"}
- FR: ${payload.respiratory_rate ?? "n/a"}
- SpO2: ${payload.oxygen_saturation ?? "n/a"}
- peso(kg): ${payload.weight ?? "n/a"}
- prioridade: ${payload.priority ?? "n/a"}
`;

  const resp = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  const text = resp.text?.trim?.() || "";
  return extractJson(text);
}


module.exports = { triageSeveritySuggestion, doctorDiagnosisSuggestion, doctorQuestionsSuggestion };
