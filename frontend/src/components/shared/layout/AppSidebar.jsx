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
  if (children) {
    return (
      <aside
        style={{
          width: open ? 256 : 76,
          overflow: "hidden",
          background: "#0c3a24",
          color: "#ffffff",
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
    >
      <div className={`p-4 flex items-center ${open ? "gap-3" : "justify-center"}`}>
        <button
          type="button"
          onClick={onToggle}
          className="w-9 h-9 flex-shrink-0 flex items-center justify-center hover:bg-white/20 rounded-full transition-colors text-white"
        >
          {open ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
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
              stroke="#ffffff"
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
          <div className="text-sm font-semibold text-white leading-tight">{title}</div>
        </div>
      </div>

      <nav className="flex-1 py-3 pr-3 pl-0">
        <div ref={navListRef} className="relative space-y-2">
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
          {sections.map((section) => (
            <div key={section.title}>
              {open ? (
                <div className="px-3 pb-1 pl-6 text-[10px] uppercase tracking-[0.08em] text-gray-200/80 font-semibold">
                  {section.title}
                </div>
              ) : null}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div key={item.key} className="nav-item-wrap relative">
                    <button
                      ref={(el) => {
                        if (!navItemRefs?.current) return;
                        if (el) navItemRefs.current[item.key] = el;
                        else delete navItemRefs.current[item.key];
                      }}
                      type="button"
                      onClick={() => onSelect?.(item.key)}
                      className={`sidebar-nav-btn w-full text-left px-3 py-2.5 transition-all flex items-center gap-3 relative ${
                        activeKey === item.key ? "nav-active" : "sidebar-nav-inactive"
                      }`}
                    >
                      {item.icon}
                      <span className="nav-label">{item.label}</span>
                      {item.badge && open ? (
                        <span
                          className="ml-auto nav-badge-open text-white"
                          style={{ background: item.alertBadge ? "#dc2626" : "#165034" }}
                        >
                          {item.badge}
                        </span>
                      ) : null}
                      {item.badge && !open ? (
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
          ))}
        </div>
      </nav>

      {footerActionLabel ? (
        <div className="p-3 border-t border-white/20">
          <div className="nav-item-wrap relative">
            <button
              type="button"
              onClick={onFooterAction}
              className="sidebar-nav-btn w-full px-3 py-2.5 sidebar-nav-inactive transition-colors flex items-center gap-3"
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
