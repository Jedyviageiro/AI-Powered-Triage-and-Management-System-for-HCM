import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { SHIFT_OPTIONS } from "../admin-helpers/adminConstants.js";
import { AdminButton, Avatar, Panel, PanelHeader, RoleBadge, ShiftBadge } from "../admin-helpers/adminUi.jsx";

export function AdminShiftsView({ users, onRefresh }) {
  const [drafts, setDrafts] = useState({});
  const [savingUserId, setSavingUserId] = useState(null);
  const [err, setErr] = useState("");

  const staff = useMemo(
    () => users.filter((user) => user.role === "DOCTOR" || user.role === "NURSE"),
    [users]
  );

  useEffect(() => {
    const nextDrafts = {};
    staff.forEach((user) => {
      nextDrafts[user.id] = user.assigned_shift_type || "MORNING";
    });
    setDrafts((current) => ({ ...nextDrafts, ...current }));
  }, [staff]);

  const shiftSummary = [
    {
      key: "MORNING",
      label: "Manha - 07:30-14:00",
      count: staff.filter((user) => (drafts[user.id] || user.assigned_shift_type) === "MORNING").length,
      color: "#3b82f6",
    },
    {
      key: "AFTERNOON",
      label: "Tarde - 14:00-20:00",
      count: staff.filter((user) => (drafts[user.id] || user.assigned_shift_type) === "AFTERNOON").length,
      color: "#22c55e",
    },
    {
      key: "NIGHT",
      label: "Noite - 20:00-08:00",
      count: staff.filter((user) => (drafts[user.id] || user.assigned_shift_type) === "NIGHT").length,
      color: "#a855f7",
    },
  ];

  const saveShift = async (user) => {
    setErr("");
    setSavingUserId(user.id);
    try {
      await api.updateUserShift(user.id, drafts[user.id] || "MORNING");
      await onRefresh();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 12,
        }}
      >
        {shiftSummary.map((item) => (
          <div
            key={item.key}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderLeft: `4px solid ${item.color}`,
              borderRadius: 18,
              padding: "18px",
              boxShadow: "0 18px 40px rgba(15, 23, 42, 0.04)",
            }}
          >
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748b" }}>
              {item.label}
            </div>
            <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{item.count}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>colaboradores</div>
          </div>
        ))}
      </div>

      {err ? (
        <div style={{ padding: "10px 14px", borderRadius: 14, background: "#fff1f2", color: "#9f1239", fontSize: 12 }}>
          {err}
        </div>
      ) : null}

      <Panel>
        <PanelHeader
          title="Atribuicao de turnos"
          subtitle="Apenas medicos e enfermeiros podem receber turno."
        />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["Colaborador", "Role", "Turno actual", "Novo turno", ""].map((heading) => (
                  <th
                    key={heading}
                    style={{
                      padding: "12px 14px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "22px 14px", color: "#94a3b8", fontSize: 13 }}>
                    Sem medicos ou enfermeiros.
                  </td>
                </tr>
              ) : (
                staff.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <Avatar user={user} size={40} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{user.full_name}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <RoleBadge role={user.role} />
                    </td>
                    <td style={{ padding: "14px" }}>
                      <ShiftBadge shift={user.assigned_shift_type} />
                    </td>
                    <td style={{ padding: "14px" }}>
                      <select
                        value={drafts[user.id] || user.assigned_shift_type || "MORNING"}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [user.id]: event.target.value }))
                        }
                        style={{
                          minWidth: 200,
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#0f172a",
                          fontSize: 13,
                        }}
                      >
                        {SHIFT_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <AdminButton primary small disabled={savingUserId === user.id} onClick={() => saveShift(user)}>
                        {savingUserId === user.id ? "A guardar..." : "Guardar"}
                      </AdminButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
