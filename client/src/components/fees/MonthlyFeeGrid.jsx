import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, DollarSign, CheckCircle2, Clock, ShieldAlert, CreditCard, User, Edit2 } from 'lucide-react';
import feeService from '../../services/feeService';
import { FEE_STATUS_THEME } from '../../utils/themeConstants';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

const MonthlyFeeGrid = ({ studentId, academicYear }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Payment modal states
  const [selectedMonthItem, setSelectedMonthItem] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Individual Student Fee states
  const [editFeeItem, setEditFeeItem] = useState(null);
  const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const fetchStudentMatrix = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    feeService.getStudentMonthlyFees(studentId, { academicYear })
      .then((res) => {
        setData(res);
      })
      .catch(() => {
        toast.error('Failed to load student fee matrix');
      })
      .finally(() => setLoading(false));
  }, [studentId, academicYear]);

  useEffect(() => {
    fetchStudentMatrix();
  }, [fetchStudentMatrix]);

  const handleOpenEditFeeModal = (item) => {
    setEditFeeItem(item);
    setEditFeeAmount(item.amountDue > 0 ? item.amountDue.toString() : '');
    setEditFeeModalOpen(true);
  };

  const handleSaveEditFeeSubmit = async (e) => {
    e.preventDefault();
    if (editFeeAmount === '' || isNaN(editFeeAmount) || Number(editFeeAmount) < 0) {
      toast.error('Please enter a valid non-negative fee amount');
      return;
    }

    setSavingFee(true);
    const toastId = toast.loading(`Updating fee for ${editFeeItem.month}...`);

    try {
      await feeService.setIndividualStudentMonthlyFee({
        studentId,
        month: editFeeItem.month,
        year: editFeeItem.year,
        amountDue: Number(editFeeAmount)
      });

      toast.success(`Fee for ${editFeeItem.month} updated to ₹${editFeeAmount}`, { id: toastId });
      setEditFeeModalOpen(false);
      fetchStudentMatrix();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update student fee', { id: toastId });
    } finally {
      setSavingFee(false);
    }
  };

  const handleOpenPaymentModal = (item) => {
    if (!item.isConfigured || item.status === 'Not Set') {
      toast.error(`Fee for ${item.month} ${item.year} has not been configured by admin yet.`);
      return;
    }

    setSelectedMonthItem(item);
    const balance = item.amountDue - item.amountPaid;
    setPaymentAmount(balance > 0 ? balance.toString() : '');
    setPaymentMode('Cash');
    setRemark('');
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMonthItem || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Processing ₹${paymentAmount} payment for ${selectedMonthItem.month}...`);

    try {
      await feeService.collectMonthlyFeePayment({
        studentId,
        month: selectedMonthItem.month,
        year: selectedMonthItem.year,
        amount: Number(paymentAmount),
        paymentMode,
        remark: remark.trim() || `Monthly Fee for ${selectedMonthItem.month}`
      });

      toast.success('Payment recorded successfully!', { id: toastId });
      setPaymentModalOpen(false);
      fetchStudentMatrix();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment collection failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-xs text-gray-500 font-semibold">Select a student to load monthly fee matrix.</div>;
  }

  const student = data.student || {};
  const matrix = data.monthlyMatrix || [];

  return (
    <div className="space-y-6">
      {/* Student Banner */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-navy-50 border border-navy-100 flex items-center justify-center text-navy-900 font-bold">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-navy-900">
              {student.firstName} {student.lastName}
            </h3>
            <p className="text-xs text-gray-500 font-semibold">
              Class {student.class}-{student.section} | SR: {student.serialNo} | Roll: {student.rollNo || '-'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Academic Session</span>
          <p className="text-sm font-extrabold text-navy-900">{data.academicYear}</p>
        </div>
      </div>

      {/* 12 Month Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {matrix.map((item) => {
          const theme = FEE_STATUS_THEME[item.status] || FEE_STATUS_THEME['Not Set'];
          const balance = Math.max(0, item.amountDue - item.amountPaid);

          return (
            <div
              key={item.monthIndex}
              className={`rounded-card border bg-white p-4 shadow-flat transition-all hover:shadow-md flex flex-col justify-between ${theme.borderClass}`}
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-navy-900">{item.month}</h4>
                    <span className="text-[10px] text-gray-400 font-medium">{item.year}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border ${theme.badgeClass}`}>
                      {theme.label}
                    </span>
                    <button
                      onClick={() => handleOpenEditFeeModal(item)}
                      title="Set/Edit Individual Fee for this month"
                      className="p-1 rounded-md text-gray-400 hover:text-navy-900 hover:bg-gray-100 transition-colors"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Amount Due</span>
                    <p className="font-extrabold text-navy-900">₹{item.amountDue}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Paid</span>
                    <p className="font-extrabold text-schoolGreen-900">₹{item.amountPaid}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 mt-2">
                <button
                  onClick={() => handleOpenPaymentModal(item)}
                  disabled={!item.isConfigured || item.status === 'Not Set'}
                  className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    item.isConfigured && item.status !== 'Not Set'
                      ? 'bg-navy-900 text-white hover:bg-navy-800 shadow-xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  {item.isConfigured && item.status !== 'Not Set' ? (balance > 0 ? 'Pay Month Fee' : 'Record Payment') : 'Fee Not Set'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collect Monthly Fee Modal */}
      {selectedMonthItem && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Collect Fee — ${selectedMonthItem.month} ${selectedMonthItem.year}`}
          size="md"
        >
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1">
              <div className="flex justify-between text-navy-900 font-semibold">
                <span>Month & Session:</span>
                <span>{selectedMonthItem.month} {selectedMonthItem.year}</span>
              </div>
              <div className="flex justify-between text-navy-900 font-semibold">
                <span>Month Due Amount:</span>
                <span>₹{selectedMonthItem.amountDue}</span>
              </div>
              <div className="flex justify-between text-schoolGreen-900 font-bold">
                <span>Already Paid:</span>
                <span>₹{selectedMonthItem.amountPaid}</span>
              </div>
              <div className="flex justify-between text-red-900 font-bold border-t border-navy-200 pt-1">
                <span>Balance Dues:</span>
                <span>₹{Math.max(0, selectedMonthItem.amountDue - selectedMonthItem.amountPaid)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, selectedMonthItem.amountDue - selectedMonthItem.amountPaid)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                {['Cash', 'UPI', 'Online', 'Cheque', 'DD'].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Remark / Note (Optional)
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. Paid in cash"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Set/Edit Individual Student Monthly Fee Modal */}
      {editFeeItem && (
        <Modal
          isOpen={editFeeModalOpen}
          onClose={() => setEditFeeModalOpen(false)}
          title={`Set Monthly Fee — ${student.firstName} ${student.lastName} (${editFeeItem.month} ${editFeeItem.year})`}
          size="md"
        >
          <form onSubmit={handleSaveEditFeeSubmit} className="space-y-4">
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1">
              <p className="text-navy-900 font-semibold">
                Set custom monthly fee for <span className="font-bold">{student.firstName} {student.lastName}</span> for <span className="font-bold">{editFeeItem.month} {editFeeItem.year}</span>.
              </p>
              <p className="text-gray-500 text-[11px]">
                This overrides the class default fee for this student for this specific month.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Monthly Fee Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={editFeeAmount}
                onChange={(e) => setEditFeeAmount(e.target.value)}
                placeholder="e.g. 1200"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditFeeModalOpen(false)}
                disabled={savingFee}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingFee}
                className="flex-1 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 disabled:opacity-50"
              >
                {savingFee ? 'Saving...' : 'Update Monthly Fee'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MonthlyFeeGrid;
