import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import DoctorPage from "../DoctorPage";

const hcmGreen = "var(--hcm-primary-green)";
const hcmGreenSoft = "var(--hcm-primary-green-soft)";

function StatBellIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.73 21a2 2 0 0 1-3.46 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const getPatientName = (visit) => visit?.full_name || visit?.patient_name || "Paciente";

const getComplaint = (visit) =>
  visit?.chief_complaint ||
  visit?.complaint ||
  visit?.reason ||
  visit?.visit_reason ||
  visit?.triage_chief_complaint ||
  "Aguardando avaliacao";

const getAgeLabel = (visit) => {
  const age = visit?.age_years ?? visit?.patient_age_years ?? visit?.age;
  if (age == null || age === "") return "";
  return `${age} anos`;
};

const getQueueMinutes = (visit, fallbackIndex = 0) => {
  void fallbackIndex;
  const direct = Number(visit?.wait_minutes ?? visit?.waiting_minutes ?? visit?.queue_minutes);
  if (Number.isFinite(direct) && direct >= 0) return Math.round(direct);
  const rawDate = visit?.queued_at || visit?.arrival_time || visit?.created_at || visit?.date;
  const ts = rawDate ? new Date(rawDate).getTime() : NaN;
  if (Number.isFinite(ts)) return Math.max(0, Math.round((Date.now() - ts) / 60000));
  return null;
};

const formatTime = (value) => {
  if (!value) return "--:--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
};

const getVisitTime = (visit) =>
  visit?.scheduled_at ||
  visit?.appointment_time ||
  visit?.return_visit_date ||
  visit?.queued_at ||
  visit?.arrival_time ||
  visit?.created_at ||
  visit?.date;

const normalizeAgendaRows = (agenda) => {
  const assigned = Array.isArray(agenda?.assigned_today) ? agenda.assigned_today : [];
  const returns = Array.isArray(agenda?.returns_today) ? agenda.returns_today : [];
  return [...assigned, ...returns]
    .filter((row) => row && String(row?.status || "").toUpperCase() !== "CANCELLED")
    .sort((a, b) => {
      const aTs = new Date(getVisitTime(a)).getTime();
      const bTs = new Date(getVisitTime(b)).getTime();
      return (Number.isFinite(aTs) ? aTs : Number.MAX_SAFE_INTEGER) - (Number.isFinite(bTs) ? bTs : Number.MAX_SAFE_INTEGER);
    });
};

const getStatusChip = (visit, formatStatus) => {
  const status = String(visit?.status || "").toUpperCase();
  if (status.includes("CONSULT")) {
    return { label: "Em consulta", color: hcmGreen, bg: hcmGreenSoft };
  }
  if (status.includes("WAIT") || status.includes("QUEUE")) {
    return { label: "Em espera", color: "#f97316", bg: "#fff7ed" };
  }
  if (status.includes("TRIAGE")) {
    return { label: "Aguardando medico", color: "#ef4444", bg: "#fef2f2" };
  }
  return { label: formatStatus?.(visit?.status) || "Aguardando", color: "#64748b", bg: "#f1f5f9" };
};

const statCards = ({
  activeAlertCount,
  agendaTodayCount,
  myAssignedQueue,
  doctorLabWorklistRows,
  filteredQueue,
}) => {
  return [
    {
      label: "Urgentes",
      detail: "precisam de atencao",
      value: activeAlertCount,
      icon: StatBellIcon,
      color: "#ef4444",
      bg: "#fff1f2",
    },
    {
      label: "Consultas hoje",
      detail: "aguardando",
      value: agendaTodayCount,
      icon: Clock3,
      color: "#f97316",
      bg: "#fff7ed",
    },
    {
      label: "Pacientes hoje",
      detail: "atendidos",
      value: myAssignedQueue.length || filteredQueue.length,
      icon: Users,
      color: hcmGreen,
      bg: hcmGreenSoft,
    },
    {
      label: "Resultados",
      detail: "para revisar",
      value: doctorLabWorklistRows.length,
      icon: ClipboardList,
      color: "#3b82f6",
      bg: "#eff6ff",
    },
  ];
};

