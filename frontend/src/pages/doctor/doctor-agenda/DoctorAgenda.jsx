import { useEffect, useMemo, useRef, useState } from "react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const STATUS_LABELS = {
  WAITING: "Aguardando triagem",
  IN_TRIAGE: "Em triagem",
  WAITING_DOCTOR: "Aguardando medico",
  IN_CONSULTATION: "Em consulta",
  FINISHED: "Finalizado",
  SCHEDULED: "Agendado",
};

const EVENT_STYLE = {
  Consulta: { bg: "#eaf6f0", border: "#0f6e54", color: "#0c5a44" },
  Retorno: { bg: "#eaf1fd", border: "#1d54c0", color: "#1d54c0" },
  default: { bg: "#fff7ed", border: "#b45309", color: "#b45309" },
};

const HOURS = Array.from({ length: 13 }, (_, index) => index + 7);
const ROW_HEIGHT = 52;

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const canOpen = (value) => toDate(value)?.getTime() <= Date.now();
const pad = (value) => String(value).padStart(2, "0");
const fmtTime = (hour, minute = 0) => `${pad(hour)}:${pad(minute)}`;

const extractTimeValue = (value) => {
  const match = String(value || "").match(/\b(\d{2}):(\d{2})\b/);
  if (!match) return null;
  return { hours: Number(match[1]), minutes: Number(match[2]) };
};

const formatLongDate = (date) =>
  `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]} de ${date.getFullYear()}`;

