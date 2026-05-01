import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Baby,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit3,
  FileText,
  HeartPulse,
  Home,
  Mail,
  MapPin,
  Pill,
  Ruler,
  Scissors,
  Stethoscope,
  Thermometer,
  UserRound,
  Users,
  Weight,
  X,
} from "lucide-react";
import {
  inferHospitalStatus,
  inferVitalStatus,
  statusLabelForVisit,
} from "../nurse-helpers/nurseHelpers";

// Mini bar chart component for dashboard
export function MiniBarChart({ data, color = "#165034", height = 60 }) {
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: `${height}px` }}>
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: i === data.length - 1 ? color : `${color}55`,
            borderRadius: "4px 4px 0 0",
            height: `${(v / max) * 100}%`,
            minHeight: "4px",
            transition: "height 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

// Donut chart SVG
export function DonutChart({ segments, size = 120, stroke = 22 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const arcs = segments.reduce((acc, seg) => {
    const dash = (seg.value / total) * circ;
    const prevOffset = acc.length > 0 ? acc[acc.length - 1].nextOffset : 0;
    acc.push({ seg, dash, offset: prevOffset, nextOffset: prevOffset + dash + 2 });
    return acc;
  }, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      {arcs.map(({ seg, dash, offset }, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={-offset}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

const iconStroke = 1.9;

function SkeletonLine({ width = "72%", height = 12, style = {} }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width,
        height,
        borderRadius: "999px",
        background:
          "linear-gradient(90deg, #eef2f7 0%, #f8fafc 45%, #e5eaf0 100%)",
        backgroundSize: "220% 100%",
        animation: "modalSkeleton 1.25s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

function SkeletonTextBlock({ lines = 3 }) {
  return (
    <div style={{ display: "grid", gap: "7px", paddingTop: "2px" }}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonLine
          key={index}
          width={index === lines - 1 ? "58%" : "100%"}
          height={10}
        />
      ))}
    </div>
  );
}

function SoftIcon({ icon: Icon, color = "#165034", background = "rgba(22,80,52,.08)", size = 28 }) {
  if (!Icon) return null;

  return (
    <span
      aria-hidden="true"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "9px",
        background,
        color,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={Math.max(14, size - 12)} strokeWidth={iconStroke} />
    </span>
  );
}

function InfoTile({ label, value, accent, icon, iconColor = "#165034", loading = false }) {
  const normalizedLabel = String(label || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const DerivedIcon =
    icon ||
    (normalizedLabel.includes("medico")
      ? Stethoscope
      : normalizedLabel.includes("diagn")
      ? ClipboardList
      : normalizedLabel.includes("prescri")
      ? Pill
      : normalizedLabel.includes("estado vital")
      ? HeartPulse
      : normalizedLabel.includes("estado hospitalar")
      ? MapPin
      : normalizedLabel.includes("data")
      ? CalendarClock
      : normalizedLabel.includes("email")
      ? Mail
      : normalizedLabel.includes("morada")
      ? Home
      : normalizedLabel.includes("telefone") || normalizedLabel.includes("contacto")
      ? Users
      : normalizedLabel.includes("resumo") || normalizedLabel.includes("justificativa")
      ? FileText
      : null);

  return (
    <div
      style={{
        padding: "9px 10px",
        borderRadius: "10px",
        background: "#f8f8fa",
        display: "flex",
        gap: "9px",
        alignItems: "flex-start",
      }}
    >
      <SoftIcon icon={DerivedIcon} color={iconColor} size={26} />
      <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".07em",
          color: "#8e8e93",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: loading ? "transparent" : accent || "#1c1c1e",
          lineHeight: 1.4,
          overflowWrap: "anywhere",
          width: loading ? "78%" : undefined,
          height: loading ? "13px" : undefined,
          borderRadius: loading ? "999px" : undefined,
          background: loading
            ? "linear-gradient(90deg, #eef2f7 0%, #f8fafc 45%, #e5eaf0 100%)"
            : undefined,
          backgroundSize: loading ? "220% 100%" : undefined,
          animation: loading ? "modalSkeleton 1.25s ease-in-out infinite" : undefined,
        }}
      >
        {loading ? "" : value || "Não informado"}
      </div>
      </div>
    </div>
  );
}

function VitalTile({ label, value, unit, accent, icon, loading = false }) {
  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: "10px",
        background: "#f8f8fa",
        display: "grid",
        gridTemplateColumns: "28px 1fr",
        gap: "8px",
        alignItems: "center",
      }}
    >
      <SoftIcon icon={icon || Activity} color={accent || "#165034"} size={28} />
      <div>
      <div
        style={{
          fontSize: "10px",
          color: "#8e8e93",
          fontWeight: 700,
          marginBottom: "2px",
          textTransform: "uppercase",
          letterSpacing: ".07em",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: loading ? "transparent" : accent || "#1c1c1e",
          lineHeight: 1.2,
          width: loading ? "48%" : undefined,
          height: loading ? "15px" : undefined,
          borderRadius: loading ? "999px" : undefined,
          background: loading
            ? "linear-gradient(90deg, #eef2f7 0%, #f8fafc 45%, #e5eaf0 100%)"
            : undefined,
          backgroundSize: loading ? "220% 100%" : undefined,
          animation: loading ? "modalSkeleton 1.25s ease-in-out infinite" : undefined,
        }}
      >
        {loading ? "" : value ?? "—"}
      </div>
      {unit && !loading && (
        <div style={{ fontSize: "10px", color: "#8e8e93", marginTop: "1px" }}>{unit}</div>
      )}
      </div>
    </div>
  );
}

