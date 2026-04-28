import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiLogOut,
  FiRefreshCw,
  FiSearch,
} from "react-icons/fi";
import { api } from "../../lib/api";
import { clearAuth, getUser } from "../../lib/auth";

const priorityLabel = (priority) => {
  if (priority === "URGENT") return "Urgente";
  if (priority === "LESS_URGENT") return "Menos urgente";
  if (priority === "NON_URGENT") return "Não urgente";
  return "Sem prioridade";
};

const priorityBadgeStyle = (priority) => {
  if (priority === "URGENT") return "bg-red-600 text-white";
  if (priority === "LESS_URGENT") return "bg-amber-400 text-slate-900";
  if (priority === "NON_URGENT") return "bg-emerald-500 text-white";
  return "bg-slate-200 text-slate-700";
};

const formatWait = (minutes) => {
  if (minutes == null) return "-";
  if (minutes <= 0) return "< 1 min";
  if (minutes === 1) return "1 min";
  return `${minutes} min`;
};

const formatStatus = (status) => {
  if (status === "WAITING") return "Aguardando triagem";
  if (status === "WAITING_DOCTOR") return "Aguardando médico";
  if (status === "IN_CONSULTATION") return "Em consulta";
  if (status === "FINISHED") return "Finalizado";
  if (status === "LAB_RETURN") return "Retorno laboratorial";
  return status || "-";
};

const getInitials = (name = "") =>
  String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

const AVATAR_COLORS = [
  "bg-rose-100 text-rose-700",
  "bg-blue-100 text-blue-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
];

const avatarColor = (name = "") => {
  const firstChar = String(name || "P").charCodeAt(0) || 0;
  return AVATAR_COLORS[firstChar % AVATAR_COLORS.length];
};

const SECTIONS = [
  {
    key: "URGENT",
    label: "Urgentes",
    Icon: FiAlertTriangle,
    headerBg: "bg-red-50",
    headerText: "text-red-700",
    borderColor: "border-red-100",
    match: (visit) => visit.priority === "URGENT",
  },
  {
    key: "LAB",
    label: "Exames laboratoriais",
    Icon: FiActivity,
    headerBg: "bg-sky-50",
    headerText: "text-sky-700",
    borderColor: "border-sky-100",
    match: (visit) => visit.status === "LAB_RETURN" && visit.priority !== "URGENT",
  },
  {
    key: "LESS_URGENT",
    label: "Menos urgentes",
    Icon: FiClock,
    headerBg: "bg-amber-50",
    headerText: "text-amber-700",
    borderColor: "border-amber-100",
    match: (visit) => visit.priority === "LESS_URGENT" && visit.status !== "LAB_RETURN",
  },
  {
    key: "NON_URGENT",
    label: "Não urgentes",
    Icon: FiCheckCircle,
    headerBg: "bg-emerald-50",
    headerText: "text-emerald-700",
    borderColor: "border-emerald-100",
    match: (visit) => visit.priority === "NON_URGENT" && visit.status !== "LAB_RETURN",
  },
  {
    key: "OTHER",
    label: "Outros",
    Icon: FiClipboard,
    headerBg: "bg-slate-50",
    headerText: "text-slate-600",
    borderColor: "border-slate-100",
    match: () => true,
  },
];

const groupQueue = (queue) => {
  const assigned = new Set();
  return SECTIONS.map((section) => {
    const patients = queue.filter((visit) => !assigned.has(visit.id) && section.match(visit));
    patients.forEach((visit) => assigned.add(visit.id));
    return { ...section, patients };
  }).filter((section) => section.patients.length > 0);
};

const Avatar = ({ name }) => (
  <div
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xs font-bold ${avatarColor(name)}`}
  >
    {getInitials(name)}
  </div>
);

const AlertBadge = ({ isOverdue }) => {
  if (!isOverdue) {
    return <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">Normal</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Crítico
    </span>
  );
};

const SummaryCard = ({ label, value, hint, tone = "slate" }) => {
  const toneMap = {
    slate: "from-slate-900 to-slate-700 text-white",
    red: "from-red-600 to-rose-500 text-white",
    amber: "from-amber-400 to-orange-400 text-slate-900",
    emerald: "from-emerald-500 to-teal-500 text-white",
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br p-5 shadow-sm ${toneMap[tone] || toneMap.slate}`}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-80">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-tight">{value}</div>
      <div className="mt-2 text-sm opacity-80">{hint}</div>
    </div>
  );
};

