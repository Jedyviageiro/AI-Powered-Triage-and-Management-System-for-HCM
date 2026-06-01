export default function AppNavbar({ left, center = null, right, style = {}, contentStyle = {} }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        minHeight: 72,
        display: "flex",
        alignItems: "center",
        background: "rgba(246, 248, 247, 0.94)",
        borderBottom: "1px solid rgba(220, 229, 224, 0.72)",
        boxShadow: "0 14px 34px rgba(15, 23, 42, 0.05)",
        backdropFilter: "blur(14px)",
        ...style,
      }}
    >
      <div
        style={{
          maxWidth: "1320px",
          margin: "0 auto",
          width: "100%",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          minWidth: 0,
          ...contentStyle,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>{left}</div>
        {center ? <div style={{ flexShrink: 0, minWidth: 0 }}>{center}</div> : null}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
          }}
        >
          {right}
        </div>
      </div>
    </header>
  );
}
