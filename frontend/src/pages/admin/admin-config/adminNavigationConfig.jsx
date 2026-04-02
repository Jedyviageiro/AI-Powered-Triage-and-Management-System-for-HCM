function DashboardIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ShiftsIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function CreateIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function RoomsIcon() {
  return (
    <svg
      className="w-5 h-5 flex-shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 21V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14" />
      <path d="M9 21V12h6v9" />
      <path d="M9 9h.01" />
      <path d="M15 9h.01" />
    </svg>
  );
}

export const ADMIN_NAV_SECTIONS = [
  {
    key: "overview",
    title: "Geral",
    items: [
      { key: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
      { key: "users", label: "Utilizadores", icon: <UsersIcon /> },
    ],
  },
  {
    key: "management",
    title: "Gestao",
    items: [
      { key: "rooms", label: "Salas", icon: <RoomsIcon /> },
      { key: "shifts", label: "Turnos", icon: <ShiftsIcon /> },
      { key: "create", label: "Criar Conta", icon: <CreateIcon /> },
    ],
  },
];

export const ADMIN_VIEW_META = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Visao geral do sistema e da equipa ativa.",
  },
  users: {
    title: "Utilizadores",
    subtitle: "Gerir contas, estados, passwords e fotos de perfil.",
  },
  shifts: {
    title: "Turnos",
    subtitle: "Atribuir turnos para medicos e enfermeiros.",
  },
  rooms: {
    title: "Salas",
    subtitle: "Monitorar capacidade e ajustar salas do sistema.",
  },
  create: {
    title: "Criar Conta",
    subtitle: "Adicionar novos utilizadores ao sistema.",
  },
};
