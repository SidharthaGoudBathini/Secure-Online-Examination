import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Examination } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
  BarChart3,
  Download,
  Filter,
  CheckCircle,
  ExternalLink,
  Edit,
  Award,
  Users,
  Search,
} from 'lucide-react';

export const FacultyReports: React.FC = () => {
  const { addToast } = useNotification();
  const [exams, setExams] = useState<Examination[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Grade Modal State
  const [gradeModalOpen, setGradeModalOpen] = useState<boolean>(false);
  const [gradingSession, setGradingSession] = useState<any>(null);
  const [gradingQuestion, setGradingQuestion] = useState<any>(null);
  const [awardedMarks, setAwardedMarks] = useState<number>(0);
  const [instructorFeedback, setInstructorFeedback] = useState<string>('');

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      if (res.data.success) {
        setExams(res.data.exams);
        if (res.data.exams.length > 0) {
          setSelectedExamId(res.data.exams[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load exams for reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (examId: string) => {
    if (!examId) return;
    try {
      const res = await api.get(`/submissions/exam/${examId}/submissions`);
      if (res.data.success) {
        setSubmissions(res.data.submissions);
      }
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    if (selectedExamId) {
      loadSubmissions(selectedExamId);
    }
  }, [selectedExamId]);

  const handleDownloadCsv = () => {
    window.open(`/api/admin/export-csv?examId=${selectedExamId}`, '_blank');
  };

  const openGradingModal = async (session: any) => {
    try {
      const res = await api.get(`/submissions/session/${session.id}/result`);
      if (res.data.success) {
        setGradingSession(res.data.session);
        // Find first subjective question or any question
        const qList = res.data.questions || [];
        const subQ = qList.find((q: any) => q.type === 'SHORT_ANSWER') || qList[0];
        if (subQ) {
          setGradingQuestion(subQ);
          setAwardedMarks(subQ.studentResponse?.marksAwarded ?? 0);
          setInstructorFeedback(res.data.session.feedback || '');
          setGradeModalOpen(true);
        } else {
          addToast('This exam contains purely objective questions evaluated automatically.', 'info');
        }
      }
    } catch (e) {
      addToast('Error loading submission details', 'error');
    }
  };

  const submitManualGrade = async () => {
    if (!gradingSession || !gradingQuestion) return;
    try {
      const res = await api.post(
        `/submissions/session/${gradingSession.id}/question/${gradingQuestion.id}/grade`,
        {
          marksAwarded: Number(awardedMarks),
          feedback: instructorFeedback,
        }
      );
      if (res.data.success) {
        addToast('Evaluation marks and feedback saved!', 'success');
        setGradeModalOpen(false);
        loadSubmissions(selectedExamId);
      }
    } catch (e) {
      addToast('Failed to save manual evaluation', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Evaluation & Analytics
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Faculty Examination Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review candidate answer sheets, evaluate subjective short answers, and export grade records to CSV.
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-2 w-fit"
        >
          <Download className="w-4 h-4" />
          <span>Export Results CSV</span>
        </button>
      </div>

      {/* Exam Selector */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center space-x-3 text-xs">
        <span className="font-semibold text-slate-700">Select Examination:</span>
        <select
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-medium focus:bg-white focus:border-royal-500 outline-none"
        >
          {exams.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.code}: {ex.title}
            </option>
          ))}
        </select>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-navy-900">Submitted Candidate Records</h3>
          <span className="text-xs font-bold text-slate-500">
            {submissions.length} Submissions Total
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No submissions recorded for this examination yet.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="pb-3">Candidate Name</th>
                  <th className="pb-3">Score & Percentage</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Proctor Violations</th>
                  <th className="pb-3">Submission Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-navy-900 block">{s.student?.fullName}</span>
                      <span className="text-[11px] text-slate-400">{s.student?.email}</span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <span className="font-bold text-slate-800 text-sm block">
                        {s.totalScore !== null ? `${s.totalScore} Pts` : 'Pending'}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          s.passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {s.percentage}% ({s.passed ? 'PASSED' : 'FAILED'})
                      </span>
                    </td>
                    <td className="py-3.5 pr-3">
                      <Badge status={s.status} />
                    </td>
                    <td className="py-3.5 pr-3 font-semibold text-slate-600">
                      {s.tabSwitchCount} Tab Switches
                    </td>
                    <td className="py-3.5 pr-3 text-slate-500 font-mono text-[11px]">
                      {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : 'Active'}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <button
                        onClick={() => openGradingModal(s)}
                        className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-700 border border-royal-200 rounded-lg text-xs font-semibold transition inline-flex items-center space-x-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Evaluate</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Grading Modal */}
      <Modal
        isOpen={gradeModalOpen}
        onClose={() => setGradeModalOpen(false)}
        title="Subjective Question Evaluation"
        maxWidth="lg"
        footer={
          <>
            <button
              onClick={() => setGradeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={submitManualGrade}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-bold shadow-md transition"
            >
              Save Marks & Feedback
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-500 block mb-1">Question Prompt</label>
            <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800">
              {gradingQuestion?.text}
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-500 block mb-1">Student Answer Response</label>
            <div className="p-3 bg-white border border-slate-200 rounded-xl font-mono text-slate-800">
              {gradingQuestion?.studentResponse?.textResponse || '(Empty response submitted)'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Marks Awarded (Max: {gradingQuestion?.marks})
              </label>
              <input
                type="number"
                max={gradingQuestion?.marks}
                value={awardedMarks}
                onChange={(e) => setAwardedMarks(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Instructor Feedback</label>
            <textarea
              rows={3}
              value={instructorFeedback}
              onChange={(e) => setInstructorFeedback(e.target.value)}
              placeholder="Provide constructive feedback for student review..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
