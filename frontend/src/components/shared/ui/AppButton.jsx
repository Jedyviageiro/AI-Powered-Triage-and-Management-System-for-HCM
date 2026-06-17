export default function AppButton({
  children,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
  style = {},
  size = "md",
  iconOnly = false,
  ...props
}) {
  const palette =
    variant === "secondary"
      ? {
          background: "#ffffff",
          color: "#101827",
          border: "1px solid #d5dde7",
          boxShadow: "none",
        }
      : variant === "ghost"
        ? {
            background: "transparent",
            color: "#165034",
            border: "1px solid transparent",
            boxShadow: "none",
          }
        : {
            background: "var(--hcm-primary-green, #008a4a)",
            color: "#ffffff",
            border: "1px solid var(--hcm-primary-green, #008a4a)",
            boxShadow: "none",
          };
  const sizes =
    size === "sm"
      ? { minHeight: 36, padding: iconOnly ? "0" : "0 14px", fontSize: 12 }
      : { minHeight: 40, padding: iconOnly ? "0" : "0 17px", fontSize: 12 };

  return (
    <button
      type={type}
      disabled={disabled}
      className={className}
      style={{
        minWidth: iconOnly ? sizes.minHeight : undefined,
        ...sizes,
        borderRadius: 7,
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontWeight: 600,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        lineHeight: 1.1,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        whiteSpace: "nowrap",
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
