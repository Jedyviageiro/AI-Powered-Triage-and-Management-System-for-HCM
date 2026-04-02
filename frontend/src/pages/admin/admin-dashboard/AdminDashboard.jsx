import { RoleBadge, Panel, PanelHeader, Avatar, AdminButton, ShiftBadge } from "../admin-helpers/adminUi.jsx";

export function AdminDashboardView({ users, onNavigate }) {
  const doctors = users.filter((user) => user.role === "DOCTOR" && user.is_active);
  const nurses = users.filter((user) => user.role === "NURSE" && user.is_active);
  const labTechs = users.filter((user) => user.role === "LAB_TECHNICIAN" && user.is_active);
  const inactive = users.filter((user) => !user.is_active);
  const staff = users.filter((user) => user.role === "DOCTOR" || user.role === "NURSE");

  const shiftCounts = {
    MORNING: staff.filter((user) => user.assigned_shift_type === "MORNING").length,
    AFTERNOON: staff.filter((user) => user.assigned_shift_type === "AFTERNOON").length,
    NIGHT: staff.filter((user) => user.assigned_shift_type === "NIGHT").length,
  };
  const totalShiftCount = Math.max(staff.length, 1);

  const stats = [
    { label: "Medicos activos", value: doctors.length, sub: "Em servico", dot: "#22c55e" },
    { label: "Enfermeiros activos", value: nurses.length, sub: "Em servico", dot: "#3b82f6" },
    { label: "Lab. tecnicos activos", value: labTechs.length, sub: "Disponiveis", dot: "#a855f7" },
    { label: "Contas inactivas", value: inactive.length, sub: "Precisam de atencao", dot: "#ef4444" },
  ];

  const shiftBars = [
    { key: "MORNING", label: "Manha - 07:30", count: shiftCounts.MORNING, bg: "#dbeafe", color: "#1e40af" },
    { key: "AFTERNOON", label: "Tarde - 14:00", count: shiftCounts.AFTERNOON, bg: "#d1fae5", color: "#065f46" },
    { key: "NIGHT", label: "Noite - 20:00", count: shiftCounts.NIGHT, bg: "#ede9fe", color: "#6d28d9" },
  ];

  const roleDistribution = [
    { label: "Medicos", count: users.filter((user) => user.role === "DOCTOR").length, color: "#3b82f6" },
    { label: "Enfermeiros", count: users.filter((user) => user.role === "NURSE").length, color: "#22c55e" },
    { label: "Lab. tecnicos", count: users.filter((user) => user.role === "LAB_TECHNICIAN").length, color: "#a855f7" },
  ];
  const maxRoleCount = Math.max(...roleDistribution.map((item) => item.count), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {stats.map((item) => (
          <div
            key={item.label}
            className="dash-stat-card dash-animate"
            style={{
              animationDelay: `${stats.indexOf(item) * 0.05}s`,
            }}
          >
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>{item.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{item.value}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, fontSize: 12, color: "#64748b" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: item.dot }} />
              {item.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        className="admin-main-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(280px, 1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel className="dash-animate" style={{ animationDelay: "0.1s" }}>
            <PanelHeader title="Pessoal por turno" subtitle="Escala activa de hoje." />
            <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {shiftBars.map((item) => (
                <div key={item.key} style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 12, alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                  <div style={{ background: "#f8fafc", borderRadius: 999, height: 32, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.max((item.count / totalShiftCount) * 100, 8)}%`,
                        height: "100%",
                        background: item.bg,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        fontSize: 12,
                        fontWeight: 700,
                        transition: "width 0.3s ease",
                      }}
                    >
                      {item.count} {item.count === 1 ? "pessoa" : "pessoas"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="dash-animate" style={{ animationDelay: "0.15s" }}>
            <PanelHeader
              title="Colaboradores activos"
              subtitle="Ultimos perfis activos registados."
              right={<AdminButton small onClick={() => onNavigate("users")}>Ver todos</AdminButton>}
            />
            <div>
              {users.filter((user) => user.is_active).slice(0, 6).map((user, index, list) => (
                <div
                  key={user.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 18px",
                    borderBottom: index === list.length - 1 ? "none" : "1px solid #f1f5f9",
                  }}
                >
                  <Avatar user={user} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{user.full_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{user.username}</div>
                  </div>
                  <RoleBadge role={user.role} />
                  {user.assigned_shift_type ? <ShiftBadge shift={user.assigned_shift_type} /> : null}
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Panel className="dash-animate" style={{ animationDelay: "0.2s" }}>
            <PanelHeader title="Distribuicao por role" subtitle="Composicao actual da equipa." />
            <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>
              {roleDistribution.map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 3, background: item.color }} />
                    <span style={{ fontSize: 13, color: "#334155" }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 100, height: 8, borderRadius: 999, background: "#e2e8f0", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${(item.count / maxRoleCount) * 100}%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                    <span style={{ minWidth: 18, textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="dash-animate" style={{ animationDelay: "0.25s" }}>
            <PanelHeader title="Acoes rapidas" subtitle="Atalhos administrativos." />
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { key: "create", label: "Criar utilizador" },
                { key: "shifts", label: "Gerir turnos" },
                { key: "users", label: "Ver utilizadores" },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    cursor: "pointer",
                    color: "#0f172a",
                    fontSize: 13,
                    fontWeight: 700,
                    textAlign: "left",
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: "#94a3b8" }}>Abrir</span>
                </button>
              ))}
            </div>
          </Panel>

          {inactive.length ? (
            <Panel className="dash-animate" style={{ animationDelay: "0.3s" }}>
              <PanelHeader title="Contas inactivas" subtitle="Perfis desactivados recentemente." />
              <div>
                {inactive.map((user, index) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "12px 18px",
                      borderBottom: index === inactive.length - 1 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    <Avatar user={user} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{user.full_name}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{user.username}</div>
                    </div>
                    <RoleBadge role={user.role} />
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
