import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";

const formatWait = (m) => {
  if (m == null) return "-";
  if (m === 0) return "<1 min";
  if (m === 1) return "1 min";
  return `${m} min`;
};

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

const roleLabel = (role) => {
  if (role === "DOCTOR") return "Medico";
  if (role === "NURSE") return "Enfermeiro";
  if (role === "ADMIN") return "Administrador";
  return role || "-";
};
const DISPOSITION_OPTIONS = [
  { value: "", label: "Selecionar destino" },
  { value: "BED_REST", label: "Repouso (bed rest)" },
  { value: "HOME", label: "Alta para casa" },
  { value: "RETURN_VISIT", label: "Retorno agendado" },
  { value: "ADMIT_URGENT", label: "Internar / urgencia" },
];

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
  lab_tests: "",
  lab_sample_collected_at: "",
});

const planFromAI = (ai) => {
  const prescriptionLines = Array.isArray(ai?.prescription_plan)
    ? ai.prescription_plan.map((p) =>
        [
          p?.medication || "",
          p?.dosage || "",
          p?.route || "",
          p?.frequency || "",
          p?.duration || "",
          p?.instructions || "",
        ]
          .filter(Boolean)
          .join(" | ")
      )
    : [];

  const legacyPrescriptionLines = Array.isArray(ai?.prescription_suggestions)
    ? ai.prescription_suggestions.map((p) => `${p?.item || ""} | ${p?.note || ""}`)
    : [];

  return {
    likely_diagnosis: ai?.likely_diagnosis || ai?.summary || "",
    clinical_reasoning:
      ai?.clinical_reasoning ||
      (Array.isArray(ai?.differential_diagnoses)
        ? ai.differential_diagnoses
            .slice(0, 3)
            .map((d) => `${d?.name || ""}: ${d?.why || ""}`.trim())
            .filter(Boolean)
            .join("\n")
        : ""),
    prescription_text: [...prescriptionLines, ...legacyPrescriptionLines]
      .filter(Boolean)
      .join("\n"),
    disposition_plan: ai?.disposition?.plan || "",
    disposition_reason: ai?.disposition?.reason || "",
    follow_up_when: ai?.follow_up?.when || "",
    follow_up_instructions: ai?.follow_up?.instructions || "",
    follow_up_return_if: ai?.follow_up?.return_if || "",
    no_charge_chronic: !!ai?.chronic_no_charge?.suggested,
    no_charge_reason: ai?.chronic_no_charge?.reason || "",
  };
};

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
  lab_tests: visit?.lab_tests || "",
  lab_sample_collected_at: visit?.lab_sample_collected_at || "",
});

