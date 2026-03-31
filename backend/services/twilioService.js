const twilio = require("twilio");

const getTwilioConfig = () => ({
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  fromNumber: process.env.TWILIO_FROM_PHONE || process.env.TWILIO_PHONE_NUMBER,
});

const getTwilioClient = () => {
  const { accountSid, authToken } = getTwilioConfig();
  if (!accountSid || !authToken) {
    const error = new Error("Twilio account configuration is missing.");
    error.code = "TWILIO_NOT_CONFIGURED";
    throw error;
  }
  return twilio(accountSid, authToken);
};

async function sendSms(to, body) {
  const { fromNumber } = getTwilioConfig();

  if (!to || !body) {
    throw new Error("Phone number and message body are required.");
  }

  if (!fromNumber) {
    const error = new Error("Twilio sender phone number is missing.");
    error.code = "TWILIO_NOT_CONFIGURED";
    throw error;
  }

  const client = getTwilioClient();
  let message;
  try {
    message = await client.messages.create({
      body,
      from: fromNumber,
      to,
    });
  } catch (error) {
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
