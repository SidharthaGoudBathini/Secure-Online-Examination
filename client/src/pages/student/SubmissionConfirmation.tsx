import React, { useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Award, Clock, ArrowRight, LayoutDashboard, FileText } from 'lucide-react';

export const SubmissionConfirmation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    sessionId?: string;
    examTitle?: string;
    examCode?: string;
    resultReleasePolicy?: string;
    totalMarks?: number;
  } | undefined;

  useEffect(() => {
    // Fire confetti celebration on successful submission
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center">
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Submission Confirmed & Cryptographically Recorded
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-3">
            Examination Successfully Submitted
          </h1>
          <p className="text-xs text-slate-500 mt-2">
            Your responses have been validated on the server. Your official timestamp has been registered in the academic ledger.
          </p>
        </div>

        {/* Details box */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left text-xs space-y-2.5">
          <div className="flex justify-between">
            <span className="text-slate-400">Examination:</span>
            <span className="font-bold text-navy-900">{state?.examTitle || 'Data Structures Mid-Term'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Course Code:</span>
            <span className="font-semibold text-slate-700">{state?.examCode || 'EXAM-CS201-MID'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Submission Timestamp:</span>
            <span className="font-mono text-slate-700">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Result Release Policy:</span>
            <span className="font-bold text-royal-600">
              {state?.resultReleasePolicy === 'IMMEDIATE'
                ? 'Instant Release (Available Now)'
                : 'Subject to Faculty Review'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          {state?.sessionId && state?.resultReleasePolicy === 'IMMEDIATE' ? (
            <Link
              to={`/student/results/${state.sessionId}`}
              className="py-3 px-6 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>View Score & Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : null}

          <Link
            to="/student/dashboard"
            className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-2"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