const formatDayTitle = (date) =>
  `${DAYS[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;

const normalizeAssigned = (rows) =>
  (rows || [])
    .map((row) => {
      const date = toDate(row.arrival_time);
      if (!date) return null;
      return {
        id: `a-${row.id}`,
        visit_id: row.id,
        patient_name: row.full_name || "-",
        clinical_code: row.clinical_code || "",
        date,
        status: row.status || "WAITING_DOCTOR",
        type: "Consulta",
      };
    })
    .filter(Boolean);

const normalizeReturns = (rows) =>
  (rows || [])
    .map((row) => {
      const date = toDate(row.return_visit_date);
      if (!date) return null;
      const arrival = toDate(row.arrival_time);
      const scheduled = extractTimeValue(row.follow_up_when);
      date.setHours(
        scheduled?.hours ?? arrival?.getHours() ?? 9,
        scheduled?.minutes ?? arrival?.getMinutes() ?? 0,
        0,
        0
      );
      return {
        id: `r-${row.id}`,
        visit_id: row.id,
        patient_name: row.full_name || "-",
        clinical_code: row.clinical_code || "",
        date,
        status: "SCHEDULED",
        type: "Retorno",
      };
    })
    .filter(Boolean);

function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function ReturnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

function EmptyState({ selectedDate }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[11px] border border-dashed border-[#e7e9ed] px-5 py-9 text-center">
      <div className="mb-3.5 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#eef0f3] text-[#9aa3b2]">
        <CalendarIcon />
      </div>
      <div className="text-[13.5px] font-semibold text-[#2b3140]">Nenhum compromisso neste dia</div>
      <div className="mt-1 text-[12.5px] text-[#9aa3b2]">
        A agenda de {formatDayTitle(selectedDate)} esta livre.
      </div>
    </div>
  );
}

function AgendaEvent({ appointment, onOpenVisit }) {
  const style = EVENT_STYLE[appointment.type] || EVENT_STYLE.default;
  const allowed = canOpen(appointment.date);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (allowed) onOpenVisit?.(appointment.visit_id, appointment);
      }}
      disabled={!allowed}
      className="w-full rounded-[8px] border px-2 py-1.5 text-left transition hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: `${style.border}55`,
        background: style.bg,
        color: style.color,
      }}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 flex-none rounded-full" style={{ background: style.border }} />
        <span className="truncate text-[11px] font-bold">
          {appointment.patient_name.split(" ").slice(0, 2).join(" ")}
        </span>
      </div>
      <div className="mt-0.5 truncate pl-3 text-[10px] text-[#6c7689]">
        {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}
        {appointment.clinical_code ? ` - ${appointment.clinical_code}` : ""}
        {appointment.type === "Retorno" ? " - Retorno" : ""}
      </div>
    </button>
  );
}

export default function DoctorAgenda({
  assignedToday = [],
  returnsToday = [],
  loading = false,
  onRefresh,
  onOpenVisit,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState("week");
  const calendarBodyRef = useRef(null);

  const today = new Date();
  const assignedAppointments = useMemo(() => normalizeAssigned(assignedToday), [assignedToday]);
  const returnAppointments = useMemo(() => normalizeReturns(returnsToday), [returnsToday]);
  const appointments = useMemo(
    () => [...assignedAppointments, ...returnAppointments].sort((a, b) => a.date - b.date),
    [assignedAppointments, returnAppointments]
  );

  const weekDays = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const last = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const days = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const weekAppointments = useMemo(
    () => appointments.filter((appointment) => weekDays.some((date) => sameDay(date, appointment.date))),
    [appointments, weekDays]
  );

  const dayAppointments = useMemo(
    () => appointments.filter((appointment) => sameDay(appointment.date, selectedDate)),
    [appointments, selectedDate]
  );

  const slotAppointments = (date, hour) =>
    appointments.filter((appointment) => sameDay(appointment.date, date) && appointment.date.getHours() === hour);

  const nowTop = useMemo(() => {
    if (!weekDays.some((date) => sameDay(date, today))) return null;
    const firstHour = HOURS[0];
    const lastHour = HOURS[HOURS.length - 1] + 1;
    const current = today.getHours() + today.getMinutes() / 60;
    if (current < firstHour || current > lastHour) return null;
    return (current - firstHour) * ROW_HEIGHT;
  }, [today, weekDays]);

  useEffect(() => {
    if (!calendarBodyRef.current || nowTop == null) return;
    calendarBodyRef.current.scrollTop = Math.max(0, nowTop - 150);
  }, [nowTop, view]);

  const navigate = (direction) => {
    const next = new Date(selectedDate);
    if (view === "day") next.setDate(next.getDate() + direction);
    else if (view === "week") next.setDate(next.getDate() + direction * 7);
    else next.setMonth(next.getMonth() + direction);
    setSelectedDate(next);
  };

  const rangeLabel = useMemo(() => {
    if (view === "month") return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    if (view === "day") return `${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()].slice(0, 3)}`;
    const start = weekDays[0];
    const end = weekDays[6];
    return `${start.getDate()} ${MONTHS[start.getMonth()].slice(0, 3)} - ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
  }, [selectedDate, view, weekDays]);

  const stats = [
    {
      label: "Consultas esta semana",
      value: weekAppointments.filter((appointment) => appointment.type === "Consulta").length,
      icon: <CalendarIcon />,
      tone: "green",
    },
    {
      label: "Retornos esta semana",
      value: weekAppointments.filter((appointment) => appointment.type === "Retorno").length,
      icon: <ReturnIcon />,
      tone: "blue",
    },
    {
      label: "No dia selecionado",
      value: dayAppointments.length,
      icon: <ClockIcon />,
      tone: "neutral",
    },
  ];

  return (
    <section className="overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white text-[14px] text-[#2b3140] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
      <header className="flex flex-wrap items-center justify-between gap-5 px-[26px] py-[22px]">
        <div>
          <h2 className="m-0 text-[19px] font-extrabold tracking-[-0.01em] text-[#161a23]">Minha Agenda</h2>
          <p className="mt-1 text-[12.5px] text-[#9aa3b2]">{formatLongDate(selectedDate)}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 rounded-[9px] border border-[#dde1e7] bg-white p-1">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[#6c7689] hover:bg-[#eef0f3] hover:text-[#161a23]"
              aria-label="Periodo anterior"
            >
              <ChevronIcon direction="left" />
            </button>
            <span className="whitespace-nowrap px-2 text-[13px] font-bold text-[#161a23]">{rangeLabel}</span>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[#6c7689] hover:bg-[#eef0f3] hover:text-[#161a23]"
              aria-label="Proximo periodo"
            >
              <ChevronIcon direction="right" />
            </button>
          </div>

          <div className="flex items-center gap-0.5 rounded-[9px] bg-[#eef0f3] p-[3px]">
            {[
              ["day", "Dia"],
              ["week", "Semana"],
              ["month", "Mes"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setView(value)}
                className={`rounded-[7px] px-3.5 py-[7px] text-[12.5px] font-semibold transition ${
                  view === value ? "bg-[#0f6e54] text-white" : "text-[#6c7689] hover:text-[#161a23]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-[9px] border-0 bg-[#0f6e54] px-4 py-[9px] text-[12.5px] font-bold text-white hover:bg-[#0c5a44] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="h-3.5 w-3.5">
              <RefreshIcon />
            </span>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-7 border-y border-[#eef0f3] bg-[#fafbfc] px-[26px] py-3.5">
        {stats.map((stat, index) => (
          <div key={stat.label} className="flex items-center gap-7">
            {index > 0 && <span className="hidden h-7 w-px bg-[#e7e9ed] sm:block" />}
            <div className="flex items-center gap-2.5">
              <span
                className={`flex h-[30px] w-[30px] items-center justify-center rounded-[8px] ${
                  stat.tone === "green"
                    ? "bg-[#eaf6f0] text-[#0c5a44]"
                    : stat.tone === "blue"
                      ? "bg-[#eaf1fd] text-[#1d54c0]"
                      : "bg-[#eef0f3] text-[#6c7689]"
                }`}
              >
                {stat.icon}
              </span>
              <span>
                <span className="block text-[16px] font-extrabold leading-none text-[#161a23]">{stat.value}</span>
                <span className="mt-0.5 block text-[11.5px] text-[#9aa3b2]">{stat.label}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {view === "week" && (
        <>
          <div
            className="grid border-b border-[#eef0f3]"
            style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}
          >
            <div />
            {weekDays.map((date) => {
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              const isToday = sameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`border-l border-[#eef0f3] px-1.5 py-3.5 text-center ${
                    isToday ? "bg-[#f3faf7]" : isWeekend ? "bg-[#fafbfc]" : "bg-white"
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa3b2]">
                    {DAYS[date.getDay()]}
                  </div>
                  <div
                    className={`mt-1.5 inline-flex h-[26px] w-[26px] items-center justify-center rounded-full text-[14px] font-bold ${
                      isToday
                        ? "bg-[#0f6e54] text-white"
                        : sameDay(date, selectedDate)
                          ? "text-[#0f6e54]"
                          : "text-[#2b3140]"
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </button>
              );
            })}
          </div>

          <div ref={calendarBodyRef} className="relative max-h-[430px] overflow-y-auto">
            {nowTop != null && (
              <div className="pointer-events-none absolute left-[60px] right-0 z-20 border-t-[1.5px] border-[#c0362c]" style={{ top: nowTop }}>
                <span className="absolute -left-[5px] -top-[5px] h-[9px] w-[9px] rounded-full bg-[#c0362c]" />
              </div>
            )}
            {HOURS.map((hour, rowIndex) => (
              <div
                key={hour}
                className="grid h-[52px]"
                style={{ gridTemplateColumns: "60px repeat(7, minmax(0, 1fr))" }}
              >
                <div className="relative -top-[7px] pr-2.5 pt-1.5 text-right text-[11px] text-[#9aa3b2]">
                  {fmtTime(hour)}
                </div>
                {weekDays.map((date) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday = sameDay(date, today);
                  const items = slotAppointments(date, hour);
                  return (
                    <div
                      key={`${date.toISOString()}-${hour}`}
                      className={`overflow-hidden border-l border-t border-[#eef0f3] p-1 ${
                        rowIndex === 0 ? "border-t-0" : ""
                      } ${isToday ? "bg-[#f3faf7]" : isWeekend ? "bg-[#fafbfc]" : "bg-white"}`}
                    >
                      <div className="space-y-1">
                        {items.slice(0, 2).map((appointment) => (
                          <AgendaEvent key={appointment.id} appointment={appointment} onOpenVisit={onOpenVisit} />
                        ))}
                        {items.length > 2 && (
                          <div className="rounded bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-[#6c7689]">
                            +{items.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {view === "day" && (
        <div ref={calendarBodyRef} className="relative max-h-[430px] overflow-y-auto">
          {HOURS.map((hour, index) => (
            <div
              key={hour}
              className="grid h-[52px]"
              style={{ gridTemplateColumns: "60px minmax(0, 1fr)" }}
            >
              <div className="relative -top-[7px] pr-2.5 pt-1.5 text-right text-[11px] text-[#9aa3b2]">
                {fmtTime(hour)}
              </div>
              <div className={`border-l border-t border-[#eef0f3] p-1.5 ${index === 0 ? "border-t-0" : ""}`}>
                <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                  {slotAppointments(selectedDate, hour).map((appointment) => (
                    <AgendaEvent key={appointment.id} appointment={appointment} onOpenVisit={onOpenVisit} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "month" && (
        <>
          <div className="grid grid-cols-7 border-b border-[#eef0f3] bg-[#fafbfc]">
            {DAYS.map((day) => (
              <div key={day} className="py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#9aa3b2]">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthDays.map((date, index) => {
              const dayItems = appointments.filter((appointment) => sameDay(appointment.date, date));
              const isOtherMonth = date.getMonth() !== selectedDate.getMonth();
              const isToday = sameDay(date, today);
              const isSelected = sameDay(date, selectedDate);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[92px] border-b border-r border-[#eef0f3] p-2 text-left last:border-r-0 hover:bg-[#f8faf9] ${
                    isSelected ? "bg-[#f3faf7]" : isOtherMonth ? "bg-[#fafbfc] opacity-60" : "bg-white"
                  }`}
                  style={{ borderRightWidth: (index + 1) % 7 === 0 ? 0 : 1 }}
                >
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${
                      isToday ? "bg-[#0f6e54] text-white" : "text-[#2b3140]"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  <div className="mt-1.5 space-y-1">
                    {dayItems.slice(0, 2).map((appointment) => {
                      const style = EVENT_STYLE[appointment.type] || EVENT_STYLE.default;
                      return (
                        <div
                          key={appointment.id}
                          className="truncate rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                          style={{
                            borderColor: `${style.border}55`,
                            background: style.bg,
                            color: style.color,
                          }}
                        >
                          {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}{" "}
                          {appointment.patient_name.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayItems.length > 2 && (
                      <div className="px-1 text-[10px] font-semibold text-[#9aa3b2]">+{dayItems.length - 2}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="border-t border-[#eef0f3] px-[26px] py-[22px]">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-[15px] font-bold text-[#161a23]">{formatDayTitle(selectedDate)}</h3>
          <span className="text-[12px] text-[#9aa3b2]">
            {dayAppointments.length} compromisso{dayAppointments.length !== 1 ? "s" : ""}
          </span>
        </div>

        {dayAppointments.length === 0 ? (
          <EmptyState selectedDate={selectedDate} />
        ) : (
          <div className="overflow-hidden rounded-[11px] border border-[#e7e9ed]">
            <table className="w-full min-w-[680px] border-collapse">
              <thead>
                <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
                  {["Hora", "Paciente", "Tipo", "Estado", "Acao"].map((heading, index) => (
                    <th
                      key={heading}
                      className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#39405a] ${
                        index === 4 ? "text-right" : ""
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayAppointments.map((appointment) => {
                  const allowed = canOpen(appointment.date);
                  const style = EVENT_STYLE[appointment.type] || EVENT_STYLE.default;
                  return (
                    <tr key={appointment.id} className="border-b border-[#eef0f3] last:border-b-0">
                      <td className="px-4 py-3 text-[13px] font-bold tabular-nums text-[#161a23]">
                        {fmtTime(appointment.date.getHours(), appointment.date.getMinutes())}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-bold text-[#161a23]">{appointment.patient_name}</div>
                        <div className="mt-0.5 text-[11.5px] text-[#9aa3b2]">{appointment.clinical_code || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#6c7689]">{appointment.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-bold"
                          style={{ background: style.bg, color: style.color }}
                        >
                          {STATUS_LABELS[appointment.status] || appointment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            if (allowed) onOpenVisit?.(appointment.visit_id, appointment);
                          }}
                          disabled={!allowed}
                          className="rounded-[8px] border border-[#dde1e7] bg-white px-3.5 py-2 text-[12px] font-semibold text-[#3a4150] hover:bg-[#fafbfc] disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
