import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { Examination } from '../../types';
import {
  ShieldAlert,
  Clock,
  Award,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Maximize2,
  Camera,
  CheckCircle2,
} from 'lucide-react';

export const ExamInstructions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Examination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [agreedHonorCode, setAgreedHonorCode] = useState<boolean>(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await api.get(`/exams/${id}`);
        if (res.data.success) {
          setExam(res.data.exam);
        }
      } catch (err) {
        console.error('Failed to load exam:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [id]);

  if (loading || !exam) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-bold text-royal-600 uppercase tracking-wider mb-2">
          <span>{exam.subject?.name}</span>
          <span>•</span>
          <span>{exam.code}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-navy-900 tracking-tight">
          {exam.title}
        </h1>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          {exam.description || 'Mandatory academic assessment. Read all guidelines prior to testing.'}
        </p>

        {/* Quick parameters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Duration</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{exam.durationMinutes} Minutes</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Total Marks</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{exam.totalMarks} Points</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Passing Marks</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">{exam.passingMarks} Points</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block font-medium">Negative Marking</span>
            <span className="font-bold text-navy-900 text-sm mt-0.5">
              {exam.allowNegativeMarking ? `-${exam.negativeMarkingValue}` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Rules & Integrity Protocols */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-navy-900">Examination Security & Proctoring Rules</h3>
            <p className="text-xs text-slate-500">Violations will be recorded in the live instructor feed</p>
          </div>
        </div>

        <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
          <li className="flex items-start space-x-3">
            <Maximize2 className="w-4 h-4 text-royal-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900">Mandatory Fullscreen Mode:</strong> The assessment operates in fullscreen. Exiting fullscreen mode triggers a security warning alert.
            </div>
          </li>
          <li className="flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900">Tab Switching Detection:</strong> Leaving or blurring the examination tab records an incident. A maximum of {exam.tabSwitchLimit} switches are permitted before escalation.
            </div>
          </li>
          {exam.enableWebcam && (
            <li className="flex items-start space-x-3">
              <Camera className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-navy-900">Live AI Proctoring:</strong> Your camera feed will be verified for presence during the exam. No recordings are shared outside of academic auditing.
              </div>
            </li>
          )}
          <li className="flex items-start space-x-3">
            <Clock className="w-4 h-4 text-royal-500 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-navy-900">Automated Submission:</strong> When the countdown timer reaches 00:00, all saved answers will be finalized automatically on the server.
            </div>
          </li>
        </ul>

        {/* Honor Code Acknowledgement */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <label className="flex items-start space-x-3 p-4 rounded-2xl bg-royal-50/50 border border-royal-100 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedHonorCode}
              onChange={(e) => setAgreedHonorCode(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-royal-600 rounded-md border-slate-300 focus:ring-royal-500"
            />
            <span className="text-xs text-slate-800 leading-normal">
              <strong>Academic Integrity Honor Pledge:</strong> I confirm that I will complete this
              examination independently without unauthorized materials, external assistance, or communication
              tools. I acknowledge that proctoring telemetry will monitor this session.
            </span>
          </label>
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-between">
          <Link
            to="/student/exams"
            className="text-xs font-semibold text-slate-500 hover:text-navy-900"
          >
            ← Back to Exams
          </Link>

          <button
            onClick={() => navigate(`/student/exam/${exam.id}/readiness`)}
            disabled={!agreedHonorCode}
            className="px-6 py-3 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-md transition flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span>Proceed to System Readiness Check</span>
            <ArrowRight className="w-4 h-4 text-royal-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
