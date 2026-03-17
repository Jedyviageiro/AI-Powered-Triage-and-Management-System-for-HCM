export const getShiftIcon = (shiftType) => {
  const type = String(shiftType || "").toUpperCase();
  const commonProps = {
    width: 15,
    height: 15,
    viewBox: "0 0 30 30",
    "aria-hidden": "true",
  };
  if (type === "MORNING" || type === "AFTERNOON") {
    return (
      <svg {...commonProps}>
        <path
          fill="#fbbf24"
          d="M 14.984375 0.98632812 A 1.0001 1.0001 0 0 0 14 2 L 14 5 A 1.0001 1.0001 0 1 0 16 5 L 16 2 A 1.0001 1.0001 0 0 0 14.984375 0.98632812 z M 5.796875 4.7988281 A 1.0001 1.0001 0 0 0 5.1015625 6.515625 L 7.2226562 8.6367188 A 1.0001 1.0001 0 1 0 8.6367188 7.2226562 L 6.515625 5.1015625 A 1.0001 1.0001 0 0 0 5.796875 4.7988281 z M 24.171875 4.7988281 A 1.0001 1.0001 0 0 0 23.484375 5.1015625 L 21.363281 7.2226562 A 1.0001 1.0001 0 1 0 22.777344 8.6367188 L 24.898438 6.515625 A 1.0001 1.0001 0 0 0 24.171875 4.7988281 z M 15 8 A 7 7 0 0 0 8 15 A 7 7 0 0 0 15 22 A 7 7 0 0 0 22 15 A 7 7 0 0 0 15 8 z M 2 14 A 1.0001 1.0001 0 1 0 2 16 L 5 16 A 1.0001 1.0001 0 1 0 5 14 L 2 14 z M 25 14 A 1.0001 1.0001 0 1 0 25 16 L 28 16 A 1.0001 1.0001 0 1 0 28 14 L 25 14 z M 7.9101562 21.060547 A 1.0001 1.0001 0 0 0 7.2226562 21.363281 L 5.1015625 23.484375 A 1.0001 1.0001 0 1 0 6.515625 24.898438 L 8.6367188 22.777344 A 1.0001 1.0001 0 0 0 7.9101562 21.060547 z M 22.060547 21.060547 A 1.0001 1.0001 0 0 0 21.363281 22.777344 L 23.484375 24.898438 A 1.0001 1.0001 0 1 0 24.898438 23.484375 L 22.777344 21.363281 A 1.0001 1.0001 0 0 0 22.060547 21.060547 z M 14.984375 23.986328 A 1.0001 1.0001 0 0 0 14 25 L 14 28 A 1.0001 1.0001 0 1 0 16 28 L 16 25 A 1.0001 1.0001 0 0 0 14.984375 23.986328 z"
        />
      </svg>
    );
  }
  if (type === "NIGHT") {
    return (
      <svg {...commonProps}>
        <path
          fill="#1e3a8a"
          d="M21.86 15.23A1 1 0 0 0 20.6 14a8 8 0 0 1-10.57-10.6A1 1 0 0 0 8.78 2.14a11 11 0 1 0 13.08 13.09Z"
        />
      </svg>
    );
  }
  return (
    <svg {...commonProps}>
      <path
        fill="currentColor"
        d="M15 7a1 1 0 0 0-1 1v7.59l-2.3 2.3a1 1 0 1 0 1.42 1.42l2.59-2.6A1 1 0 0 0 16 16V8a1 1 0 0 0-1-1Zm0-5a13 13 0 1 0 13 13A13 13 0 0 0 15 2Z"
      />
    </svg>
  );
};

export const formatStatus = (status) => {
  if (status === "WAITING") return "Aguardando Triagem";
  if (status === "IN_TRIAGE") return "Em Triagem";
  if (status === "WAITING_DOCTOR") return "Aguardando Médico";
  if (status === "IN_CONSULTATION") return "Em Consulta";
  if (status === "FINISHED") return "Finalizado";
  return status || "-";
};

