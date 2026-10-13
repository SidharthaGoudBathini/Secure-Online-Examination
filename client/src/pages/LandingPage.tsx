import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield,
  Lock,
  Eye,
  Clock,
  Award,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BarChart,
  FileCheck,
  Cpu,
  UserCheck,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (role: 'STUDENT' | 'FACULTY' | 'ADMIN') => {
    await quickDemoLogin(role);
    if (role === 'STUDENT') navigate('/student/dashboard');
    else if (role === 'FACULTY') navigate('/faculty/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col text-slate-800">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-sm">
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
          </div>

          <div className="flex items-center space-x-3">
            {user ? (
              <Link
                to={
                  user.role === 'STUDENT'
                    ? '/student/dashboard'
                    : user.role === 'FACULTY'
                    ? '/faculty/dashboard'
                    : '/admin/dashboard'
                }
                className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-navy-900 text-white px-4 py-2 rounded-xl hover:bg-royal-600 transition shadow-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs font-semibold text-navy-900 px-3.5 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold bg-royal-500 text-white px-4 py-2 rounded-xl hover:bg-royal-600 shadow-xs transition"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-royal-50 border border-royal-200 px-3.5 py-1.5 rounded-full mb-6 text-royal-600 text-xs font-bold tracking-wide">
              <Sparkles className="w-4 h-4 text-royal-500" />
              <span>Next-Generation Academic Assessment Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-navy-900 tracking-tight leading-tight">
              Secure Online Examination System
            </h1>

            <p className="mt-4 text-xl sm:text-2xl font-bold text-royal-600 tracking-tight">
              Secure. Fair. Reliable.
            </p>

            <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empowering universities and certification authorities with distraction-minimized
              exam environments, real-time proctoring telemetry, automated objective grading, and
              tamper-proof audit logs.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="px-6 py-3 rounded-xl bg-navy-900 hover:bg-royal-600 text-white font-semibold text-sm shadow-md transition flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-royal-300" />
              </Link>
              <a
                href="#features"
                className="px-6 py-3 rounded-xl bg-white hover:bg-slate-100 text-navy-900 border border-slate-200 font-semibold text-sm shadow-2xs transition"
              >
                Explore Features
              </a>
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-royal-500 hover:bg-royal-600 text-white font-semibold text-sm shadow-md transition"
              >
                Register Account
              </Link>
            </div>
          </div>

          {/* Quick Demo Role Cards */}
          <div className="mt-14 max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-navy-900">
                  Interactive Evaluation Demo Accounts
                </h3>
                <p className="text-xs text-slate-500">
                  Instant one-click access into pre-configured role environments:
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit">
                Database Seeded & Ready
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Student */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                      ST
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Student
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-navy-900">Alex Walker</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Take midterms, test readiness checks, auto-saving, and view graded results.
                  </p>
                </div>
                <button
                  onClick={() => handleDemoLogin('STUDENT')}
                  className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Enter as Student
                </button>
              </div>

              {/* Faculty */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-blue-300 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-royal-600 flex items-center justify-center font-bold text-xs">
                      FC
                    </span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      Faculty
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-navy-900">Dr. Robert Oppenheimer</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Create examinations, configure security rules, monitor live takers, and grade questions.
                  </p>
                </div>
                <button
                  onClick={() => handleDemoLogin('FACULTY')}
                  className="mt-4 w-full py-2 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Enter as Faculty
                </button>
              </div>

              {/* Admin */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-purple-300 hover:shadow-md transition flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      AD
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      Administrator
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-navy-900">System Admin</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage users, view security telemetry, audit logs, and export performance reports to CSV.
                  </p>
                </div>
                <button
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="mt-4 w-full py-2 bg-navy-900 hover:bg-purple-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                >
                  Enter as Administrator
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section id="features" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
              Enterprise-Grade Assessment Architecture
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Designed according to academic integrity standards with zero compromises on student privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-navy-900 text-royal-300 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Distraction-Minimized Exam Engine</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strict fullscreen mode, window focus detection, tab-switch telemetry, and question randomization ensure an uncompromised testing environment.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-royal-500 text-white flex items-center justify-center mb-4">
                <Eye className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Live Telemetry & Proctoring</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Socket.IO powered real-time alerts dispatch proctoring events directly to instructors with timestamped logs and configurable warning limits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-4">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Auto-Saving & Resilience</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Background response autosaving with offline reconnection recovery. Timers automatically trigger server-side idempotent final evaluation on expiry.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Instant Evaluation & Analytics</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Server-side objective score calculation with negative marking support, policy-controlled result release, and CSV analytical export.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Tamper-Proof Audit Trail</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Complete traceability across login events, question alterations, exam publications, proctor alerts, and administrative actions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-surface border border-slate-200 hover:shadow-md transition">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-navy-900">Role-Based Access Control</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Strict separation of Student, Faculty, and Administrator domains with server-side middleware authorization and HTTP-only session security.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-navy-900 text-slate-400 py-8 border-t border-navy-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-white font-bold">
            <Shield className="w-5 h-5 text-royal-400" />
            <span>Secure Online Examination System</span>
          </div>
          <p>© 2026 SecureExam Platform. Built with React, Vite, Node.js, Express & Prisma ORM.</p>
        </div>
      </footer>
    </div>
  );
};
