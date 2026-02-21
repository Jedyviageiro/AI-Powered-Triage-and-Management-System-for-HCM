import { useMemo, useState } from "react";

const formatWait = (m) => {
  if (m == null) return "-";
  if (m === 0) return "<1 min";
  if (m === 1) return "1 min";
  return `${m} min`;
};

const formatDateTime = (iso) => {
  if (!iso) return { time: "-", date: "" };
  const d = new Date(iso);
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  return { time, date };
};

const getInitials = (name = "") => {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const AVATAR_COLORS = [
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#ede9fe", text: "#5b21b6" },
  { bg: "#ffedd5", text: "#9a3412" },
  { bg: "#cffafe", text: "#164e63" },
  { bg: "#f3f4f6", text: "#374151" },
];

const avatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgente", dot: "#ef4444", text: "#b91c1c", bg: "#fef2f2" },
  LESS_URGENT: { label: "Menos Urgente", dot: "#f97316", text: "#c2410c", bg: "#fff7ed" },
  NOT_URGENT: { label: "Não Urgente", dot: "#22c55e", text: "#15803d", bg: "#f0fdf4" },
  NON_URGENT: { label: "Não Urgente", dot: "#22c55e", text: "#15803d", bg: "#f0fdf4" },
  HIGH: { label: "Urgente", dot: "#ef4444", text: "#b91c1c", bg: "#fef2f2" },
  MEDIUM: { label: "Menos Urgente", dot: "#f97316", text: "#c2410c", bg: "#fff7ed" },
  LOW: { label: "Não Urgente", dot: "#22c55e", text: "#15803d", bg: "#f0fdf4" },
};

const getPriority = (visit) => {
  const key = visit?.priority?.toUpperCase?.() || "";
  return PRIORITY_CONFIG[key] || { label: visit?.priority || "-", dot: "#94a3b8", text: "#64748b", bg: "#f8fafc" };
};

const PAGE_SIZE = 10;

function Avatar({ name }) {
  const initials = getInitials(name);
  const { bg, text } = avatarColor(name);
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: bg,
        color: text,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 700,
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}

function PriorityBadge({ visit }) {
  const cfg = getPriority(visit);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 20,
        background: cfg.bg,
        color: cfg.text,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0, display: "inline-block" }} />
      {cfg.label}
    </span>
  );
}

