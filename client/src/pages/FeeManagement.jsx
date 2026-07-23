import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import studentService from '../services/studentService';
import feeService from '../services/feeService';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import MonthlyFeeConfig from '../components/fees/MonthlyFeeConfig';
import ClassFeeOverview from '../components/fees/ClassFeeOverview';
import MonthlyFeeGrid from '../components/fees/MonthlyFeeGrid';
import FeeHistoryTable from '../components/fees/FeeHistoryTable';
import FeeReceiptTemplate from '../components/fees/FeeReceiptTemplate';
import { downloadPDF } from '../utils/generatePDF';
import { printElement } from '../utils/printElement';
import { IndianRupee, Printer, Download, Calendar, Users, FileText, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const FeeManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get('studentId');

  const [activeTab, setActiveTab] = useState(studentIdParam ? 'monthly_student' : 'monthly_class'); // 'monthly_class' | 'monthly_student' | 'ledger'

  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSection, setSelectedSection] = useState('A');
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [monthlyStudentId, setMonthlyStudentId] = useState(studentIdParam || '');

  const [search, setSearch] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // History & Receipt Modal state
  const [historyStudent, setHistoryStudent] = useState(null);
  const [historyPayments, setHistoryPayments] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [activeReceipt, setActiveReceipt] = useState(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  const receiptRef = useRef(null);

  // Auto-switch tab if studentId param passed from Student Profile
  useEffect(() => {
    if (studentIdParam) {
      setMonthlyStudentId(studentIdParam);
      setActiveTab('monthly_student');
    }
  }, [studentIdParam]);

  // Fetch students list for Class/Student dropdown filters
  useEffect(() => {
    setLoadingStudents(true);
    studentService.getStudents({
      className: selectedClass,
      section: selectedSection,
      search,
      limit: 200
    })
      .then((res) => {
        const stList = res?.students || res?.data?.students || [];
        setStudents(stList);
        if (stList.length > 0 && !monthlyStudentId) {
          setMonthlyStudentId(stList[0]._id);
        }
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, selectedSection, search]);

  const handleReceiptPrint = () => {
    printElement(receiptRef.current, `Receipt_${activeReceipt?.receiptNo || 'payment'}`);
  };

  const handleReceiptDownload = async () => {
    if (!activeReceipt) return;
    const toastId = toast.loading('Compiling fee receipt PDF...');
    try {
      const filename = `Fee_Receipt_${activeReceipt.receiptNo}.pdf`;
      await downloadPDF(receiptRef.current, filename, { useA4: true });
      toast.success('Fee receipt PDF downloaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF', { id: toastId });
    }
  };

  const handleHistoryTrigger = async (st) => {
    setHistoryStudent(st);
    setHistoryLoading(true);
    setHistoryOpen(true);
    try {
      const logs = await feeService.getFeeHistory(st._id);
      setHistoryPayments(Array.isArray(logs) ? logs : []);
    } catch (err) {
      toast.error('Failed to query fee history');
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const columns = [
    {
      header: 'Serial No',
      key: 'serialNo',
      className: 'font-semibold text-navy-900'
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (st) => (
        <div className="flex items-center gap-3">
          <img
            src={st.photo?.thumbnailUrl || st.photo?.url || '/default-avatar.png'}
            alt={`${st.firstName} ${st.lastName}`}
            className="h-8 w-8 rounded-full object-cover border border-gray-200"
            onError={(e) => { e.target.src = 'https://via.placeholder.com/40?text=ST'; }}
          />
          <div>
            <p className="font-bold text-gray-900">{st.firstName} {st.lastName}</p>
            <p className="text-[10px] text-gray-400">Roll: {st.rollNo || '-'}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Class',
      key: 'class',
      render: (st) => `${st.class} - ${st.section}`
    },
    {
      header: 'Actions',
      key: 'actions',
      render: (st) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setMonthlyStudentId(st._id);
              setActiveTab('monthly_student');
            }}
            className="flex items-center gap-1 px-3 py-1.5 bg-navy-900 text-white rounded-md text-xs font-bold hover:bg-navy-800 transition-colors shadow-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            12-Month Matrix
          </button>

          <button
            onClick={() => handleHistoryTrigger(st)}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 bg-white text-gray-700 rounded-md text-xs font-bold hover:bg-gray-50 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-gray-500" />
            Ledger Receipts
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4 no-print">
        <div>
          <h2 className="text-2xl font-black text-navy-900 flex items-center gap-2">
            <IndianRupee className="h-7 w-7 text-schoolGreen-800" />
            Indian School Monthly Fee Management
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Admin month-by-month fee configuration, class payment status board, and student 12-month matrices.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('monthly_student')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'monthly_student'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Student 12-Month Matrix
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'ledger'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Receipts Ledger
          </button>
        </div>
      </div>

      {/* TAB 2: STUDENT 12-MONTH MATRIX */}
      {activeTab === 'monthly_student' && (
        <div className="space-y-6">
          {/* Class & Student Filter Bar */}
          <div className="rounded-card border border-gray-200 bg-white p-4 shadow-flat space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ClassSectionFilter
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                selectedSection={selectedSection}
                onSectionChange={setSelectedSection}
              />
              <div className="w-full sm:w-64">
                <SearchBar value={search} onChange={setSearch} placeholder="Search student name..." />
              </div>
            </div>

            {/* Active Student Select Dropdown */}
            {students.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider shrink-0">
                  Select Student:
                </label>
                <select
                  value={monthlyStudentId}
                  onChange={(e) => setMonthlyStudentId(e.target.value)}
                  className="w-full sm:max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                >
                  {students.map((st) => (
                    <option key={st._id} value={st._id}>
                      {st.firstName} {st.lastName} (Class {st.class}-{st.section} | SR: {st.serialNo})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <MonthlyFeeGrid
            studentId={monthlyStudentId}
            academicYear={`${selectedYear}-${Number(selectedYear) + 1}`}
          />
        </div>
      )}

      {/* TAB 3: RECEIPTS LEDGER */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
            <SearchBar value={search} onChange={setSearch} placeholder="Search by student name..." />
            <ClassSectionFilter
              selectedClass={selectedClass}
              onClassChange={setSelectedClass}
              selectedSection={selectedSection}
              onSectionChange={setSelectedSection}
              showAllOption={false}
            />
          </div>

          <DataTable
            columns={columns}
            data={students}
            loading={loadingStudents}
            emptyMessage="No active students found in this class segment."
          />
        </div>
      )}

      {/* Transaction History Modal */}
      <Modal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title={`Transaction History Ledger — ${historyStudent?.firstName} ${historyStudent?.lastName}`}
        size="lg"
      >
        <FeeHistoryTable
          payments={historyPayments}
          loading={historyLoading}
          onReprint={(p) => {
            setActiveReceipt(p);
            setHistoryOpen(false);
            setReceiptOpen(true);
          }}
        />
      </Modal>

      {/* Receipt Print Modal */}
      <Modal
        isOpen={receiptOpen}
        onClose={() => setReceiptOpen(false)}
        title={`Fee Receipt — ${activeReceipt?.receiptNo || ''}`}
        size="lg"
      >
        {activeReceipt && (
          <div className="space-y-4">
            <div className="flex items-center justify-end gap-3 border-b border-gray-200 pb-3 no-print">
              <button
                onClick={handleReceiptPrint}
                className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white hover:bg-navy-800 shadow-flat"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
              <button
                onClick={handleReceiptDownload}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download PDF
              </button>
            </div>

            <div className="shadow-premium rounded-[12px] bg-white p-2">
              <FeeReceiptTemplate ref={receiptRef} payment={activeReceipt} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeeManagement;
