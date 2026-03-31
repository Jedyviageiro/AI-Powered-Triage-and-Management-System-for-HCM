const { Novu } = require("@novu/api");

const DEFAULT_WORKFLOW_ID = "lab-result-ready-sms";

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const splitName = (value) => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return { firstName: undefined, lastName: undefined };

  const parts = normalized.split(" ");
  return {
    firstName: parts[0] || undefined,
    lastName: parts.slice(1).join(" ") || undefined,
  };
};

const getNovuClient = () => {
  const secretKey = process.env.NOVU_API_KEY || process.env.NOVU_SECRET_KEY;
  if (!secretKey) {
    const error = new Error("Novu secret key is missing.");
    error.code = "NOVU_NOT_CONFIGURED";
    throw error;
  }

  const serverURL = String(process.env.NOVU_API_URL || "").trim() || undefined;
  return new Novu({
    secretKey,
    serverURL,
  });
};

const describeNovuError = (error) => {
  const statusCode = error?.statusCode ? `status ${error.statusCode}` : "";
  const bodyMessage =
    error?.body?.message ||
    error?.data$?.message ||
    (Array.isArray(error?.data$?.message) ? error.data$.message.join(", ") : "");
  const ctx = error?.data$?.ctx ? JSON.stringify(error.data$.ctx) : "";

  return [error?.message, statusCode, bodyMessage, ctx].filter(Boolean).join(" | ");
};

const buildSubscriber = ({
  patientId,
  guardianName,
  guardianPhone,
  patientName,
}) => {
  const normalizedPhone = String(guardianPhone || "").trim();
  const { firstName, lastName } = splitName(guardianName);
  const patientLabel = normalizeWhitespace(patientName).replace(/\s+/g, "-").toLowerCase();
  const phoneDigits = normalizedPhone.replace(/[^\d]/g, "");

  return {
    subscriberId:
      phoneDigits || patientLabel
        ? `guardian-${patientId || "unknown"}-${phoneDigits || patientLabel}`
        : `guardian-${patientId || "unknown"}`,
    firstName,
    lastName,
    phone: normalizedPhone || undefined,
  };
};

const triggerLabResultReadyWorkflow = async ({
  patientId,
  patientName,
  guardianName,
  guardianPhone,
  doctorName,
  labExamType,
  labResultReadyAt,
  message,
  visitId,
}) => {
  const workflowId = String(process.env.NOVU_LAB_RESULT_WORKFLOW_ID || DEFAULT_WORKFLOW_ID).trim();
  if (!workflowId) {
    const error = new Error("Novu workflow id is missing.");
    error.code = "NOVU_NOT_CONFIGURED";
    throw error;
  }

  const novu = getNovuClient();
  const to = buildSubscriber({
    patientId,
    guardianName,
    guardianPhone,
    patientName,
  });

  let result;
  try {
    result = await novu.trigger({
      workflowId,
      to,
      payload: {
        visitId,
        patientId,
        patientName: normalizeWhitespace(patientName),
        guardianName: normalizeWhitespace(guardianName),
        guardianPhone: String(guardianPhone || "").trim() || null,
        doctorName: normalizeWhitespace(doctorName) || null,
        labExamType: normalizeWhitespace(labExamType) || "exame",
        labResultReadyAt: labResultReadyAt || null,
        message: normalizeWhitespace(message),
      },
    });
  } catch (error) {
    error.message = describeNovuError(error) || "Novu trigger failed.";
    throw error;
  }

  return {
    workflowId,
    subscriberId: to.subscriberId,
    result,
  };
};

module.exports = {
  triggerLabResultReadyWorkflow,
};
