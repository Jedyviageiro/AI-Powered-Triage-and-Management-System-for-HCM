import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const formatWait = (m) => {
  if (m == null) return "-";
  if (m === 0) return "<1 minuto";
  if (m === 1) return "1 minuto";
  return `${m} minutos`;
};

const formatStatus = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  return s || "-";
};

export default function Doctor() {
  const nav = useNavigate();
  const me = getUser();

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [err, setErr] = useState("");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [triage, setTriage] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const loadQueue = async () => {
    setErr("");
    setLoadingQueue(true);
    try {
      const data = await api.getQueue();
      setQueue(data);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingQueue(false);
    }
  };

  const openVisit = async (visitId) => {
    setErr("");
    setLoadingDetails(true);
    setSelectedVisit(null);
    setTriage(null);

    try {
      const v = await api.getVisitById(visitId);
      setSelectedVisit(v);

      // triage pode não existir ainda
      try {
        const t = await api.getTriageByVisitId(visitId);
        setTriage(t);
      } catch {
        setTriage(null);
      }
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearAuth();
    nav("/login");
  };

  const startConsultation = async () => {
    if (!selectedVisit?.id) return;
    setErr("");
    try {
      await api.setVisitStatus(selectedVisit.id, "IN_CONSULTATION");
      await openVisit(selectedVisit.id);
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    }
  };

  const finishConsultation = async () => {
    if (!selectedVisit?.id) return;
    setErr("");
    try {
      await api.finishVisit(selectedVisit.id);
      setSelectedVisit(null);
      setTriage(null);
      await loadQueue();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Médico</h1>
            <p className="text-sm text-slate-600">
              {me ? `${me.full_name} • ${me.role}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadQueue}
              className="px-3 py-2 rounded-lg border bg-white text-sm"
            >
              Atualizar
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lista da fila */}
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Fila</h2>
              <span className="text-xs text-slate-500">Total: {queue.length}</span>
            </div>

            <div className="grid grid-cols-6 gap-2 p-3 bg-slate-100 text-xs font-semibold">
              <div>Código</div>
              <div className="col-span-2">Paciente</div>
              <div>Espera</div>
              <div>Status</div>
              <div className="text-right">Ação</div>
            </div>

            {loadingQueue ? (
              <div className="p-4 text-slate-600">Carregando...</div>
            ) : queue.length === 0 ? (
              <div className="p-4 text-slate-600">Fila vazia</div>
            ) : (
              queue.map((v) => (
                <div
                  key={v.id}
                  className={`grid grid-cols-6 gap-2 p-3 border-t text-sm items-center ${
                    selectedVisit?.id === v.id ? "bg-slate-50" : ""
                  }`}
                >
                  <div className="font-medium">{v.clinical_code}</div>
                  <div className="col-span-2">{v.full_name}</div>
                  <div>{formatWait(v.wait_minutes)}</div>
                  <div className="font-medium">{formatStatus(v.status)}</div>
                  <div className="text-right">
                    <button
                      onClick={() => openVisit(v.id)}
                      className="px-2 py-1 rounded-lg border bg-white text-xs"
                    >
                      Abrir
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Detalhes */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-lg">Detalhes</h2>
              {selectedVisit && (
                <span className="text-xs text-slate-500">
                  Visita #{selectedVisit.id}
                </span>
              )}
            </div>

            {loadingDetails ? (
              <div className="text-slate-600">Carregando detalhes...</div>
            ) : !selectedVisit ? (
              <div className="text-slate-600">
                Selecione um paciente na fila para ver detalhes.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border rounded-lg p-3 bg-slate-50">
                  <div className="font-semibold">Status</div>
                  <div className="text-sm">{formatStatus(selectedVisit.status)}</div>
                </div>

                <div className="border rounded-lg p-3">
                  <div className="font-semibold mb-2">Triagem</div>

                  {!triage ? (
                    <div className="text-sm text-slate-600">
                      Triagem ainda não registrada.
                    </div>
                  ) : (
                    <div className="text-sm grid grid-cols-2 gap-2">
                      <div><b>Temp:</b> {triage.temperature ?? "-"} °C</div>
                      <div><b>SpO2:</b> {triage.oxygen_saturation ?? "-"} %</div>
                      <div><b>FC:</b> {triage.heart_rate ?? "-"} bpm</div>
                      <div><b>FR:</b> {triage.respiratory_rate ?? "-"} rpm</div>
                      <div><b>Peso:</b> {triage.weight ?? "-"} kg</div>
                      <div className="col-span-2">
                        <b>Queixa:</b> {triage.chief_complaint}
                      </div>
                      {triage.clinical_notes && (
                        <div className="col-span-2">
                          <b>Notas:</b> {triage.clinical_notes}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startConsultation}
                    disabled={selectedVisit.status === "IN_CONSULTATION"}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
                  >
                    Iniciar Consulta
                  </button>

                  <button
                    onClick={finishConsultation}
                    className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm"
                  >
                    Finalizar
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  O médico apenas altera status/atendimento. A triagem é feita pelo enfermeiro.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
