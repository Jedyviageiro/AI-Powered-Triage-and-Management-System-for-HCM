import { useMemo, useState } from "react";
import { api } from "../../../lib/api";
import { AdminPhotoPicker } from "../admin-helpers/AdminPhotoPicker.jsx";
import {
  AdminButton,
  Avatar,
  Panel,
  RoleBadge,
  ShiftBadge,
  StatusBadge,
} from "../admin-helpers/adminUi.jsx";

export function AdminUsersView({
  users,
  onRefresh,
  uploadingPhotoUserId,
  onUploadPhoto,
  canUpload,
}) {
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [err, setErr] = useState("");
  const [loadingId, setLoadingId] = useState(null);

  const tabs = [
    { key: "ALL", label: "Todos", count: users.length },
    { key: "DOCTOR", label: "Medicos", count: users.filter((user) => user.role === "DOCTOR").length },
    { key: "NURSE", label: "Enfermeiros", count: users.filter((user) => user.role === "NURSE").length },
    { key: "LAB_TECHNICIAN", label: "Lab.", count: users.filter((user) => user.role === "LAB_TECHNICIAN").length },
  ];

  const visibleUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      const matchesSearch =
        !query ||
        String(user.full_name || "").toLowerCase().includes(query) ||
        String(user.username || "").toLowerCase().includes(query);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, search]);

  const runAction = async (callback) => {
    setErr("");
    try {
      await callback();
      await onRefresh();
    } catch (error) {
      setErr(error.message);
    }
  };

  const toggleActive = async (user) => {
    await runAction(() => api.updateUser(user.id, { is_active: !user.is_active }));
  };

  const resetPassword = async (user) => {
    const nextPassword = window.prompt(`Nova password para ${user.username}:`);
    if (!nextPassword) return;
    setErr("");
    setLoadingId(user.id);
    try {
      await api.resetUserPassword(user.id, nextPassword);
      window.alert("Password redefinida com sucesso.");
    } catch (error) {
      setErr(error.message);
    } finally {
      setLoadingId(null);
    }
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Apagar utilizador ${user.username}?`)) return;
    await runAction(() => api.deleteUser(user.id));
  };

  return (
    <Panel style={{ overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "14px 18px", borderBottom: "1px solid #e2e8f0" }}>
        {tabs.map((tab) => {
          const active = roleFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "9px 12px",
                borderRadius: 999,
                border: active ? "1px solid #165034" : "1px solid #dbe5df",
                background: active ? "#ebfff1" : "#ffffff",
                color: active ? "#165034" : "#64748b",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {tab.label}
              <span
                style={{
                  minWidth: 20,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "#f1f5f9",
                  color: "#475569",
                  fontSize: 10,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          borderBottom: "1px solid #e2e8f0",
          background: "#fbfdfb",
        }}
      >
        <span style={{ color: "#94a3b8", fontSize: 14 }}>Pesquisar</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Nome ou username..."
          style={{
            flex: 1,
            border: "none",
            background: "transparent",
            fontSize: 13,
            color: "#0f172a",
            outline: "none",
          }}
        />
      </div>

      {err ? (
        <div style={{ padding: "10px 18px", background: "#fff1f2", color: "#9f1239", fontSize: 12 }}>
          {err}
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Utilizador", "Role", "Especializacao", "Turno", "Estado", "Foto", "Acoes"].map((heading) => (
                <th
                  key={heading}
                  style={{
                    padding: "12px 14px",
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "22px 14px", color: "#94a3b8", fontSize: 13 }}>
                  Sem utilizadores encontrados.
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
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
                  <td style={{ padding: "14px", fontSize: 13, color: "#475569" }}>
                    {user.specialization || <span style={{ color: "#cbd5e1" }}>-</span>}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <ShiftBadge shift={user.assigned_shift_type} />
                  </td>
                  <td style={{ padding: "14px" }}>
                    <StatusBadge active={user.is_active} />
                  </td>
                  <td style={{ padding: "14px" }}>
                    {(user.role === "DOCTOR" || user.role === "NURSE") ? (
                      <AdminPhotoPicker
                        compact
                        canUpload={canUpload}
                        uploading={uploadingPhotoUserId === user.id}
                        previewUrl={user.profile_photo_url}
                        buttonLabel="Foto"
                        onError={(error) => setErr(error.message)}
                        onUpload={(file) => onUploadPhoto(user, file)}
                      />
                    ) : (
                      <span style={{ color: "#cbd5e1", fontSize: 12 }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      <AdminButton small onClick={() => toggleActive(user)}>
                        {user.is_active ? "Desactivar" : "Activar"}
                      </AdminButton>
                      <AdminButton small disabled={loadingId === user.id} onClick={() => resetPassword(user)}>
                        Reset PW
                      </AdminButton>
                      <AdminButton small danger onClick={() => deleteUser(user)}>
                        Apagar
                      </AdminButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
