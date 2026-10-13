import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Subject, Question, QuestionType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import {
  HelpCircle,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  CheckCircle2,
  BookOpen,
  Edit,
  Tag,
  Award,
} from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const { addToast } = useNotification();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  // Add question modal state
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [formText, setFormText] = useState<string>('');
  const [formType, setFormType] = useState<QuestionType>('MCQ');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formMarks, setFormMarks] = useState<number>(5);
  const [formNegative, setFormNegative] = useState<number>(0);
  const [formExplanation, setFormExplanation] = useState<string>('');
  const [formOptions, setFormOptions] = useState<
    Array<{ text: string; isCorrect: boolean }>
  >([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);

  const loadData = async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        api.get('/questions/bank'),
        api.get('/courses/subjects'),
      ]);

      if (qRes.data.success) setQuestions(qRes.data.questions);
      if (sRes.data.success) {
        setSubjects(sRes.data.subjects);
        if (sRes.data.subjects.length > 0 && !formSubjectId) {
          setFormSubjectId(sRes.data.subjects[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load question bank:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOption = () => {
    setFormOptions([...formOptions, { text: '', isCorrect: false }]);
  };

  const handleRemoveOption = (index: number) => {
    if (formOptions.length <= 1) return;
    setFormOptions(formOptions.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, text: string) => {
    const updated = [...formOptions];
    updated[index].text = text;
    setFormOptions(updated);
  };

  const handleOptionCorrectToggle = (index: number) => {
    if (formType === 'MCQ') {
      const updated = formOptions.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }));
      setFormOptions(updated);
    } else {
      const updated = [...formOptions];
      updated[index].isCorrect = !updated[index].isCorrect;
      setFormOptions(updated);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!formText.trim()) {
      addToast('Please enter question text', 'warning');
      return;
    }

    const filledOptions = formOptions.filter((o) => o.text.trim().length > 0);
    if (filledOptions.length === 0) {
      addToast('Please enter at least one option or answer key', 'warning');
      return;
    }

    try {
      const res = await api.post('/questions', {
        text: formText,
        type: formType,
        subjectId: formSubjectId,
        marks: Number(formMarks),
        negativeMarks: Number(formNegative),
        explanation: formExplanation,
        options: filledOptions,
      });

      if (res.data.success) {
        addToast('Question added to repository!', 'success');
        setModalOpen(false);
        // Reset form
        setFormText('');
        setFormExplanation('');
        setFormOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ]);
        loadData();
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Failed to save question', 'error');
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!window.confirm('Delete this question from repository?')) return;
    try {
      await api.delete(`/questions/${qId}`);
      addToast('Question deleted', 'info');
      loadData();
    } catch (e) {
      addToast('Failed to delete question', 'error');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.text.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'ALL' || q.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Academic Repository
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, categorize, and organize questions across subjects and curriculum modules.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2.5 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 w-fit"
        >
          <PlusCircle className="w-4 h-4 text-royal-300" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by text or concept..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-royal-500 outline-none transition"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:bg-white focus:border-royal-500 transition"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code}: {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Question List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy-900">No Questions Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click "Add New Question" to add items to your bank.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-royal-200 transition"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-royal-600">Q#{idx + 1}</span>
                  <span className="font-semibold text-slate-600">
                    [{q.type === 'MCQ' ? 'Single Select' : q.type === 'MULTI_SELECT' ? 'Multi Select' : 'Short Answer'}]
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-bold text-emerald-600">+{q.marks} Pts</span>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-sm font-semibold text-navy-900 mt-3">{q.text}</p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 text-xs">
                {q.options?.map((opt, oIdx) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      opt.isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Correct Key
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {q.explanation && (
                <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  <span className="font-semibold text-slate-700">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Question to Bank"
        maxWidth="xl"
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitQuestion}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-bold shadow-md transition"
            >
              Save to Question Bank
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject</label>
            <select
              value={formSubjectId}
              onChange={(e) => setFormSubjectId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code}: {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Question Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as QuestionType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="MCQ">Single Choice MCQ</option>
                <option value="MULTI_SELECT">Multiple Select</option>
                <option value="SHORT_ANSWER">Short Answer</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Marks</label>
              <input
                type="number"
                value={formMarks}
                onChange={(e) => setFormMarks(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Negative Marks</label>
              <input
                type="number"
                step="0.25"
                value={formNegative}
                onChange={(e) => setFormNegative(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Question Text</label>
            <textarea
              rows={3}
              value={formText}
              onChange={(e) => setFormText(e.target.value)}
              placeholder="Enter clear, unambiguous question text..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          {/* Options List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-semibold text-slate-700">
                Answer Options (Check correct key)
              </label>
              <button
                type="button"
                onClick={handleAddOption}
                className="text-royal-600 hover:underline text-[11px] font-bold"
              >
                + Add Option
              </button>
            </div>

            <div className="space-y-2">
              {formOptions.map((opt, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={opt.isCorrect}
                    onChange={() => handleOptionCorrectToggle(i)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(i)}
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Explanation / Rationale</label>
            <textarea
              rows={2}
              value={formExplanation}
              onChange={(e) => setFormExplanation(e.target.value)}
              placeholder="Why this answer is correct (revealed after submission)..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
