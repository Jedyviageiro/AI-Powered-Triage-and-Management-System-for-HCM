import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

const priorityStyle = (priority) => {
  switch (priority) {
    case "URGENT":
      return "bg-red-100 text-red-700 border-red-300";
    case "LESS_URGENT":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "NON_URGENT":
      return "bg-green-100 text-green-700 border-green-300";
    default:
      return "bg-slate-100 text-slate-600 border-slate-300";
  }
};

const rowBlink = (is_overdue) => (is_overdue ? "animate-pulse bg-red-50" : "");

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

export default function Queue() {
  const navigate = useNavigate();
  const user = getUser();

  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      setError("");
      const data = await api.getQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Fila de Atendimento</h1>
            <p className="text-sm text-slate-600">
              {user ? `${user.full_name} • ${user.role}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            {user?.role === "NURSE" && (
              <button
                onClick={() => navigate("/triage")}
                className="px-3 py-2 rounded-lg border bg-white text-sm"
              >
                Triagem
              </button>
            )}

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

        {/* Erro */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Tabela */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="grid grid-cols-6 gap-2 p-3 bg-slate-100 text-xs font-semibold">
            <div>Código</div>
            <div className="col-span-2">Paciente</div>
            <div>Prioridade</div>
            <div>Espera</div>
            <div>Status</div>
          </div>

          {loading ? (
            <div className="p-4 text-slate-600">Carregando...</div>
          ) : queue.length === 0 ? (
            <div className="p-4 text-slate-600">Fila vazia</div>
          ) : (
            queue.map((v) => (
              <div
                key={v.id}
                className={`grid grid-cols-6 gap-2 p-3 border-t text-sm ${rowBlink(
                  v.is_overdue
                )}`}
              >
                <div className="font-medium">{v.clinical_code}</div>
                <div className="col-span-2">{v.full_name}</div>

                <div>
                  {v.priority ? (
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border ${priorityStyle(
                        v.priority
                      )}`}
                    >
                      {v.priority.replace("_", " ")}
                    </span>
                  ) : (
                    "-"
                  )}
                </div>

                <div>
                  {formatWait(v.wait_minutes)}
                  {v.is_overdue && (
                    <span className="ml-2 text-red-600 font-semibold">
                      ATRASADO
                    </span>
                  )}
                </div>

                <div className="font-medium">{formatStatus(v.status)}</div>
              </div>
            ))
          )}
        </div>

        <p className="text-xs text-slate-500 mt-3">
          Atualização automática a cada 5 segundos
        </p>
      </div>
    </div>
  );
}
