export default function AppNavbar({ left, center = null, right, style = {} }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        minHeight: 60,
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        borderBottom: "1px solid #f0f0f0",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          width: "100%",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        {center ? <div style={{ flexShrink: 0 }}>{center}</div> : null}
        <div style={{ flex: 1, minWidth: 0, display: "flex", justifyContent: "flex-end" }}>
          {right}
        </div>
      </div>
    </header>
  );
}
