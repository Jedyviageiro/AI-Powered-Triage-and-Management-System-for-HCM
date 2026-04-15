const { GoogleGenAI } = require("@google/genai");
const { loadPrompt } = require("../utils/promptLoader");
const { getWhoMedicationGuidance } = require("./firecrawlWhoService");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Melhor opção para triagem (rápido e atual)
const MODEL = "gemini-2.5-flash";
const RETRYABLE_AI_ERROR_PATTERN =
  /fetch failed|socket|UND_ERR_SOCKET|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|other side closed/i;
const TEMPORARILY_UNAVAILABLE_AI_ERROR_PATTERN =
  /unavailable|high demand|overloaded|try again later|503/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableAiError(error) {
  const message = String(error?.message || "");
  const causeMessage = String(error?.cause?.message || "");
  const code = String(error?.code || error?.cause?.code || "");
  return RETRYABLE_AI_ERROR_PATTERN.test(`${message} ${causeMessage} ${code}`);
}

function isTemporarilyUnavailableAiError(error) {
  const message = String(error?.message || "");
  const causeMessage = String(error?.cause?.message || "");
  const code = String(error?.code || error?.cause?.code || "");
  const status = Number(error?.status || error?.cause?.status || 0);
  return (
    status === 503 ||
    TEMPORARILY_UNAVAILABLE_AI_ERROR_PATTERN.test(
      `${message} ${causeMessage} ${code} ${status || ""}`
    )
  );
}

async function generateContentWithRetry({ model, contents }, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 3);
  const baseDelayMs = Math.max(100, Number(options.baseDelayMs) || 700);

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await ai.models.generateContent({ model, contents });
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !isRetryableAiError(error)) throw error;
      await sleep(baseDelayMs * attempt);
    }
  }
  throw lastError;
}

async function generateJsonWithRetry({ model, contents }, options = {}) {
  const maxAttempts = Math.max(1, Number(options.maxAttempts) || 3);
  const baseDelayMs = Math.max(150, Number(options.baseDelayMs) || 500);
  const reminderText =
    "Responda SOMENTE com JSON valido, sem markdown, sem comentarios e sem texto extra.";

  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const attemptContents =
        attempt === 1
          ? contents
          : [
              ...contents,
              {
                role: "user",
                parts: [{ text: reminderText }],
              },
            ];
      const resp = await generateContentWithRetry(
        { model, contents: attemptContents },
        options
      );
      const text = resp.text?.trim?.() || "";
      return extractJson(text);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts) throw error;
      await sleep(baseDelayMs * attempt);
    }
  }

  throw lastError;
}

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

  return generateJsonWithRetry({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
}

async function doctorDiagnosisSuggestion(payload) {
  const basePrompt = loadPrompt("doctorDiagnosis.txt");
  const followUpPrompt = loadPrompt("doctorFollowUpDecision.txt");
  const whoMedicationGuidance = await getWhoMedicationGuidance(payload);
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
- plano_do_medico_diagnostico: ${payload.doctor_likely_diagnosis ?? "n/a"}
- plano_do_medico_justificativa: ${payload.doctor_clinical_reasoning ?? "n/a"}
- plano_do_medico_prescricao: ${payload.doctor_prescription_text ?? "n/a"}
- comparacao_profissional_de_seguimento: ${payload.follow_up_comparison_context ? JSON.stringify(payload.follow_up_comparison_context) : "n/a"}
- contexto_de_retorno: ${payload.follow_up_context ? JSON.stringify(payload.follow_up_context) : "n/a"}
- contexto_de_pedido_laboratorial: ${payload.lab_request_context ? JSON.stringify(payload.lab_request_context) : "n/a"}
- referencias_who_medicacao:
${whoMedicationGuidance.groundingBlock}
`;

  const fullPrompt = `${basePrompt}

INSTRUCOES ADICIONAIS DE FONTES:
- Se houver referencias_who_medicacao abaixo, use-as como apoio prioritario para sugestoes de medicacao e manejo.
- Nao cite nem finja suporte da WHO quando referencias_who_medicacao estiver sem referencias relevantes.
- Se a referencia WHO for geral e nao trouxer dose especifica para este caso, explicite a incerteza em vez de inventar.

${followUpPrompt}

${dynamicData}`;

  const result = await generateJsonWithRetry({
    model: MODEL, // continua gemini-2.5-flash
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
  return {
    ...result,
    who_references: whoMedicationGuidance.references,
    who_grounding_used: whoMedicationGuidance.used,
  };
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

  return generateJsonWithRetry({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });
}

async function labResultExplanationSuggestion(payload) {
  const basePrompt = loadPrompt("lab_result_explanation_prompt.txt");
  const structuredResultJson =
    payload.lab_result_json && typeof payload.lab_result_json === "object"
      ? JSON.stringify(payload.lab_result_json, null, 2)
      : "n/a";
  const dynamicData = `
DADOS DO CASO:
- exame: ${payload.lab_exam_type ?? "n/a"}
- tipo_de_amostra: ${payload.lab_sample_type ?? "n/a"}
- resultado_laboratorial: ${payload.lab_result_text ?? ""}
- resultado_estruturado_json:
${structuredResultJson}
- queixa_principal: ${payload.chief_complaint ?? "n/a"}
- notas_clinicas: ${payload.clinical_notes ?? "n/a"}
- prioridade: ${payload.priority ?? "n/a"}
- diagnostico_medico_atual: ${payload.doctor_likely_diagnosis ?? "n/a"}
- justificativa_medica_atual: ${payload.doctor_clinical_reasoning ?? "n/a"}
- prescricao_medica_atual: ${payload.doctor_prescription_text ?? "n/a"}
`;

  const fullPrompt = `${basePrompt}\n\n${dynamicData}`;
  return generateJsonWithRetry({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
  });
}

module.exports = {
  triageSeveritySuggestion,
  doctorDiagnosisSuggestion,
  doctorQuestionsSuggestion,
  labResultExplanationSuggestion,
  isRetryableAiError,
  isTemporarilyUnavailableAiError,
};
