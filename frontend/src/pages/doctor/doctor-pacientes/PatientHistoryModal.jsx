import { useState } from "react";

const G = "#165034";
const G_PALE = "#F0FAF4";
const BORDER = "#E7ECE8";
const MUTED = "#6B7280";
const LABEL = "#9CA3AF";

const PALS = [
  { bg: "#D1FAE5", fg: "#065F46" },
  { bg: "#DBEAFE", fg: "#1E40AF" },
  { bg: "#EDE9FE", fg: "#5B21B6" },
  { bg: "#FCE7F3", fg: "#9D174D" },
  { bg: "#FEF3C7", fg: "#92400E" },
  { bg: "#CFFAFE", fg: "#155E75" },
];

const palOf = (name) => {
  let hash = 0;
  for (const c of name || "") hash += c.charCodeAt(0);
  return PALS[hash % PALS.length];
};

const iniOf = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const safeDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const fmtDate = (value) => {
  const parsed = safeDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtDT = (value) => {
  const parsed = safeDate(value);
  if (!parsed) return "-";
  return parsed.toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtTime = (value) => {
  const parsed = safeDate(value);
  if (!parsed) return "";
  return parsed.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calcAge = (dob) => {
  const birth = safeDate(dob);
  if (!birth) return null;
  const now = new Date();
  const years =
    now.getFullYear() -
    birth.getFullYear() -
    (now >= new Date(now.getFullYear(), birth.getMonth(), birth.getDate()) ? 0 : 1);
  if (years < 2) {
    const months = Math.floor((now - birth) / 1000 / 60 / 60 / 24 / 30.4375);
    return `${months} m`;
  }
  return `${years} a`;
};

const Avatar = ({ name, size = 56 }) => {
  const { bg, fg } = palOf(name);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.34,
        fontWeight: 800,
        flexShrink: 0,
        letterSpacing: "-0.01em",
      }}
    >
      {iniOf(name)}
    </div>
  );
};

const MicroLabel = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: LABEL,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

const renderValue = (value) => {
  if (value == null || value === "") {
    return <span style={{ color: "#D1D5DB", fontWeight: 400 }}>-</span>;
  }
  return value;
};

const InfoCard = ({ label, value, mono = false, accent = false, full = false }) => (
  <div
    style={{
      borderRadius: 16,
      border: `1px solid ${BORDER}`,
      background: accent ? G_PALE : "#fff",
      padding: "13px 15px",
      gridColumn: full ? "1 / -1" : "auto",
    }}
  >
    <MicroLabel>{label}</MicroLabel>
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color: accent ? G : "#111827",
        fontFamily: mono ? "'IBM Plex Mono', ui-monospace, monospace" : "inherit",
        lineHeight: 1.45,
        wordBreak: "break-word",
      }}
    >
      {renderValue(value)}
    </div>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {icon ? (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: G_PALE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      ) : null}
      <span
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#374151",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </span>
    </div>
    {children}
  </div>
);

const Badge = ({ label, bg = "#F3F4F6", color = "#374151", dot }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      background: bg,
      color,
      borderRadius: 999,
      padding: "3px 10px",
      fontSize: 11,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {dot ? (
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: dot,
          flexShrink: 0,
        }}
      />
    ) : null}
    {label}
  </span>
);

const VISIT_STATUS = {
  FINISHED: { label: "Finalizado", bg: "#F0FDF4", color: "#065F46", dot: "#10B981" },
  IN_CONSULTATION: {
    label: "Em consulta",
    bg: "#EFF6FF",
    color: "#1D4ED8",
    dot: "#3B82F6",
  },
  WAITING_DOCTOR: {
    label: "Aguardando médico",
    bg: "#FFF7ED",
    color: "#C2610C",
    dot: "#F97316",
  },
  CANCELLED: { label: "Cancelado", bg: "#F9FAFB", color: "#6B7280", dot: "#9CA3AF" },
  SCHEDULED: { label: "Agendado", bg: "#F0F9FF", color: "#0369A1", dot: "#38BDF8" },
};

