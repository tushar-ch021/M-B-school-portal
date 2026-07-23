import React, { useState, useEffect, useCallback } from 'react';
import { getStaffAttendanceByDate, markStaffAttendanceBulk, addStaffMember } from '../services/attendanceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import Modal from '../components/common/Modal';
import MonthWiseAttendance from '../components/attendance/MonthWiseAttendance';
import { UserCheck, CheckCircle2, XCircle, Clock, Save, FileText, BarChart3, UserPlus, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const StaffAttendance = () => {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalStaff: 0,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    percentage: 0
  });

  // Add Staff Modal State
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState('Teacher');
  const [staffClass, setStaffClass] = useState('');
  const [staffSection, setStaffSection] = useState('');
  const [submittingStaff, setSubmittingStaff] = useState(false);

  const fetchStaffAttendance = useCallback(async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const response = await getStaffAttendanceByDate({ date: selectedDate });
      if (response?.data) {
        setAttendanceData(response.data.records || []);
        setStats(response.data.stats || {
          totalStaff: 0,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          percentage: 0
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch staff attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchStaffAttendance();
  }, [fetchStaffAttendance]);

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffName.trim()) {
      toast.error('Please provide staff member name');
      return;
    }

    setSubmittingStaff(true);
    const toastId = toast.loading('Adding new staff member...');

    try {
      await addStaffMember({
        name: staffName.trim(),
        email: staffEmail.trim(),
        phone: staffPhone.trim(),
        role: staffRole,
        assignedClass: staffClass,
        assignedSection: staffSection
      });

      toast.success(`Staff member ${staffName} added successfully!`, { id: toastId });
      setAddStaffOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPhone('');
      setStaffRole('Teacher');
      setStaffClass('');
      setStaffSection('');
      fetchStaffAttendance();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to add staff member', { id: toastId });
    } finally {
      setSubmittingStaff(false);
    }
  };

  const handleStatusChange = (staffId, newStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.staff._id === staffId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleRemarkChange = (staffId, remarkText) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.staff._id === staffId ? { ...item, remark: remarkText } : item
      )
    );
  };

  const handleBulkSetStatus = (targetStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) => ({ ...item, status: targetStatus }))
    );
    toast.success(`Marked all staff as ${targetStatus}`);
  };

  const handleSaveAttendance = async () => {
    if (attendanceData.length === 0) {
      toast.error('No staff records available to save attendance');
      return;
    }

    const recordsPayload = attendanceData.map((item) => ({
      staffId: item.staff._id,
      status: item.status === 'Unmarked' ? 'Present' : item.status,
      remark: item.remark || ''
    }));

    setSaving(true);
    const toastId = toast.loading('Saving staff attendance records...');
    try {
      await markStaffAttendanceBulk({
        date: selectedDate,
        records: recordsPayload
      });
      toast.success('Staff attendance saved successfully!', { id: toastId });
      fetchStaffAttendance();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save staff attendance', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-900 flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-schoolGreen-800" />
            Staff Attendance Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track daily attendance for teachers, administrative staff, and school personnel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
            <button
              onClick={() => setActiveTab('mark')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'mark'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              Mark Daily Staff Attendance
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all ${
                activeTab === 'monthly'
                  ? 'bg-navy-900 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Month-Wise Staff Register
            </button>
          </div>

          <button
            onClick={() => setAddStaffOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-navy-800 transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {activeTab === 'monthly' && (
        <MonthWiseAttendance initialType="staff" fixedType="staff" />
      )}

      {activeTab === 'mark' && (
        <>
          {/* Control Bar */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Attendance Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkSetStatus('Present')}
                className="px-3 py-2 bg-schoolGreen-50 text-schoolGreen-800 border border-schoolGreen-200 rounded-lg text-xs font-bold hover:bg-schoolGreen-100 transition-colors"
              >
                Mark All Present
              </button>
              <button
                onClick={() => handleBulkSetStatus('Absent')}
                className="px-3 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
              >
                Mark All Absent
              </button>
            </div>
          </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Staff" value={stats.totalStaff} icon={UserCheck} color="navy" />
        <StatCard title="Present Staff" value={stats.presentCount} icon={CheckCircle2} color="green" />
        <StatCard title="Absent Staff" value={stats.absentCount} icon={XCircle} color="red" />
        <StatCard title="Staff Present %" value={`${stats.percentage}%`} icon={BarChart3} color="gold" />
      </div>

      {/* Staff Marking Table */}
      <div className="rounded-card border border-gray-200 bg-white shadow-flat overflow-hidden">
        <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-navy-600" />
            Staff Roster ({selectedDate})
          </h3>
          <button
            onClick={handleSaveAttendance}
            disabled={saving || loading || attendanceData.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-xs font-bold shadow-premium hover:bg-navy-800 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Staff Attendance'}
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : attendanceData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            No staff records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-100/70 text-gray-600 uppercase font-bold tracking-wider text-[11px] border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {attendanceData.map((item) => {
                  const { staff, status, remark } = item;
                  return (
                    <tr key={staff._id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-gray-900">
                        {staff.name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {staff.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff._id, 'Present')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                              status === 'Present'
                                ? 'bg-schoolGreen-800 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-schoolGreen-50 hover:text-schoolGreen-800'
                            }`}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff._id, 'Absent')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                              status === 'Absent'
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                            }`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(staff._id, 'Leave')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                              status === 'Leave'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                            }`}
                          >
                            <Clock className="h-3.5 w-3.5" />
                            Leave
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={remark || ''}
                          onChange={(e) => handleRemarkChange(staff._id, e.target.value)}
                          placeholder="Optional note..."
                          className="w-full max-w-xs rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </>
      )}

      {/* Add Staff Member Modal */}
      <Modal
        isOpen={addStaffOpen}
        onClose={() => setAddStaffOpen(false)}
        title="Add New Staff Member"
        size="md"
      >
        <form onSubmit={handleAddStaffSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Email Address <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <input
              type="email"
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="e.g. ramesh@mbps.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Role / Designation
            </label>
            <select
              value={staffRole}
              onChange={(e) => setStaffRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            >
              {['Teacher', 'Headmaster', 'Accountant', 'Librarian', 'Sports Coach', 'Admin Assistant', 'Support Staff'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Assigned Class <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select
                value={staffClass}
                onChange={(e) => setStaffClass(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                <option value="">None / N/A</option>
                {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Assigned Section <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <select
                value={staffSection}
                onChange={(e) => setStaffSection(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                <option value="">None / N/A</option>
                {['A', 'B', 'C', 'D'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAddStaffOpen(false)}
              disabled={submittingStaff}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingStaff}
              className="flex-1 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 disabled:opacity-50"
            >
              {submittingStaff ? 'Adding...' : 'Add Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffAttendance;
