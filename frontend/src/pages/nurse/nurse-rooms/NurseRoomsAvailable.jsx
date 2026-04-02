import NursePage from "../NursePage";

export function NurseRoomsAvailableView({ loadQueue, loadingQueue, queue, roomInventory }) {
  return (
    <div className="dash-animate dash-animate-delay-1">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "32px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "26px",
              fontWeight: "600",
              color: "#0f172a",
              letterSpacing: "-0.4px",
              margin: 0,
            }}
          >
            Quartos disponiveis
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "4px", marginBottom: 0 }}>
            Estado atual da capacidade por tipo de sala
          </p>
        </div>
        <button
          onClick={loadQueue}
          disabled={loadingQueue}
          style={{
            fontSize: "13px",
            padding: "8px 18px",
            borderRadius: "20px",
            background: "#f3f4f6",
            border: "0.5px solid #e5e7eb",
            color: "#374151",
            cursor: "pointer",
            fontWeight: "500",
            fontFamily: "inherit",
          }}
        >
          {loadingQueue ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {roomInventory.map((type) => (
          <div
            key={`sum-${type.key}`}
            style={{
              background: "white",
              border: "0.5px solid #e5e7eb",
              borderRadius: "14px",
              padding: "16px 18px",
            }}
          >
            <div
              style={{ fontSize: "12px", fontWeight: "500", color: "#6b7280", marginBottom: "6px" }}
            >
              {type.shortTitle}
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "600",
                color: "#0f172a",
                letterSpacing: "-0.5px",
                lineHeight: "1",
              }}
            >
              {type.available}
              <span style={{ fontSize: "16px", color: "#9ca3af", fontWeight: "400" }}>
                {" "}
                / {type.total}
              </span>
            </div>
            <div style={{ fontSize: "12px", color: "#374151", marginTop: "4px" }}>
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: type.available > 0 ? "#30d158" : "#ff453a",
                  marginRight: "5px",
                  verticalAlign: "middle",
                }}
              />
              {type.available > 0
                ? `${type.available} disponive${type.available === 1 ? "l" : "is"}`
                : "Sem vagas"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {loadingQueue && queue.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`rs-${i}`}
                style={{
                  background: "white",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: "14px",
                  padding: "24px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                <div className="skeleton-line" style={{ height: "18px", width: "40%" }} />
                <div className="skeleton-line" style={{ height: "13px", width: "60%" }} />
                <div
                  className="skeleton-line"
                  style={{ height: "60px", width: "100%", borderRadius: "10px" }}
                />
              </div>
            ))
          : roomInventory.map((type) => (
              <div
                key={type.key}
                style={{
                  background: "white",
                  border: "0.5px solid #e5e7eb",
                  borderRadius: "14px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "18px 20px 14px",
                    borderBottom: "0.5px solid #f0f0f0",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: "600", color: "#0f172a" }}>
                      {type.title}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "11px",
                          fontWeight: "500",
                          padding: "3px 9px",
                          borderRadius: "20px",
                          marginLeft: "10px",
                          verticalAlign: "middle",
                          background: type.available > 0 ? "#e9f8ed" : "#fde8e8",
                          color: type.available > 0 ? "#1a7a3c" : "#b01c1c",
                        }}
                      >
                        {type.available} / {type.total} livres
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "3px" }}>
                      {type.description || "Sem descricao configurada."}
                    </div>
                    {Array.isArray(type.tags) && type.tags.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                        {type.tags.map((tag) => (
                          <span
                            key={`${type.key}-${tag}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#0f766e",
                              background: "#ecfeff",
                              border: "0.5px solid #a5f3fc",
                              borderRadius: "999px",
                              padding: "4px 9px",
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: "16px 20px 20px" }}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: "10px",
                    }}
                  >
                    Leitos
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                      gap: "8px",
                      marginBottom: "16px",
                    }}
                  >
                    {type.rooms.map((room) => (
                      <div
                        key={room.label}
                        style={{
                          borderRadius: "10px",
                          padding: "10px",
                          border: `0.5px solid ${room.status === "available" ? "#b8e8c5" : "#f5c7c7"}`,
                          background: room.status === "available" ? "#f1faf4" : "#fff4f4",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            color: room.status === "available" ? "#1a7a3c" : "#b01c1c",
                          }}
                        >
                          {room.label}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: room.status === "available" ? "#2d9a52" : "#c93030",
                            marginTop: "2px",
                          }}
                        >
                          {room.status === "available" ? "Disponivel" : "Ocupado"}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div
                      style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px 14px" }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "8px",
                        }}
                      >
                        Indicacoes
                      </div>
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                      >
                        {type.indications.map((item) => (
                          <li
                            key={item}
                            style={{
                              fontSize: "12px",
                              color: "#374151",
                              paddingLeft: "12px",
                              position: "relative",
                              lineHeight: "1.4",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: 0,
                                top: "6px",
                                width: "4px",
                                height: "4px",
                                borderRadius: "50%",
                                background: "#9ca3af",
                                display: "inline-block",
                              }}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div
                      style={{ background: "#f9fafb", borderRadius: "10px", padding: "12px 14px" }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: "0.07em",
                          marginBottom: "8px",
                        }}
                      >
                        Caracteristicas
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {type.features.map((item) => (
                          <span
                            key={item}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              fontSize: "11px",
                              fontWeight: "500",
                              color: "#374151",
                              background: "white",
                              border: "0.5px solid #e5e7eb",
                              borderRadius: "999px",
                              padding: "5px 9px",
                            }}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default function NurseRoomsAvailable() {
  return <NursePage forcedView="roomsAvailable" />;
}
