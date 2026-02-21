import { useMemo, useState } from "react";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const STATUS_LABELS = {
  WAITING: "Aguardando Triagem",
  IN_TRIAGE: "Em Triagem",
  WAITING_DOCTOR: "Aguardando Médico",
  IN_CONSULTATION: "Em Consulta",
  FINISHED: "Finalizado",
  SCHEDULED: "Agendado",
};

const STATUS_COLORS = {
  WAITING: { bg: "#fff7ed", border: "#fb923c", text: "#c2410c" },
  IN_TRIAGE: { bg: "#fef9c3", border: "#facc15", text: "#854d0e" },
  WAITING_DOCTOR: { bg: "#fef2f2", border: "#f87171", text: "#b91c1c" },
  IN_CONSULTATION: { bg: "#eff6ff", border: "#60a5fa", text: "#1d4ed8" },
  FINISHED: { bg: "#f0fdf4", border: "#4ade80", text: "#15803d" },
  SCHEDULED: { bg: "#f0fdf4", border: "#34d399", text: "#065f46" },
};

const pad = (n) => String(n).padStart(2, "0");
const formatTime = (h, m = 0) => `${pad(h)}:${pad(m)}`;

const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const isFutureDay = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() > today.getTime();
};

const toDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeAssigned = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((v) => {
      const date = toDate(v.arrival_time);
      if (!date) return null;
      return {
        id: v.id,
        visit_id: v.id,
        patient_name: v.full_name || "-",
        clinical_code: v.clinical_code || "",
        date,
        duration: 30,
        status: v.status || "WAITING_DOCTOR",
        type: "Consulta",
        notes: "",
      };
    })
    .filter(Boolean);

const normalizeReturns = (rows) =>
  (Array.isArray(rows) ? rows : [])
    .map((v) => {
      const baseDate = toDate(v.return_visit_date);
      if (!baseDate) return null;
      const arrival = toDate(v.arrival_time);
      if (arrival) {
        baseDate.setHours(arrival.getHours(), 0, 0, 0);
      } else {
        baseDate.setHours(9, 0, 0, 0);
      }
      return {
        id: `r-${v.id}`,
        visit_id: v.id,
        patient_name: v.full_name || "-",
        clinical_code: v.clinical_code || "",
        date: baseDate,
        duration: 30,
        status: "SCHEDULED",
        type: "Retorno",
        notes: v.return_visit_reason || "",
      };
    })
    .filter(Boolean);

