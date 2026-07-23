import React, { useRef, useState, useEffect } from 'react';
import CertificateTemplate from './CertificateTemplate';
import { createCertificate } from '../../services/certificateService';
import { downloadPDF } from '../../utils/generatePDF';
import { printElement } from '../../utils/printElement';
import { Printer, Download, Award, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CertificateGenerator = ({ student, onCertificateSaved }) => {
  const componentRef = useRef(null);
  const { admin } = useAuth();

  const [category, setCategory] = useState('Sports');
  const [title, setTitle] = useState('Certificate of Merit');
  const [reasonText, setReasonText] = useState('For outstanding achievement and active participation in the Annual Inter-House Sports Meet.');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [savedCertificateNo, setSavedCertificateNo] = useState('');

  // Preset templates per category
  useEffect(() => {
    switch (category) {
      case 'Sports':
        setTitle('Certificate of Sports Excellence');
        setReasonText('For outstanding performance, teamwork, and athletic achievement in school sports.');
        break;
      case 'Annual':
        setTitle('Annual Day Recognition');
        setReasonText('For exemplary participation and performance in the Annual Day Celebration.');
        break;
      case 'Competition':
        setTitle('Certificate of Achievement');
        setReasonText('For securing top honors in the Inter-School Academic & Cultural Competition.');
        break;
      case 'Academic Excellence':
        setTitle('Certificate of Academic Merit');
        setReasonText('For securing top rank and demonstrating high academic excellence in the academic term.');
        break;
      case 'Character':
        setTitle('Good Conduct Certificate');
        setReasonText('For maintaining exceptional discipline, leadership, and moral character.');
        break;
      default:
        break;
    }
  }, [category]);

  const handleSaveCertificate = async () => {
    if (!student) {
      toast.error('Please select a student first');
      return;
    }
    if (!title.trim() || !reasonText.trim()) {
      toast.error('Please fill in certificate title and description text');
      return;
    }

    setSaving(true);
    const toastId = toast.loading('Issuing certificate record...');
    try {
      const response = await createCertificate({
        studentId: student._id,
        category,
        title,
        reasonText,
        issueDate
      });
      if (response?.data) {
        setSavedCertificateNo(response.data.certificateNo);
        toast.success(`Certificate ${response.data.certificateNo} issued successfully!`, { id: toastId });
        if (onCertificateSaved) onCertificateSaved(response.data);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to issue certificate', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!student) return;
    printElement(componentRef.current, `Certificate_${student.serialNo}`);
  };

  const handleDownloadPDF = async () => {
    if (!student || exporting) return;
    setExporting(true);
    const toastId = toast.loading('Generating high-resolution Certificate PDF...');
    try {
      const filename = `Certificate_${student.firstName}_${student.lastName}_${category}.pdf`;
      await downloadPDF(componentRef.current, filename, { useA4: true });
      toast.success('Certificate PDF downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to export PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (!student) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
        <p className="text-sm font-medium">Please select a student from the list to issue/preview certificate.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start no-print">
      {/* 1. Actions & Data Input Form Panel (Left Column) */}
      <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat lg:col-span-2 space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-150 pb-3">
          <div className="rounded-full bg-navy-50 p-2 text-navy-900 border border-navy-100">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900">Certificate Details</h3>
            <p className="text-xs text-gray-400">Configure text and generate certificate</p>
          </div>
        </div>

        {/* Selected Student Summary */}
        <div className="bg-navy-50/50 p-3 rounded-lg border border-navy-100/30 flex items-center gap-3">
          <img
            src={student.photo?.url || '/default-avatar.png'}
            alt={student.firstName}
            className="h-10 w-10 rounded-full object-cover border border-navy-200"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/40?text=ST';
            }}
          />
          <div>
            <p className="text-xs font-bold text-navy-900">{student.firstName} {student.lastName}</p>
            <p className="text-[10px] text-gray-500">Class {student.class}-{student.section} | Roll: {student.rollNo || '-'}</p>
          </div>
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          >
            <option value="Sports">Sports</option>
            <option value="Annual">Annual Day</option>
            <option value="Competition">Competition</option>
            <option value="Academic Excellence">Academic Excellence</option>
            <option value="Character">Character / Conduct</option>
            <option value="Custom">Custom</option>
          </select>
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Certificate Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>

        {/* Reason / Achievement Body Text */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description / Achievement Text</label>
          <textarea
            rows={3}
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>

        {/* Issue Date Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Date Issued</label>
          <input
            type="date"
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSaveCertificate}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-schoolGreen-800 py-2.5 text-xs font-bold text-white shadow-flat hover:bg-schoolGreen-850 transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {saving ? 'Saving...' : 'Issue & Save Record'}
          </button>

          <button
            onClick={handlePrint}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-2.5 text-xs font-bold text-white shadow-premium hover:bg-navy-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Certificate
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating PDF...' : 'Download PDF Certificate'}
          </button>
        </div>
      </div>

      {/* 2. Visual Live Certificate Preview Container */}
      <div className="flex flex-col items-center justify-center lg:col-span-3 border border-gray-150 rounded-card bg-gray-50/50 p-6 shadow-inner overflow-x-auto">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Live Certificate Render
        </h4>

        <div className="w-full max-w-[800px] shadow-premium rounded-[12px] bg-white">
          <CertificateTemplate
            ref={componentRef}
            student={student}
            category={category}
            title={title}
            reasonText={reasonText}
            certificateNo={savedCertificateNo || 'CERT-2026-PREVIEW'}
            issueDate={issueDate}
            signatureUrl={admin?.signatureUrl}
          />
        </div>
      </div>
    </div>
  );
};

export default CertificateGenerator;
