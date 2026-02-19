const visitModel = require("../models/visitModel");

// helper: calcula minutos entre agora e arrival_time
const minutesSince = (dateValue) => {
  if (!dateValue) return null;
  const start = new Date(dateValue).getTime();
  const now = Date.now();
  return Math.floor((now - start) / 60000);
};

// ========================
// GET /queue
// Retorna a fila priorizada (visitas ativas)
// ========================
const getQueue = async (req, res) => {
  try {
    const isDoctor = req.user?.role === "DOCTOR";
    const visits = isDoctor
      ? await visitModel.listActiveVisitsByDoctor(req.user.id)
      : await visitModel.listActiveVisits();

    // Enriquecer com "wait_minutes" e "is_overdue"
    const queue = visits.map((v) => {
      const wait_minutes = minutesSince(v.arrival_time);
      const is_overdue =
        v.max_wait_minutes != null &&
        wait_minutes != null &&
        wait_minutes > v.max_wait_minutes;

      const needs_reeval =
        v.reeval_at != null && new Date(v.reeval_at).getTime() <= Date.now();

      return {
        ...v,
        wait_minutes,
        is_overdue,
        needs_reeval,
      };
    });

    return res.json(queue);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao carregar fila" });
  }
};

// ========================
// GET /queue/overdue
// Retorna pacientes que passaram do tempo limite OU precisam reavaliação
// ========================
const getOverdueQueue = async (req, res) => {
  try {
    const isDoctor = req.user?.role === "DOCTOR";
    const visits = isDoctor
      ? await visitModel.listActiveVisitsByDoctor(req.user.id)
      : await visitModel.listActiveVisits();

    const overdue = visits
      .map((v) => {
        const wait_minutes = minutesSince(v.arrival_time);

        const is_overdue =
          v.max_wait_minutes != null &&
          wait_minutes != null &&
          wait_minutes > v.max_wait_minutes;

        const needs_reeval =
          v.reeval_at != null && new Date(v.reeval_at).getTime() <= Date.now();

        return {
          ...v,
          wait_minutes,
          is_overdue,
          needs_reeval,
        };
      })
      .filter((v) => v.is_overdue || v.needs_reeval);

    return res.json(overdue);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao carregar fila de atrasados" });
  }
};

// ========================
// GET /queue/summary
// Resumo: total e por prioridade
// ========================
const getQueueSummary = async (req, res) => {
  try {
    const isDoctor = req.user?.role === "DOCTOR";
    const visits = isDoctor
      ? await visitModel.listActiveVisitsByDoctor(req.user.id)
      : await visitModel.listActiveVisits();

    const summary = {
      total: visits.length,
      urgent: 0,
      less_urgent: 0,
      non_urgent: 0,
      not_classified: 0,
      overdue: 0,
      needs_reeval: 0,
    };

    for (const v of visits) {
      const wait_minutes = minutesSince(v.arrival_time);

      const is_overdue =
        v.max_wait_minutes != null &&
        wait_minutes != null &&
        wait_minutes > v.max_wait_minutes;

      const needs_reeval =
        v.reeval_at != null && new Date(v.reeval_at).getTime() <= Date.now();

      if (v.priority === "URGENT") summary.urgent++;
      else if (v.priority === "LESS_URGENT") summary.less_urgent++;
      else if (v.priority === "NON_URGENT") summary.non_urgent++;
      else summary.not_classified++;

      if (is_overdue) summary.overdue++;
      if (needs_reeval) summary.needs_reeval++;
    }

    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao gerar resumo da fila" });
  }
};

module.exports = {
  getQueue,
  getOverdueQueue,
  getQueueSummary,
};
