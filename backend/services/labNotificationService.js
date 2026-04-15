const { sendSms } = require("./twilioService");
const { triggerLabResultReadyWorkflow } = require("./novuService");

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const sanitizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const toE164Phone = (value) => {
  const raw = sanitizePhone(value);
  if (!raw) return null;
  if (raw.startsWith("+")) return raw;

  const defaultCountryCode = String(
    process.env.LAB_NOTIFICATIONS_DEFAULT_COUNTRY_CODE ||
      process.env.DEFAULT_COUNTRY_CODE ||
      "258"
  ).replace(/\D/g, "");

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  return `+${digits.startsWith(defaultCountryCode) ? digits : `${defaultCountryCode}${digits}`}`;
};

const buildParentLabResultMessage = ({
  patientName,
  guardianName,
  labExamType,
  labReadyAt,
  clinicName,
}) => {
  const examLabel = normalizeWhitespace(labExamType) || "exame";
  const patientLabel = normalizeWhitespace(patientName) || "a crianca";
  const guardianLabel = normalizeWhitespace(guardianName) || "encarregado";
  const clinicLabel = normalizeWhitespace(clinicName) || "a clinica";
  const readyAt = labReadyAt ? new Date(labReadyAt) : null;
  const readyText = readyAt && !Number.isNaN(readyAt.getTime()) ? " ja esta pronto" : " esta pronto";

  return normalizeWhitespace(
    `Ola ${guardianLabel}, o resultado do ${examLabel} de ${patientLabel}${readyText}. `
      + `Por favor contacte ${clinicLabel} para orientacao e levantamento do resultado.`
  );
};

const sendTwilioSms = async ({ to, body }) => {
  try {
    const result = await sendSms(to, body);
    return {
      provider: "twilio",
      ok: true,
      messageId: result?.sid || null,
      status: result?.status || null,
    };
  } catch (error) {
    if (error?.code === "TWILIO_NOT_CONFIGURED") {
      return { provider: "twilio", ok: false, skipped: true, reason: "twilio_not_configured" };
    }

    return {
      provider: "twilio",
      ok: false,
      error: error?.message || "twilio_request_failed",
    };
  }
};

const triggerNovuWorkflow = async (context) => {
  try {
    const result = await triggerLabResultReadyWorkflow(context);
    return {
      provider: "novu",
      ok: true,
      workflowId: result?.workflowId || null,
      subscriberId: result?.subscriberId || null,
      transactionId:
        result?.result?.result?.data?.transactionId ||
        result?.result?.data?.transactionId ||
        null,
    };
  } catch (error) {
    if (error?.code === "NOVU_NOT_CONFIGURED") {
      return { provider: "novu", ok: false, skipped: true, reason: "novu_not_configured" };
    }

    return {
      provider: "novu",
      ok: false,
      error: error?.message || "novu_request_failed",
    };
  }
};

const notifyParentAboutLabResult = async (context) => {
  const phone = toE164Phone(context?.guardianPhone);
  if (!phone) {
    const error = new Error("Contacto do encarregado ausente ou invalido.");
    error.statusCode = 400;
    throw error;
  }

  const message = buildParentLabResultMessage({
    patientName: context?.patientName,
    guardianName: context?.guardianName,
    labExamType: context?.labExamType,
    labReadyAt: context?.labResultReadyAt,
    clinicName: process.env.LAB_NOTIFICATIONS_CLINIC_NAME || "HCM Pediatria",
  });

  const results = await Promise.all([
    sendTwilioSms({ to: phone, body: message }),
    triggerNovuWorkflow({
      visitId: context.visitId,
      patientId: context.patientId,
      patientName: normalizeWhitespace(context?.patientName),
      guardianName: normalizeWhitespace(context?.guardianName),
      guardianPhone: phone,
      labExamType: normalizeWhitespace(context?.labExamType) || "exame",
      labResultReadyAt: context?.labResultReadyAt || null,
      doctorName: normalizeWhitespace(context?.doctorName) || null,
      message,
    }),
  ]);

  const successful = results.filter((result) => result?.ok);
  const failed = results.filter((result) => !result?.ok && !result?.skipped);
  const skipped = results.filter((result) => result?.skipped);

  if (successful.length === 0) {
    const reason =
      failed[0]?.error ||
      (skipped.length === results.length
        ? "Os canais de notificacao nao estao configurados."
        : "Nao foi possivel enviar a notificacao para o contacto registado.");
    const error = new Error(reason);
    error.statusCode = skipped.length === results.length ? 503 : 502;
    error.results = results;
    throw error;
  }

  return {
    phone,
    message,
    channels: results,
    successfulChannels: successful.map((result) => result.provider),
    failedChannels: failed.map((result) => result.provider),
    skippedChannels: skipped.map((result) => result.provider),
  };
};

module.exports = {
  notifyParentAboutLabResult,
};
