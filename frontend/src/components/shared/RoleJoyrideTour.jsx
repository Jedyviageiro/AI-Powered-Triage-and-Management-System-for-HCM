import { useCallback, useEffect, useMemo, useState } from "react";
import { Joyride, STATUS } from "react-joyride";
import { HelpCircle } from "lucide-react";

const ROLE_TOUR_STORAGE_KEY = "pediatric-system-role-tour-seen";

const sharedLocale = {
  back: "Voltar",
  close: "Fechar",
  last: "Concluir",
  next: "Seguinte",
  open: "Abrir tutorial",
  skip: "Saltar",
};

const buildSteps = (role) => {
  const roleLabels = {
    doctor: "médico",
    nurse: "enfermagem",
    lab: "laboratório",
  };
  const roleLabel = roleLabels[role] || "utilizador";

  const commonStart = [
    {
      target: "body",
      placement: "center",
      title: "Bem-vindo",
      content: `Este tutorial mostra os pontos principais do painel de ${roleLabel}. Pode repetir quando quiser pelo botão de ajuda.`,
      disableBeacon: true,
    },
    {
      target: '[data-tour="role-sidebar"]',
      title: "Menu principal",
      content: "Use esta navegação para alternar entre as áreas de trabalho do seu perfil.",
    },
    {
      target: '[data-tour="top-search"]',
      title: "Pesquisa rápida",
      content: "Procure pacientes, códigos clínicos, filas ou exames sem sair da página atual.",
    },
  ];

  if (role === "doctor") {
    return [
      ...commonStart,
      {
        target: '[data-tour="shift-status"]',
        title: "Turno médico",
        content: "Confira o estado do turno e inicie o atendimento quando estiver disponível.",
      },
      {
        target: '[data-tour="nav-waitingQueue"]',
        title: "Fila de espera",
        content: "Aqui ficam os pacientes atribuídos e prontos para consulta.",
      },
      {
        target: '[data-tour="nav-agendaToday"]',
        title: "Agenda e retornos",
        content: "Use a agenda para acompanhar marcações, reavaliações e seguimentos.",
      },
      {
        target: '[data-tour="nav-labOrdered"]',
        title: "Exames",
        content: "Acompanhe pedidos laboratoriais, recolhas de amostra e resultados prontos.",
      },
      {
        target: '[data-tour="notifications"]',
        title: "Notificações",
        content: "Alertas importantes aparecem aqui, incluindo resultados, filas e avisos clínicos.",
      },
      {
        target: '[data-tour="role-content"]',
        title: "Área de trabalho",
        content: "O conteúdo principal muda conforme a opção selecionada no menu lateral.",
      },
    ];
  }

  if (role === "nurse") {
    return [
      ...commonStart,
      {
        target: '[data-tour="shift-status"]',
        title: "Turno de enfermagem",
        content: "Controle a disponibilidade do turno antes de organizar triagens e filas.",
      },
      {
        target: '[data-tour="nav-newTriage"]',
        title: "Nova triagem",
        content: "Registe pacientes, sinais vitais, prioridade e encaminhamento inicial.",
      },
      {
        target: '[data-tour="nav-queue"]',
        title: "Fila",
        content: "Acompanhe pacientes em espera, prioridades e próximos passos.",
      },
      {
        target: '[data-tour="nav-patients"]',
        title: "Pacientes",
        content: "Consulte histórico, visitas anteriores e dados administrativos do paciente.",
      },
      {
        target: '[data-tour="notifications"]',
        title: "Notificações",
        content: "Veja mudanças de estado, avisos e mensagens relevantes para a equipa.",
      },
      {
        target: '[data-tour="role-content"]',
        title: "Área de trabalho",
        content: "É aqui que a triagem, a fila e os detalhes do paciente são apresentados.",
      },
    ];
  }

  return [
    ...commonStart,
    {
      target: '[data-tour="nav-pending"]',
      title: "Exames pendentes",
      content: "Veja amostras e pedidos que ainda precisam de resultado.",
    },
    {
      target: '[data-tour="nav-insert"]',
      title: "Inserir resultados",
      content: "Abra os pedidos prontos para registar resultados laboratoriais.",
    },
    {
      target: '[data-tour="nav-ready"]',
      title: "Resultados prontos",
      content: "Acompanhe exames concluídos e prontos para comunicação clínica.",
    },
    {
      target: '[data-tour="notifications"]',
      title: "Notificações",
      content: "Use este atalho para ver avisos e atualizar o estado das mensagens.",
    },
    {
      target: '[data-tour="refresh-action"]',
      title: "Atualizar dados",
      content: "Recarregue a lista de exames quando precisar confirmar o estado mais recente.",
    },
    {
      target: '[data-tour="role-content"]',
      title: "Área de trabalho",
      content: "Os painéis, tabelas e formulários laboratoriais aparecem nesta área.",
    },
  ];
};

export default function RoleJoyrideTour({ role }) {
  const storageKey = `${ROLE_TOUR_STORAGE_KEY}:${role}`;
  const steps = useMemo(() => buildSteps(role), [role]);
  const [run, setRun] = useState(false);
  const [tourKey, setTourKey] = useState(0);

  useEffect(() => {
    if (!role) return;
    if (window.localStorage.getItem(storageKey) !== "true") {
      const timerId = window.setTimeout(() => setRun(true), 600);
      return () => window.clearTimeout(timerId);
    }
  }, [role, storageKey]);

  const markSeen = useCallback(() => {
    window.localStorage.setItem(storageKey, "true");
  }, [storageKey]);

  const handleCallback = useCallback(
    (data) => {
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
        setRun(false);
        markSeen();
      }
    },
    [markSeen]
  );

  const restartTour = () => {
    setTourKey((value) => value + 1);
    setRun(true);
  };

  return (
    <>
      <Joyride
        key={tourKey}
        callback={handleCallback}
        continuous
        hideCloseButton={false}
        locale={sharedLocale}
        run={run}
        scrollOffset={90}
        showProgress
        showSkipButton
        steps={steps}
        styles={{
          options: {
            arrowColor: "#ffffff",
            backgroundColor: "#ffffff",
            overlayColor: "rgba(15, 23, 42, 0.42)",
            primaryColor: "#165034",
            textColor: "#1f2937",
            zIndex: 2500,
          },
          tooltip: {
            borderRadius: 8,
            boxShadow: "0 18px 50px rgba(15, 23, 42, 0.18)",
          },
          tooltipTitle: {
            color: "#0f172a",
            fontSize: 16,
            fontWeight: 750,
          },
          tooltipContent: {
            fontSize: 13,
            lineHeight: 1.5,
            padding: "8px 0 12px",
          },
          buttonNext: {
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 700,
            padding: "8px 14px",
          },
          buttonBack: {
            color: "#4b5563",
            fontSize: 12,
            marginRight: 8,
          },
          buttonSkip: {
            color: "#64748b",
            fontSize: 12,
          },
        }}
      />
      <button
        type="button"
        onClick={restartTour}
        data-tour="tour-help"
        title="Abrir tutorial"
        aria-label="Abrir tutorial"
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          zIndex: 1200,
          width: 42,
          height: 42,
          borderRadius: "999px",
          border: "1px solid rgba(22,80,52,0.18)",
          background: "#165034",
          color: "#ffffff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 14px 30px rgba(15, 23, 42, 0.18)",
        }}
      >
        <HelpCircle size={19} strokeWidth={2.2} />
      </button>
    </>
  );
}
