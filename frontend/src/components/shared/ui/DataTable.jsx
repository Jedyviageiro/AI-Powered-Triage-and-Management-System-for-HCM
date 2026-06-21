import { useEffect, useMemo, useState } from "react";

export default function DataTable({
  columns = [],
  rows = [],
  emptyMessage = "Sem dados disponiveis.",
  keyField = "id",
  pageSize = 8,
  minWidth = 920,
  onRowClick,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = useMemo(
    () => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, pageSize, rows]
  );

  useEffect(() => {
    setPage(1);
  }, [rows.length]);

  return (
    <div className="overflow-hidden rounded-[14px] border border-[#e7e9ed] bg-white text-[14px] text-[#2b3140] shadow-[0_1px_2px_rgba(16,24,40,0.04),0_1px_6px_rgba(16,24,40,0.03)]">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead>
            <tr className="border-b border-[#eef0f3] bg-[#fafbfc]">
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-3.5 py-[13px] text-left text-[11px] font-bold uppercase tracking-[0.04em] text-[#39405a] ${
                    index === 0 ? "pl-7" : ""
                  } ${column.align === "right" ? "text-right" : ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(1, columns.length)} className="px-7 py-12 text-center text-[13px] text-[#9aa3b2]">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => (
                <tr
                  key={row?.[keyField] ?? index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-[#eef0f3] last:border-b-0 ${
                    onRowClick ? "cursor-pointer hover:bg-[#fafbfb]" : "hover:bg-[#fafbfb]"
                  }`}
                >
                  {columns.map((column, columnIndex) => (
                    <td
                      key={column.key}
                      className={`px-3.5 py-[13px] text-[13px] text-[#2b3140] ${
                        columnIndex === 0 ? "pl-7" : ""
                      } ${column.align === "right" ? "text-right" : ""}`}
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

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eef0f3] bg-white px-7 py-4 text-[12.5px] text-[#6c7689]">
        <span>
          {rows.length === 0
            ? "0 registos"
            : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, rows.length)} de ${rows.length} registos`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={currentPage <= 1}
            className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Anterior
          </button>
          <span className="rounded-lg bg-[#f4f6f8] px-3 py-1.5 font-semibold text-[#3a4150]">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-[#dde1e7] bg-white px-3 py-1.5 font-semibold text-[#3a4150] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Proximo
          </button>
        </div>
      </div>
    </div>
  );
}
