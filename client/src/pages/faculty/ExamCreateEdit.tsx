import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../services/api';
import { Subject } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import {
  FileText,
  Clock,
  Award,
  Shield,
  Save,
  ArrowLeft,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  code: z.string().min(2, 'Code is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Please select a subject'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 min'),
  totalMarks: z.number().min(1, 'Total marks must be positive'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  allowNegativeMarking: z.boolean().default(false),
  negativeMarkingValue: z.number().default(0.25),
  enableWebcam: z.boolean().default(true),
  enableAudio: z.boolean().default(false),
  tabSwitchLimit: z.number().default(3),
  resultReleasePolicy: z.enum(['IMMEDIATE', 'MANUAL', 'SCHEDULED']).default('IMMEDIATE'),
});

type ExamFormData = z.infer<typeof examSchema>;

export const ExamCreateEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useNotification();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(isEditing);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ExamFormData>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      durationMinutes: 45,
      totalMarks: 50,
      passingMarks: 20,
      randomizeQuestions: true,
      randomizeOptions: true,
      allowNegativeMarking: false,
      negativeMarkingValue: 0.25,
      enableWebcam: true,
      enableAudio: false,
      tabSwitchLimit: 3,
      resultReleasePolicy: 'IMMEDIATE',
    },
  });

  const allowNegative = watch('allowNegativeMarking');

  useEffect(() => {
    const loadData = async () => {
      try {
        const subRes = await api.get('/courses/subjects');
        if (subRes.data.success) {
          setSubjects(subRes.data.subjects);
        }

        if (isEditing) {
          const examRes = await api.get(`/exams/${id}`);
          if (examRes.data.success) {
            const e = examRes.data.exam;
            reset({
              title: e.title,
              code: e.code,
              description: e.description || '',
              subjectId: e.subjectId,
              durationMinutes: e.durationMinutes,
              totalMarks: e.totalMarks,
              passingMarks: e.passingMarks,
              randomizeQuestions: e.randomizeQuestions,
              randomizeOptions: e.randomizeOptions,
              allowNegativeMarking: e.allowNegativeMarking,
              negativeMarkingValue: e.negativeMarkingValue,
              enableWebcam: e.enableWebcam,
              enableAudio: e.enableAudio,
              tabSwitchLimit: e.tabSwitchLimit,
              resultReleasePolicy: e.resultReleasePolicy,
            });
          }
        }
      } catch (err) {
        console.error('Failed to load exam data', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditing, reset]);

  const onSubmit = async (data: ExamFormData) => {
    setSubmitting(true);
    try {
      if (isEditing) {
        const res = await api.put(`/exams/${id}`, data);
        if (res.data.success) {
          addToast('Examination updated successfully!', 'success');
          navigate('/faculty/dashboard');
        }
      } else {
        const res = await api.post('/exams', data);
        if (res.data.success) {
          addToast('Examination created as draft!', 'success');
          navigate(`/faculty/exam/${res.data.exam.id}/preview`);
        }
      }
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error saving examination', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/faculty/dashboard"
          className="text-xs font-semibold text-slate-500 hover:text-navy-900 flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs">
        <div className="pb-5 border-b border-slate-100">
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Assessment Configurator
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            {isEditing ? 'Edit Examination' : 'Create New Examination'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Set academic metadata, security policies, proctoring thresholds, and grading rules.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-royal-500" />
              <span>General Examination Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Title
                </label>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="e.g. CS201 Data Structures Midterm"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 focus:ring-1 focus:ring-royal-500 outline-none"
                />
                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Examination Code
                </label>
                <input
                  type="text"
                  {...register('code')}
                  placeholder="e.g. EXAM-CS201-MID"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 focus:ring-1 focus:ring-royal-500 outline-none"
                />
                {errors.code && <p className="text-[11px] text-rose-500 mt-1">{errors.code.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject / Course
                </label>
                <select
                  {...register('subjectId')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
                >
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}: {s.name}
                    </option>
                  ))}
                </select>
                {errors.subjectId && <p className="text-[11px] text-rose-500 mt-1">{errors.subjectId.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Result Release Policy
                </label>
                <select
                  {...register('resultReleasePolicy')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
                >
                  <option value="IMMEDIATE">Immediate (Auto-released upon submission)</option>
                  <option value="MANUAL">Manual (Withheld until instructor review)</option>
                  <option value="SCHEDULED">Scheduled Date</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Syllabus Notes
              </label>
              <textarea
                rows={2}
                {...register('description')}
                placeholder="Topics covered, test format, allowed resources..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
              />
            </div>
          </div>

          {/* Scoring & Duration */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Duration & Scoring Thresholds</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  {...register('durationMinutes', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  {...register('totalMarks', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  {...register('passingMarks', { valueAsNumber: true })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-royal-500 outline-none"
                />
              </div>
            </div>

            {/* Negative Marking Toggles */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('allowNegativeMarking')}
                  className="w-4 h-4 text-royal-600 rounded-md border-slate-300 focus:ring-royal-500"
                />
                <span className="text-xs font-semibold text-navy-900">
                  Enable Negative Marking for Incorrect Options
                </span>
              </label>

              {allowNegative && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deduction per incorrect question (Points)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    {...register('negativeMarkingValue', { valueAsNumber: true })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Security & Proctoring Settings */}
          <div className="space-y-4 pt-5 border-t border-slate-100">
            <h3 className="text-sm font-bold text-navy-900 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-amber-600" />
              <span>Examination Security & Proctoring Rules</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableWebcam')}
                  className="w-4 h-4 text-royal-600 rounded-md border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-navy-900 block">Require Webcam Verification</span>
                  <span className="text-[11px] text-slate-500">Live AI face & presence monitoring</span>
                </div>
              </label>

              <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('randomizeQuestions')}
                  className="w-4 h-4 text-royal-600 rounded-md border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-navy-900 block">Randomize Question Sequence</span>
                  <span className="text-[11px] text-slate-500">Scramble order for each student</span>
                </div>
              </label>

              <label className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('randomizeOptions')}
                  className="w-4 h-4 text-royal-600 rounded-md border-slate-300"
                />
                <div>
                  <span className="text-xs font-bold text-navy-900 block">Randomize Answer Options</span>
                  <span className="text-[11px] text-slate-500">Shuffle option choices per question</span>
                </div>
              </label>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Tab-Switch Warning Threshold
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  {...register('tabSwitchLimit', { valueAsNumber: true })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Alert instructor when switches reach this count
                </span>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link
              to="/faculty/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-royal-300" />
              <span>{isEditing ? 'Save Changes' : 'Create & Proceed to Questions'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
