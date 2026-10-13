import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  PlusCircle,
  Activity,
  Users,
  Eye,
  Trash2,
  Edit,
  Send,
  ArrowRight,
  ShieldAlert,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

export const FacultyDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useNotification();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/exams/faculty/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load faculty stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handlePublish = async (examId: string, title: string) => {
    try {
      const res = await api.post(`/exams/${examId}/publish`);
      if (res.data.success) {
        addToast(`Examination "${title}" published successfully!`, 'success');
        fetchStats();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to publish exam', 'error');
    }
  };

  const handleDeleteDraft = async (examId: string) => {
    if (!window.confirm('Are you sure you want to delete this draft examination?')) return;
    try {
      const res = await api.delete(`/exams/${examId}`);
      if (res.data.success) {
        addToast('Draft examination deleted', 'info');
        fetchStats();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to delete exam', 'error');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Faculty Terminal
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Instructor Control Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create examinations, configure proctoring limits, and evaluate submissions.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/faculty/exams/create"
            className="px-4 py-2.5 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5"
          >
            <PlusCircle className="w-4 h-4 text-royal-300" />
            <span>Create Examination</span>
          </Link>
          <Link
            to="/faculty/question-bank"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <span>Question Bank</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Examinations"
          value={stats?.totalExams || 0}
          subtitle="Created by you"
          icon={FileText}
          color="navy"
        />
        <StatCard
          title="Active / Published"
          value={stats?.activeExams || 0}
          subtitle="Currently open"
          icon={Activity}
          color="blue"
        />
        <StatCard
          title="Draft Assessments"
          value={stats?.draftExams || 0}
          subtitle="Unpublished drafts"
          icon={Edit}
          color="amber"
        />
        <StatCard
          title="Student Submissions"
          value={stats?.totalSubmissions || 0}
          subtitle="Completed sessions"
          icon={Users}
          color="emerald"
        />
      </div>

      {/* Managed Examinations List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-900">Your Managed Examinations</h3>
            <p className="text-xs text-slate-500">Configure questions, preview tests, and monitor takers</p>
          </div>
        </div>

        {stats?.exams?.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs">No examinations created yet. Click "Create Examination" to begin.</p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {stats?.exams?.map((exam: any) => (
              <div
                key={exam.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 p-3 rounded-2xl transition"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1.5">
                    <span className="text-[11px] font-bold text-slate-500">{exam.subject?.name}</span>
                    <span>•</span>
                    <span className="text-[11px] font-mono text-royal-600">{exam.code}</span>
                    <Badge status={exam.status} />
                  </div>
                  <h4 className="font-bold text-sm text-navy-900">{exam.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                    <span>{exam._count?.questions || 0} Questions</span>
                    <span>•</span>
                    <span>{exam.durationMinutes} Mins Duration</span>
                    <span>•</span>
                    <span>{exam.totalMarks} Total Marks</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/faculty/exam/${exam.id}/preview`}
                    className="p-2 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition text-xs font-semibold flex items-center space-x-1"
                    title="Preview with answers"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Preview</span>
                  </Link>

                  {exam.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublish(exam.id, exam.title)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish</span>
                    </button>
                  )}

                  {(exam.status === 'PUBLISHED' || exam.status === 'ONGOING') && (
                    <Link
                      to={`/faculty/exam/${exam.id}/monitor`}
                      className="px-3 py-1.5 bg-royal-600 hover:bg-royal-700 text-white rounded-xl text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Live Monitor</span>
                    </Link>
                  )}

                  <Link
                    to={`/faculty/exams/edit/${exam.id}`}
                    className="p-2 text-slate-600 hover:text-navy-900 hover:bg-slate-100 rounded-xl transition"
                    title="Edit exam"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {exam.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDeleteDraft(exam.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-900">Recent Student Submissions</h3>
            <p className="text-xs text-slate-500">Live evaluations across your active exams</p>
          </div>
          <Link
            to="/faculty/reports"
            className="text-xs font-semibold text-royal-600 hover:text-royal-700"
          >
            All Submissions →
          </Link>
        </div>

        {stats?.recentSessions?.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No submissions recorded yet.
          </div>
        ) : (
          <div className="mt-3 divide-y divide-slate-100 text-xs">
            {stats?.recentSessions?.map((s: any) => (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">{s.student?.fullName}</span>
                  <span className="text-slate-400 ml-2">({s.student?.email})</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">{s.exam?.title}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-navy-900 block">
                    {s.totalScore !== null ? `${s.totalScore} Pts` : 'In Progress'}
                  </span>
                  <Badge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