export default function Doctor() {
  const me = getUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("queue");

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [err, setErr] = useState("");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [triage, setTriage] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [planDraft, setPlanDraft] = useState(makeEmptyPlanDraft());
  const [planAccepted, setPlanAccepted] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);

  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(true);

  const stopIntervals = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
  };

  const safeSet = (fn) => { if (mountedRef.current) fn(); };

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

  const openVisit = async (visitId) => {
    if (!mountedRef.current) return;
    safeSet(() => {
      setErr("");
      setLoadingDetails(true);
      setSelectedVisit(null);
      setTriage(null);
      setPatientDetails(null);
      setPatientHistory([]);
      setAiResult(null);
      setPlanDraft(makeEmptyPlanDraft());
      setPlanAccepted(false);
    });
    try {
      const v = await api.getVisitById(visitId);
      safeSet(() => {
        setSelectedVisit(v);
        setPlanDraft(planFromVisit(v));
        setPlanAccepted(!!v?.plan_accepted_at);
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
        safeSet(() => setTriage(t));
      } catch {
        safeSet(() => setTriage(null));
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
      intervalRef.current = setInterval(() => { loadQueue(); }, 30 * 60 * 1000);
      heartbeatRef.current = setInterval(async () => {
        try { await api.doctorHeartbeat?.(); } catch { /* ignore */ }
      }, 30000);
    };
    boot();
    return () => { mountedRef.current = false; stopIntervals(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    stopIntervals();
    try { await api.doctorCheckout?.(); } catch { /* ignore */ }
    clearAuth();
    window.location.replace("/login");
  };

  const startConsultation = async () => {
    if (!selectedVisit?.id) return;
    if (selectedVisit.status !== "WAITING_DOCTOR") {
      safeSet(() => setErr("O paciente precisa estar em 'Aguardando Médico'."));
      return;
    }
    if (!triage) {
      safeSet(() => setErr("Não pode iniciar consulta sem triagem registrada."));
      return;
    }
    safeSet(() => setErr(""));
    try {
      await api.startConsultation(selectedVisit.id);
      await openVisit(selectedVisit.id);
      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
    }
  };

  const finishConsultation = async () => {
    if (!selectedVisit?.id) return;
    safeSet(() => setErr(""));
    try {
      await api.finishVisit(selectedVisit.id);
      safeSet(() => {
        setSelectedVisit(null);
        setTriage(null);
        setPatientDetails(null);
        setPatientHistory([]);
        setAiResult(null);
        setPlanDraft(makeEmptyPlanDraft());
        setPlanAccepted(false);
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
    safeSet(() => { setErr(""); setAiLoading(true); setAiResult(null); });
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
      });
      safeSet(() => {
        setAiResult(res);
        setPlanDraft(planFromAI(res));
        setPlanAccepted(false);
      });
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setAiLoading(false));
    }
  };

  const canStart = !!selectedVisit?.id && selectedVisit.status === "WAITING_DOCTOR" && !!triage;
  const canFinish = !!selectedVisit?.id && selectedVisit.status === "IN_CONSULTATION";

  const updatePlanField = (field, value) => {
    setPlanDraft((prev) => ({ ...prev, [field]: value }));
    setPlanAccepted(false);
  };

  const applyAIToDraft = () => {
    if (!aiResult) return;
    setPlanDraft(planFromAI(aiResult));
    setPlanAccepted(false);
  };

  const saveMedicalPlan = async ({ accept = false } = {}) => {
    if (!selectedVisit?.id) return;
    setSavingPlan(true);
    setErr("");
    try {
      const updated = await api.saveVisitMedicalPlan(selectedVisit.id, {
        ...planDraft,
        accepted: !!accept,
      });
      setSelectedVisit(updated);
      setPlanDraft(planFromVisit(updated));
      setPlanAccepted(!!updated?.plan_accepted_at);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const navItems = [
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
      label: "Historico Medico",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M3 3v18h18" />
          <path d="M8 14l3-3 2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "return",
      label: "Agendar Retorno",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    {
      key: "lab",
      label: "Exames/Lab",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M10 2v7l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V2" />
          <line x1="8" y1="2" x2="16" y2="2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: #6b7280; }

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
          min-width: 16px; height: 16px; font-size: 10px;
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
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`sidebar bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
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
            <div className="text-sm font-semibold text-gray-900 leading-tight">Triagem</div>
            <div className="text-xs text-gray-500">Painel Médico</div>
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
                    activeView === item.key ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && sidebarOpen && (
                    <span className="ml-auto bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full">{item.badge}</span>
                  )}
                  {item.badge && !sidebarOpen && (
                    <span className="nav-badge absolute top-1 right-1 bg-gray-900 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center">{item.badge}</span>
                  )}
                </button>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="user-info mb-2 px-1">
            <div className="text-xs font-medium text-gray-500 mb-0.5">Conectado como</div>
            <div className="text-sm font-semibold text-gray-900 truncate">{me?.full_name || "Médico(a)"}</div>
            <div className="text-xs text-gray-500">{roleLabel(me?.role)}</div>
            {!!me?.specialization && (
              <div className="text-xs text-gray-500 truncate">Esp.: {me.specialization}</div>
            )}
          </div>
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

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">

          {/* Error */}
          {err && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800">{err}</p>
              </div>
            </div>
          )}

          {/* QUEUE VIEW */}
          {["queue", "history", "return", "lab"].includes(activeView) && (
            <div>
              {/* Page title */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {activeView === "history"
                      ? "Historico do Paciente"
                      : activeView === "return"
                      ? "Agendamento de Retorno"
                      : activeView === "lab"
                      ? "Exames e Laboratorio"
                      : "Fila de Pacientes"}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedVisit?.id
                      ? `Visita #${selectedVisit.id}${patientDetails?.full_name ? ` - ${patientDetails.full_name}` : ""}`
                      : `Bem-vindo(a), ${me?.full_name?.split(" ")[0] || "Medico(a)"}`}
                  </p>
                </div>
                <button
                  onClick={loadQueue}
                  disabled={loadingQueue}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loadingQueue ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Total na Fila</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{filteredQueue.length}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Aguardando Médico</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{waitingCount}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Em Consulta</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{inConsultCount}</div>
                </div>
              </div>

              {/* Two-column layout: queue list + details panel */}
              <div className="grid grid-cols-2 gap-6">

                {/* Queue list */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Pacientes</h2>
                    <div className="text-right">
                      <span className="text-xs text-gray-500 block">{filteredQueue.length} paciente(s)</span>
                      <span className="text-xs text-gray-500">
                        Especializacao: {me?.specialization || "-"}
                      </span>
                    </div>
                  </div>

                  {loadingQueue && filteredQueue.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">Carregando...</div>
                  ) : filteredQueue.length === 0 ? (
                    <div className="p-12 text-center">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <p className="text-sm text-gray-500 font-medium">Nenhum paciente aguardando</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Espera</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ação</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQueue.map((v, idx) => (
                          <tr
                            key={v.id}
                            className={`border-b border-gray-100 ${selectedVisit?.id === v.id ? "bg-gray-50" : idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                          >
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{v.full_name}</div>
                              <div className="text-xs text-gray-500">{v.clinical_code}</div>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700 font-mono">{formatWait(v.wait_minutes)}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                v.status === "IN_CONSULTATION" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                              }`}>
                                {v.status === "IN_CONSULTATION" ? "Em Consulta" : "Aguardando"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => { openVisit(v.id); }}
                                className={`px-3 py-1 text-xs font-medium transition-colors ${
                                  selectedVisit?.id === v.id
                                    ? "bg-gray-900 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {selectedVisit?.id === v.id ? "Aberto" : "Abrir"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Details panel */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-base font-semibold text-gray-900">Detalhes da Consulta</h2>
                    {selectedVisit && (
                      <span className="text-xs text-gray-500">Visita #{selectedVisit.id}</span>
                    )}
                  </div>

                  <div className="p-6">
                    {loadingDetails ? (
                      <div className="text-sm text-gray-500">Carregando detalhes...</div>
                    ) : !selectedVisit ? (
                      <div className="py-12 text-center">
                        <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">Selecione um paciente para ver detalhes</p>
                      </div>
                    ) : (
                      <div className="space-y-4">

                        {/* Status badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Status atual</span>
                          <span className={`inline-block px-3 py-1 text-xs font-semibold rounded ${
                            selectedVisit.status === "IN_CONSULTATION"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-orange-100 text-orange-700"
                          }`}>
                            {formatStatus(selectedVisit.status)}
                          </span>
                        </div>

                        {patientDetails && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-2">Dados do Paciente</h3>
                            <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                              <div>Nome: {patientDetails.full_name || "-"}</div>
                              <div>Codigo: {patientDetails.clinical_code || "-"}</div>
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
                                <div className="text-sm text-gray-900">{triage.chief_complaint}</div>
                              </div>
                              {triage.clinical_notes && (
                                <div>
                                  <div className="text-xs text-gray-500 mb-1">Notas Clínicas</div>
                                  <div className="text-sm text-gray-900">{triage.clinical_notes}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

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
                          {aiLoading ? "IA Analisando..." : "Sugestão por IA — Diagnóstico e Prescrição"}
                        </button>

                        {aiResult && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <p className="text-xs text-gray-500 mb-3">
                              {aiResult.disclaimer || "Sugestão gerada por IA. Validar por protocolo local."}
                            </p>

                            {aiResult.red_flag && (
                              <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
                                <p className="text-sm font-semibold text-red-700">⚠️ Alerta: possível risco elevado — seguir protocolo do serviço.</p>
                              </div>
                            )}

                            {aiResult.likely_diagnosis && (
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Diagnóstico Provável</div>
                                <p className="text-sm text-gray-900 font-semibold">{aiResult.likely_diagnosis}</p>
                              </div>
                            )}

                            {aiResult.summary && (
                              <div className="mb-3">
                                <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">Resumo</div>
                                <p className="text-sm text-gray-800">{aiResult.summary}</p>
                              </div>
                            )}

                            {Array.isArray(aiResult.differential_diagnoses) && aiResult.differential_diagnoses.length > 0 && (
                              <div>
                                <div className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Diagnósticos Diferenciais</div>
                                <div className="space-y-2">
                                  {aiResult.differential_diagnoses.slice(0, 3).map((d, idx) => (
                                    <div key={idx} className="text-sm text-gray-700">
                                      <span className="font-medium text-gray-900">{d.name}:</span> {d.why}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {!!selectedVisit?.id && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-900">Plano Medico (Editavel)</h3>
                              <div className="flex items-center gap-2">
                                {aiResult && (
                                  <button
                                    type="button"
                                    onClick={applyAIToDraft}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200"
                                  >
                                    Aplicar IA no plano
                                  </button>
                                )}
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
                                  className="px-3 py-1 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                                >
                                  {savingPlan ? "Salvando..." : "Aceitar plano"}
                                </button>
                              </div>
                            </div>

                            {planAccepted && (
                              <div className="mb-3 p-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium rounded">
                                Plano aceito pelo medico (ainda pode editar).
                              </div>
                            )}

                            <div className="space-y-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Diagnostico provavel</label>
                                <input
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.likely_diagnosis}
                                  onChange={(e) => updatePlanField("likely_diagnosis", e.target.value)}
                                  placeholder="Ex.: Bronquiolite aguda"
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Justificativa clinica</label>
                                <textarea
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[120px]"
                                  value={planDraft.clinical_reasoning}
                                  onChange={(e) => updatePlanField("clinical_reasoning", e.target.value)}
                                  placeholder="Este paciente tem X, Y, Z; portanto pode ter..."
                                />
                              </div>

                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Prescricao (dose, via, frequencia, duracao)</label>
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

                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">Retorno em</label>
                                  <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                    value={planDraft.follow_up_when}
                                    onChange={(e) => updatePlanField("follow_up_when", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">Orientacoes</label>
                                  <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                    value={planDraft.follow_up_instructions}
                                    onChange={(e) => updatePlanField("follow_up_instructions", e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-700 mb-1 block">Retornar se</label>
                                  <input
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                    value={planDraft.follow_up_return_if}
                                    onChange={(e) => updatePlanField("follow_up_return_if", e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="p-3 bg-amber-50 border border-amber-200 rounded">
                                <label className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                                  <input
                                    type="checkbox"
                                    checked={planDraft.no_charge_chronic}
                                    onChange={(e) => updatePlanField("no_charge_chronic", e.target.checked)}
                                  />
                                  Doenca cronica (nao cobrar atendimento)
                                </label>
                                <input
                                  className="w-full mt-2 px-4 py-3 border border-amber-300 bg-white rounded-lg text-base"
                                  value={planDraft.no_charge_reason}
                                  onChange={(e) => updatePlanField("no_charge_reason", e.target.value)}
                                  placeholder="Ex.: asma persistente, diabetes tipo 1"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {activeView === "history" && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Historico Medico</h3>
                            {patientHistory.length === 0 ? (
                              <p className="text-sm text-gray-500">Sem historico registrado para este paciente.</p>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {patientHistory.map((h) => (
                                  <div key={h.visit_id} className="p-3 border border-gray-100 rounded bg-gray-50">
                                    <div className="text-xs text-gray-500">
                                      Visita #{h.visit_id} | {h.arrival_time ? new Date(h.arrival_time).toLocaleString() : "-"}
                                    </div>
                                    <div className="text-sm text-gray-900 font-medium">
                                      {h.likely_diagnosis || h.chief_complaint || "Sem resumo"}
                                    </div>
                                    {h.prescription_text && (
                                      <div className="text-xs text-gray-700 mt-1">{h.prescription_text}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {activeView === "return" && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Agendar Retorno</h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Data de retorno</label>
                                <input
                                  type="date"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.return_visit_date || ""}
                                  onChange={(e) => updatePlanField("return_visit_date", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Motivo</label>
                                <input
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.return_visit_reason}
                                  onChange={(e) => updatePlanField("return_visit_reason", e.target.value)}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => saveMedicalPlan({ accept: false })}
                              disabled={savingPlan}
                              className="px-3 py-1 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                              {savingPlan ? "Salvando..." : "Salvar retorno"}
                            </button>
                          </div>
                        )}

                        {activeView === "lab" && (
                          <div className="border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Exames e Laboratorio</h3>
                            <label className="flex items-center gap-2 text-sm text-gray-800 font-medium mb-3">
                              <input
                                type="checkbox"
                                checked={!!planDraft.lab_requested}
                                onChange={(e) => updatePlanField("lab_requested", e.target.checked)}
                              />
                              Exame laboratorial solicitado
                            </label>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Exames solicitados</label>
                                <textarea
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base min-h-[120px]"
                                  value={planDraft.lab_tests}
                                  onChange={(e) => updatePlanField("lab_tests", e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-700 mb-1 block">Coleta da amostra</label>
                                <input
                                  type="datetime-local"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base"
                                  value={planDraft.lab_sample_collected_at || ""}
                                  onChange={(e) => updatePlanField("lab_sample_collected_at", e.target.value)}
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => saveMedicalPlan({ accept: false })}
                              disabled={savingPlan}
                              className="px-3 py-1 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                              {savingPlan ? "Salvando..." : "Salvar exames"}
                            </button>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <button
                            onClick={startConsultation}
                            disabled={!canStart}
                            className="py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40"
                            title={
                              !triage
                                ? "Precisa de triagem antes de iniciar consulta"
                                : selectedVisit.status !== "WAITING_DOCTOR"
                                ? "O paciente precisa estar em 'Aguardando Médico'"
                                : ""
                            }
                          >
                            Iniciar Consulta
                          </button>
                          <button
                            onClick={finishConsultation}
                            disabled={!canFinish}
                            className="py-2.5 text-sm font-medium transition-colors disabled:opacity-40"
                            style={{ background: canFinish ? "#16a34a" : "#d1fae5", color: canFinish ? "#fff" : "#6b7280" }}
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

              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}


