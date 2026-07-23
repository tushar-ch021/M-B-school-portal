import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  UserX,
  Contact, 
  FileBadge, 
  Receipt, 
  CalendarCheck,
  UserCheck,
  Award,
  LogOut,
  X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../utils/brandingConfig';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { logout, admin } = useAuth();
  const { branding } = useBranding();

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Student Attendance', path: '/attendance/student', icon: CalendarCheck },
    { name: 'Staff Attendance', path: '/attendance/staff', icon: UserCheck },
    { name: 'Certificates', path: '/certificates', icon: Award },
    { name: 'Removed Students', path: '/students/removed', icon: UserX },
    { name: 'New Admission', path: '/admission/new', icon: UserPlus },
    { name: 'ID Cards', path: '/id-cards', icon: Contact },
    { name: 'Transfer Certificates', path: '/tc', icon: FileBadge },
    { name: 'Fee Management', path: '/fees', icon: Receipt }
  ];

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-navy-900 text-white transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header branding */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-navy-800">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="School Logo" 
              className="h-9 w-9 object-contain bg-white rounded-full p-0.5"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="font-bold text-xs leading-tight tracking-wider text-white uppercase max-w-[140px] truncate">
                {branding.schoolName}
              </h1>
              <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                Admin Portal
              </span>
            </div>
          </div>
          
          <button 
            onClick={toggleSidebar} 
            className="rounded-lg p-1 text-gray-400 hover:bg-navy-800 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Link Items */}
        <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) {
                  toggleSidebar();
                }
              }}
              className={({ isActive }) => {
                const isCustomActive = item.path === '/students'
                  ? window.location.pathname.startsWith('/students') && !window.location.pathname.startsWith('/students/removed')
                  : isActive;
                return `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isCustomActive
                    ? 'bg-schoolGreen-800 text-white'
                    : 'text-gray-300 hover:bg-navy-800 hover:text-white'
                }`;
              }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Administrator profile and logout card */}
        <div className="border-t border-navy-800 p-4">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-sm font-semibold uppercase text-schoolGreen-100 border border-schoolGreen-800">
              {admin?.name?.substring(0, 2) || 'AD'}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-semibold text-white">{admin?.name}</p>
              <p className="truncate text-[10px] text-gray-400">{admin?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-xs font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Logout Account
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