export const formatPriorityPt = (priority) => {
  const normalized = String(priority || "").toUpperCase();
  if (normalized === "URGENT" || normalized === "HIGH") return "Urgente";
  if (normalized === "LESS_URGENT" || normalized === "MEDIUM") return "Pouco Urgente";
  if (normalized === "NON_URGENT" || normalized === "NOT_URGENT" || normalized === "LOW") {
    return "Não Urgente";
  }
  return priority || "-";
};

export const getVisitReasonLabel = (visit) => {
  const motive = String(visit?.visit_motive || "").toUpperCase();
  const returnReason = String(visit?.return_visit_reason || "").trim();
  const motiveOther = String(visit?.visit_motive_other || "").trim();
  const chief = String(
    visit?.chief_complaint || visit?.triage_chief_complaint || visit?.triage?.chief_complaint || ""
  ).trim();
  if (chief) return chief;
  if (returnReason) return returnReason;
  if (motive === "LAB_RESULTS") return "Retorno para resultado laboratorial";
  if (motive === "LAB_SAMPLE_COLLECTION") return "Retorno para colheita de amostra";
  if (motiveOther) return motiveOther;
  return "Sem motivo registado";
};

export const calculateAgeYears = (birthDate) => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  const hadBirthdayThisYear = now >= new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  return Math.max(0, now.getFullYear() - bd.getFullYear() - (hadBirthdayThisYear ? 0 : 1));
};

export const DISPOSITION_OPTIONS = [
  { value: "", label: "Selecionar destino" },
  { value: "BED_REST", label: "Repouso (bed rest)" },
  { value: "HOME", label: "Alta para casa" },
  { value: "RETURN_VISIT", label: "Retorno agendado" },
  { value: "ADMIT_URGENT", label: "Internar / urgência" },
  { value: "REFER_SPECIALIST", label: "Referir paciente" },
];

export const FOLLOW_UP_DIAGNOSIS_EVOLUTION_OPTIONS = [
  { value: "", label: "Selecionar evolução" },
  { value: "IMPROVED", label: "Melhorou" },
  { value: "UNCHANGED", label: "Manteve" },
  { value: "WORSENED", label: "Piorou" },
  { value: "RESOLVED", label: "Resolvido" },
];

export const FOLLOW_UP_PRESCRIPTION_DECISION_OPTIONS = [
  { value: "", label: "Selecionar decisão" },
  { value: "CONTINUE", label: "Continuar tratamento" },
  { value: "STOP", label: "Terminar tratamento" },
  { value: "CHANGE", label: "Trocar medicação" },
  { value: "ADD", label: "Adicionar outro medicamento" },
];

export const FOLLOW_UP_RULE_OPTIONS = [
  {
    value: "TREATMENT_MONITORING",
    label: "Monitorizar resposta ao tratamento",
    description:
      "Agendar retorno quando foi prescrita terapêutica e é preciso confirmar se a recuperação está a evoluir como esperado.",
  },
  {
    value: "INCOMPLETE_RECOVERY",
    label: "Recuperação ainda incompleta",
    description:
      "Agendar retorno quando os sintomas persistem e o doente precisa de nova observação para confirmar melhoria ou despistar complicações.",
  },
  {
    value: "CHRONIC_RECURRING",
    label: "Condição crónica ou recorrente",
    description:
      "Agendar retorno quando a doença exige vigilância periódica para acompanhar evolução, controlo terapêutico ou recorrência de sintomas.",
  },
];

export const LAB_EXAM_OPTIONS = [
  { value: "", label: "Selecionar exame" },
  { value: "MALARIA_RDT", label: "Teste Rápido de Malária (RDT)" },
  { value: "GLICEMIA_CAPILAR", label: "Glicemia (capilar)" },
  { value: "HIV_RAPIDO", label: "Teste Rápido de HIV" },
  { value: "LAB_CENTRAL", label: "Hemograma / ionograma / urina" },
  { value: "RAIO_X", label: "Raio-X" },
  { value: "PARASITOLOGIA_FEZES", label: "Parasitologia de fezes" },
  { value: "CULTURA_HEMOCULTURA", label: "Cultura / hemocultura" },
  { value: "OUTRO", label: "Outro exame (especificar)" },
];

