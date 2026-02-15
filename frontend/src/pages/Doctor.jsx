import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";

const formatWait = (m) => {
  if (m == null) return "-";
  if (m === 0) return "<1 minuto";
  if (m === 1) return "1 minuto";
  return `${m} minutos`;
};

const formatStatus = (s) => {
  if (s === "WAITING") return "Aguardando Triagem";
  if (s === "IN_TRIAGE") return "Em Triagem";
  if (s === "WAITING_DOCTOR") return "Aguardando Médico";
  if (s === "IN_CONSULTATION") return "Em Consulta";
  if (s === "FINISHED") return "Finalizado";
  return s || "-";
};

export default function Doctor() {
  const me = getUser();

  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(true);
  const [err, setErr] = useState("");

  const [selectedVisit, setSelectedVisit] = useState(null);
  const [triage, setTriage] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  // polling + heartbeat + mount guards
  const intervalRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(true);

  const stopIntervals = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  const safeSet = (fn) => {
    if (mountedRef.current) fn();
  };

  // (opcional) filtra o que o médico deve ver na fila
  const filteredQueue = useMemo(() => {
    // médico só deveria focar em "WAITING_DOCTOR" e "IN_CONSULTATION"
    return (Array.isArray(queue) ? queue : []).filter(
      (v) => v.status === "WAITING_DOCTOR" || v.status === "IN_CONSULTATION"
    );
  }, [queue]);

  // ✅ IA só pode ser usada DEPOIS que a consulta começou
  const aiEnabled = useMemo(() => {
    return (
      !!selectedVisit?.id &&
      selectedVisit.status === "IN_CONSULTATION" &&
      !!triage?.chief_complaint
    );
  }, [selectedVisit?.id, selectedVisit?.status, triage?.chief_complaint]);

  const loadQueue = async () => {
    if (!mountedRef.current) {
      // nada
    } else {
      safeSet(() => {
        setErr("");
        setLoadingQueue(true);
      });

      try {
        const data = await api.getQueue();
        safeSet(() => setQueue(Array.isArray(data) ? data : []));
      } catch (e) {
        safeSet(() => setErr(e.message));
      } finally {
        safeSet(() => setLoadingQueue(false));
      }
    }
  };

  const openVisit = async (visitId) => {
    if (!mountedRef.current) {
      // nada
    } else {
      safeSet(() => {
        setErr("");
        setLoadingDetails(true);
        setSelectedVisit(null);
        setTriage(null);
        setAiResult(null);
      });

      try {
        const v = await api.getVisitById(visitId);
        safeSet(() => setSelectedVisit(v));

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
    }
  };

  // ✅ Check-in + heartbeat + polling
  useEffect(() => {
    mountedRef.current = true;

    const boot = async () => {
      try {
        // médico “entra online e disponível”
        await api.doctorCheckin?.();
      } catch (e) {
        // se falhar, não bloqueia a UI, mas avisa
        safeSet(() => setErr(e.message));
      }

      await loadQueue();

      intervalRef.current = setInterval(() => {
        loadQueue();
      }, 5000);

      heartbeatRef.current = setInterval(async () => {
        try {
          await api.doctorHeartbeat?.();
        } catch {
          // ignora falhas temporárias de heartbeat
        }
      }, 30000);
    };

    boot();

    return () => {
      mountedRef.current = false;
      stopIntervals();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    stopIntervals();

    try {
      await api.doctorCheckout?.();
    } catch {
      // se falhar, segue logout na mesma
    }

    clearAuth();
    window.location.replace("/login");
  };

  const startConsultation = async () => {
    if (!selectedVisit?.id) return;

    // ✅ bloqueio extra (UI já bloqueia, mas reforça)
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
        setAiResult(null);
      });

      await loadQueue();
    } catch (e) {
      safeSet(() => setErr(e.message));
    }
  };

  const askDoctorAI = async () => {
    if (!selectedVisit?.id) return;

    // ✅ IA só depois de iniciar consulta
    if (selectedVisit.status !== "IN_CONSULTATION") {
      safeSet(() => setErr("Inicie a consulta antes de usar a IA."));
      return;
    }

    if (!triage?.chief_complaint) {
      safeSet(() =>
        setErr("Não há dados de triagem suficientes para pedir sugestão da IA.")
      );
      return;
    }

    safeSet(() => {
      setErr("");
      setAiLoading(true);
      setAiResult(null);
    });

    try {
      const res = await api.aiDoctorSuggest({
        age_years: null,
        chief_complaint: triage?.chief_complaint || "",
        clinical_notes: triage?.clinical_notes || "",
        temperature: triage?.temperature ?? null,
        heart_rate: triage?.heart_rate ?? null,
        respiratory_rate: triage?.respiratory_rate ?? null,
        oxygen_saturation: triage?.oxygen_saturation ?? null,
        weight: triage?.weight ?? null,
        priority: selectedVisit?.priority ?? null,
      });

      safeSet(() => setAiResult(res));
    } catch (e) {
      safeSet(() => setErr(e.message));
    } finally {
      safeSet(() => setAiLoading(false));
    }
  };

  const canStart =
    !!selectedVisit?.id &&
    selectedVisit.status === "WAITING_DOCTOR" &&
    !!triage;

  const canFinish =
    !!selectedVisit?.id && selectedVisit.status === "IN_CONSULTATION";

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
              <span className="text-xs text-slate-500">
                Total: {filteredQueue.length}
              </span>
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
            ) : filteredQueue.length === 0 ? (
              <div className="p-4 text-slate-600">
                Nenhum paciente aguardando médico.
              </div>
            ) : (
              filteredQueue.map((v) => (
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
                      <div>
                        <b>Temp:</b> {triage.temperature ?? "-"} °C
                      </div>
                      <div>
                        <b>SpO2:</b> {triage.oxygen_saturation ?? "-"} %
                      </div>
                      <div>
                        <b>FC:</b> {triage.heart_rate ?? "-"} bpm
                      </div>
                      <div>
                        <b>FR:</b> {triage.respiratory_rate ?? "-"} rpm
                      </div>
                      <div>
                        <b>Peso:</b> {triage.weight ?? "-"} kg
                      </div>
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

                {/* ✅ IA do Médico: só depois de IN_CONSULTATION */}
                <button
                  type="button"
                  onClick={askDoctorAI}
                  disabled={aiLoading || !aiEnabled}
                  className="w-full border bg-white p-2 rounded-lg text-sm disabled:opacity-60"
                  title={
                    !aiEnabled
                      ? !selectedVisit?.id
                        ? "Selecione uma visita"
                        : selectedVisit.status !== "IN_CONSULTATION"
                        ? "Inicie a consulta para usar a IA"
                        : !triage?.chief_complaint
                        ? "Precisa de triagem antes"
                        : ""
                      : ""
                  }
                >
                  {aiLoading
                    ? "A IA está analisando..."
                    : "IA: sugerir diagnóstico e prescrição (validar)"}
                </button>

                {aiResult && (
                  <div className="border rounded-lg p-3 bg-slate-50">
                    <div className="text-xs text-slate-500 mb-2">
                      {aiResult.disclaimer ||
                        "Sugestão gerada por IA. Validar por protocolo local."}
                    </div>

                    {aiResult.red_flag && (
                      <div className="mb-2 text-sm font-semibold text-red-700">
                        ⚠️ Alerta: possível risco elevado — seguir protocolo do serviço.
                      </div>
                    )}

                    {aiResult.summary && (
                      <div className="text-sm mb-2">
                        <b>Resumo:</b> {aiResult.summary}
                      </div>
                    )}

                    {Array.isArray(aiResult.differential_diagnoses) &&
                      aiResult.differential_diagnoses.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold mb-1">
                            Diagnósticos diferenciais
                          </div>
                          <ul className="text-xs text-slate-700 list-disc pl-5 space-y-1">
                            {aiResult.differential_diagnoses
                              .slice(0, 6)
                              .map((d, idx) => (
                                <li key={idx}>
                                  <b>{d.name}:</b> {d.why}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={startConsultation}
                    disabled={!canStart}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm disabled:opacity-50"
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
                    className="flex-1 px-3 py-2 rounded-lg bg-green-600 text-white text-sm disabled:opacity-50"
                  >
                    Finalizar
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  A IA apenas sugere. O médico valida/ignora. A triagem é feita pelo enfermeiro.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
