import { Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const examSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  code: z.string().min(2, 'Code is required'),
  description: z.string().optional(),
  subjectId: z.string().min(1, 'Subject is required'),
  durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
  totalMarks: z.number().min(1, 'Total marks must be positive'),
  passingMarks: z.number().min(0, 'Passing marks cannot be negative'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
  allowNegativeMarking: z.boolean().default(false),
  negativeMarkingValue: z.number().default(0.25),
  enableWebcam: z.boolean().default(true),
  enableAudio: z.boolean().default(false),
  tabSwitchLimit: z.number().default(3),
  resultReleasePolicy: z.enum(['IMMEDIATE', 'MANUAL', 'SCHEDULED']).default('IMMEDIATE'),
});

export const getExams = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    const { status, subjectId, search } = req.query;

    const where: any = {};

    if (status && status !== 'ALL') {
      where.status = String(status);
    }
    if (subjectId && subjectId !== 'ALL') {
      where.subjectId = String(subjectId);
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { code: { contains: String(search) } },
        { description: { contains: String(search) } },
      ];
    }

    // Role-specific filtering
    if (role === 'FACULTY') {
      // Faculty sees their own created exams
      where.facultyId = userId;
    } else if (role === 'STUDENT') {
      // Students only see PUBLISHED or ONGOING or COMPLETED exams (no DRAFT)
      if (!where.status) {
        where.status = { in: ['PUBLISHED', 'ONGOING', 'COMPLETED', 'SCHEDULED'] };
      }
    }

    const exams = await prisma.examination.findMany({
      where,
      include: {
        subject: {
          select: { id: true, code: true, name: true },
        },
        faculty: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { questions: true, sessions: true },
        },
        sessions: userId
          ? {
              where: { studentId: userId },
              select: {
                id: true,
                status: true,
                startedAt: true,
                submittedAt: true,
                totalScore: true,
                percentage: true,
                passed: true,
              },
            }
          : false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, exams });
  } catch (error) {
    console.error('getExams error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch examinations' });
  }
};

export const getExamById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const exam = await prisma.examination.findUnique({
      where: { id },
      include: {
        subject: {
          include: { course: true },
        },
        faculty: {
          select: { id: true, fullName: true, email: true },
        },
        _count: {
          select: { questions: true, sessions: true },
        },
        sessions: userId
          ? {
              where: { studentId: userId },
            }
          : false,
      },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    // Students cannot view draft exams
    if (role === 'STUDENT' && exam.status === 'DRAFT') {
      return res.status(403).json({ success: false, message: 'This examination is currently a draft.' });
    }

    return res.status(200).json({ success: true, exam });
  } catch (error) {
    console.error('getExamById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch examination' });
  }
};

export const createExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const parseResult = examSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    // Check code uniqueness
    const existing = await prisma.examination.findUnique({ where: { code: data.code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An exam with this code already exists.' });
    }

    const newExam = await prisma.examination.create({
      data: {
        ...data,
        facultyId: userId,
        status: 'DRAFT',
        startTime: data.startTime ? new Date(data.startTime) : null,
        endTime: data.endTime ? new Date(data.endTime) : null,
      },
    });

    await logAudit({
      userId,
      action: 'EXAM_CREATED',
      entity: 'Examination',
      entityId: newExam.id,
      ipAddress: req.ip,
      details: `Created draft exam: ${newExam.title} (${newExam.code})`,
    });

    return res.status(201).json({ success: true, message: 'Exam created successfully', exam: newExam });
  } catch (error) {
    console.error('createExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create examination' });
  }
};

export const updateExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const exam = await prisma.examination.findUnique({ where: { id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this exam' });
    }

    const parseResult = examSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const data = parseResult.data;

    const updatedExam = await prisma.examination.update({
      where: { id },
      data: {
        ...data,
        ...(data.startTime !== undefined && { startTime: data.startTime ? new Date(data.startTime) : null }),
        ...(data.endTime !== undefined && { endTime: data.endTime ? new Date(data.endTime) : null }),
      },
    });

    await logAudit({
      userId,
      action: 'EXAM_UPDATED',
      entity: 'Examination',
      entityId: updatedExam.id,
      ipAddress: req.ip,
      details: `Updated exam: ${updatedExam.title}`,
    });

    return res.status(200).json({ success: true, message: 'Exam updated successfully', exam: updatedExam });
  } catch (error) {
    console.error('updateExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update examination' });
  }
};

