"use client";

import { Pencil, Trash2 } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T & string;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  keyField,
  onEdit,
  onDelete,
  onRowClick,
  emptyMessage = "데이터가 없습니다",
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3 w-24">
                액션
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((item, index) => (
            <tr
              key={String(item[keyField] ?? index)}
              onClick={() => onRowClick?.(item)}
              className={`hover:bg-gray-50 transition-colors ${onRowClick ? "cursor-pointer" : ""}`}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                  {col.render
                    ? col.render(item)
                    : String((item as Record<string, unknown>)[col.key] ?? "")}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-1.5 text-gray-400 hover:text-danger rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
