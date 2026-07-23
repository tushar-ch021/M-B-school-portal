import React from 'react';
import { Menu, User, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../utils/brandingConfig';
import { useLocation } from 'react-router-dom';

const Topbar = ({ toggleSidebar }) => {
  const { admin } = useAuth();
  const { branding } = useBranding();
  const location = useLocation();

  // Dynamically compute the page title header from pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/students') return 'Students Database';
    if (path.includes('/admission/new')) return 'New Admission Enrollment';
    if (path.includes('/students/profile/')) return 'Student Profile Details';
    if (path === '/id-cards') return 'ID Cards Center';
    if (path === '/tc') return 'Transfer Certificates Portal';
    if (path === '/fees') return 'Fee Management and Invoicing';
    return branding.schoolName;
  };

  const getTodayFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-xs no-print">
      <div className="flex items-center gap-4">
        {/* Toggle Hamburger button for mobile */}
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        <h2 className="text-lg font-bold text-navy-900 md:text-xl">
          {getPageTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Today's Date Display */}
        <div className="hidden items-center gap-2 text-sm text-gray-500 lg:flex">
          <Calendar className="h-4 w-4 text-schoolGreen-800" />
          <span>{getTodayFormattedDate()}</span>
        </div>

        {/* Admin profile quick badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-gray-950">{admin?.name}</p>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Authorized Administrator
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-50 text-navy-900 border border-navy-100 shadow-xs">
            <User className="h-4.5 w-4.5 text-navy-900" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
