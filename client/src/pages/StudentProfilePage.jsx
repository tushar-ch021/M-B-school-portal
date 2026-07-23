import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import feeService from '../services/feeService';
import StudentProfile from '../components/students/StudentProfile';
import AdmissionForm from '../components/students/AdmissionForm';
import FeeHistoryTable from '../components/fees/FeeHistoryTable';
import Modal from '../components/common/Modal';
import FeeCollectionForm from '../components/fees/FeeCollectionForm';
import FeeReceiptTemplate from '../components/fees/FeeReceiptTemplate';
import UpdateDuesModal from '../components/fees/UpdateDuesModal';
import TCGenerator from '../components/tc/TCGenerator';
import IDCardGenerator from '../components/idcard/IDCardGenerator';
import StudentDetailsPrintable from '../components/students/StudentDetailsPrintable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { downloadPDF } from '../utils/generatePDF';
import { printElement } from '../utils/printElement';
import { ChevronLeft, Edit2, FileText, Printer, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentProfilePage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isEditMode = searchParams.get('edit') === 'true';

  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal display toggles
  const [collectFeeOpen, setCollectFeeOpen] = useState(false);
  const [updateDuesOpen, setUpdateDuesOpen] = useState(false);
  const [issueTCOpen, setIssueTCOpen] = useState(false);
  const [idCardOpen, setIdCardOpen] = useState(false);
  const [detailsPrintOpen, setDetailsPrintOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeReason, setRemoveReason] = useState('');

  // Reprint Receipt states
  const [reprintPayment, setReprintPayment] = useState(null);
  const [reprintOpen, setReprintOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const invoicePrintRef = useRef(null);
  const detailsPrintRef = useRef(null);

  // Reprint Receipt browser printing
  const handleInvoicePrint = () => {
    printElement(invoicePrintRef.current, `Receipt_${reprintPayment?.receiptNo || 'payment'}`);
  };

  const handleInvoiceDownload = async () => {
    if (!reprintPayment || exporting) return;
    setExporting(true);
    const toastId = toast.loading('Compiling fee receipt PDF...');
    try {
      const filename = `Fee_Receipt_${student.firstName}_${student.lastName}_${reprintPayment.receiptNo}.pdf`;
      await downloadPDF(invoicePrintRef.current, filename, { useA4: true });
      toast.success('Fee receipt PDF downloaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  // Full Details Form browser printing
  const handleDetailsFormPrint = () => {
    printElement(detailsPrintRef.current, `Admission_Form_${student?.serialNo || 'student'}`);
  };

  const handleDetailsFormDownload = async () => {
    if (!student || exporting) return;
    setExporting(true);
    const toastId = toast.loading('Compiling admission form PDF...');
    try {
      const filename = `Admission_Form_${student.firstName}_${student.lastName}_${student.serialNo}.pdf`;
      await downloadPDF(detailsPrintRef.current, filename, { useA4: true });
      toast.success('Admission Form PDF downloaded', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  const fetchStudentData = useCallback(async () => {
    setLoading(true);
    try {
      const studentData = await studentService.getStudentById(id);
      setStudent(studentData);
      
      const paymentsData = await feeService.getFeeHistory(id);
      // Defensive: ensure payments is always an array to prevent .map() TypeError
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
    } catch (err) {
      toast.error('Failed to retrieve student profile logs');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleRemoveConfirm = async () => {
    if (!removeReason.trim()) {
      toast.error('Please enter a reason for removing this student');
      return;
    }
    setSubmitting(true);
    const toastId = toast.loading('Removing student...');
    try {
      await studentService.removeStudent(student._id, removeReason.trim());
      toast.success(`${student.firstName} ${student.lastName} has been removed`, { id: toastId });
      setRemoveOpen(false);
      navigate('/students'); // Redirect back to active student directory
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to remove student', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (formData) => {
    setSubmitting(true);
    const toastId = toast.loading('Updating student profile records...');
    try {
      const updatedStudent = await studentService.updateStudent(id, formData);
      setStudent(updatedStudent);
      toast.success('Profile updated successfully!', { id: toastId });
      // Clear edit flag query parameter
      setSearchParams({});
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update student profile';
      toast.error(errMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCollectFeeSubmit = async (feePayload) => {
    setSubmitting(true);
    const toastId = toast.loading('Recording payment receipt transaction...');
    try {
      const savedReceipt = await feeService.collectFee(feePayload);
      setPayments([savedReceipt, ...payments]);
      toast.success(`Fee collected! Receipt: ${savedReceipt.receiptNo}`, { id: toastId });
      
      setCollectFeeOpen(false);
      // Directly trigger reprint modal for newly collected receipt
      setReprintPayment(savedReceipt);
      setReprintOpen(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to record fee receipt';
      toast.error(errMsg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTCIssuedSuccess = (updatedStudent) => {
    setStudent(updatedStudent);
    setIssueTCOpen(false);
  };

  const triggerReprint = (payment) => {
    setReprintPayment(payment);
    setReprintOpen(true);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-gray-500">Student record not found or was deleted.</h3>
        <button 
          onClick={() => navigate('/students')}
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:underline"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and Edit mode toggle header */}
      <div className="flex justify-between items-center no-print">
        <button
          onClick={() => {
            if (isEditMode) {
              setSearchParams({});
            } else {
              navigate('/students');
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:bg-navy-50 px-3 py-1.5 rounded-lg border border-navy-100/50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {isEditMode ? 'Cancel Edit' : 'Back to Listings'}
        </button>

        {!isEditMode && (
          <button
            onClick={() => setSearchParams({ edit: 'true' })}
            className="flex items-center gap-1.5 rounded-lg border border-navy-900 bg-white px-4 py-1.5 text-xs font-bold text-navy-900 hover:bg-navy-50 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Main Content grid */}
      {isEditMode ? (
        <div className="space-y-6">
          <div className="rounded-card bg-white p-6 border border-gray-200 shadow-flat">
            <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider mb-6 border-b border-gray-100 pb-2">
              Edit Student Profile: {student.firstName} {student.lastName} ({student.serialNo})
            </h3>
            <AdmissionForm 
              onSubmit={handleProfileUpdate} 
              initialData={student} 
              isSubmitting={submitting} 
            />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Detailed Student profile details (using original photo.url) */}
          <StudentProfile
            student={student}
            onCollectFee={() => navigate(`/fees?studentId=${student._id}`)}
            onUpdateDues={() => navigate(`/fees?studentId=${student._id}`)}
            onIssueTC={() => setIssueTCOpen(true)}
            onGenerateID={() => setIdCardOpen(true)}
            onPrintDetails={() => setDetailsPrintOpen(true)}
            onRemove={() => setRemoveOpen(true)}
          />

          {/* Billing Transaction Receipt history ledger */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-navy-900" />
              Fee Receipts Ledger
            </h3>
            <FeeHistoryTable
              payments={payments}
              loading={false}
              onReprint={triggerReprint}
            />
          </div>
        </div>
      )}

      {/* --- POPUP MODALS INDEX --- */}

      {/* Update Dues Modal */}
      {student && (
        <UpdateDuesModal
          student={student}
          isOpen={updateDuesOpen}
          onClose={() => setUpdateDuesOpen(false)}
          onSuccess={(updatedStudent) => {
            setStudent(updatedStudent);
          }}
        />
      )}

      {/* 1. Collect Fee Form Modal */}
      <Modal 
        isOpen={collectFeeOpen} 
        onClose={() => setCollectFeeOpen(false)} 
        title="Collect Tuition & Transport Fees" 
        size="lg"
      >
        <FeeCollectionForm 
          student={student} 
          onSubmit={handleCollectFeeSubmit} 
          isSubmitting={submitting} 
        />
      </Modal>

      {/* 2. Issue TC modal */}
      <Modal
        isOpen={issueTCOpen}
        onClose={() => setIssueTCOpen(false)}
        title={`Issue Transfer Certificate (TC) — ${student.firstName} ${student.lastName}`}
        size="lg"
      >
        <TCGenerator student={student} onSuccess={handleTCIssuedSuccess} />
      </Modal>

      {/* 3. ID Card generator modal */}
      <Modal
        isOpen={idCardOpen}
        onClose={() => setIdCardOpen(false)}
        title={`ID Card Preview Center — ${student.firstName} ${student.lastName}`}
        size="lg"
      >
        <IDCardGenerator student={student} />
      </Modal>

      {/* 4. Details Form print preview modal */}
      <Modal
        isOpen={detailsPrintOpen}
        onClose={() => setDetailsPrintOpen(false)}
        title="Admission Form Print Sheet"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <button
              onClick={handleDetailsFormPrint}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-navy-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleDetailsFormDownload}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
          <div className="overflow-x-auto bg-gray-50/50 p-4 border border-gray-200 rounded-lg">
            <StudentDetailsPrintable ref={detailsPrintRef} student={student} />
          </div>
        </div>
      </Modal>

      {/* 5. Reprint Fee receipt invoice preview modal */}
      <Modal
        isOpen={reprintOpen}
        onClose={() => setReprintOpen(false)}
        title={`Fee Receipt Reprint — No: ${reprintPayment?.receiptNo || ''}`}
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex justify-end gap-2 no-print">
            <button
              onClick={handleInvoicePrint}
              className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-premium hover:bg-navy-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Print
            </button>
            <button
              onClick={handleInvoiceDownload}
              disabled={exporting}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
          <div className="overflow-x-auto bg-gray-50/50 p-4 border border-gray-200 rounded-lg">
            {reprintPayment && (
              <FeeReceiptTemplate ref={invoicePrintRef} payment={reprintPayment} />
            )}
          </div>
        </div>
      </Modal>

      {/* 6. Remove Student modal with reason */}
      <Modal
        isOpen={removeOpen}
        onClose={() => setRemoveOpen(false)}
        title="Remove Student"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              You are about to remove <span className="font-bold text-gray-900">{student?.firstName} {student?.lastName}</span> ({student?.serialNo}) from the active student directory.
            </p>
            <p className="text-xs text-gray-400">
              The student will be moved to the "Removed Students" section and can be restored later.
            </p>
          </div>

          {/* Reason input */}
          <div className="w-full text-left">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Reason for Removal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              placeholder="e.g. Transfer to another school, Dropout, Fee defaulter, etc."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none"
            />
          </div>

          <div className="flex w-full gap-3 mt-2">
            <button
              type="button"
              onClick={() => setRemoveOpen(false)}
              disabled={submitting}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleRemoveConfirm}
              disabled={submitting || !removeReason.trim()}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? 'Removing...' : 'Remove Student'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default StudentProfilePage;