export const LAB_ORDER_PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgente" },
  { value: "LESS_URGENT", label: "Pouco Urgente" },
  { value: "NON_URGENT", label: "Não Urgente" },
];

export const LAB_REQUEST_RULES = [
  {
    examType: "MALARIA_RDT",
    triggerLabel: "Febre",
    example: "Febre -> teste de malária",
    patterns: [/febre/, /calafrio/, /malaria/, /paludismo/],
    reasonTemplate:
      "Solicitar teste de malária para confirmar doença suspeita em contexto de febre.",
  },
  {
    examType: "LAB_CENTRAL",
    triggerLabel: "Suspeita de infeção",
    example: "Suspeita de infeção -> exame de sangue",
    patterns: [/infec[cç][aã]o/, /sépsis/, /sepse/, /leucocit/, /bacter/i],
    reasonTemplate:
      "Solicitar exame de sangue para confirmar infeção suspeita e obter dados adicionais para o diagnóstico.",
  },
  {
    examType: "LAB_CENTRAL",
    triggerLabel: "Suspeita de anemia",
    example: "Suspeita de anemia -> hemoglobina/hemograma",
    patterns: [/anemi/, /palidez/, /hemoglob/i],
    reasonTemplate: "Solicitar hemoglobina/hemograma para confirmar anemia suspeita.",
  },
  {
    examType: "LAB_CENTRAL",
    triggerLabel: "Suspeita de infeção urinária",
    example: "Suspeita de infeção urinária -> urina",
    patterns: [/urin[aá]r/, /dis[uú]ria/, /ardor urin[aá]rio/, /cistite/],
    reasonTemplate: "Solicitar exame de urina para investigar infeção urinária suspeita.",
  },
];

export const LAB_SAMPLE_PROTOCOLS = {
  MALARIA_RDT: {
    sameDayCollection: true,
    sampleType: "Sangue capilar (ou venoso)",
    quantity: "1-2 gotas (~5-10 uL)",
    idealTime: "Imediato (point-of-care)",
    notes: "Não requer transporte. Realizar na triagem/urgência.",
  },
  GLICEMIA_CAPILAR: {
    sameDayCollection: true,
    sampleType: "Sangue capilar",
    quantity: "1 gota (~0.5-1 uL)",
    idealTime: "Imediato (point-of-care)",
    notes: "Preferir jejum se possível, mas não obrigatório em urgência.",
  },
  HIV_RAPIDO: {
    sameDayCollection: true,
    sampleType: "Sangue capilar (ou venoso) / fluido oral",
    quantity: "1 gota (~5-10 uL) ou esfregaço oral",
    idealTime: "Imediato (point-of-care)",
    notes: "Aconselhamento obrigatório se positivo.",
  },
  LAB_CENTRAL: {
    sameDayCollection: true,
    sampleType: "Sangue venoso total / soro-plasma / urina de jato médio",
    quantity: "1-3 mL (sangue) ou 5-10 mL (urina)",
    idealTime: "Coletar o mais rápido possível",
    notes: "Evitar hemólise; urina idealmente manhã quando aplicável.",
  },
  RAIO_X: {
    sameDayCollection: false,
    sampleType: "Não aplicável",
    quantity: "Não aplicável",
    idealTime: "30 min - 2h (imagem)",
    notes: "Exame de imagem, sem coleta de amostra biológica.",
  },
  PARASITOLOGIA_FEZES: {
    sameDayCollection: false,
    sampleType: "Fezes frescas",
    quantity: "2-5 g",
    idealTime: "Preferência por amostra fresca da manhã",
    notes: "Ideal: 3 amostras em dias diferentes.",
  },
  CULTURA_HEMOCULTURA: {
    sameDayCollection: true,
    sampleType: "Sangue venoso (hemocultura) / fezes-pus (outras culturas)",
    quantity: "Sangue 1-5 mL por frasco | Fezes 1-2 g",
    idealTime: "Imediato (antes de antibióticos, se possível)",
    notes: "Assepsia rigorosa e etiquetagem com hora/volume/local.",
  },
};

