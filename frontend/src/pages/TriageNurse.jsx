import { useMemo, useState, useEffect } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const PRIORITIES = [
  { value: "URGENT", label: "Urgente", maxWait: 60 },
  { value: "LESS_URGENT", label: "Pouco Urgente", maxWait: 120 },
  { value: "NON_URGENT", label: "Não Urgente", maxWait: 240 },
];

function normalizeDoctorsResponse(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp && Array.isArray(resp.doctors)) return resp.doctors;
  if (resp && Array.isArray(resp.data)) return resp.data;
  return [];
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

// helper: validar número
const isValidNumber = (v, { min = -Infinity, max = Infinity } = {}) => {
  if (v === "" || v == null) return false;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max;
};

export default function TriageNurse() {
  const nav = useNavigate();
  const me = getUser();

  // =============================
  // 1) Procurar paciente
  // =============================
  const [searchMode, setSearchMode] = useState("CODE"); // CODE | NAME
  const [code, setCode] = useState("");
  const [nameQuery, setNameQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [err, setErr] = useState("");

  // paciente selecionado
  const [patient, setPatient] = useState(null);

  // =============================
  // 2) Criar paciente (se não existir)
  // =============================
  const [pClinicalCode, setPClinicalCode] = useState("");
  const [pFullName, setPFullName] = useState("");
  const [pSex, setPSex] = useState("M");
  const [pBirthDate, setPBirthDate] = useState("");
  const [pGuardianName, setPGuardianName] = useState("");
  const [pGuardianPhone, setPGuardianPhone] = useState("");
  const [creatingPatient, setCreatingPatient] = useState(false);

  // =============================
  // 3) Visita + Triagem
  // =============================
  const [visit, setVisit] = useState(null); // visit criada
  const [creatingVisit, setCreatingVisit] = useState(false);

  // triagem
  const [temperature, setTemperature] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [respRate, setRespRate] = useState("");
  const [spo2, setSpo2] = useState("");
  const [weight, setWeight] = useState("");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [priority, setPriority] = useState("URGENT");
  const [customMaxWait, setCustomMaxWait] = useState(""); // opcional
  const [savingTriage, setSavingTriage] = useState(false);

  // =============================
  // AI Suggestion
  // =============================
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  // =============================
  // Doctors (Disponíveis / Ocupados) + Assign
  // =============================
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [assigning, setAssigning] = useState(false);

  // =============================
  // 4) Fila (enfermeiro gerir: cancelar/editar)
  // =============================
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [queueErr, setQueueErr] = useState("");

  const [editingVisit, setEditingVisit] = useState(null);
  const [editPriority, setEditPriority] = useState("URGENT");
  const [editMaxWait, setEditMaxWait] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [cancellingId, setCancellingId] = useState(null);

  const selectedPriority = useMemo(
    () => PRIORITIES.find((p) => p.value === priority),
    [priority]
  );

  // ✅ disponibilidade baseada no teu backend atual:
  // doctorModel retorna is_busy (boolean). AVAILABLE = !is_busy
  const availableDoctors = useMemo(() => {
    return doctors.filter((d) => d?.is_busy === false);
  }, [doctors]);

  const busyDoctors = useMemo(() => {
    return doctors.filter((d) => d?.is_busy === true);
  }, [doctors]);

  // ✅ REGRA: IA do enfermeiro só ativa quando TODOS campos essenciais preenchidos (com números válidos)
  const triageFieldsOk = useMemo(() => {
    const hasChief = chiefComplaint.trim().length > 0;

    // ranges razoáveis (ajusta se quiser)
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

    // NOTA: não vou limpar doctors nem fila aqui (mantém visível)
    setSelectedDoctorId("");
  };

  // =============================
  // Doctors: carregar lista (sempre)
  // =============================
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

  // =============================
  // Queue: carregar fila (sempre)
  // =============================
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
      // ⚠️ precisa existir no api.js: api.cancelVisit(visitId, reason)
      await api.cancelVisit(visitId, reason.trim() || null);
      await loadQueue();
      alert("Visita cancelada.");
    } catch (e) {
      setQueueErr(e.message);
    } finally {
      setCancellingId(null);
    }
  };

  // Carrega doctors ao entrar na página + auto refresh
  useEffect(() => {
    const controller = new AbortController();
    loadDoctors(controller.signal);

    const interval = setInterval(() => {
      const ctrl = new AbortController();
      loadDoctors(ctrl.signal);
    }, 8000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega fila ao entrar + auto refresh
  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============================
  // Buscar paciente
  // =============================
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

  // =============================
  // Criar paciente
  // =============================
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

  // =============================
  // Criar visita (chegada)
  // =============================
  const createVisit = async () => {
    if (!patient?.id) return;

    setErr("");
    setCreatingVisit(true);

    try {
      const v = await api.createVisit(patient.id);
      setVisit(v);
      await loadQueue(); // aparece na fila já
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingVisit(false);
    }
  };

  // =============================
  // Chamar IA (sugestão)
  // =============================
  const askAI = async () => {
    // ✅ bloqueio TOTAL: só roda se triageFieldsOk
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
      let age_years = null;
      if (patient?.birth_date) {
        const bd = new Date(patient.birth_date);
        const now = new Date();
        const hadBirthdayThisYear =
          now >= new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
        age_years = Math.max(
          0,
          now.getFullYear() - bd.getFullYear() - (hadBirthdayThisYear ? 0 : 1)
        );
      }

      const res = await api.aiTriageSuggest({
        age_years,
        chief_complaint: chiefComplaint.trim(),
        clinical_notes: clinicalNotes.trim() || null,
        temperature: Number(temperature),
        heart_rate: Number(heartRate),
        respiratory_rate: Number(respRate),
        oxygen_saturation: Number(spo2),
        weight: Number(weight),
      });

      setAiSuggestion(res);
    } catch (e) {
      setErr(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  // =============================
  // Assign doctor to visit
  // =============================
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
      await api.assignDoctor(visit.id, Number(selectedDoctorId));
      alert("Paciente atribuído ao médico com sucesso!");
      await loadDoctors();
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    } finally {
      setAssigning(false);
    }
  };

  // =============================
  // Salvar triagem + prioridade
  // =============================
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
      nav("/queue");
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setSavingTriage(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Triagem (Enfermeiro)</h1>
            <p className="text-sm text-slate-600">
              {me ? `${me.full_name} • ${me.role}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => nav("/queue")}
              className="px-3 py-2 rounded-lg border bg-white text-sm"
            >
              Ver Fila (Doctor)
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {err && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 1) Paciente */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">1) Paciente</h2>

            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setSearchMode("CODE")}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  searchMode === "CODE" ? "bg-slate-900 text-white" : "bg-white"
                }`}
              >
                Por Código
              </button>
              <button
                type="button"
                onClick={() => setSearchMode("NAME")}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  searchMode === "NAME" ? "bg-slate-900 text-white" : "bg-white"
                }`}
              >
                Por Nome
              </button>
            </div>

            {searchMode === "CODE" ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Código clínico</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: P0001"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do paciente</label>
                <input
                  className="w-full border rounded-lg p-2"
                  value={nameQuery}
                  onChange={(e) => setNameQuery(e.target.value)}
                  placeholder="Ex: João"
                />
              </div>
            )}

            <button
              type="button"
              onClick={searchPatient}
              disabled={searchLoading}
              className="w-full mt-3 bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
            >
              {searchLoading ? "Procurando..." : "Procurar"}
            </button>

            {searchMode === "NAME" && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">Resultados:</p>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPatient(p);
                      setAiSuggestion(null);
                      setVisit(null);
                      setSelectedDoctorId("");
                    }}
                    className="w-full text-left border rounded-lg p-2 hover:bg-slate-50"
                  >
                    <div className="font-medium">
                      {p.full_name}{" "}
                      <span className="text-slate-500">
                        ({p.clinical_code})
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Encarregado: {p.guardian_name} • {p.guardian_phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {patient && (
              <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                <div className="font-semibold">
                  {patient.full_name} • {patient.clinical_code}
                </div>
                <div className="text-sm text-slate-700">
                  Sexo: {patient.sex} • Nascimento: {patient.birth_date}
                </div>
                <div className="text-xs text-slate-500">
                  Encarregado: {patient.guardian_name} •{" "}
                  {patient.guardian_phone}
                </div>

                <button
                  type="button"
                  onClick={createVisit}
                  disabled={creatingVisit || !!visit}
                  className="w-full mt-3 bg-white border p-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {visit
                    ? `Visita criada (#${visit.id})`
                    : creatingVisit
                    ? "Criando visita..."
                    : "Registrar Chegada (Criar Visita)"}
                </button>
              </div>
            )}
          </div>

          {/* 2) Criar Paciente */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">
              2) Criar Paciente (se não existir)
            </h2>

            <form onSubmit={createPatient} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Código clínico</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={pClinicalCode}
                  onChange={(e) => setPClinicalCode(e.target.value)}
                  placeholder="Ex: P0002"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={pFullName}
                  onChange={(e) => setPFullName(e.target.value)}
                  placeholder="Ex: João Pedro"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Sexo</label>
                  <select
                    className="w-full border rounded-lg p-2 mt-1"
                    value={pSex}
                    onChange={(e) => setPSex(e.target.value)}
                  >
                    <option value="M">M</option>
                    <option value="F">F</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Nascimento</label>
                  <input
                    type="date"
                    className="w-full border rounded-lg p-2 mt-1"
                    value={pBirthDate}
                    onChange={(e) => setPBirthDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Encarregado</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={pGuardianName}
                  onChange={(e) => setPGuardianName(e.target.value)}
                  placeholder="Ex: Maria Pedro"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Contacto</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={pGuardianPhone}
                  onChange={(e) => setPGuardianPhone(e.target.value)}
                  placeholder="Ex: 84xxxxxxx"
                  required
                />
              </div>

              <button
                disabled={creatingPatient}
                className="w-full bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
              >
                {creatingPatient ? "Criando..." : "Criar Paciente"}
              </button>
            </form>
          </div>

          {/* 3) Triagem */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">3) Triagem</h2>

            <form onSubmit={saveTriage} className="space-y-3">
              {/* Médicos (sempre visível) */}
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">Médicos</div>
                  <button
                    type="button"
                    onClick={() => loadDoctors()}
                    disabled={loadingDoctors}
                    className="px-2 py-1 rounded-lg border bg-white text-xs disabled:opacity-50"
                  >
                    {loadingDoctors ? "Atualizando..." : "Atualizar"}
                  </button>
                </div>

                {doctors.length === 0 ? (
                  <div className="text-xs text-slate-600">
                    {loadingDoctors
                      ? "Carregando médicos..."
                      : "Nenhum médico retornado pela API. Confirma se /doctors/availability está OK."}
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-slate-600 mb-2">
                      Disponíveis: {availableDoctors.length} • Ocupados:{" "}
                      {busyDoctors.length}
                    </div>

                    {/* Atribuição só com visita */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium">
                        Atribuir a um médico (precisa visita)
                      </label>

                      <select
                        className="w-full border rounded-lg p-2 text-sm"
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        disabled={!visit?.id || availableDoctors.length === 0}
                        title={!visit?.id ? "Crie a visita primeiro" : ""}
                      >
                        <option value="">
                          {visit?.id
                            ? "-- selecionar médico --"
                            : "-- crie a visita para atribuir --"}
                        </option>
                        {availableDoctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.full_name || d.username || `Médico #${d.id}`}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={assignDoctor}
                        disabled={!visit?.id || assigning || !selectedDoctorId}
                        className="w-full bg-slate-900 text-white p-2 rounded-lg text-sm disabled:opacity-60"
                      >
                        {assigning
                          ? "Atribuindo..."
                          : "Enviar paciente ao médico"}
                      </button>
                    </div>

                    {busyDoctors.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold mb-1">
                          Ocupados
                        </div>
                        <ul className="text-xs text-slate-700 list-disc pl-5 space-y-1">
                          {busyDoctors.slice(0, 8).map((d) => (
                            <li key={d.id}>
                              {d.full_name || d.username || `Médico #${d.id}`}
                              {d.current_visit_id ? (
                                <span className="text-slate-500">
                                  {" "}
                                  • em consulta #{d.current_visit_id}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Dados de triagem */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">
                    Temperatura (°C) *
                  </label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="38.2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Saturação (%) *</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={spo2}
                    onChange={(e) => setSpo2(e.target.value)}
                    placeholder="96"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">FC (bpm) *</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">FR (rpm) *</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={respRate}
                    onChange={(e) => setRespRate(e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Peso (kg) *</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="14.5"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Queixa principal *</label>
                <textarea
                  className="w-full border rounded-lg p-2 mt-1"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Ex: Febre e tosse"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Observações</label>
                <textarea
                  className="w-full border rounded-lg p-2 mt-1"
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Notas clínicas..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <select
                    className="w-full border rounded-lg p-2 mt-1"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">
                    Vermelho/Laranja não entram no sistema.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">Tempo máx. (min)</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={customMaxWait}
                    onChange={(e) => setCustomMaxWait(e.target.value)}
                    placeholder={`${selectedPriority?.maxWait ?? ""}`}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Deixe vazio para usar padrão ({selectedPriority?.maxWait}{" "}
                    min).
                  </p>
                </div>
              </div>

              {/* IA */}
              <button
                type="button"
                onClick={askAI}
                disabled={aiLoading || !triageFieldsOk}
                className="w-full border bg-white p-2 rounded-lg text-sm disabled:opacity-60"
                title={
                  !triageFieldsOk
                    ? "Preencha Temperatura, SpO2, FC, FR, Peso e Queixa principal para usar IA."
                    : ""
                }
              >
                {aiLoading
                  ? "A IA está avaliando..."
                  : "Avaliar com IA (sugestão)"}
              </button>

              {!triageFieldsOk && (
                <p className="text-xs text-slate-500">
                  IA bloqueada até preencher: Temperatura, SpO2, FC, FR, Peso e
                  Queixa principal (valores numéricos válidos).
                </p>
              )}

              {aiSuggestion && (
                <div className="border rounded-lg p-3 bg-slate-50">
                  <div className="text-xs text-slate-500 mb-2">
                    {aiSuggestion.disclaimer ||
                      "Sugestão gerada por IA. Não substitui decisão clínica."}
                  </div>

                  {aiSuggestion.red_flag && (
                    <div className="mb-2 text-sm font-semibold text-red-700">
                      ⚠️ Alerta: sinais de risco — considerar avaliação imediata
                      fora do sistema.
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">
                        Sugestão: {aiSuggestion.suggested_priority}
                      </div>
                      <div className="text-xs text-slate-600">
                        Confiança:{" "}
                        {Math.round((aiSuggestion.confidence || 0) * 100)}%
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPriority(aiSuggestion.suggested_priority)}
                      className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs"
                    >
                      Aplicar prioridade
                    </button>
                  </div>
                </div>
              )}

              <button
                disabled={savingTriage}
                className="w-full bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
              >
                {savingTriage ? "Salvando..." : "Registrar Triagem"}
              </button>

              <p className="text-xs text-slate-500">
                Regra: selecione/crie paciente → crie visita → registre triagem →
                defina prioridade.
              </p>
            </form>
          </div>

          {/* 4) Fila (Gerir) - Cancelar / Editar */}
          <div className="bg-white rounded-2xl shadow p-4 lg:col-span-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">4) Fila (Gerir)</h2>
              <button
                type="button"
                onClick={loadQueue}
                disabled={loadingQueue}
                className="px-3 py-2 rounded-lg border bg-white text-sm disabled:opacity-60"
              >
                {loadingQueue ? "Atualizando..." : "Atualizar"}
              </button>
            </div>

            {queueErr && (
              <div className="bg-red-100 text-red-700 p-2 rounded-lg mb-3 text-sm">
                {queueErr}
              </div>
            )}

            {queue.length === 0 ? (
              <div className="text-sm text-slate-600">Fila vazia.</div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-2 p-2 bg-slate-100 text-xs font-semibold">
                  <div>ID</div>
                  <div className="col-span-2">Paciente</div>
                  <div>Prioridade</div>
                  <div>Status</div>
                  <div>Espera</div>
                  <div>Alerta</div>
                  <div className="text-right">Ações</div>
                </div>

                {queue.map((v) => {
                  const wait = v.wait_minutes ?? null;

                  const isCritical3h = wait != null && wait >= 180;
                  const isInsane24h = wait != null && wait >= 1440;

                  // ✅ deixa a linha vermelha depois de 3h
                  const rowDanger =
                    isInsane24h || isCritical3h
                      ? "bg-red-50"
                      : "";

                  return (
                    <div
                      key={v.id}
                      className={`grid grid-cols-8 gap-2 p-2 border-t text-sm items-center ${rowDanger}`}
                    >
                      <div>#{v.id}</div>

                      <div className="col-span-2">
                        {v.full_name}{" "}
                        <span className="text-slate-500">
                          ({v.clinical_code})
                        </span>
                      </div>

                      <div>{v.priority || "-"}</div>
                      <div className="font-medium">{statusLabel(v.status)}</div>

                      <div>{wait != null ? `${wait}m` : "-"}</div>

                      <div>
                        {isInsane24h ? (
                          <span className="text-xs font-semibold text-red-800">
                            🚫 +24h (irreal)
                          </span>
                        ) : isCritical3h ? (
                          <span className="text-xs font-semibold text-red-700">
                            🔴 CRÍTICO (+3h)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </div>

                      <div className="text-right flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(v)}
                          className="px-2 py-1 rounded-lg border bg-white text-xs"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => cancelOne(v.id)}
                          disabled={cancellingId === v.id}
                          className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs disabled:opacity-60"
                        >
                          {cancellingId === v.id ? "Cancelando..." : "Cancelar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {editingVisit && (
              <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    Editar Visita #{editingVisit.id} — {editingVisit.full_name}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingVisit(null)}
                    className="text-xs underline"
                  >
                    Fechar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <label className="text-sm font-medium">Prioridade</label>
                    <select
                      className="w-full border rounded-lg p-2 mt-1"
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
                    <label className="text-sm font-medium">
                      Tempo máx. (min)
                    </label>
                    <input
                      className="w-full border rounded-lg p-2 mt-1"
                      value={editMaxWait}
                      onChange={(e) => setEditMaxWait(e.target.value)}
                      placeholder={`Padrão: ${
                        PRIORITIES.find((p) => p.value === editPriority)
                          ?.maxWait ?? ""
                      }`}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Dica: {editMaxWait === "" ? "vai usar padrão" : "customizado"}.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="mt-3 w-full bg-slate-900 text-white p-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {savingEdit ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
