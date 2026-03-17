export default function LabSettingsContent({ me, logout }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#1c1c1e",
            letterSpacing: "-.4px",
            margin: 0,
          }}
        >
          Configurações
        </h1>
        <p style={{ fontSize: "13px", color: "#8e8e93", marginTop: "2px" }}>
          Painel técnico do laboratório
        </p>
      </div>
      <div className="card">
        <div className="card-head">
          <div className="card-title">Perfil ativo</div>
          <div className="card-sub">Informação da conta em sessão</div>
        </div>
        <div style={{ padding: "16px", display: "grid", gap: "10px" }}>
          <div className="meta-tile">
            <span className="mt-lbl">Utilizador</span>
            <span className="mt-val">{me?.full_name || "Técnico de laboratório"}</span>
          </div>
          <div className="meta-tile">
            <span className="mt-lbl">Função</span>
            <span className="mt-val">Técnico de laboratório</span>
          </div>
          <div className="meta-tile">
            <span className="mt-lbl">Painel</span>
            <span className="mt-val">Laboratório</span>
          </div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: "420px" }}>
        <div className="card-head">
          <div className="card-title">Sessão</div>
          <div className="card-sub">Encerrar acesso ao painel do laboratório</div>
        </div>
        <div
          style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ fontSize: "12px", color: "#636366", lineHeight: 1.5 }}>
            Termine a sessão deste utilizador e volte para o ecrã de login.
          </div>
          <button
            type="button"
            onClick={logout}
            style={{
              flexShrink: 0,
              fontSize: "13px",
              fontWeight: "600",
              color: "#ff3b30",
              background: "#fff5f5",
              border: "0.5px solid #fecaca",
              borderRadius: "999px",
              cursor: "pointer",
              padding: "9px 14px",
              fontFamily: "inherit",
            }}
          >
            Terminar sessão
          </button>
        </div>
      </div>
    </div>
  );
}
