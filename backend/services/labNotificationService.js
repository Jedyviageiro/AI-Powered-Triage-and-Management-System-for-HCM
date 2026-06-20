const { sendSms } = require("./twilioService");
const { triggerLabResultReadyWorkflow } = require("./novuService");

const normalizeWhitespace = (value) => String(value || "").replace(/\s+/g, " ").trim();

const sanitizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const toSentenceCase = (value) => {
  const text = normalizeWhitespace(value)
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : "";
};

const formatExamLabel = (value) => {
  const raw = normalizeWhitespace(value);
  if (!raw) return "";
  if (raw.toUpperCase() === "LAB_CENTRAL") return "";
  const labels = {
    CBC: "Hemograma",
    HEMOGRAM: "Hemograma",
    MALARIA: "Teste de malaria",
    URINALYSIS: "Urina tipo II",
  };
  return labels[raw.toUpperCase()] || toSentenceCase(raw);
};

const maskPhone = (value) => {
  const input = String(value || "");
  if (input.length <= 4) return input ? "***" : "";
  return `${input.slice(0, 4)}***${input.slice(-2)}`;
};

const providerDebug = (provider, event, details = {}) => {
  const safeDetails = { ...details };
  if (safeDetails.to) safeDetails.to = maskPhone(safeDetails.to);
  if (safeDetails.guardianPhone) safeDetails.guardianPhone = maskPhone(safeDetails.guardianPhone);
  console.error(`[notification:${provider}] ${event}`, safeDetails);
};

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
  labExamType,
  clinicName,
  clinicAddress,
}) => {
  const examLabel = formatExamLabel(labExamType);
  const patientLabel = normalizeWhitespace(patientName) || "a crianca";
  const clinicLabel = normalizeWhitespace(clinicName) || "a clinica";
  const addressLabel = normalizeWhitespace(clinicAddress);
  const resultLabel = examLabel ? `do exame ${examLabel}` : "laboratorial";

  return normalizeWhitespace(
    `Caro(a) encarregado(a), o resultado ${resultLabel} de ${patientLabel} ja esta pronto. `
      + `Por favor contacte ${clinicLabel} para orientacao e levantamento do resultado. `
      + (addressLabel ? `Estamos localizados na ${addressLabel}.` : "")
  );
};

const sendTwilioSms = async ({ to, body }) => {
  try {
    const result = await sendSms(to, body);
    console.info("[notification:twilio] sms_sent", {
      to: maskPhone(to),
      sid: result?.sid || null,
      status: result?.status || null,
    });
    return {
      provider: "twilio",
      ok: true,
      messageId: result?.sid || null,
      status: result?.status || null,
    };
  } catch (error) {
    if (error?.code === "TWILIO_NOT_CONFIGURED") {
      providerDebug("twilio", "skipped_not_configured", {
        to,
        hasAccountSid: Boolean(process.env.TWILIO_ACCOUNT_SID),
        hasAuthToken: Boolean(process.env.TWILIO_AUTH_TOKEN),
        hasFromNumber: Boolean(process.env.TWILIO_FROM_PHONE || process.env.TWILIO_PHONE_NUMBER),
        error: error?.message,
      });
      return { provider: "twilio", ok: false, skipped: true, reason: "twilio_not_configured" };
    }

    providerDebug("twilio", "sms_failed", {
      to,
      code: error?.code || null,
      status: error?.status || error?.statusCode || null,
      moreInfo: error?.moreInfo || null,
      error: error?.message || "twilio_request_failed",
    });

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
    console.info("[notification:novu] workflow_triggered", {
      workflowId: result?.workflowId || null,
      subscriberId: result?.subscriberId || null,
      visitId: context?.visitId || null,
      patientId: context?.patientId || null,
    });
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
      providerDebug("novu", "skipped_not_configured", {
        workflowId: process.env.NOVU_LAB_RESULT_WORKFLOW_ID || null,
        hasApiKey: Boolean(process.env.NOVU_API_KEY || process.env.NOVU_SECRET_KEY),
        hasApiUrl: Boolean(process.env.NOVU_API_URL),
        visitId: context?.visitId || null,
        patientId: context?.patientId || null,
        error: error?.message,
      });
      return { provider: "novu", ok: false, skipped: true, reason: "novu_not_configured" };
    }

    providerDebug("novu", "workflow_failed", {
      workflowId: process.env.NOVU_LAB_RESULT_WORKFLOW_ID || null,
      visitId: context?.visitId || null,
      patientId: context?.patientId || null,
      status: error?.status || error?.statusCode || null,
      error: error?.message || "novu_request_failed",
      data: error?.data$ || error?.body || null,
    });

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
    providerDebug("lab", "invalid_guardian_phone", {
      visitId: context?.visitId || null,
      patientId: context?.patientId || null,
      guardianPhone: context?.guardianPhone || null,
    });
    const error = new Error("Contacto do encarregado ausente ou invalido.");
    error.statusCode = 400;
    throw error;
  }

  const message = buildParentLabResultMessage({
    patientName: context?.patientName,
    labExamType: context?.labExamType,
    clinicName: process.env.LAB_NOTIFICATIONS_CLINIC_NAME || "HCM Pediatria",
    clinicAddress:
      process.env.LAB_NOTIFICATIONS_CLINIC_ADDRESS ||
      "Avenida Eduardo Mondlane, no 1653, Maputo",
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

  if (failed.length || skipped.length) {
    providerDebug("lab", "delivery_partial_or_failed", {
      visitId: context?.visitId || null,
      patientId: context?.patientId || null,
      to: phone,
      successfulChannels: successful.map((result) => result.provider),
      failedChannels: failed.map((result) => ({
        provider: result.provider,
        error: result.error || result.reason || null,
      })),
      skippedChannels: skipped.map((result) => ({
        provider: result.provider,
        reason: result.reason || null,
      })),
    });
  }

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
