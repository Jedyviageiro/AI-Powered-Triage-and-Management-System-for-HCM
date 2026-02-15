const userModel = require("../models/userModel");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "username e password são obrigatórios" });
    }

    const result = await userModel.authenticate(username, password);

    if (!result.ok) {
      if (result.reason === "ACCOUNT_DISABLED") {
        return res.status(403).json({ error: "Conta desativada. Contacte o administrador." });
      }
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const user = result.user;

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return res.status(200).json({
      message: "Login feito com sucesso",
      token,
      user
    });
  } catch (err) {
      console.error("LOGIN ERROR:", err);
  return res.status(500).json({
    error: "Erro no login",
    debug: {
      message: err.message,
      code: err.code,
      detail: err.detail,
    },
  });
  }
};

module.exports = { login };
