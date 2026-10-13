import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Examination } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { Calendar, Clock, Edit, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const ExamScheduling: React.FC = () => {
  const { addToast } = useNotification();
  const [exams, setExams] = useState<Examination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedExam, setSelectedExam] = useState<Examination | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [status, setStatus] = useState<string>('SCHEDULED');

  const fetchExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
      }
    } catch (e) {
      console.error('Failed to load exams', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const openScheduleModal = (exam: Examination) => {
    setSelectedExam(exam);
    setStartTime(exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '');
    setEndTime(exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '');
    setStatus(exam.status);
    setModalOpen(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedExam) return;
    try {
      await api.put(`/exams/${selectedExam.id}`, {
        startTime: startTime || null,
        endTime: endTime || null,
        status,
      });
      addToast('Examination schedule & status updated!', 'success');
      setModalOpen(false);
      fetchExams();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error updating schedule', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Timetable Logistics
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Examination Scheduling & Publication
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Coordinate testing windows, enforce start/end deadlines, and control examination statuses.
          </p>
        </div>
      </div>

      {/* Grid of Scheduled Exams */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-base text-navy-900">Institution Examination Schedules</h3>
          <span className="text-xs text-slate-400 font-semibold">{exams.length} Items</span>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
          </div>
        ) : exams.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No examinations found.</div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 p-3 rounded-2xl transition"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[11px] font-mono font-bold text-royal-600 bg-royal-50 px-2 py-0.5 rounded-md">
                      {ex.code}
                    </span>
                    <Badge status={ex.status} />
                  </div>
                  <h4 className="font-bold text-sm text-navy-900">{ex.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {ex.durationMinutes} Mins
                    </span>
                    <span>•</span>
                    <span>
                      Window Start:{' '}
                      {ex.startTime ? new Date(ex.startTime).toLocaleString() : 'Open / Unscheduled'}
                    </span>
                    <span>•</span>
                    <span>
                      Window End:{' '}
                      {ex.endTime ? new Date(ex.endTime).toLocaleString() : 'Open Ended'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openScheduleModal(ex)}
                  className="px-4 py-2 bg-royal-50 hover:bg-royal-100 text-royal-700 border border-royal-200 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 w-fit"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Configure Schedule</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Configure Schedule for ${selectedExam?.code}`}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSchedule}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-bold shadow-md transition"
            >
              Save Schedule
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Lifecycle Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="PUBLISHED">Published (Open to students)</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Examination Window Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Examination Window End Time
            </label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
