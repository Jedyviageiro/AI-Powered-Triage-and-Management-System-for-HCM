export default function ConfirmDialog({
  open = false,
  title = "Confirmar ação",
  message = "",
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  busy = false,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          borderRadius: "20px",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "#e5e5ea", margin: "10px auto 0" }} />
        <div style={{ padding: "16px 20px 14px", borderBottom: "0.5px solid rgba(0,0,0,.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "9999px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                background: "#fef3c7",
                color: "#b45309",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: "700", color: "#1c1c1e" }}>{title}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 20px", fontSize: "14px", color: "#4b5563", lineHeight: 1.6 }}>
          {message}
        </div>
        <div
          style={{
            padding: "14px 20px",
            borderTop: "0.5px solid rgba(0,0,0,.07)",
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "8px",
            background: "#fff",
          }}
        >
          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={busy}
            style={{
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#374151",
              borderRadius: "999px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.()}
            disabled={busy}
            style={{
              border: "1px solid #fecaca",
              background: "#fff1f2",
              color: "#b91c1c",
              borderRadius: "999px",
              padding: "10px 16px",
              fontSize: "13px",
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? "A processar..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
