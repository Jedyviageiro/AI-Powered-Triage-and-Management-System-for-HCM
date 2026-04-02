import { ROLE_LABELS, SHIFT_LABELS } from "./adminConstants.js";

const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1e40af" },
  { bg: "#d1fae5", color: "#065f46" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#ccfbf1", color: "#0f766e" },
];

function getAvatarColor(seed) {
  let hash = 0;
  const value = String(seed || "");
  for (let index = 0; index < value.length; index += 1) {
    hash = value.charCodeAt(index) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({ user, size = 36 }) {
  const photoUrl = String(user?.profile_photo_url || "").trim();
  const name = String(user?.full_name || user?.username || "?").trim();
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const tone = getAvatarColor(name);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        style={{
          width: size,
          height: size,
          borderRadius: "9999px",
          objectFit: "cover",
          border: "1px solid #e2e8f0",
          flexShrink: 0,
          background: "#fff",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "9999px",
        background: tone.bg,
        color: tone.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

export function ShiftBadge({ shift }) {
  if (!shift) return <span style={{ color: "#94a3b8", fontSize: 12 }}>-</span>;

  const styles = {
    MORNING: { background: "#fef9c3", color: "#854d0e" },
    AFTERNOON: { background: "#dbeafe", color: "#1e40af" },
    NIGHT: { background: "#ede9fe", color: "#6d28d9" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        ...styles[shift],
      }}
    >
      {SHIFT_LABELS[shift] || shift}
    </span>
  );
}

export function RoleBadge({ role }) {
  const styles = {
    DOCTOR: { background: "#dbeafe", color: "#1e40af" },
    NURSE: { background: "#d1fae5", color: "#065f46" },
    LAB_TECHNICIAN: { background: "#fce7f3", color: "#9d174d" },
    ADMIN: { background: "#f1f5f9", color: "#475569" },
  };

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        ...styles[role],
      }}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function StatusBadge({ active }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: active ? "#dcfce7" : "#fee2e2",
        color: active ? "#166534" : "#991b1b",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: active ? "#16a34a" : "#dc2626",
        }}
      />
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}

export function AdminButton({
  children,
  onClick,
  type = "button",
  primary = false,
  danger = false,
  small = false,
  disabled = false,
  style,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: small ? "5px 10px" : "8px 14px",
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        borderRadius: 999,
        border: `1px solid ${danger ? "#fca5a5" : primary ? "#165034" : "#cbd5e1"}`,
        background: danger
          ? "linear-gradient(180deg, #fff1f2 0%, #ffe4e6 100%)"
          : primary
            ? "linear-gradient(180deg, #1a5b39 0%, #0f4428 100%)"
            : "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
        color: danger ? "#9f1239" : primary ? "#ffffff" : "#334155",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        whiteSpace: "nowrap",
        boxShadow: primary ? "0 10px 24px rgba(12, 58, 36, 0.16)" : "0 6px 18px rgba(15, 23, 42, 0.05)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Panel({ children, style, className = "" }) {
  return (
    <section
      className={className}
      style={{
        background: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.04)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function PanelHeader({ title, subtitle = "", right = null }) {
  return (
    <div
      style={{
        padding: "16px 18px",
        borderBottom: "1px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{title}</div>
        {subtitle ? <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export const formInputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  fontSize: 13,
  background: "#ffffff",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};

export const formLabelStyle = {
  display: "block",
  marginBottom: 6,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#64748b",
};
