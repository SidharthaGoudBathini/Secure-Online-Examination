import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Bell,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-purple-200">Admin</span>;
      case 'FACULTY':
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Faculty</span>;
      case 'STUDENT':
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand / Logo */}
        <div className="flex items-center space-x-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-sm group-hover:bg-royal-600 transition">
              <Shield className="w-6 h-6 text-royal-300" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-navy-900 leading-tight block tracking-tight">
                SecureExam
              </span>
              <span className="text-[10px] uppercase font-semibold text-royal-600 tracking-wider hidden sm:block">
                Secure. Fair. Reliable.
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Quick Switch Roles for Evaluation / Testing */}
        {user && (
          <div className="hidden md:flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 px-2 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-royal-500" /> Switch Demo:
            </span>
            <button
              onClick={() => { quickDemoLogin('STUDENT'); navigate('/student/dashboard'); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                user.role === 'STUDENT'
                  ? 'bg-white text-navy-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              onClick={() => { quickDemoLogin('FACULTY'); navigate('/faculty/dashboard'); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                user.role === 'FACULTY'
                  ? 'bg-white text-navy-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Faculty
            </button>
            <button
              onClick={() => { quickDemoLogin('ADMIN'); navigate('/admin/dashboard'); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                user.role === 'ADMIN'
                  ? 'bg-white text-navy-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>
        )}

        {/* Right: Notifications & Profile */}
        <div className="flex items-center space-x-3">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="p-2 text-slate-500 hover:text-navy-900 hover:bg-slate-100 rounded-xl relative transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-royal-500 rounded-full animate-ping" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-royal-500 rounded-full" />
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-navy-900">Notifications</h4>
                      <span className="text-xs text-royal-600 font-medium">Real-time alerts</span>
                    </div>
                    <div className="py-2 divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      <div className="px-4 py-2.5 hover:bg-slate-50 transition text-xs">
                        <p className="font-semibold text-slate-800">System Monitoring Active</p>
                        <p className="text-slate-500 mt-0.5">Secure AI proctoring services running normally.</p>
                      </div>
                      <div className="px-4 py-2.5 hover:bg-slate-50 transition text-xs">
                        <p className="font-semibold text-slate-800">Examination Ready</p>
                        <p className="text-slate-500 mt-0.5">CS201 Data Structures Midterm is open.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center space-x-2 p-1.5 pl-2 rounded-xl hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-semibold text-navy-900 block leading-tight">
                      {user.fullName}
                    </span>
                    <div className="mt-0.5">{getRoleBadge(user.role)}</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-navy-900">{user.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-1">{getRoleBadge(user.role)}</div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-navy-900 transition"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Profile & Settings</span>
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="text-xs font-semibold text-navy-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="text-xs font-semibold bg-royal-500 text-white px-4 py-2 rounded-xl hover:bg-royal-600 shadow-xs transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
