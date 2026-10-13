import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  HelpCircle,
  Activity,
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  ShieldAlert,
  FileCheck2,
  Settings,
  Award,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const studentLinks = [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/exams', icon: FileText, label: 'Available Examinations' },
    { to: '/profile', icon: Settings, label: 'Profile & Settings' },
  ];

  const facultyLinks = [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/exams/create', icon: PlusCircle, label: 'Create Examination' },
    { to: '/faculty/question-bank', icon: HelpCircle, label: 'Question Bank' },
    { to: '/faculty/reports', icon: BarChart3, label: 'Evaluation & Reports' },
    { to: '/profile', icon: Settings, label: 'Profile & Settings' },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'System Overview' },
    { to: '/admin/users', icon: Users, label: 'User Management' },
    { to: '/admin/courses', icon: BookOpen, label: 'Courses & Subjects' },
    { to: '/admin/schedule', icon: Calendar, label: 'Exam Scheduling' },
    { to: '/admin/security', icon: ShieldAlert, label: 'Security & Proctoring' },
    { to: '/admin/audit-logs', icon: FileCheck2, label: 'Audit Trail' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Reports & Analytics' },
    { to: '/profile', icon: Settings, label: 'Profile & Settings' },
  ];

  const links =
    user.role === 'ADMIN'
      ? adminLinks
      : user.role === 'FACULTY'
      ? facultyLinks
      : studentLinks;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed lg:sticky top-16 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-200 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="py-5 px-4 overflow-y-auto flex-1">
          <div className="px-3 mb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {user.role} WORKSPACE
            </span>
          </div>

          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={onClose}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive
                      ? 'bg-navy-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${
                      isActive ? 'text-royal-300' : 'text-slate-400'
                    }`}
                  />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info banner */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-semibold text-navy-900 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Proctoring Engine</span>
            </div>
            <p className="text-[11px] text-slate-500">
              AI verification & tab monitor active.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
