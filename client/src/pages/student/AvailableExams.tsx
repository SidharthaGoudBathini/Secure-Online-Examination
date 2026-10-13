import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Examination, Subject } from '../../types';
import { Badge } from '../../components/common/Badge';
import {
  Search,
  Filter,
  Clock,
  Award,
  User,
  Calendar,
  Shield,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export const AvailableExams: React.FC = () => {
  const [exams, setExams] = useState<Examination[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [examRes, subjRes] = await Promise.all([
          api.get('/exams'),
          api.get('/courses/subjects'),
        ]);

        if (examRes.data.success) {
          setExams(examRes.data.exams);
        }
        if (subjRes.data.success) {
          setSubjects(subjRes.data.subjects);
        }
      } catch (err) {
        console.error('Failed to load available examinations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.code.toLowerCase().includes(search.toLowerCase());
    const matchesSubject =
      selectedSubject === 'ALL' || exam.subjectId === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Available Examinations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse active and upcoming assessment schedules for your enrolled courses
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by exam title or course code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-royal-500 focus:ring-2 focus:ring-royal-100 transition"
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

      {/* Exams Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-navy-900">No Examinations Found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search keywords or subject filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const hasSession = exam.sessions && exam.sessions.length > 0;
            const session = hasSession ? exam.sessions![0] : null;
            const isCompleted =
              session && ['SUBMITTED', 'AUTO_SUBMITTED'].includes(session.status);

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-royal-600 bg-royal-50 px-2.5 py-0.5 rounded-md border border-royal-100">
                      {exam.subject?.code}
                    </span>
                    <Badge status={isCompleted ? 'COMPLETED' : exam.status} />
                  </div>

                  <h3 className="font-bold text-base text-navy-900 leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                    {exam.description || 'No description provided.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Duration
                      </span>
                      <span className="font-semibold text-navy-900">{exam.durationMinutes} Minutes</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <Award className="w-3.5 h-3.5 mr-1" /> Total / Pass Marks
                      </span>
                      <span className="font-semibold text-navy-900">
                        {exam.totalMarks} / {exam.passingMarks}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center">
                        <User className="w-3.5 h-3.5 mr-1" /> Instructor
                      </span>
                      <span className="font-semibold text-navy-900 truncate max-w-[150px]">
                        {exam.faculty?.fullName || 'Faculty'}
                      </span>
                    </div>

                    {exam.enableWebcam && (
                      <div className="flex items-center justify-between pt-1 text-[11px] text-royal-700">
                        <span className="flex items-center font-medium">
                          <Shield className="w-3.5 h-3.5 mr-1 text-royal-500" /> Proctoring Rule
                        </span>
                        <span className="font-bold">Webcam & Fullscreen Req.</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {isCompleted ? (
                    <Link
                      to={`/student/results/${session.id}`}
                      className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-navy-900 rounded-xl text-xs font-semibold transition text-center block"
                    >
                      View Results & Score
                    </Link>
                  ) : (
                    <Link
                      to={`/student/exam/${exam.id}/instructions`}
                      className="w-full py-2.5 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-semibold shadow-xs transition flex items-center justify-center space-x-1.5"
                    >
                      <span>Take Examination</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