export default function AgendaView({
  assignedToday = [],
  returnsToday = [],
  loading = false,
  onRefresh,
  onOpenVisit,
  onScheduleReturn,
}) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calView, setCalView] = useState("week");
  const [rangeFilter, setRangeFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [clickedSlot, setClickedSlot] = useState(null);
  const [scheduleDraft, setScheduleDraft] = useState({
    visit_id: "",
    return_visit_reason: "",
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleNotice, setScheduleNotice] = useState("");

  const assignedAppts = useMemo(() => normalizeAssigned(assignedToday), [assignedToday]);
  const returnAppts = useMemo(() => normalizeReturns(returnsToday), [returnsToday]);
  const appointments = useMemo(
    () => [...assignedAppts, ...returnAppts].sort((a, b) => a.date - b.date),
    [assignedAppts, returnAppts]
  );

  const filteredAppointments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return appointments.filter((a) => {
      if (rangeFilter === "ALL") return true;
      const ad = new Date(a.date);
      ad.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((ad.getTime() - today.getTime()) / 86400000);
      if (rangeFilter === "TODAY") return diffDays === 0;
      if (rangeFilter === "NEXT_7") return diffDays >= 0 && diffDays <= 7;
      if (rangeFilter === "NEXT_30") return diffDays >= 0 && diffDays <= 30;
      return true;
    });
  }, [appointments, rangeFilter]);

  const schedulableVisits = useMemo(
    () =>
      assignedAppts.filter(
        (a) =>
          !returnsToday.some((r) => Number(r.id) === Number(a.visit_id))
      ),
    [assignedAppts, returnsToday]
  );

  const navigate = (dir) => {
    const d = new Date(selectedDate);
    if (calView === "day") d.setDate(d.getDate() + dir);
    else if (calView === "week") d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setSelectedDate(d);
  };

  const weekDays = useMemo(() => {
    const d = new Date(selectedDate);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return Array.from({ length: 7 }, (_, i) => {
      const nd = new Date(d);
      nd.setDate(d.getDate() + i);
      return nd;
    });
  }, [selectedDate]);

  const monthDays = useMemo(() => {
    const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const last = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const start = new Date(first);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(last);
    end.setDate(end.getDate() + (6 - end.getDay()));
    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [selectedDate]);

  const dayAppts = useMemo(
    () =>
      filteredAppointments
        .filter((a) => isSameDay(a.date, selectedDate))
        .sort((a, b) => a.date - b.date),
    [filteredAppointments, selectedDate]
  );

  const getSlotAppts = (date, hour) =>
    filteredAppointments.filter((a) => isSameDay(a.date, date) && a.date.getHours() === hour);

  const handleSlotClick = (date, hour) => {
    if (!isFutureDay(date)) return;
    setClickedSlot({ date, hour });
    setScheduleDraft({ visit_id: "", return_visit_reason: "" });
    setScheduleError("");
    setShowModal(true);
  };

  const handleAddAppt = async () => {
    if (!clickedSlot || !scheduleDraft.visit_id || !onScheduleReturn) return;
    setSavingSchedule(true);
    setScheduleError("");
    try {
      const selected = new Date(clickedSlot.date);
      selected.setHours(clickedSlot.hour, 0, 0, 0);
      const selectedDateOnly = new Date(selected);
      selectedDateOnly.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDateOnly.getTime() <= today.getTime()) {
        setScheduleError("Não é permitido agendar retorno para hoje. Escolha amanhã ou uma data futura.");
        setSavingSchedule(false);
        return;
      }
      const isoDate = `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`;
      await onScheduleReturn({
        visitId: Number(scheduleDraft.visit_id),
        return_visit_date: isoDate,
        return_visit_reason: scheduleDraft.return_visit_reason?.trim() || null,
      });
      setShowModal(false);
      setScheduleNotice(`Retorno agendado para ${selected.getDate()}/${pad(selected.getMonth() + 1)}/${selected.getFullYear()}.`);
      if (onRefresh) onRefresh();
    } catch (e) {
      setScheduleError(e?.message || "Erro ao agendar retorno");
    } finally {
      setSavingSchedule(false);
    }
  };

  const headerLabel = useMemo(() => {
    if (calView === "month") {
      return `${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
    }
    if (calView === "week") {
      const s = weekDays[0];
      const e = weekDays[6];
      return `${s.getDate()} ${MONTHS[s.getMonth()].slice(0, 3)} - ${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
    }
    return `${DAYS[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTHS[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`;
  }, [selectedDate, calView, weekDays]);

  const visibleHours = Array.from({ length: 14 }, (_, i) => i + 7);
  const isToday = isSameDay(selectedDate, new Date());

  return (
    <div style={{ minHeight: "100vh", maxWidth: 1120, margin: "0 auto" }}>
      <style>{`
        .agenda-root * { box-sizing: border-box; }
        .cal-slot { position: relative; min-height: 48px; border-bottom: 1px solid #ecfdf5; cursor: pointer; transition: background 0.12s; }
        .cal-slot:hover { background: #f8fffb; }
        .cal-slot:hover .add-hint { opacity: 1; }
        .add-hint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
        .appt-pill { margin: 2px 4px; padding: 4px 7px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; border-left: 3px solid; line-height: 1.3; box-shadow: 0 1px 3px rgba(15,23,42,0.06); }
        .month-day { min-height: 88px; padding: 8px; border: 1px solid #e8f5ec; cursor: pointer; transition: background 0.1s, border-color 0.1s; }
        .month-day:hover { background: #f8fffb; border-color: #bbf7d0; }
        .month-day.other-month { opacity: 0.4; }
        .month-day.selected { background: #ecfdf5; border-color: #86efac; }
        .month-day.today-cell { border-color: #22c55e; }
        .today-dot { width: 28px; height: 28px; background: #16a34a; border-radius: 9999px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; font-weight: 700; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); display: flex; align-items: center; justify-content: center; z-index: 999; }
        .modal-box { background: #fff; border-radius: 16px; padding: 22px; width: 440px; max-width: 95vw; box-shadow: 0 24px 64px rgba(0,0,0,0.2); border: 1px solid #dcfce7; }
        .form-input { width: 100%; padding: 11px 12px; border: 1px solid #d1d5db; border-radius: 10px; font-size: 14px; color: #0f172a; transition: border-color 0.15s, box-shadow 0.15s; }
        .form-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
        .btn-primary { background: #16a34a; color: #fff; border: none; padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover { background: #15803d; }
        .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
        .btn-ghost { background: #f3f4f6; color: #374151; border: none; padding: 9px 16px; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s; }
        .btn-ghost:hover { background: #e5e7eb; }
        .view-btn { padding: 7px 13px; border-radius: 8px; font-size: 13px; font-weight: 600; border: none; cursor: pointer; transition: all 0.15s; }
        .view-btn.active { background: #16a34a; color: #fff; }
        .view-btn.inactive { background: #f3f4f6; color: #4b5563; }
        .week-header-col { text-align: center; padding: 8px 0; min-width: 110px; font-size: 12px; color: #64748b; border-right: 1px solid #f1f5f9; }
        .week-header-col.today-col { color: #15803d; }
        .time-label { width: 46px; text-align: right; padding-right: 10px; padding-top: 5px; font-size: 10px; color: #94a3b8; font-weight: 500; flex-shrink: 0; }
        .agenda-row-even { background: #ffffff; }
        .agenda-row-odd { background: #f9fffb; }
        .day-table-row-even td { background: #ffffff; }
        .day-table-row-odd td { background: #f9fffb; }
        .day-table-row-even:hover td, .day-table-row-odd:hover td { background: #f0fdf4; }
      `}</style>

      <div className="agenda-root">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, background: "linear-gradient(135deg,#ffffff 0%,#f0fdf4 100%)", border: "1px solid #dcfce7", borderRadius: 16, padding: "14px 16px" }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0f172a", margin: 0 }}>Minha Agenda</h1>
            <p style={{ color: "#64748b", marginTop: 2, fontSize: 13 }}>
              {isToday ? "Hoje" : `${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()]}`}
              {" · "}{dayAppts.length} compromisso{dayAppts.length !== 1 ? "s" : ""} no dia selecionado
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="btn-ghost" onClick={() => setSelectedDate(new Date())} style={{ fontSize: 13 }}>
              Hoje
            </button>
            <button
              onClick={() => navigate(-1)}
              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b", minWidth: 190, textAlign: "center" }}>{headerLabel}</span>
            <button
              onClick={() => navigate(1)}
              style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
            <div style={{ display: "flex", gap: 4, marginLeft: 8, background: "#f3f4f6", padding: 3, borderRadius: 10 }}>
              {["day", "week", "month"].map((v) => (
                <button key={v} className={`view-btn ${calView === v ? "active" : "inactive"}`} onClick={() => setCalView(v)}>
                  {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mes"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 4, marginLeft: 8, background: "#f3f4f6", padding: 3, borderRadius: 10 }}>
              {[
                { key: "TODAY", label: "Hoje" },
                { key: "NEXT_7", label: "7 dias" },
                { key: "NEXT_30", label: "30 dias" },
                { key: "ALL", label: "Todos" },
              ].map((f) => (
                <button
                  key={f.key}
                  className={`view-btn ${rangeFilter === f.key ? "active" : "inactive"}`}
                  onClick={() => setRangeFilter(f.key)}
                  title={`Filtrar: ${f.label}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <button className="btn-primary" onClick={onRefresh} disabled={loading} style={{ marginLeft: 4 }}>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        {!!scheduleNotice && (
          <div style={{ marginBottom: 12, background: "#ecfdf5", border: "1px solid #86efac", color: "#166534", borderRadius: 12, padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
            {scheduleNotice}
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #dcfce7", overflow: "hidden", marginBottom: 20, boxShadow: "0 10px 25px rgba(15,23,42,0.06)" }}>
          {calView === "month" && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", borderBottom: "1px solid #e2e8f0" }}>
                {DAYS.map((d) => (
                  <div key={d} style={{ padding: "10px 6px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {monthDays.map((d, i) => {
                  const dayA = filteredAppointments.filter((a) => isSameDay(a.date, d));
                  const isOther = d.getMonth() !== selectedDate.getMonth();
                  const isTodayD = isSameDay(d, new Date());
                  const isSel = isSameDay(d, selectedDate);
                  return (
                    <div key={i} className={`month-day${isOther ? " other-month" : ""}${isSel ? " selected" : ""}${isTodayD ? " today-cell" : ""}`} onClick={() => { setSelectedDate(d); setCalView("day"); }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                        {isTodayD ? <div className="today-dot">{d.getDate()}</div> : <span style={{ fontSize: 12, fontWeight: isSel ? 700 : 400, color: isSel ? "#2563eb" : "#334155" }}>{d.getDate()}</span>}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {dayA.slice(0, 2).map((a) => {
                          const c = STATUS_COLORS[a.status] || STATUS_COLORS.SCHEDULED;
                          return (
                            <div key={a.id} className="appt-pill" style={{ background: c.bg, borderLeftColor: c.border, color: c.text }} onClick={(e) => { e.stopPropagation(); onOpenVisit?.(a.visit_id); }}>
                              {formatTime(a.date.getHours())} {a.patient_name.split(" ")[0]}
                            </div>
                          );
                        })}
                        {dayA.length > 2 && (
                          <div style={{ fontSize: 10, color: "#94a3b8", paddingLeft: 4 }}>+{dayA.length - 2} mais</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calView === "week" && (
            <div style={{ overflowX: "auto" }}>
              <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
                <div style={{ width: 52, flexShrink: 0 }} />
                {weekDays.map((d, i) => {
                  const isTodayD = isSameDay(d, new Date());
                  const isSel = isSameDay(d, selectedDate);
                  return (
                    <div key={i} className={`week-header-col${isTodayD ? " today-col" : ""}`} style={{ flex: 1, cursor: "pointer", background: isSel ? "#ecfdf5" : undefined }} onClick={() => { setSelectedDate(d); setCalView("day"); }}>
                      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>{DAYS[d.getDay()]}</div>
                      <div style={{ marginTop: 2 }}>
                         {isTodayD ? <span style={{ display: "inline-flex", width: 26, height: 26, borderRadius: "50%", background: "#16a34a", color: "#fff", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700 }}>{d.getDate()}</span> : <span style={{ fontSize: 18, fontWeight: isSel ? 700 : 400, color: isSel ? "#15803d" : "#1e293b" }}>{d.getDate()}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {visibleHours.map((hour, idx) => (
                  <div key={hour} className={idx % 2 === 0 ? "agenda-row-even" : "agenda-row-odd"} style={{ display: "flex", borderBottom: "1px solid #f1f5f9" }}>
                    <div className="time-label">{formatTime(hour)}</div>
                    {weekDays.map((d, di) => {
                      const slotAppts = getSlotAppts(d, hour);
                      const canSchedule = isFutureDay(d);
                      return (
                        <div
                          key={di}
                          className="cal-slot"
                          style={{ flex: 1, borderRight: "1px solid #f1f5f9", cursor: canSchedule ? "pointer" : "default" }}
                          onClick={() => canSchedule && handleSlotClick(d, hour)}
                        >
                          {slotAppts.map((a) => {
                            const c = STATUS_COLORS[a.status] || STATUS_COLORS.SCHEDULED;
                            return (
                              <div key={a.id} className="appt-pill" style={{ background: c.bg, borderLeftColor: c.border, color: c.text }} onClick={(e) => { e.stopPropagation(); onOpenVisit?.(a.visit_id); }}>
                                <div style={{ fontWeight: 600, fontSize: 11 }}>{a.patient_name.split(" ").slice(0, 2).join(" ")}</div>
                                <div style={{ fontSize: 10, opacity: 0.75 }}>{a.clinical_code}</div>
                              </div>
                            );
                          })}
                          {slotAppts.length === 0 && (
                            <div className="add-hint">
                              <span style={{ fontSize: 10, color: "#86a88f" }}>
                                {canSchedule ? "+ Agendar retorno" : "Somente amanhã+"}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {calView === "day" && (
            <div>
              <div style={{ borderBottom: "1px solid #e2e8f0", padding: "12px 16px 12px 68px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isToday ? "#15803d" : "#334155" }}>
                  {DAYS[selectedDate.getDay()]}, {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
                </div>
              </div>
              <div style={{ maxHeight: 460, overflowY: "auto" }}>
                {visibleHours.map((hour, idx) => {
                  const slotAppts = getSlotAppts(selectedDate, hour);
                  const canSchedule = isFutureDay(selectedDate);
                  return (
                    <div
                      key={hour}
                      className={`cal-slot ${idx % 2 === 0 ? "agenda-row-even" : "agenda-row-odd"}`}
                      style={{ display: "flex", cursor: canSchedule ? "pointer" : "default" }}
                      onClick={() => canSchedule && handleSlotClick(selectedDate, hour)}
                    >
                      <div className="time-label" style={{ paddingTop: 8 }}>{formatTime(hour)}</div>
                      <div style={{ flex: 1, padding: "4px 0", display: "flex", flexWrap: "wrap", gap: 4, alignItems: "flex-start" }}>
                        {slotAppts.map((a) => {
                          const c = STATUS_COLORS[a.status] || STATUS_COLORS.SCHEDULED;
                          return (
                            <div key={a.id} className="appt-pill" style={{ background: c.bg, borderLeftColor: c.border, color: c.text, flex: "0 0 auto", maxWidth: 260 }} onClick={(e) => { e.stopPropagation(); onOpenVisit?.(a.visit_id); }}>
                              <div style={{ fontWeight: 600 }}>{a.patient_name} <span style={{ fontSize: 10, opacity: 0.7 }}>{a.type}</span></div>
                              <div style={{ fontSize: 10, opacity: 0.75 }}>{a.clinical_code} · {a.duration} min</div>
                              {a.notes && <div style={{ fontSize: 10, marginTop: 1, opacity: 0.65 }}>{a.notes}</div>}
                            </div>
                          );
                        })}
                        {slotAppts.length === 0 && (
                          <div style={{ fontSize: 10, color: "#86a88f", paddingTop: 8 }}>
                            {canSchedule ? "+ Agendar retorno" : "Somente amanhã+"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #dcfce7", overflow: "hidden", boxShadow: "0 10px 25px rgba(15,23,42,0.06)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                Compromissos do dia - {selectedDate.getDate()} de {MONTHS[selectedDate.getMonth()]}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{dayAppts.length} compromisso{dayAppts.length !== 1 ? "s" : ""}</div>
            </div>
          </div>
          {dayAppts.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              Nenhum compromisso neste dia.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Horário", "Paciente", "Código", "Tipo", "Status", "Ação"].map((h) => (
                    <th key={h} style={{ textAlign: "left", fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", padding: "10px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayAppts.map((a, idx) => {
                  const c = STATUS_COLORS[a.status] || STATUS_COLORS.SCHEDULED;
                  return (
                    <tr key={a.id} className={idx % 2 === 0 ? "day-table-row-even" : "day-table-row-odd"}>
                      <td style={{ padding: "14px 16px", fontSize: 13, fontWeight: 700, color: "#1e293b", borderTop: "1px solid #f1f5f9" }}>
                        {formatTime(a.date.getHours(), a.date.getMinutes())}
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9" }}>{a.patient_name}</td>
                      <td style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9", fontFamily: "monospace" }}>{a.clinical_code || "-"}</td>
                      <td style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9" }}>{a.type}</td>
                      <td style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9" }}>
                        <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: "1px solid #f1f5f9" }}>
                        <button className="btn-ghost" onClick={() => onOpenVisit?.(a.visit_id)}>Abrir</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#0f172a" }}>Agendar Retorno</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                  {clickedSlot && `${clickedSlot.date.getDate()} ${MONTHS[clickedSlot.date.getMonth()]} as ${formatTime(clickedSlot.hour)}`}
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ width: 32, height: 32, borderRadius: 10, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer" }}>x</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Paciente *</label>
                <select className="form-input" value={scheduleDraft.visit_id} onChange={(e) => setScheduleDraft((p) => ({ ...p, visit_id: e.target.value }))}>
                  <option value="">Selecionar paciente</option>
                  {schedulableVisits.map((v) => (
                    <option key={v.visit_id} value={v.visit_id}>
                      {v.patient_name} {v.clinical_code ? `(${v.clinical_code})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Motivo</label>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Observações do retorno..."
                  value={scheduleDraft.return_visit_reason}
                  onChange={(e) => setScheduleDraft((p) => ({ ...p, return_visit_reason: e.target.value }))}
                  style={{ resize: "none", lineHeight: 1.5 }}
                />
              </div>
              {scheduleError && <div style={{ fontSize: 12, color: "#b91c1c" }}>{scheduleError}</div>}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleAddAppt} disabled={!scheduleDraft.visit_id || savingSchedule}>
                {savingSchedule ? "Salvando..." : "Confirmar Retorno"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