export const LAB_RETURN_COLLECTION_RULES = {
  PARASITOLOGIA_FEZES: {
    offsetDays: 1,
    window: "07:30-10:00",
    warning:
      "Este exame requer amostra adequada (preferência de colheita matinal e, quando indicado, em dias diferentes). Não é recomendável coletar hoje.",
    patientNotes:
      "Trazer frasco limpo. Colher fezes frescas conforme orientação da equipa. Entregar na manhã do retorno.",
  },
  LAB_CENTRAL: {
    offsetDays: 1,
    window: "07:30-10:00",
    warning:
      "Alguns perfis deste pedido (ex.: urina para concentração) podem exigir primeira colheita da manhã. Não é recomendável coletar hoje.",
    patientNotes:
      "Trazer frasco limpo. Se for urina, colher a primeira urina da manhã conforme orientação clínica.",
  },
};

export const HOSPITAL_STATUS_OPTIONS = [
  { value: "", label: "Selecionar estado hospitalar" },
  { value: "IN_HOSPITAL", label: "Internado" },
  { value: "BED_REST", label: "Repouso / Acamado" },
  { value: "DISCHARGED", label: "Alta" },
  { value: "DECEASED", label: "Óbito" },
];

export const VITAL_STATUS_OPTIONS = [
  { value: "", label: "Selecionar estado vital" },
  { value: "ALIVE", label: "Vivo" },
  { value: "DECEASED", label: "Óbito" },
];

export const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const toISODate = (date) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const toValidDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const extractReturnReasonText = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw
    .replace(/retornos previstos:\s*\d+\s*\|\s*datas:\s*[^|]+/i, "")
    .replace(/^\s*\|\s*/, "")
    .trim();
};

export const buildReevaluationContext = (meta) => {
  if (!meta) return null;
  const reason = extractReturnReasonText(meta?.return_visit_reason);
  const hasReturnSignal = !!(meta?.return_visit_date || reason);
  if (!hasReturnSignal) return null;

  const scheduledDate = toValidDate(meta?.return_visit_date);
  const scheduledMoment = toValidDate(meta?.arrival_time || meta?.return_visit_date);
  const now = new Date();

  return {
    scheduledDateLabel: scheduledDate
      ? scheduledDate.toLocaleDateString("pt-PT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Sem data definida",
    scheduledTimeLabel: scheduledMoment
      ? scheduledMoment.toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Horario flexivel",
    reason: reason || "Retorno clínico agendado para reavaliação.",
    isEarlyOpen: scheduledMoment ? scheduledMoment.getTime() > now.getTime() : false,
  };
};

export const parseTimeValue = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return { hours, minutes, totalMinutes: hours * 60 + minutes };
};

export const extractFollowUpTimeValue = (value) => {
  const direct = parseTimeValue(value);
  if (direct) return value;
  const embedded = String(value || "").match(/\b(\d{2}:\d{2})\b/);
  return embedded ? embedded[1] : "";
};

export const formatTimeValueLabel = (value) => {
  const parsed = parseTimeValue(value);
  if (!parsed) return "-";
  return `${String(parsed.hours).padStart(2, "0")}:${String(parsed.minutes).padStart(2, "0")}`;
};

export const parseShiftWindow = (value) => {
  const match = String(value || "")
    .trim()
    .match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return null;
  const start = parseTimeValue(match[1]);
  const end = parseTimeValue(match[2]);
  if (!start || !end || end.totalMinutes <= start.totalMinutes) return null;
  return {
    start: match[1],
    end: match[2],
    startMinutes: start.totalMinutes,
    endMinutes: end.totalMinutes,
    label: `${match[1]}-${match[2]}`,
  };
};

export const isTimeWithinShiftWindow = (timeValue, shiftWindow) => {
  const time = parseTimeValue(timeValue);
  const shift = parseShiftWindow(shiftWindow);
  if (!time || !shift) return true;
  return time.totalMinutes >= shift.startMinutes && time.totalMinutes <= shift.endMinutes;
};

