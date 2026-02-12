import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { clearAuth, getUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";

export default function Admin() {
  const nav = useNavigate();
  const me = getUser();
  const myId = me?.id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // form criar user
  const [fUsername, setFUsername] = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fFullName, setFFullName] = useState("");
  const [fRole, setFRole] = useState("DOCTOR");
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await api.listUsers();
      setUsers(data);
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
    nav("/login");
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
      });
      setFUsername("");
      setFPassword("");
      setFFullName("");
      setFRole("DOCTOR");
      await loadUsers();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (u) => {
    if (u.id === myId) return; // segurança extra
    setErr("");
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await loadUsers();
    } catch (e) {
      setErr(e.message);
    }
  };

  const resetPassword = async (u) => {
    if (u.id === myId) return; // segurança extra
    const newPassword = prompt(`Nova password para ${u.username}:`);
    if (!newPassword) return;

    setErr("");
    try {
      await api.resetUserPassword(u.id, newPassword);
      alert("Password redefinida com sucesso");
    } catch (e) {
      setErr(e.message);
    }
  };

  const deleteUser = async (u) => {
    if (u.id === myId) return; // segurança extra
    if (!confirm(`Apagar utilizador ${u.username}?`)) return;

    setErr("");
    try {
      await api.deleteUser(u.id);
      await loadUsers();
    } catch (e) {
      setErr(e.message);
    }
  };

  // ✅ remove o próprio admin logado da lista
  const visibleUsers = useMemo(() => {
    return users.filter((u) => u.id !== myId);
  }, [users, myId]);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Painel do Administrador</h1>
            <p className="text-sm text-slate-600">
              {me ? `${me.full_name} • ${me.role}` : ""}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadUsers}
              className="px-3 py-2 rounded-lg border bg-white text-sm"
            >
              Atualizar
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
            >
              Sair
            </button>
          </div>
        </div>

        {err && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {err}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Criar utilizador */}
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
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <button
                disabled={creating}
                className="w-full bg-slate-900 text-white p-2 rounded-lg disabled:opacity-60"
              >
                {creating ? "Criando..." : "Criar"}
              </button>

              <p className="text-xs text-slate-500">
                Apenas o administrador pode criar contas. Se alguém esquecer a password, deve
                contactar o administrador.
              </p>
            </form>
          </div>

          {/* Lista de utilizadores */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-lg">Utilizadores</h2>
              <span className="text-xs text-slate-500">
                Total: {visibleUsers.length}
              </span>
            </div>

            <div className="grid grid-cols-12 gap-2 p-3 bg-slate-100 text-xs font-semibold">
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Username</div>
              <div className="col-span-4">Nome</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2 text-right">Ações</div>
            </div>

            {loading ? (
              <div className="p-4 text-slate-600">Carregando...</div>
            ) : visibleUsers.length === 0 ? (
              <div className="p-4 text-slate-600">Sem utilizadores.</div>
            ) : (
              visibleUsers.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-12 gap-2 p-3 border-t text-sm items-center"
                >
                  <div className="col-span-1">{u.id}</div>
                  <div className="col-span-3 font-medium">{u.username}</div>
                  <div className="col-span-4">{u.full_name}</div>
                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-2">
                      <span>{u.role}</span>
                      {!u.is_active && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          INATIVO
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="col-span-2 flex justify-end gap-2">
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={u.id === myId}
                      className="px-2 py-1 rounded-lg border bg-white text-xs disabled:opacity-50"
                    >
                      {u.is_active ? "Desativar" : "Ativar"}
                    </button>

                    <button
                      onClick={() => resetPassword(u)}
                      disabled={u.id === myId}
                      className="px-2 py-1 rounded-lg border bg-white text-xs disabled:opacity-50"
                    >
                      Reset PW
                    </button>

                    <button
                      onClick={() => deleteUser(u)}
                      disabled={u.id === myId}
                      className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs disabled:opacity-50"
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
  );
}
