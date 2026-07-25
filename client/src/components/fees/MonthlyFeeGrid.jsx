import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, DollarSign, CheckCircle2, Clock, ShieldAlert, CreditCard, User, Edit2 } from 'lucide-react';
import feeService from '../../services/feeService';
import { FEE_STATUS_THEME } from '../../utils/themeConstants';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import PaymentSuccessReceiptModal from './PaymentSuccessReceiptModal';
import toast from 'react-hot-toast';

const MonthlyFeeGrid = ({ studentId, academicYear }) => {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Payment modal states
  const [selectedMonthItem, setSelectedMonthItem] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Payment Success Receipt Modal states
  const [successReceiptData, setSuccessReceiptData] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Edit Individual Student Fee states
  const [editFeeItem, setEditFeeItem] = useState(null);
  const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [tuitionFeeInput, setTuitionFeeInput] = useState('');
  const [transportFeeInput, setTransportFeeInput] = useState('');
  const [otherFeeInput, setOtherFeeInput] = useState('0');
  const [otherFeeTypeInput, setOtherFeeTypeInput] = useState('Exam Fee');
  const [savingFee, setSavingFee] = useState(false);

  const fetchStudentMatrix = useCallback(() => {
    if (!studentId) return;

    setLoading(true);
    feeService.getStudentMonthlyFees(studentId, { academicYear })
      .then((res) => {
        if (isMounted.current) setData(res);
      })
      .catch(() => {
        if (isMounted.current) toast.error('Failed to load student fee matrix');
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, [studentId, academicYear]);

  useEffect(() => {
    fetchStudentMatrix();
  }, [fetchStudentMatrix]);

  const handleOpenEditFeeModal = (item) => {
    setEditFeeItem(item);
    const st = data?.student || {};
    const currentTotal = item.amountDue || 0;

    const transport = item.transportFee !== undefined && item.transportFee !== null && item.transportFee >= 0
      ? item.transportFee
      : ((st.usesTransport && st.transportFee > 0) ? st.transportFee : 0);

    const other = item.otherFee !== undefined && item.otherFee !== null ? item.otherFee : 0;
    const otherType = item.otherFeeType || 'Exam Fee';

    const tuition = item.tuitionFee !== undefined && item.tuitionFee !== null && item.tuitionFee > 0
      ? item.tuitionFee
      : (currentTotal > 0 ? Math.max(0, currentTotal - transport - other) : (st.tuitionFee || 0));

    setTuitionFeeInput(tuition.toString());
    setTransportFeeInput(transport.toString());
    setOtherFeeInput(other.toString());
    setOtherFeeTypeInput(otherType);
    setEditFeeAmount(currentTotal > 0 ? currentTotal.toString() : '');
    setEditFeeModalOpen(true);
  };

  const handleSaveEditFeeSubmit = async (e) => {
    e.preventDefault();
    const computedTotal = (Number(tuitionFeeInput) || 0) + (Number(transportFeeInput) || 0) + (Number(otherFeeInput) || 0);

    if (computedTotal < 0 || isNaN(computedTotal)) {
      toast.error('Please enter valid non-negative fee amounts');
      return;
    }

    setSavingFee(true);
    const toastId = toast.loading(`Updating fee for ${editFeeItem.month}...`);

    try {
      await feeService.setIndividualStudentMonthlyFee({
        studentId,
        month: editFeeItem.month,
        year: editFeeItem.year,
        academicYear: data.academicYear,
        tuitionFee: Number(tuitionFeeInput) || 0,
        transportFee: Number(transportFeeInput) || 0,
        otherFee: Number(otherFeeInput) || 0,
        otherFeeType: otherFeeTypeInput || '',
        amountDue: computedTotal
      });

      toast.success(`Fee for ${editFeeItem.month} updated to ₹${computedTotal}`, { id: toastId });
      setEditFeeModalOpen(false);
      fetchStudentMatrix();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update student fee', { id: toastId });
    } finally {
      setSavingFee(false);
    }
  };

  const [tuitionPayInput, setTuitionPayInput] = useState('0');
  const [transportPayInput, setTransportPayInput] = useState('0');
  const [otherPayInput, setOtherPayInput] = useState('0');
  const [carriedPayInput, setCarriedPayInput] = useState('0');
  const [carryForwardChecked, setCarryForwardChecked] = useState(false);

  const totalPaymentSum = (Number(tuitionPayInput) || 0) + (Number(transportPayInput) || 0) + (Number(otherPayInput) || 0) + (carryForwardChecked ? (Number(carriedPayInput) || 0) : 0);

  const computeCategoryBreakdownInputs = (item, isCarryChecked, prevDueVal) => {
    if (!item) return { tuition: '0', transport: '0', other: '0', carried: '0' };
    const st = data?.student || {};

    const transportVal = (item.transportFee !== undefined && item.transportFee !== null && item.transportFee > 0)
      ? item.transportFee
      : ((st.usesTransport && st.transportFee > 0) ? st.transportFee : 0);

    const otherVal = item.otherFee || 0;

    const carriedVal = (isCarryChecked && prevDueVal > 0)
      ? prevDueVal
      : (item.carriedForwardFrom?.amount || 0);

    const baseDueNoCarried = Math.max(0, (item.amountDue || 0) - (item.carriedForwardFrom?.amount || 0));
    const tuitionVal = (item.tuitionFee !== undefined && item.tuitionFee !== null && item.tuitionFee > 0)
      ? item.tuitionFee
      : Math.max(0, baseDueNoCarried - transportVal - otherVal);

    let paidTuition = 0;
    let paidTransport = 0;
    let paidOther = 0;
    let paidCarried = 0;

    if (item.payments && item.payments.length > 0) {
      item.payments.forEach(p => {
        paidTuition += p.tuitionPaid || 0;
        paidTransport += p.transportPaid || 0;
        paidOther += p.otherPaid || 0;
        paidCarried += p.carriedPaid || 0;
      });
    }

    const totalCategoryPaid = paidTuition + paidTransport + paidOther + paidCarried;
    const paid = item.amountPaid || 0;

    let dueTuition, dueTransport, dueOther, dueCarried;

    if (totalCategoryPaid === 0 && paid > 0) {
      // Fallback to greedy allocation for legacy payments
      let rem = paid;

      dueCarried = carriedVal;
      if (rem >= dueCarried) { rem -= dueCarried; dueCarried = 0; } else { dueCarried -= rem; rem = 0; }

      dueTuition = tuitionVal;
      if (rem >= dueTuition) { rem -= dueTuition; dueTuition = 0; } else { dueTuition -= rem; rem = 0; }

      dueTransport = transportVal;
      if (rem >= dueTransport) { rem -= dueTransport; dueTransport = 0; } else { dueTransport -= rem; rem = 0; }

      dueOther = otherVal;
      if (rem >= dueOther) { rem -= dueOther; dueOther = 0; } else { dueOther -= rem; rem = 0; }
    } else {
      dueTuition = Math.max(0, tuitionVal - paidTuition);
      dueTransport = Math.max(0, transportVal - paidTransport);
      dueOther = Math.max(0, otherVal - paidOther);
      dueCarried = Math.max(0, carriedVal - paidCarried);
    }

    return {
      tuition: dueTuition.toString(),
      transport: dueTransport.toString(),
      other: dueOther.toString(),
      carried: dueCarried.toString()
    };
  };

  const handleCarryToggle = (e) => {
    const isChecked = e.target.checked;
    setCarryForwardChecked(isChecked);
    const inputs = computeCategoryBreakdownInputs(selectedMonthItem, isChecked, selectedPrevDue);
    setTuitionPayInput(inputs.tuition);
    setTransportPayInput(inputs.transport);
    setOtherPayInput(inputs.other);
    setCarriedPayInput(inputs.carried);
  };

  const handleOpenPaymentModal = (item) => {
    if (!item.isConfigured || item.status === 'Not Set') {
      toast.error(`Fee for ${item.month} ${item.year} has not been configured by admin yet.`);
      return;
    }

    setSelectedMonthItem(item);
    setCarryForwardChecked(false);

    const prevItem = (item && item.monthIndex > 1)
      ? (data?.monthlyMatrix || []).find(m => m.monthIndex === item.monthIndex - 1)
      : null;
    const prevDue = prevItem ? Math.max(0, prevItem.amountDue - prevItem.amountPaid) : 0;

    const inputs = computeCategoryBreakdownInputs(item, false, prevDue);
    setTuitionPayInput(inputs.tuition);
    setTransportPayInput(inputs.transport);
    setOtherPayInput(inputs.other);
    setCarriedPayInput(inputs.carried);

    setPaymentMode('Cash');
    setRemark('');
    setPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMonthItem || totalPaymentSum <= 0) {
      toast.error('Please enter a valid non-zero payment amount across fee categories');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Processing ₹${totalPaymentSum} payment for ${selectedMonthItem.month}...`);

    try {
      const res = await feeService.collectMonthlyFeePayment({
        studentId,
        month: selectedMonthItem.month,
        year: selectedMonthItem.year,
        amount: totalPaymentSum,
        tuitionPaid: Number(tuitionPayInput) || 0,
        transportPaid: Number(transportPayInput) || 0,
        otherPaid: Number(otherPayInput) || 0,
        carriedPaid: Number(carriedPayInput) || 0,
        paymentMode,
        remark: remark.trim() || `Monthly Fee for ${selectedMonthItem.month}`,
        carryForwardPreviousDue: carryForwardChecked
      });

      toast.success('Payment recorded successfully!', { id: toastId });
      
      const priorPaid = selectedMonthItem.amountPaid || 0;
      const openingDues = Math.max(0, effectiveDue - priorPaid);
      const remainingBalance = Math.max(0, openingDues - totalPaymentSum);

      setSuccessReceiptData(res?.payment ? { ...res.payment, student } : {
        student,
        receiptNo: res?.data?.payments?.slice(-1)[0]?.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
        receiptDate: new Date(),
        totalDues: openingDues,
        totalReceived: totalPaymentSum,
        totalBalance: remainingBalance,
        amountPaid: totalPaymentSum,
        paymentMode,
        date: new Date(),
        month: selectedMonthItem.month,
        year: selectedMonthItem.year,
        academicYear: data.academicYear,
        amountDue: openingDues,
        remainingBalance,
        remark: remark.trim(),
        feeItems: res?.payment?.feeItems || []
      });

      setPaymentModalOpen(false);
      setSuccessModalOpen(true);
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

  const selectedPrevItem = (selectedMonthItem && selectedMonthItem.monthIndex > 1)
    ? matrix.find(m => m.monthIndex === selectedMonthItem.monthIndex - 1)
    : null;
  const selectedPrevDue = selectedPrevItem ? Math.max(0, selectedPrevItem.amountDue - selectedPrevItem.amountPaid) : 0;
  const baseDue = selectedMonthItem ? selectedMonthItem.amountDue : 0;
  const effectiveDue = baseDue + (carryForwardChecked ? selectedPrevDue : 0);
  const effectivePaid = selectedMonthItem ? selectedMonthItem.amountPaid : 0;
  const effectiveBalance = Math.max(0, effectiveDue - effectivePaid);



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

                {item.carriedForwardFrom?.amount > 0 && (
                  <div className="mb-2 text-[10px] font-bold text-purple-950 bg-purple-50 border border-purple-200 px-2 py-1 rounded-md">
                    📌 Carry Forward: +₹{item.carriedForwardFrom.amount} (from {item.carriedForwardFrom.month})
                  </div>
                )}
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
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1.5">
              <div className="flex justify-between text-navy-900 font-semibold border-b border-navy-100 pb-1">
                <span>Month & Session:</span>
                <span>{selectedMonthItem.month} {selectedMonthItem.year}</span>
              </div>
              {(() => {
                const transVal = (selectedMonthItem.transportFee !== undefined && selectedMonthItem.transportFee !== null && selectedMonthItem.transportFee > 0)
                  ? selectedMonthItem.transportFee
                  : ((student.usesTransport && student.transportFee > 0) ? student.transportFee : 0);
                const otherVal = selectedMonthItem.otherFee || 0;
                const tuitVal = (selectedMonthItem.tuitionFee !== undefined && selectedMonthItem.tuitionFee !== null && selectedMonthItem.tuitionFee > 0)
                  ? selectedMonthItem.tuitionFee
                  : Math.max(0, baseDue - transVal - otherVal);

                return (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Tuition / Class Fee:</span>
                      <span>₹{tuitVal}</span>
                    </div>
                    {(transVal > 0 || student.usesTransport) && (
                      <div className="flex justify-between text-amber-900 font-medium">
                        <span>Transport Fee {student.transportRoute ? `(${student.transportRoute})` : ''}:</span>
                        <span>₹{transVal}</span>
                      </div>
                    )}
                    {otherVal > 0 && (
                      <div className="flex justify-between text-blue-900 font-medium">
                        <span>{selectedMonthItem.otherFeeType || 'Other Fee'}:</span>
                        <span>₹{otherVal}</span>
                      </div>
                    )}
                  </>
                );
              })()}
              {carryForwardChecked && selectedPrevDue > 0 && selectedPrevItem && (
                <div className="flex justify-between text-purple-950 font-bold bg-purple-100/70 px-2 py-1 rounded border border-purple-200">
                  <span>Carried Previous Due (from {selectedPrevItem.month}):</span>
                  <span>+₹{selectedPrevDue}</span>
                </div>
              )}
              <div className="flex justify-between text-navy-900 font-bold border-t border-navy-200 pt-1">
                <span>Total Month Dues:</span>
                <span>₹{effectiveDue}</span>
              </div>
              <div className="flex justify-between text-schoolGreen-900 font-bold">
                <span>Already Paid:</span>
                <span>₹{effectivePaid}</span>
              </div>
              <div className="flex justify-between text-red-900 font-extrabold border-t border-navy-200 pt-1 text-sm">
                <span>Net Remaining Dues to Collect:</span>
                <span>₹{effectiveBalance}</span>
              </div>
            </div>

            {selectedPrevDue > 0 && selectedPrevItem && (
              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
                <input
                  type="checkbox"
                  id="carryForwardCheck"
                  checked={carryForwardChecked}
                  onChange={handleCarryToggle}
                  className="h-4 w-4 text-navy-900 rounded border-gray-300 focus:ring-navy-900"
                />
                <label htmlFor="carryForwardCheck" className="text-xs font-bold text-amber-950 cursor-pointer">
                  Include previous due (₹{selectedPrevDue} from {selectedPrevItem.month}) into {selectedMonthItem.month}
                </label>
              </div>
            )}

            {/* Itemized Payment Category Inputs */}
            <div className="space-y-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <span className="text-[11px] font-black uppercase text-navy-900 tracking-wider block border-b border-gray-200 pb-1">
                Enter Payment Breakdown by Fee Category (₹)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tuition Fee Payment (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tuitionPayInput}
                    onChange={(e) => setTuitionPayInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>

                {(selectedMonthItem.transportFee > 0 || student.usesTransport) && (
                  <div>
                    <label className="block text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Transport Fee Payment (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={transportPayInput}
                      onChange={(e) => setTransportPayInput(e.target.value)}
                      className="w-full rounded-lg border border-amber-300 bg-amber-50/40 px-3 py-2 text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                )}

                {selectedMonthItem.otherFee > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      {selectedMonthItem.otherFeeType || 'Other Fee'} Payment (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={otherPayInput}
                      onChange={(e) => setOtherPayInput(e.target.value)}
                      className="w-full rounded-lg border border-blue-300 bg-blue-50/40 px-3 py-2 text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                )}

                {((carryForwardChecked && selectedPrevDue > 0) || (selectedMonthItem?.carriedForwardFrom?.amount > 0)) && (
                  <div>
                    <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1">
                      Carried Due Payment (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={carriedPayInput}
                      onChange={(e) => setCarriedPayInput(e.target.value)}
                      className="w-full rounded-lg border border-purple-300 bg-purple-50/40 px-3 py-2 text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                )}
              </div>

              <div className="bg-navy-900 text-white p-3 rounded-lg flex items-center justify-between font-bold text-xs">
                <span>Total Payment to Submit:</span>
                <span className="text-sm font-extrabold text-schoolGreen-400">₹{totalPaymentSum}</span>
              </div>
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

            {totalPaymentSum <= 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <span>ℹ️</span>
                <span>This month's fee is already fully settled or has no remaining due. To record a payment, enter an amount in the category fields above.</span>
              </div>
            )}

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
                disabled={submitting || totalPaymentSum <= 0}
                className="flex-1 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
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

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tuition Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={tuitionFeeInput}
                    onChange={(e) => setTuitionFeeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Transport Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={transportFeeInput}
                    onChange={(e) => setTransportFeeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Other Fee Category
                  </label>
                  <select
                    value={otherFeeTypeInput}
                    onChange={(e) => setOtherFeeTypeInput(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  >
                    {['Exam Fee', 'Admission Fee', 'Annual Fee', 'Activity Fee', 'Computer / Lab Fee', 'Late Fee', 'Miscellaneous'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Other Fee Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={otherFeeInput}
                    onChange={(e) => setOtherFeeInput(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div className="bg-navy-900 text-white p-3 rounded-lg flex items-center justify-between font-bold text-xs mt-2">
                <span>Calculated Total Month Fee:</span>
                <span className="text-sm font-extrabold text-amber-300">
                  ₹{(Number(tuitionFeeInput) || 0) + (Number(transportFeeInput) || 0) + (Number(otherFeeInput) || 0)}
                </span>
              </div>
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

      {/* Payment Success Confirmation & Receipt Modal */}
      <PaymentSuccessReceiptModal
        isOpen={successModalOpen}
        onClose={() => setSuccessModalOpen(false)}
        receiptData={successReceiptData}
      />
    </div>
  );
};

export default MonthlyFeeGrid;
