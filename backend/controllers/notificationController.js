const notificationModel = require("../models/notificationModel");

const requireUser = (req, res) => {
  const userId = Number(req.user?.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    res.status(401).json({ error: "Utilizador não autenticado." });
    return null;
  }
  return userId;
};

const listNotifications = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const limit = Number(req.query.limit || 100);
    const rows = await notificationModel.listByUserId(userId, limit);
    const unread_count = await notificationModel.countUnreadByUserId(userId);
    return res.json({ notifications: rows, unread_count });
  } catch (err) {
    console.error("LIST NOTIFICATIONS ERROR:", err);
    return res.status(500).json({ error: "Erro ao listar notificações." });
  }
};

const getLatestNotification = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const latest = await notificationModel.getLatestByUserId(userId);
    const unread_count = await notificationModel.countUnreadByUserId(userId);
    return res.json({ latest, unread_count });
  } catch (err) {
    console.error("LATEST NOTIFICATION ERROR:", err);
    return res.status(500).json({ error: "Erro ao obter notificação mais recente." });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) return res.status(400).json({ error: "id inválido" });
    const row = await notificationModel.markRead(id, userId);
    if (!row) return res.status(404).json({ error: "Notificação não encontrada." });
    return res.json(row);
  } catch (err) {
    console.error("MARK NOTIFICATION READ ERROR:", err);
    return res.status(500).json({ error: "Erro ao marcar notificação como lida." });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = requireUser(req, res);
    if (!userId) return;
    const updated = await notificationModel.markAllRead(userId);
    return res.json({ updated });
  } catch (err) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", err);
    return res.status(500).json({ error: "Erro ao marcar notificações como lidas." });
  }
};

module.exports = {
  listNotifications,
  getLatestNotification,
  markNotificationRead,
  markAllNotificationsRead,
};