export const findFollowUpRuleMeta = (key) =>
  FOLLOW_UP_RULE_OPTIONS.find((option) => option.value === key) || null;

export const inferFollowUpRuleKey = ({ planDraft, selectedVisit }) => {
  const customReason = String(planDraft?.return_visit_reason || "")
    .trim()
    .toLowerCase();
  const diagnosis = String(planDraft?.likely_diagnosis || "")
    .trim()
    .toLowerCase();
  const prescription = String(planDraft?.prescription_text || "").trim();
  const followUpText = `${customReason} ${diagnosis}`.toLowerCase();

  if (
    /cr[oó]nic|recorrent|asma|diabet|hiperten|epilep|hiv|tb|tubercul|drepan|anemi/.test(
      followUpText
    )
  ) {
    return "CHRONIC_RECURRING";
  }
  if (/persist|mant[eé]m|incomplet|sem resolu|sem melhora|reavalia/.test(followUpText)) {
    return "INCOMPLETE_RECOVERY";
  }
  if (prescription) return "TREATMENT_MONITORING";
  if (selectedVisit?.is_lab_followup) return "INCOMPLETE_RECOVERY";
  return "";
};

export const buildFollowUpReasonText = (ruleKey, currentReason = "") => {
  const explicit = String(currentReason || "").trim();
  if (explicit) return explicit;
  if (ruleKey === "TREATMENT_MONITORING") {
    return "Retorno para monitorizar resposta ao tratamento prescrito.";
  }
  if (ruleKey === "INCOMPLETE_RECOVERY") {
    return "Retorno para reavaliar recuperação ainda incompleta e vigiar possíveis complicações.";
  }
  if (ruleKey === "CHRONIC_RECURRING") {
    return "Retorno para vigilância periódica de condição crónica ou recorrente.";
  }
  return "";
};

export const buildFollowUpInstructionsText = ({
  ruleKey,
  date,
  time,
  shiftWindow,
  currentInstructions = "",
}) => {
  const explicit = String(currentInstructions || "").trim();
  if (explicit) return explicit;
  const dateLabel = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "data a confirmar";
  const hourLabel = formatTimeValueLabel(time);
  const shiftLabel = parseShiftWindow(shiftWindow)?.label || null;

  if (ruleKey === "TREATMENT_MONITORING") {
    return `Comparecer em ${dateLabel} às ${hourLabel} para confirmar resposta ao tratamento, tolerância e necessidade de ajuste terapêutico${shiftLabel ? ` dentro do turno ${shiftLabel}` : ""}.`;
  }
  if (ruleKey === "INCOMPLETE_RECOVERY") {
    return `Comparecer em ${dateLabel} às ${hourLabel} para reavaliação clínica, confirmação de melhoria e despiste precoce de complicações${shiftLabel ? ` dentro do turno ${shiftLabel}` : ""}.`;
  }
  if (ruleKey === "CHRONIC_RECURRING") {
    return `Comparecer em ${dateLabel} às ${hourLabel} para seguimento periódico da condição crónica/recorrente, controlo de sintomas e revisão do plano terapêutico${shiftLabel ? ` dentro do turno ${shiftLabel}` : ""}.`;
  }
  return explicit;
};

export const inferLabRequestSupport = ({ triage, planDraft, selectedVisit }) => {
  const sourceText = [
    triage?.chief_complaint,
    triage?.clinical_notes,
    planDraft?.likely_diagnosis,
    planDraft?.clinical_reasoning,
    selectedVisit?.return_visit_reason,
  ]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");

  const matches = LAB_REQUEST_RULES.filter((rule) =>
    rule.patterns.some((pattern) => pattern.test(sourceText))
  );
  const primary = matches[0] || null;
  return {
    matches,
    primary,
    examples: LAB_REQUEST_RULES.map((rule) => rule.example),
  };
};

export const toMaybeNumber = (value) => {
  if (value === "" || value == null) return null;
  const normalized = Number(String(value).replace(",", "."));
  return Number.isFinite(normalized) ? normalized : null;
};

