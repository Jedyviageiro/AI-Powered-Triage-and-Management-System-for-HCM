export default function DataTable({
  columns = [],
  rows = [],
  emptyMessage = "Sem dados disponíveis.",
  keyField = "id",
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f8faf9" }}>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  textAlign: "left",
                  padding: "12px 14px",
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#8a9a93",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={Math.max(1, columns.length)}
                style={{ padding: "18px 14px", fontSize: 13, color: "#6b7280" }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row?.[keyField] ?? index}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    style={{
                      padding: "12px 14px",
                      fontSize: 13,
                      color: "#111827",
                      borderBottom: index === rows.length - 1 ? "none" : "1px solid #f1f5f9",
                    }}
                  >
                    {typeof column.render === "function"
                      ? column.render(row)
                      : (row?.[column.key] ?? "-")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
