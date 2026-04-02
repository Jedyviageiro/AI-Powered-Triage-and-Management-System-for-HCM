const userModel = require("../models/userModel");
const doctorShiftModel = require("../models/doctorShiftModel");
const nurseShiftModel = require("../models/nurseShiftModel");

// ========================
// CREATE USER (ADMIN)
// ========================
const createUser = async (req, res) => {
  try {
    const {
      username,
      password,
      full_name,
      role,
      specialization,
      profile_photo_url,
      profile_photo_public_id,
    } = req.body;

    if (!username || !password || !full_name || !role) {
      return res.status(400).json({ error: "Preencha todos os campos" });
    }

    const user = await userModel.createUser({
      username,
      password,
      full_name,
      role,
      specialization: specialization || null,
      profile_photo_url: profile_photo_url || null,
      profile_photo_public_id: profile_photo_public_id || null,
    });

    res.status(201).json(user);
  } catch (err) {
    if (err.code === "23505") {
      // username duplicado
      return res.status(400).json({ error: "Username já existe" });
    }
    res.status(500).json({ error: "Erro ao criar utilizador" });
  }
};

// ========================
// LIST USERS
// ========================
const listUsers = async (req, res) => {
  try {
    const users = await userModel.listUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erro ao listar utilizadores" });
  }
};

// ========================
// GET USER BY ID
// ========================
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.getUserById(id);
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar utilizador" });
  }
};

// ========================
// UPDATE USER
// ========================
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await userModel.updateUser(id, req.body);
    if (!updated) return res.status(404).json({ error: "Utilizador não encontrado" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar utilizador" });
  }
};

const updateUserShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shiftType = String(req.body?.shift_type || "")
      .trim()
      .toUpperCase();
    const allowedShiftTypes = new Set(["MORNING", "AFTERNOON", "NIGHT"]);

    if (!allowedShiftTypes.has(shiftType)) {
      return res.status(400).json({ error: "shift_type invalido" });
    }

    const user = await userModel.getUserById(id);
    if (!user) return res.status(404).json({ error: "Utilizador não encontrado" });

    if (user.role === "NURSE") {
      await nurseShiftModel.upsertAssignment(user.id, shiftType);
    } else if (user.role === "DOCTOR") {
      await doctorShiftModel.upsertAssignment(user.id, shiftType);
    } else {
      return res
        .status(400)
        .json({ error: "Apenas médicos e enfermeiros podem ter turno atribuído" });
    }

    const freshUsers = await userModel.listUsers();
    const updated = freshUsers.find((item) => Number(item.id) === Number(id)) || null;
    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao atualizar turno do utilizador" });
  }
};

// ========================
// RESET PASSWORD (ADMIN)
// ========================
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "Nova password obrigatória" });
    }

    const updated = await userModel.updatePassword(id, newPassword);
    if (!updated) return res.status(404).json({ error: "Utilizador não encontrado" });

    res.json({ message: "Password redefinida com sucesso" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao redefinir password" });
  }
};

// ========================
// DELETE USER
// ========================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await userModel.deleteUser(id);
    if (!deleted) return res.status(404).json({ error: "Utilizador não encontrado" });

    res.json({ message: "Utilizador removido" });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover utilizador" });
  }
};

module.exports = {
  createUser,
  listUsers,
  getUser,
  updateUser,
  updateUserShift,
  resetPassword,
  deleteUser,
};
