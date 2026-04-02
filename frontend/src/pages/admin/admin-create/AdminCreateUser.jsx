import { useState } from "react";
import { api } from "../../../lib/api";
import { AdminPhotoPicker } from "../admin-helpers/AdminPhotoPicker.jsx";
import { Avatar, AdminButton, Panel, PanelHeader, formInputStyle, formLabelStyle } from "../admin-helpers/adminUi.jsx";

export function AdminCreateUserView({ onCreated, canUpload, uploadImage }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("DOCTOR");
  const [specialization, setSpecialization] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPublicId, setPhotoPublicId] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const uploadPhoto = async (file) => {
    if (!file) return;
    setUploading(true);
    setErr("");
    try {
      const uploaded = await uploadImage(file);
      setPhotoUrl(uploaded.url);
      setPhotoPublicId(uploaded.publicId);
    } catch (error) {
      setErr(error.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setErr("");
    setSuccess(false);
    setCreating(true);

    try {
      await api.createUser({
        username: username.trim(),
        password,
        full_name: fullName.trim(),
        role,
        specialization: role === "DOCTOR" ? specialization.trim() || null : null,
        profile_photo_url: photoUrl.trim() || null,
        profile_photo_public_id: photoPublicId.trim() || null,
      });

      setUsername("");
      setPassword("");
      setFullName("");
      setRole("DOCTOR");
      setSpecialization("");
      setPhotoUrl("");
      setPhotoPublicId("");
      setSuccess(true);
      await onCreated();
    } catch (error) {
      setErr(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 560px) minmax(280px, 360px)", gap: 16, alignItems: "start" }}>
      <Panel>
        <PanelHeader title="Criar nova conta" subtitle="Adicionar um novo colaborador ao sistema." />
        <form onSubmit={submit} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {err ? (
            <div style={{ padding: "10px 12px", borderRadius: 12, background: "#fff1f2", color: "#9f1239", fontSize: 12 }}>
              {err}
            </div>
          ) : null}

          {success ? (
            <div style={{ padding: "10px 12px", borderRadius: 12, background: "#ecfdf3", color: "#166534", fontSize: 12 }}>
              Conta criada com sucesso.
            </div>
          ) : null}

          <div>
            <label style={formLabelStyle}>Nome completo</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              style={formInputStyle}
              placeholder="Ex: Dra Ana Silva"
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={formLabelStyle}>Username</label>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                style={formInputStyle}
                placeholder="dr.ana.silva"
                required
              />
            </div>
            <div>
              <label style={formLabelStyle}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={formInputStyle}
                placeholder="********"
                required
              />
            </div>
          </div>

          <div>
            <label style={formLabelStyle}>Role</label>
            <select value={role} onChange={(event) => setRole(event.target.value)} style={formInputStyle}>
              <option value="DOCTOR">Medico</option>
              <option value="NURSE">Enfermeiro</option>
              <option value="LAB_TECHNICIAN">Tecnico de Laboratorio</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {role === "DOCTOR" ? (
            <div>
              <label style={formLabelStyle}>Especializacao</label>
              <input
                value={specialization}
                onChange={(event) => setSpecialization(event.target.value)}
                style={formInputStyle}
                placeholder="Ex: Pediatria Geral"
              />
            </div>
          ) : null}

          {(role === "DOCTOR" || role === "NURSE") ? (
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Avatar user={{ full_name: fullName, username, profile_photo_url: photoUrl }} size={52} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>Foto de perfil</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Opcional para medicos e enfermeiros.</div>
                </div>
              </div>

              <AdminPhotoPicker
                canUpload={canUpload}
                uploading={uploading}
                previewUrl={photoUrl}
                buttonLabel={photoUrl ? "Trocar foto" : "Escolher foto"}
                onError={(error) => setErr(error.message)}
                onUpload={uploadPhoto}
              />

              {!canUpload ? (
                <div style={{ marginTop: 8, fontSize: 11, color: "#92400e" }}>
                  Configure VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET.
                </div>
              ) : null}

              {uploading ? <div style={{ marginTop: 8, fontSize: 11, color: "#64748b" }}>A carregar imagem...</div> : null}
            </div>
          ) : null}

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              fontSize: 12,
              color: "#1d4ed8",
              lineHeight: 1.5,
            }}
          >
            Apenas administradores podem criar contas. Se um utilizador esquecer a password, deve contactar a administracao.
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <AdminButton
              type="button"
              onClick={() => {
                setUsername("");
                setPassword("");
                setFullName("");
                setRole("DOCTOR");
                setSpecialization("");
                setPhotoUrl("");
                setPhotoPublicId("");
                setErr("");
                setSuccess(false);
              }}
              disabled={creating}
            >
              Cancelar
            </AdminButton>
            <AdminButton type="submit" primary disabled={creating}>
              {creating ? "A criar..." : "Aplicar"}
            </AdminButton>
          </div>
        </form>
      </Panel>

      <Panel>
        <PanelHeader title="Notas" subtitle="Boas praticas para novas contas." />
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
          <div>Use usernames consistentes para facilitar pesquisa e suporte.</div>
          <div>Para medicos, preencha a especializacao para melhorar a leitura nas outras areas do sistema.</div>
          <div>Se a foto nao carregar, confirme o preset unsigned no Cloudinary e reinicie o frontend.</div>
        </div>
      </Panel>
    </div>
  );
}
