import React, { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import { getCertificates, deleteCertificate } from '../services/certificateService';
import CertificateGenerator from '../components/certificate/CertificateGenerator';
import ClassSectionFilter from '../components/common/ClassSectionFilter';
import SearchBar from '../components/common/SearchBar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Award, FileText, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const Certificates = () => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' | 'issued'

  // Student selection state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Issued certificates list state & filters
  const [issuedCertificates, setIssuedCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [issuedClass, setIssuedClass] = useState('');
  const [issuedSection, setIssuedSection] = useState('');
  const [issuedSearch, setIssuedSearch] = useState('');

  // Fetch students based on filters
  useEffect(() => {
    setLoadingStudents(true);
    studentService.getStudents({
      className: selectedClass,
      section: selectedSection,
      search: searchQuery,
      limit: 100
    })
      .then((res) => {
        const stList = res?.students || res?.data?.students || [];
        setStudents(stList);
        if (stList.length > 0) {
          const exists = stList.find((s) => s._id === selectedStudent?._id);
          setSelectedStudent(exists || stList[0]);
        } else {
          setSelectedStudent(null);
        }
      })
      .catch((err) => toast.error('Failed to load students'))
      .finally(() => setLoadingStudents(false));
  }, [selectedClass, selectedSection, searchQuery]);

  // Fetch issued certificates
  const fetchIssuedCertificates = () => {
    setLoadingCertificates(true);
    getCertificates()
      .then((res) => {
        if (res?.data) {
          setIssuedCertificates(res.data);
        }
      })
      .catch((err) => toast.error('Failed to load issued certificates list'))
      .finally(() => setLoadingCertificates(false));
  };

  useEffect(() => {
    if (activeTab === 'issued') {
      fetchIssuedCertificates();
    }
  }, [activeTab]);

  const handleDeleteCertificate = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this certificate?')) return;
    try {
      await deleteCertificate(id);
      toast.success('Certificate revoked successfully');
      fetchIssuedCertificates();
    } catch (err) {
      toast.error('Failed to revoke certificate');
    }
  };

  const filteredIssuedCertificates = issuedCertificates.filter((cert) => {
    const stClass = cert.student?.class || '';
    const stSec = cert.student?.section || '';
    const name = cert.student ? `${cert.student.firstName} ${cert.student.lastName}` : '';

    if (issuedClass && stClass.toLowerCase() !== issuedClass.toLowerCase()) return false;
    if (issuedSection && stSec.toLowerCase() !== issuedSection.toLowerCase()) return false;
    if (issuedSearch) {
      const q = issuedSearch.toLowerCase();
      const matchName = name.toLowerCase().includes(q);
      const matchCertNo = (cert.certificateNo || '').toLowerCase().includes(q);
      const matchTitle = (cert.title || '').toLowerCase().includes(q);
      if (!matchName && !matchCertNo && !matchTitle) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-navy-900 flex items-center gap-2">
            <Award className="h-7 w-7 text-schoolGreen-800" />
            Certificate Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Issue, preview, print, and track student achievement & conduct certificates.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
          <button
            onClick={() => setActiveTab('generate')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'generate'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="h-4 w-4" />
            Issue New Certificate
          </button>
          <button
            onClick={() => setActiveTab('issued')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-md transition-all ${
              activeTab === 'issued'
                ? 'bg-navy-900 text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="h-4 w-4" />
            Issued Certificates Log
          </button>
        </div>
      </div>

      {/* TAB 1: ISSUE NEW CERTIFICATE */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          {/* Class & Section Filter for Student selection */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ClassSectionFilter
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
                selectedSection={selectedSection}
                onSectionChange={setSelectedSection}
                showAllOption={true}
              />
              <div className="w-full sm:w-64">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search student name..."
                />
              </div>
            </div>

            {/* Students List Selection Pills */}
            {loadingStudents ? (
              <div className="py-6 flex justify-center"><LoadingSpinner /></div>
            ) : students.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <label className="text-xs font-bold text-navy-900 uppercase tracking-wider">
                  Select Student:
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                  {students.map((st) => (
                    <button
                      key={st._id}
                      onClick={() => setSelectedStudent(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedStudent?._id === st._id
                          ? 'bg-navy-900 text-white border-navy-900 shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {st.firstName} {st.lastName} (Class {st.class}-{st.section})
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-2">No students found matching current filters. Please select a different class or section.</p>
            )}
          </div>

          {/* Certificate Generator UI */}
          <CertificateGenerator
            student={selectedStudent}
            onCertificateSaved={() => {
              // optional callback
            }}
          />
        </div>
      )}

      {/* TAB 2: ISSUED CERTIFICATES LOG */}
      {activeTab === 'issued' && (
        <div className="space-y-4">
          {/* Class & Section Filter Bar for Issued Certificates */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat flex flex-wrap items-center justify-between gap-4">
            <ClassSectionFilter
              selectedClass={issuedClass}
              onClassChange={setIssuedClass}
              selectedSection={issuedSection}
              onSectionChange={setIssuedSection}
              showAllOption={true}
            />
            <div className="w-full sm:w-64">
              <SearchBar
                value={issuedSearch}
                onChange={setIssuedSearch}
                placeholder="Search cert no or student..."
              />
            </div>
          </div>

          <div className="rounded-card border border-gray-200 bg-white shadow-flat overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 font-bold text-navy-900 text-sm flex justify-between items-center">
              <span>Issued Certificate Records</span>
              <span className="text-xs text-gray-500 font-normal">
                Showing {filteredIssuedCertificates.length} of {issuedCertificates.length} records
              </span>
            </div>

            {loadingCertificates ? (
              <div className="py-12 flex justify-center"><LoadingSpinner /></div>
            ) : filteredIssuedCertificates.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-sm">
                No certificate records found matching selected Class & Section filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-100 text-gray-600 uppercase font-bold tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Cert No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class & Sec</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Issue Date</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150">
                    {filteredIssuedCertificates.map((cert) => (
                      <tr key={cert._id} className="hover:bg-gray-50/70">
                        <td className="py-3 px-4 font-mono font-bold text-navy-900">
                          {cert.certificateNo}
                        </td>
                        <td className="py-3 px-4 font-semibold text-gray-900">
                          {cert.student ? `${cert.student.firstName} ${cert.student.lastName}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-bold text-navy-900">
                          {cert.student ? `Class ${cert.student.class}-${cert.student.section}` : 'N/A'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy-50 text-navy-900 border border-navy-200">
                            {cert.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-700 font-medium">{cert.title}</td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCertificate(cert._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Revoke Certificate"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates;