export const deleteExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const exam = await prisma.examination.findUnique({ where: { id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this exam' });
    }

    // Only allow deletion of DRAFT exams to preserve audit integrity
    if (exam.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only draft examinations can be deleted. Published or completed exams must be archived.',
      });
    }

    await prisma.examination.delete({ where: { id } });

    await logAudit({
      userId,
      action: 'EXAM_DELETED',
      entity: 'Examination',
      entityId: id,
      ipAddress: req.ip,
      details: `Deleted draft exam: ${exam.title}`,
    });

    return res.status(200).json({ success: true, message: 'Draft examination deleted successfully' });
  } catch (error) {
    console.error('deleteExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete examination' });
  }
};

export const publishExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const exam = await prisma.examination.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this exam' });
    }

    if (exam.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot publish an examination with no questions. Please add questions first.',
      });
    }

    const updatedExam = await prisma.examination.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    // Notify all students
    const students = await prisma.user.findMany({ where: { role: 'STUDENT', isActive: true } });
    if (students.length > 0) {
      await prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          title: `New Exam Published: ${updatedExam.title}`,
          message: `Examination ${updatedExam.code} is now available.`,
          type: 'INFO',
        })),
      });
    }

    await logAudit({
      userId,
      action: 'EXAM_PUBLISHED',
      entity: 'Examination',
      entityId: id,
      ipAddress: req.ip,
      details: `Published exam: ${updatedExam.title}`,
    });

    return res.status(200).json({ success: true, message: 'Examination published successfully', exam: updatedExam });
  } catch (error) {
    console.error('publishExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to publish examination' });
  }
};

export const getExamPreview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const exam = await prisma.examination.findUnique({
      where: { id },
      include: {
        subject: true,
        questions: {
          include: {
            options: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // Students are strictly prohibited from previewing exams with correct answers
    if (role === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Students cannot access examination preview mode.',
      });
    }

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to preview this exam' });
    }

    return res.status(200).json({ success: true, exam });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch exam preview' });
  }
};

export const getStudentDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const now = new Date();

    const [allPublished, sessions, recentNotifications] = await Promise.all([
      prisma.examination.findMany({
        where: {
          status: { in: ['PUBLISHED', 'ONGOING', 'SCHEDULED'] },
        },
        include: {
          subject: true,
          faculty: { select: { fullName: true } },
          sessions: {
            where: { studentId },
            select: { id: true, status: true, totalScore: true, percentage: true, passed: true },
          },
        },
      }),
      prisma.examSession.findMany({
        where: {
          studentId,
          status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        },
        include: {
          exam: {
            include: { subject: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.notification.findMany({
        where: { userId: studentId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const availableExams = allPublished.filter((e) => {
      const hasSession = e.sessions.length > 0;
      const isCompleted = hasSession && ['SUBMITTED', 'AUTO_SUBMITTED'].includes(e.sessions[0].status);
      return !isCompleted;
    });

    const completedExams = sessions;

    const totalScorePercentage = sessions.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const averageScore = sessions.length > 0 ? Math.round(totalScorePercentage / sessions.length) : 0;
    const passedCount = sessions.filter((s) => s.passed).length;

    return res.status(200).json({
      success: true,
      stats: {
        availableCount: availableExams.length,
        completedCount: completedExams.length,
        averageScore,
        passedCount,
        availableExams,
        completedExams,
        recentNotifications,
      },
    });
  } catch (error) {
    console.error('getStudentDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load student dashboard stats' });
  }
};

export const getFacultyDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const facultyId = req.user?.userId;
    if (!facultyId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const [exams, totalSubmissions, recentSessions] = await Promise.all([
      prisma.examination.findMany({
        where: { facultyId },
        include: {
          subject: true,
          _count: { select: { questions: true, sessions: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.examSession.count({
        where: {
          exam: { facultyId },
          status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
        },
      }),
      prisma.examSession.findMany({
        where: {
          exam: { facultyId },
          status: { in: ['SUBMITTED', 'AUTO_SUBMITTED', 'IN_PROGRESS'] },
        },
        include: {
          exam: { select: { title: true, code: true } },
          student: { select: { fullName: true, email: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 8,
      }),
    ]);

    const activeCount = exams.filter((e) => e.status === 'PUBLISHED' || e.status === 'ONGOING').length;
    const draftCount = exams.filter((e) => e.status === 'DRAFT').length;

    return res.status(200).json({
      success: true,
      stats: {
        totalExams: exams.length,
        activeExams: activeCount,
        draftExams: draftCount,
        totalSubmissions,
        exams,
        recentSessions,
      },
    });
  } catch (error) {
    console.error('getFacultyDashboardStats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load faculty dashboard stats' });
  }
};