export const getVisitClinicalSnapshot = (visit) => ({
  temperature: toMaybeNumber(visit?.temperature ?? visit?.triage?.temperature),
  heart_rate: toMaybeNumber(visit?.heart_rate ?? visit?.triage?.heart_rate),
  respiratory_rate: toMaybeNumber(visit?.respiratory_rate ?? visit?.triage?.respiratory_rate),
  oxygen_saturation: toMaybeNumber(visit?.oxygen_saturation ?? visit?.triage?.oxygen_saturation),
  weight: toMaybeNumber(visit?.weight ?? visit?.triage?.weight),
  chief_complaint: String(
    visit?.chief_complaint || visit?.triage_chief_complaint || visit?.triage?.chief_complaint || ""
  ).trim(),
  clinical_notes: String(visit?.clinical_notes || visit?.triage?.clinical_notes || "").trim(),
});

export const getCurrentConsultationSnapshot = ({ triage, retakeVitals }) => ({
  temperature: toMaybeNumber(retakeVitals?.temperature) ?? toMaybeNumber(triage?.temperature),
  heart_rate: toMaybeNumber(retakeVitals?.heart_rate) ?? toMaybeNumber(triage?.heart_rate),
  respiratory_rate:
    toMaybeNumber(retakeVitals?.respiratory_rate) ?? toMaybeNumber(triage?.respiratory_rate),
  oxygen_saturation:
    toMaybeNumber(retakeVitals?.oxygen_saturation) ?? toMaybeNumber(triage?.oxygen_saturation),
  weight: toMaybeNumber(retakeVitals?.weight) ?? toMaybeNumber(triage?.weight),
  chief_complaint: String(triage?.chief_complaint || "").trim(),
  clinical_notes: String(triage?.clinical_notes || "").trim(),
});

export const compareSnapshots = (previousSnapshot, currentSnapshot) => {
  const metrics = [
    { key: "temperature", label: "Temperatura", unit: "°C" },
    { key: "heart_rate", label: "FC", unit: "bpm" },
    { key: "respiratory_rate", label: "FR", unit: "rpm" },
    { key: "oxygen_saturation", label: "SpO2", unit: "%" },
    { key: "weight", label: "Peso", unit: "kg" },
  ];

  return metrics
    .map((metric) => {
      const previous = toMaybeNumber(previousSnapshot?.[metric.key]);
      const current = toMaybeNumber(currentSnapshot?.[metric.key]);
      if (previous == null && current == null) return null;
      const delta =
        previous != null && current != null ? Number((current - previous).toFixed(2)) : null;
      return {
        ...metric,
        previous,
        current,
        delta,
      };
    })
    .filter(Boolean);
};

export const findLabExamLabel = (value) =>
  LAB_EXAM_OPTIONS.find(
    (option) => String(option.value || "").toUpperCase() === String(value || "").toUpperCase()
  )?.label || "Exame";

export const getLabSampleTypeByExam = (value) => {
  const key = String(value || "").toUpperCase();
  return LAB_SAMPLE_PROTOCOLS[key]?.sampleType || null;
};

export const makeEmptyPlanDraft = () => ({
  likely_diagnosis: "",
  clinical_reasoning: "",
  prescription_text: "",
  disposition_plan: "",
  disposition_reason: "",
  follow_up_when: "",
  follow_up_instructions: "",
  follow_up_return_if: "",
  no_charge_chronic: false,
  no_charge_reason: "",
  return_visit_date: "",
  return_visit_reason: "",
  lab_requested: false,
  lab_exam_type: "",
  lab_tests: "",
  lab_sample_collected_at: "",
  lab_result_text: "",
  lab_result_status: "",
  lab_result_ready_at: "",
  hospital_status: "",
  vital_status: "",
  is_bedridden: false,
  inpatient_unit: "",
  inpatient_bed: "",
  discharged_at: "",
  death_note: "",
});

