import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { Question, ExamSession } from '../../types';
import { CountdownTimer } from '../../components/exam/CountdownTimer';
import { QuestionNavigation } from '../../components/exam/QuestionNavigation';
import { WebcamProctorFeed } from '../../components/exam/WebcamProctorFeed';
import { SecurityWarningModal } from '../../components/exam/SecurityWarningModal';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
  Shield,
  CheckCircle2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  Save,
  AlertTriangle,
  Maximize2,
  HelpCircle,
} from 'lucide-react';

export const ExamTaking: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [loading, setLoading] = useState<boolean>(true);
  const [exam, setExam] = useState<any>(null);
  const [session, setSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Saved answers map: { [questionId]: { selectedOptionIds, textResponse, isMarkedForReview } }
  const [savedAnswers, setSavedAnswers] = useState<
    Record<
      string,
      { selectedOptionIds: string[]; textResponse: string; isMarkedForReview: boolean }
    >
  >({});
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Proctoring telemetry states
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [warningModalType, setWarningModalType] = useState<
    'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'LIMIT_EXCEEDED'
  >('TAB_SWITCH');

  // Submission modal
  const [submitModalOpen, setSubmitModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Save timeout debouncer ref
  const saveTimeoutRef = useRef<any>(null);

  // Fetch or initialize exam session
  useEffect(() => {
    const initExam = async () => {
      try {
        const res = await api.post(`/submissions/start/${examId}`);
        if (res.data.success) {
          setExam(res.data.exam);
          setSession(res.data.session);
          setQuestions(res.data.questions);
          setSavedAnswers(res.data.savedResponses || {});
          setTabSwitchCount(res.data.session.tabSwitchCount || 0);

          // Connect Socket for live proctoring
          const socket = getSocket();
          socket.emit('join_exam_room', { examId });

          // Listen for instructor alerts
          socket.on(`student_warning:${res.data.session.studentId}`, (data: any) => {
            addToast(data.message, 'warning', `Instructor Alert (${data.from})`, 8000);
          });

          socket.on(`force_terminate:${res.data.session.studentId}`, (data: any) => {
            addToast(data.reason, 'error', 'Session Terminated by Instructor', 10000);
            handleSubmitExam(true);
          });
        }
      } catch (err: any) {
        if (err.response?.data?.isCompleted) {
          addToast(err.response.data.message, 'info');
          navigate(`/student/results/${err.response.data.sessionId}`);
        } else {
          addToast(err.response?.data?.message || 'Failed to start exam', 'error');
          navigate('/student/exams');
        }
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [examId]);

  // Log proctoring events to server
  const reportProctorEvent = useCallback(
    async (
      eventType:
        | 'TAB_SWITCH_BLUR'
        | 'TAB_SWITCH_FOCUS'
        | 'FULLSCREEN_EXIT'
        | 'FULLSCREEN_ENTER'
        | 'COPY_PASTE_ATTEMPT',
      severity: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW',
      details?: string
    ) => {
      if (!session) return;
      try {
        const res = await api.post('/proctor/log-event', {
          examSessionId: session.id,
          eventType,
          severity,
          details,
        });

        if (res.data.success && res.data.currentStats) {
          setTabSwitchCount(res.data.currentStats.tabSwitchCount);
        }
      } catch (e) {
        console.warn('Failed to log proctor event to server', e);
      }
    },
    [session]
  );

  // Tab switch & Window focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportProctorEvent('TAB_SWITCH_BLUR', 'MEDIUM', 'Student switched tab or minimized window');
        setWarningModalType('TAB_SWITCH');
        setWarningModalOpen(true);
      } else {
        reportProctorEvent('TAB_SWITCH_FOCUS', 'LOW', 'Student returned to exam window');
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        reportProctorEvent('FULLSCREEN_EXIT', 'MEDIUM', 'Student exited fullscreen mode');
        setWarningModalType('FULLSCREEN_EXIT');
        setWarningModalOpen(true);
      } else {
        reportProctorEvent('FULLSCREEN_ENTER', 'LOW', 'Student re-entered fullscreen mode');
      }
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      reportProctorEvent('COPY_PASTE_ATTEMPT', 'HIGH', 'Clipboard copy/paste blocked');
      addToast('Clipboard actions are strictly disabled in this examination window.', 'warning');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('copy', handleCopyPaste);
    window.addEventListener('paste', handleCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('copy', handleCopyPaste);
      window.removeEventListener('paste', handleCopyPaste);
    };
  }, [reportProctorEvent, addToast]);

  // Autosave current question response to server
  const triggerAutoSave = (
    qId: string,
    selectedOptionIds: string[],
    textResponse: string,
    isMarkedForReview: boolean
  ) => {
    if (!session) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.post(`/submissions/session/${session.id}/save-answer`, {
          questionId: qId,
          selectedOptionIds,
          textResponse,
          isMarkedForReview,
        });
        setSaveStatus('saved');
      } catch (err: any) {
        console.error('Failed to auto-save answer:', err);
        setSaveStatus('error');
        if (err.response?.data?.isExpired) {
          handleSubmitExam(true);
        }
      }
    }, 400);
  };

  // Answer selection handlers
  const handleOptionSelect = (optionId: string, isMulti: boolean) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = savedAnswers[currentQ.id] || {
      selectedOptionIds: [],
      textResponse: '',
      isMarkedForReview: false,
    };

    let updatedSelection: string[] = [];

    if (isMulti) {
      if (existing.selectedOptionIds.includes(optionId)) {
        updatedSelection = existing.selectedOptionIds.filter((id) => id !== optionId);
      } else {
        updatedSelection = [...existing.selectedOptionIds, optionId];
      }
    } else {
      updatedSelection = [optionId];
    }

    const updatedObj = {
      ...existing,
      selectedOptionIds: updatedSelection,
    };

    setSavedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updatedObj,
    }));

    triggerAutoSave(currentQ.id, updatedSelection, updatedObj.textResponse, updatedObj.isMarkedForReview);
  };

  const handleTextChange = (text: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = savedAnswers[currentQ.id] || {
      selectedOptionIds: [],
      textResponse: '',
      isMarkedForReview: false,
    };

    const updatedObj = {
      ...existing,
      textResponse: text,
    };

    setSavedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updatedObj,
    }));

    triggerAutoSave(currentQ.id, existing.selectedOptionIds, text, existing.isMarkedForReview);
  };

  const handleToggleReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const existing = savedAnswers[currentQ.id] || {
      selectedOptionIds: [],
      textResponse: '',
      isMarkedForReview: false,
    };

    const nextReviewState = !existing.isMarkedForReview;

    const updatedObj = {
      ...existing,
      isMarkedForReview: nextReviewState,
    };

    setSavedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updatedObj,
    }));

    triggerAutoSave(currentQ.id, existing.selectedOptionIds, existing.textResponse, nextReviewState);
  };

  // Submit Exam
  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!session) return;
    setIsSubmitting(true);

    try {
      const res = await api.post(`/submissions/session/${session.id}/submit`);
      if (res.data.success) {
        addToast(
          isAutoSubmit
            ? 'Time expired. Responses submitted automatically.'
            : 'Examination submitted successfully!',
          'success'
        );
        navigate(`/exam/${exam.id}/submitted`, {
          state: {
            sessionId: session.id,
            examTitle: exam.title,
            examCode: exam.code,
            resultReleasePolicy: exam.resultReleasePolicy,
            totalMarks: exam.totalMarks,
          },
        });
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error finalizing submission', 'error');
    } finally {
      setIsSubmitting(false);
      setSubmitModalOpen(false);
    }
  };

  const handleResumeFullscreen = async () => {
    setWarningModalOpen(false);
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen resume bypassed:', e);
    }
  };

  if (loading || !exam || !session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-royal-400 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-300">Setting up secure examination window...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? savedAnswers[currentQuestion.id] : null;

  // Counts for confirmation modal
  const answeredCount = questions.filter((q) => {
    const a = savedAnswers[q.id];
    return a && (a.selectedOptionIds?.length > 0 || a.textResponse?.trim().length > 0);
  }).length;
  const reviewCount = questions.filter((q) => savedAnswers[q.id]?.isMarkedForReview).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col select-none">
      {/* Top Distraction-Minimized Bar */}
      <header className="bg-navy-950/90 border-b border-slate-800 px-4 sm:px-6 h-16 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-navy-900 border border-slate-700 flex items-center justify-center text-royal-400 shadow-sm">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight truncate max-w-xs sm:max-w-md">
              {exam.title}
            </h2>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span className="font-semibold text-royal-400">{exam.code}</span>
              <span>•</span>
              <span className="flex items-center">
                {saveStatus === 'saving' ? (
                  <span className="text-amber-400">Saving response...</span>
                ) : saveStatus === 'saved' ? (
                  <span className="text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-0.5 inline" /> All responses saved
                  </span>
                ) : (
                  <span className="text-rose-400">Offline changes pending</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center space-x-3">
          {session.expiresAt && (
            <CountdownTimer
              expiresAt={session.expiresAt}
              onExpire={() => handleSubmitExam(true)}
            />
          )}

          <button
            onClick={() => setSubmitModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-1.5"
          >
            <span>Submit Exam</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Testing Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Question & Options */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
          <div className="bg-slate-800/80 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-xl backdrop-blur-xs flex-1 flex flex-col">
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-lg bg-royal-500/20 text-royal-300 border border-royal-500/30">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  [{currentQuestion?.type === 'MCQ' ? 'Single Choice' : currentQuestion?.type === 'MULTI_SELECT' ? 'Multiple Choice' : 'Short Answer'}]
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-emerald-400">
                  +{currentQuestion?.marks} Marks
                  {exam.allowNegativeMarking && (
                    <span className="text-rose-400 text-[11px] ml-1">
                      (-{currentQuestion?.negativeMarks || exam.negativeMarkingValue})
                    </span>
                  )}
                </span>

                <button
                  onClick={handleToggleReview}
                  className={`p-1.5 rounded-xl border text-xs font-semibold transition flex items-center space-x-1 ${
                    currentAnswer?.isMarkedForReview
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'border-slate-600 text-slate-400 hover:text-white'
                  }`}
                  title="Flag for later review"
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      currentAnswer?.isMarkedForReview ? 'fill-amber-400 text-amber-400' : ''
                    }`}
                  />
                  <span className="hidden sm:inline">
                    {currentAnswer?.isMarkedForReview ? 'Flagged' : 'Flag'}
                  </span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="py-6">
              <p className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed">
                {currentQuestion?.text}
              </p>
            </div>

            {/* Options Body */}
            <div className="flex-1 mt-2 space-y-3">
              {currentQuestion?.type === 'SHORT_ANSWER' ? (
                <div className="mt-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    Enter your concise answer below:
                  </label>
                  <textarea
                    rows={3}
                    value={currentAnswer?.textResponse || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder="Type response here..."
                    className="w-full p-4 bg-slate-900 border border-slate-700 rounded-2xl text-sm text-white placeholder-slate-500 focus:border-royal-400 focus:ring-1 focus:ring-royal-400 outline-none transition"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {currentQuestion?.options.map((opt, optIdx) => {
                    const isSelected = currentAnswer?.selectedOptionIds?.includes(opt.id);
                    const isMulti = currentQuestion.type === 'MULTI_SELECT';

                    return (
                      <div
                        key={opt.id}
                        onClick={() => handleOptionSelect(opt.id, isMulti)}
                        className={`p-4 rounded-2xl border cursor-pointer transition flex items-center space-x-3.5 ${
                          isSelected
                            ? 'bg-royal-600/30 border-royal-400 text-white shadow-md'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-300 hover:bg-slate-700/40 hover:border-slate-600'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs border transition ${
                            isSelected
                              ? 'bg-royal-500 border-royal-400 text-white'
                              : 'border-slate-600 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="text-sm font-medium flex-1">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="pt-6 mt-6 border-t border-slate-700/80 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/80 text-slate-300 hover:bg-slate-700 hover:text-white font-semibold text-xs transition flex items-center space-x-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <span className="text-xs text-slate-400 font-medium">
                {currentIndex + 1} / {questions.length}
              </span>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-500 text-white font-semibold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setSubmitModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <span>Review & Submit</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Proctoring Video & Palette */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* Webcam Box */}
          {exam.enableWebcam && (
            <WebcamProctorFeed
              tabSwitchCount={tabSwitchCount}
              tabSwitchLimit={exam.tabSwitchLimit}
            />
          )}

          {/* Palette */}
          <div className="flex-1">
            <QuestionNavigation
              questions={questions}
              currentIndex={currentIndex}
              onSelectQuestion={(idx) => setCurrentIndex(idx)}
              savedAnswers={savedAnswers}
            />
          </div>
        </div>
      </div>

      {/* Security Warning Modal */}
      <SecurityWarningModal
        isOpen={warningModalOpen}
        onAcknowledge={handleResumeFullscreen}
        type={warningModalType}
        currentCount={tabSwitchCount}
        limit={exam.tabSwitchLimit}
      />

      {/* Submit Confirmation Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Confirm Examination Submission"
        footer={
          <>
            <button
              onClick={() => setSubmitModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Resume Testing
            </button>
            <button
              onClick={() => handleSubmitExam(false)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Finalize & Submit</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-slate-700">
          <p className="text-xs leading-relaxed">
            Are you sure you want to finalize your examination? Once submitted, your answers will
            be securely evaluated on the server and no further edits can be made.
          </p>

          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-xl font-bold text-emerald-700 block">{answeredCount}</span>
              <span className="text-[11px] font-semibold text-emerald-600">Answered</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
              <span className="text-xl font-bold text-amber-700 block">{reviewCount}</span>
              <span className="text-[11px] font-semibold text-amber-600">Flagged</span>
            </div>
            <div className="p-2 bg-slate-100 rounded-xl border border-slate-200">
              <span className="text-xl font-bold text-slate-700 block">{unansweredCount}</span>
              <span className="text-[11px] font-semibold text-slate-500">Unanswered</span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>You still have {unansweredCount} unanswered questions remaining.</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
