import NursePage from "../NursePage";
import AppButton from "../../../components/shared/ui/AppButton";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  ListFilter,
  Plus,
  RefreshCw,
  Stethoscope,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

function Icon({ name, size = 20 }) {
  const icons = {
    plus: Plus,
    queue: ListFilter,
    refresh: RefreshCw,
    users: UsersRound,
    clipboard: ClipboardList,
    doctor: Stethoscope,
    clock: Clock3,
    calendar: CalendarDays,
    chart: BarChart3,
    chevron: ChevronRight,
    check: CheckCircle2,
    patient: UserRoundCheck,
  };
  const LucideIcon = icons[name] || ClipboardList;
  return <LucideIcon size={size} strokeWidth={2} aria-hidden="true" />;
}

function Card({ className = "", children, style }) {
  return (
    <article className={`hcm-panel ${className}`} style={style}>
      {children}
    </article>
  );
}

function sparkCoordinates(values = []) {
  const cleanValues = values
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const series = cleanValues.length >= 2 ? cleanValues : [0, 2, 1, 4, 3, 5, 6];
  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const xStep = series.length > 1 ? 60 / (series.length - 1) : 60;

  return series.map((value, index) => {
    const x = Number((index * xStep).toFixed(2));
    const y = Number((34 - ((value - min) / range) * 28).toFixed(2));
    return [x, y];
  });
}

