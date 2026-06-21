export default function DoctorConsultationStepFooter({
  consultFormStep,
  consultationSteps,
  setConsultFormStep,
}) {
  const activeIndex = Math.max(
    0,
    consultationSteps.findIndex((step) => step.id === consultFormStep)
  );
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= consultationSteps.length - 1;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        background: "#fff",
        borderTop: "1px solid #e7e9ed",
        padding: "14px 16px",
        boxShadow: "0 -2px 10px rgba(16,24,40,0.05)",
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <button
          type="button"
          disabled={isFirst}
          onClick={() =>
            setConsultFormStep(consultationSteps[Math.max(0, activeIndex - 1)]?.id || 1)
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#fff",
            border: "1px solid #eef0f3",
            padding: "10px 18px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            color: isFirst ? "#9aa3b2" : "#3a4150",
            cursor: isFirst ? "not-allowed" : "pointer",
            opacity: isFirst ? 0.72 : 1,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Anterior
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "#9aa3b2" }}>
          Etapa {activeIndex + 1} de {consultationSteps.length}
        </span>
        <button
          type="button"
          disabled={isLast}
          onClick={() =>
            setConsultFormStep(
              consultationSteps[Math.min(consultationSteps.length - 1, activeIndex + 1)]?.id ||
                consultationSteps.length
            )
          }
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: "#0f6e54",
            border: "none",
            padding: "10px 20px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            cursor: isLast ? "not-allowed" : "pointer",
            opacity: isLast ? 0.55 : 1,
          }}
        >
          Proximo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
