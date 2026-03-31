import NursePage from "../NursePage";

export function NurseQueueView({
  mode = "queue",
  inTriageCount,
  queue,
  loadingQueue,
  loadQueue,
  triageQueueRows,
  triageUrgentQueue,
  triageNonUrgentQueue,
  urgentQueue,
  nonUrgentQueue,
  waitingQueueSections,
  getQueueRowBg,
  openPatientEditModal,
  removeVisitTriageFromQueue,
  isLabOrReturnQueueRow,
  getQueueActionMeta,
  PRIORITIES,
  statusLabelForVisit,
}) {
  const showingTriageOnly = mode === "patientsInTriage";
  const displayRows = showingTriageOnly ? triageQueueRows : queue;
  const displayUrgentRows = showingTriageOnly ? triageUrgentQueue : urgentQueue;
  const displayNonUrgentRows = showingTriageOnly ? triageNonUrgentQueue : nonUrgentQueue;
  const displaySections = showingTriageOnly
    ? [
        {
          key: "triage-urgent",
          label: "Prioridade Urgente",
          rows: displayUrgentRows,
          color: "#ef4444",
          background: "#fff5f5",
        },
        {
          key: "triage-other",
          label: "Outras Prioridades",
          rows: displayNonUrgentRows,
          color: "#6b7280",
          background: "#fafafa",
        },
      ].filter((section) => section.rows.length > 0)
    : waitingQueueSections;
  const emptyLabel = showingTriageOnly ? "Nenhum paciente em triagem" : "Fila vazia";

  return (
    <div className="dash-animate dash-animate-delay-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {showingTriageOnly ? "Pacientes em Triagem" : "Fila de Espera"}
          </h1>
          <p className="text-sm text-gray-500">
            {showingTriageOnly
              ? `${inTriageCount} paciente(s) em triagem`
              : `${queue.length} paciente(s) na fila`}
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loadingQueue}
          className="btn-primary"
          style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}
        >
          {loadingQueue ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {loadingQueue && queue.length === 0 ? (
        <div className="form-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`queue-skeleton-${i}`}
              className="skeleton-line"
              style={{ height: "16px", width: i % 3 === 0 ? "100%" : "93%" }}
            />
          ))}
        </div>
      ) : displayRows.length === 0 ? (
        <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#d1d5db"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-gray-500 font-medium">{emptyLabel}</p>
        </div>
      ) : (
        <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="w-full">
            <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
              <tr>
                {[
                  "ID",
                  "Paciente",
                  "Prioridade",
                  "Status",
                  "Espera",
                  "Alerta",
                  "Médico",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displaySections.map((section) =>
                section.rows.map((v, idx) => {
                  const wait = v.wait_minutes ?? null;
                  const isLabOrReturn = isLabOrReturnQueueRow(v);
                  const isCritical = !isLabOrReturn && wait != null && wait >= 180;
                  const actionMeta = getQueueActionMeta(v);
                  const pCfg = PRIORITIES.find((p) => p.value === v.priority);
                  const useUrgentStyle = String(v?.priority || "").toUpperCase() === "URGENT";
                  const rowBg = getQueueRowBg(idx, { urgent: useUrgentStyle, isCritical });
                  return [
                    idx === 0 ? (
                      <tr key={`${section.key}-header`}>
                        <td
                          colSpan="8"
                          style={{
                            padding: "8px 16px",
                            fontSize: "11px",
                            fontWeight: "700",
                            color: section.color,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: section.background,
                          }}
                        >
                          {section.label}
                        </td>
                      </tr>
                    ) : null,
                    <tr
                      key={v.id}
                      onClick={() => openPatientEditModal(v)}
                      style={{
                        borderBottom: "1px solid #f9f9f9",
                        background: rowBg,
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#edf5f0";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = rowBg;
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          color: useUrgentStyle ? "#ef4444" : "#0c3a24",
                          fontWeight: "600",
                        }}
                      >
                        #{v.id}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                          {v.full_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{v.clinical_code}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            padding: "3px 8px",
                            borderRadius: "20px",
                            background: pCfg?.bg || "#f3f4f6",
                            color: pCfg?.color || "#374151",
                          }}
                        >
                          {PRIORITIES.find((p) => p.value === v.priority)?.label ||
                            v.priority ||
                            "-"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                        {statusLabelForVisit(v)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: "13px",
                          color: "#111827",
                          fontWeight: "600",
                        }}
                      >
                        {wait != null ? `${wait}min` : "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {isCritical && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "700",
                              padding: "3px 8px",
                              borderRadius: "20px",
                              background: "#ef4444",
                              color: "white",
                            }}
                          >
                            Crítico
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                        {v.doctor_full_name || v.doctor_username || "-"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            width: "auto",
                            padding: "6px 10px",
                            minHeight: "30px",
                            fontSize: "12px",
                            color: "#b91c1c",
                          }}
                          disabled={actionMeta.disabled}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeVisitTriageFromQueue(v);
                          }}
                          title={actionMeta.title}
                        >
                          {actionMeta.label}
                        </button>
                      </td>
                    </tr>,
                  ];
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NurseQueue() {
  return <NursePage forcedView="queue" />;
}
