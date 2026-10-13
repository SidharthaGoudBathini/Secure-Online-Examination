import { Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { getSocketIO } from '../socket/proctorSocket';
import { logAudit } from '../utils/audit';

const proctorEventSchema = z.object({
  examSessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.enum([
    'FULLSCREEN_ENTER',
    'FULLSCREEN_EXIT',
    'TAB_SWITCH_BLUR',
    'TAB_SWITCH_FOCUS',
    'WEBCAM_DENIED',
    'WEBCAM_RECONNECTED',
    'MULTIPLE_FACES',
    'NO_FACE',
    'SUSPICIOUS_AUDIO',
    'COPY_PASTE_ATTEMPT',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('LOW'),
  details: z.string().optional(),
});

export const logProctorEvent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const studentId = req.user?.userId;
    const parseResult = proctorEventSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { examSessionId, eventType, severity, details } = parseResult.data;

    const session = await prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        exam: true,
        student: { select: { fullName: true, email: true } },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Verify session ownership if student
    if (req.user?.role === 'STUDENT' && session.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Record the event
    const event = await prisma.proctoringEvent.create({
      data: {
        examSessionId,
        eventType,
        severity,
        details: details || null,
      },
    });

    // Update counters
    let updatedTabSwitch = session.tabSwitchCount;
    let updatedFullscreenExit = session.fullscreenExitCount;
    let updatedWarnings = session.proctorWarningsCount;

    if (eventType === 'TAB_SWITCH_BLUR') {
      updatedTabSwitch += 1;
      updatedWarnings += 1;
    } else if (eventType === 'FULLSCREEN_EXIT') {
      updatedFullscreenExit += 1;
      updatedWarnings += 1;
    } else if (['MULTIPLE_FACES', 'NO_FACE', 'COPY_PASTE_ATTEMPT'].includes(eventType)) {
      updatedWarnings += 1;
    }

    await prisma.examSession.update({
      where: { id: examSessionId },
      data: {
        tabSwitchCount: updatedTabSwitch,
        fullscreenExitCount: updatedFullscreenExit,
        proctorWarningsCount: updatedWarnings,
      },
    });

    // Broadcast alert via Socket.IO to faculty monitoring room
    const io = getSocketIO();
    if (io) {
      io.to(`exam:${session.examId}`).emit('live_proctor_alert', {
        id: event.id,
        sessionId: session.id,
        studentId: session.studentId,
        studentName: session.student.fullName,
        studentEmail: session.student.email,
        examId: session.examId,
        examTitle: session.exam.title,
        eventType,
        severity,
        details: details || '',
        timestamp: event.timestamp,
        tabSwitchCount: updatedTabSwitch,
        fullscreenExitCount: updatedFullscreenExit,
        proctorWarningsCount: updatedWarnings,
        limitReached: updatedTabSwitch >= session.exam.tabSwitchLimit,
      });
    }

    // Audit log if high severity
    if (severity === 'HIGH' || updatedTabSwitch >= session.exam.tabSwitchLimit) {
      await logAudit({
        userId: session.studentId,
        action: 'PROCTORING_ALERT',
        entity: 'ExamSession',
        entityId: session.id,
        ipAddress: req.ip,
        details: `Security event [${eventType}] in exam "${session.exam.title}". Total tab switches: ${updatedTabSwitch}`,
      });
    }

    return res.status(201).json({
      success: true,
      event,
      currentStats: {
        tabSwitchCount: updatedTabSwitch,
        fullscreenExitCount: updatedFullscreenExit,
        proctorWarningsCount: updatedWarnings,
        tabSwitchLimit: session.exam.tabSwitchLimit,
        isLimitExceeded: updatedTabSwitch >= session.exam.tabSwitchLimit,
      },
    });
  } catch (error) {
    console.error('logProctorEvent error:', error);
    return res.status(500).json({ success: false, message: 'Failed to log proctoring event' });
  }
};

export const getSessionProctorEvents = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: true },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    if (role === 'STUDENT' && session.studentId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const events = await prisma.proctoringEvent.findMany({
      where: { examSessionId: sessionId },
      orderBy: { timestamp: 'desc' },
    });

    return res.status(200).json({ success: true, events });
  } catch (error) {
    console.error('getSessionProctorEvents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve events' });
  }
};

export const getLiveExamMonitoring = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const exam = await prisma.examination.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Get active and recent sessions
    const sessions = await prisma.examSession.findMany({
      where: { examId },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        proctorEvents: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Recent proctor events across the entire exam
    const recentAlerts = await prisma.proctoringEvent.findMany({
      where: {
        examSession: { examId },
      },
      include: {
        examSession: {
          include: { student: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    return res.status(200).json({
      success: true,
      exam,
      sessions,
      recentAlerts,
    });
  } catch (error) {
    console.error('getLiveExamMonitoring error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load live monitoring' });
  }
};
