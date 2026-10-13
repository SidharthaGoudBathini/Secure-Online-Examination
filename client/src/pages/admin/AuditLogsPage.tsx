import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { AuditLog } from '../../types';
import {
  FileCheck2,
  Search,
  Filter,
  Clock,
  User,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Database,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const fetchLogs = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          action: actionFilter !== 'ALL' ? actionFilter : undefined,
        },
      });

      if (res.data.success) {
        setLogs(res.data.logs);
        setTotalCount(res.data.totalCount);
        setTotalPages(res.data.totalPages);
        setCurrentPage(res.data.currentPage);
      }
    } catch (e) {
      console.error('Failed to load audit logs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Governance & Compliance
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            System Audit Trail & Telemetry Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tamper-proof chronological record of security access, exam interactions, and administrative decisions.
          </p>
        </div>

        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
          {totalCount} Total Audit Records
        </span>
      </div>

      {/* Filter and Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search details, entities or user IDs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-royal-500 outline-none transition"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="EXAM_STARTED">EXAM_STARTED</option>
            <option value="EXAM_SUBMISSION">EXAM_SUBMISSION</option>
            <option value="EXAM_PUBLISHED">EXAM_PUBLISHED</option>
            <option value="PROCTORING_ALERT">PROCTORING_ALERT</option>
            <option value="SECURITY_SETTING_CHANGED">SECURITY_SETTING_CHANGED</option>
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-navy-900 text-white rounded-xl text-xs font-semibold hover:bg-royal-600 transition"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No audit logs matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Entity / Target</th>
                  <th className="pb-3">User & Role</th>
                  <th className="pb-3">Log Details</th>
                  <th className="pb-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 pr-3">
                      <span className="font-mono font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 pr-3 font-semibold text-slate-700">{log.entity}</td>
                    <td className="py-3.5 pr-3">
                      {log.user ? (
                        <div>
                          <span className="font-bold text-navy-900 block">{log.user.fullName}</span>
                          <span className="text-[10px] text-slate-400">{log.user.role}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Process</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600 max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                    <td className="py-3.5 text-right text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => fetchLogs(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchLogs(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
