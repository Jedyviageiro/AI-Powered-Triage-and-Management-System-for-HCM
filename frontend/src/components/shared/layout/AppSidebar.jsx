export default function AppSidebar({
  children = null,
  open = true,
  style = {},
  title = "",
  sections = [],
  activeKey = "",
  onToggle,
  onSelect,
  navListRef,
  navItemRefs,
  navIndicator,
  footerActionLabel = "",
  onFooterAction,
}) {
  const logoImage = "/assets/system%27s%20logo%20v2.png";
  const navItems = sections.flatMap((section) => section.items || []);

  if (children) {
    return (
      <aside
        style={{
          width: open ? 216 : 76,
          overflow: "hidden",
          background: "#ffffff",
          color: "#101827",
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
          ...style,
        }}
      >
        {children}
      </aside>
    );
  }

  return (
    <aside
      className={`sidebar flex flex-col flex-shrink-0 ${open ? "sidebar-open" : "sidebar-closed"}`}
      style={style}
      data-tour="role-sidebar"
    >
      <div className={`sidebar-brand-row flex items-center ${open ? "gap-3" : "justify-center"}`}>
        <button
          type="button"
          onClick={onToggle}
          className="hcm-brand-mark"
          aria-label={open ? "Recolher menu" : "Abrir menu"}
        >
          <img src={logoImage} alt="" aria-hidden="true" />
        </button>
        <div className="logo-text min-w-0">
          <div className="text-sm font-semibold leading-tight" style={{ color: "#101827" }}>{title}</div>
        </div>
      </div>

      <nav className="sidebar-nav flex-1">
        <div ref={navListRef} className="sidebar-nav-groups relative">
          {navIndicator ? (
            <span
              className="nav-indicator"
              style={{
                top: `${navIndicator.top}px`,
                height: `${navIndicator.height}px`,
                opacity: navIndicator.opacity,
              }}
            />
          ) : null}
          <div className="sidebar-section-items">
            {navItems.map((item) => (
              <div key={item.key} className="nav-item-wrap relative">
                <button
                  ref={(el) => {
                    if (!navItemRefs?.current) return;
                    if (el) navItemRefs.current[item.key] = el;
                    else delete navItemRefs.current[item.key];
                  }}
                  type="button"
                  onClick={() => onSelect?.(item.key)}
                  data-tour={`nav-${item.key}`}
                  className={`sidebar-nav-btn w-full text-left transition-all flex items-center relative ${
                    activeKey === item.key ? "nav-active" : "sidebar-nav-inactive"
                  }`}
                >
                  {item.icon}
                  <span className="nav-label">{item.label}</span>
                  {item.badgeDot && open ? (
                    <span className="ml-auto nav-badge-dot" aria-label="Novos itens" />
                  ) : null}
                  {item.badge && !item.badgeDot && open ? (
                    <span
                      className="ml-auto nav-badge-open text-white"
                      style={{ background: item.alertBadge ? "#dc2626" : "#165034" }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                  {item.badgeDot && !open ? (
                    <span className="nav-badge-dot nav-badge-dot-closed" aria-label="Novos itens" />
                  ) : null}
                  {item.badge && !item.badgeDot && !open ? (
                    <span
                      className="nav-badge absolute top-1 right-1 text-white text-xs px-1 py-0.5 rounded-full flex items-center justify-center"
                      style={{ background: item.alertBadge ? "#dc2626" : "#165034" }}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </button>
                <span className="nav-tooltip">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {footerActionLabel ? (
        <div className="sidebar-footer" style={{ borderTop: "1px solid #eef2f5", padding: 14 }}>
          <div className="nav-item-wrap relative">
            <button
              type="button"
              onClick={onFooterAction}
              data-tour="role-logout"
              className="sidebar-nav-btn w-full sidebar-nav-inactive transition-colors flex items-center"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
              >
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="nav-label">{footerActionLabel}</span>
            </button>
            <span className="nav-tooltip">{footerActionLabel}</span>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