function Pagination({ page, total, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s",
    background: "#fff",
    color: "#374151",
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "20px 0 4px" }}>
      <button
        style={{ ...btnBase, gap: 4, width: "auto", padding: "0 12px", color: page === 1 ? "#cbd5e1" : "#374151", cursor: page === 1 ? "not-allowed" : "pointer" }}
        onClick={() => page > 1 && onChange(page - 1)}
        disabled={page === 1}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Anterior
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dots-${i}`} style={{ ...btnBase, border: "none", background: "none", cursor: "default", color: "#94a3b8" }}>
            ...
          </span>
        ) : (
          <button
            key={p}
            style={{ ...btnBase, background: p === page ? "#22c55e" : "#fff", color: p === page ? "#fff" : "#374151", border: p === page ? "1px solid #22c55e" : "1px solid #e2e8f0" }}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        )
      )}

      <button
        style={{ ...btnBase, gap: 4, width: "auto", padding: "0 12px", color: page === totalPages ? "#cbd5e1" : "#374151", cursor: page === totalPages ? "not-allowed" : "pointer" }}
        onClick={() => page < totalPages && onChange(page + 1)}
        disabled={page === totalPages}
      >
        Próximo
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
    </div>
  );
}

export default function DoctorQueuePanel({
  queue = [],
  loading = false,
  onRefresh,
  onOpenVisit,
  me,
  selectedVisitId,
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const filtered = useMemo(() => {
    return queue.filter((v) => {
      const matchSearch =
        !search ||
        (v.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.clinical_code || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || v.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [queue, search, filterStatus]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  return (
    <div>
      <style>{`
        .queue-root * { box-sizing: border-box; }
        .queue-row { transition: background 0.1s; cursor: default; }
        .queue-row:hover td { background: #f8fafc !important; }
        .open-btn {
          padding: 6px 14px; border-radius: 8px; border: 1px solid #d1d5db;
          background: #fff; color: #374151; font-size: 12px; font-weight: 600;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .open-btn:hover { background: #22c55e; color: #fff; border-color: #22c55e; }
        .open-btn.active { background: #22c55e; color: #fff; border-color: #22c55e; }
        .filter-btn {
          padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 500;
          border: 1px solid #d1d5db; background: #fff; color: #4b5563;
          cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .filter-btn.active { background: #22c55e; color: #fff; border-color: #22c55e; }
        .filter-btn:not(.active):hover { background: #f3f4f6; }
        .search-input {
          padding: 8px 14px 8px 38px; border: 1px solid #d1d5db; border-radius: 10px;
          font-size: 13px; color: #0f172a; background: #fff; width: 240px;
          transition: border-color 0.15s;
        }
        .search-input:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.12); }
      `}</style>

      <div className="queue-root">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", margin: 0 }}>Fila de Pacientes</h1>
            <p style={{ color: "#64748b", marginTop: 4, fontSize: 14, margin: "4px 0 0" }}>
              {queue.length} paciente{queue.length !== 1 ? "s" : ""} no sistema
              {me?.specialization ? ` · Esp.: ${me.specialization}` : ""}
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: "#16a34a",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
            </svg>
            {loading ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {[
                { key: "ALL", label: "Todos" },
                { key: "WAITING_DOCTOR", label: "Aguardando" },
                { key: "IN_CONSULTATION", label: "Em Consulta" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`filter-btn${filterStatus === key ? " active" : ""}`}
                  onClick={() => {
                    setFilterStatus(key);
                    setPage(1);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ position: "relative" }}>
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="search-input"
                placeholder="Buscar paciente..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {loading && queue.length === 0 ? (
            <div style={{ padding: 48, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Carregando pacientes...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 56, textAlign: "center" }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "0 auto 12px" }}>
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#94a3b8" }}>Nenhum paciente encontrado</div>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  {["Nome", "Data / Chegada", "Triagem feita por", "Queixa Principal", "Prioridade", ""].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "11px 16px",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((v, idx) => {
                  const { time, date } = formatDateTime(v.arrival_time);
                  const nurseName = v.triage_nurse_name || v.triage?.nurse_name || "-";
                  const complaint = v.chief_complaint || v.triage?.chief_complaint || "-";
                  return (
                    <tr key={v.id} className="queue-row">
                      <td style={{ padding: "14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar name={v.full_name} />
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", lineHeight: 1.3 }}>{v.full_name || "-"}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", marginTop: 1 }}>{v.clinical_code || ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9", whiteSpace: "nowrap" }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", letterSpacing: "0.01em" }}>{time}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>{date}</div>
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}>
                        {nurseName !== "-" ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: "50%",
                                background: "#ede9fe",
                                color: "#5b21b6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 10,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(nurseName)}
                            </div>
                            <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{nurseName}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "#cbd5e1", fontStyle: "italic" }}>Sem triagem</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 24px 14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9", maxWidth: 280, minWidth: 220 }}>
                        <div
                          style={{
                            fontSize: 13,
                            color: "#334155",
                            fontWeight: 400,
                            lineHeight: 1.35,
                            paddingRight: 16,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                          title={complaint}
                        >
                          {complaint}
                        </div>
                        {v.wait_minutes != null && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>Espera: {formatWait(v.wait_minutes)}</div>}
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9" }}>
                        <PriorityBadge visit={v} />
                      </td>
                      <td style={{ padding: "14px 16px", borderTop: idx === 0 ? "none" : "1px solid #f1f5f9", textAlign: "right" }}>
                        <button className={`open-btn${selectedVisitId === v.id ? " active" : ""}`} onClick={() => onOpenVisit?.(v.id, v)}>
                          {selectedVisitId === v.id ? "Aberto" : "Abrir caso ->"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {filtered.length > PAGE_SIZE && (
            <div style={{ borderTop: "1px solid #f1f5f9", padding: "4px 20px 20px" }}>
              <Pagination page={page} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