function SectionLabel({ children, icon, style = {} }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto auto 1fr",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        ...style,
      }}
    >
      <SoftIcon icon={icon} size={24} />
      <span
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: ".08em",
          textTransform: "uppercase",
          color: "#8e8e93",
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        style={{
          height: "2px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, rgba(22,80,52,.28), rgba(134,214,163,.32), rgba(15,23,42,0))",
        }}
      />
    </div>
  );
}

function AbstractSectionLine() {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "18px",
        display: "grid",
        gridTemplateColumns: "54px 9px 1fr 9px 26px",
        alignItems: "center",
        gap: "7px",
        margin: "1px 2px",
        opacity: 0.9,
      }}
    >
      <span
        style={{
          height: "3px",
          borderRadius: "999px",
          background: "linear-gradient(90deg, #165034, #4aa36c)",
        }}
      />
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          border: "2px solid rgba(22,80,52,.35)",
          background: "#fbfbfc",
        }}
      />
      <span
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, rgba(22,80,52,.22), rgba(134,214,163,.34), rgba(148,163,184,.12))",
        }}
      />
      <span
        style={{
          width: "9px",
          height: "9px",
          borderRadius: "50%",
          background: "#86d6a3",
          boxShadow: "0 0 0 4px rgba(134,214,163,.14)",
        }}
      />
      <span style={{ height: "3px", borderRadius: "999px", background: "#d7f0df" }} />
    </div>
  );
}

function SoftCard({ children, style = {} }) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "0.5px solid rgba(0,0,0,.06)",
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Profile page ─────────────────────────────────────────────────────────────

