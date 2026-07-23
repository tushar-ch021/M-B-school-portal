import React, { useState, useEffect, useCallback } from 'react';
import { 
  getClassAttendanceByDate, 
  markStudentAttendanceBulk, 
  getStudentAttendanceHistory 
} from '../services/attendanceService';
import studentService from '../services/studentService';
import MonthWiseAttendance from '../components/attendance/MonthWiseAttendance';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import { 
  CalendarCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Save, 
  FileText, 
  Filter,
  BarChart3,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

const StudentAttendance = () => {
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'report' | 'monthly'

  // Mark Attendance State
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    percentage: 0
  });

  // Student Report State
  const [reportClass, setReportClass] = useState('10th');
  const [reportSection, setReportSection] = useState('A');
  const [studentsList, setStudentsList] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);

  // Fetch Class Attendance for marking
  const fetchClassAttendance = useCallback(async () => {
    if (!selectedClass || !selectedSection || !selectedDate) return;
    setLoading(true);
    try {
      const response = await getClassAttendanceByDate({
        class: selectedClass,
        section: selectedSection,
        date: selectedDate
      });
      if (response?.data) {
        setAttendanceData(response.data.records || []);
        setStats(response.data.stats || {
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          leaveCount: 0,
          percentage: 0
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch class attendance');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, selectedDate]);

  useEffect(() => {
    fetchClassAttendance();
  }, [fetchClassAttendance]);

  // Fetch student options filtered by Class & Section for reporting
  useEffect(() => {
    const fetchStudentsForReport = async () => {
      try {
        const response = await studentService.getStudents({ className: reportClass, section: reportSection, limit: 200 });
        const stList = response?.students || response?.data?.students || [];
        setStudentsList(stList);
        if (stList.length > 0) {
          setSelectedStudentId(stList[0]._id);
        } else {
          setSelectedStudentId('');
        }
      } catch (err) {
        console.warn('Failed to load students list for reports:', err);
      }
    };
    if (activeTab === 'report') {
      fetchStudentsForReport();
    }
  }, [activeTab, reportClass, reportSection]);

  // Fetch student history report
  const fetchStudentHistory = useCallback(async () => {
    if (!selectedStudentId) return;
    setHistoryLoading(true);
    try {
      const response = await getStudentAttendanceHistory(selectedStudentId, {
        startDate: reportStartDate,
        endDate: reportEndDate
      });
      if (response?.data) {
        setHistoryData(response.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to fetch student attendance history');
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedStudentId, reportStartDate, reportEndDate]);

  useEffect(() => {
    if (activeTab === 'report' && selectedStudentId) {
      fetchStudentHistory();
    }
  }, [activeTab, selectedStudentId, fetchStudentHistory]);

  // Handle individual status change
  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.student._id === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  // Handle individual remark change
  const handleRemarkChange = (studentId, remarkText) => {
    setAttendanceData((prev) =>
      prev.map((item) =>
        item.student._id === studentId ? { ...item, remark: remarkText } : item
      )
    );
  };

  // Quick bulk status assignment
  const handleBulkSetStatus = (targetStatus) => {
    setAttendanceData((prev) =>
      prev.map((item) => ({ ...item, status: targetStatus }))
    );
    toast.success(`Marked all students as ${targetStatus}`);
  };

  // Submit bulk attendance
  const handleSaveAttendance = async () => {
    if (attendanceData.length === 0) {
      toast.error('No students available to save attendance');
      return;
    }

    // Ensure all students have a valid status (default to Present if unmarked)
    const recordsPayload = attendanceData.map((item) => ({
      studentId: item.student._id,
      status: item.status === 'Unmarked' ? 'Present' : item.status,
      remark: item.remark || ''
    }));

    setSaving(true);
    const toastId = toast.loading('Saving attendance records...');
    try {
      await markStudentAttendanceBulk({
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
        records: recordsPayload
      });
      toast.success('Class attendance saved successfully!', { id: toastId });
      fetchClassAttendance();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save attendance', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-900 flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-schoolGreen-800" />
            Student Attendance Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Mark daily class-wise attendance, view month-wise registers, and generate reports.
          </p>
        </div>

        {/* View Switcher Tabs */}
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
            Mark Class Attendance
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
            Month-Wise Register
          </button>
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'report'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Student History
          </button>
        </div>
      </div>

      {/* TAB 3: MONTH-WISE REGISTER */}
      {activeTab === 'monthly' && (
        <MonthWiseAttendance initialType="student" fixedType="student" />
      )}

      {/* TAB 1: MARK CLASS ATTENDANCE */}
      {activeTab === 'mark' && (
        <div className="space-y-6">
          {/* Top Control Bar & Filters */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <ClassSectionFilter
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                selectedSection={selectedSection}
                onSectionChange={setSelectedSection}
                showAllOption={false}
              />

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Date:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
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

          {/* Quick Stats Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={UserCheck}
              color="navy"
            />
            <StatCard
              title="Present Today"
              value={stats.presentCount}
              icon={CheckCircle2}
              color="green"
            />
            <StatCard
              title="Absent Today"
              value={stats.absentCount}
              icon={XCircle}
              color="red"
            />
            <StatCard
              title="Class Present %"
              value={`${stats.percentage}%`}
              icon={BarChart3}
              color="gold"
            />
          </div>

          {/* Student Marking Table */}
          <div className="rounded-card border border-gray-200 bg-white shadow-flat overflow-hidden">
            <div className="p-4 bg-gray-50/70 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-navy-900 text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-navy-600" />
                Class {selectedClass} - Section {selectedSection} Roster ({selectedDate})
              </h3>
              <button
                onClick={handleSaveAttendance}
                disabled={saving || loading || attendanceData.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-navy-900 text-white rounded-lg text-xs font-bold shadow-premium hover:bg-navy-800 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner />
              </div>
            ) : attendanceData.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No active students found in Class {selectedClass} Section {selectedSection}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-100/70 text-gray-600 uppercase font-bold tracking-wider text-[11px] border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student</th>
                      <th className="py-3 px-4 text-center">Attendance Status</th>
                      <th className="py-3 px-4">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {attendanceData.map((item) => {
                      const { student, status, remark } = item;
                      return (
                        <tr key={student._id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-navy-950">
                            {student.rollNo || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={student.photo?.thumbnailUrl || student.photo?.url || '/default-avatar.png'}
                                alt={student.fullName}
                                className="h-8 w-8 rounded-full object-cover border border-gray-200"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/40?text=ST';
                                }}
                              />
                              <div>
                                <p className="font-bold text-gray-900">{student.fullName}</p>
                                <p className="text-[10px] text-gray-400">SR: {student.serialNo}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {/* Present Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Present')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  status === 'Present'
                                    ? 'bg-schoolGreen-800 text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-schoolGreen-50 hover:text-schoolGreen-800'
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Present
                              </button>

                              {/* Absent Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Absent')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                                  status === 'Absent'
                                    ? 'bg-red-600 text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Absent
                              </button>

                              {/* Leave Toggle Button */}
                              <button
                                type="button"
                                onClick={() => handleStatusChange(student._id, 'Leave')}
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
                              onChange={(e) => handleRemarkChange(student._id, e.target.value)}
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
        </div>
      )}

      {/* TAB 2: STUDENT HISTORY & REPORTS */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          {/* Report Filters */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <ClassSectionFilter
                selectedClass={reportClass}
                onClassChange={setReportClass}
                selectedSection={reportSection}
                onSectionChange={setReportSection}
                showAllOption={false}
              />

              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Student:
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {studentsList.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName} {st.lastName} (Roll: {st.rollNo || '-'}, SR: {st.serialNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  From:
                </label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  To:
                </label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>

            <button
              onClick={fetchStudentHistory}
              className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold shadow-flat hover:bg-navy-800 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Apply Filter
            </button>
          </div>

          {historyLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : historyData ? (
            <div className="space-y-6">
              {/* Student Overview Header Card */}
              <div className="rounded-card border border-navy-100 bg-navy-50/40 p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <img
                    src={historyData.student.photo?.url || '/default-avatar.png'}
                    alt={historyData.student.firstName}
                    className="h-14 w-14 rounded-full object-cover border-2 border-navy-900 shadow-xs"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/60?text=ST';
                    }}
                  />
                  <div>
                    <h3 className="text-lg font-black text-navy-900">
                      {historyData.student.firstName} {historyData.student.lastName}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">
                      Class: <span className="font-bold text-navy-900">{historyData.student.class} - {historyData.student.section}</span> | Roll No: <span className="font-bold text-navy-900">{historyData.student.rollNo}</span> | SR: {historyData.student.serialNo}
                    </p>
                  </div>
                </div>

                {/* Overall Attendance Progress Bar */}
                <div className="w-full md:w-64 bg-white p-4 rounded-lg border border-gray-200 shadow-xs space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-600">Attendance Percentage</span>
                    <span className="text-schoolGreen-800 text-sm">{historyData.stats.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        historyData.stats.percentage >= 75
                          ? 'bg-schoolGreen-800'
                          : historyData.stats.percentage >= 50
                          ? 'bg-amber-500'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, historyData.stats.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Attendance Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard title="Total Marked Days" value={historyData.stats.totalDays} icon={CalendarCheck} color="navy" />
                <StatCard title="Present Days" value={historyData.stats.presentCount} icon={CheckCircle2} color="green" />
                <StatCard title="Absent Days" value={historyData.stats.absentCount} icon={XCircle} color="red" />
                <StatCard title="Leave Days" value={historyData.stats.leaveCount} icon={Clock} color="gold" />
              </div>

              {/* Attendance History Table */}
              <div className="rounded-card border border-gray-200 bg-white shadow-flat overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-navy-900 text-sm">
                  Attendance Logs ({historyData.history.length} records)
                </div>
                {historyData.history.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-xs">
                    No attendance logs recorded for this student in the selected date range.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs text-gray-700">
                    <thead className="bg-gray-100 text-gray-600 uppercase font-bold tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {historyData.history.map((rec) => (
                        <tr key={rec._id} className="hover:bg-gray-50/70">
                          <td className="py-3 px-4 font-semibold text-gray-900">
                            {new Date(rec.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                rec.status === 'Present'
                                  ? 'bg-schoolGreen-100 text-schoolGreen-800'
                                  : rec.status === 'Absent'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {rec.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500">{rec.remark || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 text-sm">
              Select a student to view their attendance history.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAttendance;
