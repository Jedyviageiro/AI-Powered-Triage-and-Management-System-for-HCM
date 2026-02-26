const preferenceModel = require("../models/preferenceModel");

const DEFAULT_PREFERENCES = {
  emergency_phone: "",
  font_size: "NORMAL",
  font_scale_percent: 100,
  notify_new_urgent: true,
  notify_wait_over_30: true,
  notify_critical_alerts: true,
  notify_shift_ending: true,
};

const getUserId = (req, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(401).json({ error: "Utilizador não autenticado." });
    return null;
  }
  return userId;
};

const normalizeFontSize = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized === "LARGE" ? "LARGE" : "NORMAL";
};

const normalizeFontScalePercent = (value) => {
  const n = Number(value);
  if (n === 100 || n === 105) return n;
  if (Number.isFinite(n) && n > 100) return 105;
  return 100;
};

const toBool = (value, fallback) => {
  if (typeof value === "boolean") return value;
  return fallback;
};

const mapResponse = (row) => ({
  ...DEFAULT_PREFERENCES,
  ...(row || {}),
  emergency_phone: String(row?.emergency_phone || ""),
  font_size: normalizeFontSize(row?.font_size),
  font_scale_percent: normalizeFontScalePercent(row?.font_scale_percent),
  notify_new_urgent: toBool(row?.notify_new_urgent, true),
  notify_wait_over_30: toBool(row?.notify_wait_over_30, true),
  notify_critical_alerts: toBool(row?.notify_critical_alerts, true),
  notify_shift_ending: toBool(row?.notify_shift_ending, true),
});

const getMyPreferences = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;
    const row = await preferenceModel.getByUserId(userId);
    return res.json(mapResponse(row));
  } catch (err) {
    console.error("GET PREFERENCES ERROR:", err);
    return res.status(500).json({ error: "Erro ao obter preferências." });
  }
};

const updateMyPreferences = async (req, res) => {
  try {
    const userId = getUserId(req, res);
    if (!userId) return;

    const current = mapResponse(await preferenceModel.getByUserId(userId));
    const body = req.body || {};
    const fontScalePercent = normalizeFontScalePercent(
      body.font_scale_percent ?? current.font_scale_percent
    );
    const payload = {
      emergency_phone: String(body.emergency_phone ?? current.emergency_phone).trim(),
      font_size:
        body.font_size != null
          ? normalizeFontSize(body.font_size)
          : fontScalePercent > 100
          ? "LARGE"
          : "NORMAL",
      font_scale_percent: fontScalePercent,
      notify_new_urgent: toBool(body.notify_new_urgent, current.notify_new_urgent),
      notify_wait_over_30: toBool(body.notify_wait_over_30, current.notify_wait_over_30),
      notify_critical_alerts: toBool(body.notify_critical_alerts, current.notify_critical_alerts),
      notify_shift_ending: toBool(body.notify_shift_ending, current.notify_shift_ending),
    };

    const row = await preferenceModel.upsertByUserId(userId, payload);
    return res.json(mapResponse(row));
  } catch (err) {
    console.error("UPDATE PREFERENCES ERROR:", err);
    return res.status(500).json({ error: "Erro ao atualizar preferências." });
  }
};

module.exports = {
  getMyPreferences,
  updateMyPreferences,
};
