export const EXAM_LABELS = {
  MALARIA_RDT: "Teste Rapido de Malaria (RDT)",
  GLICEMIA_CAPILAR: "Glicemia (capilar)",
  HIV_RAPIDO: "Teste Rapido de HIV",
  LAB_CENTRAL: "Hemograma / ionograma / urina",
  RAIO_X: "Raio-X",
  PARASITOLOGIA_FEZES: "Parasitologia de fezes",
  CULTURA_HEMOCULTURA: "Cultura / hemocultura",
  OUTRO: "Outro exame",
};

export const EXAM_PROTOCOLS = {
  MALARIA_RDT: {
    sampleLabel: "Sangue capilar",
    turnaroundLabel: "5 a 30 min",
    summary: "Teste rapido de triagem com leitura imediata e classificacao da carga parasitaria.",
    sections: [
      {
        title: "Leitura do teste",
        fields: [
          {
            key: "plasmodium",
            label: "Plasmodium",
            type: "select",
            required: true,
            options: ["Positivo", "Negativo", "Inconclusivo"],
          },
          {
            key: "parasitemia",
            label: "Parasitemia estimada",
            type: "number",
            step: "0.01",
            unit: "%",
            placeholder: "Ex.: 0.35",
          },
        ],
      },
    ],
  },
  GLICEMIA_CAPILAR: {
    sampleLabel: "Sangue capilar",
    turnaroundLabel: "5 a 20 min",
    summary: "Registar o valor medido e a interpretacao clinica inicial do resultado.",
    sections: [
      {
        title: "Leitura capilar",
        fields: [
          {
            key: "glicemia",
            label: "Glicemia",
            type: "number",
            required: true,
            step: "0.1",
            unit: "mg/dL",
            placeholder: "Ex.: 86",
          },
          {
            key: "classificacao",
            label: "Classificacao",
            type: "select",
            required: true,
            options: ["Hipoglicemia", "Normal", "Hiperglicemia"],
          },
        ],
      },
    ],
  },
  HIV_RAPIDO: {
    sampleLabel: "Sangue capilar / soro",
    turnaroundLabel: "10 a 30 min",
    summary: "Documentar a leitura do teste rapido e a necessidade de confirmacao adicional.",
    sections: [
      {
        title: "Leitura do teste",
        fields: [
          {
            key: "resultado",
            label: "Resultado",
            type: "select",
            required: true,
            options: ["Reagente", "Não reagente", "Inconclusivo"],
          },
          {
            key: "confirmatorio",
            label: "Teste confirmatório indicado",
            type: "select",
            required: true,
            options: ["Sim", "Não"],
          },
        ],
      },
    ],
  },
  LAB_CENTRAL: {
    sampleLabel: "Sangue venoso / urina",
    turnaroundLabel: "1h30 a 5h",
    summary: "Painel de laboratório central. Registe somente os parâmetros realmente executados.",
    sections: [
      {
        title: "Hemograma",
        fields: [
          {
            key: "hb",
            label: "Hemoglobina",
            type: "number",
            step: "0.1",
            unit: "g/dL",
            placeholder: "Ex.: 11.8",
          },
          {
            key: "hematocrito",
            label: "Hematocrito",
            type: "number",
            step: "0.1",
            unit: "%",
            placeholder: "Ex.: 34.5",
          },
          {
            key: "leucocitos",
            label: "Leucocitos",
            type: "number",
            step: "1",
            unit: "/mm3",
            placeholder: "Ex.: 8200",
          },
          {
            key: "plaquetas",
            label: "Plaquetas",
            type: "number",
            step: "1",
            unit: "/mm3",
            placeholder: "Ex.: 250000",
          },
        ],
      },
      {
        title: "Ionograma / urina",
        fields: [
          {
            key: "sodio",
            label: "Sodio",
            type: "number",
            step: "0.1",
            unit: "mEq/L",
            placeholder: "Ex.: 138",
          },
          {
            key: "potassio",
            label: "Potassio",
            type: "number",
            step: "0.1",
            unit: "mEq/L",
            placeholder: "Ex.: 4.2",
          },
          {
            key: "aspecto_urina",
            label: "Aspeto da urina",
            type: "select",
            options: ["Não avaliado", "Límpida", "Turva", "Hematúrica"],
          },
          {
            key: "proteinas_urina",
            label: "Proteínas na urina",
            type: "select",
            options: ["Não avaliado", "Negativo", "Traços", "+", "++", "+++"],
          },
        ],
      },
    ],
  },
  RAIO_X: {
    sampleLabel: "Imagem diagnostica",
    turnaroundLabel: "45 min a 3h",
    summary: "Registar o achado principal e a conclusao radiologica objetiva.",
    sections: [
      {
        title: "Laudo radiologico",
        fields: [
          {
            key: "achado",
            label: "Achado principal",
            type: "text",
            required: true,
            placeholder: "Ex.: infiltrado basal direito",
          },
          {
            key: "conclusao",
            label: "Conclusao radiologica",
            type: "text",
            required: true,
            placeholder: "Ex.: achados compativeis com pneumonia",
          },
        ],
      },
    ],
  },
  PARASITOLOGIA_FEZES: {
    sampleLabel: "Fezes frescas",
    turnaroundLabel: "24 a 48h uteis",
    summary: "Conferir material fresco e registar parasitas, ovos e cistos observados.",
    sections: [
      {
        title: "Microscopia",
        fields: [
          {
            key: "parasitas",
            label: "Parasitas identificados",
            type: "text",
            placeholder: "Ex.: giardia lamblia",
          },
          {
            key: "ovos_cistos",
            label: "Ovos / cistos",
            type: "select",
            required: true,
            options: ["Presentes", "Ausentes", "Duvidoso"],
          },
          {
            key: "consistencia",
            label: "Consistencia da amostra",
            type: "select",
            options: ["Formada", "Semi-formada", "Liquida"],
          },
        ],
      },
    ],
  },
  CULTURA_HEMOCULTURA: {
    sampleLabel: "Sangue / secrecao em meio proprio",
    turnaroundLabel: "48 a 72h uteis",
    summary: "Fluxo de microbiologia com incubacao prolongada e eventual antibiograma.",
    sections: [
      {
        title: "Crescimento",
        fields: [
          {
            key: "crescimento",
            label: "Crescimento bacteriano",
            type: "select",
            required: true,
            options: ["Sem crescimento", "Com crescimento", "Contaminacao suspeita"],
          },
          { key: "agente", label: "Agente isolado", type: "text", placeholder: "Ex.: E. coli" },
        ],
      },
      {
        title: "Suscetibilidade",
        fields: [
          {
            key: "sensibilidade",
            label: "Sensibilidade (resumo)",
            type: "text",
            placeholder: "Ex.: sensivel a ceftriaxona",
          },
        ],
      },
    ],
  },
  OUTRO: {
    sampleLabel: "Conforme protocolo",
    turnaroundLabel: "Variavel",
    summary: "Utilize este fluxo para pedidos manuais e descreva o resultado com clareza.",
    sections: [
      {
        title: "Campos livres",
        fields: [
          {
            key: "observacao",
            label: "Observacao tecnica",
            type: "text",
            placeholder: "Descreva o principal achado",
          },
          {
            key: "conclusao",
            label: "Conclusao",
            type: "text",
            placeholder: "Sintese final do exame",
          },
        ],
      },
    ],
  },
};

