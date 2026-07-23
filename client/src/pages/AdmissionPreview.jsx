import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import StudentDetailsPrintable from '../components/students/StudentDetailsPrintable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { downloadPDF } from '../utils/generatePDF';
import { printElement } from '../utils/printElement';
import { CheckCircle, Printer, Download, UserPlus, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const AdmissionPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const data = await studentService.getStudentById(id);
        setStudent(data);
      } catch (err) {
        toast.error('Failed to load student admission records.');
        navigate('/students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [id, navigate]);

  const handlePrint = () => {
    printElement(printRef.current, `Admission_Form_${student?.serialNo || 'student'}`);
  };

  const handleDownloadPDF = async () => {
    if (!student) return;
    const toastId = toast.loading('Compiling admission details PDF...');
    try {
      const filename = `Admission_Details_${student.firstName}_${student.lastName}_${student.serialNo}.pdf`;
      await downloadPDF(printRef.current, filename, { useA4: true });
      toast.success('Admission PDF document downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to compile PDF document', { id: toastId });
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="no-print flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl flex items-center gap-2">
            <FileText className="h-6 w-6 text-navy-900" />
            Admission Registration Preview
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Review, download, or print the student registration sheet.
          </p>
        </div>
      </div>

      {/* Success card info banner */}
      <div className="rounded-card border border-green-200 bg-green-50/20 p-6 shadow-flat flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5 text-center sm:text-left">
          <CheckCircle className="h-10 w-10 text-schoolGreen-800 shrink-0" />
          <div>
            <h3 className="font-extrabold text-navy-900 text-lg">
              Admission Registered Successfully!
            </h3>
            <p className="text-xs text-gray-500">
              Assigned ID Serial Number: <span className="font-bold text-navy-900">{student.serialNo}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => navigate('/admission/new')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Admit Another
          </button>
          
          <button
            onClick={() => navigate(`/students/profile/${student._id}`)}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-800 transition-colors"
          >
            Go to Profile
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Document Controls and Print Preview Sheet container */}
      <div className="space-y-6">
        <div className="flex justify-center gap-3 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-navy-800"
          >
            <Printer className="h-4.5 w-4.5" />
            Print Form Sheet
          </button>
          
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50"
          >
            <Download className="h-4.5 w-4.5" />
            Download PDF
          </button>
        </div>

        {/* Document sheet view */}
        <div className="bg-gray-50/50 p-6 border border-gray-150 rounded-card shadow-inner max-w-[840px] mx-auto overflow-x-auto">
          <StudentDetailsPrintable ref={printRef} student={student} />
        </div>
      </div>
    </div>
  );
};

export default AdmissionPreview;
