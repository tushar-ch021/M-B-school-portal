import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Save, ShieldAlert, CheckCircle2 } from 'lucide-react';
import feeService from '../../services/feeService';
import toast from 'react-hot-toast';

const MONTHS = [
  { name: 'April', index: 1 },
  { name: 'May', index: 2 },
  { name: 'June', index: 3 },
  { name: 'July', index: 4 },
  { name: 'August', index: 5 },
  { name: 'September', index: 6 },
  { name: 'October', index: 7 },
  { name: 'November', index: 8 },
  { name: 'December', index: 9 },
  { name: 'January', index: 10 },
  { name: 'February', index: 11 },
  { name: 'March', index: 12 }
];

const CLASSES = ['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const MonthlyFeeConfig = ({ selectedClass, onClassChange, selectedMonth, onMonthChange, selectedYear, onYearChange, onConfigSaved }) => {
  const [amountDue, setAmountDue] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);

  const selectedMonthObj = MONTHS.find(m => m.name === selectedMonth) || MONTHS[0];

  // Fetch current month fee config
  useEffect(() => {
    if (!selectedClass || !selectedMonth || !selectedYear) return;

    setLoading(true);
    feeService.getMonthlyFeeConfig({
      className: selectedClass,
      month: selectedMonth,
      year: selectedYear
    })
      .then((res) => {
        if (res?.isConfigured && res?.monthlyFee) {
          setCurrentConfig(res.monthlyFee);
          setAmountDue(res.monthlyFee.amountDue.toString());
        } else {
          setCurrentConfig(null);
          setAmountDue('');
        }
      })
      .catch(() => {
        setCurrentConfig(null);
        setAmountDue('');
      })
      .finally(() => setLoading(false));
  }, [selectedClass, selectedMonth, selectedYear]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (amountDue === '' || isNaN(amountDue) || Number(amountDue) < 0) {
      toast.error('Please enter a valid non-negative fee amount');
      return;
    }

    setSaving(true);
    const toastId = toast.loading(`Saving Class ${selectedClass} fee for ${selectedMonth} ${selectedYear}...`);

    try {
      const res = await feeService.setMonthlyFeeConfig({
        className: selectedClass,
        month: selectedMonth,
        monthIndex: selectedMonthObj.index,
        year: Number(selectedYear),
        academicYear: `${selectedYear}-${Number(selectedYear) + 1}`,
        amountDue: Number(amountDue)
      });

      toast.success(res.message || 'Monthly fee configured successfully!', { id: toastId });
      setCurrentConfig(res.data);
      if (onConfigSaved) onConfigSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to set monthly fee config', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-schoolGreen-700" />
            Class Monthly Fee Configuration
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Set or update monthly tuition dues for all students in the selected class.
          </p>
        </div>

        {currentConfig ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-schoolGreen-50 text-schoolGreen-800 border border-schoolGreen-200 text-xs font-bold rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Configured: ₹{currentConfig.amountDue} / month
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 border border-gray-300 text-xs font-bold rounded-full">
            <ShieldAlert className="h-3.5 w-3.5" />
            Fee Not Set Yet
          </span>
        )}
      </div>

      <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Class
          </label>
          <select
            value={selectedClass}
            onChange={(e) => onClassChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          >
            {CLASSES.map((c) => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Month
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          >
            {MONTHS.map((m) => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Year
          </label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Fee Amount (₹) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={amountDue}
            onChange={(e) => setAmountDue(e.target.value)}
            placeholder="e.g. 1500"
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Set Class Month Fee'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MonthlyFeeConfig;
