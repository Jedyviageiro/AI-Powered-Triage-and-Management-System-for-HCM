import NursePage from "../NursePage";

export function NurseDestinationView({
  destinationRows,
  loadQueue,
  loadingQueue,
  inferHospitalStatus,
  formatRelativeUpdate,
  destinationSavingId,
  destinationPlacement,
  setDestinationPlacement,
  destinationNotes,
  setDestinationNotes,
  pdfLoadingId,
  downloadDischargeSummaryPdf,
  registerAdmissionPlacement,
  updateDestinationStatus,
}) {
  return (
    <div className="dash-animate dash-animate-delay-1">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Destino</h1>
          <p className="text-sm text-gray-500">
            {destinationRows.length} paciente(s) em observação / destino ativo
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loadingQueue}
          className="btn-primary"
          style={{ width: "auto", padding: "9px 18px", fontSize: "13px" }}
        >
          {loadingQueue ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div
        style={{
          marginBottom: "14px",
          border: "1px solid #dcebe2",
          background: "#f8fbf9",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "12px",
          color: "#4b5563",
          lineHeight: 1.5,
        }}
      >
        O médico decide o destino clínico. A enfermagem ou a equipa administrativa registra a
        admissão com leito/local quando o médico define <strong>Internamento/Urgência</strong> ou{" "}
        <strong>Repouso</strong>, e conclui a alta quando o médico define <strong>Alta</strong>.
      </div>

      {loadingQueue && destinationRows.length === 0 ? (
        <div className="form-card" style={{ padding: "18px", display: "grid", gap: "10px" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`destination-skeleton-${i}`}
              className="skeleton-line"
              style={{ height: "16px", width: i % 2 === 0 ? "100%" : "92%" }}
            />
          ))}
        </div>
      ) : destinationRows.length === 0 ? (
        <div className="form-card" style={{ textAlign: "center", padding: "60px 40px" }}>
          <svg
            className="w-12 h-12 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#d1d5db"
            strokeWidth="1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V7a2 2 0 012-2h10a2 2 0 012 2v12a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 font-medium">Nenhum paciente em observação / destino ativo</p>
        </div>
      ) : (
        <div className="form-card" style={{ padding: 0, overflowX: "auto" }}>
          <table className="w-full" style={{ minWidth: "1080px" }}>
            <thead style={{ background: "#fafafa", borderBottom: "1px solid #f0f0f0" }}>
              <tr>
                {[
                  "Paciente",
                  "Leito / Local",
                  "Estado Atual",
                  "Última Atualização",
                  "Médico",
                  "Nota de Alta",
                  "Ações",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#6b7280",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {destinationRows.map((row, idx) => {
                const visitId = Number(row?.id);
                const disposition = String(row?.disposition_plan || "").toUpperCase();
                const canDischarge = disposition === "HOME";
                const canTransfer = disposition === "ADMIT_URGENT";
                const canRegisterAdmission =
                  disposition === "ADMIT_URGENT" || disposition === "BED_REST";
                const admissionStatus = disposition === "ADMIT_URGENT" ? "IN_HOSPITAL" : "BED_REST";
                const location =
                  [row?.inpatient_unit, row?.inpatient_bed].filter(Boolean).join(" • ") ||
                  inferHospitalStatus(row);
                const statusText = inferHospitalStatus(row);
                const isSaving = destinationSavingId === visitId;
                const rowBg = idx % 2 === 0 ? "#ffffff" : "#fbfdfc";
                return (
                  <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9", background: rowBg }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "600", fontSize: "13px", color: "#111827" }}>
                        {row.full_name || "-"}
                      </div>
                      <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                        {row.clinical_code || "-"} • Visita #{row.id}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                      {location}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                      {statusText}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                      {formatRelativeUpdate(
                        row?.updated_at || row?.consultation_started_at || row?.arrival_time
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#374151" }}>
                      {row.doctor_full_name || row.doctor_username || "-"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "grid", gap: 8, minWidth: "220px" }}>
                        {canRegisterAdmission && (
                          <>
                            <input
                              className="triage-input"
                              value={destinationPlacement[visitId]?.inpatient_unit || ""}
                              onChange={(e) =>
                                setDestinationPlacement((prev) => ({
                                  ...(prev || {}),
                                  [visitId]: {
                                    ...(prev?.[visitId] || {}),
                                    inpatient_unit: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Sala / unidade (opcional)"
                            />
                            <input
                              className="triage-input"
                              value={
                                destinationPlacement[visitId]?.inpatient_bed ||
                                row?.inpatient_bed ||
                                ""
                              }
                              onChange={(e) =>
                                setDestinationPlacement((prev) => ({
                                  ...(prev || {}),
                                  [visitId]: {
                                    ...(prev?.[visitId] || {}),
                                    inpatient_bed: e.target.value,
                                  },
                                }))
                              }
                              placeholder="Leito / local"
                            />
                          </>
                        )}
                        <textarea
                          className="triage-input"
                          rows="2"
                          value={destinationNotes[visitId] || ""}
                          onChange={(e) =>
                            setDestinationNotes((prev) => ({
                              ...(prev || {}),
                              [visitId]: e.target.value,
                            }))
                          }
                          placeholder={
                            canDischarge
                              ? "Resumo/nota de alta"
                              : canRegisterAdmission
                                ? "Nota de admissão/transferência"
                                : "Nota opcional de alta/transferência"
                          }
                          style={{ resize: "none" }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {canDischarge && (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={pdfLoadingId === visitId}
                            onClick={() => downloadDischargeSummaryPdf(row)}
                            title="Gerar resumo de alta em PDF"
                            style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}
                          >
                            {pdfLoadingId === visitId ? "Gerando PDF..." : "Resumo de Alta"}
                          </button>
                        )}
                        {canRegisterAdmission && (
                          <button
                            type="button"
                            className="btn-secondary"
                            disabled={isSaving}
                            onClick={() => registerAdmissionPlacement(row, admissionStatus)}
                            title={
                              admissionStatus === "IN_HOSPITAL"
                                ? "Registrar internamento e atribuir leito"
                                : "Registrar repouso e atribuir leito/local"
                            }
                            style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}
                          >
                            {isSaving
                              ? "Salvando..."
                              : admissionStatus === "IN_HOSPITAL"
                                ? "Registrar Internamento"
                                : "Registrar Repouso"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={!canDischarge || isSaving}
                          onClick={() => updateDestinationStatus(row, "DISCHARGED")}
                          title={
                            canDischarge
                              ? "Registrar alta"
                              : "Alta disponível apenas após destino definido pelo médico como alta."
                          }
                          style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}
                        >
                          {isSaving ? "Salvando..." : "Alta"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          disabled={!canTransfer || isSaving}
                          onClick={() => updateDestinationStatus(row, "TRANSFERRED")}
                          title={
                            canTransfer
                              ? "Registrar transferência"
                              : "Transferência disponível apenas após indicação médica de internamento/urgência."
                          }
                          style={{ width: "auto", padding: "7px 12px", fontSize: "12px" }}
                        >
                          Transferir
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function NurseDestination() {
  return <NursePage forcedView="destination" />;
}
