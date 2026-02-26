const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Espera: "Bearer <token>"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Busca user real no DB (fonte de verdade)
    const user = await userModel.getUserById(payload.id);
    if (!user) return res.status(401).json({ error: "Utilizador inválido" });

    if (user.is_active === false) {
      return res.status(403).json({ error: "Conta inativa" });
    }

    // Sempre usa o que está no banco (role correto)
    req.user = {
  id: user.id,
  username: user.username,
  full_name: user.full_name,
  role: String(user.role || "").trim().toUpperCase(),
};

// DEBUG (temporário)
console.log("AUTH DEBUG -> user:", req.user);

    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

module.exports = requireAuth;
