import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import feeService from '../services/feeService';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../utils/brandingConfig';
import StatCard from '../components/common/StatCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { 
  Users, 
  CalendarDays, 
  IndianRupee, 
  Bus, 
  UserPlus, 
  CreditCard, 
  FileText,
  ArrowRight,
  Upload,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { branding } = useBranding();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [confirmDeleteSig, setConfirmDeleteSig] = useState(false);
  const [dashboardClass, setDashboardClass] = useState('');
  const [dashboardSection, setDashboardSection] = useState('');
  const navigate = useNavigate();
  const { admin, updateSignature } = useAuth();

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await feeService.getDashboardStats(dashboardClass, dashboardSection);
        if (!cancelled) setStats(data);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load dashboard metrics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [dashboardClass, dashboardSection]);

  const handleSignatureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('signature', file);

    setUploadingSig(true);
    const toastId = toast.loading('Uploading Principal Signature to Cloudinary...');
    try {
      const data = await authService.uploadSignature(formData);
      updateSignature(data.signatureUrl);
      toast.success('Signature uploaded successfully!', { id: toastId });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to upload signature image';
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingSig(false);
    }
  };

  const handleSignatureDelete = async () => {
    setConfirmDeleteSig(true);
  };

  const confirmSignatureDelete = async () => {
    setConfirmDeleteSig(false);
    setUploadingSig(true);
    const toastId = toast.loading('Removing Principal Signature...');
    try {
      await authService.deleteSignature();
      updateSignature('');
      toast.success('Signature deleted successfully!', { id: toastId });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to delete signature';
      toast.error(errMsg, { id: toastId });
    } finally {
      setUploadingSig(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const {
    totalStudents = 0,
    studentsThisYear = 0,
    transportStudents = 0,
    monthlyFeeCollected = 0,
    recentAdmissions = []
  } = stats || {};

  // Defensive: ensure recentAdmissions is always an array to prevent .map() TypeError
  const safeRecentAdmissions = Array.isArray(recentAdmissions) ? recentAdmissions : [];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-card bg-navy-900 text-white p-6 shadow-premium relative overflow-hidden flex items-center justify-between min-h-[120px]">
        <div className="relative z-10 space-y-1">
          <h2 className="text-xl font-extrabold md:text-2xl">{branding.schoolName}</h2>
          <p className="text-xs text-gray-300 font-medium max-w-lg">
            Welcome to the internal administrative dashboard. Monitor registrations, billing, and document requests.
          </p>
        </div>
        <img 
          src="/logo.png" 
          alt={`${branding.schoolCode} Emblem`} 
          className="hidden sm:block h-16 w-16 object-contain opacity-25 relative z-10" 
        />
      </div>

      {/* Class filter bar */}
      <div className="rounded-card border border-gray-200 bg-white p-4 shadow-flat flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div>
          <h3 className="text-sm font-black text-navy-900">Dashboard Metrics</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase">
            Viewing {dashboardClass ? `Class: ${dashboardClass}` : 'All Classes'} {dashboardSection && `| Section: ${dashboardSection}`}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Filter Class:</label>
            <select
              value={dashboardClass}
              onChange={(e) => setDashboardClass(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 font-bold shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            >
              <option value="">All Classes</option>
              {['Nursery', 'LKG', 'UKG', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'].map((cls) => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Filter Section:</label>
            <select
              value={dashboardSection}
              onChange={(e) => setDashboardSection(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 font-bold shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
            >
              <option value="">All Sections</option>
              {['A', 'B', 'C', 'D'].map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 1. Stat cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Active Students"
          value={totalStudents}
          icon={Users}
          description="Cumulative active database records"
          trendColor="navy"
        />
        <StatCard
          title="Admissions This Cycle"
          value={studentsThisYear}
          icon={CalendarDays}
          description="Enrolled in current academic year"
          trendColor="navy"
        />
        <StatCard
          title="Fee Collected (Month)"
          value={`₹${monthlyFeeCollected.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          description="Fees collected in the current calendar month"
          trendColor="green"
        />
        <StatCard
          title="Transport Commuters"
          value={transportStudents}
          icon={Bus}
          description="Students using school bus route details"
          trendColor="green"
        />
      </div>

      {/* 2. Grid split: Shortcuts & Signature on left, Recent Admissions on right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column wrapper */}
        <div className="space-y-6 lg:col-span-1">
          {/* Quick Shortcuts */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider border-b border-gray-150 pb-2">
              Administrative Shortcuts
            </h3>
            
            <div className="grid grid-cols-1 gap-2.5">
              <button
                onClick={() => navigate('/admission/new')}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 text-left text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50"
              >
                <span className="flex items-center gap-2.5">
                  <UserPlus className="h-4.5 w-4.5 text-schoolGreen-800" />
                  Register New Student
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
              
              <button
                onClick={() => navigate('/id-cards')}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 text-left text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50"
              >
                <span className="flex items-center gap-2.5">
                  <CreditCard className="h-4.5 w-4.5 text-schoolGreen-800" />
                  Print Student ID Cards
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>

              <button
                onClick={() => navigate('/tc')}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 text-left text-xs font-bold text-navy-900 transition-colors hover:bg-navy-50"
              >
                <span className="flex items-center gap-2.5">
                  <FileText className="h-4.5 w-4.5 text-schoolGreen-800" />
                  Transfer Certificate Center
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Signature Settings Card */}
          <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat space-y-4">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider border-b border-gray-150 pb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-4.5 w-4.5 text-schoolGreen-800" />
              Signature Settings
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <p className="text-gray-500 leading-normal">
                Upload a scanned image of the Principal's Signature (transparent background recommended) to display it automatically on student ID Cards.
              </p>

              {admin?.signatureUrl ? (
                <div className="flex items-center gap-4 p-2 bg-gray-50 rounded-lg border border-gray-150">
                  <div className="h-10 w-24 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={admin.signatureUrl} 
                      alt="Principal Signature" 
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-navy-900 truncate">Current Signature</p>
                    <button
                      onClick={handleSignatureDelete}
                      disabled={uploadingSig}
                      className="text-[10px] text-red-650 font-bold hover:underline"
                      style={{ color: '#c62828' }}
                    >
                      Delete Signature
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-red-50/50 rounded-lg border border-red-100 flex items-center gap-2.5 text-red-800">
                  <FileText className="h-4.5 w-4.5 shrink-0" />
                  <p className="font-semibold text-[11px]">No signature uploaded. ID Cards will display a blank space.</p>
                </div>
              )}

              <div className="pt-1">
                <label 
                  className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/50 py-3.5 px-4 text-center cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-400"
                  style={{
                    pointerEvents: uploadingSig ? 'none' : 'auto',
                    opacity: uploadingSig ? 0.6 : 1
                  }}
                >
                  <Upload className="h-4 w-4 text-gray-400" />
                  <span className="font-bold text-gray-700">
                    {uploadingSig ? 'Uploading Signature...' : 'Upload New Signature'}
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleSignatureUpload}
                    disabled={uploadingSig}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Recent admissions list (last 5) */}
        <div className="rounded-card border border-gray-200 bg-white p-5 shadow-flat lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-150 pb-2">
            <h3 className="text-xs font-bold text-navy-900 uppercase tracking-wider">
              Recent Admissions (Last 5)
            </h3>
            <button 
              onClick={() => navigate('/students')}
              className="text-[10px] font-bold text-navy-900 uppercase hover:underline"
            >
              View All Databases
            </button>
          </div>

          {safeRecentAdmissions.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-gray-400">
              No recent student records found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {safeRecentAdmissions.map((student) => (
                <div key={student._id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-full border border-gray-250 bg-gray-50">
                      {student.photo?.thumbnailUrl ? (
                        <img 
                          src={student.photo.thumbnailUrl} 
                          alt={student.firstName} 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-300">
                          <Users className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-navy-900">
                        {student.firstName} {student.lastName}
                      </h4>
                      <p className="text-[10px] text-gray-400">
                        Serial: <span className="font-semibold text-gray-600">{student.serialNo}</span> | Class: <span className="font-semibold text-gray-600">{student.class} - {student.section}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/students/profile/${student._id}`)}
                    className="rounded-md border border-gray-250 bg-white px-3 py-1.5 text-[10px] font-bold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Signature Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDeleteSig}
        onClose={() => setConfirmDeleteSig(false)}
        onConfirm={confirmSignatureDelete}
        title="Delete Principal Signature"
        message="Are you sure you want to delete the Principal's Signature? ID Cards will display a blank signature space."
        confirmText="Delete Signature"
      />
    </div>
  );
};

export default Dashboard;