const PRIORITY_STATUS = {
  URGENT: { label: "Urgente", bg: "#FEF2F2", color: "#DC2626", dot: "#EF4444" },
  LESS_URGENT: {
    label: "Pouco urgente",
    bg: "#FFF7ED",
    color: "#EA580C",
    dot: "#F97316",
  },
  NON_URGENT: {
    label: "Não urgente",
    bg: "#F0FDF4",
    color: "#059669",
    dot: "#10B981",
  },
};

const statusCfg = (value) =>
  VISIT_STATUS[String(value || "").toUpperCase()] || {
    label: value || "-",
    bg: "#F3F4F6",
    color: "#374151",
    dot: "#9CA3AF",
  };

const priorityCfg = (value) => PRIORITY_STATUS[String(value || "").toUpperCase()] || null;

const Divider = () => <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />;

const IC = {
  id: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  baby: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-1a6 6 0 0112 0v1" />
    </svg>
  ),
  vaccine: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v4M14 2v4M8 6h8l1 6H7L8 6z" />
      <path d="M9 12v8h6v-8" />
    </svg>
  ),
  chart: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  history: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  ),
  family: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-8 0v2M12 3a4 4 0 110 8 4 4 0 010-8z" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M1 21v-2a4 4 0 013-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  allergy: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  steth: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 2H6a2 2 0 012 2v8a6 6 0 006 6v0a6 6 0 006-6V4a2 2 0 012-2h1.5" />
      <circle cx="19" cy="17" r="2" />
    </svg>
  ),
  lab: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 2v7l-5 9a2 2 0 001.7 3h10.6a2 2 0 001.7-3l-5-9V2" />
      <line x1="8" y1="2" x2="16" y2="2" />
    </svg>
  ),
  diag: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 12h6m-3-3v6" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  rx: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  notes: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke={G}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
};

