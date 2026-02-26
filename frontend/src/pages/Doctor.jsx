import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import AgendaView from "../components/doctors/AgendaView";
import DoctorQueuePanel from "../components/doctors/DoctorQueuePanel";

const formatStatus = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "IN_TRIAGE") return "Em Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  return s || "-";
};

const calculateAgeYears = (birthDate) => {
  if (!birthDate) return null;
  const bd = new Date(birthDate);
  if (Number.isNaN(bd.getTime())) return null;
  const now = new Date();
  const hadBirthdayThisYear =
    now >= new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
  return Math.max(0, now.getFullYear() - bd.getFullYear() - (hadBirthdayThisYear ? 0 : 1));
};

const DISPOSITION_OPTIONS = [
  { value: "", label: "Selecionar destino" },
  { value: "BED_REST", label: "Repouso (bed rest)" },
  { value: "HOME", label: "Alta para casa" },
  { value: "RETURN_VISIT", label: "Retorno agendado" },
  { value: "ADMIT_URGENT", label: "Internar / urgência" },
];

const LAB_EXAM_OPTIONS = [
  { value: "", label: "Selecionar exame" },
  { value: "HEMOGRAMA", label: "Hemograma" },
  { value: "MALARIA", label: "Teste de malária" },
  { value: "RAIO_X", label: "Raio-X" },
  { value: "URINA", label: "Urina tipo 1" },
  { value: "BIOQUIMICA", label: "Bioquímica" },
  { value: "OUTRO", label: "Outro" },
];

const HOSPITAL_STATUS_OPTIONS = [
  { value: "", label: "Selecionar estado hospitalar" },
  { value: "IN_HOSPITAL", label: "Internado" },
  { value: "BED_REST", label: "Repouso / Acamado" },
  { value: "DISCHARGED", label: "Alta" },
  { value: "TRANSFERRED", label: "Transferido" },
  { value: "DECEASED", label: "Óbito" },
];

const VITAL_STATUS_OPTIONS = [
  { value: "", label: "Selecionar estado vital" },
  { value: "ALIVE", label: "Vivo" },
  { value: "DECEASED", label: "Óbito" },
  { value: "UNKNOWN", label: "Desconhecido" },
];

