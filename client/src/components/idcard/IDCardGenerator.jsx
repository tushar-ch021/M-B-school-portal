import React, { useRef, useState } from 'react';
import IDCardTemplate from './IDCardTemplate';
import { downloadPDF } from '../../utils/generatePDF';
import { printElement } from '../../utils/printElement';
import { Printer, Download, CreditCard, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const IDCardGenerator = ({ student }) => {
  const componentRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  // Direct browser printing
  const handlePrint = () => {
    printElement(componentRef.current, `ID_Card_${student?.serialNo || 'student'}`);
  };

  // Call high-res scale 3 PDF downloader with page constraints = false (exact fit)
  const handleDownloadPDF = async () => {
    if (!student || exporting) return;
    
    setExporting(true);
    const toastId = toast.loading('Generating high-resolution ID card PDF...');
    try {
      const filename = `ID_Card_${student.firstName}_${student.lastName}_${student.serialNo}.pdf`;
      await downloadPDF(componentRef.current, filename, { useA4: false });
      toast.success('ID Card PDF downloaded successfully', { id: toastId });
    } catch (err) {
      toast.error('Failed to export PDF', { id: toastId });
    } finally {
      setExporting(false);
    }
  };

  if (!student) {
    return (
      <div className="flex h-60 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-gray-500">
        <p className="text-sm">Please select a student to preview ID Card</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 items-start no-print">
      {/* 1. Actions Panel (Left column) */}
      <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat lg:col-span-2 space-y-5">
        <div className="flex items-center gap-3 border-b border-gray-150 pb-3">
          <div className="rounded-full bg-navy-50 p-2 text-navy-900 border border-navy-100">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900">ID Card Actions</h3>
            <p className="text-xs text-gray-400">Generate, Print or Export</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-gray-500 leading-relaxed bg-navy-50/50 p-4 rounded-lg border border-navy-100/20">
          <p className="font-bold text-navy-900 flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="h-4 w-4 text-schoolGreen-800" />
            Printing Checklists:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure printer scale is set to <span className="font-semibold text-gray-900">100%</span></li>
            <li>Enable <span className="font-semibold text-gray-900">Background graphics</span> printing in browser settings</li>
            <li>Uses high resolution master student photo asset (<span className="font-semibold text-gray-900">photo.url</span>) to prevent printing blur</li>
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-navy-800"
          >
            <Printer className="h-4 w-4" />
            Print ID Card
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={exporting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating PDF...' : 'Download PDF Card'}
          </button>
        </div>
      </div>

      {/* 2. Visual card live preview container */}
      <div className="flex flex-col items-center justify-center lg:col-span-3 border border-gray-150 rounded-card bg-gray-50/50 p-8 shadow-inner">
        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 no-print">
          Card Preview Render
        </h4>
        
        {/* Render card template with ref link */}
        <div className="shadow-premium rounded-[12px] bg-white">
          <IDCardTemplate ref={componentRef} student={student} />
        </div>
      </div>
    </div>
  );
};

export default IDCardGenerator;
