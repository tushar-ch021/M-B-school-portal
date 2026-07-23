import React from 'react';
import DataTable from '../common/DataTable';
import { Eye, Edit2, UserX, ShieldAlert } from 'lucide-react';

const StudentTable = ({ 
  students, 
  loading, 
  onView, 
  onEdit, 
  onDelete 
}) => {
  const columns = [
    {
      header: 'Photo',
      key: 'photo',
      style: { width: '80px' },
      render: (student) => (
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-gray-50">
          {student.photo?.thumbnailUrl ? (
            <img
              src={student.photo.thumbnailUrl}
              alt={`${student.firstName} thumbnail`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <span className="text-xs font-bold text-gray-400">No Photo</span>
          )}
        </div>
      )
    },
    {
      header: 'Serial No',
      key: 'serialNo',
      className: 'font-semibold text-navy-900'
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (student) => (
        <span className="font-semibold text-gray-950">
          {student.firstName} {student.lastName}
        </span>
      )
    },
    {
      header: 'Class & Sec',
      key: 'classSection',
      render: (student) => (
        <span className="inline-flex items-center rounded-md bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-900 border border-navy-100">
          {student.class} - {student.section}
        </span>
      )
    },
    {
      header: "Father's Name",
      key: 'fatherName'
    },
    {
      header: 'Contact No',
      key: 'contactNo'
    },
    {
      header: 'Actions',
      key: 'actions',
      style: { width: '120px' },
      render: (student) => (
        <div className="flex items-center gap-2 no-print" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(student)}
            title="View Profile"
            className="rounded-lg p-1.5 text-navy-900 hover:bg-navy-50 transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onEdit(student)}
            title="Edit Details"
            className="rounded-lg p-1.5 text-schoolGreen-850 hover:bg-schoolGreen-50 transition-colors"
            style={{ color: '#2e7d32' }}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          
          <button
            onClick={() => onDelete(student)}
            title="Remove Student"
            className="rounded-lg p-1.5 text-red-650 hover:bg-red-50 transition-colors text-red-600"
          >
            <UserX className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={students}
      loading={loading}
      onRowClick={onView}
      emptyMessage="No students found matching your filters."
    />
  );
};

export default StudentTable;
