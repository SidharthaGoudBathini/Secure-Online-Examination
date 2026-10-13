import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  Award,
  BookOpen,
  Calendar,
  ShieldAlert,
  FileCheck2,
  TrendingUp,
  Activity,
  ArrowRight,
  Shield,
  Layers,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/admin/analytics');
        if (res.data.success) {
          setAnalytics(res.data.analytics);
        }
      } catch (err) {
        console.error('Failed to load admin analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
            System Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight mt-1.5">
            Institution Examination Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time infrastructure oversight, access management, and proctoring policy control.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/admin/users"
            className="px-4 py-2 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Manage Users
          </Link>
          <Link
            to="/admin/security"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
          >
            Security Policies
          </Link>
        </div>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={analytics?.totalStudents || 0}
          subtitle="Enrolled candidates"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Total Faculty"
          value={analytics?.totalFaculty || 0}
          subtitle="Instructors & proctors"
          icon={Award}
          color="purple"
        />
        <StatCard
          title="Active Exams"
          value={analytics?.activeExams || 0}
          subtitle="Open for testing"
          icon={Activity}
          color="emerald"
        />
        <StatCard
          title="Overall Pass Rate"
          value={`${analytics?.overallPassRate || 0}%`}
          subtitle="Institutional cutoff"
          icon={TrendingUp}
          color="amber"
        />
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Link
          to="/admin/users"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-royal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">User Control</span>
        </Link>

        <Link
          to="/admin/courses"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">Courses & Subjects</span>
        </Link>

        <Link
          to="/admin/schedule"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">Exam Scheduling</span>
        </Link>

        <Link
          to="/admin/security"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">Security Policies</span>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">Audit Trail</span>
        </Link>

        <Link
          to="/admin/analytics"
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:shadow-md hover:border-royal-300 transition text-center flex flex-col items-center justify-center space-y-2"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-navy-900">Reports & CSV</span>
        </Link>
      </div>

      {/* Split: Recent Audit Logs & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audit Logs */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-navy-900 flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-royal-500" />
                <span>Recent System Audit Trail</span>
              </h3>
              <Link to="/admin/audit-logs" className="text-xs font-semibold text-royal-600 hover:underline">
                View all →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {analytics?.recentAuditLogs?.map((log: any) => (
                <div key={log.id} className="py-2.5 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="font-bold text-navy-900">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] mt-0.5">{log.details || log.entity}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-navy-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-royal-500" />
                <span>Recently Registered Users</span>
              </h3>
              <Link to="/admin/users" className="text-xs font-semibold text-royal-600 hover:underline">
                Manage all →
              </Link>
            </div>

            <div className="mt-3 divide-y divide-slate-100">
              {analytics?.recentUsers?.map((u: any) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{u.fullName}</span>
                    <span className="text-slate-400 text-[11px] block">{u.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {u.role}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