export const planFromVisit = (visit) => ({
  likely_diagnosis: visit?.likely_diagnosis || "",
  clinical_reasoning: visit?.clinical_reasoning || "",
  prescription_text: visit?.prescription_text || "",
  disposition_plan: visit?.disposition_plan || "",
  disposition_reason: visit?.disposition_reason || "",
  follow_up_when: visit?.follow_up_when || "",
  follow_up_instructions: visit?.follow_up_instructions || "",
  follow_up_return_if: visit?.follow_up_return_if || "",
  no_charge_chronic: !!visit?.no_charge_chronic,
  no_charge_reason: visit?.no_charge_reason || "",
  return_visit_date: visit?.return_visit_date || "",
  return_visit_reason: visit?.return_visit_reason || "",
  lab_requested: !!visit?.lab_requested,
  lab_exam_type: visit?.lab_exam_type || "",
  lab_tests: visit?.lab_tests || "",
  lab_sample_collected_at: visit?.lab_sample_collected_at || "",
  lab_result_text: visit?.lab_result_text || "",
  lab_result_status: visit?.lab_result_status || "",
  lab_result_ready_at: visit?.lab_result_ready_at || "",
  hospital_status: visit?.hospital_status || "",
  vital_status: visit?.vital_status || "",
  is_bedridden: !!visit?.is_bedridden,
  inpatient_unit: visit?.inpatient_unit || "",
  inpatient_bed: visit?.inpatient_bed || "",
  discharged_at: toDatetimeLocalValue(visit?.discharged_at),
  death_note: visit?.death_note || "",
});

export const fallbackComplaintQuestions = (chiefComplaint = "") => {
  const complaint = String(chiefComplaint || "").toLowerCase();
  const base = [
    "O que está a sentir?",
    "Quando os sintomas começaram?",
    "Tem dor? Onde dói?",
    "A dor é forte ou fraca?",
    "Tem febre? Há quantos dias?",
  ];
  if (/(tosse|falta de ar|respira)/.test(complaint)) {
    return [...base, "Tem dificuldade para respirar?", "A tosse tem catarro ou sangue?"];
  }
  if (/(vomit|diarre|abdom|barriga)/.test(complaint)) {
    return [...base, "Teve vômitos ou diarreia?", "Consegue beber líquidos normalmente?"];
  }
  if (/(dor de cabeça|cefale|convuls)/.test(complaint)) {
    return [...base, "A dor de cabeça piora com luz/ruído?", "Teve desmaio ou convulsão?"];
  }
  return [...base, "Tem outro sintoma importante que queira relatar?"];
};

export const normalizeQuestions = (value) =>
  (Array.isArray(value) ? value : [])
    .map((question) => String(question || "").trim())
    .filter(Boolean)
    .slice(0, 8);

export const stripQuestionnaireBlock = (text = "") =>
  String(text || "")
    .replace(/^Questionário clínico:\n[\s\S]*?(?:\n\n|$)/i, "")
    .trim();

export const buildTriageFallback = (src) => {
  if (!src || typeof src !== "object") return null;
  const chief =
    src?.chief_complaint || src?.triage_chief_complaint || src?.triage?.chief_complaint || "";
  const notes =
    src?.clinical_notes || src?.triage_clinical_notes || src?.triage?.clinical_notes || "";
  const temperature = src?.temperature ?? src?.triage?.temperature ?? null;
  const oxygen = src?.oxygen_saturation ?? src?.triage?.oxygen_saturation ?? null;
  const heart = src?.heart_rate ?? src?.triage?.heart_rate ?? null;
  const resp = src?.respiratory_rate ?? src?.triage?.respiratory_rate ?? null;
  const weight = src?.weight ?? src?.triage?.weight ?? null;
  if (
    !chief &&
    !notes &&
    temperature == null &&
    oxygen == null &&
    heart == null &&
    resp == null &&
    weight == null
  ) {
    return null;
  }
  return {
    chief_complaint: chief,
    clinical_notes: notes,
    temperature,
    oxygen_saturation: oxygen,
    heart_rate: heart,
    respiratory_rate: resp,
    weight,
  };
};

export const isSameLocalDay = (value, refDate = new Date()) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return (
    date.getFullYear() === refDate.getFullYear() &&
    date.getMonth() === refDate.getMonth() &&
    date.getDate() === refDate.getDate()
  );
};

export const toSafeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
