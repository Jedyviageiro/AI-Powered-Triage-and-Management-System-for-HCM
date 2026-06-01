import {
  ArrowLeft,
  Bell,
  CalendarClock,
  FlaskConical,
  LayoutDashboard,
  Mail,
  Search,
  UserRound,
} from "lucide-react";

const ICONS = {
  dashboard: LayoutDashboard,
  appointments: CalendarClock,
  lab: FlaskConical,
  records: UserRound,
};

export function HeaderTabs({ items = [], activeKey, onSelect }) {
  return (
    <nav style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, overflowX: "auto" }}>
      {items.map((item) => {
        const active = item.key === activeKey;
        const Icon = item.icon || ICONS[item.kind] || null;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect?.(item.key)}
            data-tour={item.tour ? `nav-${item.tour}` : undefined}
            style={{
              minHeight: 40,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: active ? "0 18px" : "0 12px",
              border: active ? "1px solid rgba(125, 211, 252, 0.7)" : "1px solid transparent",
              borderRadius: 999,
              background: active ? "linear-gradient(135deg, #21b9f1, #4bc7f4)" : "transparent",
              color: active ? "#ffffff" : "#52635a",
              boxShadow: active ? "0 10px 22px rgba(33, 185, 241, 0.24)" : "none",
              fontSize: 13,
              fontWeight: active ? 750 : 650,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "background 0.16s, color 0.16s, box-shadow 0.16s",
            }}
          >
            {Icon ? <Icon size={16} strokeWidth={2.1} /> : null}
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

export function HeaderSearch({ value, onChange, onFocus, onBlur, onEnter, placeholder }) {
  return (
    <div
      data-tour="top-search"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "min(340px, 34vw)",
        minWidth: 220,
        background: "#ffffff",
        border: "1px solid rgba(226, 232, 240, 0.88)",
        borderRadius: 999,
        padding: "10px 18px",
        boxShadow: "none",
      }}
    >
      <Search size={17} color="#7b8b82" strokeWidth={2.2} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter?.();
        }}
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          boxShadow: "none",
          fontSize: 13,
          color: "#24352d",
          width: "100%",
          minWidth: 0,
          padding: 0,
          fontFamily: "inherit",
          WebkitAppearance: "none",
          appearance: "none",
        }}
      />
    </div>
  );
}

export function HeaderBackButton({ onClick, label = "Voltar para dashboard" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        minHeight: 40,
        display: "inline-flex",
        alignItems: "center",
        gap: 9,
        padding: "0 14px",
        border: "1px solid rgba(220, 229, 224, 0.9)",
        borderRadius: 999,
        background: "#ffffff",
        color: "#24352d",
        fontSize: 13,
        fontWeight: 750,
        cursor: "pointer",
        boxShadow: "none",
        whiteSpace: "nowrap",
      }}
    >
      <ArrowLeft size={17} strokeWidth={2.2} />
      {label}
    </button>
  );
}

export function HeaderIconButton({ children, active = false, title, onClick, badge = 0, tour }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      data-tour={tour}
      onClick={onClick}
      style={{
        width: 42,
        height: 42,
        borderRadius: "50%",
        border: "1px solid rgba(226, 232, 240, 0.9)",
        background: active ? "#e7f4ee" : "#ffffff",
        color: active ? "#165034" : "#5f6f66",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        boxShadow: "0 12px 24px rgba(15, 23, 42, 0.06)",
      }}
    >
      {children}
      {badge > 0 ? (
        <span
          style={{
            position: "absolute",
            top: 1,
            right: 0,
            minWidth: 17,
            height: 17,
            borderRadius: 999,
            background: "#ef4444",
            border: "2px solid #fff",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export function HeaderProfile({ user, fallback = "U", initials, subtitle }) {
  const name = user?.full_name || user?.username || fallback;
  const photoUrl = String(user?.profile_photo_url || "").trim();
  const computedInitials =
    initials ||
    String(name)
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <div style={{ minWidth: 0, textAlign: "right" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 750,
            color: "#24352d",
            maxWidth: 190,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        {subtitle ? (
          <div style={{ fontSize: 11, color: "#7b8b82", marginTop: 1 }}>{subtitle}</div>
        ) : null}
      </div>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid #ffffff",
          background: "linear-gradient(135deg, #0c3a24, #2d6f4e)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          boxShadow: "0 12px 24px rgba(15, 23, 42, 0.12)",
          flexShrink: 0,
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          computedInitials || fallback[0]
        )}
      </div>
    </div>
  );
}

export function HeaderMailIcon() {
  return <Mail size={18} strokeWidth={2.1} />;
}

export function HeaderBellIcon() {
  return <Bell size={18} strokeWidth={2.1} />;
}
