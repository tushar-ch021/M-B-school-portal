import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getMonthWiseAttendance } from '../../services/attendanceService';
import studentService from '../../services/studentService';
import API from '../../services/api';
import ClassSectionFilter from '../common/ClassSectionFilter';
import LoadingSpinner from '../common/LoadingSpinner';
import StatCard from '../common/StatCard';
import { 
  Calendar, 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Printer, 
  Search,
  CalendarDays,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTH_OPTIONS = [
  { value: 4, name: 'April' },
  { value: 5, name: 'May' },
  { value: 6, name: 'June' },
  { value: 7, name: 'July' },
  { value: 8, name: 'August' },
  { value: 9, name: 'September' },
  { value: 10, name: 'October' },
  { value: 11, name: 'November' },
  { value: 12, name: 'December' },
  { value: 1, name: 'January' },
  { value: 2, name: 'February' },
  { value: 3, name: 'March' }
];

const MonthWiseAttendance = ({ initialType = 'student', initialId = '', fixedType = null }) => {
  const [type, setType] = useState(fixedType || initialType); // 'student' | 'staff'
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (fixedType) {
      setType(fixedType);
    }
  }, [fixedType]);

  // Entity lists
  const [students, setStudents] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedEntityId, setSelectedEntityId] = useState(initialId);

  // Attendance data
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);

  const printRef = useRef(null);

  // Fetch Students for selected Class & Section
  const fetchStudents = useCallback(async () => {
    if (type !== 'student') return;
    try {
      const res = await studentService.getStudents({ className: selectedClass, section: selectedSection, limit: 200 });
      const studentArr = res?.students || res?.data?.students || [];
      setStudents(studentArr);
      if (studentArr.length > 0) {
        setSelectedEntityId(studentArr[0]._id);
      } else {
        setSelectedEntityId('');
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, [type, selectedClass, selectedSection]);

  // Fetch Staff Members
  const fetchStaff = useCallback(async () => {
    if (type !== 'staff') return;
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await API.get('/attendance/staff', { params: { date: todayStr } });
      const records = res?.data?.data?.records || res?.data?.records || [];
      const staffArr = records.map(r => ({
        _id: r.staff._id,
        name: r.staff.name,
        role: r.staff.role,
        email: r.staff.email
      }));
      setStaffList(staffArr);
      if (staffArr.length > 0) {
        setSelectedEntityId(staffArr[0]._id);
      } else {
        setSelectedEntityId('');
      }
    } catch (err) {
      console.error('Error fetching staff list:', err);
    }
  }, [type]);

  useEffect(() => {
    if (type === 'student') {
      fetchStudents();
    } else {
      fetchStaff();
    }
  }, [type, fetchStudents, fetchStaff]);

  // Fetch Month-Wise Attendance
  const fetchMonthlyAttendance = useCallback(async () => {
    if (!selectedEntityId) return;
    setLoading(true);
    try {
      const res = await getMonthWiseAttendance({
        type,
        id: selectedEntityId,
        month: selectedMonth,
        year: selectedYear
      });
      if (res?.data) {
        setAttendanceData(res.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to fetch monthly attendance');
    } finally {
      setLoading(false);
    }
  }, [type, selectedEntityId, selectedMonth, selectedYear]);

  useEffect(() => {
    if (selectedEntityId) {
      fetchMonthlyAttendance();
    }
  }, [selectedEntityId, selectedMonth, selectedYear, fetchMonthlyAttendance]);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status, isSunday) => {
    if (status === 'Present') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="h-3.5 w-3.5" /> Present
        </span>
      );
    }
    if (status === 'Absent') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 border border-rose-200">
          <XCircle className="h-3.5 w-3.5" /> Absent
        </span>
      );
    }
    if (status === 'Leave') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200">
          <Clock className="h-3.5 w-3.5" /> Leave
        </span>
      );
    }
    if (isSunday || status === 'Sunday') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
          <CalendarDays className="h-3.5 w-3.5" /> Sunday / Holiday
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500 border border-gray-200">
        Not Marked
      </span>
    );
  };

  const summary = attendanceData?.summary || {
    totalDays: 0,
    presentCount: 0,
    absentCount: 0,
    leaveCount: 0,
    notMarkedCount: 0,
    percentage: 0
  };

  const subject = attendanceData?.subject;

  return (
    <div className="space-y-6">
      {/* 1. Filter Header */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Type Toggle: Student vs Staff (Only shown if not fixed by parent) */}
          {!fixedType && (
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
              <button
                onClick={() => setType('student')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  type === 'student' ? 'bg-navy-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Student Attendance
              </button>
              <button
                onClick={() => setType('staff')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  type === 'staff' ? 'bg-navy-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Staff Attendance
              </button>
            </div>
          )}

          {/* Month & Year Selectors */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-900 shadow-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-navy-900 bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-navy-50 transition-colors shadow-xs"
            >
              <Printer className="h-4 w-4" /> Print Register
            </button>
          </div>
        </div>

        {/* Dynamic Entity Selectors */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center gap-4">
          {type === 'student' ? (
            <>
              <ClassSectionFilter
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                selectedSection={selectedSection}
                onSectionChange={setSelectedSection}
              />
              <div className="flex items-center gap-2 min-w-[260px] flex-1">
                <label className="text-xs font-bold text-navy-900 uppercase shrink-0">Student:</label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName} {st.lastName} (Class {st.class}-{st.section} | SR: {st.serialNo})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 min-w-[300px] flex-1">
              <label className="text-xs font-bold text-navy-900 uppercase shrink-0">Staff Member:</label>
              <select
                value={selectedEntityId}
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                {staffList.map((st) => (
                  <option key={st._id} value={st._id}>
                    {st.name} ({st.role} - {st.email})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* 2. Monthly Summary Stats Cards */}
      {attendanceData && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5 no-print">
          <StatCard
            title="Total Days"
            value={summary.totalDays}
            icon={Calendar}
            variant="navy"
          />
          <StatCard
            title="Present"
            value={summary.presentCount}
            icon={CheckCircle2}
            variant="green"
          />
          <StatCard
            title="Absent"
            value={summary.absentCount}
            icon={XCircle}
            variant="amber"
          />
          <StatCard
            title="Leave"
            value={summary.leaveCount}
            icon={Clock}
            variant="blue"
          />
          <StatCard
            title="Attendance %"
            value={`${summary.percentage}%`}
            icon={UserCheck}
            variant={summary.percentage >= 75 ? 'green' : 'amber'}
          />
        </div>
      )}

      {/* 3. Detailed Attendance Register Sheet */}
      {loading ? (
        <LoadingSpinner message="Fetching monthly attendance records..." />
      ) : attendanceData ? (
        <div ref={printRef} className="rounded-card border border-gray-200 bg-white p-6 shadow-flat space-y-4 print-container">
          {/* Print Sheet Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-4 gap-4">
            <div className="flex items-center gap-3">
              {subject?.photo ? (
                <img src={subject.photo} alt="" className="h-12 w-12 rounded-full object-cover border border-gray-300" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-navy-900 text-white flex items-center justify-center font-extrabold text-sm">
                  {subject?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <h3 className="text-base font-black text-navy-900 uppercase">{subject?.name}</h3>
                <p className="text-xs text-gray-500 font-semibold">
                  {type === 'student' 
                    ? `Class: ${subject?.class}-${subject?.section} | Roll No: ${subject?.rollNo} | SR: ${subject?.serialNo}`
                    : `Role: ${subject?.role} | Email: ${subject?.email}`
                  }
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block rounded-md bg-navy-900 text-white px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {MONTH_OPTIONS.find(m => m.value === selectedMonth)?.name} {selectedYear} Register
              </span>
              <p className="text-xs font-bold text-emerald-700 mt-1">
                Attendance Rate: {summary.percentage}%
              </p>
            </div>
          </div>

          {/* Day-by-Day Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse border border-gray-200 text-xs">
              <thead className="bg-gray-50 text-gray-950 font-bold border-b border-gray-300">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-center w-12">#</th>
                  <th className="border border-gray-300 px-3 py-2 w-28">Date</th>
                  <th className="border border-gray-300 px-3 py-2 w-28">Day</th>
                  <th className="border border-gray-300 px-3 py-2 w-44">Status</th>
                  <th className="border border-gray-300 px-3 py-2">Remarks / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendanceData.records.map((rec) => (
                  <tr 
                    key={rec.day}
                    className={rec.isSunday ? 'bg-purple-50/40 font-medium' : 'hover:bg-gray-50'}
                  >
                    <td className="border border-gray-300 px-3 py-1.5 text-center font-bold text-gray-700">
                      {rec.day}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 font-semibold text-navy-900">
                      {rec.date}
                    </td>
                    <td className={`border border-gray-300 px-3 py-1.5 font-bold ${rec.isSunday ? 'text-purple-700' : 'text-gray-700'}`}>
                      {rec.dayOfWeek}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5">
                      {getStatusBadge(rec.status, rec.isSunday)}
                    </td>
                    <td className="border border-gray-300 px-3 py-1.5 text-gray-600 italic">
                      {rec.remark || (rec.isSunday ? 'Weekly Holiday' : '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MonthWiseAttendance;