export const examLabel = (value, fallback = "") =>
  EXAM_LABELS[String(value || "").toUpperCase()] || fallback || value || "-";

export const buildStructuredMachineResult = (fields, values) =>
  (Array.isArray(fields) ? fields : []).reduce((acc, field) => {
    const rawValue = String(values?.[field.key] || "").trim();
    if (!rawValue) return acc;
    acc[field.key] = {
      label: field.label,
      value: field.type === "number" ? Number(rawValue) : rawValue,
      unit: field.unit || null,
      type: field.type || "text",
    };
    return acc;
  }, {});

export const getProtocolPresentation = (examKey, protocol) => {
  const key = String(examKey || "").toUpperCase();
  const presets = {
    MALARIA_RDT: {
      tone: "#92400e",
      bg: "#fff7ed",
      border: "#fed7aa",
      badge: "Protocolo rapido",
      compact: true,
    },
    GLICEMIA_CAPILAR: {
      tone: "#1d4ed8",
      bg: "#eff6ff",
      border: "#bfdbfe",
      badge: "Leitura imediata",
      compact: true,
    },
    HIV_RAPIDO: {
      tone: "#7c3aed",
      bg: "#f5f3ff",
      border: "#ddd6fe",
      badge: "Triagem rapida",
      compact: true,
    },
    LAB_CENTRAL: {
      tone: "#0f766e",
      bg: "#f0fdfa",
      border: "#99f6e4",
      badge: "Painel completo",
      compact: false,
    },
    RAIO_X: {
      tone: "#475569",
      bg: "#f8fafc",
      border: "#cbd5e1",
      badge: "Leitura de imagem",
      compact: true,
    },
    PARASITOLOGIA_FEZES: {
      tone: "#166534",
      bg: "#f0fdf4",
      border: "#bbf7d0",
      badge: "Microscopia",
      compact: true,
    },
    CULTURA_HEMOCULTURA: {
      tone: "#9a3412",
      bg: "#fff7ed",
      border: "#fdba74",
      badge: "Microbiologia",
      compact: false,
    },
    OUTRO: {
      tone: "#4b5563",
      bg: "#f9fafb",
      border: "#e5e7eb",
      badge: "Registo manual",
      compact: true,
    },
  };
  return (
    presets[key] || {
      tone: "#4b5563",
      bg: "#f9fafb",
      border: "#e5e7eb",
      badge: protocol?.sections?.length > 1 ? "Painel técnico" : "Protocolo",
      compact: (protocol?.sections?.length || 0) <= 1,
    }
  );
};

export const resolveSampleLabel = (visit, protocol) => {
  const explicitSample =
    String(visit?.lab_sample_type || "").trim() ||
    String(visit?.lab_result_json?.sample_type || "").trim();
  if (explicitSample) return explicitSample;

  const protocolSample = String(protocol?.sampleLabel || "").trim();
  if (protocolSample && protocolSample.toLowerCase() !== "conforme protocolo") {
    return protocolSample;
  }

  return "Não definido";
};