const ColHeaders = () => (
  <div className="hidden grid-cols-12 gap-3 border-b border-slate-100 px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400 lg:grid">
    <div className="col-span-1">ID</div>
    <div className="col-span-3">Paciente</div>
    <div className="col-span-2">Prioridade</div>
    <div className="col-span-2">Estado</div>
    <div className="col-span-1">Espera</div>
    <div className="col-span-1">Alerta</div>
    <div className="col-span-2">Médico</div>
  </div>
);

const SectionDivider = (props) => {
  const IconComponent = props.sectionIcon;
  return (
    <div
      className={`flex items-center justify-between border-y px-5 py-3 ${props.headerBg} ${props.headerText} ${props.borderColor}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]">
        <IconComponent className="h-4 w-4" />
        <span>{props.label}</span>
      </div>
      <span className="rounded-full bg-white/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
        {props.count} paciente{props.count === 1 ? "" : "s"}
      </span>
    </div>
  );
};

const PatientRow = ({ visit }) => (
  <>
    <div
      className={`hidden grid-cols-12 items-center gap-3 border-b border-slate-50 px-6 py-4 text-sm transition-colors hover:bg-slate-50/80 lg:grid ${
        visit.is_overdue ? "bg-red-50/40" : "bg-white"
      }`}
    >
      <div className="col-span-1 text-xs font-semibold text-slate-400">#{visit.clinical_code}</div>
      <div className="col-span-3 flex items-center gap-3">
        <Avatar name={visit.full_name} />
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-900">{visit.full_name}</div>
          <div className="mt-0.5 text-xs text-slate-500">{visit.sex || "Sexo não informado"}</div>
        </div>
      </div>
      <div className="col-span-2">
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${priorityBadgeStyle(visit.priority)}`}>
          {priorityLabel(visit.priority)}
        </span>
      </div>
      <div className="col-span-2 text-sm text-slate-600">{formatStatus(visit.status)}</div>
      <div className={`col-span-1 text-sm font-bold ${visit.is_overdue ? "text-red-600" : "text-slate-700"}`}>
        {formatWait(visit.wait_minutes)}
      </div>
      <div className="col-span-1">
        <AlertBadge isOverdue={visit.is_overdue} />
      </div>
      <div className="col-span-2 text-sm text-slate-600">
        {visit.doctor_full_name || visit.doctor_username || (
          <span className="text-slate-400">Não atribuído</span>
        )}
      </div>
    </div>

    <div className="border-b border-slate-100 p-4 lg:hidden">
      <div className={`rounded-3xl border p-4 ${visit.is_overdue ? "border-red-200 bg-red-50/50" : "border-slate-200 bg-white"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={visit.full_name} />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-900">{visit.full_name}</div>
              <div className="mt-1 text-xs text-slate-500">#{visit.clinical_code}</div>
            </div>
          </div>
          <AlertBadge isOverdue={visit.is_overdue} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Prioridade</div>
            <div className="mt-1">
              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${priorityBadgeStyle(visit.priority)}`}>
                {priorityLabel(visit.priority)}
              </span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Espera</div>
            <div className={`mt-1 font-bold ${visit.is_overdue ? "text-red-600" : "text-slate-800"}`}>
              {formatWait(visit.wait_minutes)}
            </div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Estado</div>
            <div className="mt-1 text-slate-700">{formatStatus(visit.status)}</div>
          </div>
          <div className="col-span-2">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Médico</div>
            <div className="mt-1 text-slate-700">
              {visit.doctor_full_name || visit.doctor_username || "Não atribuído"}
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

export default function Queue() {
  const navigate = useNavigate();
  const user = getUser();

  const [queue, setQueue] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("ALL");

  const loadQueue = async ({ silent = false } = {}) => {
    try {
      setError("");
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await api.getQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadQueue();
    const interval = setInterval(() => loadQueue({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, []);

  const logout = () => {
    clearAuth();
    window.location.replace("/login");
  };

  const filtered = useMemo(() => {
    return queue
      .filter((visit) => tab === "ALL" || visit.doctor_username === user?.username)
      .filter((visit) => {
        const term = search.trim().toLowerCase();
        if (!term) return true;
        return (
          String(visit?.full_name || "")
            .toLowerCase()
            .includes(term) || String(visit?.clinical_code || "").toLowerCase().includes(term)
        );
      });
  }, [queue, search, tab, user?.username]);

  const sections = useMemo(() => groupQueue(filtered), [filtered]);
  const summary = useMemo(() => {
    const urgent = filtered.filter((visit) => visit.priority === "URGENT").length;
    const overdue = filtered.filter((visit) => !!visit.is_overdue).length;
    const lab = filtered.filter((visit) => visit.status === "LAB_RETURN").length;

    return {
      total: filtered.length,
      urgent,
      overdue,
      lab,
    };
  }, [filtered]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,79,53,0.08),_transparent_28%),linear-gradient(180deg,#f4f7f5_0%,#edf2ef_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-[32px] border border-white/70 bg-white/88 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Monitor em tempo real
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Fila de Pacientes
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                Acompanhe prioridades, tempos de espera e distribuição clínica com uma vista mais clara e rápida para decisão.
              </p>
              <div className="mt-3 text-xs font-medium text-slate-500">
                {user ? `${user.full_name} · ${user.role}` : "Utilizador autenticado"}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative min-w-[240px] flex-1 sm:flex-none">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou código"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1 text-xs font-semibold text-slate-500">
                <button
                  onClick={() => setTab("ALL")}
                  className={`rounded-[14px] px-4 py-2 transition ${
                    tab === "ALL" ? "bg-slate-900 text-white shadow-sm" : "hover:bg-white"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setTab("MINE")}
                  className={`rounded-[14px] px-4 py-2 transition ${
                    tab === "MINE" ? "bg-slate-900 text-white shadow-sm" : "hover:bg-white"
                  }`}
                >
                  Meus pacientes
                </button>
              </div>

              {user?.role === "NURSE" && (
                <button
                  onClick={() => navigate("/triage")}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  Ir para triagem
                </button>
              )}

              <button
                onClick={() => loadQueue({ silent: true })}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                title="Atualizar fila"
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </button>

              <button
                onClick={logout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FiLogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Na fila"
              value={summary.total}
              hint="Pacientes visíveis com os filtros atuais"
              tone="slate"
            />
            <SummaryCard
              label="Urgentes"
              value={summary.urgent}
              hint="Casos com prioridade máxima"
              tone="red"
            />
            <SummaryCard
              label="Críticos"
              value={summary.overdue}
              hint="Pacientes acima do tempo esperado"
              tone="amber"
            />
            <SummaryCard
              label="Laboratório"
              value={summary.lab}
              hint="Retornos e exames pendentes na fila"
              tone="emerald"
            />
          </div>
        </div>

        {error ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <FiAlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-[32px] border border-slate-200/70 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.07)]">
          <ColHeaders />

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">A carregar fila de pacientes...</div>
          ) : sections.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Nenhum paciente encontrado com os filtros atuais.
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.key}>
                <SectionDivider
                  sectionIcon={section.Icon}
                  label={section.label}
                  headerBg={section.headerBg}
                  headerText={section.headerText}
                  borderColor={section.borderColor}
                  count={section.patients.length}
                />
                {section.patients.map((visit) => (
                  <PatientRow key={visit.id} visit={visit} />
                ))}
              </div>
            ))
          )}
        </div>

        <p className="mt-3 text-right text-[11px] text-slate-400">
          Atualização automática a cada 5 segundos
        </p>
      </div>
    </div>
  );
}
