import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Course, Subject } from '../../types';
import { Modal } from '../../components/common/Modal';
import { useNotification } from '../../context/NotificationContext';
import { BookOpen, PlusCircle, Edit, Trash2, Layers, Award } from 'lucide-react';

export const CourseSubjectManagement: React.FC = () => {
  const { addToast } = useNotification();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Course modal state
  const [courseModalOpen, setCourseModalOpen] = useState<boolean>(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [courseCode, setCourseCode] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [courseDept, setCourseDept] = useState<string>('');
  const [courseDesc, setCourseDesc] = useState<string>('');

  // Subject modal state
  const [subjectModalOpen, setSubjectModalOpen] = useState<boolean>(false);
  const [targetCourseId, setTargetCourseId] = useState<string>('');
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [subjectCredits, setSubjectCredits] = useState<number>(3);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/courses');
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (e) {
      console.error('Failed to load courses', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openAddCourse = () => {
    setEditCourse(null);
    setCourseCode('');
    setCourseName('');
    setCourseDept('');
    setCourseDesc('');
    setCourseModalOpen(true);
  };

  const handleSaveCourse = async () => {
    if (!courseCode || !courseName || !courseDept) {
      addToast('Code, name and department are required', 'warning');
      return;
    }

    try {
      if (editCourse) {
        await api.put(`/courses/${editCourse.id}`, {
          code: courseCode,
          name: courseName,
          department: courseDept,
          description: courseDesc,
        });
        addToast('Course program updated', 'success');
      } else {
        await api.post('/courses', {
          code: courseCode,
          name: courseName,
          department: courseDept,
          description: courseDesc,
        });
        addToast('New course program created', 'success');
      }
      setCourseModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error saving course', 'error');
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Delete this course and its associated subjects?')) return;
    try {
      await api.delete(`/courses/${id}`);
      addToast('Course deleted', 'info');
      fetchCourses();
    } catch (err: any) {
      addToast('Failed to delete course', 'error');
    }
  };

  const openAddSubject = (courseId: string) => {
    setTargetCourseId(courseId);
    setSubjectCode('');
    setSubjectName('');
    setSubjectCredits(3);
    setSubjectModalOpen(true);
  };

  const handleSaveSubject = async () => {
    if (!subjectCode || !subjectName) {
      addToast('Subject code and name are required', 'warning');
      return;
    }

    try {
      await api.post('/courses/subjects', {
        courseId: targetCourseId,
        code: subjectCode,
        name: subjectName,
        creditHours: subjectCredits,
      });
      addToast('Subject created successfully', 'success');
      setSubjectModalOpen(false);
      fetchCourses();
    } catch (err: any) {
      addToast(err.response?.data?.message || 'Error saving subject', 'error');
    }
  };

  const handleDeleteSubject = async (subId: string) => {
    if (!window.confirm('Delete this subject?')) return;
    try {
      await api.delete(`/courses/subjects/${subId}`);
      addToast('Subject deleted', 'info');
      fetchCourses();
    } catch (err) {
      addToast('Failed to delete subject', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <div>
          <span className="text-[11px] font-bold text-royal-600 uppercase tracking-wider">
            Academic Curriculum
          </span>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight mt-1">
            Courses & Subject Modules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure academic degree programs, departments, and subject units.
          </p>
        </div>

        <button
          onClick={openAddCourse}
          className="px-4 py-2.5 bg-navy-900 hover:bg-royal-600 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 w-fit"
        >
          <PlusCircle className="w-4 h-4 text-royal-300" />
          <span>Add Course Program</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="w-8 h-8 border-4 border-royal-200 border-t-royal-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-extrabold text-royal-600 bg-royal-50 px-2.5 py-0.5 rounded-md border border-royal-100">
                      {course.code}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">• {course.department}</span>
                  </div>
                  <h3 className="font-bold text-lg text-navy-900 mt-1">{course.name}</h3>
                  {course.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{course.description}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openAddSubject(course.id)}
                    className="px-3 py-1.5 bg-royal-50 hover:bg-royal-100 text-royal-700 rounded-xl text-xs font-semibold transition flex items-center space-x-1 border border-royal-200"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Delete course"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Subjects in Course */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Subject Modules ({course.subjects?.length || 0})
                </h4>

                {course.subjects?.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No subject modules added yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {course.subjects?.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white transition flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-500">
                            {sub.code}
                          </span>
                          <h5 className="font-bold text-xs text-navy-900 mt-0.5">{sub.name}</h5>
                          <span className="text-[10px] text-slate-400">
                            {sub.creditHours} Credit Hours
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSubject(sub.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title={editCourse ? 'Edit Course Program' : 'Create Course Program'}
        footer={
          <>
            <button
              onClick={() => setCourseModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCourse}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-bold shadow-md transition"
            >
              Save Course
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS-UG"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={courseDept}
                onChange={(e) => setCourseDept(e.target.value)}
                placeholder="e.g. School of Computing"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Program Name</label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Bachelor of Computer Science"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              rows={2}
              value={courseDesc}
              onChange={(e) => setCourseDesc(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>

      {/* Subject Modal */}
      <Modal
        isOpen={subjectModalOpen}
        onClose={() => setSubjectModalOpen(false)}
        title="Add Subject to Course"
        footer={
          <>
            <button
              onClick={() => setSubjectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSubject}
              className="px-5 py-2 rounded-xl bg-navy-900 hover:bg-royal-600 text-white text-xs font-bold shadow-md transition"
            >
              Save Subject
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject Code</label>
              <input
                type="text"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="e.g. CS201"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Credit Hours</label>
              <input
                type="number"
                value={subjectCredits}
                onChange={(e) => setSubjectCredits(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Subject Name</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Data Structures and Algorithms"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
