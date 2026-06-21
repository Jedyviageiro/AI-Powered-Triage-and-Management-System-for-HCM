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
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 16,
        borderTop: "1px solid #f0f3f2",
      }}
    >
      <button
        type="button"
        disabled={isFirst}
        onClick={() =>
          setConsultFormStep(consultationSteps[Math.max(0, activeIndex - 1)]?.id || 1)
        }
        className="cf-btn-sec"
      >
        Anterior
      </button>
      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
        {activeIndex + 1} / {consultationSteps.length}
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
        className="cf-btn-primary"
      >
        Próximo
      </button>
    </div>
  );
}
