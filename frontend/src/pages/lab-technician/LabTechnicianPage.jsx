import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { clearAuth } from "../../lib/auth";
import { LAB_VIEW_ROUTES } from "./lab-config/labNavigationConfig";
import {
  EXAM_PROTOCOLS,
  buildStructuredMachineResult,
  examLabel,
  resolveSampleLabel,
} from "./lab-helpers/labExamHelpers";
import { saveLocalLabNotificationReadMap } from "./lab-helpers/labNotificationHelpers";
import { useLabPageShellState } from "./lab-hooks/useLabPageShellState";
import { useLabDerivedState } from "./lab-hooks/useLabDerivedState.jsx";
import { LabLayout } from "./lab-layout/LabLayout";
import ConfirmDialog from "../../components/shared/ConfirmDialog";
import { useClickOutside } from "../../hooks/useClickOutside";

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #f2f2f7; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d1d1d6; border-radius: 99px; }
  .lab-field { width:100%; padding:9px 12px; border-radius:10px; border:0.5px solid rgba(0,0,0,.12); background:#fff; font-size:13px; color:#1c1c1e; font-family:inherit; outline:none; appearance:none; transition:border-color .15s, box-shadow .15s; }
  .lab-field:focus { border-color:#007aff; box-shadow:0 0 0 3px rgba(0,122,255,.1); }
  select.lab-field { background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 10px center; padding-right:28px; }
  .btn-primary { background:#007aff; color:#fff; font-size:14px; font-weight:600; padding:10px 22px; border-radius:12px; border:none; cursor:pointer; font-family:inherit; transition:background .15s; }
  .btn-primary:hover:not(:disabled) { background:#0070e8; }
  .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
  .btn-ghost { background:none; color:#007aff; font-size:13px; font-weight:600; padding:8px 14px; border-radius:10px; border:none; cursor:pointer; font-family:inherit; transition:background .15s; }
  .btn-ghost:hover { background:rgba(0,122,255,.08); }
  .btn-secondary { background:#fff; color:#1c1c1e; font-size:13px; font-weight:500; padding:8px 14px; border-radius:10px; border:0.5px solid rgba(0,0,0,.12); cursor:pointer; font-family:inherit; }
  .card { background:#fff; border-radius:16px; overflow:hidden; border:0.5px solid rgba(0,0,0,.06); }
  .card-head { padding:14px 16px; border-bottom:0.5px solid rgba(0,0,0,.07); }
  .card-title { font-size:14px; font-weight:600; color:#1c1c1e; }
  .card-sub { font-size:11px; color:#8e8e93; margin-top:1px; }
  .tbl { width:100%; border-collapse:collapse; }
  .tbl thead th { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.07em; color:#8e8e93; padding:8px 14px; text-align:left; background:#fafafa; border-bottom:0.5px solid rgba(0,0,0,.06); }
  .tbl tbody td { padding:10px 14px; font-size:12px; color:#1c1c1e; border-bottom:0.5px solid rgba(0,0,0,.04); vertical-align:middle; }
  .tbl tbody tr:last-child td { border-bottom:none; }
  .tbl tbody tr:hover td { background:#fafafa; cursor:pointer; }
  .quick-item { padding:12px 14px; border-bottom:0.5px solid rgba(0,0,0,.06); display:flex; align-items:center; justify-content:space-between; gap:8px; cursor:pointer; transition:background .1s; }
  .quick-item:last-child { border-bottom:none; }
  .quick-item:hover { background:#fafafa; }
  .open-btn { font-size:11px; font-weight:600; padding:5px 12px; border-radius:8px; border:none; background:#f2f2f7; color:#007aff; cursor:pointer; font-family:inherit; transition:background .1s; white-space:nowrap; }
  .open-btn:hover { background:#e5e5ea; }
  .meta-tile { background:#f2f2f7; border-radius:12px; padding:10px 12px; }
  .mt-lbl { font-size:10px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:#8e8e93; display:block; margin-bottom:2px; }
  .mt-val { font-size:13px; font-weight:600; color:#1c1c1e; }
  .step-pill { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:3px 0; }
  .step-dot { width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:700; flex-shrink:0; }
  .step-line-h { height:1px; width:20px; background:#e5e5ea; }
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:100; padding:20px; }
  .modal-sheet { background:#fff; border-radius:20px; width:100%; max-width:620px; max-height:88vh; overflow-y:auto; }
  .modal-handle { width:36px; height:4px; border-radius:2px; background:#e5e5ea; margin:10px auto 0; }
  .modal-head { padding:16px 20px 14px; border-bottom:0.5px solid rgba(0,0,0,.07); }
  .modal-body { padding:16px 20px; display:flex; flex-direction:column; gap:16px; }
  .modal-footer { padding:14px 20px; border-top:0.5px solid rgba(0,0,0,.07); display:flex; justify-content:space-between; align-items:center; gap:10px; position:sticky; bottom:0; background:#fff; }
  .ms-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.07em; color:#8e8e93; margin-bottom:8px; }
  .sidebar-open { width:220px; }
  .sidebar-closed { width:60px; }
  .sidebar { background:#0c3a24; color:#fff; }
  .sidebar nav { overflow-x:hidden; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(220,235,226,0.55) transparent; }
  .sidebar nav::-webkit-scrollbar { width:8px; }
  .sidebar nav::-webkit-scrollbar-thumb { background:rgba(220,235,226,0.45); border-radius:9999px; border:2px solid transparent; background-clip:padding-box; }
  .sidebar-open .nav-label { opacity:1; max-width:180px; }
  .sidebar-closed .nav-label { opacity:0; max-width:0; }
  .sidebar-closed .nav-badge { position:absolute; top:2px; right:2px; width:18px; height:18px; font-size:10px; border-radius:9999px; }
  .nav-badge-open { width:20px; height:20px; border-radius:9999px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; }
  .nav-label { overflow:hidden; white-space:nowrap; transition:opacity .2s ease, max-width .24s ease; }
  .sidebar-nav-btn { position:relative; border-radius:0 !important; margin-left:0; width:100% !important; font-size:12px; font-weight:500; }
  .sidebar-open .sidebar-nav-btn { padding-left:20px !important; }
  .sidebar-nav-inactive { color:rgba(255,255,255,.9); }
  .sidebar-nav-inactive:hover { background:rgba(255,255,255,.06) !important; color:#fff; }
  .nav-active { background:rgba(134,214,163,.14) !important; color:#fff !important; font-weight:600; margin-right:-12px !important; width:calc(100% + 12px) !important; padding-left:20px !important; border-radius:0 !important; box-shadow:none !important; }
  .nav-indicator { position:absolute; left:0; width:3px; background:#7fe0a0; border-radius:0; transition:top .22s cubic-bezier(.4,0,.2,1), height .22s cubic-bezier(.4,0,.2,1), opacity .18s ease; pointer-events:none; }
  .nav-item-wrap { position:relative; }
  .nav-tooltip { position:absolute; left:calc(100% + 10px); top:50%; transform:translateY(-50%); background:#111827; color:#fff; font-size:12px; padding:4px 10px; border-radius:6px; white-space:nowrap; pointer-events:none; opacity:0; transition:opacity .15s; z-index:100; }
  .sidebar-closed .nav-item-wrap:hover .nav-tooltip { opacity:1; }
  .sidebar-open .nav-tooltip { display:none; }
  .sidebar .nav-item-wrap,
  .sidebar .nav-item-wrap > button { border-radius:0 !important; }
  .sidebar-closed .nav-item-wrap > button { justify-content:center; gap:0 !important; padding-left:10px !important; padding-right:10px !important; }
  .sidebar-closed .nav-active { padding-left:0 !important; justify-content:center !important; }
`;

const SIDEBAR_BG = "#0c3a24";

const StatusBadge = ({ status }) => {
  const cfg = {
    WAITING_DOCTOR: { bg: "#fff3e0", color: "#c07700", label: "Aguardando médico" },
    IN_CONSULTATION: { bg: "#e3f2fd", color: "#0077cc", label: "Em consulta" },
    FINISHED: { bg: "#e8f5e9", color: "#1a7a3c", label: "Finalizado" },
    RECEIVED: { bg: "#e3f2fd", color: "#0077cc", label: "Amostra recebida" },
    PROCESSING: { bg: "#f3e8ff", color: "#7c3aed", label: "Em análise" },
    READY: { bg: "#e8f5e9", color: "#1a7a3c", label: "Pronto" },
    PENDING: { bg: "#fff3e0", color: "#c07700", label: "Pendente" },
  };
  const current = cfg[String(status || "").toUpperCase()] || {
    bg: "#f2f2f7",
    color: "#8e8e93",
    label: status || "-",
  };

  return (
    <span
      style={{
        background: current.bg,
        color: current.color,
        fontSize: "10px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
      }}
    >
      {current.label}
    </span>
  );
};

function ResultModal({ visit, protocol, fields, onClose, onSave, saving }) {
  const isReady = String(visit?.lab_result_status || "").toUpperCase() === "READY";
  const [step, setStep] = useState(isReady ? 3 : 1);
  const [sampleAt, setSampleAt] = useState(visit?.lab_sample_collected_at?.slice(0, 16) || "");
  const [form, setForm] = useState(() =>
    Object.fromEntries(fields.map((field) => [field.key, ""]))
  );
  const [notes, setNotes] = useState("");
  const [resultText, setResultText] = useState(visit?.lab_result_text || "");
  const fileRef = useRef(null);
  const sampleLabel = resolveSampleLabel(visit, protocol);
  const steps = [
    { n: 1, label: "Amostra" },
    { n: 2, label: "Leitura" },
    { n: 3, label: "Confirmar" },
  ];

  const nextStep = () => setStep((current) => Math.min(3, current + 1));
  const prevStep = () => setStep((current) => Math.max(1, current - 1));

  return (
    <div
      className="modal-overlay"
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div className="modal-head">
          <div
            style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}
          >
            <div>
              <div
                style={{
                  fontSize: "17px",
                  fontWeight: "700",
                  color: "#1c1c1e",
                  letterSpacing: "-.3px",
                }}
              >
                {isReady ? "Rever resultado" : "Inserir resultado"}
              </div>
              <div style={{ fontSize: "12px", color: "#8e8e93", marginTop: "3px" }}>
                {examLabel(visit?.lab_exam_type, visit?.lab_tests)} · {visit?.full_name || "-"} ·{" "}
                {visit?.clinical_code || "-"}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <StatusBadge status={visit?.lab_result_status || "PENDING"} />
              <button
                onClick={onClose}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#f2f2f7",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="11"
                  height="11"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="#8e8e93"
                  strokeWidth="2.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isReady && (
            <div style={{ display: "flex", alignItems: "center", gap: 0, marginTop: "14px" }}>
              {steps.map((item, index) => (
                <div key={item.n} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                  <div
                    className="step-pill"
                    style={{ cursor: step > item.n ? "pointer" : "default" }}
                    onClick={() => step > item.n && setStep(item.n)}
                  >
                    <div
                      className="step-dot"
                      style={{
                        background: step >= item.n ? "#007aff" : "#e5e7eb",
                        color: step >= item.n ? "#fff" : "#8e8e93",
                      }}
                    >
                      {item.n}
                    </div>
                    <span style={{ color: step >= item.n ? "#1c1c1e" : "#8e8e93" }}>
                      {item.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && <div className="step-line-h" />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-body">
          {step === 1 && (
            <>
              <div className="meta-tile">
                <span className="mt-lbl">Tipo de amostra</span>
                <span className="mt-val">{sampleLabel}</span>
              </div>
              <div>
                <div className="ms-label">Receção da amostra</div>
                <input
                  type="datetime-local"
                  className="lab-field"
                  value={sampleAt}
                  onChange={(event) => setSampleAt(event.target.value)}
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              {(protocol?.sections || []).map((section) => (
                <div key={section.title} style={{ display: "grid", gap: 12 }}>
                  <div className="ms-label">{section.title}</div>
                  <div style={{ display: "grid", gap: 12 }}>
                    {(section.fields || []).map((field) => (
                      <div key={field.key}>
                        <label className="ms-label" style={{ marginBottom: 6, display: "block" }}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </label>
                        {field.type === "select" ? (
                          <select
                            className="lab-field"
                            value={form[field.key] || ""}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                          >
                            <option value="">Selecionar</option>
                            {(field.options || []).map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type === "number" ? "number" : "text"}
                            step={field.step || undefined}
                            placeholder={field.placeholder || ""}
                            className="lab-field"
                            value={form[field.key] || ""}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div>
                <div className="ms-label">Notas técnicas</div>
                <textarea
                  className="lab-field"
                  rows={4}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Observações adicionais do laboratório"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="meta-tile">
                <span className="mt-lbl">Resumo do exame</span>
                <span className="mt-val">{examLabel(visit?.lab_exam_type, visit?.lab_tests)}</span>
              </div>
              <div>
                <div className="ms-label">Resultado final</div>
                <textarea
                  className="lab-field"
                  rows={8}
                  value={resultText}
                  onChange={(event) => setResultText(event.target.value)}
                  placeholder="Escreva o resultado final do exame"
                />
              </div>
              <input ref={fileRef} type="file" hidden disabled />
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={step === 1 ? onClose : prevStep}>
            {step === 1 ? "Cancelar" : "Voltar"}
          </button>
          {step < 3 && !isReady ? (
            <button className="btn-primary" onClick={nextStep}>
              Continuar
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={() => onSave({ form, notes, sampleAt, resultText })}
              disabled={saving}
            >
              {saving ? "A guardar..." : "Guardar resultado"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LabTechnicianPage({ forcedView = "dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const resolvedView =
    Object.entries(LAB_VIEW_ROUTES).find(([, path]) => path === location.pathname)?.[0] ||
    forcedView;
  const {
    me,
    activeView,
    setActiveView,
    pending,
    setPending,
    ready,
    setReady,
    historyToday,
    setHistoryToday,
    loading,
    setLoading,
    err,
    setErr,
    modalVisitId,
    setModalVisitId,
    savingResult,
    setSavingResult,
    search,
    setSearch,
    sidebarOpen,
    setSidebarOpen,
    navListRef,
    navItemRefs,
    navIndicator,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    notificationReadMap,
    setNotificationReadMap,
    notificationsPreviewRef,
  } = useLabPageShellState(resolvedView);

  const openView = useCallback(
    (viewKey) => {
      const path = LAB_VIEW_ROUTES[viewKey];
      if (path && location.pathname !== path) {
        navigate(path);
        return;
      }
      setActiveView(viewKey);
    },
    [location.pathname, navigate, setActiveView]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [pendingRows, readyRows, historyRows] = await Promise.all([
        api.listLabPending(),
        api.listLabReady(200),
        api.listLabHistoryToday(),
      ]);
      setPending(Array.isArray(pendingRows) ? pendingRows : []);
      setReady(Array.isArray(readyRows) ? readyRows : []);
      setHistoryToday(Array.isArray(historyRows) ? historyRows : []);
    } catch (error) {
      setErr(error.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [setErr, setHistoryToday, setLoading, setPending, setReady]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      loadAll();
    }, 15 * 1000);
    return () => clearInterval(intervalId);
  }, [loadAll]);

  const {
    dashboardStats,
    modalVisit,
    modalExamKey,
    modalProtocol,
    modalFields,
    modalPresentation,
    navSections,
    filteredRows,
    filteredPending,
    filteredNotifications,
    notificationsUnread,
    latestNotification,
    initials,
    markNotificationRead,
    markAllNotificationsRead,
    openNotificationsPage,
  } = useLabDerivedState({
    me,
    activeView,
    search,
    pending,
    ready,
    historyToday,
    modalVisitId,
    notificationReadMap,
    setNotificationReadMap,
    setActiveView,
    setModalVisitId,
    setNotificationsPreviewOpen,
  });

  const handleSave = async ({ form, notes, sampleAt, resultText }) => {
    if (!modalVisitId) return;

    const missing = modalFields
      .filter((field) => field.required && !String(form[field.key] || "").trim())
      .map((field) => field.label);
    if (missing.length > 0) {
      setErr(`Preencha os campos obrigatórios: ${missing.join(", ")}.`);
      return;
    }

    const hasFieldInput = modalFields.some((field) => String(form[field.key] || "").trim());
    const hasNotes = !!String(notes || "").trim();
    const hasManualResult = !!String(resultText || "").trim();
    if (!hasFieldInput && !hasNotes && !hasManualResult) {
      setErr(
        "Não é possível guardar um resultado vazio. Preencha o formulário ou escreva o resultado."
      );
      return;
    }

    const lines = [`Exame: ${examLabel(modalVisit?.lab_exam_type, modalVisit?.lab_tests)}`];
    if (sampleAt) lines.push(`Amostra recebida: ${sampleAt.replace("T", " ")}`);
    modalFields.forEach((field) => {
      const value = String(form[field.key] || "").trim();
      if (value) lines.push(`${field.label}: ${value}${field.unit ? ` ${field.unit}` : ""}`);
    });
    if (notes?.trim()) lines.push(`Notas: ${notes.trim()}`);

    const payloadText = String(resultText || "").trim() || lines.join("\n");
    if (!payloadText) {
      setErr("Informe o resultado do exame.");
      return;
    }

    setSavingResult(true);
    setErr("");
    try {
      if (sampleAt) {
        await api.updateLabWorkflow(modalVisitId, {
          lab_result_status: "RECEIVED",
          lab_sample_collected_at: sampleAt,
        });
      }
      await api.saveLabResult(modalVisitId, {
        lab_result_text: payloadText,
        lab_sample_type: modalProtocol.sampleLabel || null,
        lab_result_json: {
          exam_type: modalExamKey || null,
          sample_type: modalProtocol.sampleLabel || null,
          machine_results: buildStructuredMachineResult(modalFields, form),
          technical_notes: notes || null,
        },
        lab_result_status: "READY",
        lab_result_ready_at: new Date().toISOString(),
      });
      setModalVisitId(null);
      setActiveView("ready");
      await loadAll();
    } catch (error) {
      setErr(error.message || "Erro ao guardar.");
    } finally {
      setSavingResult(false);
    }
  };

  const performLogout = () => {
    clearAuth();
    window.location.replace("/login");
  };

  const logout = () => {
    setLogoutConfirmOpen(true);
  };

  const confirmLogout = async () => {
    setLogoutBusy(true);
    try {
      performLogout();
    } finally {
      setLogoutBusy(false);
    }
  };

  useClickOutside(
    notificationsPreviewRef,
    () => setNotificationsPreviewOpen(false),
    notificationsPreviewOpen
  );

  useEffect(() => {
    saveLocalLabNotificationReadMap(notificationReadMap);
  }, [notificationReadMap]);

  const layoutProps = {
    CSS,
    SIDEBAR_BG,
    sidebarOpen,
    setSidebarOpen,
    navListRef,
    navItemRefs,
    navIndicator,
    navSections,
    openNotificationsPage,
    openView,
    activeView,
    notificationsUnread,
    logout,
    search,
    setSearch,
    notificationsPreviewRef,
    notificationsPreviewOpen,
    setNotificationsPreviewOpen,
    latestNotification,
    markNotificationRead,
    loadAll,
    loading,
    initials,
    err,
    setErr,
    dashboardStats,
    filteredPending,
    setModalVisitId,
    filteredRows,
    me,
    filteredNotifications,
    markAllNotificationsRead,
    modalVisit,
    modalProtocol,
    modalPresentation,
    modalFields,
    savingResult,
    handleSave,
    ResultModal,
  };

  return (
    <>
      <LabLayout {...layoutProps} />
      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Confirmar logout"
        message="Tem a certeza de que deseja terminar a sessão e voltar ao ecrã de login?"
        confirmLabel="Terminar sessão"
        busy={logoutBusy}
        onClose={() => {
          if (!logoutBusy) setLogoutConfirmOpen(false);
        }}
        onConfirm={confirmLogout}
      />
    </>
  );
}
