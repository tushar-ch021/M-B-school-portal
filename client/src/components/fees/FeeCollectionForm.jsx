import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { feeCollectionSchema } from '../../utils/validators';
import { Plus, Trash2, Receipt, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import feeService from '../../services/feeService';

const FeeCollectionForm = ({ student, onSubmit, isSubmitting = false }) => {
  const [paymentModeState, setPaymentModeState] = useState('Cash');

  // React state for dynamic fee items list
  const [feeItems, setFeeItems] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(feeCollectionSchema),
    defaultValues: {
      academicYear: student?.academicYear || '',
      paymentMode: 'Cash',
      payableAt: '',
      remark: '',
      bankDetails: { bank: '', chequeNo: '', chequeDate: '' }
    }
  });

  const watchedPaymentMode = watch('paymentMode');

  // Trigger when payment mode switches to hide/show bank forms
  useEffect(() => {
    setPaymentModeState(watchedPaymentMode);
  }, [watchedPaymentMode]);

  const [feeSummary, setFeeSummary] = useState(null);

  // Load student fee summary and dynamically compute remaining dues (Single Source of Truth)
  useEffect(() => {
    const loadDuesSummary = async () => {
      if (!student?._id) return;
      
      try {
        const summary = await feeService.getStudentFeeSummary(student._id);
        setFeeSummary(summary);
        
        const remainingTuition = summary.remainingTuition;
        const remainingTransport = summary.remainingTransport;
        
        const items = [
          { 
            particular: 'Tuition Fee', 
            dueDate: new Date().toISOString().split('T')[0], 
            dues: remainingTuition, 
            received: 0 
          }
        ];
        
        if (summary.usesTransport) {
          items.push({ 
            particular: 'Transport Fee', 
            dueDate: new Date().toISOString().split('T')[0], 
            dues: remainingTransport, 
            received: 0 
          });
        }
        
        setFeeItems(items);
      } catch (err) {
        console.error('Failed to load student fee summary:', err);
        const fallback = [
          { particular: 'Tuition Fee', dueDate: new Date().toISOString().split('T')[0], dues: 0, received: 0 }
        ];
        if (student.usesTransport) {
          fallback.push({ particular: 'Transport Fee', dueDate: new Date().toISOString().split('T')[0], dues: 0, received: 0 });
        }
        setFeeItems(fallback);
      }
    };
    
    loadDuesSummary();
  }, [student]);

  const handleItemChange = (index, field, value) => {
    const updated = [...feeItems];
    if (field === 'dues' || field === 'received') {
      updated[index][field] = Number(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setFeeItems(updated);
  };

  const addCustomItem = () => {
    setFeeItems([
      ...feeItems,
      { particular: 'Exam Fee', dueDate: new Date().toISOString().split('T')[0], dues: 0, received: 0 }
    ]);
  };

  const removeFeeItem = (index) => {
    // Avoid removing Tuition Fee (should be mandatory baseline)
    if (feeItems[index].particular === 'Tuition Fee') {
      toast.error('Tuition Fee particulars cannot be removed from invoicing');
      return;
    }
    setFeeItems(feeItems.filter((_, idx) => idx !== index));
  };

  // Compute overall aggregates
  const calculateTotals = () => {
    let duesTotal = 0;
    let receivedTotal = 0;
    let balanceTotal = 0;

    feeItems.forEach((item) => {
      duesTotal += item.dues;
      receivedTotal += item.received;
      balanceTotal += (item.dues - item.received);
    });

    return { duesTotal, receivedTotal, balanceTotal };
  };

  const { duesTotal, receivedTotal, balanceTotal } = calculateTotals();

  const handleFormSubmit = (data) => {
    // Verify fee items have values
    if (feeItems.length === 0) {
      toast.error('Please specify at least one billing item');
      return;
    }

    const payload = {
      studentId: student._id,
      academicYear: data.academicYear,
      paymentMode: data.paymentMode,
      payableAt: data.payableAt,
      remark: data.remark,
      feeItems: feeItems.map(item => ({
        particular: item.particular,
        dueDate: new Date(item.dueDate),
        dues: item.dues,
        received: item.received
      }))
    };

    if (data.paymentMode === 'Cheque' || data.paymentMode === 'DD') {
      payload.bankDetails = {
        bank: data.bankDetails.bank,
        chequeNo: data.bankDetails.chequeNo,
        chequeDate: new Date(data.bankDetails.chequeDate)
      };
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 no-print">
      {/* 1. Header Metadata summary */}
      <div className="rounded-lg bg-navy-50 p-4 border border-navy-100 flex flex-wrap justify-between items-center gap-4">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase">Student Invoice Target</p>
          <h4 className="text-base font-extrabold text-navy-900">
            {student?.firstName} {student?.lastName} ({student?.serialNo})
          </h4>
          <p className="text-xs text-gray-500 font-medium">
            Class {student?.class} - Section {student?.section} | Roll No: {student?.rollNo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center shadow-xs">
            <span className="block text-[9px] text-gray-400 font-bold uppercase">Current Total Fee</span>
            <span className="text-sm font-black text-navy-900">₹{(feeSummary?.currentTotalFee ?? student?.totalFee ?? 0).toFixed(2)}</span>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center shadow-xs">
            <span className="block text-[9px] text-gray-400 font-bold uppercase">Total Paid</span>
            <span className="text-sm font-black text-schoolGreen-800">₹{(feeSummary?.totalPaid || 0).toFixed(2)}</span>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-center shadow-xs">
            <span className="block text-[9px] text-gray-400 font-bold uppercase">Remaining Dues</span>
            <span className="text-sm font-black text-red-650" style={{ color: '#c62828' }}>
              ₹{(feeSummary?.remainingBalance !== undefined ? feeSummary.remainingBalance : (student?.totalFee ?? 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Fee items rows grid */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
            Fee Particulars Breakdown
          </h3>
          
          <button
            type="button"
            onClick={addCustomItem}
            className="flex items-center gap-1.5 rounded-lg border border-navy-900 bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-navy-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Fee Item
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                <th className="py-2 pl-2">Particular</th>
                <th className="py-2">Due Date</th>
                <th className="py-2 text-right pr-4 w-32">Dues (₹)</th>
                <th className="py-2 text-right pr-4 w-32">Received (₹)</th>
                <th className="py-2 text-right pr-4 w-28">Balance (₹)</th>
                <th className="py-2 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {feeItems.map((item, index) => (
                <tr key={index}>
                  {/* Particular name input */}
                  <td className="py-2.5 pl-2 pr-4">
                    <input
                      type="text"
                      value={item.particular}
                      disabled={item.particular === 'Tuition Fee' || item.particular === 'Transport Fee'}
                      onChange={(e) => handleItemChange(index, 'particular', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white disabled:bg-gray-50"
                    />
                  </td>
                  
                  {/* Due Date */}
                  <td className="py-2.5 pr-4">
                    <input
                      type="date"
                      value={item.dueDate}
                      onChange={(e) => handleItemChange(index, 'dueDate', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-sm bg-white"
                    />
                  </td>

                  {/* Dues */}
                  <td className="py-2.5 pr-4">
                    <input
                      type="number"
                      value={item.dues}
                      onChange={(e) => handleItemChange(index, 'dues', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-right font-bold"
                    />
                  </td>

                  {/* Received */}
                  <td className="py-2.5 pr-4">
                    <input
                      type="number"
                      value={item.received}
                      onChange={(e) => handleItemChange(index, 'received', e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-sm text-right font-bold text-schoolGreen-700"
                    />
                  </td>

                  {/* Balance */}
                  <td className="py-2.5 pr-4 text-right font-bold text-red-650" style={{ color: '#c62828' }}>
                    {(item.dues - item.received).toFixed(2)}
                  </td>

                  {/* Delete row */}
                  <td className="py-2.5 text-center">
                    <button
                      type="button"
                      disabled={item.particular === 'Tuition Fee'}
                      onClick={() => removeFeeItem(index)}
                      className="rounded-md p-1 text-red-500 hover:bg-red-50 disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Summary Bottom Totals */}
              <tr className="bg-gray-50 border-t border-gray-200 font-extrabold text-navy-900">
                <td colSpan={2} className="py-3 pl-4 text-right">Totals:</td>
                <td className="py-3 text-right pr-4">₹{duesTotal.toFixed(2)}</td>
                <td className="py-3 text-right pr-4 text-schoolGreen-800">₹{receivedTotal.toFixed(2)}</td>
                <td className="py-3 text-right pr-4 text-red-650" style={{ color: '#c62828' }}>₹{balanceTotal.toFixed(2)}</td>
                <td className="py-3"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Payment Mode form */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-navy-900 border-b border-gray-100 pb-1.5 uppercase tracking-wider">
            Payment Mode Settings
          </h3>
          
          <div className="grid grid-cols-3 gap-2">
            {['Cash', 'Cheque', 'DD', 'Online', 'UPI'].map((mode) => (
              <label 
                key={mode}
                className={`flex flex-col items-center justify-center border rounded-lg p-2.5 cursor-pointer text-xs font-bold transition-all ${
                  paymentModeState === mode 
                    ? 'border-navy-900 bg-navy-50 text-navy-900 shadow-xs' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                }`}
              >
                <input
                  type="radio"
                  value={mode}
                  {...register('paymentMode')}
                  className="hidden"
                />
                {mode}
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700">Remarks / Notes</label>
            <textarea
              {...register('remark')}
              rows={2}
              placeholder="e.g. Collected tuition installment 1"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            />
          </div>
        </div>

        {/* Bank details conditional block */}
        <div className="space-y-4">
          {(paymentModeState === 'Cheque' || paymentModeState === 'DD') ? (
            <>
              <h3 className="text-xs font-bold text-navy-900 border-b border-gray-100 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-navy-900" />
                Bank Specifications
              </h3>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700">Bank Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    {...register('bankDetails.bank')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                  {errors.bankDetails?.bank && <span className="text-xs text-red-500">{errors.bankDetails.bank.message}</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Cheque/DD Number *</label>
                    <input
                      type="text"
                      placeholder="6-digit number"
                      {...register('bankDetails.chequeNo')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">Cheque Date *</label>
                    <input
                      type="date"
                      {...register('bankDetails.chequeDate')}
                      className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    />
                  </div>
                </div>
                {errors.bankDetails && !errors.bankDetails.bank && (
                  <span className="text-xs text-red-500">Please fill all cheque details</span>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700">Payable At Branch</label>
                  <input
                    type="text"
                    placeholder="e.g. Bulandshahr Main"
                    {...register('payableAt')}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400 p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
              <Receipt className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-xs font-medium">
                Direct instant settlement configured. No bank specifications required for {paymentModeState} payments.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Action triggers */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-schoolGreen-800 px-6 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-schoolGreen-700 disabled:opacity-50"
        >
          <Receipt className="h-4.5 w-4.5" />
          {isSubmitting ? 'Recording Payment...' : `Record Payment of ₹${receivedTotal.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};

export default FeeCollectionForm;
