import React, { useState, useEffect, useCallback } from 'react';
import { Users, CheckCircle2, AlertCircle, Clock, Search, DollarSign, Wallet, Edit2 } from 'lucide-react';
import feeService from '../../services/feeService';
import { FEE_STATUS_THEME } from '../../utils/themeConstants';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';

const ClassFeeOverview = ({ selectedClass, selectedSection, selectedMonth, selectedYear, refreshKey }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Collector Modal State
  const [activeStudent, setActiveStudent] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Individual Student Fee State
  const [editStudentItem, setEditStudentItem] = useState(null);
  const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [savingFee, setSavingFee] = useState(false);

  const fetchClassOverview = useCallback(() => {
    if (!selectedClass || !selectedMonth || !selectedYear) return;

    setLoading(true);
    feeService.getClassMonthlyFeeOverview({
      className: selectedClass,
      section: selectedSection,
      month: selectedMonth,
      year: selectedYear
    })
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        toast.error('Failed to load class fee status');
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedSection, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchClassOverview();
  }, [fetchClassOverview, refreshKey]);

  const handleOpenEditFeeModal = (stItem) => {
    setEditStudentItem(stItem);
    setEditFeeAmount(stItem.amountDue > 0 ? stItem.amountDue.toString() : '');
    setEditFeeModalOpen(true);
  };

  const handleSaveEditFeeSubmit = async (e) => {
    e.preventDefault();
    if (editFeeAmount === '' || isNaN(editFeeAmount) || Number(editFeeAmount) < 0) {
      toast.error('Please enter a valid non-negative fee amount');
      return;
    }

    setSavingFee(true);
    const toastId = toast.loading(`Updating fee for ${editStudentItem.student.firstName}...`);

    try {
      await feeService.setIndividualStudentMonthlyFee({
        studentId: editStudentItem.student._id,
        month: selectedMonth,
        year: selectedYear,
        amountDue: Number(editFeeAmount)
      });

      toast.success(`Fee for ${editStudentItem.student.firstName} set to ₹${editFeeAmount}`, { id: toastId });
      setEditFeeModalOpen(false);
      fetchClassOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update student fee', { id: toastId });
    } finally {
      setSavingFee(false);
    }
  };

  const handleOpenPaymentModal = (stItem) => {
    if (!data?.isConfigured) {
      toast.error(`Fee for Class ${selectedClass} (${selectedMonth} ${selectedYear}) has not been set by admin yet.`);
      return;
    }
    setActiveStudent(stItem);
    const bal = stItem.amountDue - stItem.amountPaid;
    setPaymentAmount(bal > 0 ? bal.toString() : '');
    setPaymentMode('Cash');
    setRemark('');
    setPaymentModalOpen(true);
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (!activeStudent || !paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Recording ₹${paymentAmount} payment...`);

    try {
      await feeService.collectMonthlyFeePayment({
        studentId: activeStudent.student._id,
        month: selectedMonth,
        year: selectedYear,
        amount: Number(paymentAmount),
        paymentMode,
        remark: remark.trim() || `Monthly Fee for ${selectedMonth}`
      });

      toast.success('Payment recorded successfully!', { id: toastId });
      setPaymentModalOpen(false);
      fetchClassOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment collection failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const studentsList = data?.students || [];

  const filteredStudents = studentsList.filter((item) => {
    const st = item.student;
    const nameMatch = `${st.firstName} ${st.lastName} ${st.serialNo} ${st.rollNo || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    
    if (!nameMatch) return false;
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  if (loading) {
    return <div className="py-12 flex justify-center"><LoadingSpinner size="lg" /></div>;
  }

  const summary = data?.summary || { totalStudents: 0, paidCount: 0, partialCount: 0, dueCount: 0, notSetCount: 0 };
  const isConfigured = data?.isConfigured;

  return (
    <div className="space-y-4">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-card border border-gray-200 bg-white p-3.5 shadow-flat">
          <p className="text-[10px] font-bold uppercase text-gray-400">Total Roster</p>
          <p className="text-xl font-extrabold text-navy-900 mt-1">{summary.totalStudents}</p>
        </div>

        <div className="rounded-card border border-schoolGreen-200 bg-schoolGreen-50/40 p-3.5 shadow-flat">
          <p className="text-[10px] font-bold uppercase text-schoolGreen-800">Paid (Full)</p>
          <p className="text-xl font-extrabold text-schoolGreen-900 mt-1">{summary.paidCount}</p>
        </div>

        <div className="rounded-card border border-amber-200 bg-amber-50/40 p-3.5 shadow-flat">
          <p className="text-[10px] font-bold uppercase text-amber-800">Partial</p>
          <p className="text-xl font-extrabold text-amber-900 mt-1">{summary.partialCount}</p>
        </div>

        <div className="rounded-card border border-red-200 bg-red-50/40 p-3.5 shadow-flat">
          <p className="text-[10px] font-bold uppercase text-red-800">Due (Unpaid)</p>
          <p className="text-xl font-extrabold text-red-900 mt-1">{summary.dueCount}</p>
        </div>

        <div className="rounded-card border border-gray-300 bg-gray-50 p-3.5 shadow-flat">
          <p className="text-[10px] font-bold uppercase text-gray-600">Not Set</p>
          <p className="text-xl font-extrabold text-gray-700 mt-1">{summary.notSetCount}</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="rounded-card border border-gray-200 bg-white p-4 shadow-flat flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student by name or SR..."
            className="w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 py-1.5 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
          {['ALL', 'Paid', 'Partial', 'Due', 'Not Set'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                statusFilter === status
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Roster Grid Cards */}
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-card text-center space-y-1">
          <p className="text-xs font-bold text-amber-900">
            ⚠️ Fee for Class {selectedClass} ({selectedMonth} {selectedYear}) has not been configured yet.
          </p>
          <p className="text-[11px] text-amber-800">
            Use the form above to set the monthly fee amount. Payment collection is disabled until a fee amount is configured.
          </p>
        </div>
      )}

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12 rounded-card border border-gray-200 bg-white p-6">
          <p className="text-xs font-semibold text-gray-500">No student records found matching current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((item) => {
            const st = item.student;
            const theme = FEE_STATUS_THEME[item.status] || FEE_STATUS_THEME['Not Set'];

            return (
              <div
                key={st._id}
                className={`rounded-card border bg-white p-4 shadow-flat transition-all hover:shadow-md flex flex-col justify-between ${theme.borderClass}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div>
                      <h4 className="font-bold text-sm text-navy-900 leading-tight">
                        {st.firstName} {st.lastName}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                        Class {st.class}-{st.section} | SR: {st.serialNo}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold uppercase rounded-full border border-current ${theme.badgeClass}`}>
                        {theme.label}
                      </span>
                      <button
                        onClick={() => handleOpenEditFeeModal(item)}
                        title="Set/Edit Individual Fee for this student"
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
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">Amount Paid</span>
                      <p className="font-extrabold text-schoolGreen-900">₹{item.amountPaid}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenPaymentModal(item)}
                  disabled={!isConfigured}
                  className={`w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    isConfigured
                      ? 'bg-navy-900 text-white hover:bg-navy-800 shadow-xs'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
                >
                  <Wallet className="h-3.5 w-3.5" />
                  {isConfigured ? (item.amountPaid >= item.amountDue ? 'Record Additional' : 'Collect Payment') : 'Fee Not Set'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Collect Monthly Fee Payment Modal */}
      {activeStudent && (
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Collect Fee — ${activeStudent.student.firstName} ${activeStudent.student.lastName} (${selectedMonth} ${selectedYear})`}
          size="md"
        >
          <form onSubmit={handleCollectSubmit} className="space-y-4">
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1">
              <div className="flex justify-between text-navy-900 font-semibold">
                <span>Class & Student:</span>
                <span>{activeStudent.student.firstName} {activeStudent.student.lastName} ({selectedClass})</span>
              </div>
              <div className="flex justify-between text-navy-900 font-semibold">
                <span>Month Fee Amount Due:</span>
                <span>₹{activeStudent.amountDue}</span>
              </div>
              <div className="flex justify-between text-schoolGreen-900 font-bold">
                <span>Already Paid:</span>
                <span>₹{activeStudent.amountPaid}</span>
              </div>
              <div className="flex justify-between text-red-900 font-bold border-t border-navy-200 pt-1">
                <span>Remaining Dues Balance:</span>
                <span>₹{Math.max(0, activeStudent.amountDue - activeStudent.amountPaid)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Payment Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={Math.max(1, activeStudent.amountDue - activeStudent.amountPaid)}
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
                placeholder="e.g. Received via GPay ref #12345"
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
      {editStudentItem && (
        <Modal
          isOpen={editFeeModalOpen}
          onClose={() => setEditFeeModalOpen(false)}
          title={`Set Monthly Fee — ${editStudentItem.student.firstName} ${editStudentItem.student.lastName} (${selectedMonth} ${selectedYear})`}
          size="md"
        >
          <form onSubmit={handleSaveEditFeeSubmit} className="space-y-4">
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1">
              <p className="text-navy-900 font-semibold">
                Set custom monthly fee for <span className="font-bold">{editStudentItem.student.firstName} {editStudentItem.student.lastName}</span> for <span className="font-bold">{selectedMonth} {selectedYear}</span>.
              </p>
              <p className="text-gray-500 text-[11px]">
                This overrides the class default fee for this student for this month.
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

export default ClassFeeOverview;
