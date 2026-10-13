import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  HelpCircle,
  ArrowLeft,
  FileText,
  AlertTriangle,
} from 'lucide-react';

export const StudentResult: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await api.get(`/submissions/session/${sessionId}/result`);
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load result:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <p className="text-xs text-slate-500">Result not found.</p>
      </div>
    );
  }

  // Handle withheld results
  if (data.isPendingRelease) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-4">
          <Clock className="w-12 h-12 text-royal-500 mx-auto" />
          <h2 className="text-xl font-bold text-navy-900">Evaluation Pending Release</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Your responses for <strong>{data.session.examTitle}</strong> have been securely recorded.
            Per course policy, final scores will be published following instructor review.
          </p>
          <Link
            to="/student/dashboard"
            className="inline-block mt-4 px-6 py-2.5 bg-navy-900 text-white text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const session = data.session;
  const exam = data.exam;
  const questions = data.questions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumb */}
      <div>
        <Link
          to="/student/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-navy-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Score Summary Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-royal-600 bg-royal-50 px-2.5 py-0.5 rounded-md border border-royal-100">
              {exam?.code}
            </span>
            <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1.5">
              {exam?.title}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Submitted on {new Date(session.submittedAt).toLocaleString()}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span
              className={`text-sm font-black px-4 py-2 rounded-2xl border ${
                session.passed
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {session.passed ? 'PASSED' : 'FAILED'}
            </span>
          </div>
        </div>

        {/* Big Score Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 text-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase block">Score</span>
            <span className="text-2xl font-black text-navy-900 block mt-1">
              {session.totalScore} / {exam.totalMarks}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase block">Percentage</span>
            <span
              className={`text-2xl font-black block mt-1 ${
                session.passed ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {session.percentage}%
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase block">Passing Cutoff</span>
            <span className="text-2xl font-black text-slate-700 block mt-1">
              {exam.passingMarks} Pts
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-xs text-slate-400 font-semibold uppercase block">Proctor Alerts</span>
            <span
              className={`text-2xl font-black block mt-1 ${
                session.tabSwitchCount === 0 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {session.tabSwitchCount} Tabs
            </span>
          </div>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-navy-900">Question Performance Review</h3>
          <p className="text-xs text-slate-500">
            Review your answered responses, marks awarded, and faculty explanations.
          </p>
        </div>

        <div className="space-y-5">
          {questions.map((q: any, idx: number) => {
            const resp = q.studentResponse;
            const isCorrect = resp?.isCorrect;
            const awardedMarks = resp?.marksAwarded ?? 0;

            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition ${
                  isCorrect
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : awardedMarks < 0
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-navy-900">Question {idx + 1}</span>
                    <span className="text-[11px] text-slate-500">({q.type})</span>
                  </div>
                  <div className="flex items-center space-x-1.5 font-bold">
                    {isCorrect ? (
                      <span className="text-emerald-700 flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> +{awardedMarks} Pts
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center">
                        <XCircle className="w-4 h-4 mr-1 text-rose-600" /> {awardedMarks} Pts
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm font-semibold text-slate-800 mt-3">{q.text}</p>

                {/* Options Review */}
                {q.type === 'SHORT_ANSWER' ? (
                  <div className="mt-3 text-xs">
                    <span className="text-slate-500 block">Your Answer:</span>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono mt-1">
                      {resp?.textResponse || '(No response recorded)'}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 space-y-2 text-xs">
                    {q.options.map((opt: any) => {
                      const isChosen = resp?.selectedOptionIds?.includes(opt.id);
                      const isOptionCorrect = opt.isCorrect;

                      let style = 'bg-white border-slate-200 text-slate-700';
                      if (isOptionCorrect && isChosen) {
                        style = 'bg-emerald-100/70 border-emerald-300 text-emerald-900 font-semibold';
                      } else if (isOptionCorrect) {
                        style = 'bg-emerald-50 border-emerald-200 text-emerald-800';
                      } else if (isChosen) {
                        style = 'bg-rose-50 border-rose-200 text-rose-800 line-through';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border flex items-center justify-between ${style}`}
                        >
                          <span>{opt.text}</span>
                          {isOptionCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Correct Key
                            </span>
                          )}
                          {isChosen && !isOptionCorrect && (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {q.explanation && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs text-slate-600 bg-white/60 p-3 rounded-xl">
                    <strong className="text-navy-900 block mb-0.5">Faculty Explanation:</strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
