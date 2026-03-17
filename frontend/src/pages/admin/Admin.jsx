import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { clearAuth, getUser } from "../../lib/auth";

const SHIFT_OPTIONS = [
  { value: "MORNING", label: "Morning 07:30-14:00" },
  { value: "AFTERNOON", label: "Afternoon 14:00-20:00" },
  { value: "NIGHT", label: "Evening 20:00-08:00" },
];

export default function Admin() {
  const me = getUser();
  const myId = me?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [fUsername, setFUsername] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fFullName, setFFullName] = useState("");
  const [fRole, setFRole] = useState("DOCTOR");
  const [fSpecialization, setFSpecialization] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingShiftUserId, setSavingShiftUserId] = useState(null);
  const [shiftDrafts, setShiftDrafts] = useState({});

  const loadUsers = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
      setShiftDrafts((prev) => {
        const next = { ...prev };
        (Array.isArray(data) ? data : []).forEach((user) => {
          if (user?.role === "DOCTOR" || user?.role === "NURSE") {
            next[user.id] = String(user?.assigned_shift_type || prev[user.id] || "MORNING");
          }
        });
        return next;
      });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const logout = () => {
    clearAuth();
  };

  const createUser = async (e) => {
    e.preventDefault();
    setErr("");
    setCreating(true);
    try {
      await api.createUser({
        username: fUsername.trim(),
        password: fPassword,
        full_name: fFullName.trim(),
        role: fRole,
        specialization: fRole === "DOCTOR" ? fSpecialization.trim() || null : null,
      });
      setFUsername("");
      setFPassword("");
      setFFullName("");
      setFRole("DOCTOR");
      setFSpecialization("");
      await loadUsers();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u) => {
    if (u.id === myId) return;
    setErr("");
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await loadUsers();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetPassword = async (u) => {
    if (u.id === myId) return;
    const newPassword = window.prompt(`Nova password para ${u.username}:`);
    if (!newPassword) return;

    setErr("");
    try {
      await api.resetUserPassword(u.id, newPassword);
      window.alert("Password redefinida com sucesso");
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteUser = async (u) => {
    if (u.id === myId) return;
    if (!window.confirm(`Apagar utilizador ${u.username}?`)) return;

    setErr("");
    try {
      await api.deleteUser(u.id);
      await loadUsers();
    } catch (e) {
      setErr(e.message);
    }
  };

  const saveUserShift = async (u) => {
    if (!(u?.role === "DOCTOR" || u?.role === "NURSE")) return;
    const nextShift = String(shiftDrafts[u.id] || u.assigned_shift_type || "MORNING");
    setErr("");
    setSavingShiftUserId(u.id);
    try {
      const updated = await api.updateUserShift(u.id, nextShift);
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, ...updated } : item)));
      setShiftDrafts((prev) => ({
        ...prev,
        [u.id]: String(updated?.assigned_shift_type || nextShift),
      }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setSavingShiftUserId(null);
    }
  };

  const visibleUsers = useMemo(() => users.filter((u) => u.id !== myId), [users, myId]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Painel do Administrador</h1>
            <p className="text-sm text-slate-600">{me ? `${me.full_name} • ${me.role}` : ""}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={loadUsers} className="ui-btn ui-btn-ghost">
              Atualizar
            </button>
            <button onClick={logout} className="ui-btn ui-btn-primary">
              Sair
            </button>
          </div>
        </div>

        {err && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{err}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold text-lg mb-3">Criar Utilizador</h2>

            <form onSubmit={createUser} className="space-y-3">
              <div>
                <label className="text-sm font-medium">Nome completo</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={fFullName}
                  onChange={(e) => setFFullName(e.target.value)}
                  placeholder="Ex: Ana Silva"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Username</label>
                <input
                  className="w-full border rounded-lg p-2 mt-1"
                  value={fUsername}
                  onChange={(e) => setFUsername(e.target.value)}
                  placeholder="Ex: nurse.ana"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  type="password"
                  className="w-full border rounded-lg p-2 mt-1"
                  value={fPassword}
                  onChange={(e) => setFPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  className="w-full border rounded-lg p-2 mt-1"
                  value={fRole}
                  onChange={(e) => setFRole(e.target.value)}
                >
                  <option value="DOCTOR">DOCTOR</option>
                  <option value="NURSE">NURSE</option>
                  <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {fRole === "DOCTOR" && (
                <div>
                  <label className="text-sm font-medium">Especialização</label>
                  <input
                    className="w-full border rounded-lg p-2 mt-1"
                    value={fSpecialization}
                    onChange={(e) => setFSpecialization(e.target.value)}
                    placeholder="Ex: Pediatria geral"
                  />
                </div>
              )}

              <button disabled={creating} className="ui-btn ui-btn-primary w-full">
                {creating ? "Criando..." : "Criar"}
              </button>

              <p className="text-xs text-slate-500">
                Apenas o administrador pode criar contas. Se alguém esquecer a password, deve
                contactar o administrador.
              </p>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Utilizadores</h2>
              <span className="text-xs text-slate-500">Total: {visibleUsers.length}</span>
            </div>

            <div className="overflow-x-auto">
              <div
                className="grid gap-3 p-3 bg-slate-100 text-xs font-semibold min-w-[1120px]"
                style={{ gridTemplateColumns: "70px 170px 220px 150px 290px 260px" }}
              >
                <div>ID</div>
                <div>Username</div>
                <div>Nome</div>
                <div>Role</div>
                <div>Turno</div>
                <div className="text-right">Ações</div>
              </div>

              {loading ? (
                <div className="p-4 text-slate-600">Carregando...</div>
              ) : visibleUsers.length === 0 ? (
                <div className="p-4 text-slate-600">Sem utilizadores.</div>
              ) : (
                visibleUsers.map((u) => (
                  <div
                    key={u.id}
                    className="grid gap-3 p-3 border-t text-sm items-center min-w-[1120px]"
                    style={{ gridTemplateColumns: "70px 170px 220px 150px 290px 260px" }}
                  >
                    <div>{u.id}</div>
                    <div className="font-medium break-words">{u.username}</div>
                    <div className="break-words">{u.full_name}</div>
                    <div>
                      <span className="inline-flex items-center gap-2 flex-wrap">
                        <span>{u.role}</span>
                        {!u.is_active && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            INATIVO
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      {u.role === "DOCTOR" || u.role === "NURSE" ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="flex-1 border rounded-lg p-2 min-w-0"
                            value={shiftDrafts[u.id] || u.assigned_shift_type || "MORNING"}
                            onChange={(e) =>
                              setShiftDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                            }
                          >
                            {SHIFT_OPTIONS.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => saveUserShift(u)}
                            disabled={savingShiftUserId === u.id}
                            className="ui-btn ui-btn-ghost ui-btn-sm flex-shrink-0"
                          >
                            {savingShiftUserId === u.id ? "..." : "Salvar"}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 flex-wrap">
                      <button
                        onClick={() => toggleActive(u)}
                        className="ui-btn ui-btn-ghost ui-btn-sm"
                      >
                        {u.is_active ? "Desativar" : "Ativar"}
                      </button>

                      <button
                        onClick={() => resetPassword(u)}
                        className="ui-btn ui-btn-ghost ui-btn-sm"
                      >
                        Reset PW
                      </button>

                      <button
                        onClick={() => deleteUser(u)}
                        className="ui-btn ui-btn-danger ui-btn-sm"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
