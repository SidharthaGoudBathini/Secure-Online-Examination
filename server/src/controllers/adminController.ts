import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const getAdminAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalStudents,
      totalFaculty,
      totalExams,
      activeExams,
      completedExams,
      totalSubmissions,
      recentAuditLogs,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.user.count({ where: { role: 'FACULTY' } }),
      prisma.examination.count(),
      prisma.examination.count({ where: { status: { in: ['PUBLISHED', 'ONGOING'] } } }),
      prisma.examination.count({ where: { status: 'COMPLETED' } }),
      prisma.examSession.count({ where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } } }),
      prisma.auditLog.findMany({
        include: { user: { select: { fullName: true, email: true, role: true } } },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      prisma.user.findMany({
        select: { id: true, fullName: true, email: true, role: true, createdAt: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // Pass rate across all submitted sessions
    const passedSessions = await prisma.examSession.count({
      where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] }, passed: true },
    });
    const overallPassRate =
      totalSubmissions > 0 ? Math.round((passedSessions / totalSubmissions) * 100) : 0;

    // Security violation count
    const totalViolations = await prisma.proctoringEvent.count({
      where: { severity: { in: ['MEDIUM', 'HIGH'] } },
    });

    return res.status(200).json({
      success: true,
      analytics: {
        totalStudents,
        totalFaculty,
        totalExams,
        activeExams,
        completedExams,
        totalSubmissions,
        overallPassRate,
        totalViolations,
        recentAuditLogs,
        recentUsers,
      },
    });
  } catch (error) {
    console.error('getAdminAnalytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load administrator analytics' });
  }
};

export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, entity, search, limit = '50', page = '1' } = req.query;

    const where: any = {};
    if (action && action !== 'ALL') where.action = String(action);
    if (entity && entity !== 'ALL') where.entity = String(entity);
    if (search) {
      where.OR = [
        { action: { contains: String(search) } },
        { entity: { contains: String(search) } },
        { details: { contains: String(search) } },
      ];
    }

    const take = Math.min(100, Math.max(1, parseInt(String(limit), 10)));
    const skip = (Math.max(1, parseInt(String(page), 10)) - 1) * take;

    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true, role: true } },
        },
        orderBy: { timestamp: 'desc' },
        take,
        skip,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      logs,
      totalCount,
      totalPages: Math.ceil(totalCount / take),
      currentPage: Math.max(1, parseInt(String(page), 10)),
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load audit logs' });
  }
};

export const getGlobalSecuritySettings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await prisma.globalSecuritySetting.findMany({
      orderBy: { key: 'asc' },
    });
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load security settings' });
  }
};

export const updateGlobalSecuritySetting = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key, value } = req.body;
    const adminId = req.user?.userId;

    const updated = await prisma.globalSecuritySetting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value), description: 'Configured by Admin' },
    });

    await logAudit({
      userId: adminId,
      action: 'SECURITY_SETTING_CHANGED',
      entity: 'GlobalSecuritySetting',
      details: `Changed setting ${key} to "${value}"`,
    });

    return res.status(200).json({ success: true, setting: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update security setting' });
  }
};

export const getComprehensiveReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Subject-wise performance
    const subjects = await prisma.subject.findMany({
      include: {
        exams: {
          include: {
            sessions: {
              where: { status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] } },
            },
          },
        },
      },
    });

    const subjectReports = subjects.map((subj) => {
      let totalExams = subj.exams.length;
      let totalSubmissions = 0;
      let totalScoreSum = 0;
      let totalPassed = 0;

      subj.exams.forEach((exam) => {
        totalSubmissions += exam.sessions.length;
        exam.sessions.forEach((sess) => {
          totalScoreSum += sess.percentage || 0;
          if (sess.passed) totalPassed += 1;
        });
      });

      const avgScore = totalSubmissions > 0 ? Math.round(totalScoreSum / totalSubmissions) : 0;
      const passRate = totalSubmissions > 0 ? Math.round((totalPassed / totalSubmissions) * 100) : 0;

      return {
        id: subj.id,
        code: subj.code,
        name: subj.name,
        totalExams,
        totalSubmissions,
        avgScore,
        passRate,
      };
    });

    // Proctoring violations breakdown
    const violationBreakdown = await prisma.proctoringEvent.groupBy({
      by: ['eventType'],
      _count: { id: true },
    });

    const violationChartData = violationBreakdown.map((item) => ({
      type: item.eventType.replace(/_/g, ' '),
      count: item._count.id,
    }));

    return res.status(200).json({
      success: true,
      subjectReports,
      violationChartData,
    });
  } catch (error) {
    console.error('getComprehensiveReports error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate reports' });
  }
};

export const exportResultsCsv = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.query;
    const where: any = {
      status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] },
    };

    if (examId) {
      where.examId = String(examId);
    }

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        student: { select: { fullName: true, email: true } },
        exam: { select: { title: true, code: true, totalMarks: true, passingMarks: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // Generate CSV string
    const headers = [
      'Student Name',
      'Student Email',
      'Exam Title',
      'Exam Code',
      'Score',
      'Total Marks',
      'Percentage (%)',
      'Result Status',
      'Tab Switches',
      'Fullscreen Exits',
      'Submitted At',
    ];

    const rows = sessions.map((s) => [
      `"${s.student.fullName.replace(/"/g, '""')}"`,
      `"${s.student.email}"`,
      `"${s.exam.title.replace(/"/g, '""')}"`,
      `"${s.exam.code}"`,
      s.totalScore ?? 0,
      s.exam.totalMarks,
      s.percentage ?? 0,
      s.passed ? 'PASSED' : 'FAILED',
      s.tabSwitchCount,
      s.fullscreenExitCount,
      s.submittedAt ? s.submittedAt.toISOString() : '',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="examination_results_export.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('exportResultsCsv error:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV report' });
  }
};
