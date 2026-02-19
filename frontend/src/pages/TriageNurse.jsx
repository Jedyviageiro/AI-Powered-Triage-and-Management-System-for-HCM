import { useMemo, useState, useEffect } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";

const PRIORITIES = [
  { value: "URGENT", label: "Urgente", maxWait: 60 },
  { value: "LESS_URGENT", label: "Pouco Urgente", maxWait: 120 },
  { value: "NON_URGENT", label: "Não Urgente", maxWait: 240 },
];

const priorityLabel = (value) =>
  PRIORITIES.find((p) => p.value === value)?.label || "Nao classificado";

const roleLabel = (role) => {
  if (role === "DOCTOR") return "Medico";
  if (role === "NURSE") return "Enfermeiro";
  if (role === "ADMIN") return "Administrador";
  return role || "-";
};

function normalizeDoctorsResponse(resp) {
  const raw = Array.isArray(resp)
    ? resp
    : resp && Array.isArray(resp.doctors)
    ? resp.doctors
    : resp && Array.isArray(resp.data)
    ? resp.data
    : [];

  return raw.map((d) => ({
    ...d,
    specialization: String(
      d?.specialization ??
      d?.doctor_specialization ??
      d?.especializacao ??
      ""
    ).trim(),
  }));
}

const statusLabel = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "IN_TRIAGE") return "Em Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  if (s === "CANCELLED") return "Cancelado";
  return s || "-";
};

