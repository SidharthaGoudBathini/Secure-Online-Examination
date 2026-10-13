import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import {
  BarChart3,
  Download,
  Award,
  Users,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#3478F6', '#142B4F', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const SystemAnalytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/admin/reports');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load reports', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handleExportCsv = () => {
    window.open('/api/admin/export-csv', '_blank');
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const subjectData = (data?.subjectReports || []).map((s: any) => ({
    name: s.code,
    avgScore: s.avgScore,
    passRate: s.passRate,
    submissions: s.totalSubmissions,
  }));

  const violationData = data?.violationChartData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Institutional Intelligence
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Academic Performance & Proctoring Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-departmental examination performance trends, cutoff success rates, and security telemetry distribution.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export All Submissions CSV</span>
        </button>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject-Wise Performance Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-navy-900 mb-1">Subject Performance Analysis</h3>
            <p className="text-xs text-slate-500 mb-4">Average score (%) vs Pass Rate (%) per subject</p>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="avgScore" fill="#3478F6" name="Average Score %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="passRate" fill="#10B981" name="Pass Rate %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Security Violations Breakdown */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-navy-900 mb-1">
              Proctoring Telemetry Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Breakdown of recorded security events</p>

            {violationData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                No security infractions recorded across active examinations.
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={violationData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {violationData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject Summary Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h3 className="font-bold text-base text-navy-900 pb-4 border-b border-slate-100">
          Curriculum Performance Ledger
        </h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                <th className="pb-3">Subject Module</th>
                <th className="pb-3">Total Examinations</th>
                <th className="pb-3">Total Submissions</th>
                <th className="pb-3">Average Mark</th>
                <th className="pb-3 text-right">Pass Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data?.subjectReports?.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3.5 pr-3">
                    <span className="font-bold text-navy-900 block">{s.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{s.code}</span>
                  </td>
                  <td className="py-3.5 pr-3 font-semibold text-slate-700">{s.totalExams} Exams</td>
                  <td className="py-3.5 pr-3 font-semibold text-slate-700">
                    {s.totalSubmissions} Candidates
                  </td>
                  <td className="py-3.5 pr-3 font-bold text-royal-600">{s.avgScore}%</td>
                  <td className="py-3.5 text-right font-black text-emerald-600">{s.passRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
