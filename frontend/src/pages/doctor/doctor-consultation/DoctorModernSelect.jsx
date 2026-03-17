import { Children, useEffect, useRef, useState } from "react";

export default function DoctorModernSelect({
  selectId,
  value,
  onChange,
  children,
  disabled = false,
  className = "",
  openModernSelect,
  setOpenModernSelect,
}) {
  const rootRef = useRef(null);
  const [openUp, setOpenUp] = useState(false);
  const options = Children.toArray(children)
    .map((child) => {
      if (!child || !child.props) return null;
      return { value: child.props.value, label: child.props.children };
    })
    .filter(Boolean);
  const selected = options.find((opt) => String(opt.value) === String(value));
  const isOpen = openModernSelect === selectId;

  useEffect(() => {
    if (!isOpen) return;
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const estimatedMenuHeight = Math.min(220, Math.max(120, options.length * 38 + 12));
    const shouldOpenUp = rect.bottom + estimatedMenuHeight > window.innerHeight - 10;
    setOpenUp(shouldOpenUp);
  }, [isOpen, options.length]);

  return (
    <div ref={rootRef} className={`relative modern-select-root ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpenModernSelect((prev) => (prev === selectId ? null : selectId))}
        className="w-full rounded-full border border-emerald-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-gray-800 transition-all hover:border-emerald-300 disabled:opacity-50"
      >
        <span className="block truncate pr-7">{selected?.label || "Selecionar"}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-700 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {isOpen && !disabled && (
        <div
          style={{
            position: "absolute",
            top: openUp ? "auto" : "calc(100% + 8px)",
            bottom: openUp ? "calc(100% + 8px)" : "auto",
            left: 0,
            right: 0,
            background: "#ffffff",
            border: "1px solid #dcebe2",
            borderRadius: "18px",
            padding: "6px",
            zIndex: 180,
            maxHeight: "220px",
            overflowY: "auto",
          }}
        >
          {options.map((opt) => {
            const active = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setOpenModernSelect(null);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  border: "none",
                  borderRadius: "999px",
                  background: active ? "#ecfdf3" : "transparent",
                  color: active ? "#14532d" : "#111827",
                  padding: "8px 10px",
                  minHeight: "36px",
                  fontSize: "12px",
                  fontWeight: active ? 700 : 600,
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
