import { useEffect, useMemo, useState } from "react";
import { AdminButton, Panel, PanelHeader, formInputStyle } from "../admin-helpers/adminUi.jsx";

const ROOM_META = [
  {
    key: "urgent_room_total",
    descriptionKey: "urgent_room_description",
    tagsKey: "urgent_room_tags",
    labelsKey: "urgent_room_labels",
    title: "Sala de Observacao",
    subtitle: "Usada para casos urgentes.",
    accent: "#ef4444",
  },
  {
    key: "standard_room_total",
    descriptionKey: "standard_room_description",
    tagsKey: "standard_room_tags",
    labelsKey: "standard_room_labels",
    title: "Sala de Consulta Padrao",
    subtitle: "Usada para casos pouco urgentes.",
    accent: "#3b82f6",
  },
  {
    key: "quick_room_total",
    descriptionKey: "quick_room_description",
    tagsKey: "quick_room_tags",
    labelsKey: "quick_room_labels",
    title: "Sala de Consulta Rapida",
    subtitle: "Usada para casos nao urgentes.",
    accent: "#10b981",
  },
];

export function AdminRoomsView({ roomSettings, onSave, loading, saving }) {
  const settingsKey = [
    roomSettings?.urgent_room_total || 4,
    roomSettings?.standard_room_total || 4,
    roomSettings?.quick_room_total || 4,
  ].join(":");
  const [draft, setDraft] = useState(() => ({
    urgent_room_total: String(roomSettings?.urgent_room_total || 4),
    standard_room_total: String(roomSettings?.standard_room_total || 4),
    quick_room_total: String(roomSettings?.quick_room_total || 4),
    urgent_room_description: String(roomSettings?.urgent_room_description || ""),
    standard_room_description: String(roomSettings?.standard_room_description || ""),
    quick_room_description: String(roomSettings?.quick_room_description || ""),
    urgent_room_tags: Array.isArray(roomSettings?.urgent_room_tags) ? roomSettings.urgent_room_tags.join(", ") : "",
    standard_room_tags: Array.isArray(roomSettings?.standard_room_tags) ? roomSettings.standard_room_tags.join(", ") : "",
    quick_room_tags: Array.isArray(roomSettings?.quick_room_tags) ? roomSettings.quick_room_tags.join(", ") : "",
    urgent_room_labels: Array.isArray(roomSettings?.urgent_room_labels) ? roomSettings.urgent_room_labels.join(", ") : "",
    standard_room_labels: Array.isArray(roomSettings?.standard_room_labels) ? roomSettings.standard_room_labels.join(", ") : "",
    quick_room_labels: Array.isArray(roomSettings?.quick_room_labels) ? roomSettings.quick_room_labels.join(", ") : "",
  }));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const nextDraft = {
      urgent_room_total: String(roomSettings?.urgent_room_total || 4),
      standard_room_total: String(roomSettings?.standard_room_total || 4),
      quick_room_total: String(roomSettings?.quick_room_total || 4),
      urgent_room_description: String(roomSettings?.urgent_room_description || ""),
      standard_room_description: String(roomSettings?.standard_room_description || ""),
      quick_room_description: String(roomSettings?.quick_room_description || ""),
      urgent_room_tags: Array.isArray(roomSettings?.urgent_room_tags) ? roomSettings.urgent_room_tags.join(", ") : "",
      standard_room_tags: Array.isArray(roomSettings?.standard_room_tags) ? roomSettings.standard_room_tags.join(", ") : "",
      quick_room_tags: Array.isArray(roomSettings?.quick_room_tags) ? roomSettings.quick_room_tags.join(", ") : "",
      urgent_room_labels: Array.isArray(roomSettings?.urgent_room_labels) ? roomSettings.urgent_room_labels.join(", ") : "",
      standard_room_labels: Array.isArray(roomSettings?.standard_room_labels) ? roomSettings.standard_room_labels.join(", ") : "",
      quick_room_labels: Array.isArray(roomSettings?.quick_room_labels) ? roomSettings.quick_room_labels.join(", ") : "",
    };
    setDraft((current) =>
      current.urgent_room_total === nextDraft.urgent_room_total &&
      current.standard_room_total === nextDraft.standard_room_total &&
      current.quick_room_total === nextDraft.quick_room_total &&
      current.urgent_room_description === nextDraft.urgent_room_description &&
      current.standard_room_description === nextDraft.standard_room_description &&
      current.quick_room_description === nextDraft.quick_room_description &&
      current.urgent_room_tags === nextDraft.urgent_room_tags &&
      current.standard_room_tags === nextDraft.standard_room_tags &&
      current.quick_room_tags === nextDraft.quick_room_tags &&
      current.urgent_room_labels === nextDraft.urgent_room_labels &&
      current.standard_room_labels === nextDraft.standard_room_labels &&
      current.quick_room_labels === nextDraft.quick_room_labels
        ? current
        : nextDraft
    );
  }, [settingsKey, roomSettings]);

  const summary = useMemo(
    () =>
      ROOM_META.map((item) => ({
        ...item,
        total: Number(draft[item.key] || roomSettings?.[item.key] || 0),
        description: String(draft[item.descriptionKey] || roomSettings?.[item.descriptionKey] || ""),
        tags: String(draft[item.tagsKey] || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        labels: String(draft[item.labelsKey] || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
      })),
    [draft, roomSettings]
  );

  const submit = async () => {
    setMessage("");
    setError("");
    try {
      const payload = {
        urgent_room_total: Math.max(1, Number(draft.urgent_room_total || 1)),
        standard_room_total: Math.max(1, Number(draft.standard_room_total || 1)),
        quick_room_total: Math.max(1, Number(draft.quick_room_total || 1)),
        urgent_room_description: String(draft.urgent_room_description || "").trim(),
        standard_room_description: String(draft.standard_room_description || "").trim(),
        quick_room_description: String(draft.quick_room_description || "").trim(),
        urgent_room_tags: String(draft.urgent_room_tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        standard_room_tags: String(draft.standard_room_tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        quick_room_tags: String(draft.quick_room_tags || "")
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        urgent_room_labels: String(draft.urgent_room_labels || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
        standard_room_labels: String(draft.standard_room_labels || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
        quick_room_labels: String(draft.quick_room_labels || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean),
      };
      const saved = await onSave(payload);
      setDraft({
        urgent_room_total: String(saved?.urgent_room_total || payload.urgent_room_total),
        standard_room_total: String(saved?.standard_room_total || payload.standard_room_total),
        quick_room_total: String(saved?.quick_room_total || payload.quick_room_total),
        urgent_room_description: String(saved?.urgent_room_description || payload.urgent_room_description || ""),
        standard_room_description: String(saved?.standard_room_description || payload.standard_room_description || ""),
        quick_room_description: String(saved?.quick_room_description || payload.quick_room_description || ""),
        urgent_room_tags: Array.isArray(saved?.urgent_room_tags) ? saved.urgent_room_tags.join(", ") : payload.urgent_room_tags.join(", "),
        standard_room_tags: Array.isArray(saved?.standard_room_tags) ? saved.standard_room_tags.join(", ") : payload.standard_room_tags.join(", "),
        quick_room_tags: Array.isArray(saved?.quick_room_tags) ? saved.quick_room_tags.join(", ") : payload.quick_room_tags.join(", "),
        urgent_room_labels: Array.isArray(saved?.urgent_room_labels) ? saved.urgent_room_labels.join(", ") : payload.urgent_room_labels.join(", "),
        standard_room_labels: Array.isArray(saved?.standard_room_labels) ? saved.standard_room_labels.join(", ") : payload.standard_room_labels.join(", "),
        quick_room_labels: Array.isArray(saved?.quick_room_labels) ? saved.quick_room_labels.join(", ") : payload.quick_room_labels.join(", "),
      });
      setMessage("Configuracao de salas atualizada.");
    } catch (nextError) {
      setError(nextError.message || "Falha ao salvar salas.");
    }
  };

  return (
    <div className="admin-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 360px)", gap: 16 }}>
      <Panel className="dash-animate">
        <PanelHeader title="Configurar salas" subtitle="Estas capacidades refletem no painel da triagem." />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {error ? <div style={{ padding: "10px 12px", borderRadius: 12, background: "#fff1f2", color: "#9f1239", fontSize: 12 }}>{error}</div> : null}
          {message ? <div style={{ padding: "10px 12px", borderRadius: 12, background: "#ecfdf3", color: "#166534", fontSize: 12 }}>{message}</div> : null}

          {ROOM_META.map((item) => (
            <div
              key={item.key}
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 18,
                padding: 16,
                background: "#fbfdfb",
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 90px",
                gap: 16,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: item.accent }} />
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{item.title}</div>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{item.subtitle}</div>
                <textarea
                  value={draft[item.descriptionKey]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [item.descriptionKey]: event.target.value }))
                  }
                  placeholder="Descricao da sala"
                  style={{
                    ...formInputStyle,
                    marginTop: 10,
                    minHeight: 78,
                    resize: "vertical",
                    borderRadius: 16,
                  }}
                  disabled={loading || saving}
                />
                <input
                  value={draft[item.tagsKey]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [item.tagsKey]: event.target.value }))
                  }
                  placeholder="Tags separadas por virgula"
                  style={{
                    ...formInputStyle,
                    marginTop: 10,
                    borderRadius: 16,
                  }}
                  disabled={loading || saving}
                />
                <input
                  value={draft[item.labelsKey]}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [item.labelsKey]: event.target.value }))
                  }
                  placeholder="Nomes das salas separados por virgula"
                  style={{
                    ...formInputStyle,
                    marginTop: 10,
                    borderRadius: 16,
                  }}
                  disabled={loading || saving}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {summary
                    .find((summaryItem) => summaryItem.key === item.key)
                    ?.tags.map((tag) => (
                      <span
                        key={`${item.key}-${tag}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 10px",
                          borderRadius: 999,
                          background: "#ecfdf3",
                          border: "1px solid #bbf7d0",
                          color: "#166534",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                  {summary
                    .find((summaryItem) => summaryItem.key === item.key)
                    ?.labels.map((label) => (
                      <span
                        key={`${item.key}-${label}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "5px 10px",
                          borderRadius: 999,
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          color: "#1d4ed8",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        {label}
                      </span>
                    ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="50"
                value={draft[item.key]}
                onChange={(event) => setDraft((current) => ({ ...current, [item.key]: event.target.value }))}
                style={{ ...formInputStyle, width: 78, textAlign: "center", fontWeight: 700, justifySelf: "end" }}
                disabled={loading || saving}
              />
            </div>
          ))}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <AdminButton
              onClick={() =>
                setDraft({
                  urgent_room_total: String(roomSettings?.urgent_room_total || 4),
                  standard_room_total: String(roomSettings?.standard_room_total || 4),
                  quick_room_total: String(roomSettings?.quick_room_total || 4),
                  urgent_room_description: String(roomSettings?.urgent_room_description || ""),
                  standard_room_description: String(roomSettings?.standard_room_description || ""),
                  quick_room_description: String(roomSettings?.quick_room_description || ""),
                  urgent_room_tags: Array.isArray(roomSettings?.urgent_room_tags) ? roomSettings.urgent_room_tags.join(", ") : "",
                  standard_room_tags: Array.isArray(roomSettings?.standard_room_tags) ? roomSettings.standard_room_tags.join(", ") : "",
                  quick_room_tags: Array.isArray(roomSettings?.quick_room_tags) ? roomSettings.quick_room_tags.join(", ") : "",
                  urgent_room_labels: Array.isArray(roomSettings?.urgent_room_labels) ? roomSettings.urgent_room_labels.join(", ") : "",
                  standard_room_labels: Array.isArray(roomSettings?.standard_room_labels) ? roomSettings.standard_room_labels.join(", ") : "",
                  quick_room_labels: Array.isArray(roomSettings?.quick_room_labels) ? roomSettings.quick_room_labels.join(", ") : "",
                })
              }
              disabled={saving}
            >
              Cancelar
            </AdminButton>
            <AdminButton primary onClick={submit} disabled={saving || loading}>
              {saving ? "A guardar..." : "Aplicar"}
            </AdminButton>
          </div>
        </div>
      </Panel>

      <Panel className="dash-animate" style={{ animationDelay: "0.1s" }}>
        <PanelHeader title="Resumo rapido" subtitle="Capacidade total por tipo." />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          {summary.map((item) => (
            <div
              key={item.key}
              style={{
                padding: 16,
                borderRadius: 18,
                background: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ fontSize: 12, color: "#64748b" }}>{item.title}</div>
              <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>{item.description}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {item.tags.map((tag) => (
                  <span
                    key={`${item.key}-${tag}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      color: "#334155",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {item.labels.map((label) => (
                  <span
                    key={`${item.key}-${label}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#1d4ed8",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 8 }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: "#0f172a" }}>{item.total}</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>salas</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
