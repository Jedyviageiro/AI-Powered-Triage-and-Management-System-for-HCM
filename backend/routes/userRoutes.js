const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

// tudo aqui é ADMIN
router.use(requireAuth, requireRole("ADMIN"));

router.post("/", userController.createUser);
router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);
router.patch("/:id", userController.updateUser);
router.patch("/:id/password", userController.resetPassword);
router.delete("/:id", userController.deleteUser);

module.exports = router;