export function DoctorDashboardView({
  me,
  activeAlertCount,
  filteredQueue,
  agendaTodayCount,
  dashboardNextPatients,
  dashboardPriorityMeta,
  formatStatus,
  onOpenView,
  onOpenConsultation,
  dashboardAlertPreview,
  myAssignedQueue,
  doctorLabWorklistRows,
  agenda,
}) {
  const queueRows = (dashboardNextPatients.length ? dashboardNextPatients : filteredQueue).slice(0, 5);
  const agendaRows = normalizeAgendaRows(agenda).slice(0, 5);
  const recentRows = [
    ...queueRows.slice(0, 2).map((visit) => ({
      id: `queue-${visit.id}`,
      time: formatTime(visit?.queued_at || visit?.arrival_time || visit?.created_at || visit?.date),
      label: `${getPatientName(visit)} entrou na fila`,
      area: "Fila de espera",
      icon: UserPlus,
      color: "#ef4444",
    })),
    ...doctorLabWorklistRows.slice(0, 2).map((visit) => ({
      id: `lab-${visit.id}`,
      time: formatTime(visit?.updated_at || visit?.lab_ready_at || visit?.created_at || visit?.date),
      label: `${visit?.lab_exam_type || "Exame"} ${visit?.is_ready ? "pronto" : "em acompanhamento"}`,
      area: "Exames",
      icon: ClipboardList,
      color: "#3b82f6",
    })),
    ...dashboardAlertPreview.slice(0, 2).map((alert) => ({
      id: `alert-${alert.id}`,
      time: formatTime(alert?.created_at || alert?.date || alert?.updated_at),
      label: alert?.title || "Alerta ativo",
      area: "Alertas",
      icon: AlertTriangle,
      color: "#ef4444",
    })),
  ].slice(0, 4);
  void me;

  return (
    <div className="doctor-dashboard-redesign">
      <div className="doctor-dash-stats">
        {statCards({
          activeAlertCount,
          agendaTodayCount,
          myAssignedQueue,
          doctorLabWorklistRows,
          filteredQueue,
        }).map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="doctor-dash-stat-card">
              <span className="doctor-dash-stat-icon" style={{ background: card.bg, color: card.color }}>
                <Icon size={20} />
              </span>
              <div>
                <strong>{card.value}</strong>
                <span>{card.label}</span>
                <small>{card.detail}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="doctor-dash-grid">
        <div className="doctor-dash-left">
          <section className="doctor-dash-panel doctor-dash-main-panel">
            <div className="doctor-dash-panel-head">
              <div>
                <h2>Fila de Pacientes</h2>
                <p>Ordenada por prioridade</p>
              </div>
              <button type="button" onClick={() => onOpenView("waitingQueue")} className="doctor-dash-link">
                Ver fila completa
              </button>
            </div>
            <div className="doctor-dash-table">
              <div className="doctor-dash-table-row doctor-dash-table-head">
                <span>Prioridade</span>
                <span>Paciente</span>
                <span>Sintoma principal</span>
                <span>Tempo na fila</span>
                <span>Status</span>
              </div>
              {queueRows.map((visit, index) => {
                const priorityKey = String(visit?.priority || "").toUpperCase();
                const priorityMeta = dashboardPriorityMeta[priorityKey] || {
                  label: "Normal",
                  color: hcmGreen,
                  bg: hcmGreenSoft,
                };
                const status = getStatusChip(visit, formatStatus);
                const wait = getQueueMinutes(visit, index);
                return (
                  <button
                    type="button"
                    key={`queue-${visit.id}-${index}`}
                    className="doctor-dash-table-row doctor-dash-patient-row"
                    onClick={() => onOpenConsultation(visit)}
                  >
                    <span className="doctor-dash-priority" style={{ background: priorityMeta.color }}>
                      {index + 1}
                    </span>
                    <span>
                      <strong>{getPatientName(visit)}</strong>
                      <small>{getAgeLabel(visit) || `Visita #${visit.id}`}</small>
                    </span>
                    <span>{getComplaint(visit)}</span>
                    <span style={{ color: wait == null ? "#7d8597" : wait <= 15 ? "#ef4444" : wait <= 30 ? "#f97316" : hcmGreen }}>
                      {wait == null ? "-" : `${wait} min`}
                    </span>
                    <span className="doctor-dash-status" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </button>
                );
              })}
              {queueRows.length === 0 ? <div className="doctor-dash-empty">Sem pacientes na fila.</div> : null}
            </div>
          </section>

          <div className="doctor-dash-bottom-grid">
            <section className="doctor-dash-panel">
              <div className="doctor-dash-panel-head">
                <h2>Atividades recentes</h2>
              </div>
              <div className="doctor-dash-activity">
                {recentRows.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id}>
                      <Icon size={14} style={{ color: item.color }} />
                      <time>{item.time}</time>
                      <span>{item.label}</span>
                      <small>{item.area}</small>
                    </div>
                  );
                })}
                {recentRows.length === 0 ? <p className="doctor-dash-empty">Sem atividades recentes.</p> : null}
              </div>
            </section>

            <section className="doctor-dash-panel">
              <div className="doctor-dash-panel-head">
                <h2>Alertas</h2>
                <button type="button" onClick={() => onOpenView("activeAlerts")} className="doctor-dash-link">
                  Ver todos
                </button>
              </div>
              <div className="doctor-dash-alerts">
                {dashboardAlertPreview.slice(0, 2).map((alert, index) => (
                  <button type="button" key={`alert-${alert.id}-${index}`} onClick={() => onOpenView("activeAlerts")}>
                    <AlertTriangle size={15} />
                    <strong>{alert.title}</strong>
                    <span>{alert.detail}</span>
                  </button>
                ))}
                {dashboardAlertPreview.length === 0 ? <p className="doctor-dash-empty">Sem alertas ativos.</p> : null}
              </div>
            </section>
          </div>
        </div>

        <aside className="doctor-dash-side">
          <section className="doctor-dash-panel">
            <div className="doctor-dash-panel-head">
              <h2>Acoes rapidas</h2>
            </div>
            <div className="doctor-dash-actions">
              <button type="button" onClick={() => onOpenView("waitingQueue")}>
                <UserPlus size={15} />
                Novo Atendimento
              </button>
              <button type="button" onClick={() => onOpenView("agendaToday")}>
                <CalendarDays size={15} />
                Ver Agenda
              </button>
              <button type="button" onClick={() => onOpenView("clinicalHistory")}>
                <Search size={15} />
                Buscar Paciente
              </button>
              <button type="button" onClick={() => onOpenView("labOrdered")}>
                <FileText size={15} />
                Relatorios
              </button>
            </div>
          </section>

          <section className="doctor-dash-panel">
            <div className="doctor-dash-panel-head">
              <h2>Agenda de hoje</h2>
              <button type="button" onClick={() => onOpenView("agendaToday")} className="doctor-dash-link">
                Ver agenda
              </button>
            </div>
            <div className="doctor-dash-list">
              {agendaRows.map((visit, index) => {
                const status = getStatusChip(visit, formatStatus);
                return (
                <button key={`agenda-${visit.id}-${index}`} type="button" onClick={() => onOpenConsultation(visit)}>
                  <time>{formatTime(getVisitTime(visit))}</time>
                  <strong>{getPatientName(visit).split(" ").slice(0, 2).join(" ")}</strong>
                  <span style={{ color: status.color, background: status.bg }}>{status.label}</span>
                </button>
                );
              })}
              {agendaRows.length === 0 ? <p className="doctor-dash-empty">Sem compromissos hoje.</p> : null}
            </div>
          </section>

          <section className="doctor-dash-panel">
            <div className="doctor-dash-panel-head">
              <h2>Colegas online</h2>
            </div>
            <div className="doctor-dash-colleagues">
              <p className="doctor-dash-empty">Sem dados de colegas online disponíveis.</p>
            </div>
          </section>
        </aside>
      </div>

      <footer className="doctor-dash-footer">
        <span>Sistema de Gestao Hospitalar</span>
        <span>Versao 2.1.0</span>
      </footer>
    </div>
  );
}

export default function DoctorDashboard() {
  return <DoctorPage forcedView="dashboard" />;
}
