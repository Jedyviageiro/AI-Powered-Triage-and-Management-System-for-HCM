import NotificationListView from "../../../components/shared/NotificationListView";
import LabDashboardContent from "../lab-dashboard/LabDashboardContent";
import LabResultsTableContent from "../lab-results/LabResultsTableContent";
import LabInsertContent from "../lab-insert/LabInsertContent";
import LabSettingsContent from "../lab-configuracao/LabSettingsContent";
import { examLabel } from "../lab-helpers/labExamHelpers";
import { toSafeNotificationText } from "../lab-helpers/labNotificationHelpers";

export function LabLayout(props) {
  const {
    CSS,
    SIDEBAR_BG,
    sidebarOpen,
    setSidebarOpen,
    navListRef,
    navItemRefs,
    navIndicator,
    navSections,
    openNotificationsPage,
    openView,
    activeView,
    notificationsUnread,
    logout,
    search,
    setSearch,
    notificationsPreviewRef,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    latestNotification,
    markNotificationRead,
    loadAll,
    loading,
    initials,
    err,
    setErr,
    dashboardStats,
    filteredPending,
    setModalVisitId,
    filteredRows,
    me,
    filteredNotifications,
    markAllNotificationsRead,
    modalVisit,
    modalProtocol,
    modalPresentation,
    modalFields,
    savingResult,
    handleSave,
    ResultModal,
  } = props;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f2f2f7",
        fontFamily: "inherit",
        color: "#1c1c1e",
      }}
    >
      <style>{CSS}</style>

      <aside
        style={{
          width: sidebarOpen ? 220 : 60,
          minWidth: sidebarOpen ? 220 : 60,
          background: SIDEBAR_BG,
          height: "100vh",
          position: "sticky",
          top: 0,
          display: "flex",
          flexDirection: "column",
          transition: "width .25s ease, min-width .25s ease",
          overflow: "hidden",
          flexShrink: 0,
        }}
        className={sidebarOpen ? "sidebar-open" : "sidebar-closed"}
      >
        <div style={{ padding: "18px 14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setSidebarOpen((value) => !value)}
            style={{
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              color: "rgba(255,255,255,.7)",
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? (
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>
          {sidebarOpen && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>
                Laboratório
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", marginTop: 1 }}>
                Painel Técnico
              </div>
            </div>
          )}
        </div>

        <nav
          style={{ flex: 1, padding: "10px 8px 10px 0", overflowY: "auto", overflowX: "hidden" }}
        >
          <div
            ref={navListRef}
            style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}
          >
            <span
              className="nav-indicator"
              style={{
                top: `${navIndicator?.top || 0}px`,
                height: `${navIndicator?.height || 0}px`,
                opacity: navIndicator?.opacity || 0,
              }}
            />
            {navSections.map((section) => (
              <div key={section.title}>
                {sidebarOpen && (
                  <div
                    style={{
                      padding: "0 12px 6px 24px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: ".08em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,.35)",
                    }}
                  >
                    {section.title}
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {section.items.map((item) => (
                    <div key={item.key} className="nav-item-wrap">
                      <button
                        ref={(el) => {
                          if (!navItemRefs?.current) return;
                          if (el) navItemRefs.current[item.key] = el;
                          else delete navItemRefs.current[item.key];
                        }}
                        onClick={() => {
                          if (item.key === "notifications") {
                            openNotificationsPage();
                            return;
                          }
                          openView(item.key);
                        }}
                        className={`sidebar-nav-btn w-full text-left px-3 py-2.5 text-[12px] transition-all flex items-center gap-3 border-0 bg-transparent ${activeView === item.key ? "nav-active" : "sidebar-nav-inactive"}`}
                        style={
                          activeView === item.key
                            ? { borderRadius: 0, paddingLeft: sidebarOpen ? 20 : 0 }
                            : { fontFamily: "inherit" }
                        }
                      >
                        <span style={{ flexShrink: 0 }}>{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                        {item.key === "notifications" && notificationsUnread > 0 && sidebarOpen && (
                          <span
                            className="ml-auto nav-badge-open text-white"
                            style={{ background: "#165034" }}
                          >
                            {notificationsUnread > 9 ? "9+" : notificationsUnread}
                          </span>
                        )}
                        {item.key === "notifications" &&
                          notificationsUnread > 0 &&
                          !sidebarOpen && (
                            <span
                              className="nav-badge absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center"
                              style={{ background: "#165034" }}
                            >
                              {notificationsUnread > 9 ? "9+" : notificationsUnread}
                            </span>
                          )}
                      </button>
                      <span className="nav-tooltip">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div style={{ padding: "10px 8px 14px", borderTop: "1px solid rgba(255,255,255,.08)" }}>
          <div className="nav-item-wrap">
            <button
              onClick={logout}
              className="sidebar-nav-btn w-full text-left px-3 py-2.5 text-[12px] transition-all flex items-center gap-3 border-0 bg-transparent sidebar-nav-inactive"
              style={{ fontFamily: "inherit" }}
            >
              <svg
                width="16"
                height="16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.8"
                style={{ flexShrink: 0 }}
              >
                <path d="M17 16l4-4m0 0-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1" />
              </svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header
          style={{
            height: "52px",
            background: "#fff",
            display: "flex",
            alignItems: "center",
            position: "sticky",
            top: 0,
            zIndex: 20,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              maxWidth: "1160px",
              margin: "0 auto",
              width: "100%",
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f2f2f7",
                borderRadius: "999px",
                padding: "8px 14px",
                width: "280px",
                border: "0.5px solid rgba(0,0,0,.05)",
              }}
            >
              <svg
                width="13"
                height="13"
                fill="none"
                viewBox="0 0 24 24"
                stroke="#8e8e93"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: "#1c1c1e",
                  outline: "none",
                  fontFamily: "inherit",
                  width: "100%",
                }}
                placeholder="Pesquisar paciente, codigo ou exame..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div ref={notificationsPreviewRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setNotificationsPreviewOpen((prev) => !prev)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: notificationsPreviewOpen ? "#165034" : "#9ca3af",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.background = "#f3f4f6";
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.background = "transparent";
                  }}
                  title="Notificações"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  {notificationsUnread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: "1px",
                        right: "1px",
                        minWidth: "16px",
                        height: "16px",
                        borderRadius: "999px",
                        background: "#ef4444",
                        border: "1.5px solid white",
                        color: "white",
                        fontSize: "10px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 4px",
                      }}
                    >
                      {notificationsUnread > 99 ? "99+" : notificationsUnread}
                    </span>
                  )}
                </button>
                {notificationsPreviewOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: "340px",
                      background: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "18px",
                      zIndex: 220,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        borderBottom: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#111827" }}>
                          Notificações
                        </div>
                        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                          {notificationsUnread > 0
                            ? `${notificationsUnread} por ler`
                            : "Tudo em dia"}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          openNotificationsPage();
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#165034",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Ver todas
                      </button>
                    </div>
                    <div style={{ padding: "12px" }}>
                      {latestNotification ? (
                        <div style={{ display: "grid", gap: "6px" }}>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>
                            {toSafeNotificationText(latestNotification.title, "Notificação")}
                          </div>
                          <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>
                            {toSafeNotificationText(latestNotification.message, "-")}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginTop: "2px",
                            }}
                          >
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                              {latestNotification.created_at
                                ? new Date(latestNotification.created_at).toLocaleString("pt-PT")
                                : "-"}
                            </span>
                            {!latestNotification.read_at ? (
                              <button
                                type="button"
                                onClick={() => markNotificationRead(latestNotification.id)}
                                className="btn-secondary"
                                style={{
                                  width: "auto",
                                  minHeight: "30px",
                                  padding: "6px 10px",
                                  fontSize: "12px",
                                }}
                              >
                                Marcar lida
                              </button>
                            ) : (
                              <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>
                                Lida
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                          Sem notificações recentes.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={loadAll}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "transparent",
                  color: "#007aff",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                {loading ? "A carregar..." : "Atualizar"}
              </button>
              {!sidebarOpen && (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#e8f3ed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1a6640",
                  }}
                >
                  {initials}
                </div>
              )}
              {sidebarOpen && (
                <button
                  type="button"
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    border: "2px solid #e5e7eb",
                    overflow: "hidden",
                    cursor: "default",
                    padding: 0,
                    background: "linear-gradient(135deg, #16a34a, #22c55e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: "13px", fontWeight: "700", color: "white" }}>
                    {initials}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
            {err && (
              <div
                style={{
                  background: "#fff0f0",
                  border: "0.5px solid #ffcdd2",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "#c62828",
                  marginBottom: "20px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                {err}
                <button
                  onClick={() => setErr("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c62828",
                    fontSize: "16px",
                    lineHeight: 1,
                  }}
                >
                  x
                </button>
              </div>
            )}

            {activeView === "dashboard" && (
              <LabDashboardContent
                dashboardStats={dashboardStats}
                filteredPending={filteredPending}
                examLabel={examLabel}
                onOpenVisit={setModalVisitId}
              />
            )}

            {["pending", "ready", "history"].includes(activeView) && (
              <LabResultsTableContent
                activeView={activeView}
                filteredRows={filteredRows}
                examLabel={examLabel}
                onOpenVisit={setModalVisitId}
              />
            )}

            {activeView === "insert" && (
              <LabInsertContent
                filteredPending={filteredPending}
                search={search}
                examLabel={examLabel}
                onOpenVisit={setModalVisitId}
              />
            )}

            {activeView === "settings" && <LabSettingsContent me={me} logout={logout} />}

            {activeView === "notifications" && (
              <NotificationListView
                notifications={filteredNotifications}
                unreadCount={notificationsUnread}
                loading={loading}
                onRefresh={loadAll}
                onMarkRead={markNotificationRead}
                onMarkAllRead={markAllNotificationsRead}
              />
            )}
          </div>
        </main>
      </div>

      {modalVisit && (
        <ResultModal
          key={modalVisit.id}
          visit={modalVisit}
          protocol={modalProtocol}
          protocolPresentation={modalPresentation}
          fields={modalFields}
          onClose={() => setModalVisitId(null)}
          onSave={handleSave}
          saving={savingResult}
        />
      )}
    </div>
  );
}
