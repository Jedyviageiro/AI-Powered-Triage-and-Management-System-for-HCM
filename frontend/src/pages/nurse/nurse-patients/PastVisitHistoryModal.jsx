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
  const isEditing = modal.editingPatient && !modal.patientLoading;
  const softCardStyle = {
    margin: 0,
    padding: "16px",
    background: "#ffffff",
    boxShadow: "none",
    borderRadius: "20px",
    border: "0.5px solid rgba(0,0,0,.06)",
  };
  const infoTileStyle = {
    padding: "10px 12px",
    borderRadius: "14px",
    background: "#f8f8fa",
  };
  return (
    <div className="popup-overlay">
      <div
        className="popup-card"
        style={{
          maxWidth: "960px",
          width: "95%",
          maxHeight: "86vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: "24px",
          border: "0.5px solid rgba(0,0,0,.08)",
          background: "#ffffff",
          boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "4px",
            borderRadius: "2px",
            background: "#d1d5db",
            margin: "10px auto 0",
          }}
        />
        <div
          style={{
            padding: "18px 22px 14px",
            borderBottom: "0.5px solid rgba(0,0,0,.08)",
            background: "#ffffff",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
              {profilePhoto ? (
                <img
                  src={profilePhoto}
                  alt={profileName}
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    objectFit: "cover",
                    border: "1px solid rgba(0,0,0,.06)",
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #eef5f0, #dbe9e0)",
                    color: "#165034",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {String(profileName || "P")
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1c1c1e",
                    letterSpacing: "-0.4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {profileName}
                </div>
                <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "3px" }}>
                  {profileCode} · Consulta #{visit.id}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: "#f4f4f5",
                      color: "#636366",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {inferHospitalStatus(visit)}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: inferVitalStatus(visit) === "Óbito" ? "#fff1f1" : "#eef8f1",
                      color: inferVitalStatus(visit) === "Óbito" ? "#7f1d1d" : "#1a7a3c",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {inferVitalStatus(visit)}
                  </span>
                </div>
              </div>
            </div>
            <div
              style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}
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
                  padding: "9px 14px",
                  borderRadius: "999px",
                  background: "#f6f6f7",
                  borderColor: "rgba(0,0,0,.08)",
                }}
              >
                {modal.editingPatient ? "Cancelar edição" : "Editar perfil"}
              </button>
              <button
                type="button"
                disabled={pdfLoadingId === visit.id}
                onClick={() => onDownloadPdf(visit)}
                className="btn-primary"
                style={{ width: "auto", padding: "9px 14px", borderRadius: "999px" }}
              >
                {pdfLoadingId === visit.id ? "Gerando..." : "Baixar PDF"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                style={{ width: "auto", padding: "9px 14px", borderRadius: "999px" }}
              >
                Fechar
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: "16px",
              display: "inline-flex",
              padding: "4px",
              background: "#f5f5f7",
              borderRadius: "14px",
              gap: "4px",
            }}
          >
            <button
              type="button"
              onClick={() => setPastVisitModal((prev) => ({ ...prev, page: "profile" }))}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                background: modal.page === "profile" ? "#ffffff" : "transparent",
                color: modal.page === "profile" ? "#1c1c1e" : "#6b7280",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Perfil
            </button>
            <button
              type="button"
              onClick={() => setPastVisitModal((prev) => ({ ...prev, page: "history" }))}
              style={{
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: 600,
                background: modal.page === "history" ? "#ffffff" : "transparent",
                color: modal.page === "history" ? "#1c1c1e" : "#6b7280",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Histórico clínico
            </button>
          </div>
        </div>
        <div style={{ overflow: "hidden", flex: 1, background: "#fbfbfc" }}>
          <div
            style={{
              display: "flex",
              width: "200%",
              height: "100%",
              transform: modal.page === "profile" ? "translateX(0%)" : "translateX(-50%)",
              transition: "transform 0.28s ease",
            }}
          >
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                padding: "18px",
                overflowY: "scroll",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              {modal.detailLoading && !modal.patientProfile ? (
                <div className="form-card" style={{ ...softCardStyle, color: "#6b7280" }}>
                  Carregando perfil do paciente...
                </div>
              ) : (
                <div style={{ display: "grid", gap: "14px" }}>
                  <div
                    style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: "14px" }}
                  >
                    <div className="form-card" style={softCardStyle}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#8e8e93",
                          marginBottom: "14px",
                        }}
                      >
                        Perfil do paciente
                      </div>
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
                          <div
                            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
                          >
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
                            placeholder="Nome do responsável"
                          />
                          <input
                            className="triage-input"
                            value={modal.patientForm.guardian_phone}
                            onChange={(e) =>
                              setPastVisitModal((prev) => ({
                                ...prev,
                                patientForm: {
                                  ...prev.patientForm,
                                  guardian_phone: e.target.value,
                                },
                              }))
                            }
                            placeholder="Telefone do responsável"
                          />
                        </div>
                      ) : (
                        <div style={{ display: "grid", gap: "12px" }}>
                          {[
                            {
                              label: "Data de nascimento",
                              value: profileDob
                                ? new Date(`${profileDob}T00:00:00`).toLocaleDateString("pt-PT")
                                : "Nao informado",
                            },
                            {
                              label: "Idade",
                              value:
                                profileAge != null
                                  ? `${profileAge} ano${profileAge === 1 ? "" : "s"}`
                                  : "Nao informado",
                            },
                            { label: "Nome do responsável", value: profileGuardian },
                            { label: "Telefone", value: profilePhone },
                            { label: "Morada", value: profileAddress },
                          ].map((item) => (
                            <div key={item.label} style={infoTileStyle}>
                              <div
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: ".08em",
                                  color: "#8e8e93",
                                  marginBottom: "4px",
                                }}
                              >
                                {item.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: 600,
                                  color: "#1c1c1e",
                                  lineHeight: 1.4,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-card" style={softCardStyle}>
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          letterSpacing: ".08em",
                          textTransform: "uppercase",
                          color: "#8e8e93",
                          marginBottom: "14px",
                        }}
                      >
                        Consulta selecionada
                      </div>
                      <div style={{ display: "grid", gap: "12px" }}>
                        {[
                          {
                            label: "Médico",
                            value:
                              (visit.doctor_full_name || visit.doctor_username || "-") +
                              (visit.doctor_specialization
                                ? ` (${visit.doctor_specialization})`
                                : ""),
                          },
                          {
                            label: "Data",
                            value:
                              visit.consultation_ended_at || visit.arrival_time
                                ? new Date(
                                    visit.consultation_ended_at || visit.arrival_time
                                  ).toLocaleString("pt-PT")
                                : "-",
                          },
                          { label: "Estado hospitalar", value: inferHospitalStatus(visit) },
                          { label: "Estado vital", value: inferVitalStatus(visit) },
                        ].map((item) => (
                          <div key={item.label} style={infoTileStyle}>
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".08em",
                                color: "#8e8e93",
                                marginBottom: "4px",
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1c1c1e",
                                lineHeight: 1.4,
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="form-card" style={softCardStyle}>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                        color: "#8e8e93",
                        marginBottom: "14px",
                      }}
                    >
                      Resumo clínico
                    </div>
                    <div style={{ display: "grid", gap: "12px" }}>
                      {[
                        ["Queixa principal", "chief_complaint", 3],
                        ["Diagnóstico", "likely_diagnosis", 3],
                        ["Justificativa clínica", "clinical_reasoning", 4],
                        ["Prescrição", "prescription_text", 4],
                      ].map(([label, field, rows]) => (
                        <div
                          key={field}
                          style={{
                            padding: "12px 14px",
                            borderRadius: "16px",
                            background: "#f8f8fa",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: ".08em",
                              color: "#8e8e93",
                              marginBottom: "8px",
                            }}
                          >
                            {label}
                          </div>
                          {isEditing ? (
                            <textarea
                              className="triage-input"
                              rows={rows}
                              value={modal.patientForm[field]}
                              onChange={(e) =>
                                setPastVisitModal((prev) => ({
                                  ...prev,
                                  patientForm: { ...prev.patientForm, [field]: e.target.value },
                                }))
                              }
                              style={{ resize: "none", background: "#fff" }}
                            />
                          ) : (
                            <div
                              style={{
                                fontSize: "13px",
                                color: "#1c1c1e",
                                lineHeight: 1.55,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {field === "chief_complaint"
                                ? visit.chief_complaint || visit.triage_chief_complaint || "-"
                                : visit[field] || "-"}
                            </div>
                          )}
                        </div>
                      ))}
                      {isEditing && (
                        <div
                          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}
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
                                patientForm: {
                                  ...prev.patientForm,
                                  hospital_status: e.target.value,
                                },
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
                    </div>
                  </div>
                  {isEditing && (
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ width: "auto", padding: "10px 16px", borderRadius: "999px" }}
                        onClick={() =>
                          setPastVisitModal((prev) => ({ ...prev, editingPatient: false }))
                        }
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
                </div>
              )}
            </div>
            <div
              className="popup-scroll"
              style={{
                width: "50%",
                padding: "18px",
                overflowY: "scroll",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                scrollbarGutter: "stable",
              }}
            >
              <div style={{ display: "grid", gap: "14px" }}>
                {modal.detailLoading && timeline.length === 0 ? (
                  <div className="form-card" style={{ ...softCardStyle, color: "#6b7280" }}>
                    Carregando histórico clínico...
                  </div>
                ) : timeline.length === 0 ? (
                  <div
                    className="form-card"
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
                  timeline.map((row) => {
                    const vitals = [
                      row?.temperature != null ? `Temp ${row.temperature}°C` : null,
                      row?.heart_rate != null ? `FC ${row.heart_rate} bpm` : null,
                      row?.respiratory_rate != null ? `FR ${row.respiratory_rate} rpm` : null,
                      row?.oxygen_saturation != null ? `SpO2 ${row.oxygen_saturation}%` : null,
                      row?.weight != null ? `Peso ${row.weight} kg` : null,
                    ].filter(Boolean);
                    return (
                      <div key={row.visit_id || row.id} className="form-card" style={softCardStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: "12px",
                            marginBottom: "14px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "16px",
                                fontWeight: 700,
                                color: "#1c1c1e",
                                letterSpacing: "-0.2px",
                              }}
                            >
                              {row?.chief_complaint ||
                                row?.return_visit_reason ||
                                (row?.lab_requested
                                  ? row?.lab_exam_type || "Retorno laboratorial"
                                  : "Sem motivo registado")}
                            </div>
                            <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "4px" }}>
                              {row?.arrival_time
                                ? new Date(row.arrival_time).toLocaleString("pt-PT")
                                : "-"}{" "}
                              · Visita #{row.visit_id || row.id}
                            </div>
                          </div>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "5px 10px",
                              borderRadius: "999px",
                              background: "#f4f4f5",
                              color: "#636366",
                              fontSize: "11px",
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {statusLabelForVisit(row)}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <div style={infoTileStyle}>
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".08em",
                                color: "#8e8e93",
                                marginBottom: "4px",
                              }}
                            >
                              Médico
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1c1c1e",
                                lineHeight: 1.45,
                              }}
                            >
                              {row?.doctor_full_name || row?.doctor_username || "Não registado"}
                              {row?.doctor_specialization ? ` (${row.doctor_specialization})` : ""}
                            </div>
                          </div>
                          <div style={infoTileStyle}>
                            <div
                              style={{
                                fontSize: "10px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: ".08em",
                                color: "#8e8e93",
                                marginBottom: "4px",
                              }}
                            >
                              Doença / diagnóstico
                            </div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#1c1c1e",
                                lineHeight: 1.45,
                              }}
                            >
                              {row?.likely_diagnosis || "Não registado"}
                            </div>
                          </div>
                        </div>
                        <div style={{ ...infoTileStyle, marginBottom: "12px" }}>
                          <div
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              letterSpacing: ".08em",
                              color: "#8e8e93",
                              marginBottom: "8px",
                            }}
                          >
                            Sinais vitais do dia
                          </div>
                          {vitals.length > 0 ? (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                              {vitals.map((item) => (
                                <span
                                  key={item}
                                  style={{
                                    padding: "5px 10px",
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
                          ) : (
                            <div style={{ fontSize: "12px", color: "#8e8e93" }}>
                              Sem sinais vitais registados nesta visita.
                            </div>
                          )}
                        </div>
                        <div style={{ display: "grid", gap: "10px" }}>
                          {[
                            {
                              label: "Resumo clínico",
                              value: row?.clinical_notes || row?.clinical_reasoning || "-",
                            },
                            { label: "Prescrição", value: row?.prescription_text || "-" },
                          ].map((section) => (
                            <div key={section.label} style={infoTileStyle}>
                              <div
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: ".08em",
                                  color: "#8e8e93",
                                  marginBottom: "6px",
                                }}
                              >
                                {section.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: "#1c1c1e",
                                  lineHeight: 1.55,
                                  whiteSpace: "pre-wrap",
                                }}
                              >
                                {section.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
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
