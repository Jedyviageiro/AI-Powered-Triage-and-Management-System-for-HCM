export default function AppButton({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  style = {},
  ...props
}) {
  const palette =
    variant === "secondary"
      ? {
          background: "#ffffff",
          color: "#374151",
          border: "1px solid #d1d5db",
        }
      : variant === "ghost"
        ? {
            background: "transparent",
            color: "#165034",
            border: "1px solid transparent",
          }
        : {
            background: "#165034",
            color: "#ffffff",
            border: "1px solid #165034",
          };

  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      style={{
        minHeight: 40,
        padding: "9px 16px",
        borderRadius: 999,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease",
        ...palette,
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
