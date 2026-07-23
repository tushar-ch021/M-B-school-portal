import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import feeService from '../../services/feeService';
import { IndianRupee, Save, Calculator, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const UpdateDuesModal = ({ student, isOpen, onClose, onSuccess }) => {
  const [tuitionFee, setTuitionFee] = useState(0);
  const [transportFee, setTransportFee] = useState(0);
  const [feeSummary, setFeeSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!student?._id || !isOpen) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const summary = await feeService.getStudentFeeSummary(student._id);
        setFeeSummary(summary);
        setTuitionFee(summary.tuitionFee ?? 0);
        setTransportFee(summary.transportFee ?? 0);
      } catch (err) {
        toast.error('Failed to load student current fee structure');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [student, isOpen]);

  if (!student) return null;

  const currentTuition = Number(tuitionFee) || 0;
  const currentTransport = student.usesTransport ? (Number(transportFee) || 0) : 0;
  const newTotalFee = currentTuition + currentTransport;
  const totalPaid = feeSummary?.totalPaid || 0;
  const newRemainingBalance = newTotalFee - totalPaid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newTotalFee < 0) {
      toast.error('Total fee cannot be negative');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading('Updating student assigned fee structure...');
    try {
      const result = await feeService.updateStudentDues(student._id, {
        tuitionFee: currentTuition,
        transportFee: currentTransport
      });
      toast.success('Student total fee updated successfully!', { id: toastId });
      if (onSuccess) {
        onSuccess(result.student || result);
      }
      onClose();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update student fee dues';
      toast.error(errMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Update Total Assigned Fee — ${student.firstName} ${student.lastName}`}
      size="md"
    >
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy-900 border-t-transparent" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Student Banner */}
          <div className="rounded-lg bg-navy-50 p-4 border border-navy-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-navy-900 uppercase">Student Directory</p>
              <h4 className="text-sm font-extrabold text-navy-950">
                {student.firstName} {student.lastName} ({student.serialNo})
              </h4>
              <p className="text-xs text-gray-500">
                Class {student.class} - Section {student.section}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Total Paid So Far</span>
              <span className="text-sm font-extrabold text-schoolGreen-800">₹{totalPaid.toFixed(2)}</span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-4 rounded-card border border-gray-200 bg-white p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-navy-900" />
              Adjust Fee Structure
            </h4>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Tuition Fee (₹) *
              </label>
              <input
                type="number"
                min="0"
                value={tuitionFee}
                onChange={(e) => setTuitionFee(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-extrabold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Primary annual tuition fee assigned to this student.
              </p>
            </div>

            {student.usesTransport && (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Transport Fee (₹) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={transportFee}
                  onChange={(e) => setTransportFee(e.target.value)}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-extrabold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Annual transport route fare assigned to this student.
                </p>
              </div>
            )}
          </div>

          {/* Live Balance Preview Calculation Box */}
          <div className="rounded-lg bg-gray-50 p-4 border border-gray-200 space-y-2">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-schoolGreen-800" />
              Real-time Balance Preview
            </h5>
            
            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>New Total Assigned Fee:</span>
              <span className="font-extrabold text-navy-900">₹{newTotalFee.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-xs font-semibold text-gray-600">
              <span>Total Historical Payments Received:</span>
              <span className="font-extrabold text-schoolGreen-800">− ₹{totalPaid.toFixed(2)}</span>
            </div>

            <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-extrabold">
              <span className="text-navy-900">Updated Remaining Dues:</span>
              <span className={newRemainingBalance > 0 ? "text-red-650 font-black" : "text-schoolGreen-800 font-black"}>
                ₹{newRemainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2 text-xs font-bold text-white shadow-premium hover:bg-navy-800 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {submitting ? 'Saving Fee Structure...' : 'Save & Update Dues'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default UpdateDuesModal;