function Spark({ tone = "green", values = [] }) {
  const stroke = tone === "blue" ? "#2388ff" : tone === "purple" ? "#8b5cf6" : "#1d9e75";
  const gradientId = `sparkFade-${tone}`;
  const coordinates = sparkCoordinates(values);
  const linePath = coordinates
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
  const fillPath = `${linePath} L 60 40 L 0 40 Z`;
  return (
    <svg className="hcm-spark" viewBox="0 0 60 40" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="58%" stopColor={stroke} stopOpacity="0.12" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="spark-fill"
        d={fillPath}
        fill={`url(#${gradientId})`}
      />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const priorityAliases = {
  urgent: ["urgent", "high", "emergency", "red", "urgente"],
  less: ["less", "medium", "orange", "pouco", "semi"],
  non: ["non", "low", "green", "nao", "não", "normal"],
};

function priorityTone(priority = "") {
  const value = String(priority).toLowerCase();
  if (priorityAliases.urgent.some((item) => value.includes(item))) return "red";
  if (priorityAliases.less.some((item) => value.includes(item))) return "orange";
  return "green";
}

function patientName(visit) {
  return visit.full_name || visit.patient_name || visit.patient?.full_name || "Paciente";
}

export function NurseDashboardView({
  activeView,
  me,
  onRefresh,
  loadingQueue,
  totalQueue,
  urgentCount,
  weeklyData = [],
  availableDoctors,
  doctors,
  busyDoctors,
  inTriageCount,
  recentQueueItems,
  priorities,
  onOpenView,
  queue,
}) {
  void me;
  void activeView;
  const lessUrgentCount = queue.filter((visit) => priorityTone(visit.priority) === "orange").length;
  const nonUrgentCount = Math.max(0, totalQueue - urgentCount - lessUrgentCount);
  const avgWait =
    queue.length > 0
      ? Math.round(
          queue.reduce((sum, visit) => sum + Number(visit.wait_minutes || 0), 0) / queue.length
        )
      : 0;
  const displayRows = recentQueueItems.slice(0, 5);
  const serviceDoctors = [
    ...availableDoctors.map((doctor) => ({ ...doctor, status: "Livre" })),
    ...busyDoctors.map((doctor) => ({ ...doctor, status: "Em consulta" })),
  ].slice(0, 4);
  const fallbackDoctors = doctors.slice(0, 4).map((doctor, index) => ({
    ...doctor,
    status: index % 3 === 1 ? "Em consulta" : "Livre",
  }));
  const doctorRows = serviceDoctors.length ? serviceDoctors : fallbackDoctors;
  const priorityStats = priorities.map((priority) => {
    const count = queue.filter((visit) => visit.priority === priority.value).length;
    const pct = totalQueue > 0 ? Math.round((count / totalQueue) * 100) : 0;
    return { ...priority, count, pct, tone: priorityTone(priority.value || priority.label) };
  });
  const servicePanelHeight = displayRows.length <= 1 ? 166 : 258;
  const fallbackActivityTimes = ["10:42", "10:39", "10:35", "10:31"];
  const patientSpark = Array.isArray(weeklyData) && weeklyData.length ? weeklyData : [3, 5, 7, 6, 9, 10, totalQueue || 12];
  const triageSpark = [0, inTriageCount, inTriageCount + 1, inTriageCount, inTriageCount + 2, inTriageCount + 1, inTriageCount + 3];
  const doctorsSpark = [availableDoctors.length, availableDoctors.length + 1, availableDoctors.length, doctors.length || 1, availableDoctors.length + 2, availableDoctors.length + 1, availableDoctors.length];
  const waitSpark = queue.length
    ? queue.slice(-7).map((visit) => Number(visit.wait_minutes || 0))
    : [0, avgWait || 8, avgWait || 10, (avgWait || 12) + 2, avgWait || 11, (avgWait || 12) + 4, avgWait || 14];
  const metricCards = [
    {
      label: "Pacientes Hoje",
      value: totalQueue,
      hint: "Total de atendimentos",
      icon: "users",
      tone: "green",
      spark: patientSpark,
    },
    {
      label: "Em Triagem",
      value: inTriageCount,
      hint: "Neste momento",
      icon: "clipboard",
      tone: "blue",
      spark: triageSpark,
    },
    {
      label: "M\u00e9dicos Dispon\u00edveis",
      value: `${availableDoctors.length} / ${doctors.length || 0}`,
      hint: "M\u00e9dicos no servi\u00e7o",
      icon: "doctor",
      tone: "green",
      spark: doctorsSpark,
    },
    {
      label: "Tempo M\u00e9dio de Espera",
      value: `${avgWait} min`,
      hint: "Tempo estimado",
      icon: "clock",
      tone: "purple",
      spark: waitSpark,
    },
  ];

  return (
    <div className="hcm-dashboard">
      <style>{`
        .hcm-dashboard { --line: #e3e8ef; --line-strong: #d5dde7; --text: #101827; --muted: #667085; --green: #0f6e56; --red: #ff333d; --orange: #ff7a00; --blue: #2388ff; --purple: #8b5cf6; display: grid; gap: 12px; color: var(--text); align-content: start; }
        .hcm-dashboard * { letter-spacing: 0 !important; }
        .hcm-panel { background: #fff; border: 1px solid var(--line); border-radius: 13px; box-shadow: 0 5px 14px rgba(16,24,39,0.045); transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease; min-width: 0; box-sizing: border-box; }
        .hcm-panel:hover { transform: translateY(-1px); border-color: #dbe3ec; box-shadow: 0 9px 20px rgba(16,24,39,0.07); }
        .priority-strip { height: 90px !important; min-height: 90px !important; max-height: 90px !important; padding: 0 16px; display: grid; grid-template-columns: minmax(170px, 1fr) minmax(194px, 1.06fr) minmax(194px, 1.1fr) auto; align-items: center; gap: 18px; overflow: hidden; box-sizing: border-box; }
        .priority-item { display: flex; align-items: center; gap: 14px; min-width: 0; }
        .priority-dot { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
        .priority-dot::after { content: ""; width: 16px; height: 16px; border-radius: 50%; }
        .priority-red { color: var(--red); } .priority-red .priority-dot { background: #ffe9eb; }
        .priority-orange { color: var(--orange); } .priority-orange .priority-dot { background: #fff1e3; }
        .priority-green { color: var(--green); } .priority-green .priority-dot { background: #e8f7ef; }
        .priority-red .priority-dot::after { background: #ff333d; }
        .priority-orange .priority-dot::after { background: #ff7a00; }
        .priority-green .priority-dot::after { background: #0b8f4f; }
        .priority-item strong { color: var(--text); font-size: 34px; line-height: 1; font-weight: 500; }
        .priority-item p { margin: 0; display: grid; gap: 6px; color: var(--text); min-width: 0; }
        .priority-item b { font-size: 13px; font-weight: 800; white-space: nowrap; } .priority-item span { color: var(--muted); font-size: 12px; line-height: 1.35; max-width: 128px; }
        .strip-actions { display: flex; justify-content: flex-end; align-items: center; gap: 10px; min-width: 304px; }
        .hcm-btn { height: 40px; min-width: 112px; padding: 0 17px; border-radius: 7px; border: 1px solid var(--line-strong); display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: #fff; color: var(--text); font-weight: 600; white-space: nowrap; font-size: 12px; box-shadow: none !important; }
        .hcm-btn svg { width: 17px !important; height: 17px !important; }
        .hcm-btn.primary { min-width: 132px; background: var(--hcm-primary-green); border-color: var(--hcm-primary-green); color: #fff; box-shadow: none !important; }
        .hcm-btn.primary:hover { background: var(--hcm-primary-green-hover); border-color: var(--hcm-primary-green-hover); }
        .hcm-btn.secondary { min-width: 112px; }
        .hcm-btn.square { width: 44px; min-width: 44px; padding: 0; }
        .metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; align-items: stretch; }
        .stat-card { position: relative; height: 108px !important; min-height: 108px !important; max-height: 108px !important; padding: 0 !important; display: block !important; overflow: hidden; box-sizing: border-box; border-radius: 10px; border-color: #e2e8f0; box-shadow: 0 9px 22px rgba(16,24,39,0.075); }
        .stat-card__main { position: absolute; left: 20px; top: 50%; right: 66px; transform: translateY(-50%); display: flex; align-items: center; gap: 14px; min-width: 0; }
        .stat-card__icon { width: 52px; height: 52px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 52px; }
        .stat-card__icon svg { width: 25px !important; height: 25px !important; }
        .stat-card__icon.green { background: #e1f5ee; color: var(--green); }
        .stat-card__icon.blue { background: #eaf4ff; color: var(--blue); }
        .stat-card__icon.purple { background: #f1eafe; color: var(--purple); }
        .stat-card__copy { min-width: 0; flex: 1 1 auto; }
        .stat-card__label { display: block; color: #667085; font-size: 11px !important; line-height: 13px !important; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .stat-card__value { display: block; margin-top: 6px; color: var(--text); font-size: 24px !important; line-height: 1 !important; font-weight: 500; white-space: nowrap; font-variant-numeric: tabular-nums; }
        .stat-card__hint { display: block; margin-top: 7px; color: #69758a; font-size: 11px !important; line-height: 13px !important; font-weight: 400; white-space: nowrap; overflow: visible; text-overflow: clip; }
        .stat-card .hcm-spark { position: absolute; right: 18px; top: 50%; transform: translateY(-39%); width: 43px; height: 31px; pointer-events: none; overflow: visible; }
        .hcm-spark .spark-fill { opacity: 1; }
        .content-grid { display: grid; grid-template-columns: minmax(0, 1.42fr) minmax(260px, 1fr); gap: 12px; align-items: stretch; }
        .bottom-grid { display: grid; grid-template-columns: minmax(220px, 1fr) minmax(240px, 1fr) minmax(220px, 1fr); gap: 12px; align-items: start; }
        .queue-card, .doctors-card { min-height: 0; padding: 12px 14px 13px; display: flex; flex-direction: column; overflow: hidden; }
        .queue-card.queue-card-single { min-height: 0; }
        .bottom-grid .hcm-panel { height: 164px; padding: 12px 14px 13px; overflow: hidden; }
        .panel-head { margin-bottom: 8px; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .panel-head h2, .hcm-panel h2 { margin: 0; font-size: 15px !important; line-height: 1.2; font-weight: 600 !important; }
        .panel-head button, .center-link { border: 0; background: transparent; color: #007f42; font-size: 12px; font-weight: 600; text-decoration: none; box-shadow: none !important; }
        .doctors-card .center-link { align-self: center; margin-top: 12px; padding: 2px 8px 0; line-height: 1.2; }
        .queue-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .queue-table th { height: 31px; padding: 6px 8px; color: #59647a; background: #fafbfc; border-top: 1px solid #edf0f3; border-bottom: 1px solid #edf0f3; font-size: 10px; font-weight: 800; text-transform: uppercase; text-align: left; }
        .queue-table td { height: 41px; padding: 6px 8px; border-bottom: 1px solid #edf0f3; vertical-align: middle; font-size: 12px; }
        .queue-card-single .queue-table td { height: 52px; }
        .queue-table tbody tr:last-child td { border-bottom: 0; }
        .queue-table b, .queue-table small { display: block; } .queue-table b { font-weight: 600; } .queue-table small { color: #69758a; font-size: 11px; margin-top: 4px; }
        .queue-table th:nth-child(1), .queue-table td:nth-child(1) { width: 86px; }
        .queue-table th:nth-child(2), .queue-table td:nth-child(2) { width: 128px; }
        .queue-table th:nth-child(3), .queue-table td:nth-child(3) { width: 160px; }
        .queue-table th:nth-child(5), .queue-table td:nth-child(5) { width: 118px; }
        .queue-table th:nth-child(6), .queue-table td:nth-child(6) { width: 24px; }
        .queue-table td:nth-child(4) { line-height: 1.28; }
        .symptom-text { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; max-width: 100%; }
        .pos, .wait { font-weight: 600; } .tone-red { color: var(--red); } .tone-orange { color: var(--orange); } .tone-green { color: var(--green); }
        .tag { display: inline-flex; align-items: center; gap: 8px; min-height: 22px; padding: 0 10px; border-radius: 7px; font-size: 11px; font-weight: 600; white-space: nowrap; }
        .tag::before { content: ""; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
        .tag.red { background: #ffe9eb; color: var(--red); } .tag.orange { background: #fff1e3; color: var(--orange); } .tag.green { background: #e8f7ef; color: var(--green); }
        .doctor-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; flex: 0 0 auto; }
        .doctor-list li { min-height: 58px; padding: 8px 12px; display: grid; grid-template-columns: 13px minmax(0, 1fr) auto; align-items: center; gap: 12px; border: 1px solid #edf0f3; border-radius: 8px; background: #fff; }
        .doctor-list p { margin: 0; display: grid; gap: 4px; } .doctor-list b { font-size: 13px; font-weight: 600; } .doctor-list span { color: #69758a; font-size: 12px; }
        .status-dot { width: 9px; height: 9px; border-radius: 50%; }
        .status-pill { min-width: 86px; min-height: 28px; padding: 5px 10px; border-radius: 7px; display: grid; place-items: center; font-size: 11px; text-align: center; font-weight: 600; }
        .status-free { background: #e8f7ef; color: var(--green); } .status-busy { background: #ffe9eb; color: var(--red); }
        .compact-empty { min-height: 72px; border: 1px dashed #dbe2ea; border-radius: 8px; display: grid; place-items: center; padding: 10px 12px; color: #69758a; background: #fbfcfd; text-align: center; }
        .compact-empty strong { display: block; color: #101827; font-size: 12px; font-weight: 600; margin-bottom: 4px; }
        .compact-empty span { font-size: 12px; line-height: 1.4; }
        .distribution { margin-top: 11px; display: grid; grid-template-columns: 84px minmax(0, 1fr); align-items: center; gap: 26px; height: 98px; }
        .donut { width: 82px; height: 82px; border-radius: 50%; background: conic-gradient(var(--red) 0 20%, var(--orange) 20% 55%, #1bbf6b 55% 100%); position: relative; flex: 0 0 auto; }
        .donut::after { content: ""; position: absolute; inset: 11px; border-radius: 50%; background: #fff; }
        .legend { list-style: none; padding: 0; margin: 0; display: grid; gap: 13px; }
        .legend li { display: grid; grid-template-columns: 10px minmax(0, 1fr) minmax(58px, auto); align-items: center; gap: 14px; font-size: 12px; font-weight: 500; }
        .legend li b { font-size: 12px; font-weight: 600; color: var(--text); justify-self: end; text-align: right; white-space: nowrap; }
        .legend li small { color: #69758a; font-weight: 500; }
        .activity { list-style: none; margin: 11px 0 0; padding: 0; }
        .activity li { height: 27px; display: grid; grid-template-columns: 42px 24px minmax(0, 1fr); align-items: center; gap: 10px; border-bottom: 1px solid #edf0f3; }
        .activity li:last-child { border-bottom: 0; } .activity time { color: #526078; font-size: 12px; } .activity p { margin: 0; color: #667085; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .activity-icon { width: 21px; height: 21px; border-radius: 7px; display: grid; place-items: center; }
        .quick-actions { margin-top: 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        .quick-actions button { height: 44px; padding: 0 11px; border: 1px solid var(--line); border-radius: 7px; background: #fff; display: flex; align-items: center; gap: 9px; color: var(--text); font-size: 12px; line-height: 1.2; font-weight: 600; text-align: left; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; box-shadow: none !important; }
        .quick-actions span { width: 28px; height: 28px; border-radius: 7px; display: grid; place-items: center; flex: 0 0 auto; }
        @media (max-width: 1180px) { .priority-strip, .metrics, .content-grid, .bottom-grid { grid-template-columns: 1fr; height: auto; max-height: none !important; } .stat-card { height: 108px !important; max-height: 108px !important; } .queue-card, .doctors-card, .bottom-grid .hcm-panel { height: auto; } .strip-actions { justify-content: flex-start; flex-wrap: wrap; min-width: 0; } }
        @media (max-width: 720px) { .queue-card { overflow-x: auto; } .queue-table { min-width: 720px; } .quick-actions, .distribution { grid-template-columns: 1fr; height: auto; } }
      `}</style>

      <Card className="priority-strip">
        <div className="priority-item priority-red">
          <span className="priority-dot" />
          <strong>{urgentCount}</strong>
          <p>
            <b>Urgentes</b>
            <span>necessitam atenção</span>
          </p>
        </div>
        <div className="priority-item priority-orange">
          <span className="priority-dot" />
          <strong>{lessUrgentCount}</strong>
          <p>
            <b>Pouco Urgentes</b>
            <span>em espera</span>
          </p>
        </div>
        <div className="priority-item priority-green">
          <span className="priority-dot" />
          <strong>{nonUrgentCount}</strong>
          <p>
            <b>Não Urgentes</b>
            <span>em espera</span>
          </p>
        </div>
        <div className="strip-actions">
          <AppButton
            className="hcm-btn primary"
            type="button"
            variant="primary"
            onClick={() => onOpenView("newTriage")}
            style={{ minWidth: 132 }}
          >
            <Icon name="plus" size={18} /> Nova Triagem
          </AppButton>
          <AppButton
            className="hcm-btn secondary"
            type="button"
            variant="secondary"
            onClick={() => onOpenView("queue")}
            style={{ minWidth: 112 }}
          >
            <Icon name="queue" size={18} /> Ver Fila
          </AppButton>
          <AppButton
            className="hcm-btn square"
            type="button"
            variant="secondary"
            iconOnly
            onClick={onRefresh}
            disabled={loadingQueue}
          >
            <Icon name="refresh" size={18} />
          </AppButton>
        </div>
      </Card>

      <section className="metrics">
        {metricCards.map((metric) => (
          <Card className="stat-card" key={metric.label}>
            <div className="stat-card__main">
              <span className={`stat-card__icon ${metric.tone}`}>
                <Icon name={metric.icon} size={26} />
              </span>
              <div className="stat-card__copy">
                <span className="stat-card__label">{metric.label}</span>
                <strong className="stat-card__value">{metric.value}</strong>
                <span className="stat-card__hint">{metric.hint}</span>
              </div>
            </div>
            <Spark tone={metric.tone} values={metric.spark} />
          </Card>
        ))}
      </section>

      <section className="content-grid">
        <Card
          className={`queue-card ${displayRows.length <= 1 ? "queue-card-single" : ""}`}
          style={{ height: servicePanelHeight, minHeight: servicePanelHeight }}
        >
          <div className="panel-head">
            <h2>Fila Atual</h2>
            <button type="button" onClick={() => onOpenView("queue")}>Ver toda a fila &rarr;</button>
          </div>
          <table className="queue-table">
            <thead>
              <tr>
                <th>Posição</th>
                <th>Paciente</th>
                <th>Prioridade</th>
                <th>Sintoma Principal</th>
                <th>Tempo na Fila</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "8px 0 0", borderBottom: 0 }}>
                    <div className="compact-empty">
                      <div>
                        <strong>Fila sem pacientes ativos</strong>
                        <span>Novas triagens aparecerão aqui assim que forem registradas.</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRows.map((visit, index) => {
                  const tone = priorityTone(visit.priority);
                  const priorityConfig = priorities.find((item) => item.value === visit.priority);
                  return (
                    <tr key={visit.id || index}>
                      <td className={`pos tone-${tone}`}>#{String(index + 1).padStart(3, "0")}</td>
                      <td>
                        <b>{patientName(visit)}</b>
                        <small>{visit.age_years ? `${visit.age_years} anos` : visit.clinical_code || ""}</small>
                      </td>
                      <td><span className={`tag ${tone}`}>{priorityConfig?.label || visit.priority || "Não Urgente"}</span></td>
                      <td>
                        <span className="symptom-text">{visit.chief_complaint || visit.reason || "-"}</span>
                      </td>
                      <td className={`wait tone-${tone}`}>{visit.wait_minutes ?? 0} min</td>
                      <td><Icon name="chevron" size={16} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>

        <Card className="doctors-card" style={{ height: servicePanelHeight, minHeight: servicePanelHeight }}>
          <div className="panel-head">
            <h2>Médicos de Serviço</h2>
            <button type="button" onClick={() => onOpenView("doctors")}>Ver todos &rarr;</button>
          </div>
          <ul className="doctor-list">
            {doctorRows.map((doctor, index) => {
              const busy = String(doctor.status).toLowerCase().includes("consulta");
              return (
                <li key={doctor.id || index}>
                  <i className="status-dot" style={{ background: busy ? "#ff333d" : "#0b8f4f" }} />
                  <p>
                    <b>{doctor.full_name || doctor.name || `Dr. ${index + 1}`}</b>
                    <span>{doctor.specialty || doctor.speciality || "Clínico Geral"}</span>
                  </p>
                  <strong className={`status-pill ${busy ? "status-busy" : "status-free"}`}>
                    {busy ? "Em consulta" : "Livre"}
                  </strong>
                </li>
              );
            })}
          </ul>
          {doctorRows.length === 0 && (
            <div className="compact-empty">
              <div>
                <strong>Sem médicos em serviço</strong>
                <span>Atualize a escala para mostrar disponibilidade em tempo real.</span>
              </div>
            </div>
          )}
          <button className="center-link" type="button" onClick={() => onOpenView("doctors")}>Ver escala completa &rarr;</button>
        </Card>
      </section>

      <section className="bottom-grid">
        <Card>
          <h2>Distribuição por Prioridade</h2>
          <div className="distribution">
            <div className="donut" />
            <ul className="legend">
              {priorityStats.slice(0, 3).map((item) => (
                <li key={item.value}>
                  <i className="status-dot" style={{ background: item.color || (item.tone === "red" ? "#ff333d" : item.tone === "orange" ? "#ff7a00" : "#0b8f4f") }} />
                  <span>{item.label}</span>
                  <b>{item.pct}% <small>({item.count})</small></b>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <h2>Atividade Recente</h2>
          <ul className="activity">
            {displayRows.slice(0, 4).map((visit, index) => (
              <li key={visit.id || index}>
                <time>
                  {visit.created_at
                    ? new Date(visit.created_at).toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : fallbackActivityTimes[index]}
                </time>
                <span className="activity-icon" style={{ color: index === 1 ? "#8b5cf6" : index === 2 ? "#2388ff" : "#0b8f4f" }}>
                  <Icon name={index === 1 ? "calendar" : index === 2 ? "clipboard" : "check"} size={14} />
                </span>
                <p>{patientName(visit)} adicionado à triagem</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2>Ações Rápidas</h2>
          <div className="quick-actions">
            <button type="button" onClick={() => onOpenView("newTriage")}><span style={{ color: "#0b8f4f", background: "#e8f7ef" }}><Icon name="users" size={18} /></span>Novo Paciente</button>
            <button type="button" onClick={() => onOpenView("queue")}><span style={{ color: "#8b5cf6", background: "#f1eafe" }}><Icon name="clipboard" size={18} /></span>Ver Fila</button>
            <button type="button" onClick={() => onOpenView("roomsAvailable")}><span style={{ color: "#0b8f4f", background: "#e8f7ef" }}><Icon name="calendar" size={18} /></span>Agendar Consulta</button>
            <button type="button" onClick={() => onOpenView("dayStats")}><span style={{ color: "#2388ff", background: "#eaf4ff" }}><Icon name="chart" size={18} /></span>Relatórios</button>
          </div>
        </Card>
      </section>
    </div>
  );
}

export default function NurseDashboard() {
  return <NursePage forcedView="home" />;
}
