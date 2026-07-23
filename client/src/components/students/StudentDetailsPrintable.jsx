import React, { forwardRef } from 'react';
import { User, Phone, MapPin, School, Info, Heart } from 'lucide-react';
import { useBranding } from '../../utils/brandingConfig';

const StudentDetailsPrintable = forwardRef(({ student }, ref) => {
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

  return (
    <div 
      ref={ref}
      className="print-container bg-white p-5 max-w-[800px] mx-auto border border-gray-200 text-gray-900 shadow-md font-sans text-xs relative"
      style={{ boxSizing: 'border-box' }}
    >
      {/* 1. School Header Block */}
      <div className="flex items-center justify-between border-b-2 border-navy-900 pb-2 mb-4">
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="School Logo" 
            className="h-14 w-14 object-contain"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <div>
            <h1 className="text-lg font-black text-navy-900 leading-tight uppercase tracking-wider">
              {branding.schoolName}
            </h1>
            <p className="text-[11px] text-gray-600 font-bold leading-tight uppercase">
              {branding.schoolAddress}
            </p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5 font-semibold">
              Phone: {branding.schoolPhone1}, {branding.schoolPhone2}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-block rounded-md bg-navy-900 text-white font-bold px-2.5 py-1 text-[10px] uppercase tracking-wider">
            Registration Form
          </span>
          <p className="text-[11px] font-semibold text-gray-400 mt-1.5">
            REGISTRATION NO: <span className="text-navy-900 font-bold">{student.serialNo}</span>
          </p>
        </div>
      </div>

      {/* 2. Photo and Core identity block */}
      <div className="flex flex-row gap-4 items-start justify-between bg-gray-50 p-3 rounded-lg border border-gray-150 mb-4">
        <div className="space-y-1">
          <h2 className="text-base font-black text-navy-900 uppercase">
            {student.firstName} {student.lastName}
          </h2>
          <p className="text-xs font-bold text-gray-500">
            Class to which admission is sought: <span className="text-navy-900 font-semibold">{student.class}</span>
          </p>
          <p className="text-xs font-bold text-gray-500">
            Section: <span className="text-navy-900 font-semibold">{student.section}</span>
          </p>
          <p className="text-xs font-bold text-gray-500">
            Roll Number: <span className="text-navy-900 font-semibold">{student.rollNo}</span>
          </p>
          <p className="text-xs font-bold text-gray-500">
            Admission Date: <span className="text-navy-900 font-semibold">{formatDate(student.admissionDate)}</span>
          </p>
        </div>
        
        {/* Student Photo */}
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md border border-gray-300 bg-white shadow-xs">
          {student.photo?.url ? (
            <img 
              src={student.photo.url} 
              alt={`${student.firstName} ${student.lastName}`} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <User className="h-8 w-8" />
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed Parameter Tables */}
      <div className="space-y-4">
        
        {/* Table 1: Student Particulars */}
        <div>
          <h3 className="text-[10px] font-bold text-navy-900 uppercase tracking-widest border-b border-navy-900/10 pb-0.5 mb-1.5 flex items-center gap-1.5">
            <Info className="h-3 w-3 text-navy-900" />
            Student Particulars
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Date of Birth</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{formatDate(student.dob)}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Aadhar No.</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.aadharNo || 'N/A'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Nationality</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.nationality || 'Indian'}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Category (Gen/SC/ST/OBC)</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.category}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Blood Group</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.bloodGroup || 'N/A'}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">APAAR ID</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.apaarId || 'N/A'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">School Last Attended</td>
                <td className="border border-gray-200 px-2.5 py-1" colSpan={3}>
                  {student.previousSchool?.name || 'N/A'} {student.previousSchool?.tcNo ? `(TC No: ${student.previousSchool.tcNo})` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table 2: Parents details */}
        <div>
          <h3 className="text-[10px] font-bold text-navy-900 uppercase tracking-widest border-b border-navy-900/10 pb-0.5 mb-1.5 flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-navy-900" />
            Parents Details
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Father's Name</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.fatherName}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Father's Qualification</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.fatherQualification || 'N/A'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Mother's Name</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.motherName}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Mother's Qualification</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.motherQualification || 'N/A'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Occupation</td>
                <td className="border border-gray-200 px-2.5 py-1" colSpan={3}>
                  {student.fatherOccupation ? `Father: ${student.fatherOccupation}` : ''} 
                  {student.motherOccupation ? ` | Mother: ${student.motherOccupation}` : ''}
                  {!student.fatherOccupation && !student.motherOccupation ? 'N/A' : ''}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Office Address</td>
                <td className="border border-gray-200 px-2.5 py-1" colSpan={3}>{student.officeAddress || 'N/A'}</td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Permanent Address</td>
                <td className="border border-gray-200 px-2.5 py-1" colSpan={3}>
                  {student.address?.current}, {student.address?.city}, {student.address?.state} - {student.address?.pincode}
                </td>
              </tr>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">Telephone No.</td>
                <td className="border border-gray-200 px-2.5 py-1">
                  {student.contactNo} {student.fatherPhone ? `(F: ${student.fatherPhone})` : ''} {student.motherPhone ? `(M: ${student.motherPhone})` : ''}
                </td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1">E-mail</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.email || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table 3: Siblings details */}
        <div>
          <h3 className="text-[10px] font-bold text-navy-900 uppercase tracking-widest border-b border-navy-900/10 pb-0.5 mb-1.5 flex items-center gap-1.5">
            <Heart className="h-3 w-3 text-navy-900" />
            Details about Siblings
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500">
                <th className="border border-gray-200 px-2.5 py-1 w-1/3">Sibling Relation</th>
                <th className="border border-gray-200 px-2.5 py-1 w-1/3">Class</th>
                <th className="border border-gray-200 px-2.5 py-1 w-1/3">School Name</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 px-2.5 py-1">
                  <span className="font-semibold text-gray-400">a) Brother:</span> {student.siblings?.brother?.name || 'N/A'}
                </td>
                <td className="border border-gray-200 px-2.5 py-1">{student.siblings?.brother?.class || 'N/A'}</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.siblings?.brother?.school || 'N/A'}</td>
              </tr>
              <tr>
                <td className="border border-gray-200 px-2.5 py-1">
                  <span className="font-semibold text-gray-400">b) Sister:</span> {student.siblings?.sister?.name || 'N/A'}
                </td>
                <td className="border border-gray-200 px-2.5 py-1">{student.siblings?.sister?.class || 'N/A'}</td>
                <td className="border border-gray-200 px-2.5 py-1">{student.siblings?.sister?.school || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Table 4: Bus/Transport Options */}
        <div>
          <h3 className="text-[10px] font-bold text-navy-900 uppercase tracking-widest border-b border-navy-900/10 pb-0.5 mb-1.5 flex items-center gap-1.5">
            <School className="h-3 w-3 text-navy-900" />
            Transport Details
          </h3>
          <table className="w-full text-[11px] text-left border-collapse border border-gray-200">
            <tbody>
              <tr>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Uses School Bus</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.usesTransport ? 'Yes' : 'No'}</td>
                <td className="bg-gray-50 font-bold border border-gray-200 px-2.5 py-1 w-1/4">Route / Bus No.</td>
                <td className="border border-gray-200 px-2.5 py-1 w-1/4">{student.usesTransport ? student.transportRoute : 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Declarations and Signatures area */}
      <div className="mt-5 pt-3 border-t border-gray-150 text-[10px] text-gray-600 leading-normal space-y-3">
        <p className="font-medium text-gray-500 leading-relaxed text-[9px]">
          Certified that the information given in the application is true to the best of my knowledge.
          Certified that I shall abide by rules as laid down by the school from time to time.
        </p>
        
        <div className="flex justify-between items-end pt-5">
          <div className="text-left w-32 text-[10px]">
            <span className="font-semibold text-gray-400">Date:</span> ________________
          </div>
          <div className="text-center w-48 border-t border-gray-300 pt-1 font-bold uppercase tracking-wider text-[9px]">
            Signature of Parents / Guardian
          </div>
          <div className="text-center w-36 border-t border-gray-300 pt-1 font-bold uppercase tracking-wider text-[9px]">
            Principal Signature
          </div>
        </div>
      </div>
    </div>
  );
});

StudentDetailsPrintable.displayName = 'StudentDetailsPrintable';

export default StudentDetailsPrintable;
