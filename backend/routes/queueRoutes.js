const express = require("express");
const router = express.Router();

const queueController = require("../controllers/queueController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

router.use(requireAuth, requireRole("ADMIN", "DOCTOR", "NURSE"));

router.get("/", queueController.getQueue);
router.get("/overdue", queueController.getOverdueQueue);
router.get("/summary", queueController.getQueueSummary);

module.exports = router;