function ProfilePage({
  modal,
  profileDob,
  profileAge,
  profileGuardian,
  profilePhone,
  profileAddress,
  doctors,
  visit,
  setPastVisitModal,
  onSave,
}) {
  const isEditing = modal.editingPatient && !modal.patientLoading;
  const profileLoading = modal.detailLoading || modal.patientLoading;

  const vitalAccent = (val, high, low) => {
    if (val == null) return undefined;
    if (val > high || val < low) return "#c05c00";
    return undefined;
  };

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {modal.detailLoading && !modal.patientProfile ? (
        <SoftCard>
          <SectionLabel icon={UserRound}>Perfil do paciente</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <InfoTile label="Data de nascimento" icon={CalendarDays} loading />
            <InfoTile label="Idade" icon={Baby} loading />
          </div>
          <div style={{ display: "grid", gap: "8px", marginTop: "8px" }}>
            <InfoTile label="Acompanhante" icon={Users} loading />
            <InfoTile label="Morada" icon={Home} loading />
          </div>
        </SoftCard>
      ) : (
        <>
          {/* Row 1: Patient profile + Visit info */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "12px" }}>
            {/* Patient profile */}
            <SoftCard>
              <SectionLabel icon={UserRound}>Perfil do paciente</SectionLabel>
              {isEditing ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  <input
                    className="triage-input"
                    value={modal.patientForm.full_name}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, full_name: e.target.value },
                      }))
                    }
                    placeholder="Nome completo"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.clinical_code}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, clinical_code: e.target.value },
                      }))
                    }
                    placeholder="Código clínico"
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <select
                      className="triage-input"
                      value={modal.patientForm.sex}
                      onChange={(e) =>
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: { ...prev.patientForm, sex: e.target.value },
                        }))
                      }
                    >
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                    </select>
                    <input
                      type="date"
                      className="triage-input"
                      value={modal.patientForm.birth_date}
                      onChange={(e) =>
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: { ...prev.patientForm, birth_date: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <input
                    className="triage-input"
                    value={modal.patientForm.guardian_name}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, guardian_name: e.target.value },
                      }))
                    }
                    placeholder="Nome do acompanhante"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.guardian_phone}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, guardian_phone: e.target.value },
                      }))
                    }
                    placeholder="Telefone do acompanhante"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.alt_phone}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, alt_phone: e.target.value },
                      }))
                    }
                    placeholder="Contacto alternativo"
                  />
                  <input
                    className="triage-input"
                    value={modal.patientForm.address}
                    onChange={(e) =>
                      setPastVisitModal((prev) => ({
                        ...prev,
                        patientForm: { ...prev.patientForm, address: e.target.value },
                      }))
                    }
                    placeholder="Morada"
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile
                      label="Data de nascimento"
                      icon={CalendarDays}
                      loading={profileLoading}
                      value={
                        profileDob
                          ? new Date(`${profileDob}T00:00:00`).toLocaleDateString("pt-PT")
                          : null
                      }
                    />
                    <InfoTile
                      label="Idade"
                      icon={Baby}
                      loading={profileLoading}
                      value={profileAge != null ? `${profileAge} ano${profileAge === 1 ? "" : "s"}` : null}
                    />
                  </div>
                  <InfoTile label="Acompanhante" value={profileGuardian} icon={Users} loading={profileLoading} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile label="Telefone" value={profilePhone} icon={UserRound} loading={profileLoading} />
                    <InfoTile label="Contacto alt." value={modal.patientProfile?.alt_phone} icon={Users} loading={profileLoading} />
                  </div>
                  <InfoTile label="Morada" value={profileAddress} icon={Home} loading={profileLoading} />
                  <InfoTile label="Email" value={modal.patientProfile?.email} icon={Mail} loading={profileLoading} />
                </div>
              )}
            </SoftCard>

            {/* Right column: Visit info + Vitals */}
            <div style={{ display: "grid", gap: "12px", alignContent: "start" }}>
              <SoftCard>
                <SectionLabel icon={CalendarClock}>Consulta selecionada</SectionLabel>
                <div style={{ display: "grid", gap: "8px" }}>
                  <InfoTile
                    label="Médico"
                    value={
                      (visit.doctor_full_name || visit.doctor_username || "—") +
                      (visit.doctor_specialization ? ` (${visit.doctor_specialization})` : "")
                    }
                  />
                  <InfoTile
                    label="Data"
                    icon={CalendarClock}
                    value={
                      visit.consultation_ended_at || visit.arrival_time
                        ? new Date(
                            visit.consultation_ended_at || visit.arrival_time
                          ).toLocaleString("pt-PT")
                        : "—"
                    }
                  />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <InfoTile label="Estado hospitalar" value={inferHospitalStatus(visit)} icon={MapPin} />
                    <InfoTile label="Estado vital" value={inferVitalStatus(visit)} icon={HeartPulse} />
                  </div>
                </div>
              </SoftCard>

              {/* Vitals grid */}
              {(visit.temperature != null ||
                visit.heart_rate != null ||
                visit.respiratory_rate != null ||
                visit.oxygen_saturation != null ||
                visit.weight != null ||
                visit.height != null ||
                visit.blood_pressure_systolic != null) && (
                <SoftCard>
                  <SectionLabel icon={HeartPulse}>Sinais vitais</SectionLabel>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    {visit.blood_pressure_systolic != null && (
                      <VitalTile
                        label="PA"
                        icon={Activity}
                        value={`${visit.blood_pressure_systolic}/${visit.blood_pressure_diastolic}`}
                        unit="mmHg"
                        accent={
                          visit.blood_pressure_systolic > 140 || visit.blood_pressure_systolic < 90
                            ? "#c05c00"
                            : undefined
                        }
                      />
                    )}
                    {visit.heart_rate != null && (
                      <VitalTile
                        label="FC"
                        icon={HeartPulse}
                        value={visit.heart_rate}
                        unit="bpm"
                        accent={vitalAccent(visit.heart_rate, 100, 60)}
                      />
                    )}
                    {visit.temperature != null && (
                      <VitalTile
                        label="Temp"
                        icon={Thermometer}
                        value={visit.temperature}
                        unit="°C"
                        accent={visit.temperature > 37.5 ? "#c05c00" : undefined}
                      />
                    )}
                    {visit.oxygen_saturation != null && (
                      <VitalTile
                        label="SpO2"
                        icon={Activity}
                        value={`${visit.oxygen_saturation}%`}
                        unit="oxig."
                        accent={visit.oxygen_saturation < 95 ? "#c05c00" : undefined}
                      />
                    )}
                    {visit.respiratory_rate != null && (
                      <VitalTile
                        label="FR"
                        icon={Activity}
                        value={visit.respiratory_rate}
                        unit="rpm"
                        accent={vitalAccent(visit.respiratory_rate, 20, 12)}
                      />
                    )}
                    {visit.weight != null && (
                      <VitalTile label="Peso" value={visit.weight} unit="kg" icon={Weight} />
                    )}
                    {visit.height != null && (
                      <VitalTile label="Altura" value={visit.height} unit="cm" icon={Ruler} />
                    )}
                  </div>
                </SoftCard>
              )}
            </div>
          </div>

          <AbstractSectionLine />

          {/* Row 2: Clinical summary */}
          <SoftCard>
            <SectionLabel icon={ClipboardList}>Resumo clínico</SectionLabel>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: "8px",
              }}
            >
              {[
                ["Queixa principal", visit.chief_complaint || visit.triage_chief_complaint],
                ["Diagnóstico", visit.likely_diagnosis],
                ["Justificativa clínica", visit.clinical_reasoning],
                ["Prescrição", visit.prescription_text],
              ].map(([label, value], index) => {
                const ClinicalIcon = [AlertTriangle, ClipboardList, FileText, Pill][index];
                return (
                <div
                  key={label}
                  style={{ padding: "10px 12px", borderRadius: "10px", background: "#f8f8fa" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: ".07em",
                      color: "#8e8e93",
                      marginBottom: "6px",
                    }}
                  >
                    <ClinicalIcon size={14} strokeWidth={iconStroke} />
                    {label}
                  </div>
                  {isEditing ? (
                    <textarea
                      className="triage-input"
                      rows={3}
                      value={
                        modal.patientForm[
                          label === "Queixa principal"
                            ? "chief_complaint"
                            : label === "Diagnóstico"
                            ? "likely_diagnosis"
                            : label === "Justificativa clínica"
                            ? "clinical_reasoning"
                            : "prescription_text"
                        ]
                      }
                      onChange={(e) => {
                        const fieldMap = {
                          "Queixa principal": "chief_complaint",
                          "Diagnóstico": "likely_diagnosis",
                          "Justificativa clínica": "clinical_reasoning",
                          "Prescrição": "prescription_text",
                        };
                        setPastVisitModal((prev) => ({
                          ...prev,
                          patientForm: {
                            ...prev.patientForm,
                            [fieldMap[label]]: e.target.value,
                          },
                        }));
                      }}
                      style={{ resize: "none", background: "#fff" }}
                    />
                  ) : profileLoading ? (
                    <SkeletonTextBlock lines={3} />
                  ) : (
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#1c1c1e",
                        lineHeight: 1.55,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {value || "—"}
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            {isEditing && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <select
                  className="triage-input"
                  value={modal.patientForm.doctor_id}
                  onChange={(e) =>
                    setPastVisitModal((prev) => ({
                      ...prev,
                      patientForm: { ...prev.patientForm, doctor_id: e.target.value },
                    }))
                  }
                >
                  <option value="">Sem médico</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {(d.full_name || d.username || `Médico #${d.id}`) +
                        (d.specialization ? ` (${d.specialization})` : "")}
                    </option>
                  ))}
                </select>
                <select
                  className="triage-input"
                  value={modal.patientForm.hospital_status}
                  onChange={(e) =>
                    setPastVisitModal((prev) => ({
                      ...prev,
                      patientForm: { ...prev.patientForm, hospital_status: e.target.value },
                    }))
                  }
                >
                  <option value="">Sem registo</option>
                  <option value="DISCHARGED">Alta</option>
                  <option value="IN_HOSPITAL">Internado</option>
                  <option value="BED_REST">Repouso / Acamado</option>
                  <option value="TRANSFERRED">Transferido</option>
                  <option value="DECEASED">Óbito</option>
                </select>
              </div>
            )}
          </SoftCard>

          {isEditing && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ width: "auto", padding: "10px 16px", borderRadius: "999px" }}
                onClick={() => setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{ width: "auto", padding: "10px 16px", borderRadius: "999px" }}
                disabled={modal.patientSaving}
                onClick={onSave}
              >
                {modal.patientSaving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── History page ─────────────────────────────────────────────────────────────

function HistoryPage({ modal, timeline }) {
  const softCardStyle = {
    background: "#ffffff",
    borderRadius: "16px",
    border: "0.5px solid rgba(0,0,0,.06)",
    padding: "14px",
  };

  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {/* Visit count header */}
      {timeline.length > 0 && (
        <div
          style={{
            ...softCardStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <SectionLabel icon={FileText} style={{ margin: 0 }}>Histórico de visitas</SectionLabel>
          <span style={{ fontSize: "12px", color: "#8e8e93" }}>
            {timeline.length} visita{timeline.length !== 1 ? "s" : ""} anterior
            {timeline.length !== 1 ? "es" : ""}
          </span>
        </div>
      )}

      {modal.detailLoading && timeline.length === 0 ? (
        <div style={{ display: "grid", gap: "10px" }} aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} style={softCardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "18px" }}>
                <div style={{ flex: 1 }}>
                  <SkeletonLine width="46%" height={14} />
                  <SkeletonLine width="64%" height={10} style={{ marginTop: "9px" }} />
                </div>
                <SkeletonLine width="82px" height={22} />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <InfoTile label="Médico" icon={Stethoscope} loading />
                <InfoTile label="Diagnóstico" icon={ClipboardList} loading />
              </div>
              <div style={{ marginTop: "10px" }}>
                <SkeletonTextBlock lines={2} />
              </div>
            </div>
          ))}
        </div>
      ) : timeline.length === 0 ? (
        <div
          style={{
            ...softCardStyle,
            padding: "22px",
            textAlign: "center",
            color: "#9ca3af",
          }}
        >
          Sem histórico adicional para este paciente.
        </div>
      ) : (
        /* Timeline */
        <div style={{ position: "relative", paddingLeft: "26px" }}>
          {/* Vertical line */}
          <div
            style={{
              position: "absolute",
              left: "10px",
              top: "18px",
              bottom: "18px",
              width: "2px",
              borderRadius: "999px",
              background:
                "linear-gradient(180deg, rgba(22,80,52,.42), rgba(134,214,163,.24), rgba(148,163,184,.14))",
            }}
          />

          <div style={{ display: "grid", gap: "10px" }}>
            {timeline.map((row, idx) => {
              const vitals = [
                row?.temperature != null ? `Temp ${row.temperature}°C` : null,
                row?.heart_rate != null ? `FC ${row.heart_rate} bpm` : null,
                row?.respiratory_rate != null ? `FR ${row.respiratory_rate} rpm` : null,
                row?.oxygen_saturation != null ? `SpO2 ${row.oxygen_saturation}%` : null,
                row?.weight != null ? `Peso ${row.weight} kg` : null,
              ].filter(Boolean);

              const isRecent = idx === 0;

              return (
                <div
                  key={row.visit_id || row.id}
                  style={{
                    ...softCardStyle,
                    position: "relative",
                    opacity: idx > 2 ? 0.65 : 1,
                  }}
                >
                  {/* Timeline dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "-25px",
                      top: "16px",
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      background: isRecent ? "#165034" : "#ffffff",
                      border: isRecent ? "2px solid #d7f0df" : "2px solid #e5e7eb",
                      color: isRecent ? "#ffffff" : "#6b7280",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(15,23,42,.08)",
                    }}
                  >
                    <CalendarClock size={12} strokeWidth={2.2} />
                  </div>

                  {/* Card header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "12px",
                      marginBottom: "10px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1c1c1e",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        <FileText size={16} strokeWidth={iconStroke} color="#165034" />
                        {row?.chief_complaint ||
                          row?.return_visit_reason ||
                          (row?.lab_requested
                            ? row?.lab_exam_type || "Retorno laboratorial"
                            : "Sem motivo registado")}
                      </div>
                      <div style={{ fontSize: "11px", color: "#8e8e93", marginTop: "2px" }}>
                        {row?.arrival_time
                          ? new Date(row.arrival_time).toLocaleString("pt-PT")
                          : "—"}{" "}
                        · Visita #{row.visit_id || row.id}
                      </div>
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "#f4f4f5",
                        color: "#636366",
                        fontSize: "10px",
                        fontWeight: 700,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <CheckCircle2 size={12} strokeWidth={2} />
                      {statusLabelForVisit(row)}
                    </span>
                  </div>

                  {/* Doctor + Diagnosis */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: vitals.length > 0 ? "8px" : "0",
                    }}
                  >
                    <InfoTile
                      label="Médico"
                      value={
                        (row?.doctor_full_name || row?.doctor_username || "Não registado") +
                        (row?.doctor_specialization ? ` (${row.doctor_specialization})` : "")
                      }
                    />
                    <InfoTile
                      label="Diagnóstico"
                      value={row?.likely_diagnosis || "Não registado"}
                    />
                  </div>

                  {/* Vitals */}
                  {vitals.length > 0 && (
                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "10px",
                        background: "#f8f8fa",
                        marginBottom: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: ".07em",
                          color: "#8e8e93",
                          marginBottom: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <HeartPulse size={13} strokeWidth={iconStroke} />
                        Sinais vitais
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {vitals.map((item) => (
                          <span
                            key={item}
                            style={{
                              padding: "3px 8px",
                              borderRadius: "999px",
                              background: "#ffffff",
                              border: "1px solid rgba(0,0,0,.05)",
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#4b5563",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clinical notes + Prescription */}
                  {(row?.clinical_notes || row?.clinical_reasoning || row?.prescription_text) && (
                    <div style={{ display: "grid", gap: "8px" }}>
                      {(row?.clinical_notes || row?.clinical_reasoning) && (
                        <InfoTile
                          label="Resumo clínico"
                          value={row?.clinical_notes || row?.clinical_reasoning}
                        />
                      )}
                      {row?.prescription_text && (
                        <InfoTile label="Prescrição" value={row.prescription_text} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

function PdfAnimation() {
  return (
    <div
      aria-hidden="true"
      style={{
        width: "104px",
        height: "104px",
        borderRadius: "26px",
        background: "linear-gradient(145deg, #f8fafc, #eef8f1)",
        display: "grid",
        placeItems: "center",
        margin: "0 auto",
        boxShadow: "inset 0 0 0 1px rgba(22,80,52,.08)",
      }}
    >
      <style>
        {`
          @keyframes pdfFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
          @keyframes pdfTrace { 0% { stroke-dashoffset: 54; opacity: .25; } 100% { stroke-dashoffset: 0; opacity: .95; } }
        `}
      </style>
      <svg
        width="68"
        height="76"
        viewBox="0 0 68 76"
        fill="none"
        style={{ animation: "pdfFloat 1.9s ease-in-out infinite" }}
      >
        <path
          d="M18 5h25l12 12v45a8 8 0 0 1-8 8H18a8 8 0 0 1-8-8V13a8 8 0 0 1 8-8Z"
          fill="#ffffff"
          stroke="#165034"
          strokeWidth="2"
        />
        <path d="M43 5v10a4 4 0 0 0 4 4h8" fill="#e6f6eb" stroke="#165034" strokeWidth="2" />
        <rect x="18" y="28" width="32" height="16" rx="5" fill="#165034" />
        <path
          d="M23 39v-7h3.9c1.5 0 2.6.9 2.6 2.3s-1.1 2.3-2.6 2.3H25v2.4h-2Zm2-4h1.6c.5 0 .8-.2.8-.7s-.3-.7-.8-.7H25V35Zm6.9 4v-7h3c2.2 0 3.7 1.4 3.7 3.5S37.1 39 34.9 39h-3Zm2.1-1.8h.7c1 0 1.6-.6 1.6-1.7s-.6-1.7-1.6-1.7H34v3.4Zm7.1 1.8v-7h5.1v1.8h-3v1h2.6v1.7h-2.6V39h-2.1Z"
          fill="#ffffff"
        />
        <path
          d="M19 52h30"
          stroke="#86d6a3"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="54"
          style={{ animation: "pdfTrace 1.35s ease-in-out infinite alternate" }}
        />
        <path
          d="M19 59h22"
          stroke="#b8e8c5"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="54"
          style={{ animation: "pdfTrace 1.35s .18s ease-in-out infinite alternate" }}
        />
      </svg>
    </div>
  );
}

// PDF template picker.

export function VisitPdfTemplateModal({
  modal,
  pdfLoadingId,
  onClose,
  onSelectTemplate,
  onGenerate,
}) {
  const [progress, setProgress] = useState(0);
  const generating = !!modal?.generating || (!!modal?.visit && pdfLoadingId === modal.visit.id);
  const success = !!modal?.success;
  const progressDuration = modal?.template === "full-record" ? 2400 : 1600;

  useEffect(() => {
    if (!generating) {
      return undefined;
    }

    const startedAt = performance.now();
    const reset = window.setTimeout(() => setProgress(5), 0);
    const tick = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const t = Math.min(elapsed / progressDuration, 1);
      const eased = t < 0.6 ? 0.38 * (t / 0.6) ** 2.35 : 0.38 + 0.59 * ((t - 0.6) / 0.4) ** 0.55;
      setProgress(Math.min(97, Math.round(5 + eased * 92)));
    }, 80);

    return () => {
      window.clearTimeout(reset);
      window.clearInterval(tick);
    };
  }, [generating, progressDuration]);

  if (!modal?.open || !modal?.visit) return null;

  if (success) {
    return (
      <div className="alert-popup-overlay">
        <style>
          {`
            @keyframes pdfConfetti {
              0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
              12% { opacity: 1; }
              100% { transform: translate3d(var(--x), var(--y), 0) rotate(var(--r)); opacity: 0; }
            }
          `}
        </style>
        <div className="alert-popup-card" style={{ position: "relative", overflow: "hidden" }}>
          {[
            ["-82px", "-44px", "80deg", "#165034"],
            ["74px", "-50px", "-70deg", "#86d6a3"],
            ["-58px", "-76px", "140deg", "#2f8f59"],
            ["42px", "-78px", "95deg", "#f5c542"],
            ["-96px", "-12px", "-130deg", "#b8e8c5"],
            ["92px", "-16px", "120deg", "#165034"],
            ["-28px", "-94px", "-80deg", "#86d6a3"],
            ["18px", "-98px", "160deg", "#f5c542"],
          ].map(([x, y, r, color], index) => (
            <span
              key={`${x}-${y}`}
              aria-hidden="true"
              style={{
                "--x": x,
                "--y": y,
                "--r": r,
                position: "absolute",
                left: "50%",
                top: 92,
                width: index % 2 ? 7 : 5,
                height: index % 2 ? 12 : 9,
                borderRadius: 2,
                background: color,
                animation: `pdfConfetti 950ms ${index * 45}ms ease-out both`,
              }}
            />
          ))}
          <div className="alert-popup-handle" />
          <div className="alert-popup-body">
            <div className="popup-icon popup-icon-success">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div>
              <h3
                style={{
                  margin: "0 0 8px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.01em",
                }}
              >
                PDF gerado com sucesso
              </h3>
              <p
                style={{
                  margin: "0 0 24px",
                  fontSize: 13,
                  color: "#64748b",
                  lineHeight: 1.65,
                  maxWidth: 280,
                }}
              >
                O download deve iniciar em instantes.
              </p>
            </div>
          </div>
          <div className="alert-popup-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{
                width: "100%",
                maxWidth: 280,
                minHeight: 44,
                padding: "11px 18px",
                borderRadius: 14,
              }}
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const options = [
    {
      id: "today-summary",
      badgeLabel: "Consulta de hoje",
      title: "Resumo de hoje",
      description:
        "Dados do paciente, diagnostico, sinais vitais e prescricao desta consulta.",
      previewType: "summary",
    },
    {
      id: "full-record",
      badgeLabel: "Com historico",
      title: "Registo completo",
      description:
        "Consulta atual com historico clinico anterior e resultados laboratoriais registados.",
      previewType: "full",
    },
  ];

  return (
    <div className="popup-overlay">
      <style>
        {`
          .triage-page .pdf-template-option,
          .popup-overlay .pdf-template-option {
            border-radius: 14px !important;
          }
          .triage-page .pdf-template-close,
          .popup-overlay .pdf-template-close {
            border-radius: 8px !important;
          }
          @keyframes pdfProgress {
            0% { transform: translateX(-110%); opacity: .15; }
            40% { opacity: .65; }
            100% { transform: translateX(110%); opacity: .2; }
          }
          @keyframes pdfConfetti {
            0% { transform: translate3d(0, 0, 0) rotate(0deg); opacity: 0; }
            12% { opacity: 1; }
            100% { transform: translate3d(var(--x), var(--y), 0) rotate(var(--r)); opacity: 0; }
          }
          @media (max-width: 720px) {
            .pdf-template-grid { grid-template-columns: 1fr !important; }
          }
        `}
      </style>
      <div
        className="popup-card"
        style={{
          width: "min(92vw, 700px)",
          maxHeight: "84vh",
          padding: 0,
          overflow: "hidden",
          borderRadius: 22,
          border: "0.5px solid rgba(0,0,0,.08)",
          background: "#ffffff",
          boxShadow: "0 22px 70px rgba(15,23,42,.18)",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "18px 20px 16px",
            borderBottom: "0.5px solid #eef2f7",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 14,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Escolher modelo do PDF
            </h3>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: "#6b7280" }}>
              {modal.visit.full_name || "Paciente"} · Consulta #{modal.visit.id}
            </p>
          </div>
          {!generating && !success && (
            <button
              type="button"
              className="pdf-template-close"
              onClick={onClose}
              aria-label="Fechar"
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "0.5px solid #e5e7eb",
                background: "transparent",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* ── Generating state ── */}
        {generating ? (
          <div style={{ padding: "32px 34px 30px", textAlign: "center" }}>
            <PdfAnimation />
            <h4
              style={{
                margin: "20px 0 6px",
                fontSize: 18,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              Gerando PDF
            </h4>
            <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
              {modal.template === "full-record"
                ? "A reunir o historico clinico completo."
                : "A preparar o resumo da consulta."}
            </p>
            <div
              style={{
                marginTop: 22,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700 }}>
                Processando
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "#165034",
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {generating ? progress : 0}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 999,
                background: "linear-gradient(90deg, #dfe7ee, #edf2f7)",
                overflow: "visible",
                marginTop: 8,
                position: "relative",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: -2,
                  top: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#165034",
                  transform: "translateY(-50%)",
                  zIndex: 2,
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  right: -2,
                  top: "50%",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#dfe7ee",
                  transform: "translateY(-50%)",
                }}
              />
              <div
                style={{
                  width: `${generating ? progress : 0}%`,
                  height: "100%",
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, #165034 0%, #2f8f59 52%, #9be7b5 100%)",
                  transition: "width 90ms linear",
                  position: "relative",
                  overflow: "hidden",
                  zIndex: 1,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent)",
                    transform: "translateX(-100%)",
                    animation: "pdfProgress 1.4s cubic-bezier(.4,0,.2,1) infinite",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "16px 18px 18px", overflowY: "auto", maxHeight: "calc(84vh - 78px)" }}>
            {/* ── Template cards grid ── */}
            <div
              className="pdf-template-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              {options.map((option) => {
                const selected = modal.template === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    className="pdf-template-option"
                    onClick={() => onSelectTemplate(option.id)}
                    style={{
                      border: `1.5px solid ${selected ? "#165034" : "#e5e7eb"}`,
                      background: selected ? "#f8fcf9" : "#ffffff",
                      borderRadius: 14,
                      padding: 0,
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      overflow: "hidden",
                      position: "relative",
                      boxShadow: selected ? "0 0 0 3px rgba(22,80,52,.1)" : "none",
                      transition: "border-color .18s, background .18s, box-shadow .18s",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: selected ? "#165034" : "transparent",
                        zIndex: 2,
                      }}
                    />

                    {/* Document preview area */}
                    <div
                      style={{
                        background: selected ? "#eef8f1" : "#f4f6f9",
                        padding: "16px 14px 0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                        minHeight: 210,
                      }}
                    >
                      <DocPreview type={option.previewType} />
                    </div>

                    {/* Card metadata */}
                    <div style={{ padding: "10px 12px 12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 999,
                            background: selected ? "#e8f5ee" : "#f0f4f0",
                            color: selected ? "#165034" : "#4b6355",
                            transition: "background .18s, color .18s",
                          }}
                        >
                          {option.previewType === "summary" ? (
                            <FileText size={9} />
                          ) : (
                            <ClipboardList size={9} />
                          )}
                          {option.badgeLabel}
                        </span>
                        {selected && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#165034",
                              fontSize: 10,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            <Check size={12} strokeWidth={2.5} />
                            Selecionado
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: "#111827",
                          marginBottom: 3,
                          lineHeight: 1.3,
                        }}
                      >
                        {option.title}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ── Footer actions ── */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                  marginRight: "auto",
                }}
              >
                {modal.template ? "1 modelo selecionado" : "Selecione um modelo"}
              </span>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: "auto",
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 12,
                }}
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                style={{
                  width: "auto",
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 12,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: modal.template ? 1 : 0.5,
                  cursor: modal.template ? "pointer" : "not-allowed",
                }}
                disabled={!modal.template}
                onClick={onGenerate}
              >
                <Download size={13} strokeWidth={2} />
                Gerar PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── DocPreview ────────────────────────────────────────────────────────────────
// SVG-based miniature document thumbnail rendered inside the card preview area.

function DocLine({ width = "100%", height = 3, color = "#dde3ea", mt = 4 }) {
  return (
    <div
      style={{
        height,
        borderRadius: 2,
        background: color,
        width,
        marginTop: mt,
      }}
    />
  );
}

function DocPreview({ type }) {
  const isFull = type === "full";

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 4,
        border: "1px solid #d8dee7",
        width: 156,
        minHeight: 190,
        padding: "12px 12px 9px",
        boxShadow: "0 8px 18px rgba(15,23,42,.1)",
      }}
    >
      {/* Green top accent */}
      <div
        style={{
          height: 7,
          borderRadius: 2,
          background: "#165034",
          marginBottom: 9,
          opacity: 0.88,
        }}
      />

      {/* Logo row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 7,
        }}
      >
        <div
          style={{
            width: 34,
            height: 6,
            borderRadius: 2,
            background: "#d1d5db",
          }}
        />
        <span
          style={{
            fontSize: 7,
            fontWeight: 600,
            color: "#9ca3af",
            letterSpacing: ".05em",
            textTransform: "uppercase",
          }}
        >
          {isFull ? "Registo completo" : "Resumo"}
        </span>
      </div>

      {/* Patient name lines */}
      <DocLine color="#165034" height={3} mt={0} />
      <DocLine width="58%" height={2} mt={4} />

      {/* Divider */}
      <div
        style={{
          height: 0.5,
          background: "#e5e7eb",
          margin: "7px 0",
        }}
      />

      {/* Two-column vitals row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 5,
          marginBottom: 5,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <DocLine height={2} color="#c8d0d9" mt={0} />
            <DocLine width="55%" height={2} mt={3} color="#dde3ea" />
          </div>
        ))}
      </div>

      <div style={{ height: 0.5, background: "#e5e7eb", margin: "7px 0" }} />

      {/* Diagnosis / prescription lines */}
      <DocLine color="#165034" height={2} mt={0} />
      <DocLine height={2} mt={4} />
      <DocLine width="70%" height={2} mt={4} />

      {isFull && (
        <>
          <div style={{ height: 0.5, background: "#e5e7eb", margin: "7px 0" }} />
          {/* Past history section — faded */}
          <DocLine color="#165034" height={2} mt={0} />
          <DocLine height={2} mt={4} color="#e9edf2" />
          <DocLine width="60%" height={2} mt={4} color="#e9edf2" />
          <div style={{ height: 0.5, background: "#eef2f7", margin: "7px 0" }} />
          <DocLine color="#165034" height={2} mt={0} />
          <DocLine height={2} mt={4} color="#f0f3f6" />
        </>
      )}

      {/* Signature line (summary only) */}
      {!isFull && (
        <div
          style={{
            width: 46,
            height: 12,
            borderBottom: "1px solid #d1d5db",
            marginTop: 12,
            marginLeft: "auto",
          }}
        />
      )}

      <div style={{ height: 6 }} />
    </div>
  );
}

export function PastVisitHistoryModal({
  modal,
  profileName,
  profileCode,
  profileDob,
  profileAge,
  profileGuardian,
  profilePhone,
  profileAddress,
  profilePhoto,
  timeline,
  doctors,
  pdfLoadingId,
  setPastVisitModal,
  onStartEdit,
  onSave,
  onClose,
  onDownloadPdf,
}) {
  if (!modal?.open || !modal?.visit) return null;
  const visit = modal.visit;
  const profileLoading = modal.detailLoading || modal.patientLoading;

  const isDeceased = inferVitalStatus(visit) === "Óbito";

  const initials = String(profileName || "P")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="popup-overlay">
      <style>
        {`
          @keyframes modalSkeleton {
            0% { background-position: 140% 0; }
            100% { background-position: -80% 0; }
          }
        `}
      </style>
      <div
        className="popup-card"
        style={{
          maxWidth: "960px",
          width: "95%",
          height: "min(88vh, 760px)",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: "24px",
          border: "0.5px solid rgba(0,0,0,.08)",
          background: "#ffffff",
          boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "#d1d5db",
            margin: "10px auto 0",
            flexShrink: 0,
          }}
        />

        {/* ── Header ── */}
        <div
          style={{
            padding: "16px 20px 0",
            borderBottom: "0.5px solid rgba(0,0,0,.08)",
            background: "#ffffff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "14px",
            }}
          >
            {/* Avatar + identity */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profileName}
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,.06)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #eef5f0, #dbe9e0)",
                    color: "#165034",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "17px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </div>
              )}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "19px",
                    fontWeight: 700,
                    color: "#1c1c1e",
                    letterSpacing: "-0.3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {profileLoading ? <SkeletonLine width="180px" height={18} /> : profileName}
                </div>
                <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "2px" }}>
                  {profileLoading ? (
                    <SkeletonLine width="140px" height={10} />
                  ) : (
                    `${profileCode} · Consulta #${visit.id}`
                  )}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                  {/* Hospital status badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: "#f4f4f5",
                      color: "#636366",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    <MapPin size={12} strokeWidth={2} />
                    {inferHospitalStatus(visit)}
                  </span>
                  {/* Vital status badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background: isDeceased ? "#fff1f1" : "#eef8f1",
                      color: isDeceased ? "#7f1d1d" : "#1a7a3c",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    <HeartPulse size={12} strokeWidth={2} />
                    {inferVitalStatus(visit)}
                  </span>
                  {/* Surgery required badge — example of contextual flag */}
                  {visit.surgery_required && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "3px 10px",
                        borderRadius: "999px",
                        background: "#fff8e6",
                        color: "#854F0B",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      <Scissors size={12} strokeWidth={2} />
                      Cirurgia Requerida
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                justifyContent: "flex-end",
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={
                  modal.editingPatient
                    ? () => setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))
                    : onStartEdit
                }
                className="btn-secondary"
                style={{
                  width: "auto",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  background: "#f6f6f7",
                  borderColor: "rgba(0,0,0,.08)",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <Edit3 size={14} strokeWidth={2} />
                {modal.editingPatient ? "Cancelar edição" : "Editar perfil"}
              </button>
              <button
                type="button"
                disabled={pdfLoadingId === visit.id}
                onClick={() => onDownloadPdf(visit)}
                className="btn-primary"
                style={{
                  width: "auto",
                  padding: "8px 14px",
                  borderRadius: "999px",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                }}
              >
                <Download size={14} strokeWidth={2} />
                {pdfLoadingId === visit.id ? "Gerando..." : "Baixar PDF"}
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal"
                style={{
                  width: "34px",
                  height: "34px",
                  padding: 0,
                  border: "none",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#6b7280",
                  cursor: "pointer",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.18s ease, color 0.18s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                  e.currentTarget.style.color = "#111827";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#6b7280";
                }}
              >
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div
            style={{
              display: "inline-flex",
              padding: "4px",
              background: "#f5f5f7",
              borderRadius: "14px",
              gap: "4px",
            }}
          >
            {["profile", "history"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPastVisitModal((prev) => ({ ...prev, page: tab }))}
                style={{
                  border: "none",
                  borderRadius: "10px",
                  padding: "7px 16px",
                  fontSize: "12px",
                  fontWeight: 600,
                  background: modal.page === tab ? "#ffffff" : "transparent",
                  color: modal.page === tab ? "#1c1c1e" : "#6b7280",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  transition: "background 0.18s ease, color 0.18s ease",
                }}
              >
                {tab === "profile" ? (
                  <UserRound size={14} strokeWidth={2} />
                ) : (
                  <FileText size={14} strokeWidth={2} />
                )}
                {tab === "profile" ? "Perfil" : "Histórico clínico"}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sliding content ── */}
        <div style={{ overflow: "hidden", flex: 1, minHeight: 0, background: "#fbfbfc" }}>
          <div
            style={{
              display: "flex",
              width: "200%",
              height: "100%",
              minHeight: 0,
              transform: modal.page === "profile" ? "translateX(0%)" : "translateX(-50%)",
              transition: "transform 0.28s ease",
            }}
          >
            {/* Profile pane */}
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                height: "100%",
                minHeight: 0,
                padding: "16px",
                overflowY: "auto",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              <ProfilePage
                modal={modal}
                profileDob={profileDob}
                profileAge={profileAge}
                profileGuardian={profileGuardian}
                profilePhone={profilePhone}
                profileAddress={profileAddress}
                doctors={doctors}
                visit={visit}
                setPastVisitModal={setPastVisitModal}
                onSave={onSave}
              />
            </div>

            {/* History pane */}
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                height: "100%",
                minHeight: 0,
                padding: "16px",
                overflowY: "auto",
                overflowX: "hidden",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              <HistoryPage modal={modal} timeline={timeline} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
