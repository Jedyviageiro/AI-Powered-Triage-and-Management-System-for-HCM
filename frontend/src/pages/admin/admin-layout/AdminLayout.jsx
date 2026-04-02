import AppNavbar from "../../../components/shared/layout/AppNavbar.jsx";
import { ADMIN_VIEW_META } from "../admin-config/adminNavigationConfig.jsx";
import { AdminButton } from "../admin-helpers/adminUi.jsx";

export function AdminLayout({
  children,
  me,
  loading,
  error,
  activeView,
  setActiveView,
  navSections,
  navListRef,
  navItemRefs,
  navIndicator,
  sidebarOpen,
  setSidebarOpen,
  onRefresh,
  onCreateClick,
  onLogout,
}) {
  const meta = ADMIN_VIEW_META[activeView] || { title: "Admin", subtitle: "" };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f8f5",
          color: "#64748b",
          fontFamily: "IBM Plex Sans, system-ui, sans-serif",
        }}
      >
        A carregar...
      </div>
    );
  }

  return (
    <div className="admin-page flex h-screen bg-gray-50">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .admin-page, .admin-page * { font-family: 'IBM Plex Sans', system-ui, sans-serif; }
        .admin-page button { border-radius: 999px !important; box-shadow: none !important; font-family: inherit; }
        .admin-page input:focus, .admin-page textarea:focus, .admin-page select:focus {
          outline: none;
          border-color: #165034 !important;
          box-shadow: 0 0 0 3px rgba(22, 80, 52, 0.12);
        }
        .sidebar { transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; background: #0c3a24; color: #ffffff; }
        .sidebar-open { width: 256px; }
        .sidebar-closed { width: 76px; }
        .sidebar nav { overflow-x: hidden; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(220,235,226,0.55) transparent; }
        .sidebar nav::-webkit-scrollbar { width: 8px; }
        .sidebar nav::-webkit-scrollbar-thumb { background: rgba(220,235,226,0.45); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
        .sidebar button:focus { outline: none; }
        .sidebar-closed nav { padding-left: 8px !important; padding-right: 8px !important; }
        .sidebar-closed .nav-item-wrap > button { justify-content: center; gap: 0 !important; padding-left: 10px !important; padding-right: 10px !important; }
        .sidebar-nav-btn { position: relative; border-radius: 0 !important; margin-left: 0; width: 100% !important; font-size: 12px; font-weight: 500; }
        .sidebar-open .sidebar-nav-btn { padding-left: 20px !important; }
        .nav-indicator { position: absolute; left: 0; width: 3px; background: #7fe0a0; border-radius: 0; transition: top 0.22s cubic-bezier(0.4,0,0.2,1), height 0.22s cubic-bezier(0.4,0,0.2,1), opacity 0.18s ease; pointer-events: none; }
        .nav-label { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .nav-label { opacity: 1; max-width: 200px; }
        .sidebar-closed .nav-label { opacity: 0; max-width: 0; }
        .logo-text { transition: opacity 0.2s ease, max-width 0.3s cubic-bezier(0.4,0,0.2,1); white-space: nowrap; overflow: hidden; }
        .sidebar-open .logo-text { opacity: 1; max-width: 200px; }
        .sidebar-closed .logo-text { opacity: 0; max-width: 0; }
        .nav-tooltip { position: absolute; left: calc(100% + 12px); top: 50%; transform: translateY(-50%); background: #111827; color: #fff; font-size: 12px; font-weight: 500; padding: 4px 10px; border-radius: 6px; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity 0.15s ease; z-index: 50; }
        .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity: 1; }
        .sidebar-open .nav-tooltip { display: none; }
        .nav-active { background: rgba(134, 214, 163, 0.14) !important; color: #ffffff !important; margin-right: -12px !important; width: calc(100% + 12px) !important; padding-left: 20px !important; border-radius: 0 !important; }
        .sidebar .nav-item-wrap, .sidebar .nav-item-wrap > button { border-radius: 0 !important; }
        .sidebar-closed .nav-active { padding-left: 0 !important; justify-content: center !important; }
        .sidebar-nav-inactive { color: rgba(255,255,255,0.78) !important; }
        .sidebar-nav-inactive:hover { background: rgba(255,255,255,0.06) !important; color: #ffffff !important; }
        .popup-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
          padding: 16px;
        }
        .popup-card {
          width: min(460px, 100%);
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
          padding: 18px;
        }
        .popup-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(156,163,175,0.75) rgba(0,0,0,0.03);
        }
        .popup-scroll::-webkit-scrollbar { width: 8px; }
        .popup-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.03); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.75); border-radius: 999px; }
        .popup-scroll::-webkit-scrollbar-thumb:hover { background: rgba(107,114,128,0.85); }
        .dash-animate { animation: adminFadeUp 0.45s ease forwards; opacity: 0; }
        .dash-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 18px 18px 16px;
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.04);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .dash-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.08);
        }
        @keyframes adminFadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 1024px) {
          .admin-main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 840px) {
          .admin-page { display: block !important; min-height: 100vh; }
          .sidebar { width: 100% !important; min-width: 100% !important; }
        }
      `}</style>

      <aside
        className={`sidebar flex flex-col flex-shrink-0 ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{ minHeight: "100vh" }}
      >
        <div className="p-4 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors text-white"
          >
            {sidebarOpen ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
          <div className="logo-text min-w-0">
            <div className="text-sm font-bold text-white leading-tight">Admin</div>
            <div className="text-xs font-medium" style={{ color: "#dcebe2" }}>
              Painel Administrativo
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3 pr-3 pl-0 overflow-y-auto overflow-x-hidden">
          <div ref={navListRef} className="space-y-4 relative">
            <div
              className="nav-indicator"
              style={{
                top: `${navIndicator?.top || 0}px`,
                height: `${navIndicator?.height || 0}px`,
                opacity: navIndicator?.opacity || 0,
              }}
            />
            {navSections.map((section) => (
              <div key={section.key}>
                {sidebarOpen ? (
                  <div className="px-3 pb-1 text-[11px] uppercase tracking-[0.08em] font-semibold text-white/35">
                    {section.title || section.label}
                  </div>
                ) : null}
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <div key={item.key} className="nav-item-wrap relative">
                      <button
                        ref={(element) => {
                          if (!navItemRefs?.current) return;
                          if (element) navItemRefs.current[item.key] = element;
                          else delete navItemRefs.current[item.key];
                        }}
                        onClick={() => setActiveView(item.key)}
                        className={`sidebar-nav-btn nav-item-btn w-full text-left px-3 py-2.5 text-[12px] font-medium transition-all flex items-center gap-3 relative focus:outline-none border-0 bg-transparent ${activeView === item.key ? "nav-active" : "sidebar-nav-inactive"}`}
                        style={activeView === item.key ? { borderRadius: 0, paddingLeft: sidebarOpen ? 20 : 0 } : undefined}
                      >
                        {item.icon}
                        <span className="nav-label">{item.label}</span>
                      </button>
                      <span className="nav-tooltip">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="p-3 border-t border-white/20">
          <div className="nav-item-wrap relative">
            <button
              onClick={onLogout}
              className="sidebar-nav-btn w-full px-3 py-2.5 text-[12px] font-medium sidebar-nav-inactive transition-colors flex items-center gap-3 border-0 bg-transparent"
            >
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="nav-label">Sair</span>
            </button>
            <span className="nav-tooltip">Sair</span>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppNavbar
          left={
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>{meta.title}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{meta.subtitle}</div>
            </div>
          }
          right={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <AdminButton onClick={onRefresh}>Actualizar</AdminButton>
              <AdminButton primary onClick={onCreateClick}>Novo utilizador</AdminButton>
            </div>
          }
          style={{ borderBottom: "1px solid #e2e8f0" }}
        />

        <main style={{ flex: 1, overflowY: "auto", background: "linear-gradient(180deg, #f8fbf8 0%, #f1f5f9 100%)" }}>
          <div style={{ maxWidth: 1320, margin: "0 auto", padding: "24px" }}>
            {error ? (
              <div
                style={{
                  marginBottom: 16,
                  padding: "12px 14px",
                  borderRadius: 14,
                  border: "1px solid #fecdd3",
                  background: "#fff1f2",
                  color: "#9f1239",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