const toDatetimeLocalValue = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const makeEmptyPlanDraft = () => ({
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

const planFromVisit = (visit) => ({
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

const fallbackComplaintQuestions = (chiefComplaint = "") => {
  const c = String(chiefComplaint || "").toLowerCase();
  const base = [
    "O que está a sentir?",
    "Quando os sintomas começaram?",
    "Tem dor? Onde dói?",
    "A dor é forte ou fraca?",
    "Tem febre? Há quantos dias?",
  ];
  if (/(tosse|falta de ar|respira)/.test(c)) {
    return [...base, "Tem dificuldade para respirar?", "A tosse tem catarro ou sangue?"];
  }
  if (/(vomit|diarre|abdom|barriga)/.test(c)) {
    return [...base, "Teve vômitos ou diarreia?", "Consegue beber líquidos normalmente?"];
  }
  if (/(dor de cabeça|cefale|convuls)/.test(c)) {
    return [...base, "A dor de cabeça piora com luz/ruído?", "Teve desmaio ou convulsão?"];
  }
  return [...base, "Tem outro sintoma importante que queira relatar?"];
};

const normalizeQuestions = (value) =>
  (Array.isArray(value) ? value : [])
    .map((q) => String(q || "").trim())
    .filter(Boolean)
    .slice(0, 8);

const stripQuestionnaireBlock = (text = "") =>
  String(text || "").replace(/^Questionário clínico:\n[\s\S]*?(?:\n\n|$)/i, "").trim();

const buildTriageFallback = (src) => {
  if (!src || typeof src !== "object") return null;
  const chief = src?.chief_complaint || src?.triage_chief_complaint || src?.triage?.chief_complaint || "";
  const notes = src?.clinical_notes || src?.triage_clinical_notes || src?.triage?.clinical_notes || "";
  const temperature = src?.temperature ?? src?.triage?.temperature ?? null;
  const oxygen = src?.oxygen_saturation ?? src?.triage?.oxygen_saturation ?? null;
  const heart = src?.heart_rate ?? src?.triage?.heart_rate ?? null;
  const resp = src?.respiratory_rate ?? src?.triage?.respiratory_rate ?? null;
  const weight = src?.weight ?? src?.triage?.weight ?? null;
  if (!chief && !notes && temperature == null && oxygen == null && heart == null && resp == null && weight == null) {
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

const isSameLocalDay = (value, refDate = new Date()) => {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === refDate.getFullYear() &&
    d.getMonth() === refDate.getMonth() &&
    d.getDate() === refDate.getDate()
  );
};

export default function Doctor() {
  const me = getUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("dashboard");
  const [topNavSearch, setTopNavSearch] = useState("");
  const [topSearchFocus, setTopSearchFocus] = useState(false);

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [agenda, setAgenda] = useState({ assigned_today: [], returns_today: [] });
  const [loadingAgenda, setLoadingAgenda] = useState(true);
  const [err, setErr] = useState("");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [triage, setTriage] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [_patientHistory, setPatientHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiSuggestionOpen, setAiSuggestionOpen] = useState(false);
  const [planDraft, setPlanDraft] = useState(makeEmptyPlanDraft());
  const [planAccepted, setPlanAccepted] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [startingConsultation, setStartingConsultation] = useState(false);
  const [popup, setPopup] = useState({
    open: false,
    type: "warning",
    title: "",
    message: "",
  });
  const [questionnaireLoading, setQuestionnaireLoading] = useState(false);
  const [useAIQuestionnaire, setUseAIQuestionnaire] = useState(false);
  const [questionnaireQuestions, setQuestionnaireQuestions] = useState([]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [questionnaireExtraNote, setQuestionnaireExtraNote] = useState("");
  const [labResultDrafts, setLabResultDrafts] = useState({});
  const [labResultReadyDrafts, setLabResultReadyDrafts] = useState({});
  const [savingLabResultId, setSavingLabResultId] = useState(null);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historySearchLoading, setHistorySearchLoading] = useState(false);
  const [historySearchResults, setHistorySearchResults] = useState([]);
  const [historyModal, setHistoryModal] = useState({
    open: false,
    patient: null,
    visits: [],
    loading: false,
  });

  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(true);
  const detailsPanelRef = useRef(null);

  const stopIntervals = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
  };

  const safeSet = (fn) => { if (mountedRef.current) fn(); };
  const showPopup = (type, title, message) => {
    safeSet(() => setPopup({ open: true, type, title, message }));
  };
  const closePopup = () => {
    safeSet(() => {
      setPopup({ open: false, type: "warning", title: "", message: "" });
      setErr("");
    });
  };

  const filteredQueue = useMemo(() => {
    return (Array.isArray(queue) ? queue : []).filter(
      (v) => v.status === "WAITING_DOCTOR" || v.status === "IN_CONSULTATION"
    );
  }, [queue]);

  const waitingCount = useMemo(() => filteredQueue.filter(v => v.status === "WAITING_DOCTOR").length, [filteredQueue]);
  const inConsultCount = useMemo(() => filteredQueue.filter(v => v.status === "IN_CONSULTATION").length, [filteredQueue]);

  const aiEnabled = useMemo(() => {
    return (
      !!selectedVisit?.id &&
      selectedVisit.status === "IN_CONSULTATION" &&
      !!triage?.chief_complaint
    );
  }, [selectedVisit?.id, selectedVisit?.status, triage?.chief_complaint]);

  const complaintQuestions = useMemo(() => {
    if (questionnaireQuestions.length > 0) return questionnaireQuestions;
    if (selectedVisit?.status === "IN_CONSULTATION") return [];
    return fallbackComplaintQuestions(triage?.chief_complaint || "");
  }, [questionnaireQuestions, triage?.chief_complaint, selectedVisit?.status]);

  const pendingLabVisits = useMemo(() => {
    const rows = Array.isArray(queue) ? queue : [];
    return rows.filter((v) => {
      const hasResult = !!String(v?.lab_result_text || "").trim();
      const statusReady = String(v?.lab_result_status || "").toUpperCase() === "READY";
      return !!v?.lab_requested && !hasResult && !statusReady;
    });
  }, [queue]);

  const hasUnsavedLabRequest = useMemo(() => {
    if (!selectedVisit?.id) return false;
    const alreadySaved = !!selectedVisit?.lab_requested;
    return !!planDraft?.lab_requested && !alreadySaved;
  }, [selectedVisit?.id, selectedVisit?.lab_requested, planDraft?.lab_requested]);

  const labPendingDisplayRows = useMemo(() => {
    const base = Array.isArray(pendingLabVisits) ? pendingLabVisits : [];
    if (!hasUnsavedLabRequest || !selectedVisit?.id) return base;
    const exists = base.some((v) => Number(v?.id) === Number(selectedVisit.id));
    if (exists) return base;
    return [
      {
        ...selectedVisit,
        full_name: patientDetails?.full_name || selectedVisit?.full_name || "-",
        clinical_code: patientDetails?.clinical_code || selectedVisit?.clinical_code || "",
        lab_exam_type: planDraft?.lab_exam_type || "",
        lab_tests: planDraft?.lab_tests || "",
        __unsaved_lab_request: true,
      },
      ...base,
    ];
  }, [pendingLabVisits, hasUnsavedLabRequest, selectedVisit, patientDetails, planDraft?.lab_exam_type, planDraft?.lab_tests]);

  const agendaAssignedTodayCount = useMemo(() => {
    const rows = Array.isArray(agenda?.assigned_today) ? agenda.assigned_today : [];
    const today = new Date();
    return rows.filter((v) => isSameLocalDay(v?.arrival_time, today)).length;
  }, [agenda?.assigned_today]);

  const agendaReturnsTodayCount = useMemo(() => {
    const rows = Array.isArray(agenda?.returns_today) ? agenda.returns_today : [];
    const today = new Date();
    return rows.filter((v) => isSameLocalDay(v?.return_visit_date, today)).length;
  }, [agenda?.returns_today]);

  const agendaTodayCount = agendaAssignedTodayCount + agendaReturnsTodayCount;

  const loadQueue = async () => {
    if (!mountedRef.current) return;
    safeSet(() => { setErr(""); setLoadingQueue(true); });
    try {
      const data = await api.getQueue();
      safeSet(() => setQueue(Array.isArray(data) ? data : []));
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setLoadingQueue(false));
    }
  };

  const openVisit = async (visitId, previewVisit = null) => {
    if (!mountedRef.current) return;
    safeSet(() => {
      setErr("");
      setLoadingDetails(true);
      setSelectedVisit(previewVisit || null);
      setTriage(null);
      setPatientDetails(null);
      setPatientHistory([]);
      setAiResult(null);
      setAiSuggestionOpen(false);
      setPlanDraft(makeEmptyPlanDraft());
      setPlanAccepted(false);
      setQuestionnaireQuestions([]);
      setQuestionnaireAnswers({});
      setQuestionnaireExtraNote("");
      setUseAIQuestionnaire(false);
    });
    try {
      const v = await api.getVisitById(visitId);
      safeSet(() => {
        setSelectedVisit(v);
        const fallback = buildTriageFallback(previewVisit) || buildTriageFallback(v);
        if (fallback) setTriage(fallback);
        setPlanDraft(planFromVisit(v));
        setPlanAccepted(!!v?.plan_accepted_at);
        setQuestionnaireQuestions(
          normalizeQuestions(v?.doctor_questionnaire_json?.questions)
        );
        const hasExistingQuestions =
          normalizeQuestions(v?.doctor_questionnaire_json?.questions).length > 0;
        setUseAIQuestionnaire(hasExistingQuestions);
        setQuestionnaireAnswers(
          v?.doctor_questionnaire_json?.answers &&
            typeof v.doctor_questionnaire_json.answers === "object"
            ? v.doctor_questionnaire_json.answers
            : v?.doctor_questionnaire_json && typeof v.doctor_questionnaire_json === "object"
              ? v.doctor_questionnaire_json
            : {}
        );
        setQuestionnaireExtraNote(String(v?.doctor_questionnaire_json?.extra_note || ""));
      });
      try {
        const [p, h] = await Promise.all([
          api.getPatientById(v.patient_id),
          api.getPatientHistory(v.patient_id),
        ]);
        safeSet(() => {
          setPatientDetails(p || null);
          setPatientHistory(Array.isArray(h) ? h : []);
        });
      } catch {
        safeSet(() => {
          setPatientDetails(null);
          setPatientHistory([]);
        });
      }
      try {
        const t = await api.getTriageByVisitId(visitId);
        safeSet(() => setTriage(t || buildTriageFallback(previewVisit) || buildTriageFallback(v)));
      } catch {
        safeSet(() => setTriage(buildTriageFallback(previewVisit) || buildTriageFallback(v)));
      }
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setLoadingDetails(false));
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const boot = async () => {
      try { await api.doctorCheckin?.(); } catch (e) { safeSet(() => setErr(e.message)); }
      await loadQueue();
      await loadAgenda();
      intervalRef.current = setInterval(() => {
        loadQueue();
        loadAgenda();
      }, 30 * 60 * 1000);
      heartbeatRef.current = setInterval(async () => {
        try { await api.doctorHeartbeat?.(); } catch { /* ignore */ }
      }, 30000);
    };
    boot();
    return () => { mountedRef.current = false; stopIntervals(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeView === "agenda") {
      loadAgenda();
    }
    if (activeView === "lab") {
      loadQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView]);

  useEffect(() => {
    if (err) showPopup("warning", "Atenção", err);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [err]);

  const logout = async () => {
    stopIntervals();
    try { await api.doctorCheckout?.(); } catch { /* ignore */ }
    clearAuth();
    window.location.replace("/login");
  };

  const startConsultation = async () => {
    if (!selectedVisit?.id) return;
    if (selectedVisit?.doctor_id && Number(selectedVisit.doctor_id) !== Number(me?.id)) {
      safeSet(() => setErr("Esta visita está atribuída a outro médico."));
      return;
    }
    if (selectedVisit.status === "IN_CONSULTATION") {
      safeSet(() => setErr("Esta visita já está em consulta."));
      return;
    }
    if (selectedVisit.status !== "WAITING_DOCTOR") {
      safeSet(() =>
        setErr(`O paciente precisa estar em 'Aguardando Médico'. Estado atual: ${formatStatus(selectedVisit.status)}.`)
      );
      return;
    }
    if (!hasTriageForConsult) {
      safeSet(() => setErr("Não pode iniciar consulta sem triagem registrada."));
      return;
    }
    safeSet(() => {
      setErr("");
      setStartingConsultation(true);
    });
    try {
      await api.startConsultation(selectedVisit.id);
      await openVisit(selectedVisit.id);
      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setStartingConsultation(false));
    }
  };

  const searchFromTopNav = async () => {
    const q = topNavSearch.trim();
    if (!q) {
      safeSet(() => setErr("Escreva um nome para pesquisar."));
      return;
    }
    safeSet(() => setErr(""));
    try {
      const patients = await api.searchPatients(q);
      const list = Array.isArray(patients) ? patients : [];
      if (list.length === 0) {
        safeSet(() => setErr("Nenhum paciente encontrado com esse nome."));
        return;
      }
      const first = list[0];
      const row = (Array.isArray(queue) ? queue : []).find((v) => Number(v?.patient_id) === Number(first?.id));
      if (!row?.id) {
        safeSet(() => setErr("Paciente encontrado, mas sem visita ativa na fila."));
        return;
      }
      safeSet(() => setActiveView("queue"));
      await openVisit(row.id, row);
      setTimeout(() => {
        detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    } catch (e) {
      safeSet(() => setErr(e.message));
    }
  };

  const finishConsultation = async () => {
    if (!selectedVisit?.id) return;

    if (finishMissingFields.length > 0) {
      safeSet(() =>
        setErr(`Não é possível finalizar a consulta. Falta: ${finishMissingFields.join(", ")}.`)
      );
      return;
    }

    safeSet(() => setErr(""));
    try {
      const questionnaireText = complaintQuestions
        .map((q) => {
          const a = (questionnaireAnswers[q] || "").trim();
          return a ? `- ${q}\n  Resposta: ${a}` : null;
        })
        .filter(Boolean)
        .join("\n");
      const baseReasoning = stripQuestionnaireBlock(planDraft.clinical_reasoning);
      const mergedReasoning = useAIQuestionnaire && questionnaireText
        ? [`Questionário clínico:\n${questionnaireText}`, baseReasoning].filter(Boolean).join("\n\n")
        : baseReasoning;

      await api.saveVisitMedicalPlan(selectedVisit.id, {
        ...planDraft,
        clinical_reasoning: mergedReasoning,
        doctor_questionnaire_json: {
          locale: "pt-MZ",
          source: "ai",
          chief_complaint: triage?.chief_complaint || "",
          questions: complaintQuestions,
          answers: questionnaireAnswers,
          extra_note: String(questionnaireExtraNote || "").trim(),
          generated_at: new Date().toISOString(),
        },
        accepted: !!planAccepted,
      });
      await api.finishVisit(selectedVisit.id);
      safeSet(() => {
        setSelectedVisit(null);
        setTriage(null);
        setPatientDetails(null);
        setPatientHistory([]);
        setAiResult(null);
        setAiSuggestionOpen(false);
        setPlanDraft(makeEmptyPlanDraft());
        setPlanAccepted(false);
        setQuestionnaireQuestions([]);
        setQuestionnaireAnswers({});
        setQuestionnaireExtraNote("");
      });
      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
    }
  };

  const askDoctorAI = async () => {
    if (!selectedVisit?.id) return;
    if (selectedVisit.status !== "IN_CONSULTATION") {
      safeSet(() => setErr("Inicie a consulta antes de usar a IA."));
      return;
    }
    if (!triage?.chief_complaint) {
      safeSet(() => setErr("Não há dados de triagem suficientes para pedir sugestão da IA."));
      return;
    }
    const answeredCount = complaintQuestions.filter((q) => String(questionnaireAnswers[q] || "").trim()).length;
    if (useAIQuestionnaire && answeredCount === 0 && !String(questionnaireExtraNote || "").trim()) {
      safeSet(() => setErr("Responda o questionário (ou adicione informação extra) antes de pedir sugestão da IA."));
      return;
    }
    safeSet(() => {
      setErr("");
      setAiLoading(true);
      setAiResult(null);
      setAiSuggestionOpen(true);
    });
    try {
      const res = await api.aiDoctorSuggest({
        age_years: calculateAgeYears(patientDetails?.birth_date),
        chief_complaint: triage?.chief_complaint || "",
        clinical_notes: triage?.clinical_notes || "",
        temperature: triage?.temperature ?? null,
        heart_rate: triage?.heart_rate ?? null,
        respiratory_rate: triage?.respiratory_rate ?? null,
        oxygen_saturation: triage?.oxygen_saturation ?? null,
        weight: triage?.weight ?? null,
        priority: selectedVisit?.priority ?? null,
        questionnaire_answers: useAIQuestionnaire
          ? complaintQuestions
          .map((q) => ({ question: q, answer: String(questionnaireAnswers[q] || "").trim() }))
          .filter((item) => item.answer)
          : [],
        questionnaire_extra_note: useAIQuestionnaire ? String(questionnaireExtraNote || "").trim() || null : null,
      });
      safeSet(() => {
        setAiResult(res);
      });
    } catch (e) {
      safeSet(() => setErr(e.message));
      safeSet(() => setAiSuggestionOpen(false));
    } finally {
      safeSet(() => setAiLoading(false));
    }
  };

  const generateQuestionnaireFromAI = async ({ visitId, chiefComplaint }) => {
    if (!visitId || !chiefComplaint) return;
    setQuestionnaireLoading(true);
    setErr("");
    try {
      const visit = await api.getVisitById(visitId);

      const res = await api.aiDoctorSuggest({
        age_years: calculateAgeYears(patientDetails?.birth_date),
        chief_complaint: chiefComplaint || "",
        clinical_notes: triage?.clinical_notes || "",
        temperature: triage?.temperature ?? null,
        heart_rate: triage?.heart_rate ?? null,
        respiratory_rate: triage?.respiratory_rate ?? null,
        oxygen_saturation: triage?.oxygen_saturation ?? null,
        weight: triage?.weight ?? null,
        priority: selectedVisit?.priority ?? null,
        generate_questions_only: true,
      });
      const generated = normalizeQuestions(res?.questions_to_clarify);
      const questions = generated.length > 0 ? generated : fallbackComplaintQuestions(chiefComplaint || "");
      setQuestionnaireQuestions(questions);
      setQuestionnaireAnswers({});
      setQuestionnaireExtraNote("");

      const base = planFromVisit(visit);
      await api.saveVisitMedicalPlan(visitId, {
        ...base,
        doctor_questionnaire_json: {
          locale: "pt-MZ",
          source: "ai",
          chief_complaint: chiefComplaint,
          questions,
          answers: {},
          extra_note: "",
          generated_at: new Date().toISOString(),
        },
        accepted: !!visit?.plan_accepted_at,
      });
    } catch (e) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("demorou")) {
        setErr("A IA demorou a responder. Usámos perguntas padrão para continuar.");
      } else {
        setErr(msg);
      }
      setQuestionnaireQuestions(fallbackComplaintQuestions(chiefComplaint || ""));
    } finally {
      setQuestionnaireLoading(false);
    }
  };

  const toggleAIQuestionnaire = async (enabled) => {
    setUseAIQuestionnaire(enabled);
    if (!enabled) return;
    if (!selectedVisit?.id || !triage?.chief_complaint) return;
    await generateQuestionnaireFromAI({
      visitId: selectedVisit.id,
      chiefComplaint: triage.chief_complaint,
    });
  };

  const hasTriageForConsult = useMemo(() => {
    return !!(
      triage?.chief_complaint ||
      selectedVisit?.chief_complaint ||
      selectedVisit?.triage_chief_complaint ||
      selectedVisit?.triage?.chief_complaint
    );
  }, [triage, selectedVisit]);

  const canStart =
    !!selectedVisit?.id &&
    !startingConsultation &&
    selectedVisit?.status === "WAITING_DOCTOR";
  const canFinish = !!selectedVisit?.id && selectedVisit.status === "IN_CONSULTATION";
  const canDiagnose = canFinish;
  const finishMissingFields = useMemo(() => {
    if (!canFinish) return [];
    const missing = [];
    const answeredCount = complaintQuestions.filter((q) => String(questionnaireAnswers[q] || "").trim()).length;
    if (useAIQuestionnaire && answeredCount === 0 && !String(questionnaireExtraNote || "").trim()) {
      missing.push("questionário clínico");
    }
    if (!String(planDraft.likely_diagnosis || "").trim()) missing.push("diagnóstico provável");
    if (!String(planDraft.clinical_reasoning || "").trim()) missing.push("justificativa clínica");
    if (!String(planDraft.prescription_text || "").trim()) missing.push("prescrição");
    if (!String(planDraft.disposition_plan || "").trim()) missing.push("destino do paciente");
    if (!!planDraft.lab_requested && !String(planDraft.lab_exam_type || "").trim()) {
      missing.push("tipo de exame laboratorial");
    }
    return missing;
  }, [canFinish, complaintQuestions, questionnaireAnswers, questionnaireExtraNote, planDraft, useAIQuestionnaire]);
  const canFinishStrict = canFinish && finishMissingFields.length === 0;

  const updatePlanField = (field, value) => {
    setPlanDraft((prev) => ({ ...prev, [field]: value }));
    setPlanAccepted(false);
  };

  const updateQuestionAnswer = (question, value) => {
    setQuestionnaireAnswers((prev) => ({ ...prev, [question]: value }));
    setPlanAccepted(false);
  };

  const updateLabExamType = (examType) => {
    setPlanDraft((prev) => ({
      ...prev,
      lab_exam_type: examType,
    }));
    setPlanAccepted(false);
  };

  const saveMedicalPlan = async ({ accept = false } = {}) => {
    if (!selectedVisit?.id) return;
    setSavingPlan(true);
    setErr("");
    try {
      const questionnaireText = complaintQuestions
        .map((q) => {
          const a = (questionnaireAnswers[q] || "").trim();
          return a ? `- ${q}\n  Resposta: ${a}` : null;
        })
        .filter(Boolean)
        .join("\n");
      const baseReasoning = stripQuestionnaireBlock(planDraft.clinical_reasoning);
      const mergedReasoning = useAIQuestionnaire && questionnaireText
        ? [`Questionário clínico:\n${questionnaireText}`, baseReasoning].filter(Boolean).join("\n\n")
        : baseReasoning;

      const updated = await api.saveVisitMedicalPlan(selectedVisit.id, {
        ...planDraft,
        clinical_reasoning: mergedReasoning,
        doctor_questionnaire_json: {
          locale: "pt-MZ",
          source: "ai",
          chief_complaint: triage?.chief_complaint || "",
          questions: useAIQuestionnaire ? complaintQuestions : [],
          answers: useAIQuestionnaire ? questionnaireAnswers : {},
          extra_note: useAIQuestionnaire ? String(questionnaireExtraNote || "").trim() : "",
          generated_at: new Date().toISOString(),
        },
        accepted: !!accept,
      });
      setSelectedVisit(updated);
      setPlanDraft(planFromVisit(updated));
      setPlanAccepted(!!updated?.plan_accepted_at);
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const saveLabResultForVisit = async (visitId) => {
    const resultText = String(labResultDrafts[visitId] || "").trim();
    const readyChecked = !!labResultReadyDrafts[visitId];
    if (!visitId || !resultText || !readyChecked) return;
    setSavingLabResultId(Number(visitId));
    setErr("");
    try {
      const visit = await api.getVisitById(visitId);
      const base = planFromVisit(visit);
      const updated = await api.saveVisitMedicalPlan(visitId, {
        ...base,
        lab_requested: true,
        lab_result_text: resultText,
        lab_result_status: "READY",
        lab_result_ready_at: new Date().toISOString(),
        accepted: !!visit?.plan_accepted_at,
      });
      setLabResultDrafts((prev) => ({ ...prev, [visitId]: "" }));
      setLabResultReadyDrafts((prev) => ({ ...prev, [visitId]: false }));
      if (selectedVisit?.id === Number(visitId)) {
        setSelectedVisit(updated);
        setPlanDraft(planFromVisit(updated));
      }
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingLabResultId(null);
    }
  };

  const searchHistoryPatients = async () => {
    const q = String(historyQuery || "").trim();
    if (q.length < 1) {
      setErr("Escreva pelo menos 1 letra para pesquisar paciente.");
      return;
    }
    setHistorySearchLoading(true);
    setErr("");
    try {
      const rows = await api.searchPatients(q);
      setHistorySearchResults(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setErr(e.message);
      setHistorySearchResults([]);
    } finally {
      setHistorySearchLoading(false);
    }
  };

  useEffect(() => {
    if (activeView !== "history") return;
    const q = String(historyQuery || "").trim();
    if (!q) {
      setHistorySearchResults([]);
      setHistorySearchLoading(false);
      return;
    }
    const t = setTimeout(() => {
      searchHistoryPatients();
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyQuery, activeView]);

  const openHistoryPatient = async (patient) => {
    if (!patient?.id) return;
    setHistoryModal({ open: true, patient, visits: [], loading: true });
    setErr("");
    try {
      const visits = await api.getPatientHistory(patient.id);
      setHistoryModal({
        open: true,
        patient,
        visits: Array.isArray(visits) ? visits : [],
        loading: false,
      });
    } catch (e) {
      setErr(e.message);
      setHistoryModal({ open: true, patient, visits: [], loading: false });
    }
  };

  const closeHistoryModal = () => {
    setHistoryModal({ open: false, patient: null, visits: [], loading: false });
  };

  const loadAgenda = async () => {
    if (!mountedRef.current) return;
    safeSet(() => setLoadingAgenda(true));
    try {
      const data = await api.getMyAgenda();
      safeSet(() =>
        setAgenda({
          assigned_today: Array.isArray(data?.assigned_today) ? data.assigned_today : [],
          returns_today: Array.isArray(data?.returns_today) ? data.returns_today : [],
        })
      );
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setLoadingAgenda(false));
    }
  };

  const scheduleVisitReturn = async ({ visitId, return_visit_date, return_visit_reason }) => {
    if (!visitId || !return_visit_date) return;
    safeSet(() => setErr(""));
    try {
      const updated = await api.scheduleVisitReturn(visitId, {
        return_visit_date,
        return_visit_reason: return_visit_reason || null,
      });
      if (selectedVisit?.id === Number(visitId)) {
        safeSet(() => {
          setSelectedVisit(updated);
          setPlanDraft((prev) => ({
            ...prev,
            return_visit_date: updated?.return_visit_date || "",
            return_visit_reason: updated?.return_visit_reason || "",
          }));
        });
      }
      await loadAgenda();
      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
      throw e;
    }
  };

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      key: "agenda",
      label: "Minha agenda",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      badge: agendaAssignedTodayCount > 0 ? agendaAssignedTodayCount : null,
    },
    {
      key: "queue",
      label: "Fila de Pacientes",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: waitingCount > 0 ? waitingCount : null,
    },
    {
      key: "history",
      label: "Histórico Médico",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3 3v18h18" />
          <path d="M8 14l3-3 2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "lab",
      label: "Exames",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M10 2v7l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V2" />
          <line x1="8" y1="2" x2="16" y2="2" />
        </svg>
      ),
      badge: pendingLabVisits.length > 0 ? pendingLabVisits.length : null,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <style>{`
        input:focus, textarea:focus, select:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }

        .sidebar { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 68px; }

        .nav-label {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }

        .logo-text {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap; overflow: hidden;
        }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }

        .user-info { transition: opacity 0.2s ease, max-height 0.3s ease; overflow: hidden; }
        .sidebar-open .user-info { opacity: 1; max-height: 80px; }
        .sidebar-closed .user-info { opacity: 0; max-height: 0; }

        .sidebar-closed .nav-badge {
          position: absolute; top: 4px; right: 4px;
          width: 18px; height: 18px; font-size: 10px;
          border-radius: 9999px;
        }

        .nav-badge-open {
          width: 20px; height: 20px; border-radius: 9999px;
          display: inline-flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 600;
        }

        .nav-tooltip {
          position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%); background: #111827; color: #fff;
          font-size: 12px; font-weight: 500; padding: 4px 10px;
          border-radius: 6px; white-space: nowrap; pointer-events: none;
          opacity: 0; transition: opacity 0.15s ease; z-index: 50;
        }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }
        .nav-active { background: #22c55e !important; color: white !important; border-radius: 10px; }
        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .popup-card {
          width: min(460px, 100%);
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
          padding: 18px;
        }
        .popup-icon {
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .popup-icon-warning { background: #fef3c7; color: #b45309; }
        .popup-icon-success { background: #dcfce7; color: #166534; }
      `}</style>

      {/* Sidebar */}
      <aside className={`sidebar bg-white flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

        {/* Header */}
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
          >
            {sidebarOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <div className="logo-text min-w-0">
            <div className="text-sm font-semibold text-gray-900 leading-tight">Painel Médico</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.key} className="nav-item-wrap relative">
                <button
                  onClick={() => setActiveView(item.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 relative ${
                    activeView === item.key ? "nav-active" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && sidebarOpen && (
                    <span className="ml-auto nav-badge-open bg-green-500 text-white">{item.badge}</span>
                  )}
                  {item.badge && !sidebarOpen && (
                    <span className="nav-badge absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center">{item.badge}</span>
                  )}
                </button>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="user-info mb-2 px-1" />
          <div className="nav-item-wrap relative">
            <button
              onClick={logout}
              className="w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "white",
          borderBottom: "1px solid #f0f0f0",
          height: "60px",
          display: "flex",
          alignItems: "center",
          paddingLeft: "24px",
          paddingRight: "24px",
          gap: "16px",
        }}>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                width: "100%",
                maxWidth: "360px",
                background: "#f9fafb",
                border: `1.5px solid ${topSearchFocus ? "#86efac" : "#f0f0f0"}`,
                borderRadius: "10px",
                padding: "8px 14px",
                transition: "border-color 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                placeholder="Pesquisar paciente"
                value={topNavSearch}
                onChange={(e) => setTopNavSearch(e.target.value)}
                onFocus={() => setTopSearchFocus(true)}
                onBlur={() => setTopSearchFocus(false)}
                onKeyDown={(e) => e.key === "Enter" && searchFromTopNav()}
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "13px",
                  color: "#374151",
                  width: "100%",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setErr("Chat interno disponível em breve.")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setErr("Sem novas notificações no momento.")}
              style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", position: "relative", transition: "background 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f3f4f6"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span style={{ position: "absolute", top: "5px", right: "5px", width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", border: "1.5px solid white" }} />
            </button>

            <div style={{ marginLeft: "6px", fontSize: "13px", fontWeight: 600, color: "#374151", maxWidth: "220px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {me?.full_name || "Médico(a)"}
              {!!me?.specialization && ` · ${me.specialization}`}
            </div>
            <button style={{ width: "34px", height: "34px", borderRadius: "50%", border: "2px solid #e5e7eb", overflow: "hidden", cursor: "pointer", marginLeft: "4px", padding: 0, background: "linear-gradient(135deg, #16a34a, #22c55e)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>
                {me?.full_name?.trim()?.[0]?.toUpperCase() || "D"}
              </span>
            </button>
          </div>
        </div>
        <div className="p-8 max-w-6xl mx-auto">

          {activeView === "dashboard" && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Médico</h1>
              <p className="text-gray-600 mb-6">Visao geral da fila e da agenda do dia.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs text-gray-500">Fila total</div>
                  <div className="text-3xl font-semibold text-gray-900 mt-1">{filteredQueue.length}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs text-gray-500">Aguardando Médico</div>
                  <div className="text-3xl font-semibold text-gray-900 mt-1">{waitingCount}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs text-gray-500">Em consulta</div>
                  <div className="text-3xl font-semibold text-gray-900 mt-1">{inConsultCount}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <div className="text-xs text-gray-500">Agenda hoje</div>
                  <div className="text-3xl font-semibold text-gray-900 mt-1">{agendaTodayCount}</div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="text-sm font-semibold text-gray-900 mb-3">Ações rápidas</div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setActiveView("queue")} className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors rounded-md">
                    Ir para Fila de Pacientes
                  </button>
                  <button type="button" onClick={() => setActiveView("agenda")} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
                    Abrir Minha Agenda
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeView === "agenda" && (
            <AgendaView
              assignedToday={agenda.assigned_today}
              returnsToday={agenda.returns_today}
              loading={loadingAgenda}
              onRefresh={() => {
                loadAgenda();
                loadQueue();
              }}
              onOpenVisit={(visitId) => {
                setActiveView("queue");
                const preview = filteredQueue.find((v) => Number(v.id) === Number(visitId)) || null;
                openVisit(visitId, preview);
                setTimeout(() => {
                  detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                }, 0);
              }}
              onScheduleReturn={scheduleVisitReturn}
            />
          )}
          {activeView === "history" && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Histórico Médico por Paciente</h3>
                <div className="text-xs text-gray-500">Sugestões automáticas ao digitar</div>
              </div>
              <div className="mb-3">
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Digite nome do paciente..."
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchHistoryPatients()}
                />
              </div>
              {historySearchLoading ? (
                <p className="text-sm text-gray-500">Buscando pacientes...</p>
              ) : historyQuery.trim() && historySearchResults.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum paciente encontrado para esse nome.</p>
              ) : historySearchResults.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum paciente encontrado ainda. Faça uma pesquisa acima.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {historySearchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => openHistoryPatient(p)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-green-50 hover:border-green-200 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{p.full_name || "-"}</div>
                      <div className="text-xs text-gray-600">{p.clinical_code || "-"}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {activeView === "lab" && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Exames pendentes de resultado</h3>
              {hasUnsavedLabRequest && (
                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  Marcou "Exame laboratorial solicitado" na consulta atual, mas ainda não salvou o plano.
                  Clique em "Salvar rascunho" na consulta para o paciente aparecer nesta lista.
                </div>
              )}
              {labPendingDisplayRows.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum exame pendente no momento.</p>
              ) : (
                <div className="space-y-3">
                  {labPendingDisplayRows.map((v) => (
                    <div key={v.id} className="border border-gray-200 rounded p-3 bg-gray-50">
                      <div className="text-sm font-medium text-gray-900">
                        {v.full_name} <span className="text-xs text-gray-500">#{v.id}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {v.lab_exam_type || v.lab_tests || "Exame solicitado"}
                      </div>
                      {!!v.__unsaved_lab_request && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                          Pedido de exame ainda não salvo no plano desta consulta.
                          <button
                            type="button"
                            onClick={() => saveMedicalPlan({ accept: false })}
                            disabled={savingPlan || Number(selectedVisit?.id) !== Number(v.id)}
                            className="ml-2 px-2 py-1 rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                          >
                            {savingPlan ? "Salvando..." : "Salvar pedido"}
                          </button>
                        </div>
                      )}
                      <label className="flex items-center gap-2 text-xs text-gray-700 mt-2">
                        <input
                          type="checkbox"
                          checked={!!labResultReadyDrafts[v.id]}
                          onChange={(e) =>
                            setLabResultReadyDrafts((prev) => ({ ...prev, [v.id]: e.target.checked }))
                          }
                          disabled={!!v.__unsaved_lab_request}
                        />
                        Já recebi o resultado do laboratório
                      </label>
                      <textarea
                        className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm min-h-[90px]"
                        placeholder="Preencha o resultado do laboratório..."
                        value={labResultDrafts[v.id] || ""}
                        onChange={(e) =>
                          setLabResultDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        disabled={!!v.__unsaved_lab_request}
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => saveLabResultForVisit(v.id)}
                          disabled={
                            !!v.__unsaved_lab_request ||
                            savingLabResultId === v.id ||
                            !(labResultDrafts[v.id] || "").trim() ||
                            !labResultReadyDrafts[v.id]
                          }
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 rounded-md"
                        >
                          {savingLabResultId === v.id ? "Salvando..." : "Salvar resultado"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* QUEUE VIEW */}
          {activeView === "queue" && (
            <div>
              {/* Two-column layout: queue list + details panel */}
              <div className="grid grid-cols-1 gap-6">
                <DoctorQueuePanel
                  queue={filteredQueue}
                  loading={loadingQueue}
                  onRefresh={loadQueue}
                  onOpenVisit={(visitId, previewVisit) => {
                    setActiveView("queue");
                    const preview =
                      previewVisit && Number(previewVisit.id) === Number(visitId)
                        ? previewVisit
                        : filteredQueue.find((v) => Number(v.id) === Number(visitId)) || null;
                    openVisit(visitId, preview);
                    setTimeout(() => {
                      detailsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 0);
                  }}
                  me={me}
                  selectedVisitId={selectedVisit?.id}
                />

                {/* Details panel */}
                {(loadingDetails || selectedVisit) && (
                  <div ref={detailsPanelRef} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <h2 className="text-base font-semibold text-gray-900">Detalhes da Consulta</h2>
                      {selectedVisit && (
                        <span className="text-xs text-gray-500">Visita #{selectedVisit.id}</span>
                      )}
                    </div>

                    <div className="p-6">
                      {loadingDetails && !selectedVisit ? (
                        <div className="text-sm text-gray-500">Carregando detalhes...</div>
                      ) : (
                      <div className="space-y-4">

                        <div className="text-sm text-gray-600">
                          Status atual: <span className="font-medium text-gray-900">{formatStatus(selectedVisit.status)}</span>
                        </div>

                        {patientDetails && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Dados do Paciente</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                              <div>Nome: {patientDetails.full_name || "-"}</div>
                              <div>Código: {patientDetails.clinical_code || "-"}</div>
                              <div>Nascimento: {patientDetails.birth_date || "-"}</div>
                              <div>Idade: {calculateAgeYears(patientDetails.birth_date) ?? "-"} anos</div>
                            </div>
                          </div>
                        )}

                        {/* Triage data */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <h3 className="text-sm font-semibold text-gray-900 mb-3">Dados de Triagem</h3>
                          {!triage ? (
                            <p className="text-sm text-gray-500">Triagem ainda não registrada.</p>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                {[
                                  { label: "Temperatura", value: triage.temperature != null ? `${triage.temperature} °C` : "-" },
                                  { label: "SpO2", value: triage.oxygen_saturation != null ? `${triage.oxygen_saturation} %` : "-" },
                                  { label: "Freq. Cardíaca", value: triage.heart_rate != null ? `${triage.heart_rate} bpm` : "-" },
                                  { label: "Freq. Resp.", value: triage.respiratory_rate != null ? `${triage.respiratory_rate} rpm` : "-" },
                                  { label: "Peso", value: triage.weight != null ? `${triage.weight} kg` : "-" },
                                ].map(({ label, value }) => (
                                  <div key={label}>
                                    <div className="text-xs text-gray-500">{label}</div>
                                    <div className="text-sm font-medium text-gray-900">{value}</div>
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-500 mb-1">Queixa Principal</div>
                                <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words pr-2">
                                  {triage.chief_complaint}
                                </div>
                              </div>
                              {triage.clinical_notes && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Notas Clínicas</div>
                                  <div className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-words pr-2">
                                    {triage.clinical_notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {!!selectedVisit?.id && !!triage && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div>
                                <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Questionário clínico por IA</div>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  Opcional. Ative para a IA gerar perguntas conforme a queixa principal.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleAIQuestionnaire(!useAIQuestionnaire)}
                                disabled={questionnaireLoading || selectedVisit?.status !== "IN_CONSULTATION"}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                                  useAIQuestionnaire
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                } disabled:opacity-50`}
                              >
                                {useAIQuestionnaire ? "Ligado" : "Desligado"}
                              </button>
                            </div>
                            {useAIQuestionnaire && questionnaireLoading ? (
                              <div className="space-y-2 animate-pulse">
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                                <div className="h-9 bg-gray-100 rounded" />
                                <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                                <div className="h-9 bg-gray-100 rounded" />
                                <div className="h-3 bg-gray-200 rounded w-3/4 mt-2" />
                                <div className="h-9 bg-gray-100 rounded" />
                              </div>
                            ) : useAIQuestionnaire ? (
                              <div className="space-y-2">
                                {complaintQuestions.length === 0 ? (
                                  <div className="space-y-2 animate-pulse">
                                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                                    <div className="h-9 bg-gray-100 rounded" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
                                    <div className="h-9 bg-gray-100 rounded" />
                                    <div className="h-3 bg-gray-200 rounded w-3/4 mt-2" />
                                    <div className="h-9 bg-gray-100 rounded" />
                                  </div>
                                ) : (
                                  <>
                                    {complaintQuestions.map((q) => (
                                      <div key={q}>
                                        <label className="text-xs text-gray-600 mb-1 block">{q}</label>
                                        <input
                                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                          value={questionnaireAnswers[q] || ""}
                                          onChange={(e) => updateQuestionAnswer(q, e.target.value)}
                                          placeholder="Resposta do paciente"
                                        />
                                      </div>
                                    ))}
                                    <div className="pt-1">
                                      <label className="text-xs text-gray-600 mb-1 block">
                                        Informação extra (caso não caiba nas perguntas)
                                      </label>
                                      <textarea
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white min-h-[80px]"
                                        value={questionnaireExtraNote}
                                        onChange={(e) => setQuestionnaireExtraNote(e.target.value)}
                                        placeholder="Ex.: detalhe adicional relatado pelo paciente/acompanhante"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500 bg-white border border-gray-200 rounded-md px-3 py-2">
                                Questionário desativado. O médico pode seguir diretamente com avaliação e plano clínico.
                              </div>
                            )}
                          </div>
                        )}

                        {/* AI suggestion */}
                        <button
                          type="button"
                          onClick={askDoctorAI}
                          disabled={aiLoading || !aiEnabled}
                          className="w-full py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40"
                          title={
                            !aiEnabled
                              ? selectedVisit.status !== "IN_CONSULTATION"
                                ? "Inicie a consulta para usar a IA"
                                : !triage?.chief_complaint
                                ? "Precisa de triagem antes"
                                : ""
                              : ""
                          }
                        >
                          {aiLoading ? "IA Analisando..." : "Sugestão por IA - Diagnóstico e Prescrição"}
                        </button>

                        {!!selectedVisit?.id && !canDiagnose && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                            Inicie a consulta para liberar o diagnóstico e o preenchimento do plano médico.
                          </div>
                        )}

                        {!!selectedVisit?.id && canDiagnose && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">Plano Médico (Editavel)</h3>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => saveMedicalPlan({ accept: false })}
                                  disabled={savingPlan}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 disabled:opacity-50"
                                >
                                  {savingPlan ? "Salvando..." : "Salvar rascunho"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveMedicalPlan({ accept: true })}
                                  disabled={savingPlan}
                                  className="px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 rounded-md"
                                >
                                  {savingPlan ? "Salvando..." : "Aceitar plano"}
                                </button>
                              </div>
                            </div>

                            {planAccepted && (
                              <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded">
                                Plano aceito pelo médico (ainda pode editar).
                              </div>
                            )}

                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Diagnóstico provável</label>
                                <p className="text-[11px] text-gray-500 mb-1">Hipótese principal em linguagem clínica objetiva.</p>
                                <input
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.likely_diagnosis}
                                  onChange={(e) => updatePlanField("likely_diagnosis", e.target.value)}
                                  placeholder="Ex.: Bronquiolite aguda"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Justificativa clínica</label>
                                <p className="text-[11px] text-gray-500 mb-1">Explique brevemente os achados que sustentam o diagnóstico.</p>
                                <textarea
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[120px]"
                                  value={planDraft.clinical_reasoning}
                                  onChange={(e) => updatePlanField("clinical_reasoning", e.target.value)}
                                  placeholder="Este paciente tem X, Y, Z; portanto pode ter..."
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Prescrição (dose, via, frequência, duração)</label>
                                <p className="text-[11px] text-gray-500 mb-1">Informe medicamento, dose, via, frequência e duração.</p>
                                <textarea
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[140px] font-mono"
                                  value={planDraft.prescription_text}
                                  onChange={(e) => updatePlanField("prescription_text", e.target.value)}
                                  placeholder={"Paracetamol | 10-15 mg/kg | VO | 6/6h | 3 dias | se febre"}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">Destino do paciente</label>
                                  <select
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                    value={planDraft.disposition_plan}
                                    onChange={(e) => updatePlanField("disposition_plan", e.target.value)}
                                  >
                                    {DISPOSITION_OPTIONS.map((o) => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">Motivo do destino</label>
                                  <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                    value={planDraft.disposition_reason}
                                    onChange={(e) => updatePlanField("disposition_reason", e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="p-3 border border-gray-200 rounded">
                                <div className="text-xs font-semibold text-gray-700 mb-2">Estado Clínico e Hospitalar</div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Estado hospitalar</label>
                                    <select
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={planDraft.hospital_status || ""}
                                      onChange={(e) => updatePlanField("hospital_status", e.target.value)}
                                    >
                                      {HOSPITAL_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Estado vital</label>
                                    <select
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={planDraft.vital_status || ""}
                                      onChange={(e) => updatePlanField("vital_status", e.target.value)}
                                    >
                                      {VITAL_STATUS_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex items-center">
                                    <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                                      <input
                                        type="checkbox"
                                        checked={!!planDraft.is_bedridden}
                                        onChange={(e) => updatePlanField("is_bedridden", e.target.checked)}
                                      />
                                      Paciente acamado
                                    </label>
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Data/Hora de alta</label>
                                    <input
                                      type="datetime-local"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={planDraft.discharged_at || ""}
                                      onChange={(e) => updatePlanField("discharged_at", e.target.value)}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Unidade de internamento</label>
                                    <input
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={planDraft.inpatient_unit || ""}
                                      onChange={(e) => updatePlanField("inpatient_unit", e.target.value)}
                                      placeholder="Ex.: Pediatria A"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Leito</label>
                                    <input
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                      value={planDraft.inpatient_bed || ""}
                                      onChange={(e) => updatePlanField("inpatient_bed", e.target.value)}
                                      placeholder="Ex.: Leito 12"
                                    />
                                  </div>
                                </div>
                                {String(planDraft.vital_status || "").toUpperCase() === "DECEASED" && (
                                  <div className="mt-3">
                                    <label className="text-xs font-medium text-red-700 mb-1 block">Nota de óbito</label>
                                    <textarea
                                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm min-h-[80px]"
                                      value={planDraft.death_note || ""}
                                      onChange={(e) => updatePlanField("death_note", e.target.value)}
                                      placeholder="Detalhes clínicos relevantes sobre o óbito"
                                    />
                                  </div>
                                )}
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Orientações</label>
                                <input
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.follow_up_instructions}
                                  onChange={(e) => updatePlanField("follow_up_instructions", e.target.value)}
                                />
                              </div>

                              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={planDraft.no_charge_chronic}
                                    onChange={(e) => updatePlanField("no_charge_chronic", e.target.checked)}
                                  />
                                  Doença crônica (não cobrar atendimento)
                                </label>
                                <input
                                  className="w-full mt-2 px-4 py-3 border border-amber-300 bg-white rounded-lg text-base"
                                  value={planDraft.no_charge_reason}
                                  onChange={(e) => updatePlanField("no_charge_reason", e.target.value)}
                                  placeholder="Ex.: asma persistente, diabetes tipo 1"
                                />
                              </div>

                              <div className="p-3 border border-gray-200 rounded">
                                <label className="flex items-center gap-2 text-sm text-gray-800 font-medium mb-3">
                                  <input
                                    type="checkbox"
                                    checked={!!planDraft.lab_requested}
                                    onChange={(e) => updatePlanField("lab_requested", e.target.checked)}
                                  />
                                  Foi necessário pedir exame laboratorial
                                </label>
                                {!!planDraft.lab_requested && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-xs font-medium text-gray-700 mb-1 block">Tipo de exame</label>
                                      <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        value={planDraft.lab_exam_type || ""}
                                        onChange={(e) => updateLabExamType(e.target.value)}
                                      >
                                        {LAB_EXAM_OPTIONS.map((o) => (
                                          <option key={o.value} value={o.value}>{o.label}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-xs font-medium text-gray-700 mb-1 block">Coleta da amostra</label>
                                      <input
                                        type="datetime-local"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                        value={planDraft.lab_sample_collected_at || ""}
                                        onChange={(e) => updatePlanField("lab_sample_collected_at", e.target.value)}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={startConsultation}
                            disabled={!canStart}
                            className="py-2.5 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-40 rounded-md"
                            title={
                              !selectedVisit?.id
                                ? "Selecione um paciente"
                                : startingConsultation
                                ? "Iniciando consulta..."
                                : selectedVisit?.status !== "WAITING_DOCTOR"
                                ? "A visita precisa estar em 'Aguardando Médico'"
                                : !hasTriageForConsult
                                ? "Precisa de triagem antes de iniciar consulta"
                                : ""
                            }
                          >
                            {startingConsultation ? "Iniciando..." : "Iniciar Consulta"}
                          </button>
                          <button
                            onClick={finishConsultation}
                            disabled={!canFinishStrict}
                            className="py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
                            style={{ background: canFinishStrict ? "#16a34a" : "#d1fae5", color: canFinishStrict ? "#fff" : "#6b7280" }}
                            title={
                              !canFinish
                                ? "A consulta precisa estar iniciada"
                                : finishMissingFields.length > 0
                                ? `Falta preencher: ${finishMissingFields.join(", ")}`
                                : ""
                            }
                          >
                            Finalizar Consulta
                          </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center pt-1">
                          A IA apenas sugere. O médico valida ou ignora. A triagem é feita pelo enfermeiro.
                        </p>
                      </div>
                    )}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </main>

      {popup.open && (
        <div className="popup-overlay">
          <div className="popup-card">
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
              <div className={`popup-icon ${popup.type === "success" ? "popup-icon-success" : "popup-icon-warning"}`}>
                {popup.type === "success" ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#111827" }}>{popup.title}</h3>
                <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#4b5563", lineHeight: 1.45 }}>{popup.message}</p>
              </div>
            </div>
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closePopup}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 rounded-md"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {historyModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 200 }}>
          <div className="w-full max-w-3xl bg-white rounded-lg border border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Histórico do Paciente</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {historyModal.patient?.full_name || "-"} {historyModal.patient?.clinical_code ? `· ${historyModal.patient.clinical_code}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={closeHistoryModal}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Fechar
              </button>
            </div>
            <div className="p-5">
              {historyModal.loading ? (
                <p className="text-sm text-gray-500">Carregando histórico...</p>
              ) : historyModal.visits.length === 0 ? (
                <p className="text-sm text-gray-500">Sem histórico para este paciente.</p>
              ) : (
                <div className="space-y-3">
                  {historyModal.visits.map((v) => (
                    <div key={v.visit_id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="text-xs text-gray-500">
                        Visita #{v.visit_id} · {v.arrival_time ? new Date(v.arrival_time).toLocaleString() : "-"}
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        {v.chief_complaint || "Sem queixa principal"}
                      </div>
                      <div className="text-sm text-gray-800 mt-1">
                        Diagnóstico: {v.likely_diagnosis || "Não registrado"}
                      </div>
                      {v.prescription_text && (
                        <div className="text-xs text-gray-700 mt-1 whitespace-pre-wrap">{v.prescription_text}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {aiSuggestionOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" style={{ zIndex: 200 }}>
          <div className="w-full max-w-2xl bg-white rounded-lg border border-gray-200 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Sugestão da IA</h3>
              <button
                type="button"
                onClick={() => setAiSuggestionOpen(false)}
                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
              >
                Fechar
              </button>
            </div>
            <div className="p-5">
              {aiLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-full" />
                  <div className="h-3 bg-gray-200 rounded w-11/12" />
                  <div className="h-20 bg-gray-100 rounded" />
                  <div className="h-20 bg-gray-100 rounded" />
                </div>
              ) : aiResult ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500">
                    {aiResult.disclaimer || "Sugestão gerada por IA. Validar por protocolo local."}
                  </p>
                  {aiResult.red_flag && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm font-semibold text-red-700">Alerta: possível risco elevado - seguir protocolo do serviço.</p>
                    </div>
                  )}
                  {aiResult.likely_diagnosis && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Diagnóstico provável</div>
                      <p className="text-sm text-gray-900">{aiResult.likely_diagnosis}</p>
                    </div>
                  )}
                  {aiResult.summary && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Resumo</div>
                      <p className="text-sm text-gray-800">{aiResult.summary}</p>
                    </div>
                  )}
                  {Array.isArray(aiResult.differential_diagnoses) && aiResult.differential_diagnoses.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Diferenciais</div>
                      <div className="space-y-1">
                        {aiResult.differential_diagnoses.slice(0, 3).map((d, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">{d.name}:</span> {d.why}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="pt-2 border-t border-gray-100 text-xs text-gray-600">
                    Revise esta sugestão e preencha o formulário manualmente de acordo com a sua avaliação clínica.
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nenhuma sugestão disponível.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
