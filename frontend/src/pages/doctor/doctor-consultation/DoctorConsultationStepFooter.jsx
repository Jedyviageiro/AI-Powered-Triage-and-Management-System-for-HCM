export default function DoctorConsultationStepFooter({
  consultFormStep,
  consultationSteps,
  setConsultFormStep,
}) {
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
        disabled={consultFormStep === 1}
        onClick={() => setConsultFormStep((s) => Math.max(1, s - 1))}
        className="cf-btn-sec"
      >
        Anterior
      </button>
      <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
        {consultFormStep} / {consultationSteps.length}
      </span>
      <button
        type="button"
        disabled={consultFormStep === consultationSteps.length}
        onClick={() => setConsultFormStep((s) => Math.min(consultationSteps.length, s + 1))}
        className="cf-btn-primary"
      >
        Próximo
      </button>
    </div>
  );
}
