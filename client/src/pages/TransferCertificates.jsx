import React, { useState, useEffect, useRef } from 'react';
import studentService from '../services/studentService';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import TCTemplate from '../components/tc/TCTemplate';
import { downloadPDF } from '../utils/generatePDF';
import { printElement } from '../utils/printElement';
import { FileBadge, Printer, Download, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const TransferCertificates = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Reprint TC states
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reprintOpen, setReprintOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const printRef = useRef(null);
  const navigate = useNavigate();

  // Browser printing
  const handlePrint = () => {
    printElement(printRef.current, `TC_${selectedRecord?.serialNo || 'student'}`);
  };

  const handleDownloadPDF = async () => {
    if (!selectedRecord || exporting) return;
    setExporting(true);
    const toastId = toast.loading('Compiling transfer certificate PDF...');
    try {
      const filename = `TC_${selectedRecord.firstName}_${selectedRecord.lastName}_${selectedRecord.tcNumber}.pdf`;
      await downloadPDF(printRef.current, filename, { useA4: true });
      toast.success('TC PDF document downloaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await studentService.getTCRecords(search);
      setRecords(data);
    } catch (err) {
      toast.error('Failed to load Transfer Certificate log records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [search]);

  const handleReprintTrigger = (record) => {
    setSelectedRecord(record);
    setReprintOpen(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const columns = [
    {
      header: 'TC Number',
      key: 'tcNumber',
      className: 'font-bold text-navy-900'
    },
    {
      header: 'Issue Date',
      key: 'tcIssueDate',
      render: (r) => <span>{formatDate(r.tcIssueDate)}</span>
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (r) => (
        <span className="font-semibold text-gray-900">
          {r.firstName} {r.lastName}
        </span>
      )
    },
    {
      header: 'Class & Sec',
      key: 'classSection',
      render: (r) => <span>{r.lastClassAttended} - {r.section}</span>
    },
    {
      header: "Father's Name",
      key: 'fatherName'
    },
    {
      header: 'Reason for Leaving',
      key: 'reasonForLeaving',
      className: 'italic text-gray-500 max-w-xs truncate'
    },
    {
      header: 'Action',
      key: 'actions',
      style: { width: '120px' },
      render: (r) => (
        <button
          onClick={() => handleReprintTrigger(r)}
          className="flex items-center gap-1.5 rounded-lg border border-navy-900 bg-white px-3 py-1.5 text-xs font-bold text-navy-900 hover:bg-navy-50 transition-colors"
        >
          <Printer className="h-3.5 w-3.5" />
          Reprint
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Transfer Certificates Log</h2>
          <p className="text-xs text-gray-500 font-medium">
            Search and reprint issued certificates. To issue a new TC, search for an active student.
          </p>
        </div>

        <button
          onClick={() => navigate('/students')}
          className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-bold text-white shadow-premium transition-colors hover:bg-navy-800"
        >
          <Search className="h-4 w-4" />
          Find Active Student
        </button>
      </div>

      {/* Search & Class/Section Filter bar */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4 no-print">
        <ClassSectionFilter
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          showAllOption={true}
        />
        <div className="w-full sm:w-64">
          <SearchBar 
            value={search} 
            onChange={setSearch} 
            placeholder="Search student name or TC no..." 
          />
        </div>
      </div>

      {/* TC Records Table */}
      <DataTable
        columns={columns}
        data={records.filter((r) => {
          const stClass = r.lastClassAttended || r.class || '';
          const stSec = r.section || '';
          if (selectedClass && stClass.toLowerCase() !== selectedClass.toLowerCase()) return false;
          if (selectedSection && stSec.toLowerCase() !== selectedSection.toLowerCase()) return false;
          return true;
        })}
        loading={loading}
        onRowClick={handleReprintTrigger}
        emptyMessage="No Transfer Certificates have been issued matching your selected Class & Section."
      />

      {/* Reprint preview modal */}
      <Modal
        isOpen={reprintOpen}
        onClose={() => setReprintOpen(false)}
        title={`Reprint Transfer Certificate — No: ${selectedRecord?.tcNumber || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-navy-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
          
          <div className="overflow-x-auto bg-gray-50/50 p-4 border border-gray-200 rounded-lg">
            {selectedRecord && (
              <TCTemplate ref={printRef} student={selectedRecord} />
            )}
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default TransferCertificates;
