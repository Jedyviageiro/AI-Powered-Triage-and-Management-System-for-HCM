import DoctorPage from "../DoctorPage";

export function DoctorDashboardView({
  me,
  activeAlertCount,
  filteredQueue,
  priorityTheme,
  waitingTopPriority,
  waitingCount,
  inConsultTopPriority,
  inConsultCount,
  agendaTodayCount,
  dashboardNextPatients,
  dashboardPriorityMeta,
  formatStatus,
  onOpenView,
  onOpenConsultation,
  dashboardHourSeries,
  dashboardPriorityRows,
  dashboardAlertPreview,
  myAssignedQueue,
  dashboardStatusRows,
  pendingLabVisits,
  doctorLabWorklistRows,
  onOpenLabTracking,
  getLabProgressTheme,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ fontSize: "28px", lineHeight: 1, color: "#111827", margin: 0 }}>
            Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date().toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-xs font-medium bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          {new Date().toLocaleDateString("pt-PT")}
        </div>
      </div>

      <div
        className="rounded-2xl p-6 mb-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0c3a24 0%, #165f3b 55%, #1a7048 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">
              Turno Operacional
            </div>
            <div className="text-white text-2xl leading-tight font-semibold">
              {me?.full_name || "Medico"}
            </div>
            <div className="text-white/60 text-sm mt-1">
              {me?.specialization || "Clinica Geral"}
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2">
            <span
              className={`w-2 h-2 rounded-full ${activeAlertCount > 0 ? "bg-red-300" : "bg-emerald-400"}`}
            />
            <span className="text-white text-xs font-semibold">
              {activeAlertCount > 0
                ? `${activeAlertCount} alerta(s) ativo(s)`
                : "Online · Em turno"}
            </span>
          </div>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 border border-white/15 rounded-xl p-4">
            <div className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Fila Total
            </div>
            <div className="text-[32px] text-white leading-none font-semibold">
              {filteredQueue.length}
            </div>
            <div className="text-white/50 text-xs mt-2">pacientes ativos</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-4">
            <div className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Aguardam Medico
            </div>
            <div
              className="text-[32px] leading-none font-semibold"
              style={{ color: priorityTheme(waitingTopPriority).accent }}
            >
              {waitingCount}
            </div>
            <div className="text-white/50 text-xs mt-2">na sala de espera</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-4">
            <div className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Em Consulta
            </div>
            <div
              className="text-[32px] leading-none font-semibold"
              style={{ color: priorityTheme(inConsultTopPriority).accent }}
            >
              {inConsultCount}
            </div>
            <div className="text-white/50 text-xs mt-2">agora mesmo</div>
          </div>
          <div className="bg-white/10 border border-white/15 rounded-xl p-4">
            <div className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-2">
              Agenda Hoje
            </div>
            <div className="text-[32px] text-white leading-none font-semibold">
              {agendaTodayCount}
            </div>
            <div className="text-white/50 text-xs mt-2">consultas marcadas</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">
        <div className="xl:col-span-2 flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Proximos Pacientes</div>
                <div className="text-xs text-gray-400 mt-0.5">Ordenado por prioridade</div>
              </div>
              <button
                type="button"
                onClick={() => onOpenView("waitingQueue")}
                className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition-colors"
              >
                Ver fila completa
              </button>
            </div>
            <div className="space-y-2">
              {dashboardNextPatients.length === 0 && (
                <div className="text-xs text-gray-400">Sem pacientes na fila.</div>
              )}
              {dashboardNextPatients.map((visit) => {
                const key = String(visit?.priority || "").toUpperCase();
                const meta = dashboardPriorityMeta[key] || {
                  label: key || "-",
                  color: "#374151",
                  bg: "#f3f4f6",
                };
                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => onOpenConsultation(visit)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-100 transition-colors text-left"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: meta.color }}
                    >
                      {(visit?.full_name || "P").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {visit?.full_name || "Paciente"}
                      </div>
                      <div className="text-xs text-gray-400 truncate">
                        {formatStatus(visit?.status)} · #{visit?.id}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-semibold px-2 py-1 rounded-full"
                      style={{
                        color: meta.color,
                        background: meta.bg,
                        border: `1px solid ${meta.color}33`,
                      }}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold text-gray-900">Atendimentos por Hora</div>
                <div className="text-xs text-gray-400 mt-0.5">Hoje · 06h - 13h</div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: "#165f3b" }}
                  />
                  Consultas
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ background: "#86efac" }}
                  />
                  Triagens
                </span>
              </div>
            </div>
            <div className="flex items-end gap-2" style={{ height: "130px" }}>
              {dashboardHourSeries.labels.map((label, index) => (
                <div key={label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-1 w-full" style={{ height: "104px" }}>
                    <div
                      className="flex-1 rounded-t-md"
                      style={{
                        height: `${(dashboardHourSeries.triages[index] / dashboardHourSeries.max) * 100}%`,
                        minHeight: dashboardHourSeries.triages[index] > 0 ? "4px" : "2px",
                        background: "#86efac",
                      }}
                    />
                    <div
                      className="flex-1 rounded-t-md"
                      style={{
                        height: `${(dashboardHourSeries.consults[index] / dashboardHourSeries.max) * 100}%`,
                        minHeight: dashboardHourSeries.consults[index] > 0 ? "4px" : "2px",
                        background: "#165f3b",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm font-semibold text-gray-900 mb-1">Distribuicao de Fila</div>
            <div className="text-xs text-gray-400 mb-4">Por prioridade clinica</div>
            <div className="flex justify-center mb-4">
              <div
                style={{
                  width: "140px",
                  height: "140px",
                  borderRadius: "999px",
                  background: `conic-gradient(${dashboardPriorityRows[0]?.color || "#dc2626"} 0 ${dashboardPriorityRows[0]?.pct || 0}%, ${dashboardPriorityRows[1]?.color || "#ea580c"} ${dashboardPriorityRows[0]?.pct || 0}% ${(dashboardPriorityRows[0]?.pct || 0) + (dashboardPriorityRows[1]?.pct || 0)}%, ${dashboardPriorityRows[2]?.color || "#22a06b"} ${(dashboardPriorityRows[0]?.pct || 0) + (dashboardPriorityRows[1]?.pct || 0)}% 100%)`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "18px",
                    borderRadius: "999px",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div className="text-[32px] text-gray-900 leading-none font-semibold">
                    {filteredQueue.length}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">pacientes</div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {dashboardPriorityRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                    <span className="text-gray-600">{row.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{row.count}</span>
                    <span className="text-gray-400">{row.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-semibold text-gray-900">Alertas Ativos</div>
              <span className="text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                {activeAlertCount} criticos
              </span>
            </div>
            <div className="space-y-2.5">
              {dashboardAlertPreview.length === 0 && (
                <div className="text-xs text-gray-400">Sem alertas ativos.</div>
              )}
              {dashboardAlertPreview.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${alert.tone === "red" ? "bg-red-50 border-red-100" : alert.tone === "orange" ? "bg-orange-50 border-orange-100" : "bg-amber-50 border-amber-100"}`}
                >
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.tone === "red" ? "bg-red-600" : alert.tone === "orange" ? "bg-orange-600" : "bg-amber-600"}`}
                  />
                  <div className="min-w-0">
                    <div
                      className={`text-xs font-semibold truncate ${alert.tone === "red" ? "text-red-800" : alert.tone === "orange" ? "text-orange-800" : "text-amber-800"}`}
                    >
                      {alert.title}
                    </div>
                    <div
                      className={`text-[11px] mt-0.5 truncate ${alert.tone === "red" ? "text-red-600" : alert.tone === "orange" ? "text-orange-600" : "text-amber-600"}`}
                    >
                      {alert.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">Acoes Rapidas</div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => onOpenView("myPatients")}
              className="w-full text-left rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-3 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-between"
            >
              Meus pacientes atuais
              <span className="bg-emerald-700 text-white rounded-full px-2 py-0.5 text-[10px]">
                {myAssignedQueue.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenView("agendaToday")}
              className="w-full text-left rounded-full border border-blue-200 bg-blue-50 text-blue-800 px-4 py-3 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center justify-between"
            >
              Agenda de hoje
              <span className="bg-blue-700 text-white rounded-full px-2 py-0.5 text-[10px]">
                {agendaTodayCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenView("labOrdered")}
              className="w-full text-left rounded-full border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3 text-xs font-semibold hover:bg-amber-100 transition-colors flex items-center justify-between"
            >
              Exames solicitados
              <span className="bg-amber-600 text-white rounded-full px-2 py-0.5 text-[10px]">
                {doctorLabWorklistRows.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenView("activeAlerts")}
              className="w-full text-left rounded-full border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-xs font-semibold hover:bg-red-100 transition-colors flex items-center justify-between"
            >
              Alertas ativos
              <span className="bg-red-600 text-white rounded-full px-2 py-0.5 text-[10px]">
                {activeAlertCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onOpenView("clinicalHistory")}
              className="w-full text-left rounded-full border border-gray-200 bg-gray-50 text-gray-700 px-4 py-3 text-xs font-semibold hover:bg-gray-100 transition-colors"
            >
              Historico clinico {"->"}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">Estado Operacional</div>
          <div className="space-y-3">
            {dashboardStatusRows.map((row) => (
              <div key={row.key}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-500 font-medium">{row.label}</span>
                  <span className="font-semibold" style={{ color: row.color }}>
                    {row.count}
                  </span>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: `${row.color}22` }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.pct}%`, background: row.color }}
                  />
                </div>
              </div>
            ))}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-500 font-medium">Exames pendentes</span>
                <span className="font-semibold text-blue-700">{pendingLabVisits.length}</span>
              </div>
              <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{
                    width: `${Math.min(100, Math.round((pendingLabVisits.length / Math.max(1, filteredQueue.length)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">Exames Solicitados</div>
          <div className="space-y-2.5">
            {doctorLabWorklistRows.slice(0, 3).map((visit) => (
              <button
                key={visit.id}
                type="button"
                onClick={() => onOpenLabTracking(visit)}
                className="w-full text-left flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-amber-100 text-amber-700 text-xs font-bold">
                  L
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const progressTheme = getLabProgressTheme(
                      visit.progress_percent,
                      visit.is_ready
                    );
                    return (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="text-xs font-semibold text-gray-800 truncate">
                            {visit?.full_name || "Paciente"} | {visit?.lab_exam_type || "Exame"}
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700 flex-shrink-0">
                            {visit.workflow_label}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {visit.state_label} | {visit.eta_label}
                          {visit.is_ready ? ` | ${visit.patient_notified_label}` : ""}
                        </div>
                        <div
                          className="mt-1 text-[10px] font-medium"
                          style={{ color: progressTheme.text }}
                        >
                          {visit.progress_percent || 0}% concluido
                        </div>
                        <div
                          className="mt-2 h-1.5 rounded-full overflow-hidden"
                          style={{ background: progressTheme.track }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${visit.progress_percent || 0}%`,
                              background: progressTheme.fill,
                            }}
                          />
                        </div>
                      </>
                    );
                  })()}
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${visit.is_ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                >
                  {visit.is_ready ? "Pronto" : "Pendente"}
                </span>
              </button>
            ))}
            {doctorLabWorklistRows.length === 0 && (
              <div className="text-xs text-gray-400">
                Sem exames laboratoriais em acompanhamento.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  return <DoctorPage forcedView="dashboard" />;
}
