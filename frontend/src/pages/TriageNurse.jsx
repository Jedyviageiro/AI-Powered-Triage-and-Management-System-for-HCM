import { useMemo, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const PRIORITIES = [
  { value: "URGENT", label: "Urgente", maxWait: 60 },
  { value: "LESS_URGENT", label: "Pouco Urgente", maxWait: 120 },
  { value: "NON_URGENT", label: "Não Urgente", maxWait: 240 },
];

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

  const selectedPriority = useMemo(
    () => PRIORITIES.find((p) => p.value === priority),
    [priority]
  );

  const logout = () => {
    clearAuth();
    nav("/login");
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
  };

  // =============================
  // Buscar paciente
  // =============================
  const searchPatient = async () => {
    setErr("");
    setSearchLoading(true);
    setSearchResults([]);
    setPatient(null);
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
        setSearchResults(data);
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
    } catch (e) {
      setErr(e.message);
    } finally {
      setCreatingVisit(false);
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
      // 1) cria triagem
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

      // 2) define prioridade + max wait
      const maxWait =
        customMaxWait !== ""
          ? Number(customMaxWait)
          : selectedPriority?.maxWait;

      await api.setVisitPriority(visit.id, {
        priority,
        max_wait_minutes: maxWait,
      });

      alert("Triagem registrada com sucesso!");
      resetAll();
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
              Ver Fila
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
          {/* Buscar / Selecionar Paciente */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">1) Paciente</h2>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSearchMode("CODE")}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  searchMode === "CODE" ? "bg-slate-900 text-white" : "bg-white"
                }`}
              >
                Por Código
              </button>
              <button
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
              onClick={searchPatient}
              disabled={searchLoading}
              className="w-full mt-3 bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
            >
              {searchLoading ? "Procurando..." : "Procurar"}
            </button>

            {/* Resultados por nome */}
            {searchMode === "NAME" && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-slate-500">Resultados:</p>
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPatient(p)}
                    className="w-full text-left border rounded-lg p-2 hover:bg-slate-50"
                  >
                    <div className="font-medium">
                      {p.full_name} <span className="text-slate-500">({p.clinical_code})</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Encarregado: {p.guardian_name} • {p.guardian_phone}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Paciente selecionado */}
            {patient && (
              <div className="mt-4 border rounded-lg p-3 bg-slate-50">
                <div className="font-semibold">
                  {patient.full_name} • {patient.clinical_code}
                </div>
                <div className="text-sm text-slate-700">
                  Sexo: {patient.sex} • Nascimento: {patient.birth_date}
                </div>
                <div className="text-xs text-slate-500">
                  Encarregado: {patient.guardian_name} • {patient.guardian_phone}
                </div>

                <button
                  onClick={createVisit}
                  disabled={creatingVisit || !!visit}
                  className="w-full mt-3 bg-white border p-2 rounded-lg text-sm disabled:opacity-60"
                >
                  {visit ? `Visita criada (#${visit.id})` : creatingVisit ? "Criando visita..." : "Registrar Chegada (Criar Visita)"}
                </button>
              </div>
            )}
          </div>

          {/* Criar Paciente */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">2) Criar Paciente (se não existir)</h2>

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

          {/* Triagem */}
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">3) Triagem</h2>

            <form onSubmit={saveTriage} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Temperatura (°C)</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="38.2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Saturação (%)</label>
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
                  <label className="text-sm font-medium">FC (bpm)</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    placeholder="120"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">FR (rpm)</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={respRate}
                    onChange={(e) => setRespRate(e.target.value)}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Peso (kg)</label>
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
                    Deixe vazio para usar padrão ({selectedPriority?.maxWait} min).
                  </p>
                </div>
              </div>

              <button
                disabled={savingTriage}
                className="w-full bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
              >
                {savingTriage ? "Salvando..." : "Registrar Triagem"}
              </button>

              <p className="text-xs text-slate-500">
                Regra: primeiro selecione/crie paciente → crie visita → registre triagem → defina prioridade.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
