const userModel = require("../models/userModel");

// ========================
// CREATE USER (ADMIN)
// ========================
const createUser = async (req, res) => {
    try {
        const { username, password, full_name, role, specialization } = req.body;

        if (!username || !password || !full_name || !role) {
            return res.status(400).json({ error: "Preencha todos os campos" });
        }

        const user = await userModel.createUser({ username, password, full_name, role, specialization: specialization || null });

        res.status(201).json(user);
    } catch (err) {
        if (err.code === "23505") { // username duplicado
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
    resetPassword,
    deleteUser
};