const isValidNumber = (v, { min = -Infinity, max = Infinity } = {}) => {
  if (v === "" || v == null) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
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

export default function TriageNurse() {
  const me = getUser();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState("home");

  const [searchMode, setSearchMode] = useState("CODE");
  const [code, setCode] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [err, setErr] = useState("");
  const [patient, setPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);

  const [pClinicalCode, setPClinicalCode] = useState("");
  const [pFullName, setPFullName] = useState("");
  const [pSex, setPSex] = useState("M");
  const [pBirthDate, setPBirthDate] = useState("");
  const [pGuardianName, setPGuardianName] = useState("");
  const [pGuardianPhone, setPGuardianPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  const [visit, setVisit] = useState(null);
  const [creatingVisit, setCreatingVisit] = useState(false);

  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [priority, setPriority] = useState("URGENT");
  const [customMaxWait, setCustomMaxWait] = useState("");
  const [savingTriage, setSavingTriage] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueErr, setQueueErr] = useState("");
  const [pastVisits, setPastVisits] = useState([]);
  const [loadingPastVisits, setLoadingPastVisits] = useState(false);

  const [editingVisit, setEditingVisit] = useState(null);
  const [editPriority, setEditPriority] = useState("URGENT");
  const [editMaxWait, setEditMaxWait] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);

  const selectedPriority = useMemo(
    () => PRIORITIES.find((p) => p.value === priority),
    [priority]
  );

  const availableDoctors = useMemo(() => {
    return doctors.filter((d) => d?.is_busy === false);
  }, [doctors]);

  const busyDoctors = useMemo(() => {
    return doctors.filter((d) => d?.is_busy === true);
  }, [doctors]);

  const urgentQueue = useMemo(
    () => queue.filter((v) => v?.priority === "URGENT"),
    [queue]
  );

  const nonUrgentQueue = useMemo(
    () => queue.filter((v) => v?.priority !== "URGENT"),
    [queue]
  );

  const patientAgeYears = useMemo(
    () => calculateAgeYears(patient?.birth_date),
    [patient?.birth_date]
  );

  const latestRecordedWeight = useMemo(() => {
    if (!Array.isArray(patientHistory)) return null;
    for (const h of patientHistory) {
      if (h?.weight != null && Number.isFinite(Number(h.weight))) {
        return Number(h.weight);
      }
    }
    return null;
  }, [patientHistory]);

  const triageFieldsOk = useMemo(() => {
    const hasChief = chiefComplaint.trim().length > 0;
    const okTemp = isValidNumber(temperature, { min: 25, max: 45 });
    const okSpo2 = isValidNumber(spo2, { min: 1, max: 100 });
    const okHR = isValidNumber(heartRate, { min: 20, max: 260 });
    const okRR = isValidNumber(respRate, { min: 5, max: 120 });
    const okWeight = isValidNumber(weight, { min: 0.5, max: 300 });
    return hasChief && okTemp && okSpo2 && okHR && okRR && okWeight;
  }, [chiefComplaint, temperature, spo2, heartRate, respRate, weight]);

  const logout = () => {
    clearAuth();
    window.location.replace("/login");
  };

  const resetAll = () => {
    setErr("");
    setSearchResults([]);
    setPatient(null);
    setVisit(null);
    setCode("");
    setNameQuery("");
    setPClinicalCode("");
    setPFullName("");
    setPSex("M");
    setPBirthDate("");
    setPGuardianName("");
    setPGuardianPhone("");
    setTemperature("");
    setHeartRate("");
    setRespRate("");
    setSpo2("");
    setWeight("");
    setChiefComplaint("");
    setClinicalNotes("");
    setPriority("URGENT");
    setCustomMaxWait("");
    setAiSuggestion(null);
    setSelectedDoctorId("");
  };

  const loadDoctors = async (signal) => {
    setErr("");
    setLoadingDoctors(true);
    try {
      const resp = await api.listDoctors();
      if (signal?.aborted) return;
      const list = normalizeDoctorsResponse(resp);
      setDoctors(list);
    } catch (e) {
      if (signal?.aborted) return;
      setDoctors([]);
      setErr(e.message);
    } finally {
      if (!signal?.aborted) setLoadingDoctors(false);
    }
  };

  const loadQueue = async () => {
    setQueueErr("");
    setLoadingQueue(true);
    try {
      const data = await api.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadPastVisits = async () => {
    setLoadingPastVisits(true);
    try {
      const data = await api.listPastVisits(300);
      const rows = Array.isArray(data) ? data : [];
      setPastVisits(
        rows.map((v) => ({
          ...v,
          doctor_specialization: String(
            v?.doctor_specialization ??
            v?.specialization ??
            v?.doctor?.specialization ??
            ""
          ).trim(),
        }))
      );
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setLoadingPastVisits(false);
    }
  };

  const openEdit = (v) => {
    setEditingVisit(v);
    setEditPriority(v.priority || "URGENT");
    setEditMaxWait(v.max_wait_minutes != null ? String(v.max_wait_minutes) : "");
  };

  const saveEdit = async () => {
    if (!editingVisit?.id) return;
    const defaultMax =
      PRIORITIES.find((p) => p.value === editPriority)?.maxWait ?? 60;
    const maxWait = editMaxWait !== "" ? Number(editMaxWait) : defaultMax;
    if (!Number.isFinite(maxWait) || maxWait <= 0) {
      setQueueErr("Tempo máx. inválido.");
      return;
    }
    setSavingEdit(true);
    setQueueErr("");
    try {
      await api.setVisitPriority(editingVisit.id, {
        priority: editPriority,
        max_wait_minutes: maxWait,
      });
      setEditingVisit(null);
      await loadQueue();
      alert("Atualizado!");
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const cancelOne = async (visitId) => {
    const reason = prompt("Motivo do cancelamento? (opcional)") || "";
    setCancellingId(visitId);
    setQueueErr("");
    try {
      await api.cancelVisit(visitId, reason.trim() || null);
      await loadQueue();
      alert("Visita cancelada.");
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadDoctors(controller.signal);
    const interval = setInterval(() => {
      const ctrl = new AbortController();
      loadDoctors(ctrl.signal);
    }, 30 * 60 * 1000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    loadQueue();
    loadPastVisits();
    const interval = setInterval(() => {
      loadQueue();
      loadPastVisits();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!patient?.id) {
        setPatientHistory([]);
        return;
      }
      try {
        const history = await api.getPatientHistory(patient.id);
        if (!cancelled) setPatientHistory(Array.isArray(history) ? history : []);
      } catch {
        if (!cancelled) setPatientHistory([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [patient?.id]);

  useEffect(() => {
    if (activeView === "doctors") {
      loadDoctors();
    }
    if (activeView === "patients") {
      loadPastVisits();
    }
  }, [activeView]);

  const searchPatient = async () => {
    setErr("");
    setSearchLoading(true);
    setSearchResults([]);
    setPatient(null);
    setVisit(null);
    setAiSuggestion(null);
    setSelectedDoctorId("");
    try {
      if (searchMode === "CODE") {
        if (!code.trim()) {
          setErr("Informe o código clínico.");
          return;
        }
        const data = await api.getPatientByCode(code.trim());
        setPatient(data);
      } else {
        if (!nameQuery.trim() || nameQuery.trim().length < 2) {
          setErr("Informe pelo menos 2 letras no nome.");
          return;
        }
        const data = await api.searchPatients(nameQuery.trim());
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const createPatient = async (e) => {
    e.preventDefault();
    setErr("");
    setCreatingPatient(true);
    try {
      const created = await api.createPatient({
        clinical_code: pClinicalCode.trim(),
        full_name: pFullName.trim(),
        sex: pSex,
        birth_date: pBirthDate,
        guardian_name: pGuardianName.trim(),
        guardian_phone: pGuardianPhone.trim(),
      });
      setPatient(created);
      setSearchResults([]);
      setAiSuggestion(null);
      setVisit(null);
      setSelectedDoctorId("");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setCreatingPatient(false);
    }
  };

  const createVisit = async () => {
    if (!patient?.id) return;
    setErr("");
    setCreatingVisit(true);
    try {
      const v = await api.createVisit(patient.id);
      setVisit(v);
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingVisit(false);
    }
  };

  const askAI = async () => {
    if (!triageFieldsOk) {
      setErr(
        "Para usar IA, preencha TODOS os dados: Temperatura, SpO2, FC, FR, Peso e Queixa principal."
      );
      return;
    }
    setErr("");
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const res = await api.aiTriageSuggest({
        age_years: patientAgeYears,
        chief_complaint: chiefComplaint.trim(),
        clinical_notes: clinicalNotes.trim() || null,
        temperature: Number(temperature),
        heart_rate: Number(heartRate),
        respiratory_rate: Number(respRate),
        oxygen_saturation: Number(spo2),
        weight: Number(weight),
      });
      setAiSuggestion(res);
      const suggestedId = Number(res?.suggested_doctor?.id);
      if (
        Number.isFinite(suggestedId) &&
        availableDoctors.some((d) => Number(d.id) === suggestedId)
      ) {
        setSelectedDoctorId(String(suggestedId));
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  const assignDoctor = async () => {
    if (!visit?.id) {
      setErr("Crie a visita antes de atribuir médico.");
      return;
    }
    if (!selectedDoctorId) {
      setErr("Selecione um médico disponível.");
      return;
    }
    setErr("");
    setAssigning(true);
    try {
      const updated = await api.assignDoctor(visit.id, Number(selectedDoctorId));
      setVisit(updated || visit);
      alert("Paciente atribuído ao médico com sucesso!");
      await loadDoctors();
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setAssigning(false);
    }
  };

  const saveTriage = async (e) => {
    e.preventDefault();
    if (!visit?.id) {
      setErr("Crie a visita (chegada) antes de registrar a triagem.");
      return;
    }
    if (!chiefComplaint.trim()) {
      setErr("Informe a queixa principal.");
      return;
    }
    const currentWeight = weight === "" ? null : Number(weight);
    if (
      currentWeight != null &&
      Number.isFinite(currentWeight) &&
      latestRecordedWeight != null &&
      Number.isFinite(latestRecordedWeight) &&
      latestRecordedWeight > 0
    ) {
      const ratio = currentWeight / latestRecordedWeight;
      if (ratio < 0.7 || ratio > 1.5) {
        setErr(
          `Peso inconsistente com historico recente (${latestRecordedWeight} kg). Revise antes de salvar triagem.`
        );
        return;
      }
    }
    setErr("");
    setSavingTriage(true);
    try {
      await api.createTriage({
        visit_id: visit.id,
        temperature: temperature === "" ? null : Number(temperature),
        heart_rate: heartRate === "" ? null : Number(heartRate),
        respiratory_rate: respRate === "" ? null : Number(respRate),
        oxygen_saturation: spo2 === "" ? null : Number(spo2),
        weight: weight === "" ? null : Number(weight),
        chief_complaint: chiefComplaint.trim(),
        clinical_notes: clinicalNotes.trim() || null,
      });
      const maxWait =
        customMaxWait !== "" ? Number(customMaxWait) : selectedPriority?.maxWait;
      await api.setVisitPriority(visit.id, {
        priority,
        max_wait_minutes: maxWait,
      });
      alert("Triagem registrada com sucesso!");
      resetAll();
      await loadQueue();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSavingTriage(false);
    }
  };

  const navItems = [
    {
      key: "home",
      label: "Início",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      key: "newTriage",
      label: "Nova Triagem",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      key: "queue",
      label: "Fila de Espera",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: queue.length > 0 ? queue.length : null,
    },
    {
      key: "doctors",
      label: "Disponibilidade",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: "patients",
      label: "Pacientes antigos",
      icon: (
        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        input:focus, textarea:focus, select:focus {
          outline: none;
          border-color: #6b7280;
        }

        /* Sidebar transition */
        .sidebar {
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }
        .sidebar-open {
          width: 256px;
        }
        .sidebar-closed {
          width: 68px;
        }

        /* Nav label fade */
        .nav-label {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          overflow: hidden;
        }
        .sidebar-open .nav-label {
          opacity: 1;
          max-width: 200px;
        }
        .sidebar-closed .nav-label {
          opacity: 0;
          max-width: 0;
        }

        /* Logo text fade */
        .logo-text {
          transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          overflow: hidden;
        }
        .sidebar-open .logo-text {
          opacity: 1;
          max-width: 200px;
        }
        .sidebar-closed .logo-text {
          opacity: 0;
          max-width: 0;
        }

        /* User section fade */
        .user-info {
          transition: opacity 0.2s ease, max-height 0.3s ease;
          overflow: hidden;
        }
        .sidebar-open .user-info {
          opacity: 1;
          max-height: 80px;
        }
        .sidebar-closed .user-info {
          opacity: 0;
          max-height: 0;
        }

        /* Badge in closed mode */
        .sidebar-closed .nav-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          min-width: 16px;
          height: 16px;
          font-size: 10px;
        }

        /* Hamburger bars animation */
        .hamburger-bar {
          display: block;
          width: 20px;
          height: 2px;
          background: currentColor;
          border-radius: 2px;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
          transform-origin: center;
        }
        .ham-open .hamburger-bar:nth-child(1) {
          transform: translateY(6px) rotate(45deg);
        }
        .ham-open .hamburger-bar:nth-child(2) {
          opacity: 0;
          transform: scaleX(0);
        }
        .ham-open .hamburger-bar:nth-child(3) {
          transform: translateY(-6px) rotate(-45deg);
        }
        .ham-closed .hamburger-bar:nth-child(1) {
          transform: translateY(0) rotate(0);
        }
        .ham-closed .hamburger-bar:nth-child(2) {
          opacity: 1;
          transform: scaleX(1);
        }
        .ham-closed .hamburger-bar:nth-child(3) {
          transform: translateY(0) rotate(0);
        }

        /* Tooltip for closed sidebar */
        .nav-tooltip {
          position: absolute;
          left: calc(100% + 12px);
          top: 50%;
          transform: translateY(-50%);
          background: #111827;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: 6px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 50;
        }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip {
          opacity: 1;
        }
        .sidebar-open .nav-tooltip {
          display: none;
        }
      `}</style>

      {/* Left Sidebar */}
      <aside className={`sidebar bg-white border-r border-gray-200 flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
        
        {/* Hamburger + Logo Header */}
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          {/* Hamburger Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-700"
            style={{ flexShrink: 0 }}
          >
            {sidebarOpen ? (
              /* X icon when open */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Hamburger icon when closed */
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>

          {/* Logo text only */}
          <div className="logo-text min-w-0">
            <div className="text-sm font-semibold text-gray-900 leading-tight">Triagem</div>
            <div className="text-xs text-gray-500">Painel Enfermagem</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navItems.map((item) => (
              <div key={item.key} className="nav-item-wrap relative">
 <button
 onClick={() => setActiveView(item.key)}
                  className={`w-full text-left px-3 py-2.5 text-sm font-medium transition-colors flex items-center gap-3 relative ${
                    activeView === item.key
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.badge && sidebarOpen && (
                    <span className="ml-auto bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {item.badge && !sidebarOpen && (
                    <span className="nav-badge absolute top-1 right-1 bg-gray-900 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
                {/* Tooltip shown only when closed */}
                <span className="nav-tooltip">{item.label}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="user-info mb-2 px-1">
            <div className="text-xs font-medium text-gray-500 mb-0.5">Conectado como</div>
            <div className="text-sm font-semibold text-gray-900 truncate">{me?.full_name || "Enfermeiro(a)"}</div>
            <div className="text-xs text-gray-500">{roleLabel(me?.role)}</div>
          </div>
          <div className="nav-item-wrap relative">
 <button
 onClick={logout}
 className="w-full px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-3"
 >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* Error Alert */}
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

          {/* HOME VIEW */}
          {activeView === "home" && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Painel</h1>
              <p className="text-gray-600 mb-8">Bem-vindo(a), {me?.full_name?.split(' ')[0] || 'Enfermeiro(a)'}</p>

              <div className="grid grid-cols-4 gap-6">
                {/* Total de Pacientes */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Total de Pacientes</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{queue.length}</div>
                </div>

                {/* Médicos Disponíveis */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Médicos Disponíveis</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{availableDoctors.length}</div>
                </div>

                {/* Médicos Ocupados */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Médicos Ocupados</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{busyDoctors.length}</div>
                </div>

                {/* Visita Ativa */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                      <rect x="9" y="3" width="6" height="4" rx="1" ry="1" />
                      <path d="M9 14l2 2 4-4" />
                    </svg>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#6b7280" }}>Visita Ativa</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{visit ? "Sim" : "Não"}</div>
                </div>
              </div>

              <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 gap-4">
 <button
 onClick={() => setActiveView("newTriage")}
                    className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-sm font-semibold text-gray-900 mb-1">Iniciar Nova Triagem</div>
                    <div className="text-xs text-gray-500">Registrar paciente e iniciar avaliação</div>
                  </button>
 <button
 onClick={() => setActiveView("queue")}
                    className="p-4 border border-gray-200 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="text-sm font-semibold text-gray-900 mb-1">Ver Fila de Espera</div>
                    <div className="text-xs text-gray-500">Gerenciar pacientes em espera</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* NEW TRIAGE VIEW */}
          {activeView === "newTriage" && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Nova Triagem</h1>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Patient Search/Create */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Localizar ou Cadastrar Paciente</h2>

                  <div className="flex gap-2 mb-4">
 <button
 onClick={() => setSearchMode("CODE")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        searchMode === "CODE"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Por Código
                    </button>
 <button
 onClick={() => setSearchMode("NAME")}
                      className={`flex-1 py-2 text-sm font-medium transition-colors ${
                        searchMode === "NAME"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Por Nome
                    </button>
                  </div>

                  {searchMode === "CODE" ? (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Código Clínico</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="P0001"
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Nome do Paciente</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        value={nameQuery}
                        onChange={(e) => setNameQuery(e.target.value)}
                        placeholder="João"
                      />
                    </div>
                  )}

 <button
 onClick={searchPatient}
 disabled={searchLoading}
 className="w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
                    {searchLoading ? "Buscando..." : "Buscar"}
                  </button>

                  {searchMode === "NAME" && searchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                      {searchResults.map((p) => (
 <button
 key={p.id}
 onClick={() => {
                            setPatient(p);
                            setAiSuggestion(null);
                            setVisit(null);
                            setSelectedDoctorId("");
                          }}
                          className="w-full text-left p-3 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900 text-sm">{p.full_name}</div>
                          <div className="text-xs text-gray-500 mt-1">{p.clinical_code}</div>
                        </button>
                      ))}
                    </div>
                  )}

                  {patient && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="font-semibold text-gray-900 mb-2">{patient.full_name}</div>
                      <div className="text-sm text-gray-600 space-y-1 mb-3">
                        <div>Idade: {patientAgeYears != null ? `${patientAgeYears} anos` : "-"}</div>
                        {latestRecordedWeight != null && (
                          <div>Ultimo peso registrado: {latestRecordedWeight} kg</div>
                        )}
                        <div>Código: {patient.clinical_code}</div>
                        <div>Sexo: {patient.sex} • Nasc: {patient.birth_date}</div>
                        <div>Responsável: {patient.guardian_name}</div>
                      </div>
 <button
 onClick={createVisit}
 disabled={creatingVisit || !!visit}
 className="w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
                        {visit ? `Visita #${visit.id} Criada` : creatingVisit ? "Criando..." : "Registrar Chegada"}
                      </button>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Ou Cadastrar Novo Paciente</h3>
                    <form onSubmit={createPatient} className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Código Clínico</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={pClinicalCode}
                          onChange={(e) => setPClinicalCode(e.target.value)}
                          placeholder="P0002"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Nome Completo</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={pFullName}
                          onChange={(e) => setPFullName(e.target.value)}
                          placeholder="João Pedro"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Sexo</label>
                          <select
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            value={pSex}
                            onChange={(e) => setPSex(e.target.value)}
                          >
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-700 mb-1 block">Data de Nascimento</label>
                          <input
                            type="date"
                            className="w-full px-3 py-2 border border-gray-300 text-sm"
                            value={pBirthDate}
                            onChange={(e) => setPBirthDate(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Responsável</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={pGuardianName}
                          onChange={(e) => setPGuardianName(e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Telefone</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={pGuardianPhone}
                          onChange={(e) => setPGuardianPhone(e.target.value)}
                          required
                        />
                      </div>
 <button
 disabled={creatingPatient}
 className="w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
                        {creatingPatient ? "Cadastrando..." : "Cadastrar Paciente"}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Triage Form */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Avaliação de Triagem</h2>

                  <form onSubmit={saveTriage} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Temperatura (°C)</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={temperature}
                          onChange={(e) => setTemperature(e.target.value)}
                          placeholder="38.2"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">SpO2 (%)</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={spo2}
                          onChange={(e) => setSpo2(e.target.value)}
                          placeholder="96"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Freq. Cardíaca (bpm)</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={heartRate}
                          onChange={(e) => setHeartRate(e.target.value)}
                          placeholder="120"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Freq. Respiratória (rpm)</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={respRate}
                          onChange={(e) => setRespRate(e.target.value)}
                          placeholder="30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Peso (kg)</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="14.5"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Queixa Principal *</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 text-sm resize-none"
                        rows="3"
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Febre e tosse"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Notas Clínicas</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 text-sm resize-none"
                        rows="2"
                        value={clinicalNotes}
                        onChange={(e) => setClinicalNotes(e.target.value)}
                        placeholder="Observações adicionais..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Prioridade</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1 block">Espera Máx. (min)</label>
                        <input
                          className="w-full px-3 py-2 border border-gray-300 text-sm"
                          value={customMaxWait}
                          onChange={(e) => setCustomMaxWait(e.target.value)}
                          placeholder={`${selectedPriority?.maxWait ?? ""}`}
                        />
                      </div>
                    </div>

 <button
 type="button"
 onClick={askAI}
 disabled={aiLoading || !triageFieldsOk}
 className="w-full py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-40"
 >
                      {aiLoading ? "IA Analisando..." : "Sugestão por IA"}
                    </button>

                                        {aiSuggestion && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        {aiSuggestion.red_flag && (
                          <div className="text-xs font-semibold text-red-600 mb-2">Sinal de Alerta</div>
                        )}
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {priorityLabel(aiSuggestion.suggested_priority)}
                            </div>
                            <div className="text-xs text-gray-600">Confianca: {Math.round((aiSuggestion.confidence || 0) * 100)}%</div>
                            <div className="text-xs text-gray-600 mt-1">
                              Especializacao sugerida: {aiSuggestion.suggested_specialization || "-"}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              Medico sugerido:{" "}
                              {aiSuggestion?.suggested_doctor
                                ? `${aiSuggestion.suggested_doctor.full_name || aiSuggestion.suggested_doctor.username} (${aiSuggestion.suggested_doctor.specialization || "sem especializacao"})`
                                : "Nenhum medico disponivel"}
                            </div>
                            {aiSuggestion?.suggested_doctor?.match_reason && (
                              <div className="text-xs text-gray-500 mt-1">Motivo: {aiSuggestion.suggested_doctor.match_reason}</div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => setPriority(aiSuggestion.suggested_priority)}
                              disabled={priority === aiSuggestion.suggested_priority}
                              className="px-3 py-1 bg-gray-900 text-white text-xs font-medium hover:bg-gray-800"
                            >
                              {priority === aiSuggestion.suggested_priority ? "Prioridade aplicada" : "Aplicar prioridade"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const id = Number(aiSuggestion?.suggested_doctor?.id);
                                if (Number.isFinite(id)) setSelectedDoctorId(String(id));
                              }}
                              disabled={!aiSuggestion?.suggested_doctor?.id}
                              className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium hover:bg-gray-200 disabled:opacity-40"
                            >
                              Aplicar medico
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-200">
                      <label className="text-xs font-medium text-gray-700 mb-1 block">Atribuir Médico</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 text-sm mb-2"
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        disabled={!visit?.id || !!visit?.doctor_id || availableDoctors.length === 0}
                      >
                        <option value="">{visit?.id ? "-- Selecionar --" : "Crie a visita primeiro"}</option>
                        {availableDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {(d.full_name || d.username || `Medico #${d.id}`) + (d.specialization ? ` - ${d.specialization}` : "")}
                          </option>
                        ))}
                      </select>
 <button
 type="button"
 onClick={assignDoctor}
 disabled={!visit?.id || !!visit?.doctor_id || assigning || !selectedDoctorId}
 className="w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-40 mb-3"
 >
                        {visit?.doctor_id ? "Médico já atribuido" : assigning ? "Atribuindo..." : "Atribuir ao Médico"}
                      </button>
                    </div>

 <button
 disabled={savingTriage || !visit?.id || !triageFieldsOk}
  className="w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
  >
                      {savingTriage ? "Salvando..." : "Concluir Triagem"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

                    {/* PAST PATIENTS VIEW */}
          {activeView === "patients" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Pacientes antigos</h1>
                <button
                  onClick={loadPastVisits}
                  disabled={loadingPastVisits}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loadingPastVisits ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              {pastVisits.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <p className="text-gray-600 font-medium">Nenhum historico encontrado</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Visita</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Codigo</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Prioridade</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Diagnostico</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Medico</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pastVisits.map((v, idx) => (
                        <tr key={v.id} className={`border-b border-gray-100 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                          <td className="py-3 px-4 text-sm text-gray-900">#{v.id}</td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{v.full_name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{v.clinical_code}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{priorityLabel(v.priority)}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">{v.likely_diagnosis || "-"}</td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {(v.doctor_full_name || v.doctor_username || "-") +
                              (v.doctor_specialization ? ` (${v.doctor_specialization})` : "")}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-700">
                            {v.consultation_ended_at
                              ? new Date(v.consultation_ended_at).toLocaleString()
                              : v.arrival_time
                              ? new Date(v.arrival_time).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {/* DOCTOR AVAILABILITY VIEW */}
          {activeView === "doctors" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Disponibilidade de Médicos</h1>
 <button
 onClick={() => loadDoctors()}
                  disabled={loadingDoctors}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {loadingDoctors ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900">Disponíveis ({availableDoctors.length})</h2>
                  </div>

                  {availableDoctors.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum médico disponível</p>
                  ) : (
                    <div className="space-y-3">
                      {availableDoctors.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {(d.full_name || d.username || `Medico #${d.id}`) + (d.specialization ? ` - ${d.specialization}` : "")}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Especializacao: {d.specialization || "-"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <h2 className="text-lg font-semibold text-gray-900">Ocupados ({busyDoctors.length})</h2>
                  </div>

                  {busyDoctors.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum médico ocupado</p>
                  ) : (
                    <div className="space-y-3">
                      {busyDoctors.map((d) => (
                        <div key={d.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {(d.full_name || d.username || `Medico #${d.id}`) + (d.specialization ? ` - ${d.specialization}` : "")}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Especializacao: {d.specialization || "-"}
                            </div>
                            {d.current_visit_id && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                Consulta #{d.current_visit_id}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QUEUE MANAGEMENT VIEW */}
          {activeView === "queue" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Fila</h1>
 <button
 onClick={loadQueue}
 disabled={loadingQueue}
 className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
                  {loadingQueue ? "Atualizando..." : "Atualizar"}
                </button>
              </div>

              {queueErr && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">{queueErr}</p>
                </div>
              )}

              {queue.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
                  <div className="text-gray-400 mb-3">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Fila vazia</p>
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">ID</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Prioridade</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Espera</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Alerta</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Medico</th>
                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {urgentQueue.length > 0 && (
                        <tr className="bg-red-50 border-b border-red-100">
                          <td colSpan="8" className="py-2 px-4 text-xs font-semibold text-red-700 uppercase">
                            Prioridade Urgente
                          </td>
                        </tr>
                      )}
                      {urgentQueue.map((v) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;

                        return (
                          <tr
                            key={v.id}
                            className={`border-b border-red-100 ${isCritical ? "bg-red-100" : "bg-red-50/50"}`}
                          >
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">#{v.id}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{v.full_name}</div>
                              <div className="text-xs text-gray-500">{v.clinical_code}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                                {PRIORITIES.find(p => p.value === v.priority)?.label || v.priority || "-"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{statusLabel(v.status)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                              {wait != null ? `${wait}min` : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {isCritical && (
                                <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                                  Crítico
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {v.doctor_full_name || v.doctor_username || "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
 <button
 onClick={() => openEdit(v)}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                  Editar
                                </button>
 <button
 onClick={() => cancelOne(v.id)}
                                  disabled={cancellingId === v.id}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {cancellingId === v.id ? "..." : "Cancelar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {nonUrgentQueue.length > 0 && (
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <td colSpan="8" className="py-2 px-4 text-xs font-semibold text-gray-600 uppercase">
                            Outras Prioridades
                          </td>
                        </tr>
                      )}
                      {nonUrgentQueue.map((v) => {
                        const wait = v.wait_minutes ?? null;
                        const isCritical = wait != null && wait >= 180;

                        return (
                          <tr
                            key={v.id}
                            className={`border-b border-gray-100 ${isCritical ? "bg-red-50" : ""}`}
                          >
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">#{v.id}</td>
                            <td className="py-3 px-4">
                              <div className="text-sm font-medium text-gray-900">{v.full_name}</div>
                              <div className="text-xs text-gray-500">{v.clinical_code}</div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                v.priority === "URGENT" ? "bg-red-100 text-red-700" :
                                v.priority === "LESS_URGENT" ? "bg-orange-100 text-orange-700" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {PRIORITIES.find(p => p.value === v.priority)?.label || v.priority || "-"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">{statusLabel(v.status)}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-mono">
                              {wait != null ? `${wait}min` : "-"}
                            </td>
                            <td className="py-3 px-4">
                              {isCritical && (
                                <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded">
                                  Crítico
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-700">
                              {v.doctor_full_name || v.doctor_username || "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end gap-2">
 <button
 onClick={() => openEdit(v)}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                                >
                                  Editar
                                </button>
 <button
 onClick={() => cancelOne(v.id)}
                                  disabled={cancellingId === v.id}
                                  className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  {cancellingId === v.id ? "..." : "Cancelar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {editingVisit && (
                <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Editar Visita #{editingVisit.id}</h3>
 <button
 onClick={() => setEditingVisit(null)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Prioridade</label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Espera Máx. (min)</label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 text-sm"
                        value={editMaxWait}
                        onChange={(e) => setEditMaxWait(e.target.value)}
                        placeholder={`${PRIORITIES.find((p) => p.value === editPriority)?.maxWait ?? ""}`}
                      />
                    </div>
                  </div>

 <button
 onClick={saveEdit}
 disabled={savingEdit}
 className="mt-4 w-full py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
 >
                    {savingEdit ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}















