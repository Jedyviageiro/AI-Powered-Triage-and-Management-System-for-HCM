export default function ConfirmDialog({
  open = false,
  title = "Confirmar acao",
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
        background: "rgba(15, 23, 42, 0.38)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 18,
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        style={{
          width: "min(390px, 100%)",
          background: "#ffffff",
          border: "1px solid #e4ece7",
          borderRadius: 24,
          boxShadow: "0 32px 80px rgba(15, 23, 42, 0.22)",
          padding: "28px 24px 24px",
          textAlign: "center",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: "#e2e8f0",
            margin: "0 auto 22px",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#fff1f2",
            color: "#be123c",
            marginBottom: 18,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
        </div>
        <h2 id="confirm-dialog-title" style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
          {title}
        </h2>
        <p style={{ margin: "0 auto 24px", fontSize: 13, color: "#64748b", lineHeight: 1.65, maxWidth: 290 }}>
          {message}
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <button
            type="button"
            onClick={() => onConfirm?.()}
            disabled={busy}
            style={{
              border: 0,
              background: "#0c3a24",
              color: "#ffffff",
              borderRadius: 14,
              minHeight: 44,
              padding: "11px 18px",
              fontSize: 14,
              fontWeight: 700,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? "A processar..." : confirmLabel}
          </button>
          <button
            type="button"
            onClick={() => onClose?.()}
            disabled={busy}
            style={{
              border: 0,
              background: "transparent",
              color: "#64748b",
              borderRadius: 14,
              minHeight: 40,
              padding: "10px 18px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.7 : 1,
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
