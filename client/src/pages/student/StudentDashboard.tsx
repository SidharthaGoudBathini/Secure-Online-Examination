import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import {
  FileText,
  CheckCircle,
  Award,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Calendar,
  Shield,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/exams/student/dashboard-stats');
        if (res.data.success) {
          setStats(res.data.stats);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your student portal...</p>
        </div>
      </div>
    );
  }

  const chartData = (stats?.completedExams || []).map((session: any) => ({
    name: session.exam?.code || 'Exam',
    score: session.percentage || 0,
    passing: (session.exam?.passingMarks / session.exam?.totalMarks) * 100 || 40,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-royal-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-royal-300 bg-navy-950/50 px-3 py-1 rounded-full border border-royal-400/20">
            Student Examination Terminal
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
            All active examinations are secured with AI telemetry and strict browser containment.
            Make sure to complete system readiness checks before commencing your test.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/student/exams"
              className="px-4 py-2 bg-royal-500 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center space-x-1.5"
            >
              <span>View Available Exams</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Decorative badge */}
        <div className="absolute right-6 -bottom-6 opacity-10 text-white hidden md:block">
          <Shield className="w-64 h-64" />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Available Exams"
          value={stats?.availableCount || 0}
          subtitle="Ready for taking"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Completed Exams"
          value={stats?.completedCount || 0}
          subtitle="Submitted & evaluated"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Average Score"
          value={`${stats?.averageScore || 0}%`}
          subtitle="Overall performance"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="Passed Exams"
          value={stats?.passedCount || 0}
          subtitle="Above cutoff score"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Available & Ongoing Examinations Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-900">Current & Upcoming Examinations</h3>
            <p className="text-xs text-slate-500">Exams assigned to your academic curriculum</p>
          </div>
          <Link
            to="/student/exams"
            className="text-xs font-semibold text-royal-600 hover:text-royal-700 flex items-center space-x-1"
          >
            <span>See all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats?.availableExams?.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <CheckCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-medium">No pending examinations at this moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {stats?.availableExams?.map((exam: any) => (
              <div
                key={exam.id}
                className="p-5 rounded-2xl border border-slate-200 bg-surface/50 hover:bg-white hover:border-royal-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500">{exam.subject?.name}</span>
                    <Badge status={exam.status} />
                  </div>
                  <h4 className="font-bold text-sm text-navy-900 leading-snug">{exam.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{exam.description}</p>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Mins</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.totalMarks} Marks</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    to={`/student/exam/${exam.id}/instructions`}
                    className="w-full py-2 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5"
                  >
                    <span>Start Examination</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Examinations & Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h3 className="text-base font-bold text-navy-900 mb-1">Performance Overview</h3>
          <p className="text-xs text-slate-500 mb-4">Score percentage on recent exams</p>

          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              Complete exams to populate chart analytics.
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="score" fill="#3478F6" radius={[6, 6, 0, 0]} name="Score %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Completed Exams History */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-navy-900">Completed Examinations</h3>
              <p className="text-xs text-slate-500">Official grades & submitted assessments</p>
            </div>
          </div>

          {stats?.completedExams?.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-xs">No submitted examinations yet.</p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-slate-100">
              {stats?.completedExams?.map((sess: any) => (
                <div key={sess.id} className="py-3.5 flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{sess.exam?.title}</h5>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Submitted on {new Date(sess.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <span className="font-bold text-navy-900 block text-sm">
                        {sess.totalScore} / {sess.exam?.totalMarks}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          sess.passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {sess.percentage}% ({sess.passed ? 'PASSED' : 'FAILED'})
                      </span>
                    </div>
                    <Link
                      to={`/student/results/${sess.id}`}
                      className="p-2 text-royal-600 hover:bg-royal-50 rounded-lg transition"
                      title="View Detailed Results"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
