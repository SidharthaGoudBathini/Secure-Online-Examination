import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';
import {
  ShieldAlert,
  Activity,
  Users,
  AlertTriangle,
  ArrowLeft,
  Send,
  Eye,
  Radio,
  Clock,
  CheckCircle2,
  StopCircle,
} from 'lucide-react';

export const LiveExamMonitoring: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const { addToast } = useNotification();

  const [loading, setLoading] = useState<boolean>(true);
  const [exam, setExam] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Warning Modal state
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [customWarningText, setCustomWarningText] = useState<string>('');

  const loadMonitoringData = async () => {
    try {
      const res = await api.get(`/proctor/live/${examId}`);
      if (res.data.success) {
        setExam(res.data.exam);
        setSessions(res.data.sessions);
        setAlerts(res.data.recentAlerts);
      }
    } catch (err) {
      console.error('Failed to load live monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonitoringData();

    // Socket setup
    const socket = getSocket();
    socket.emit('join_exam_room', { examId });

    // Real-time alert listener
    socket.on('live_proctor_alert', (newAlert: any) => {
      setAlerts((prev) => [newAlert, ...prev]);

      // Update session tab counts dynamically
      setSessions((prev) =>
        prev.map((s) =>
          s.id === newAlert.sessionId
            ? {
                ...s,
                tabSwitchCount: newAlert.tabSwitchCount,
                fullscreenExitCount: newAlert.fullscreenExitCount,
                proctorWarningsCount: newAlert.proctorWarningsCount,
              }
            : s
        )
      );

      addToast(
        `${newAlert.studentName}: ${newAlert.eventType.replace(/_/g, ' ')}`,
        newAlert.severity === 'HIGH' ? 'error' : 'warning',
        'Live Proctor Telemetry Alert'
      );
    });

    // Heartbeat updates
    socket.on('student_status_update', (update: any) => {
      // Refresh taker list
      loadMonitoringData();
    });

    return () => {
      socket.emit('leave_exam_room', { examId });
      socket.off('live_proctor_alert');
      socket.off('student_status_update');
    };
  }, [examId]);

  const handleSendWarning = () => {
    if (!selectedStudent || !customWarningText.trim()) return;

    const socket = getSocket();
    socket.emit('send_warning_to_student', {
      studentId: selectedStudent.studentId,
      examId,
      warningMessage: customWarningText,
    });

    addToast(`Warning transmitted to ${selectedStudent.student?.fullName || 'student'}`, 'success');
    setWarningModalOpen(false);
    setCustomWarningText('');
  };

  const handleForceSubmit = (session: any) => {
    if (
      !window.confirm(
        `Are you sure you want to force terminate and submit examination for ${session.student?.fullName}?`
      )
    )
      return;

    const socket = getSocket();
    socket.emit('force_submit_student', {
      studentId: session.studentId,
      examId,
      reason: 'Proctor initiated early examination finalization.',
    });

    addToast(`Force submission triggered for ${session.student?.fullName}`, 'info');
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <Link
              to="/faculty/dashboard"
              className="text-xs font-semibold text-slate-500 hover:text-navy-900 flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-bold text-royal-600 bg-royal-50 px-2 py-0.5 rounded-md border border-royal-100">
              {exam?.code}
            </span>
          </div>

          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1 flex items-center space-x-2">
            <span>Live Examination Proctoring Room</span>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
              <Radio className="w-3.5 h-3.5 text-emerald-600" />
              <span>LIVE FEED</span>
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{exam?.title}</p>
        </div>

        <button
          onClick={loadMonitoringData}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl text-xs font-semibold transition"
        >
          Refresh Feed
        </button>
      </div>

      {/* Grid: Left Test Takers Table, Right Live Telemetry Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Takers Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-navy-900 flex items-center space-x-2">
                <Users className="w-4 h-4 text-royal-500" />
                <span>Active Candidates & Sessions ({sessions.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Max Allowed Switches: {exam?.tabSwitchLimit}
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No active candidate sessions recorded for this examination yet.
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="pb-3">Candidate</th>
                      <th className="pb-3">Session Status</th>
                      <th className="pb-3">Tab Switches</th>
                      <th className="pb-3">Score / Grade</th>
                      <th className="pb-3 text-right">Intervention</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((s) => {
                      const isExceeded = s.tabSwitchCount >= exam?.tabSwitchLimit;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 pr-3">
                            <span className="font-bold text-navy-900 block">
                              {s.student?.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                          </td>
                          <td className="py-3.5 pr-3">
                            <Badge status={s.status} />
                          </td>
                          <td className="py-3.5 pr-3">
                            <span
                              className={`font-bold px-2 py-0.5 rounded-md ${
                                isExceeded
                                  ? 'bg-rose-100 text-rose-700'
                                  : s.tabSwitchCount > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {s.tabSwitchCount} Switches
                            </span>
                          </td>
                          <td className="py-3.5 pr-3 font-semibold text-slate-700">
                            {s.totalScore !== null ? `${s.totalScore} Pts` : 'In Progress'}
                          </td>
                          <td className="py-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedStudent(s);
                                setCustomWarningText(
                                  'Attention candidate: Multiple tab switches have been recorded. Please stay focused on your exam window.'
                                );
                                setWarningModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[11px] font-semibold transition"
                              title="Transmit direct warning"
                            >
                              Warn
                            </button>
                            {s.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleForceSubmit(s)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-semibold transition"
                                title="Force submit session"
                              >
                                Terminate
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Real-Time Proctor Alerts Stream (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-base text-navy-900 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Security Telemetry Stream</span>
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                No security infractions logged yet. Integrity is clean.
              </div>
            ) : (
              <div className="mt-3 space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {alerts.map((alert: any) => {
                  const isHigh = alert.severity === 'HIGH';

                  return (
                    <div
                      key={alert.id || Math.random()}
                      className={`p-3 rounded-2xl border text-xs transition animate-in fade-in ${
                        isHigh
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : 'bg-amber-50/70 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px] mb-1">
                        <span>{alert.studentName || alert.examSession?.student?.fullName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="font-semibold text-xs leading-snug">
                        {alert.eventType.replace(/_/g, ' ')}
                      </p>
                      {alert.details && (
                        <p className="text-[11px] opacity-80 mt-0.5">{alert.details}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Send Direct Warning Modal */}
      <Modal
        isOpen={warningModalOpen}
        onClose={() => setWarningModalOpen(false)}
        title={`Transmit Warning to ${selectedStudent?.student?.fullName}`}
        footer={
          <>
            <button
              onClick={() => setWarningModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSendWarning}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Live Alert</span>
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <p className="text-slate-600">
            This message will immediately display as an urgent alert on the student's examination
            screen via WebSocket.
          </p>
          <textarea
            rows={4}
            value={customWarningText}
            onChange={(e) => setCustomWarningText(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-amber-500"
          />
        </div>
      </Modal>
    </div>
  );
};
