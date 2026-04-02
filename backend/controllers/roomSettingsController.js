const roomSettingsModel = require("../models/roomSettingsModel");

const normalizeCount = (value, fallback) => {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.max(1, Math.min(50, Math.round(next)));
};

const normalizeDescription = (value, fallback) => {
  const text = String(value ?? fallback ?? "").trim();
  return text || fallback || "";
};

const normalizeTags = (value, fallback = []) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : fallback;

  return Array.from(
    new Set(
      source
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 12)
    )
  );
};

const normalizeLabels = (value, fallback = []) => {
  const source = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : fallback;

  return Array.from(
    new Set(
      source
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 50)
    )
  );
};

const mapResponse = (row) => ({
  urgent_room_total: normalizeCount(
    row?.urgent_room_total,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.urgent_room_total
  ),
  standard_room_total: normalizeCount(
    row?.standard_room_total,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.standard_room_total
  ),
  quick_room_total: normalizeCount(
    row?.quick_room_total,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.quick_room_total
  ),
  urgent_room_description: normalizeDescription(
    row?.urgent_room_description,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.urgent_room_description
  ),
  standard_room_description: normalizeDescription(
    row?.standard_room_description,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.standard_room_description
  ),
  quick_room_description: normalizeDescription(
    row?.quick_room_description,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.quick_room_description
  ),
  urgent_room_tags: normalizeTags(
    row?.urgent_room_tags,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.urgent_room_tags
  ),
  standard_room_tags: normalizeTags(
    row?.standard_room_tags,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.standard_room_tags
  ),
  quick_room_tags: normalizeTags(
    row?.quick_room_tags,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.quick_room_tags
  ),
  urgent_room_labels: normalizeLabels(
    row?.urgent_room_labels,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.urgent_room_labels
  ),
  standard_room_labels: normalizeLabels(
    row?.standard_room_labels,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.standard_room_labels
  ),
  quick_room_labels: normalizeLabels(
    row?.quick_room_labels,
    roomSettingsModel.DEFAULT_ROOM_SETTINGS.quick_room_labels
  ),
  updated_at: row?.updated_at || null,
});

const getRoomSettings = async (_req, res) => {
  try {
    const row = await roomSettingsModel.getSettings();
    return res.json(mapResponse(row));
  } catch (error) {
    console.error("GET ROOM SETTINGS ERROR:", error);
    return res.status(500).json({ error: "Erro ao obter configuracao de salas." });
  }
};

const updateRoomSettings = async (req, res) => {
  try {
    if (String(req.user?.role || "").toUpperCase() !== "ADMIN") {
      return res.status(403).json({ error: "Apenas administradores podem alterar salas." });
    }

    const current = mapResponse(await roomSettingsModel.getSettings());
    const payload = {
      urgent_room_total: normalizeCount(req.body?.urgent_room_total, current.urgent_room_total),
      standard_room_total: normalizeCount(req.body?.standard_room_total, current.standard_room_total),
      quick_room_total: normalizeCount(req.body?.quick_room_total, current.quick_room_total),
      urgent_room_description: normalizeDescription(
        req.body?.urgent_room_description,
        current.urgent_room_description
      ),
      standard_room_description: normalizeDescription(
        req.body?.standard_room_description,
        current.standard_room_description
      ),
      quick_room_description: normalizeDescription(
        req.body?.quick_room_description,
        current.quick_room_description
      ),
      urgent_room_tags: normalizeTags(req.body?.urgent_room_tags, current.urgent_room_tags),
      standard_room_tags: normalizeTags(req.body?.standard_room_tags, current.standard_room_tags),
      quick_room_tags: normalizeTags(req.body?.quick_room_tags, current.quick_room_tags),
      urgent_room_labels: normalizeLabels(req.body?.urgent_room_labels, current.urgent_room_labels),
      standard_room_labels: normalizeLabels(
        req.body?.standard_room_labels,
        current.standard_room_labels
      ),
      quick_room_labels: normalizeLabels(req.body?.quick_room_labels, current.quick_room_labels),
    };

    const row = await roomSettingsModel.updateSettings(payload);
    return res.json(mapResponse(row));
  } catch (error) {
    console.error("UPDATE ROOM SETTINGS ERROR:", error);
    return res.status(500).json({ error: "Erro ao atualizar configuracao de salas." });
  }
};

module.exports = {
  getRoomSettings,
  updateRoomSettings,
};
