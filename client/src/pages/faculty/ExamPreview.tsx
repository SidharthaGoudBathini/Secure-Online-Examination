import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Examination, Question } from '../../types';
import { Badge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';
import {
  Eye,
  CheckCircle2,
  Clock,
  Award,
  Shield,
  ArrowLeft,
  Send,
  Edit,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';

export const ExamPreview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();
  const [exam, setExam] = useState<Examination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPreview = async () => {
    try {
      const res = await api.get(`/exams/${id}/preview`);
      if (res.data.success) {
        setExam(res.data.exam);
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to load preview', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [id]);

  const handlePublish = async () => {
    if (!exam) return;
    try {
      const res = await api.post(`/exams/${exam.id}/publish`);
      if (res.data.success) {
        addToast('Examination published! Students can now access it.', 'success');
        navigate('/faculty/dashboard');
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to publish examination', 'error');
    }
  };

  if (loading || !exam) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  const questions = exam.questions || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/faculty/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-navy-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="flex items-center space-x-2">
          <Link
            to={`/faculty/exams/edit/${exam.id}`}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Settings</span>
          </Link>

          {exam.status === 'DRAFT' && (
            <button
              onClick={handlePublish}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publish Examination</span>
            </button>
          )}
        </div>
      </div>

      {/* Exam Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
              {exam.subject?.name} • {exam.code}
            </span>
            <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
              {exam.title} (Faculty Preview Mode)
            </h1>
          </div>
          <Badge status={exam.status} />
        </div>

        {/* Spec tags */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 text-xs text-slate-600">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Duration</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{exam.durationMinutes} Mins</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Questions</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{questions.length} Items</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Total Marks</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{exam.totalMarks} Points</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Security</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">
              {exam.enableWebcam ? 'Webcam + Fullscreen' : 'Standard'}
            </span>
          </div>
        </div>
      </div>

      {/* Questions Preview List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-navy-900">Examination Content Preview</h3>
            <p className="text-xs text-slate-500">
              Authoritative answer keys and explanations are highlighted in green for verification.
            </p>
          </div>
        </div>

        {questions.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No questions added to this examination.</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Add questions from the Question Bank before publishing.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-navy-900">Question {idx + 1}</span>
                    <span className="text-slate-500 font-semibold">({q.type})</span>
                  </div>
                  <span className="font-bold text-emerald-600">+{q.marks} Marks</span>
                </div>

                <p className="text-sm font-semibold text-slate-900">{q.text}</p>

                <div className="space-y-2 text-xs">
                  {q.options?.map((opt, oIdx) => (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        opt.isCorrect
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                          Authoritative Answer Key
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {q.explanation && (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600">
                    <strong className="text-navy-900 block mb-0.5">Faculty Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
