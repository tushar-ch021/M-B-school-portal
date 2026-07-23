import React from 'react';
import DataTable from '../common/DataTable';
import { Printer } from 'lucide-react';

const FeeHistoryTable = ({ payments, loading, onReprint }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const columns = [
    {
      header: 'Receipt No',
      key: 'receiptNo',
      className: 'font-semibold text-navy-900'
    },
    {
      header: 'Fee Month / Particulars',
      key: 'particulars',
      render: (p) => (
        <span className="font-bold text-navy-900">
          {p.feeItems?.[0]?.particular || p.remark || 'Monthly Fee'}
        </span>
      )
    },
    {
      header: 'Date',
      key: 'receiptDate',
      render: (p) => <span>{formatDate(p.receiptDate)}</span>
    },
    {
      header: 'Academic Cycle',
      key: 'academicYear'
    },
    {
      header: 'Mode',
      key: 'paymentMode',
      render: (p) => (
        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-800 border border-gray-200">
          {p.paymentMode}
        </span>
      )
    },
    {
      header: 'Dues (₹)',
      key: 'totalDues',
      className: 'text-right font-semibold',
      render: (p) => <span>{p.totalDues.toFixed(2)}</span>
    },
    {
      header: 'Received (₹)',
      key: 'totalReceived',
      className: 'text-right font-bold text-schoolGreen-800',
      render: (p) => <span>{p.totalReceived.toFixed(2)}</span>
    },
    {
      header: 'Balance (₹)',
      key: 'totalBalance',
      className: 'text-right font-bold text-red-650',
      render: (p) => (
        <span style={{ color: p.totalBalance > 0 ? '#c62828' : 'inherit' }}>
          {p.totalBalance.toFixed(2)}
        </span>
      )
    },
    {
      header: 'Action',
      key: 'actions',
      style: { width: '100px' },
      render: (p) => (
        <button
          onClick={() => onReprint(p)}
          title="Reprint Receipt"
          className="flex items-center gap-1 rounded-lg border border-navy-900 bg-white px-2.5 py-1 text-xs font-bold text-navy-900 hover:bg-navy-50 transition-colors no-print"
        >
          <Printer className="h-3.5 w-3.5" />
          Reprint
        </button>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={payments}
      loading={loading}
      emptyMessage="No billing receipt history found for this student."
    />
  );
};

export default FeeHistoryTable;
