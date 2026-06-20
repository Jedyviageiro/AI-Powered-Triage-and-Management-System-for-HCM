const twilio = require("twilio");

const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_PHONE || process.env.TWILIO_PHONE_NUMBER,
});

const maskPhone = (value) => {
  const input = String(value || "");
  if (input.length <= 4) return input ? "***" : "";
  return `${input.slice(0, 4)}***${input.slice(-2)}`;
};

const getTwilioClient = () => {
  const { accountSid, authToken } = getTwilioConfig();
  if (!accountSid || !authToken) {
    console.error("[twilio] account_config_missing", {
      hasAccountSid: Boolean(accountSid),
      hasAuthToken: Boolean(authToken),
    });
    const error = new Error("Twilio account configuration is missing.");
    error.code = "TWILIO_NOT_CONFIGURED";
    throw error;
  }
  return twilio(accountSid, authToken);
};

async function sendSms(to, body) {
  const { fromNumber } = getTwilioConfig();

  if (!to || !body) {
    console.error("[twilio] sms_validation_failed", {
      hasTo: Boolean(to),
      hasBody: Boolean(body),
    });
    throw new Error("Phone number and message body are required.");
  }

  if (!fromNumber) {
    console.error("[twilio] sender_missing", {
      to: maskPhone(to),
      hasTwilioFromPhone: Boolean(process.env.TWILIO_FROM_PHONE),
      hasTwilioPhoneNumber: Boolean(process.env.TWILIO_PHONE_NUMBER),
    });
    const error = new Error("Twilio sender phone number is missing.");
    error.code = "TWILIO_NOT_CONFIGURED";
    throw error;
  }

  const client = getTwilioClient();
  let message;
  try {
    console.info("[twilio] sms_send_attempt", {
      to: maskPhone(to),
      from: maskPhone(fromNumber),
      bodyLength: String(body || "").length,
    });
    message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
  } catch (error) {
    console.error("[twilio] sms_send_failed", {
      to: maskPhone(to),
      from: maskPhone(fromNumber),
      code: error?.code || null,
      status: error?.status || error?.statusCode || null,
      moreInfo: error?.moreInfo || null,
      message: error?.message || null,
    });
    if (error && typeof error === "object") {
      const detail = [
        error.message,
        error.code ? `code ${error.code}` : "",
        error.moreInfo || "",
      ]
        .filter(Boolean)
        .join(" | ");
      error.message = detail || "Twilio request failed.";
    }
    throw error;
  }

  return {
    sid: message.sid,
    status: message.status,
    to: message.to,
    from: message.from,
    body: message.body,
  };
}

module.exports = {
  sendSms,
};
