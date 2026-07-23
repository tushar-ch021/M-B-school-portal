import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';

const DataTable = ({ 
  columns, 
  data, 
  loading, 
  emptyMessage = 'No matching records found',
  onRowClick
}) => {
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-lg border border-gray-100 bg-white shadow-xs">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-8 shadow-xs">
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xs">
      {/* Horizontal scrolling wrapper */}
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[800px] table-auto border-collapse text-left text-sm text-gray-500">
          <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200">
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 font-semibold ${col.className || ''}`}
                  style={col.style}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-gray-900">
            {data.map((row, rowIdx) => (
              <tr
                key={row._id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-navy-50/40' : 'hover:bg-gray-50/50'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`whitespace-nowrap px-6 py-4 text-sm ${col.className || ''}`}
                    style={col.style}
                  >
                    {col.render ? col.render(row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(DataTable);