const VitalsStrip = ({ visit }) => {
  const items = [
    { k: "Temp.", v: visit.temperature, u: "degC" },
    { k: "SpO2", v: visit.oxygen_saturation, u: "%" },
    { k: "FC", v: visit.heart_rate, u: "bpm" },
    { k: "FR", v: visit.respiratory_rate, u: "rpm" },
    { k: "Peso", v: visit.weight, u: "kg" },
    { k: "TAS", v: visit.systolic_bp, u: "mmHg" },
    { k: "Perim.Cef.", v: visit.head_circumference, u: "cm" },
  ].filter((item) => item.v != null && item.v !== "");

  if (!items.length) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        flexWrap: "wrap",
        background: "#F8FAF9",
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        overflow: "hidden",
      }}
    >
      {items.map((item, index) => (
        <div
          key={item.k}
          style={{
            padding: "11px 16px",
            borderRight: index < items.length - 1 ? `1px solid ${BORDER}` : "none",
            minWidth: 72,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: LABEL,
            }}
          >
            {item.k}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.2,
              marginTop: 3,
            }}
          >
            {item.v}
            <span style={{ fontSize: 10, color: LABEL, marginLeft: 2 }}>{item.u}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const VisitHistoryRow = ({ visit, isLatest, isLast }) => {
  const [open, setOpen] = useState(isLatest);
  const sc = statusCfg(visit.status);
  const pc = priorityCfg(visit.priority);
  const hasDetail =
    visit.likely_diagnosis ||
    visit.prescription_text ||
    visit.clinical_reasoning ||
    visit.disposition_plan ||
    visit.temperature ||
    visit.oxygen_saturation;

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${isLatest ? "#B6DDCA" : BORDER}`,
        background: isLatest ? "#FAFFFE" : "#fff",
        marginBottom: isLast ? 0 : 10,
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: "100%",
          textAlign: "left",
          border: "none",
          background: "transparent",
          padding: "14px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ width: 78, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
            {fmtDate(visit.arrival_time)}
          </div>
          <div style={{ fontSize: 10, color: LABEL, marginTop: 1 }}>
            {fmtTime(visit.arrival_time)}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 3,
            }}
          >
            <Badge label={sc.label} bg={sc.bg} color={sc.color} dot={sc.dot} />
            {pc ? <Badge label={pc.label} bg={pc.bg} color={pc.color} dot={pc.dot} /> : null}
            {isLatest ? <Badge label="Mais recente" bg="#D1FAE5" color="#065F46" /> : null}
          </div>
          <div
            style={{
              fontSize: 12,
              color: MUTED,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {visit.chief_complaint || visit.triage_chief_complaint || "Sem queixa registada"}
          </div>
        </div>
        {hasDetail ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#C4CFC9"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              flexShrink: 0,
              transition: "transform 0.2s",
              transform: open ? "rotate(180deg)" : "none",
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        ) : null}
      </button>

      {open && hasDetail ? (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 14,
            animation: "fadeUp 0.15s ease",
          }}
        >
          <VitalsStrip visit={visit} />
          {visit.temperature || visit.oxygen_saturation ? (
            <div style={{ marginBottom: 10 }} />
          ) : null}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {[
              { label: "Diagnóstico provável", value: visit.likely_diagnosis },
              { label: "Prescrição", value: visit.prescription_text },
              { label: "Destino do paciente", value: visit.disposition_plan },
              { label: "Raciocínio clínico", value: visit.clinical_reasoning, full: true },
            ]
              .filter((field) => field.value)
              .map((field) => (
                <div
                  key={field.label}
                  style={{
                    gridColumn: field.full ? "1/-1" : "auto",
                    borderRadius: 12,
                    border: `1px solid ${BORDER}`,
                    background: "#FAFBFA",
                    padding: "10px 13px",
                  }}
                >
                  <MicroLabel>{field.label}</MicroLabel>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#374151",
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {field.value}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const TabIdentificacao = ({ patient }) => (
  <div>
    <Section title="Informações Pessoais" icon={IC.id}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <InfoCard label="Nome completo" value={patient.full_name} full />
        <InfoCard label="Data de nascimento" value={fmtDate(patient.birth_date)} />
        <InfoCard label="Idade" value={calcAge(patient.birth_date)} />
        <InfoCard label="Sexo" value={patient.gender || patient.sex} />
        <InfoCard label="ID / N.º do paciente" value={patient.clinical_code} mono accent />
      </div>
    </Section>
    <Divider />
    <Section title="Contactos e Encarregados" icon={IC.family}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <InfoCard
          label="Encarregado de educação"
          value={patient.guardian_name || patient.parent_name}
          full
        />
        <InfoCard
          label="Contacto do encarregado"
          value={patient.guardian_phone || patient.parent_phone}
          mono
        />
        <InfoCard label="Contacto alternativo" value={patient.alt_phone} mono />
        <InfoCard label="Morada" value={patient.address} full />
      </div>
    </Section>
  </div>
);

const TabNeonatal = ({ patient }) => (
  <div>
    <Section title="Parto e Dados Neonatais" icon={IC.baby}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <InfoCard
          label="Peso ao nascer"
          value={patient.birth_weight ? `${patient.birth_weight} g` : null}
        />
        <InfoCard
          label="Comprimento ao nascer"
          value={patient.birth_length ? `${patient.birth_length} cm` : null}
        />
        <InfoCard
          label="Idade gestacional"
          value={patient.gestational_age ? `${patient.gestational_age} semanas` : null}
        />
        <InfoCard label="Tipo de parto" value={patient.delivery_type} />
        <InfoCard
          label="APGAR (1 min)"
          value={patient.apgar_1min != null ? String(patient.apgar_1min) : null}
        />
        <InfoCard
          label="APGAR (5 min)"
          value={patient.apgar_5min != null ? String(patient.apgar_5min) : null}
        />
        <InfoCard
          label="Internamento UCIN"
          value={
            patient.nicu_admission
              ? `Sim${patient.nicu_days ? ` - ${patient.nicu_days}d` : ""}`
              : "Não"
          }
          accent={patient.nicu_admission}
        />
        <InfoCard label="Complicações na gravidez" value={patient.pregnancy_complications} full />
        <InfoCard label="Complicações no parto" value={patient.birth_complications} full />
      </div>
    </Section>
  </div>
);

const VaccineRow = ({ vaccine, index, isLast }) => {
  const isDone = vaccine.done || vaccine.administered;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "11px 14px",
        borderBottom: isLast ? "none" : `1px solid ${BORDER}`,
        background: index % 2 === 0 ? "#FAFBFA" : "#fff",
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDone ? "#D1FAE5" : "#FEF3C7",
          flexShrink: 0,
        }}
      >
        {isDone ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#059669"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#D97706"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
          {vaccine.name || vaccine.vaccine_name || "Vacina"}
        </div>
        {vaccine.reaction ? (
          <div style={{ fontSize: 11, color: "#DC2626", marginTop: 1 }}>
            Reação: {vaccine.reaction}
          </div>
        ) : null}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        {vaccine.date ? (
          <div
            style={{
              fontSize: 11,
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              color: MUTED,
            }}
          >
            {fmtDate(vaccine.date)}
          </div>
        ) : null}
        <Badge
          label={isDone ? "Administrada" : "Pendente"}
          bg={isDone ? "#F0FDF4" : "#FFF7ED"}
          color={isDone ? "#065F46" : "#92400E"}
        />
      </div>
    </div>
  );
};

const TabVacinacao = ({ patient }) => {
  const vaccines = patient.vaccines || patient.vaccination_history || [];
  const done = vaccines.filter((vaccine) => vaccine.done || vaccine.administered);
  const pending = vaccines.filter((vaccine) => !(vaccine.done || vaccine.administered));
  return (
    <div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}
      >
        {[
          { label: "Total de vacinas", value: vaccines.length },
          { label: "Administradas", value: done.length, green: true },
          { label: "Pendentes", value: pending.length, amber: pending.length > 0 },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              borderRadius: 16,
              border: `1px solid ${BORDER}`,
              background: stat.green ? G_PALE : stat.amber ? "#FFF7ED" : "#fff",
              padding: "14px 16px",
            }}
          >
            <MicroLabel>{stat.label}</MicroLabel>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: stat.green ? G : stat.amber ? "#92400E" : "#111827",
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <Section title="Registo de Vacinas" icon={IC.vaccine}>
        {vaccines.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: LABEL, fontSize: 13 }}>
            Sem registo de vacinacao.
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            {vaccines.map((vaccine, index) => (
              <VaccineRow
                key={index}
                vaccine={vaccine}
                index={index}
                isLast={index === vaccines.length - 1}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const TabCrescimento = ({ patient, visits }) => {
  const last =
    [...(visits || [])].sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time))[0] ||
    {};
  const milestones = patient.milestones || patient.development_milestones || [];
  return (
    <div>
      <Section title="Medidas Actuais" icon={IC.chart}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {[
            { label: "Peso", value: last.weight, unit: "kg" },
            { label: "Altura", value: last.height || patient.height, unit: "cm" },
            { label: "Perim. cefalico", value: last.head_circumference, unit: "cm" },
            { label: "IMC", value: last.bmi, unit: "kg/m2" },
          ].map((measure) => (
            <div
              key={measure.label}
              style={{
                borderRadius: 16,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                padding: "13px 14px",
              }}
            >
              <MicroLabel>{measure.label}</MicroLabel>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
                {measure.value != null && measure.value !== "" ? (
                  <>
                    {measure.value}
                    <span style={{ fontSize: 11, color: LABEL, marginLeft: 3 }}>
                      {measure.unit}
                    </span>
                  </>
                ) : (
                  <span style={{ color: "#D1D5DB", fontSize: 13 }}>-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </Section>
      <Divider />
      <Section title="Marcos do Desenvolvimento" icon={IC.chart}>
        {milestones.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: LABEL, fontSize: 13 }}>
            Sem marcos registados.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {milestones.map((milestone, index) => (
              <div
                key={index}
                style={{
                  borderRadius: 14,
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  padding: "11px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: milestone.achieved ? "#D1FAE5" : "#F3F4F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {milestone.achieved ? (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    {milestone.name || milestone.milestone}
                  </div>
                  {milestone.age_expected ? (
                    <div style={{ fontSize: 11, color: LABEL, marginTop: 1 }}>
                      Esperado: {milestone.age_expected}
                    </div>
                  ) : null}
                  {milestone.date_achieved ? (
                    <div style={{ fontSize: 11, color: "#059669", marginTop: 1 }}>
                      Atingido: {fmtDate(milestone.date_achieved)}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

const TabHistorialMedico = ({ patient, visits }) => {
  const sorted = [...(visits || [])].sort(
    (a, b) => new Date(b.arrival_time) - new Date(a.arrival_time)
  );
  const conditions = patient.chronic_conditions || patient.past_conditions || [];
  const surgeries = patient.surgeries || [];
  return (
    <div>
      <Section title="Condições Crónicas / Doenças Anteriores" icon={IC.history}>
        {conditions.length === 0 && !patient.past_diseases ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: LABEL, fontSize: 13 }}>
            Sem condições registadas.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(conditions.length ? conditions : [patient.past_diseases].filter(Boolean)).map(
              (condition, index) => (
                <div
                  key={index}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${BORDER}`,
                    background: "#fff",
                    padding: "11px 14px",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    {typeof condition === "string" ? condition : condition.name}
                  </div>
                  {condition?.since ? (
                    <div style={{ fontSize: 11, color: LABEL, marginTop: 2 }}>
                      Desde {fmtDate(condition.since)}
                    </div>
                  ) : null}
                  {condition?.treatment ? (
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                      {condition.treatment}
                    </div>
                  ) : null}
                </div>
              )
            )}
          </div>
        )}
      </Section>
      {surgeries.length > 0 ? (
        <>
          <Divider />
          <Section title="Cirurgias" icon={IC.rx}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {surgeries.map((surgery, index) => (
                <div
                  key={index}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${BORDER}`,
                    background: "#fff",
                    padding: "11px 14px",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                    {surgery.name || surgery.procedure || surgery}
                  </div>
                  {surgery?.date ? (
                    <div style={{ fontSize: 11, color: LABEL, marginTop: 2 }}>
                      {fmtDate(surgery.date)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>
        </>
      ) : null}
      <Divider />
      <Section title="Consultas Anteriores" icon={IC.history}>
        {sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: LABEL, fontSize: 13 }}>
            Sem consultas anteriores.
          </div>
        ) : (
          sorted.map((visit, index) => (
            <VisitHistoryRow
              key={visit.id || visit.visit_id || index}
              visit={visit}
              isLatest={index === 0}
              isLast={index === sorted.length - 1}
            />
          ))
        )}
      </Section>
    </div>
  );
};

const TabFamiliar = ({ patient }) => {
  const family = patient.family_history || [];
  const conditionIcons = {
    diabetes: "DG",
    hypertension: "HT",
    asthma: "AS",
    cancer: "CA",
    genetics: "GN",
    allergy: "AL",
  };
  return (
    <div>
      <Section title="Doenças Hereditárias / Familiares" icon={IC.family}>
        {family.length === 0 && !patient.family_diseases ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: LABEL, fontSize: 13 }}>
            Sem histórico familiar registado.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(family.length
              ? family
              : [{ name: patient.family_diseases }].filter((item) => item.name)
            ).map((entry, index) => {
              const badge = conditionIcons[String(entry.type || "").toLowerCase()] || "MD";
              return (
                <div
                  key={index}
                  style={{
                    borderRadius: 14,
                    border: `1px solid ${BORDER}`,
                    background: "#fff",
                    padding: "11px 14px",
                    display: "flex",
                    gap: 10,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      background: "#F3F4F6",
                      color: "#6B7280",
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {badge}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
                      {entry.name || entry.condition || entry}
                    </div>
                    {entry.relation ? (
                      <div style={{ fontSize: 11, color: LABEL, marginTop: 2 }}>
                        Relação: {entry.relation}
                      </div>
                    ) : null}
                    {entry.notes ? (
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{entry.notes}</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
      <Divider />
      <Section title="Condições Específicas na Família" icon={IC.family}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Diabetes", value: patient.family_diabetes },
            { label: "Hipertensão", value: patient.family_hypertension },
            { label: "Asma", value: patient.family_asthma },
            { label: "Alergias", value: patient.family_allergies },
            { label: "Doenças genéticas", value: patient.family_genetic_diseases, full: true },
            { label: "Outras condições", value: patient.family_other, full: true },
          ]
            .filter((field) => field.value)
            .map((field) => (
              <InfoCard
                key={field.label}
                label={field.label}
                value={field.value}
                full={field.full}
              />
            ))}
          {!patient.family_diabetes &&
          !patient.family_hypertension &&
          !patient.family_asthma &&
          family.length === 0 ? (
            <div
              style={{
                gridColumn: "1/-1",
                textAlign: "center",
                padding: "20px 0",
                color: LABEL,
                fontSize: 13,
              }}
            >
              Sem informações detalhadas registadas.
            </div>
          ) : null}
        </div>
      </Section>
    </div>
  );
};

const TabAlergias = ({ patient }) => {
  const allergies = patient.allergies || [];
  const severityMap = {
    high: { label: "Grave", bg: "#FEF2F2", color: "#DC2626" },
    medium: { label: "Moderada", bg: "#FFF7ED", color: "#EA580C" },
    low: { label: "Leve", bg: "#FEFCE8", color: "#A16207" },
  };

  return (
    <div>
      {allergies.length === 0 && !patient.drug_allergies && !patient.food_allergies ? (
        <div style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
            Sem alergias conhecidas
          </div>
          <div style={{ fontSize: 12, color: LABEL, marginTop: 4 }}>
            Nenhuma alergia registada para este paciente.
          </div>
        </div>
      ) : (
        <Section title="Alergias Registadas" icon={IC.allergy}>
          {allergies.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allergies.map((allergy, index) => {
                const severity = severityMap[String(allergy.severity || "").toLowerCase()] || null;
                return (
                  <div
                    key={index}
                    style={{
                      borderRadius: 16,
                      border: `2px solid ${allergy.severity === "high" ? "#FECACA" : BORDER}`,
                      background: allergy.severity === "high" ? "#FFF5F5" : "#fff",
                      padding: "14px 16px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#FEF2F2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                          {allergy.name || allergy.allergen}
                        </span>
                        {severity ? (
                          <Badge label={severity.label} bg={severity.bg} color={severity.color} />
                        ) : null}
                        {allergy.type ? (
                          <Badge label={allergy.type} bg="#F3F4F6" color={MUTED} />
                        ) : null}
                      </div>
                      {allergy.reaction ? (
                        <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 500 }}>
                          Reação: {allergy.reaction}
                        </div>
                      ) : null}
                      {allergy.notes ? (
                        <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
                          {allergy.notes}
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <InfoCard label="Alergias a medicamentos" value={patient.drug_allergies} />
              <InfoCard label="Alergias alimentares" value={patient.food_allergies} />
              <InfoCard label="Alergias ambientais" value={patient.environmental_allergies} full />
            </div>
          )}
        </Section>
      )}
    </div>
  );
};

const TabConsulta = ({ visits }) => {
  const sorted = [...(visits || [])].sort(
    (a, b) => new Date(b.arrival_time) - new Date(a.arrival_time)
  );
  const current = sorted[0] || {};
  return (
    <div>
      <Section title="Visita Atual" icon={IC.steth}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          <InfoCard label="Data / Hora" value={fmtDT(current.arrival_time)} />
          <InfoCard
            label="Estado"
            value={
              current.status ? (
                <div style={{ marginTop: -2 }}>
                  <Badge
                    label={statusCfg(current.status).label}
                    bg={statusCfg(current.status).bg}
                    color={statusCfg(current.status).color}
                    dot={statusCfg(current.status).dot}
                  />
                </div>
              ) : null
            }
          />
          <InfoCard
            label="Queixa principal"
            value={current.chief_complaint || current.triage_chief_complaint}
            full
          />
          <InfoCard label="Duração dos sintomas" value={current.symptom_duration} />
          <InfoCard label="Outros sintomas" value={current.other_symptoms} full />
        </div>
        <MicroLabel>Sinais Vitais</MicroLabel>
        <VitalsStrip visit={current} />
      </Section>
      <Divider />
      <Section title="Exame Físico" icon={IC.steth}>
        <InfoCard
          label="Achados do exame físico"
          value={current.physical_exam_findings || current.examination_notes}
          full
        />
      </Section>
      <Divider />
      <Section title="Exames Laboratoriais e Diagnósticos" icon={IC.lab}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoCard label="Exames solicitados" value={current.lab_tests || current.lab_exam_type} />
          <InfoCard label="Estado dos exames" value={current.lab_result_status} />
          <InfoCard label="Resultado" value={current.lab_result_text} full />
          <InfoCard label="Imagiologia" value={current.imaging_results} full />
        </div>
      </Section>
      <Divider />
      <Section title="Diagnóstico" icon={IC.diag}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoCard label="Diagnóstico principal" value={current.likely_diagnosis} accent />
          <InfoCard label="Diagnósticos secundários" value={current.secondary_diagnoses} />
          <InfoCard label="Código CID" value={current.icd_code} mono />
          <InfoCard label="Raciocínio clínico" value={current.clinical_reasoning} full />
        </div>
      </Section>
      <Divider />
      <Section title="Tratamento / Prescrição" icon={IC.rx}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoCard label="Medicamentos" value={current.prescription_text} full />
          <InfoCard label="Terapias" value={current.therapies} />
          <InfoCard label="Recomendações" value={current.recommendations} full />
          <InfoCard label="Destino" value={current.disposition_plan} />
        </div>
      </Section>
      <Divider />
      <Section title="Seguimento e Notas" icon={IC.notes}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoCard label="Próxima consulta" value={fmtDate(current.next_appointment_date)} />
          <InfoCard label="Encaminhamento" value={current.referral} />
          <InfoCard
            label="Notas do médico"
            value={current.doctor_notes || current.clinical_reasoning}
            full
          />
          <InfoCard label="Observações" value={current.observations} full />
        </div>
      </Section>
    </div>
  );
};

const TABS = [
  { id: "identificacao", label: "Identificação" },
  { id: "vacinacao", label: "Vacinação" },
  { id: "crescimento", label: "Crescimento" },
  { id: "historico", label: "Histórico" },
  { id: "alergias", label: "Alergias" },
  { id: "consulta", label: "Consulta" },
];

export default function PatientHistoryModal({ modal, onClose }) {
  const [tab, setTab] = useState("consulta");

  if (!modal?.open) return null;

  const patient = modal?.patient || {};
  const visits = Array.isArray(modal?.visits) ? modal.visits : [];
  const loading = !!modal?.loading;
  const sorted = [...visits].sort((a, b) => new Date(b.arrival_time) - new Date(a.arrival_time));
  const latest = sorted[0] || {};
  const age = calcAge(patient.birth_date);
  const sc = statusCfg(latest.status);
  const pc = priorityCfg(latest.priority);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.97) translateY(12px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes bgIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
        .phm-tab-scroll::-webkit-scrollbar { display: none; }
        .phm-scroll::-webkit-scrollbar { width: 5px; }
        .phm-scroll::-webkit-scrollbar-track { background: transparent; }
        .phm-scroll::-webkit-scrollbar-thumb { background: #D1D5DB; border-radius: 99px; }
      `}</style>

      <div
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose?.();
        }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(4,10,6,0.58)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          animation: "bgIn 0.2s ease",
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 900,
            maxHeight: "92vh",
            background: "#FFFFFF",
            borderRadius: 28,
            border: "1px solid #E0E8E2",
            boxShadow: "0 48px 120px rgba(4,10,6,0.36),0 0 0 1px rgba(255,255,255,0.08)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "modalIn 0.28s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "10px 0 3px",
              flexShrink: 0,
            }}
          >
            <div style={{ width: 30, height: 4, borderRadius: 999, background: "#E5E7EB" }} />
          </div>
          <div
            style={{
              padding: "14px 24px 16px",
              borderBottom: `1px solid ${BORDER}`,
              flexShrink: 0,
              background: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Avatar name={patient.full_name} size={56} />
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#111827",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                    }}
                  >
                    {patient.full_name || "-"}
                  </div>
                  <div
                    style={{
                      marginTop: 5,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      flexWrap: "wrap",
                    }}
                  >
                    {patient.clinical_code ? (
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                          background: "#F3F4F6",
                          borderRadius: 999,
                          padding: "3px 10px",
                          fontSize: 11,
                          color: "#374151",
                          fontWeight: 600,
                        }}
                      >
                        {patient.clinical_code}
                      </span>
                    ) : null}
                    {age ? (
                      <span style={{ fontSize: 12, color: MUTED, fontWeight: 500 }}>{age}</span>
                    ) : null}
                    {patient.birth_date ? (
                      <span style={{ fontSize: 12, color: LABEL }}>
                        - Nasc. {fmtDate(patient.birth_date)}
                      </span>
                    ) : null}
                    {patient.gender ? (
                      <span style={{ fontSize: 12, color: LABEL }}>- {patient.gender}</span>
                    ) : null}
                    {latest.status ? (
                      <Badge label={sc.label} bg={sc.bg} color={sc.color} dot={sc.dot} />
                    ) : null}
                    {latest.priority && pc ? (
                      <Badge label={pc.label} bg={pc.bg} color={pc.color} dot={pc.dot} />
                    ) : null}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `1px solid ${BORDER}`,
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: MUTED,
                  flexShrink: 0,
                  transition: "background 0.12s",
                }}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 14,
                paddingTop: 14,
                borderTop: `1px solid ${BORDER}`,
                flexWrap: "wrap",
              }}
            >
              {[
                { label: "Consultas", value: visits.length },
                {
                  label: "Finalizadas",
                  value: visits.filter((visit) => visit.status === "FINISHED").length,
                },
                {
                  label: "Com diagnostico",
                  value: visits.filter((visit) => visit.likely_diagnosis).length,
                },
                {
                  label: "Ultima visita",
                  value: sorted.length ? fmtDate(sorted[0]?.arrival_time) : "-",
                },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: LABEL,
                    }}
                  >
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginTop: 2 }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="phm-tab-scroll"
            style={{
              flexShrink: 0,
              borderBottom: `1px solid ${BORDER}`,
              background: "#FAFBFA",
              overflowX: "auto",
              padding: "0 20px",
              display: "flex",
              gap: 0,
              alignItems: "stretch",
            }}
          >
            {TABS.map((tabItem) => {
              const active = tab === tabItem.id;
              return (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setTab(tabItem.id)}
                  style={{
                    border: "none",
                    background: "transparent",
                    padding: "12px 14px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: active ? 700 : 500,
                    color: active ? G : LABEL,
                    borderBottom: active ? `2px solid ${G}` : "2px solid transparent",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                    letterSpacing: active ? "-0.01em" : "0",
                    marginBottom: -1,
                  }}
                >
                  {tabItem.label}
                </button>
              );
            })}
          </div>
          <div
            className="phm-scroll"
            style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "#FAFBFA" }}
          >
            {loading ? (
              <div>
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    style={{
                      height: 54,
                      borderRadius: 12,
                      background: "#F3F4F6",
                      marginBottom: 10,
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div style={{ animation: "fadeUp 0.18s ease" }}>
                {tab === "identificacao" ? <TabIdentificacao patient={patient} /> : null}
                {tab === "vacinacao" ? <TabVacinacao patient={patient} /> : null}
                {tab === "crescimento" ? (
                  <TabCrescimento patient={patient} visits={visits} />
                ) : null}
                {tab === "historico" ? (
                  <TabHistorialMedico patient={patient} visits={visits} />
                ) : null}
                {tab === "alergias" ? <TabAlergias patient={patient} /> : null}
                {tab === "consulta" ? <TabConsulta visits={visits} /> : null}
              </div>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 24px",
              borderTop: `1px solid ${BORDER}`,
              background: "#fff",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 12, color: LABEL }}>
              {sorted.length > 0
                ? `${sorted.length} visita${sorted.length !== 1 ? "s" : ""} registada${sorted.length !== 1 ? "s" : ""}`
                : "Sem visitas"}
            </span>
            <button
              type="button"
              onClick={onClose}
              style={{
                borderRadius: 999,
                border: `1px solid ${BORDER}`,
                background: "#fff",
                padding: "8px 22px",
                fontSize: 12,
                fontWeight: 600,
                color: "#374151",
                cursor: "pointer",
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                transition: "background 0.12s",
              }}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
