import NursePage from "../NursePage";

export function NurseDashboardView({
  activeView,
  me,
  onRefresh,
  loadingQueue,
  totalQueue,
  urgentCount,
  weeklyData,
  availableDoctors,
  doctors,
  busyDoctors,
  inTriageCount,
  recentQueueItems,
  priorities,
  onOpenView,
  queue,
}) {
  return (
    <div>
      <div style={{ marginBottom: "24px" }} className="dash-animate">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <h1
              style={{
                fontSize: "26px",
                fontWeight: "800",
                color: "#0f172a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {activeView === "dayStats"
                ? "Estatísticas do Dia"
                : `Olá, ${me?.full_name?.split(" ")[0] || "Enfermeiro(a)"}`}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0", fontWeight: "400" }}>
              {activeView === "dayStats"
                ? "Resumo operacional detalhado"
                : `${new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })}`}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loadingQueue}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "9px 16px",
              background: "#f8fafc",
              border: "1.5px solid #e2e8f0",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: "600",
              color: "#374151",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
            {loadingQueue ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1fr 1fr 1fr",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div className="dash-hero-card dash-animate dash-animate-delay-1" style={{ gridRow: "1" }}>
          <div className="update-dot" style={{ marginBottom: "10px" }} />
          <div
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: "6px",
            }}
          >
            Hoje ·{" "}
            {new Date().toLocaleDateString("pt-PT", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div
            style={{
              fontSize: "38px",
              fontWeight: "800",
              color: "white",
              lineHeight: "1",
              marginBottom: "4px",
              letterSpacing: "-0.02em",
            }}
          >
            {totalQueue}
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "rgba(255,255,255,0.85)",
              marginBottom: "12px",
            }}
          >
            Pacientes na Fila
          </div>
          {urgentCount > 0 && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(239,68,68,0.22)",
                border: "1px solid rgba(239,68,68,0.35)",
                borderRadius: "20px",
                padding: "4px 10px",
                fontSize: "11px",
                fontWeight: "700",
                color: "#fca5a5",
              }}
            >
              <span
                style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }}
              />
              {urgentCount} urgente{urgentCount !== 1 ? "s" : ""}
            </div>
          )}
          <div style={{ marginTop: "20px", position: "relative", zIndex: 0, opacity: 0.28 }}>
            <div
              style={{
                height: "52px",
                borderRadius: "999px",
                background: "rgba(255,255,255,0.08)",
                display: "flex",
                alignItems: "flex-end",
                gap: "4px",
                padding: "8px",
              }}
            >
              {weeklyData.map((value, index) => (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    height: `${Math.max(8, value * 6)}px`,
                    borderRadius: "999px",
                    background: "#4ade80",
                    opacity: 1,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "6px" }}>
              Últimos 7 dias
            </div>
          </div>
        </div>

        {[
          {
            label: "Médicos Disponíveis",
            value: availableDoctors.length,
            iconBg: "#edf5f0",
            iconColor: "#166534",
            trend: availableDoctors.length > 0 ? "up" : "neutral",
            trendLabel: `de ${doctors.length} total`,
            delay: "dash-animate-delay-2",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 5v14M5 12h14"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
          {
            label: "Médicos Ocupados",
            value: busyDoctors.length,
            iconBg: "#fef2f2",
            iconColor: "#b91c1c",
            trend: busyDoctors.length > 0 ? "down" : "up",
            trendLabel: "em consulta",
            delay: "dash-animate-delay-3",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M8 7V3m8 4V3m-9 8h10m-5 4v3m0 0 3-3m-3 3-3-3"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="14"
                  rx="2"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
          {
            label: "Em Triagem",
            value: inTriageCount,
            iconBg: "#fff7ed",
            iconColor: "#c2410c",
            trend: "neutral",
            trendLabel: "a aguardar médico",
            delay: "dash-animate-delay-4",
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ),
          },
        ].map(({ label, value, iconBg, iconColor, trend, trendLabel, delay, icon }) => (
          <div key={label} className={`dash-stat-card dash-animate ${delay}`}>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: "14px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: iconBg,
                  color: iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {icon}
              </div>
              <div
                className={
                  trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "trend-neutral"
                }
              >
                {trend === "up" ? "↑" : trend === "down" ? "↓" : "—"}
              </div>
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "800",
                color: "#0f172a",
                lineHeight: "1",
                marginBottom: "4px",
                letterSpacing: "-0.02em",
              }}
            >
              {value}
            </div>
            <div
              style={{ fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "3px" }}
            >
              {label}
            </div>
            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{trendLabel}</div>
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        <div className="dash-chart-card dash-animate dash-animate-delay-3">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div className="dash-section-title" style={{ margin: 0 }}>
              Fila Atual
            </div>
            <button
              onClick={() => onOpenView("queue")}
              style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#165034",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Ver tudo →
            </button>
          </div>
          {recentQueueItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#d1d5db" }}>
              <p style={{ fontSize: "13px", color: "#9ca3af", fontWeight: "500" }}>Fila vazia</p>
            </div>
          ) : (
            <div>
              {recentQueueItems.map((visit) => {
                const priorityConfig = priorities.find(
                  (priority) => priority.value === visit.priority
                );
                const wait = visit.wait_minutes ?? null;
                const isCritical = wait != null && wait >= 180;
                return (
                  <div key={visit.id} className="queue-row" onClick={() => onOpenView("queue")}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "50%",
                        background: priorityConfig?.bg || "#f3f4f6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "13px",
                        fontWeight: "700",
                        color: priorityConfig?.color || "#374151",
                      }}
                    >
                      {(visit.full_name || "?")[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          color: "#111827",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {visit.full_name || "-"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                        {visit.clinical_code || ""}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        gap: "4px",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        className="priority-pill"
                        style={{
                          background: priorityConfig?.bg || "#f3f4f6",
                          color: priorityConfig?.color || "#374151",
                        }}
                      >
                        {priorityConfig?.label || visit.priority}
                      </span>
                      {wait != null && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: isCritical ? "#ef4444" : "#9ca3af",
                            fontWeight: isCritical ? "700" : "400",
                          }}
                        >
                          {wait}min
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="dash-chart-card dash-animate dash-animate-delay-4">
          <div className="dash-section-title">Distribuição de Médicos</div>
          <div
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}
          >
            <div className="dash-donut-wrapper">
              <div
                style={{
                  width: "130px",
                  height: "130px",
                  borderRadius: "999px",
                  background: `conic-gradient(#165034 0 ${doctors.length ? (availableDoctors.length / doctors.length) * 100 : 0}%, #ef4444 ${doctors.length ? (availableDoctors.length / doctors.length) * 100 : 0}% 100%)`,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: "20px",
                    borderRadius: "999px",
                    background: "#fff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: "800",
                      color: "#0f172a",
                      lineHeight: "1",
                    }}
                  >
                    {doctors.length}
                  </div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", fontWeight: "600" }}>Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-grid-bottom">
        <div className="dash-chart-card dash-animate dash-animate-delay-5">
          <div className="dash-section-title">Ações Rápidas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => onOpenView("newTriage")} className="quick-action-btn">
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                  Iniciar Nova Triagem
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                  Registrar paciente e iniciar avaliação
                </div>
              </div>
            </button>
            <button onClick={() => onOpenView("queue")} className="quick-action-btn">
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                  Ver Fila de Espera
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                  Gerir prioridades e atribuições
                </div>
              </div>
            </button>
            <button onClick={() => onOpenView("doctors")} className="quick-action-btn">
              <div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#111827" }}>
                  Disponibilidade Médicos
                </div>
                <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "1px" }}>
                  Ver estado de cada médico
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="dash-chart-card dash-animate dash-animate-delay-5">
          <div className="dash-section-title">Distribuição por Prioridade</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {priorities.map((priority) => {
              const count = queue.filter((visit) => visit.priority === priority.value).length;
              const pct = totalQueue > 0 ? Math.round((count / totalQueue) * 100) : 0;
              return (
                <div key={priority.value}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: priority.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "12px", fontWeight: "600", color: "#374151" }}>
                        {priority.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", fontWeight: "700", color: priority.color }}>
                        {count}
                      </span>
                      <span style={{ fontSize: "11px", color: "#9ca3af" }}>{pct}%</span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "#f3f4f6",
                      borderRadius: "99px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${priority.color}aa, ${priority.color})`,
                        borderRadius: "99px",
                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NurseDashboard() {
  return <NursePage forcedView="home" />;
}
