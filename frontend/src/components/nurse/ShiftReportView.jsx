import { useMemo } from "react";

const PRIORITY_META = [
  { key: "URGENT", label: "Urgente", color: "#ef4444", bg: "#fef2f2" },
  { key: "LESS_URGENT", label: "Pouco Urgente", color: "#f97316", bg: "#fff7ed" },
  { key: "NON_URGENT", label: "Não Urgente", color: "#165034", bg: "#edf5f0" },
];

const DESTINATION_META = {
  ADMIT_URGENT: "Internamento Urgente",
  BED_REST: "Repouso / Acamado",
  HOME: "Alta para Casa",
  RETURN_VISIT: "Retorno Programado",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-PT");
};

const isSameDayLocal = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const toHourLabel = (hour) => `${String(hour % 24).padStart(2, "0")}h`;

function StatIcon({ type }) {
  if (type === "triage") {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>;
  }
  if (type === "waiting") {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
  }
  if (type === "wait") {
    return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>;
  }
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>;
}

export default function ShiftReportView({
  me,
  queue = [],
  queueSummary = null,
  pastVisits = [],
  shiftStatus = null,
  loadingQueue = false,
  loadingPastVisits = false,
  onRefresh,
}) {
  const todayFinished = useMemo(() => {
    const now = new Date();
    return (Array.isArray(pastVisits) ? pastVisits : []).filter((v) => {
      const ref = new Date(v?.consultation_ended_at || v?.arrival_time || "");
      return !Number.isNaN(ref.getTime()) && isSameDayLocal(ref, now);
    });
  }, [pastVisits]);

  const waitingCount = useMemo(
    () =>
      (Array.isArray(queue) ? queue : []).filter((v) =>
        ["WAITING", "IN_TRIAGE", "WAITING_DOCTOR"].includes(String(v?.status || ""))
      ).length,
    [queue]
  );

  const avgWaitMinutes = useMemo(() => {
    const fromSummary = Number(queueSummary?.average_wait_minutes ?? queueSummary?.avg_wait_minutes);
    if (Number.isFinite(fromSummary) && fromSummary >= 0) return Math.round(fromSummary);
    const waits = (Array.isArray(queue) ? queue : [])
      .map((v) => Number(v?.wait_minutes))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (waits.length === 0) return null;
    return Math.round(waits.reduce((a, b) => a + b, 0) / waits.length);
  }, [queue, queueSummary]);

  const avgConsultMinutes = useMemo(() => {
    const spans = todayFinished
      .map((v) => {
        const s = new Date(v?.consultation_started_at || "");
        const e = new Date(v?.consultation_ended_at || "");
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
        const mins = Math.floor((e.getTime() - s.getTime()) / 60000);
        return mins >= 0 ? mins : null;
      })
      .filter((v) => Number.isFinite(v));
    if (spans.length === 0) return null;
    return Math.round(spans.reduce((a, b) => a + b, 0) / spans.length);
  }, [todayFinished]);

  const priorityBreakdown = useMemo(() => {
    const counts = { URGENT: 0, LESS_URGENT: 0, NON_URGENT: 0 };
    [...todayFinished, ...(Array.isArray(queue) ? queue : [])].forEach((v) => {
      const key = String(v?.priority || "");
      if (counts[key] != null) counts[key] += 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return PRIORITY_META.map((p) => ({
      ...p,
      count: counts[p.key] || 0,
      pct: Math.round(((counts[p.key] || 0) / total) * 100),
    }));
  }, [todayFinished, queue]);

  const hourlyFlow = useMemo(() => {
    const scheduleStart = new Date(shiftStatus?.scheduled_start || "");
    const scheduleEnd = new Date(shiftStatus?.scheduled_end || "");
    const startHour = !Number.isNaN(scheduleStart.getTime()) ? scheduleStart.getHours() : 7;
    const endHour = !Number.isNaN(scheduleEnd.getTime()) ? scheduleEnd.getHours() : 13;
    const labels = [];
    for (let h = startHour; h <= endHour; h += 1) labels.push(h);
    if (labels.length === 0) labels.push(7, 8, 9, 10, 11, 12, 13);
    const counts = Object.fromEntries(labels.map((h) => [h, 0]));
    todayFinished.forEach((v) => {
      const t = new Date(v?.consultation_ended_at || v?.arrival_time || "");
      if (Number.isNaN(t.getTime())) return;
      const h = t.getHours();
      if (counts[h] != null) counts[h] += 1;
    });
    const data = labels.map((h) => ({ label: toHourLabel(h), value: counts[h] || 0 }));
    const max = Math.max(...data.map((d) => d.value), 1);
    return { data, max };
  }, [todayFinished, shiftStatus]);

  const topComplaints = useMemo(() => {
    const bucket = new Map();
    [...todayFinished, ...(Array.isArray(queue) ? queue : [])].forEach((v) => {
      const raw = String(v?.chief_complaint || v?.triage_chief_complaint || "").trim();
      if (!raw) return;
      const key = raw.split(/[;,]/)[0].trim().slice(0, 80) || raw.slice(0, 80);
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));
  }, [todayFinished, queue]);

  const destinations = useMemo(() => {
    const bucket = new Map();
    todayFinished.forEach((v) => {
      const key = String(v?.disposition_plan || "").trim().toUpperCase();
      if (!key) return;
      bucket.set(key, (bucket.get(key) || 0) + 1);
    });
    return [...bucket.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([key, count]) => ({ label: DESTINATION_META[key] || key, count }));
  }, [todayFinished]);

  const loading = loadingQueue || loadingPastVisits;
  const shiftStateMeta = useMemo(() => {
    if (shiftStatus?.is_on_break) {
      return {
        label: "Em pausa",
        bg: "rgba(250,204,21,0.2)",
        border: "rgba(250,204,21,0.65)",
        color: "#fef08a",
        dot: "#facc15",
      };
    }
    if (shiftStatus?.is_on_shift) {
      return {
        label: "Ativo",
        bg: "rgba(34,197,94,0.2)",
        border: "rgba(34,197,94,0.7)",
        color: "#dcfce7",
        dot: "#22c55e",
      };
    }
    return {
      label: "Encerrado",
      bg: "rgba(148,163,184,0.18)",
      border: "rgba(148,163,184,0.45)",
      color: "#e2e8f0",
      dot: "#94a3b8",
    };
  }, [shiftStatus?.is_on_break, shiftStatus?.is_on_shift]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Relatório do Turno</h1>
          <p className="text-sm text-gray-500">Resumo operacional com dados do turno atual</p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="btn-primary" style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div style={{ background: "linear-gradient(145deg, #0c3a24 0%, #165034 55%, #1a6040 100%)", borderRadius: "18px", padding: "20px", color: "#ffffff", marginBottom: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.01em" }}>Resumo do Turno Atual</div>
          <div style={{ fontSize: "11px", opacity: 0.82 }}>{new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.9fr 0.9fr", gap: "10px" }}>
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", opacity: 0.82, textTransform: "uppercase", letterSpacing: "0.05em" }}>Enfermeiro(a)</div>
            <div style={{ fontSize: "21px", lineHeight: 1.1, fontWeight: 800, marginTop: "6px" }}>{me?.full_name || "Utilizador"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", opacity: 0.82, textTransform: "uppercase", letterSpacing: "0.05em" }}>Início</div>
            <div style={{ fontSize: "15px", lineHeight: 1.25, fontWeight: 700, marginTop: "6px" }}>{formatDate(shiftStatus?.clock_in_at)}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", opacity: 0.82, textTransform: "uppercase", letterSpacing: "0.05em" }}>Janela</div>
            <div style={{ fontSize: "17px", lineHeight: 1.2, fontWeight: 800, marginTop: "6px" }}>{shiftStatus?.shift_window || "-"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "12px", padding: "12px 14px" }}>
            <div style={{ fontSize: "11px", opacity: 0.82, textTransform: "uppercase", letterSpacing: "0.05em" }}>Estado</div>
            <div style={{ marginTop: "8px", display: "inline-flex", alignItems: "center", gap: "7px", borderRadius: "999px", padding: "5px 10px", background: shiftStateMeta.bg, border: `1px solid ${shiftStateMeta.border}`, color: shiftStateMeta.color, fontSize: "12px", fontWeight: 800 }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: shiftStateMeta.dot, boxShadow: `0 0 0 3px ${shiftStateMeta.bg}` }} />
              {shiftStateMeta.label}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "12px", marginBottom: "14px" }}>
        <div className="form-card" style={{ margin: 0, padding: "14px", position: "relative" }}>
          <div style={{ position: "absolute", top: "12px", right: "12px", color: "#2d6f4e", background: "#edf5f0", border: "1px solid #dcebe2", borderRadius: "10px", padding: "6px" }}><StatIcon type="triage" /></div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Triagens Concluídas Hoje</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#0c3a24", lineHeight: 1, marginTop: "8px" }}>{todayFinished.length}</div>
        </div>
        <div className="form-card" style={{ margin: 0, padding: "14px", position: "relative" }}>
          <div style={{ position: "absolute", top: "12px", right: "12px", color: "#a16207", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "6px" }}><StatIcon type="waiting" /></div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Aguardando Atendimento</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#a16207", lineHeight: 1, marginTop: "8px" }}>{waitingCount}</div>
        </div>
        <div className="form-card" style={{ margin: 0, padding: "14px", position: "relative" }}>
          <div style={{ position: "absolute", top: "12px", right: "12px", color: "#165034", background: "#edf5f0", border: "1px solid #dcebe2", borderRadius: "10px", padding: "6px" }}><StatIcon type="wait" /></div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Tempo Médio de Espera</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#165034", lineHeight: 1, marginTop: "8px" }}>{avgWaitMinutes != null ? `${avgWaitMinutes} min` : "-"}</div>
        </div>
        <div className="form-card" style={{ margin: 0, padding: "14px", position: "relative" }}>
          <div style={{ position: "absolute", top: "12px", right: "12px", color: "#165034", background: "#edf5f0", border: "1px solid #dcebe2", borderRadius: "10px", padding: "6px" }}><StatIcon type="flow" /></div>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Tempo Médio de Consulta</div>
          <div style={{ fontSize: "30px", fontWeight: 800, color: "#165034", lineHeight: 1, marginTop: "8px" }}>{avgConsultMinutes != null ? `${avgConsultMinutes} min` : "-"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "12px", marginBottom: "12px" }}>
        <div className="form-card" style={{ margin: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", marginBottom: "10px" }}>Distribuição de Prioridades</div>
          <div style={{ display: "grid", gap: "10px" }}>
            {priorityBreakdown.map((p) => (
              <div key={p.key}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                  <span style={{ fontWeight: 600, color: p.color }}>{p.label}</span>
                  <span style={{ color: "#6b7280" }}>{p.count} ({p.pct}%)</span>
                </div>
                <div style={{ height: "8px", borderRadius: "999px", background: "#f3f4f6", overflow: "hidden" }}>
                  <div style={{ width: `${p.pct}%`, height: "100%", background: p.color, borderRadius: "999px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="form-card" style={{ margin: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", marginBottom: "10px" }}>Pacientes por Hora</div>
          <div style={{ height: "156px", display: "flex", alignItems: "flex-end", gap: "6px" }}>
            {hourlyFlow.data.map((h) => (
              <div key={h.label} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                <div style={{ height: `${(h.value / hourlyFlow.max) * 100}%`, minHeight: h.value > 0 ? "8px" : "2px", borderRadius: "6px 6px 0 0", background: "linear-gradient(180deg,#2d6f4e,#165034)" }} title={`${h.label}: ${h.value}`} />
                <div style={{ fontSize: "10px", marginTop: "6px", color: "#6b7280" }}>{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        <div className="form-card" style={{ margin: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", marginBottom: "10px" }}>Principais Queixas</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {topComplaints.length === 0 && <div style={{ fontSize: "12px", color: "#9ca3af" }}>Sem dados de queixas para hoje.</div>}
            {topComplaints.map((q, idx) => (
              <div key={q.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#374151" }}>{idx + 1}. {q.label}</span>
                <span style={{ fontWeight: 700, color: "#0c3a24" }}>{q.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="form-card" style={{ margin: 0 }}>
          <div style={{ fontWeight: 700, color: "#111827", marginBottom: "10px" }}>Destino Após Triagem</div>
          <div style={{ display: "grid", gap: "8px" }}>
            {destinations.length === 0 && <div style={{ fontSize: "12px", color: "#9ca3af" }}>Sem registos de destino para hoje.</div>}
            {destinations.map((d, idx) => (
              <div key={`${d.label}-${idx}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                <span style={{ color: "#374151" }}>{d.label}</span>
                <span style={{ fontWeight: 700, color: "#0c3a24" }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
