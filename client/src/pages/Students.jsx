import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import studentService from '../services/studentService';
import StudentTable from '../components/students/StudentTable';
import SearchBar from '../components/common/SearchBar';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import Modal from '../components/common/Modal';
import { UserPlus, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Query Filters state
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(''); // Defaults to all classes
  const [selectedSection, setSelectedSection] = useState(''); // Defaults to all sections
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Remove dialog control states
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removeLoading, setRemoveLoading] = useState(false);

  const navigate = useNavigate();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedSection, search]);

  // Unified student loading data caller
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getStudents({
        className: selectedClass,
        section: selectedSection,
        search,
        page: currentPage,
        limit: 20
      });
      setStudents(Array.isArray(data?.students) ? data.students : []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      toast.error('Failed to query students records from database');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, search, currentPage]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleRowClick = (student) => {
    navigate(`/students/profile/${student._id}`);
  };

  const handleEditClick = (student) => {
    navigate(`/students/profile/${student._id}?edit=true`);
  };

  const handleRemoveTrigger = (student) => {
    setRemoveTarget(student);
    setRemoveReason('');
  };

  const handleRemoveConfirm = async () => {
    if (!removeTarget) return;
    if (!removeReason.trim()) {
      toast.error('Please enter a reason for removing this student');
      return;
    }

    setRemoveLoading(true);
    const toastId = toast.loading('Removing student...');
    try {
      await studentService.removeStudent(removeTarget._id, removeReason.trim());
      toast.success(`${removeTarget.firstName} ${removeTarget.lastName} has been removed`, { id: toastId });
      setRemoveTarget(null);
      setRemoveReason('');
      fetchStudents(); // Refresh lists
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Failed to remove student', { id: toastId });
    } finally {
      setRemoveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Actions row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Students Directory</h2>
          <p className="text-xs text-gray-500 font-medium">
            Search, filter, edit, or remove student accounts. Click a row to view full details.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admission/new')}
            className="flex items-center gap-2 rounded-lg bg-navy-900 px-4 py-2.5 text-xs font-bold text-white shadow-premium transition-colors hover:bg-navy-800"
          >
            <UserPlus className="h-4 w-4" />
            Admit Student
          </button>
        </div>
      </div>

      {/* 2. Search & Double selectors filters bar */}
      <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <SearchBar value={search} onChange={setSearch} />
        
        <ClassSectionFilter
          selectedClass={selectedClass}
          onClassChange={setSelectedClass}
          selectedSection={selectedSection}
          onSectionChange={setSelectedSection}
          showAllOption={true}
        />
      </div>

      {/* 3. Students Data Table */}
      <StudentTable
        students={students}
        loading={loading}
        onView={handleRowClick}
        onEdit={handleEditClick}
        onDelete={handleRemoveTrigger}
      />

      {/* Pagination Controls */}
      {!loading && totalCount > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-lg border border-gray-200 p-4 shadow-flat no-print">
          <p className="text-xs text-gray-500 font-medium">
            Showing <span className="font-bold text-navy-900">{Math.min((currentPage - 1) * 20 + 1, totalCount)}</span> to{' '}
            <span className="font-bold text-navy-900">{Math.min(currentPage * 20, totalCount)}</span> of{' '}
            <span className="font-bold text-navy-900">{totalCount}</span> entries
          </p>
          
          <div className="flex items-center gap-1.5 self-center">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
              .map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                    currentPage === pageNum
                      ? 'bg-navy-900 text-white'
                      : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* 4. Remove Student Dialog with Reason Input */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Student"
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              You are about to remove <span className="font-bold text-gray-900">{removeTarget?.firstName} {removeTarget?.lastName}</span> ({removeTarget?.serialNo}) from the active student directory.
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
              onClick={() => setRemoveTarget(null)}
              disabled={removeLoading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="button"
              onClick={handleRemoveConfirm}
              disabled={removeLoading || !removeReason.trim()}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {removeLoading ? 'Removing...' : 'Remove Student'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Students;
