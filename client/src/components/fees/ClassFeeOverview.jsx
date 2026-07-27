import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Users, CheckCircle2, AlertCircle, Clock, Search, DollarSign, Wallet, Edit2 } from 'lucide-react';
import feeService from '../../services/feeService';
import { FEE_STATUS_THEME } from '../../utils/themeConstants';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import PaymentSuccessReceiptModal from './PaymentSuccessReceiptModal';
import toast from 'react-hot-toast';

const ClassFeeOverview = ({ selectedClass, selectedSection, selectedMonth, selectedYear, refreshKey }) => {
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

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

  // Success Receipt Modal State
  const [successReceiptData, setSuccessReceiptData] = useState(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);

  // Edit Individual Student Fee State
  const [editStudentItem, setEditStudentItem] = useState(null);
  const [editFeeModalOpen, setEditFeeModalOpen] = useState(false);
  const [editFeeAmount, setEditFeeAmount] = useState('');
  const [tuitionFeeInput, setTuitionFeeInput] = useState('');
  const [transportFeeInput, setTransportFeeInput] = useState('');
  const [otherFeesInput, setOtherFeesInput] = useState([{ category: 'Exam Fee', amount: '0' }]);
  const [savingFee, setSavingFee] = useState(false);

  const fetchClassOverview = useCallback(() => {
    if (!selectedClass || !selectedMonth) return;

    setLoading(true);
    feeService.getClassMonthlyFeeOverview({
      className: selectedClass,
      section: selectedSection,
      month: selectedMonth,
      year: selectedYear
    })
      .then((res) => {
        if (isMounted.current) setData(res);
      })
      .catch(() => {
        if (isMounted.current) toast.error('Failed to load class fee overview');
      })
      .finally(() => {
        if (isMounted.current) setLoading(false);
      });
  }, [selectedClass, selectedSection, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchClassOverview();
  }, [fetchClassOverview, refreshKey]);

  const handleOpenEditFeeModal = (stItem) => {
    setEditStudentItem(stItem);
    const st = stItem.student || {};
    const currentTotal = stItem.amountDue || 0;

    const transport = stItem.transportFee !== undefined && stItem.transportFee !== null && stItem.transportFee >= 0
      ? stItem.transportFee
      : ((st.usesTransport && st.transportFee > 0) ? st.transportFee : 0);

    const other = stItem.otherFee !== undefined && stItem.otherFee !== null ? stItem.otherFee : 0;
    const otherType = stItem.otherFeeType || 'Exam Fee';

    const tuition = stItem.tuitionFee !== undefined && stItem.tuitionFee !== null && stItem.tuitionFee > 0
      ? stItem.tuitionFee
      : (currentTotal > 0 ? Math.max(0, currentTotal - transport - other) : (st.tuitionFee || 0));

    setTuitionFeeInput(tuition.toString());
    setTransportFeeInput(transport.toString());

    let otherFeesList = [];
    if (stItem.otherFees && stItem.otherFees.length > 0) {
      otherFeesList = stItem.otherFees.map(of => ({ category: of.category, amount: of.amount.toString() }));
    } else if (other > 0) {
      otherFeesList = [{ category: otherType, amount: other.toString() }];
    } else {
      otherFeesList = [{ category: 'Exam Fee', amount: '0' }];
    }
    setOtherFeesInput(otherFeesList);

    setEditFeeAmount(currentTotal > 0 ? currentTotal.toString() : '');
    setEditFeeModalOpen(true);
  };

  const handleSaveEditFeeSubmit = async (e) => {
    e.preventDefault();
    const totalOtherFeeInput = otherFeesInput.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const computedTotal = (Number(tuitionFeeInput) || 0) + (Number(transportFeeInput) || 0) + totalOtherFeeInput;

    if (computedTotal < 0 || isNaN(computedTotal)) {
      toast.error('Please enter valid non-negative fee amounts');
      return;
    }

    setSavingFee(true);
    const toastId = toast.loading(`Updating fee for ${editStudentItem.student.firstName}...`);

    try {
      await feeService.setIndividualStudentMonthlyFee({
        studentId: editStudentItem.student._id,
        month: selectedMonth,
        year: selectedYear,
        academicYear: `${selectedYear}-${Number(selectedYear) + 1}`,
        tuitionFee: Number(tuitionFeeInput) || 0,
        transportFee: Number(transportFeeInput) || 0,
        otherFees: otherFeesInput.map(of => ({ category: of.category, amount: Number(of.amount) || 0 })),
        amountDue: computedTotal
      });

      toast.success(`Fee for ${editStudentItem.student.firstName} set to ₹${computedTotal}`, { id: toastId });
      setEditFeeModalOpen(false);
      fetchClassOverview();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update student fee', { id: toastId });
    } finally {
      setSavingFee(false);
    }
  };

  const [tuitionPayInput, setTuitionPayInput] = useState('0');
  const [transportPayInput, setTransportPayInput] = useState('0');
  const [otherPayInputs, setOtherPayInputs] = useState({});
  const [carriedPayInput, setCarriedPayInput] = useState('0');
  const [carryForwardChecked, setCarryForwardChecked] = useState(false);

  const totalOtherPaymentSum = Object.values(otherPayInputs).reduce((sum, val) => sum + (Number(val) || 0), 0);
  const totalPaymentSum = (Number(tuitionPayInput) || 0) + (Number(transportPayInput) || 0) + totalOtherPaymentSum + (carryForwardChecked ? (Number(carriedPayInput) || 0) : 0);

  const computeCategoryBreakdownInputsClass = (stItem, isCarryChecked) => {
    if (!stItem) return { tuition: '0', transport: '0', other: '0', carried: '0', otherFeesBreakdown: [] };
    const st = stItem.student || {};

    const transportVal = (stItem.transportFee !== undefined && stItem.transportFee !== null && stItem.transportFee > 0)
      ? stItem.transportFee
      : ((st.usesTransport && st.transportFee > 0) ? st.transportFee : 0);

    const otherVal = stItem.otherFee || 0;
    const carriedVal = stItem.carriedForwardFrom?.amount || 0;

    const baseDueNoCarried = Math.max(0, (stItem.amountDue || 0) - (stItem.carriedForwardFrom?.amount || 0));
    const tuitionVal = (stItem.tuitionFee !== undefined && stItem.tuitionFee !== null && stItem.tuitionFee > 0)
      ? stItem.tuitionFee
      : Math.max(0, baseDueNoCarried - transportVal - otherVal);

    let paidTuition = 0;
    let paidTransport = 0;
    let paidOther = 0;
    let paidCarried = 0;

    if (stItem.payments && stItem.payments.length > 0) {
      stItem.payments.forEach(p => {
        paidTuition += p.tuitionPaid || 0;
        paidTransport += p.transportPaid || 0;
        paidOther += p.otherPaid || 0;
        paidCarried += p.carriedPaid || 0;
      });
    }

    const totalCategoryPaid = paidTuition + paidTransport + paidOther + paidCarried;
    const paid = stItem.amountPaid || 0;

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

    let otherFeesBreakdown = [];
    if (stItem.otherFees && stItem.otherFees.length > 0) {
      stItem.otherFees.forEach(fee => {
        otherFeesBreakdown.push({
          category: fee.category,
          due: Math.max(0, fee.amount - (fee.paid || 0))
        });
      });
    } else if (otherVal > 0) {
      otherFeesBreakdown.push({
        category: stItem.otherFeeType || 'Other Fee',
        due: dueOther
      });
    }

    return {
      tuition: dueTuition.toString(),
      transport: dueTransport.toString(),
      other: dueOther.toString(),
      carried: dueCarried.toString(),
      otherFeesBreakdown
    };
  };

  const handleOpenPaymentModal = (stItem) => {
    if (!data?.isConfigured) {
      toast.error(`Fee for Class ${selectedClass} (${selectedMonth} ${selectedYear}) has not been set by admin yet.`);
      return;
    }
    setActiveStudent(stItem);
    setCarryForwardChecked(false);

    const inputs = computeCategoryBreakdownInputsClass(stItem, false);
    setTuitionPayInput(inputs.tuition);
    setTransportPayInput(inputs.transport);
    
    const newOtherInputs = {};
    inputs.otherFeesBreakdown.forEach(of => {
      newOtherInputs[of.category] = of.due.toString();
    });
    setOtherPayInputs(newOtherInputs);

    setCarriedPayInput(inputs.carried);

    setPaymentMode('Cash');
    setRemark('');
    setPaymentModalOpen(true);
  };

  const handleCollectSubmit = async (e) => {
    e.preventDefault();
    if (!activeStudent || totalPaymentSum <= 0) {
      toast.error('Please enter a valid non-zero payment amount across fee categories');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Recording ₹${totalPaymentSum} payment...`);

    try {
      const res = await feeService.collectMonthlyFeePayment({
        studentId: activeStudent.student._id,
        month: selectedMonth,
        year: selectedYear,
        amount: totalPaymentSum,
        tuitionPaid: Number(tuitionPayInput) || 0,
        transportPaid: Number(transportPayInput) || 0,
        otherPaid: totalOtherPaymentSum,
        otherFeesPaid: Object.keys(otherPayInputs).map(category => ({
          category,
          paid: Number(otherPayInputs[category]) || 0
        })),
        carriedPaid: Number(carriedPayInput) || 0,
        paymentMode,
        remark: remark.trim() || `Monthly Fee for ${selectedMonth}`,
        carryForwardPreviousDue: carryForwardChecked
      });

      toast.success('Payment recorded successfully!', { id: toastId });

      const priorPaid = activeStudent.amountPaid || 0;
      const openingDues = Math.max(0, activeStudent.amountDue - priorPaid);
      const remainingBalance = Math.max(0, openingDues - totalPaymentSum);

      setSuccessReceiptData(res?.payment ? { ...res.payment, student: activeStudent.student } : {
        student: activeStudent.student,
        receiptNo: res?.data?.payments?.slice(-1)[0]?.receiptNo || `REC-${Date.now().toString().slice(-6)}`,
        receiptDate: new Date(),
        totalDues: openingDues,
        totalReceived: totalPaymentSum,
        totalBalance: remainingBalance,
        amountPaid: totalPaymentSum,
        paymentMode,
        date: new Date(),
        month: selectedMonth,
        year: selectedYear,
        academicYear: `${selectedYear}-${Number(selectedYear) + 1}`,
        amountDue: openingDues,
        remainingBalance,
        remark: remark.trim(),
        feeItems: res?.payment?.feeItems || []
      });

      setPaymentModalOpen(false);
      setSuccessModalOpen(true);
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

                  {st.usesTransport && (
                    <div className="mb-2 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                      🚌 Transport Fee: ₹{st.transportFee || 0} {st.transportRoute ? `(${st.transportRoute})` : ''}
                    </div>
                  )}

                  {item.carriedForwardFrom?.amount > 0 && (
                    <div className="mb-2 text-[10px] font-bold text-purple-950 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                      📌 Carry Forward: +₹{item.carriedForwardFrom.amount} (from {item.carriedForwardFrom.month})
                    </div>
                  )}
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
            <div className="bg-navy-50 p-3.5 rounded-lg border border-navy-100 text-xs space-y-1.5">
              <div className="flex justify-between text-navy-900 font-semibold border-b border-navy-100 pb-1">
                <span>Class & Student:</span>
                <span>{activeStudent.student.firstName} {activeStudent.student.lastName} ({selectedClass})</span>
              </div>
              {(() => {
                const transVal = (activeStudent.transportFee !== undefined && activeStudent.transportFee !== null && activeStudent.transportFee > 0)
                  ? activeStudent.transportFee
                  : ((activeStudent.student.usesTransport && activeStudent.student.transportFee > 0) ? activeStudent.student.transportFee : 0);
                const otherVal = activeStudent.otherFee || 0;
                const tuitVal = (activeStudent.tuitionFee !== undefined && activeStudent.tuitionFee !== null && activeStudent.tuitionFee > 0)
                  ? activeStudent.tuitionFee
                  : Math.max(0, activeStudent.amountDue - transVal - otherVal);

                return (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Tuition / Class Fee:</span>
                      <span>₹{tuitVal}</span>
                    </div>
                    {(transVal > 0 || activeStudent.student.usesTransport) && (
                      <div className="flex justify-between text-amber-900 font-medium">
                        <span>Transport Fee {activeStudent.student.transportRoute ? `(${activeStudent.student.transportRoute})` : ''}:</span>
                        <span>₹{transVal}</span>
                      </div>
                    )}
                    {activeStudent.otherFees && activeStudent.otherFees.length > 0 ? (
                      activeStudent.otherFees.map((fee, idx) => (
                        <div key={idx} className="flex justify-between text-blue-900 font-medium">
                          <span>{fee.category}:</span>
                          <span>₹{fee.amount}</span>
                        </div>
                      ))
                    ) : (
                      otherVal > 0 && (
                        <div className="flex justify-between text-blue-900 font-medium">
                          <span>{activeStudent.otherFeeType || 'Other Fee'}:</span>
                          <span>₹{otherVal}</span>
                        </div>
                      )
                    )}
                  </>
                );
              })()}
              <div className="flex justify-between text-navy-900 font-bold border-t border-navy-200 pt-1">
                <span>Total Month Dues:</span>
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

            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2">
              <input
                type="checkbox"
                id="carryForwardCheckClass"
                checked={carryForwardChecked}
                onChange={(e) => setCarryForwardChecked(e.target.checked)}
                className="h-4 w-4 text-navy-900 rounded border-gray-300 focus:ring-navy-900"
              />
              <label htmlFor="carryForwardCheckClass" className="text-xs font-bold text-amber-950 cursor-pointer">
                Include previous unpaid dues from prior month into {selectedMonth}
              </label>
            </div>

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

                {(activeStudent.transportFee > 0 || activeStudent.student.usesTransport) && (
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

                {Object.keys(otherPayInputs).map((category) => (
                  <div key={category}>
                    <label className="block text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">
                      {category} Payment (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={otherPayInputs[category]}
                      onChange={(e) => {
                        setOtherPayInputs({
                          ...otherPayInputs,
                          [category]: e.target.value
                        });
                      }}
                      className="w-full rounded-lg border border-blue-300 bg-blue-50/40 px-3 py-2 text-xs font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                ))}

                {(carryForwardChecked || (activeStudent?.carriedForwardFrom?.amount > 0)) && (
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
                placeholder="e.g. Received via GPay ref #12345"
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

              <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                <div className="flex justify-between items-center mb-1">
                  <span className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider">
                    Other Fee Categories
                  </span>
                  <button
                    type="button"
                    onClick={() => setOtherFeesInput([...otherFeesInput, { category: 'Exam Fee', amount: '0' }])}
                    className="text-[10px] font-bold text-navy-900 hover:underline flex items-center gap-1"
                  >
                    + Add Category
                  </button>
                </div>
                {otherFeesInput.map((fee, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <select
                        value={fee.category}
                        onChange={(e) => {
                          const newList = [...otherFeesInput];
                          newList[idx].category = e.target.value;
                          setOtherFeesInput(newList);
                        }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 bg-white"
                      >
                        {['Exam Fee', 'Admission Fee', 'Annual Fee', 'Activity Fee', 'Computer / Lab Fee', 'Late Fee', 'Miscellaneous'].map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-1/3">
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={fee.amount}
                        onChange={(e) => {
                          const newList = [...otherFeesInput];
                          newList[idx].amount = e.target.value;
                          setOtherFeesInput(newList);
                        }}
                        placeholder="Amount"
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 bg-white"
                      />
                    </div>
                    {otherFeesInput.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setOtherFeesInput(otherFeesInput.filter((_, i) => i !== idx));
                        }}
                        className="text-red-500 hover:text-red-700 text-xs font-bold p-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-navy-900 text-white p-3 rounded-lg flex items-center justify-between font-bold text-xs mt-2">
                <span>Calculated Total Month Fee:</span>
                <span className="text-sm font-extrabold text-amber-300">
                  ₹{(Number(tuitionFeeInput) || 0) + (Number(transportFeeInput) || 0) + otherFeesInput.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)}
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

export default ClassFeeOverview;
