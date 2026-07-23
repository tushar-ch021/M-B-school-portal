import React, { useState, useEffect, useCallback } from 'react';
import studentService from '../services/studentService';
import SearchBar from '../components/common/SearchBar';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { UserX, RotateCcw, Calendar, MessageSquareText } from 'lucide-react';
import toast from 'react-hot-toast';

const RemovedStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Query Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Restore dialog
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const fetchRemovedStudents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await studentService.getRemovedStudents({
        className: selectedClass,
        section: selectedSection,
        search
      });
      // Support both paginated response and legacy array response
      // Defensive: ensure we always set an array to prevent e.map TypeError
      let studentsList = [];
      if (Array.isArray(data)) {
        studentsList = data;
      } else if (data && Array.isArray(data.students)) {
        studentsList = data.students;
      } else if (data && typeof data === 'object') {
        // Unexpected response shape — log and fall back to empty
        console.warn('getRemovedStudents returned unexpected shape:', data);
      }
      setStudents(studentsList);
    } catch (err) {
      toast.error('Failed to load removed students');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSection, search]);

  useEffect(() => {
    fetchRemovedStudents();
  }, [fetchRemovedStudents]);

  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return;

    setRestoreLoading(true);
    const toastId = toast.loading('Restoring student...');
    try {
      await studentService.restoreStudent(restoreTarget._id);
      toast.success(`${restoreTarget.firstName} ${restoreTarget.lastName} has been restored to active`, { id: toastId });
      setRestoreTarget(null);
      fetchRemovedStudents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to restore student', { id: toastId });
    } finally {
      setRestoreLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-2.5 text-red-600 border border-red-200">
            <UserX className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Removed Students</h2>
            <p className="text-xs text-gray-500 font-medium">
              Students removed from the active directory. You can restore them at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
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

      {/* Removed Students List */}
      <div className="rounded-card border border-gray-200 bg-white shadow-flat overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy-900 border-t-transparent" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <UserX className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No removed students found</p>
            <p className="text-xs mt-1">Students you remove from the directory will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Reg. No</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Removal Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Removed On</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Student Name & Photo */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex-shrink-0">
                          {student.photo?.thumbnailUrl ? (
                            <img src={student.photo.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-[10px] font-bold">
                              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-400">{student.fatherName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Serial No */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded">{student.serialNo}</span>
                    </td>

                    {/* Class */}
                    <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                      {student.class} - {student.section}
                    </td>

                    {/* Removal Reason */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="flex items-start gap-1.5">
                        <MessageSquareText className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{student.removalReason || '—'}</p>
                      </div>
                    </td>

                    {/* Removed Date */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(student.removedAt)}
                      </div>
                    </td>

                    {/* Restore Action */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setRestoreTarget(student)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-schoolGreen-800 bg-schoolGreen-800/5 px-3 py-1.5 text-xs font-bold text-schoolGreen-800 transition-colors hover:bg-schoolGreen-800 hover:text-white"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer count */}
        {!loading && students.length > 0 && (
          <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
            <p className="text-xs text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-600">{students.length}</span> removed student{students.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestoreConfirm}
        title="Restore Student"
        message={`Are you sure you want to restore ${restoreTarget?.firstName} ${restoreTarget?.lastName} (${restoreTarget?.serialNo}) back to the active student directory?`}
        confirmText="Restore Student"
        loading={restoreLoading}
      />
    </div>
  );
};

export default RemovedStudents;
