import React, { useRef, useState } from 'react';
import TCTemplate from './TCTemplate';
import { downloadPDF } from '../../utils/generatePDF';
import { printElement } from '../../utils/printElement';
import studentService from '../../services/studentService';
import { Printer, Download, FileCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const TCGenerator = ({ student, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [issuedStudentData, setIssuedStudentData] = useState(student?.tcIssued ? student : null);

  // Form states
  const [reason, setReason] = useState('Course Completed');
  const [lastClass, setLastClass] = useState(student?.class || '10th');
  const [conduct, setConduct] = useState('Good');
  const [duesCleared, setDuesCleared] = useState(true);
  const [tcIssueDate, setTcIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [apaarId, setApaarId] = useState(student?.apaarId || '');
  const [aadharNo, setAadharNo] = useState(student?.aadharNo || '');
  const [panNumber, setPanNumber] = useState(student?.panNumber || '');

  const printRef = useRef(null);

  // Browser printing
  const handlePrint = () => {
    printElement(printRef.current, `TC_${issuedStudentData?.serialNo || 'student'}`);
  };

  // Call high-res scale 3 PDF downloader with standard A4 page layout
  const handleDownloadPDF = async () => {
    if (!issuedStudentData) return;
    const toastId = toast.loading('Compiling transfer certificate PDF...');
    try {
      const filename = `TC_${issuedStudentData.firstName}_${issuedStudentData.lastName}_${issuedStudentData.tcNumber}.pdf`;
      await downloadPDF(printRef.current, filename, { useA4: true });
      toast.success('TC PDF document downloaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF', { id: toastId });
    }
  };

  const handleIssueTC = async (e) => {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    const toastId = toast.loading('Processing Transfer Certificate issuance...');
    try {
      const payload = {
        reasonForLeaving: reason,
        lastClassAttended: lastClass,
        conduct,
        duesCleared,
        tcIssueDate,
        apaarId,
        aadharNo,
        panNumber
      };

      const updatedStudent = await studentService.issueTC(student._id, payload);
      setIssuedStudentData(updatedStudent);
      toast.success('TC issued successfully!', { id: toastId });
      
      if (onSuccess) {
        onSuccess(updatedStudent);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to issue TC';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* State 1: Form layout to capture TC parameters */}
      {!issuedStudentData ? (
        <form onSubmit={handleIssueTC} className="space-y-5 max-w-md mx-auto no-print">
          <div className="rounded-lg bg-red-50 p-4 border border-red-150 flex gap-3 text-red-900">
            <ShieldAlert className="h-5 w-5 shrink-0 text-red-650" />
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase tracking-wider">Warning: Student Termination</p>
              <p className="text-gray-500 leading-normal">
                Issuing a Transfer Certificate will mark the student as inactive and record final leaving dates. This action is intended for graduates or school-leavers.
              </p>
            </div>
          </div>

          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700">Date of Issue (Manual)</label>
              <input
                type="date"
                value={tcIssueDate}
                onChange={(e) => setTcIssueDate(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Last Class Attended *</label>
              <input
                type="text"
                value={lastClass}
                onChange={(e) => setLastClass(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Reason for Leaving *</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Higher Studies, Relocation"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  APAAR ID <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={apaarId}
                  onChange={(e) => setApaarId(e.target.value)}
                  placeholder="APAAR ID"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  Aadhar No <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={aadharNo}
                  onChange={(e) => setAadharNo(e.target.value)}
                  placeholder="Aadhar No"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">
                  PAN No <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value)}
                  placeholder="PAN No"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">General Conduct Appraisal *</label>
              <select
                value={conduct}
                onChange={(e) => setConduct(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
              >
                <option value="Good">Good</option>
                <option value="Satisfactory">Satisfactory</option>
                <option value="Excellent">Excellent</option>
                <option value="Needs Improvement">Needs Improvement</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                id="duesCleared"
                type="checkbox"
                checked={duesCleared}
                onChange={(e) => setDuesCleared(e.target.checked)}
                className="h-4.5 w-4.5 rounded-sm border-gray-300 text-navy-900 focus:ring-navy-900"
              />
              <label htmlFor="duesCleared" className="text-sm font-semibold text-gray-700 select-none">
                All School Dues Cleared
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <FileCheck className="h-4.5 w-4.5" />
            {loading ? 'Processing...' : 'Confirm and Issue TC'}
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        </form>
      ) : (
        /* State 2: Issued Certificate preview with download controls */
        <div className="space-y-6">
          <div className="flex justify-center gap-3 no-print max-w-[800px] mx-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-navy-800"
            >
              <Printer className="h-4.5 w-4.5" />
              Print Certificate
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Download className="h-4.5 w-4.5" />
              Download PDF TC
            </button>
          </div>

          {/* Certificate page layout */}
          <div className="bg-gray-50/50 p-6 border border-gray-150 rounded-card shadow-inner max-w-[840px] mx-auto overflow-x-auto">
            <TCTemplate ref={printRef} student={issuedStudentData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TCGenerator;
