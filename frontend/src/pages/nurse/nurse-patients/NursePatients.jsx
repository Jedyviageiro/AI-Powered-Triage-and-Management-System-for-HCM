import NursePage from "../NursePage";

export function NursePatientsView({
  pastVisits,
  loadingPastVisits,
  loadPastVisits,
  inferHospitalStatus,
  inferVitalStatus,
  openPastVisitModal,
  pdfLoadingId,
  downloadVisitPdf,
}) {
  return (
    <div className="dash-animate dash-animate-delay-1">
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: "28px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#0f172a",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            Pacientes antigos
          </h1>
          <p style={{ fontSize: "13px", color: "#6b7280", marginTop: "3px", marginBottom: 0 }}>
            {pastVisits.length} {pastVisits.length === 1 ? "visita" : "visitas"} · histórico clínico
            completo
          </p>
        </div>
        <button
          onClick={loadPastVisits}
          disabled={loadingPastVisits}
          style={{
            fontSize: "13px",
            padding: "7px 18px",
            borderRadius: "20px",
            border: "0.5px solid #e5e7eb",
            background: "#0f172a",
            color: "white",
            cursor: "pointer",
            fontWeight: "500",
            fontFamily: "inherit",
            opacity: loadingPastVisits ? 0.6 : 1,
          }}
        >
          {loadingPastVisits ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {loadingPastVisits && pastVisits.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "0.5px solid #e5e7eb",
            borderRadius: "14px",
            padding: "24px",
            display: "grid",
            gap: "12px",
          }}
        >
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skeleton-line"
              style={{ height: "16px", width: i % 2 === 0 ? "100%" : "82%" }}
            />
          ))}
        </div>
      ) : pastVisits.length === 0 ? (
        <div
          style={{
            background: "white",
            border: "0.5px solid #e5e7eb",
            borderRadius: "14px",
            textAlign: "center",
            padding: "72px 40px",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#d1d5db"
            strokeWidth="1.2"
            style={{ margin: "0 auto 12px", display: "block" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p style={{ fontSize: "14px", color: "#9ca3af", fontWeight: "500", margin: 0 }}>
            Nenhum histórico encontrado
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            border: "0.5px solid #e5e7eb",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                tableLayout: "fixed",
                minWidth: "1100px",
              }}
            >
              <colgroup>
                <col style={{ width: "60px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "180px" }} />
                <col style={{ width: "220px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "120px" }} />
                <col style={{ width: "80px" }} />
              </colgroup>
              <thead style={{ background: "#f9fafb" }}>
                <tr>
                  {[
                    "Visita",
                    "Paciente",
                    "Queixa principal",
                    "Diagnóstico / resumo",
                    "Médico",
                    "Destino",
                    "Vital",
                    "Data",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        padding: "11px 16px",
                        textAlign: "left",
                        borderBottom: "0.5px solid #e5e7eb",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pastVisits.map((v, idx) => {
                  const hospitalStatus = inferHospitalStatus(v);
                  const vitalStatus = inferVitalStatus(v);
                  const isObit = vitalStatus === "Óbito";
                  const initials = (v.full_name || "?")
                    .split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase();
                  const hospitalPillStyle = (() => {
                    const s = String(v.hospital_status || v.disposition_plan || "").toUpperCase();
                    if (
                      s === "DISCHARGED" ||
                      s === "HOME" ||
                      hospitalStatus === "Alta" ||
                      hospitalStatus === "Alta com Retorno"
                    ) {
                      return { background: "#e9f8ed", color: "#1a7a3c" };
                    }
                    if (s === "IN_HOSPITAL" || s === "ADMIT_URGENT") {
                      return { background: "#e6f1fb", color: "#0c447c" };
                    }
                    if (s === "BED_REST") return { background: "#faeeda", color: "#633806" };
                    if (s === "TRANSFERRED") return { background: "#f1effd", color: "#3c3489" };
                    if (s === "DECEASED") return { background: "#fde8e8", color: "#791f1f" };
                    return { background: "#f3f4f6", color: "#6b7280" };
                  })();
                  const rowBg = idx % 2 === 0 ? "white" : "#fafafa";

                  return (
                    <tr
                      key={v.id}
                      onClick={() => openPastVisitModal(v)}
                      style={{
                        borderBottom: "0.5px solid #f0f0f0",
                        background: rowBg,
                        cursor: "pointer",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f3f4f6";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = rowBg;
                      }}
                    >
                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#6b7280",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          #{v.id}
                        </span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#f3f4f6",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#374151",
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#0f172a",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {v.full_name || "-"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#9ca3af",
                                marginTop: "1px",
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {v.clinical_code || "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#374151",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={v.chief_complaint || v.triage_chief_complaint || "-"}
                        >
                          {v.chief_complaint || v.triage_chief_complaint || (
                            <span style={{ color: "#d1d5db" }}>-</span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: "#0f172a",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                          title={v.likely_diagnosis || "-"}
                        >
                          {v.likely_diagnosis || (
                            <span style={{ color: "#d1d5db", fontWeight: "400" }}>-</span>
                          )}
                        </div>
                        {(v.clinical_reasoning || v.prescription_text) && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              marginTop: "2px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {v.clinical_reasoning || v.prescription_text}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#374151",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {v.doctor_full_name || v.doctor_username || (
                            <span style={{ color: "#d1d5db" }}>-</span>
                          )}
                        </div>
                        {v.doctor_specialization && (
                          <div style={{ fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                            {v.doctor_specialization}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "11px",
                            fontWeight: "500",
                            padding: "3px 9px",
                            borderRadius: "20px",
                            ...hospitalPillStyle,
                          }}
                        >
                          {hospitalStatus}
                        </span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            color: isObit ? "#b01c1c" : "#1a7a3c",
                          }}
                        >
                          {isObit ? "Óbito" : "Vivo"}
                        </span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <span style={{ fontSize: "12px", color: "#6b7280", whiteSpace: "nowrap" }}>
                          {v.consultation_ended_at || v.arrival_time
                            ? new Date(
                                v.consultation_ended_at || v.arrival_time
                              ).toLocaleDateString("pt-PT", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                      </td>

                      <td style={{ padding: "13px 16px" }}>
                        <button
                          type="button"
                          disabled={pdfLoadingId === v.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadVisitPdf(v);
                          }}
                          style={{
                            fontSize: "11px",
                            padding: "5px 12px",
                            borderRadius: "20px",
                            border: "0.5px solid #e5e7eb",
                            background: "transparent",
                            color: "#6b7280",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontFamily: "inherit",
                            opacity: pdfLoadingId === v.id ? 0.5 : 1,
                          }}
                        >
                          {pdfLoadingId === v.id ? "..." : "PDF"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NursePatients() {
  return <NursePage forcedView="patients" />;
}
