export default function NotificationListView({
  notifications = [],
  unreadCount = 0,
  loading = false,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
}) {
  return (
    <div className="dash-animate dash-animate-delay-1">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Notificações</h1>
          <p className="text-sm text-gray-500">{unreadCount} não lida(s)</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button type="button" onClick={onMarkAllRead} className="btn-secondary" style={{ width: "auto", padding: "9px 14px", fontSize: "13px" }}>
            Marcar tudo como lido
          </button>
          <button type="button" onClick={onRefresh} disabled={loading} className="btn-primary" style={{ width: "auto", padding: "9px 14px", fontSize: "13px" }}>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="form-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading && notifications.length === 0 ? (
          <div style={{ padding: "16px", display: "grid", gap: "10px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton-line" style={{ height: "16px", width: i % 2 === 0 ? "100%" : "90%" }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "#9ca3af", fontSize: "14px", fontWeight: 600 }}>
            Sem notificações.
          </div>
        ) : (
          <div style={{ display: "grid" }}>
            {notifications.map((n) => {
              const level = String(n?.level || "INFO").toUpperCase();
              const levelColor = level === "CRITICAL" ? "#ef4444" : level === "WARNING" ? "#f59e0b" : "#165034";
              const isUnread = !n?.read_at;
              return (
                <div
                  key={n.id}
                  style={{
                    borderBottom: "1px solid #f1f5f9",
                    padding: "12px 14px",
                    background: isUnread ? "#f8fafc" : "#ffffff",
                    display: "grid",
                    gap: "6px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: levelColor }} />
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#111827" }}>{n.title || "Notificação"}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString("pt-PT") : "-"}
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "#4b5563", lineHeight: 1.4 }}>{n.message || "-"}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "11px", color: "#9ca3af" }}>{n.source ? `Fonte: ${n.source}` : ""}</div>
                    {isUnread ? (
                      <button
                        type="button"
                        onClick={() => onMarkRead?.(n.id)}
                        className="btn-secondary"
                        style={{ width: "auto", minHeight: "32px", padding: "6px 10px", fontSize: "12px" }}
                      >
                        Marcar como lida
                      </button>
                    ) : (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>Lida</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

