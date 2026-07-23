import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import IDCardGenerator from '../components/idcard/IDCardGenerator';
import { Contact, CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const IDCards = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filter queries
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const data = await studentService.getStudents({
          className: selectedClass,
          section: selectedSection,
          search,
          limit: 1000 // Get all matched students for ID cards view
        });
        const studentList = resList(data);
        setStudents(studentList);
        
        // Auto-select first student if available and none selected
        if (studentList.length > 0) {
          const exists = studentList.find(s => s._id === selectedStudent?._id);
          setSelectedStudent(exists || studentList[0]);
        } else {
          setSelectedStudent(null);
        }
      } catch (err) {
        toast.error('Failed to retrieve students for ID Cards');
      } finally {
        setLoading(false);
      }
    };

    const resList = (data) => {
      if (Array.isArray(data?.students)) return data.students;
      if (Array.isArray(data)) return data;
      return [];
    };

    fetchStudents();
  }, [selectedClass, selectedSection, search]);

  const columns = [
    {
      header: 'Serial No',
      key: 'serialNo',
      className: 'font-semibold text-navy-900'
    },
    {
      header: 'Student Name',
      key: 'name',
      render: (s) => (
        <span className="font-semibold text-gray-900">
          {s.firstName} {s.lastName}
        </span>
      )
    },
    {
      header: 'Class / Sec',
      key: 'classSection',
      render: (s) => `${s.class} - ${s.section}`
    },
    {
      header: 'Select',
      key: 'select',
      style: { width: '80px' },
      render: (s) => (
        <button
          onClick={() => setSelectedStudent(s)}
          className={`flex items-center justify-center p-1.5 rounded-lg border transition-colors ${
            selectedStudent?._id === s._id
              ? 'bg-navy-900 border-navy-900 text-white'
              : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="no-print">
        <h2 className="text-xl font-extrabold text-navy-900 md:text-2xl">Identity Cards Center</h2>
        <p className="text-xs text-gray-500 font-medium">
          Select class-section directories and generate physical ID cards containing high-resolution photos.
        </p>
      </div>

      {/* Main split viewport layout */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        
        {/* Left Column: Directories filter and Student Table */}
        <div className="space-y-4 no-print">
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-col gap-4">
            <SearchBar 
              value={search} 
              onChange={setSearch} 
              placeholder="Search by student name or serial..." 
            />
            
            <ClassSectionFilter
              selectedClass={selectedClass}
              onClassChange={setSelectedClass}
              selectedSection={selectedSection}
              onSectionChange={setSelectedSection}
              showAllOption={true}
            />
          </div>

          <DataTable
            columns={columns}
            data={students}
            loading={loading}
            onRowClick={(student) => setSelectedStudent(student)}
            emptyMessage="No students found in this class."
          />
        </div>

        {/* Right Column: ID Card print preview actions */}
        <div className="space-y-4">
          {selectedStudent ? (
            <div className="rounded-card border border-gray-200 bg-white p-6 shadow-flat space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-150 pb-3 no-print">
                <div className="rounded-full bg-navy-50 p-2 border border-navy-100 text-navy-900">
                  <Contact className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-900">
                    Selected: {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-xs text-gray-400">Class {selectedStudent.class} - Section {selectedStudent.section}</p>
                </div>
              </div>

              {/* ID Card Generator preview panel */}
              <IDCardGenerator student={selectedStudent} />
            </div>
          ) : (
            <div className="flex h-80 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white text-gray-400 text-sm no-print">
              <div className="text-center p-6">
                <CreditCard className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p>Please select a student from the directory to load ID Card</p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default IDCards;
