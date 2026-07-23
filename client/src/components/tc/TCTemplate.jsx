import React, { forwardRef } from 'react';
import { amountInWords } from '../../utils/numberToWords';
import { useBranding } from '../../utils/brandingConfig';

const TCTemplate = forwardRef(({ student }, ref) => {
  const { branding } = useBranding();
  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Convert Date to words format, e.g., "Fifteenth of July Two Thousand Twelve"
  const getDateInWords = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const ordinalDays = [
      '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
      'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth',
      'Nineteenth', 'Twentieth', 'Twenty-First', 'Twenty-Second', 'Twenty-Third', 'Twenty-Fourth', 'Twenty-Fifth',
      'Twenty-Sixth', 'Twenty-Seventh', 'Twenty-Eighth', 'Twenty-Ninth', 'Thirtieth', 'Thirty-First'
    ];

    const yearWords = amountInWords(year);

    return `${ordinalDays[day]} day of ${month} ${yearWords}`;
  };

  return (
    <div 
      ref={ref}
      className="print-container bg-white p-12 max-w-[800px] mx-auto border border-gray-200 text-gray-900 shadow-md font-sans text-xs leading-relaxed relative"
      style={{ minHeight: '297mm' }}
    >
      {/* Border outline representing certificate frame */}
      <div className="absolute inset-4 border border-navy-950 p-6 pointer-events-none flex flex-col justify-between" style={{ border: '2px solid #1B3A6B' }} />

      <div className="relative z-10 flex flex-col justify-between h-full space-y-6 px-4 py-2">
        
        {/* 1. School Header information */}
        <div className="text-center border-b border-navy-900/10 pb-4">
          <div className="flex justify-center mb-2">
            <img 
              src="/logo.png" 
              alt="School emblem" 
              className="h-14 w-14 object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-lg font-black tracking-widest text-navy-900 uppercase">
            {branding.schoolName}
          </h1>
          <p className="text-[10px] font-semibold text-gray-500 uppercase">
            {branding.schoolAddress}
          </p>
          <p className="text-[9px] text-gray-400 mt-0.5">
            Affiliated to CBSE | School Code: {branding.schoolCode}
          </p>
        </div>

        {/* 2. Certificate Title */}
        <div className="text-center">
          <h2 className="text-sm font-black tracking-widest text-navy-900 uppercase underline decoration-2 decoration-schoolGreen-800">
            TRANSFER CERTIFICATE
          </h2>
        </div>

        {/* 3. Certificate serial code details */}
        <div className="flex justify-between items-center text-xs font-bold text-gray-950 px-2">
          <p>
            TC Number: <span className="text-navy-900 font-extrabold">{student.tcNumber}</span>
          </p>
          <p>
            Date of Issue: <span className="text-navy-900 font-extrabold">{formatDate(student.tcIssueDate)}</span>
          </p>
        </div>

        {/* 4. Numbered Fields Details */}
        <div className="space-y-3 pt-2 text-xs text-gray-950">
          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">1.</span>
            <span className="w-64 font-semibold">Name of the Student</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-bold text-navy-900 uppercase">{student.firstName} {student.lastName}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">2.</span>
            <span className="w-64 font-semibold">Father's Name</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">Mr. {student.fatherName}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">3.</span>
            <span className="w-64 font-semibold">Mother's Name</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">Mrs. {student.motherName}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">4.</span>
            <span className="w-64 font-semibold">Date of Birth (in figures)</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">{formatDate(student.dob)}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5 pl-6">
            <span className="w-58 text-gray-400 font-medium italic">Date of Birth (in words)</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-bold text-navy-900 italic">{getDateInWords(student.dob)}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">5.</span>
            <span className="w-64 font-semibold">Category (Gen/OBC/SC/ST/EWS)</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">{student.category}</span>
          </div>

          {student.apaarId && (
            <div className="flex border-b border-dashed border-gray-200 pb-1.5 pl-6">
              <span className="w-58 font-semibold text-navy-900">APAAR ID</span>
              <span className="px-2">:</span>
              <span className="flex-1 font-bold text-navy-900">{student.apaarId}</span>
            </div>
          )}

          {student.aadharNo && (
            <div className="flex border-b border-dashed border-gray-200 pb-1.5 pl-6">
              <span className="w-58 font-semibold text-navy-900">Aadhar Card Number</span>
              <span className="px-2">:</span>
              <span className="flex-1 font-bold text-navy-900">{student.aadharNo}</span>
            </div>
          )}

          {student.panNumber && (
            <div className="flex border-b border-dashed border-gray-200 pb-1.5 pl-6">
              <span className="w-58 font-semibold text-navy-900">PAN Card Number</span>
              <span className="px-2">:</span>
              <span className="flex-1 font-bold text-navy-900">{student.panNumber}</span>
            </div>
          )}

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">6.</span>
            <span className="w-64 font-semibold">Date of Admission in School</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">{formatDate(student.admissionDate)}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">7.</span>
            <span className="w-64 font-semibold">Class in which Admitted</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">{student.class}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">8.</span>
            <span className="w-64 font-semibold">Class in which last studying / studied</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-bold text-navy-900">{student.lastClassAttended}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">9.</span>
            <span className="w-64 font-semibold">School Dues Cleared</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-bold text-schoolGreen-900">{student.duesCleared ? 'Yes' : 'No'}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">10.</span>
            <span className="w-64 font-semibold">Date of Leaving School</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800">{formatDate(student.tcIssueDate)}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">11.</span>
            <span className="w-64 font-semibold">Reason for Leaving</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-semibold text-gray-800 italic">{student.reasonForLeaving}</span>
          </div>

          <div className="flex border-b border-dashed border-gray-200 pb-1.5">
            <span className="w-6 text-navy-900 font-bold">12.</span>
            <span className="w-64 font-semibold">General Conduct</span>
            <span className="px-2">:</span>
            <span className="flex-1 font-bold text-navy-900">{student.conduct}</span>
          </div>
        </div>

        {/* 5. Declaration Certification */}
        <div className="pt-4 pb-2 text-center">
          <p className="font-bold text-navy-900 italic">
            Certified that the above information is in accordance with the school records.
          </p>
        </div>

        {/* 6. Signatures Area */}
        <div className="flex justify-between items-end pt-10 pb-8 mb-6 text-[10px] font-bold uppercase tracking-wider text-gray-900">
          <div className="text-center w-36">
            <div className="border-t border-gray-400 pt-1.5">
              Class Teacher
            </div>
          </div>
          
          <div className="text-center w-36">
            <div className="border-t border-gray-400 pt-1.5">
              Checked By
            </div>
          </div>

          <div className="text-center w-40">
            {/* Stamp location label placeholder */}
            <div className="h-8 w-24 mx-auto opacity-10 border border-navy-900 border-dashed rounded-full mb-1 flex items-center justify-center text-[7px] italic text-navy-900 leading-none">
              School Seal
            </div>
            <div className="border-t border-gray-400 pt-1.5">
              Principal Signature
            </div>
          </div>
        </div>

      </div>
    </div>
  );
});

TCTemplate.displayName = 'TCTemplate';

export default TCTemplate;
