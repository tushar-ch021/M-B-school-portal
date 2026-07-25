import React, { useRef } from 'react';
import Modal from '../common/Modal';
import FeeReceiptTemplate from './FeeReceiptTemplate';
import { printElement } from '../../utils/printElement';
import { downloadPDF } from '../../utils/generatePDF';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSuccessReceiptModal = ({ isOpen, onClose, receiptData }) => {
  const receiptRef = useRef(null);

  if (!receiptData || !receiptData.student) return null;

  const {
    student,
    receiptNo = `REC-${Date.now().toString().slice(-6)}`,
    amountPaid,
    totalReceived,
    paymentMode = 'Cash',
    date,
    receiptDate,
    month = '',
    year = '',
    academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    amountDue,
    totalDues,
    remainingBalance,
    totalBalance,
    remark = '',
    feeItems = []
  } = receiptData;

  const actualAmountPaid = amountPaid !== undefined ? amountPaid : (totalReceived !== undefined ? totalReceived : 0);
  const actualAmountDue = amountDue !== undefined ? amountDue : (totalDues !== undefined ? totalDues : 0);
  const actualRemainingBalance = remainingBalance !== undefined ? remainingBalance : (totalBalance !== undefined ? totalBalance : 0);
  const actualDate = date || receiptDate || new Date();

  const formattedDate = new Date(actualDate).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const isPartial = actualRemainingBalance > 0;

  // Formatted payment object for printable template
  const printablePayment = {
    student,
    receiptNo,
    receiptDate: actualDate,
    academicYear,
    paymentMode,
    totalDues: actualAmountDue,
    totalReceived: actualAmountPaid,
    totalBalance: actualRemainingBalance,
    remark: remark || `Monthly Fee Payment for ${month} ${year}`,
    feeItems: (feeItems && feeItems.length > 0) ? feeItems : [
      {
        particular: `Monthly Fee - ${month} ${year}`.trim(),
        dueDate: actualDate,
        dues: actualAmountDue,
        received: actualAmountPaid,
        balance: actualRemainingBalance
      }
    ]
  };

  const handlePrint = () => {
    printElement(receiptRef.current, `Fee_Receipt_${receiptNo}`);
  };

  const handleDownload = async () => {
    const toastId = toast.loading('Generating fee receipt PDF...');
    try {
      await downloadPDF(receiptRef.current, `Fee_Receipt_${receiptNo}.pdf`, { useA4: true });
      toast.success('Fee receipt PDF downloaded', { id: toastId });
    } catch (err) {
      console.error('PDF download error:', err);
      toast.error('Failed to generate PDF receipt', { id: toastId });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Payment Submitted Successfully" size="lg">
      <div className="space-y-6">
        {/* Success Header Banner */}
        <div className="bg-schoolGreen-50 border border-schoolGreen-200 rounded-xl p-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-schoolGreen-100 mb-2">
            <CheckCircle2 className="h-7 w-7 text-schoolGreen-800" />
          </div>
          <h3 className="text-lg font-black text-schoolGreen-900">
            Payment Recorded Successfully!
          </h3>
          <p className="text-xs font-semibold text-schoolGreen-800 mt-1">
            Receipt No: <span className="font-mono font-bold">{receiptNo}</span>
          </p>
        </div>

        {/* Payment Particulars Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Student Name</span>
            <p className="font-bold text-navy-900">{student.firstName} {student.lastName}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Class & Section</span>
            <p className="font-bold text-navy-900">Class {student.class} - {student.section}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Payment Date</span>
            <p className="font-bold text-gray-900">{formattedDate}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Cycle / Month</span>
            <p className="font-bold text-navy-900">{month ? `${month} ${year}` : academicYear}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Payment Mode</span>
            <p className="font-bold text-gray-900">{paymentMode}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400">Amount Paid</span>
            <p className="font-extrabold text-schoolGreen-900 text-sm">₹{Number(actualAmountPaid).toFixed(2)}</p>
          </div>

          <div className="col-span-2 sm:col-span-3 pt-2 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-gray-500">Remaining Balance:</span>
            <span className={`text-sm font-extrabold ${isPartial ? 'text-red-650' : 'text-schoolGreen-900'}`} style={isPartial ? { color: '#c62828' } : {}}>
              {isPartial ? `₹${Number(actualRemainingBalance).toFixed(2)} (Partial Settlement)` : '₹0.00 (Fully Settled)'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Print & Download Receipt */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border-2 border-navy-900 bg-white px-4 py-2.5 text-xs font-extrabold text-navy-900 hover:bg-navy-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs hover:bg-navy-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Receipt
          </button>

          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Done
          </button>
        </div>

        {/* Hidden Printable Template Container */}
        <div className="hidden">
          <div ref={receiptRef}>
            <FeeReceiptTemplate payment={printablePayment} />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentSuccessReceiptModal;
