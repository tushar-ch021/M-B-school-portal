import React from 'react';
import { 
  User, 
  MapPin, 
  Bus, 
  Calendar, 
  Activity, 
  FileText, 
  CreditCard,
  UserX,
  Printer,
  Calculator
} from 'lucide-react';

const StudentProfile = ({ 
  student, 
  onCollectFee, 
  onUpdateDues,
  onIssueTC, 
  onGenerateID, 
  onPrintDetails,
  onRemove
}) => {
  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = () => {
    if (student.tcIssued) {
      return (
        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-200">
          TC Issued / Left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 border border-green-200">
        Active Student
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Hero Card info */}
      <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
        {/* Student Image Box - Uses original quality URL */}
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border-2 border-navy-900 bg-gray-50 shadow-md">
          {student.photo?.url ? (
            <img 
              src={student.photo.url} 
              alt={student.firstName} 
              className="h-full w-full object-cover" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <User className="h-12 w-12" />
            </div>
          )}
        </div>

        {/* Header content details */}
        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <h2 className="text-2xl font-extrabold text-navy-900">
              {student.firstName} {student.lastName}
            </h2>
            {getStatusBadge()}
          </div>
          
          <p className="text-sm text-gray-500 font-semibold">
            Student ID Serial: <span className="text-navy-900 font-bold">{student.serialNo}</span>
          </p>
          
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 text-sm text-gray-500 pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-schoolGreen-800" />
              Class {student.class} - Section {student.section}
            </span>
            <span className="flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-schoolGreen-800" />
              Roll No: {student.rollNo}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-schoolGreen-800" />
              {student.address?.city}, {student.address?.state}
            </span>
          </div>
        </div>

        {/* Action Center - Shortcuts */}
        <div className="flex flex-wrap md:flex-col gap-2 w-full md:w-auto shrink-0 no-print">
          <button
            onClick={onPrintDetails}
            className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print Info Form
          </button>
          
          <button
            onClick={onGenerateID}
            className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-navy-800 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Generate ID Card
          </button>

          {!student.tcIssued && (
            <>
              <button
                onClick={onCollectFee}
                className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg bg-schoolGreen-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-schoolGreen-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Collect Fee
              </button>
              
              <button
                onClick={onUpdateDues}
                className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg border border-amber-600 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                <Calculator className="h-4 w-4 text-amber-700" />
                Update Dues
              </button>

              <button
                onClick={onIssueTC}
                className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg bg-red-650 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-750 transition-colors"
                style={{ backgroundColor: '#c62828' }}
              >
                <UserX className="h-4 w-4" />
                Issue TC
              </button>
              
              <button
                onClick={onRemove}
                className="flex-1 md:w-44 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition-colors"
              >
                <UserX className="h-4 w-4" />
                Remove Student
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Structured profile sections */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        
        {/* Personal Details */}
        <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat">
          <h3 className="mb-4 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
            Student Particulars
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-gray-400">Date of Birth</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatDate(student.dob)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Gender</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.gender}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Blood Group</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.bloodGroup || 'Not Specified'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Category</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.category}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Parent Contact Number</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.fatherPhone || student.motherPhone || student.contactNo || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">APAAR ID</dt>
              <dd className="mt-0.5 font-medium text-navy-900 font-semibold">{student.apaarId || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Aadhar Number</dt>
              <dd className="mt-0.5 font-medium text-navy-900 font-semibold">{student.aadharNo || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">PAN Number</dt>
              <dd className="mt-0.5 font-medium text-navy-900 font-semibold">{student.panNumber || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Nationality</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.nationality || 'Indian'}</dd>
            </div>
          </dl>
        </div>

        {/* Academic Details */}
        <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat">
          <h3 className="mb-4 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
            Academic Status
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-gray-400">Class & Section</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.class} - {student.section}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Roll Number</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.rollNo || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Academic Cycle</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.academicYear}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Date of Admission</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{formatDate(student.admissionDate)}</dd>
            </div>
          </dl>
        </div>

        {/* Parent Details */}
        <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat">
          <h3 className="mb-4 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
            Parent / Guardian Details
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold text-gray-400">Father's Name {student.fatherQualification ? `(${student.fatherQualification})` : ''}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.fatherName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Father's Contact / Occupation</dt>
              <dd className="mt-0.5 text-xs font-medium text-gray-900">
                {student.fatherPhone} {student.fatherOccupation ? `(${student.fatherOccupation})` : ''}
              </dd>
            </div>
            <div className="sm:col-span-2 border-t border-gray-50 my-1" />
            <div>
              <dt className="text-xs font-semibold text-gray-400">Mother's Name {student.motherQualification ? `(${student.motherQualification})` : ''}</dt>
              <dd className="mt-0.5 font-medium text-gray-900">{student.motherName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-gray-400">Mother's Contact / Occupation</dt>
              <dd className="mt-0.5 text-xs font-medium text-gray-900">
                {student.motherPhone} {student.motherOccupation ? `(${student.motherOccupation})` : ''}
              </dd>
            </div>
            {student.officeAddress && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-400">Office Address</dt>
                <dd className="mt-0.5 text-xs font-medium text-gray-900">{student.officeAddress}</dd>
              </div>
            )}
            {student.email && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold text-gray-400">Communication Email</dt>
                <dd className="mt-0.5 text-xs font-medium text-navy-900 font-semibold">{student.email}</dd>
              </div>
            )}
            {student.guardianName && (
              <>
                <div className="sm:col-span-2 border-t border-gray-50 my-1" />
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold text-gray-400">Guardian Name</dt>
                  <dd className="mt-0.5 font-medium text-gray-900">{student.guardianName}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* Address and Transport */}
        <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat">
          <h3 className="mb-4 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
            Address & Transit Setup
          </h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-semibold text-gray-400">Residential Address</h4>
              <p className="mt-1 font-medium text-gray-900 leading-relaxed">
                {student.address?.current}, {student.address?.city}, {student.address?.state} - {student.address?.pincode}
              </p>
            </div>
            <div className="border-t border-gray-100 pt-3 flex items-center gap-4">
              <div className="rounded-full bg-navy-50 p-2 border border-navy-100">
                <Bus className="h-5 w-5 text-navy-900" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-gray-400">Transit Mode</h4>
                <p className="mt-0.5 font-semibold text-navy-900">
                  {student.usesTransport 
                    ? `School Transport Enabled (${student.transportRoute})`
                    : 'Self Arranged / Private Transport'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sibling Details */}
        {((student.siblings?.brother?.name) || (student.siblings?.sister?.name)) && (
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat md:col-span-2">
            <h3 className="mb-3 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              Details about Siblings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              {student.siblings?.brother?.name && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">a) Brother</span>
                  <p className="font-semibold text-gray-900">{student.siblings.brother.name}</p>
                  <p className="text-xs text-gray-500 font-medium">Class: {student.siblings.brother.class || 'N/A'} | School: {student.siblings.brother.school || 'N/A'}</p>
                </div>
              )}
              {student.siblings?.sister?.name && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">b) Sister</span>
                  <p className="font-semibold text-gray-900">{student.siblings.sister.name}</p>
                  <p className="text-xs text-gray-500 font-medium">Class: {student.siblings.sister.class || 'N/A'} | School: {student.siblings.sister.school || 'N/A'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Previous Schooling */}
        {student.previousSchool?.name && (
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat md:col-span-2">
            <h3 className="mb-3 text-xs font-bold text-navy-900 border-b border-gray-100 pb-2 uppercase tracking-wider">
              Previous Enrollment Details
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-400">Previous School Name</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.previousSchool.name}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-400">TC Code Number</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.previousSchool.tcNo || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* If TC is Issued, show TC details on profile */}
        {student.tcIssued && (
          <div className="rounded-card border border-red-200 bg-red-50/30 p-5 shadow-flat md:col-span-2">
            <h3 className="mb-3 text-xs font-bold text-red-900 border-b border-red-100 pb-2 uppercase tracking-wider">
              Transfer Certificate (TC) Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-red-800">TC Number</span>
                <p className="mt-0.5 font-bold text-navy-900">{student.tcNumber}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-800">Issue Date</span>
                <p className="mt-0.5 font-medium text-gray-900">{formatDate(student.tcIssueDate)}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-800">Dues Cleared</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.duesCleared ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-800">Class Attended</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.lastClassAttended}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-red-800">Conduct</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.conduct}</p>
              </div>
              <div className="sm:col-span-3">
                <span className="text-xs font-semibold text-red-800">Reason for Leaving</span>
                <p className="mt-0.5 font-medium text-gray-900">{student.reasonForLeaving}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
