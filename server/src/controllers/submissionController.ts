import { Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const startExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const studentId = req.user?.userId;
    if (!studentId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const exam = await prisma.examination.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: {
            options: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
        assignments: {
          where: { studentId },
        },
      },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (exam.status === 'DRAFT') {
      return res.status(403).json({ success: false, message: 'This examination has not been published yet.' });
    }

    const now = new Date();

    // Check time window if scheduled
    if (exam.startTime && now < new Date(exam.startTime)) {
      return res.status(403).json({
        success: false,
        message: `This examination is scheduled to begin at ${new Date(exam.startTime).toLocaleString()}`,
      });
    }

    if (exam.endTime && now > new Date(exam.endTime)) {
      return res.status(403).json({
        success: false,
        message: `This examination concluded on ${new Date(exam.endTime).toLocaleString()}`,
      });
    }

    // Check student eligibility
    if (exam.assignments.length > 0 && !exam.assignments[0].isEligible) {
      return res.status(403).json({
        success: false,
        message: 'You are not eligible to take this examination. Contact your instructor.',
      });
    }

    // Find or create ExamSession
    let session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId,
        },
      },
      include: {
        responses: true,
      },
    });

    if (session) {
      // Check if already finalized
      if (['SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED'].includes(session.status)) {
        return res.status(400).json({
          success: false,
          isCompleted: true,
          message: 'You have already submitted this examination.',
          sessionId: session.id,
        });
      }

      // Check if expired during ongoing session
      if (session.expiresAt && now > new Date(session.expiresAt)) {
        // Auto-finalize
        await finalizeExamSubmission(session.id, 'AUTO_SUBMITTED');
        return res.status(400).json({
          success: false,
          isCompleted: true,
          message: 'The examination time has expired. Your responses have been submitted automatically.',
          sessionId: session.id,
        });
      }
    } else {
      // Create new session
      const startedAt = now;
      const expiresAt = new Date(startedAt.getTime() + exam.durationMinutes * 60 * 1000);

      session = await prisma.examSession.create({
        data: {
          examId,
          studentId,
          status: 'IN_PROGRESS',
          startedAt,
          expiresAt,
        },
        include: {
          responses: true,
        },
      });

      await logAudit({
        userId: studentId,
        action: 'EXAM_STARTED',
        entity: 'ExamSession',
        entityId: session.id,
        ipAddress: req.ip,
        details: `Started examination: ${exam.title}`,
      });
    }

    // Security sanitization: Strip isCorrect and explanation
    let questionsData = exam.questions.map((q) => {
      let options = q.options.map((opt) => ({
        id: opt.id,
        text: opt.text,
        orderIndex: opt.orderIndex,
      }));

      if (exam.randomizeOptions && q.type !== 'SHORT_ANSWER') {
        options = shuffleArray(options);
      }

      return {
        id: q.id,
        text: q.text,
        type: q.type,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        orderIndex: q.orderIndex,
        options,
      };
    });

    if (exam.randomizeQuestions) {
      questionsData = shuffleArray(questionsData);
    }

    // Map existing saved responses
    const savedResponses: Record<
      string,
      { selectedOptionIds: string[]; textResponse: string; isMarkedForReview: boolean }
    > = {};

    session.responses.forEach((resp) => {
      let selectedOptionIds: string[] = [];
      try {
        if (resp.selectedOptionIds) {
          selectedOptionIds = JSON.parse(resp.selectedOptionIds);
        }
      } catch (e) {
        selectedOptionIds = [];
      }

      savedResponses[resp.questionId] = {
        selectedOptionIds,
        textResponse: resp.textResponse || '',
        isMarkedForReview: resp.isMarkedForReview,
      };
    });

    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        status: session.status,
        tabSwitchCount: session.tabSwitchCount,
        fullscreenExitCount: session.fullscreenExitCount,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        code: exam.code,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        tabSwitchLimit: exam.tabSwitchLimit,
        enableWebcam: exam.enableWebcam,
        enableAudio: exam.enableAudio,
        allowNegativeMarking: exam.allowNegativeMarking,
        negativeMarkingValue: exam.negativeMarkingValue,
      },
      questions: questionsData,
      savedResponses,
    });
  } catch (error) {
    console.error('startExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to start examination session' });
  }
};

export const saveAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, selectedOptionIds, textResponse, isMarkedForReview } = req.body;
    const studentId = req.user?.userId;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Exam session not found' });
    }

    if (session.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized session access' });
    }

    if (['SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED'].includes(session.status)) {
      return res.status(400).json({
        success: false,
        message: 'Examination has already been submitted. No further answers can be saved.',
      });
    }

    // Verify deadline (allow 60 seconds grace for network latency)
    if (session.expiresAt) {
      const gracePeriodMs = 60 * 1000;
      if (new Date().getTime() > new Date(session.expiresAt).getTime() + gracePeriodMs) {
        await finalizeExamSubmission(sessionId, 'AUTO_SUBMITTED');
        return res.status(400).json({
          success: false,
          isExpired: true,
          message: 'Exam time has expired. Exam submitted automatically.',
        });
      }
    }

    const saved = await prisma.studentResponse.upsert({
      where: {
        examSessionId_questionId: {
          examSessionId: sessionId,
          questionId,
        },
      },
      update: {
        selectedOptionIds: selectedOptionIds ? JSON.stringify(selectedOptionIds) : null,
        textResponse: textResponse !== undefined ? textResponse : null,
        isMarkedForReview: isMarkedForReview ?? false,
        savedAt: new Date(),
      },
      create: {
        examSessionId: sessionId,
        questionId,
        selectedOptionIds: selectedOptionIds ? JSON.stringify(selectedOptionIds) : null,
        textResponse: textResponse !== undefined ? textResponse : null,
        isMarkedForReview: isMarkedForReview ?? false,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Answer saved',
      savedAt: saved.savedAt,
    });
  } catch (error) {
    console.error('saveAnswer error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save answer' });
  }
};

// Core evaluation function
export async function finalizeExamSubmission(
  sessionId: string,
  submissionStatus: 'SUBMITTED' | 'AUTO_SUBMITTED' = 'SUBMITTED'
) {
  const session = await prisma.examSession.findUnique({
    where: { id: sessionId },
    include: {
      exam: {
        include: {
          questions: {
            include: { options: true },
          },
        },
      },
      responses: true,
    },
  });

  if (!session) throw new Error('Session not found');

  // Idempotency: if already submitted, return existing result
  if (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED') {
    return session;
  }

  const exam = session.exam;
  let totalScore = 0;

  // Grade responses against answer keys
  for (const question of exam.questions) {
    const response = session.responses.find((r) => r.questionId === question.id);
    let isCorrect = false;
    let marksAwarded = 0;

    if (response) {
      if (question.type === 'MCQ') {
        const correctOpt = question.options.find((o) => o.isCorrect);
        let selected: string[] = [];
        try {
          selected = response.selectedOptionIds ? JSON.parse(response.selectedOptionIds) : [];
        } catch (e) {
          selected = [];
        }

        if (correctOpt && selected.length === 1 && selected[0] === correctOpt.id) {
          isCorrect = true;
          marksAwarded = question.marks;
        } else if (selected.length > 0 && exam.allowNegativeMarking) {
          isCorrect = false;
          marksAwarded = -(question.negativeMarks || exam.negativeMarkingValue || 0);
        }
      } else if (question.type === 'MULTI_SELECT') {
        const correctOptIds = question.options.filter((o) => o.isCorrect).map((o) => o.id);
        let selected: string[] = [];
        try {
          selected = response.selectedOptionIds ? JSON.parse(response.selectedOptionIds) : [];
        } catch (e) {
          selected = [];
        }

        const isExactMatch =
          correctOptIds.length === selected.length &&
          correctOptIds.every((id) => selected.includes(id));

        if (isExactMatch) {
          isCorrect = true;
          marksAwarded = question.marks;
        } else if (selected.length > 0 && exam.allowNegativeMarking) {
          isCorrect = false;
          marksAwarded = -(question.negativeMarks || exam.negativeMarkingValue || 0);
        }
      } else if (question.type === 'SHORT_ANSWER') {
        const acceptableTexts = question.options
          .filter((o) => o.isCorrect)
          .map((o) => o.text.trim().toLowerCase());
        const userText = (response.textResponse || '').trim().toLowerCase();

        if (userText && acceptableTexts.some((ans) => ans === userText || userText.includes(ans))) {
          isCorrect = true;
          marksAwarded = question.marks;
        } else if (userText) {
          isCorrect = false;
          marksAwarded = 0;
        }
      }

      await prisma.studentResponse.update({
        where: { id: response.id },
        data: {
          isCorrect,
          marksAwarded,
        },
      });

      totalScore += marksAwarded;
    }
  }

  // Prevent negative total marks
  totalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const percentage =
    exam.totalMarks > 0 ? Math.round((totalScore / exam.totalMarks) * 100 * 10) / 10 : 0;
  const passed = totalScore >= exam.passingMarks;

  const updatedSession = await prisma.examSession.update({
    where: { id: sessionId },
    data: {
      status: submissionStatus,
      submittedAt: new Date(),
      totalScore,
      percentage,
      passed,
    },
    include: {
      exam: true,
      responses: true,
    },
  });

  return updatedSession;
}

export const submitExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const studentId = req.user?.userId;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: true },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.studentId !== studentId) {
      return res.status(403).json({ success: false, message: 'Unauthorized session' });
    }

    // Idempotent submission: if already submitted, return confirmation without recalculating
    if (['SUBMITTED', 'AUTO_SUBMITTED'].includes(session.status)) {
      return res.status(200).json({
        success: true,
        message: 'Exam has already been finalized.',
        session,
      });
    }

    const updatedSession = await finalizeExamSubmission(sessionId, 'SUBMITTED');

    await logAudit({
      userId: studentId,
      action: 'EXAM_SUBMISSION',
      entity: 'ExamSession',
      entityId: sessionId,
      ipAddress: req.ip,
      details: `Submitted examination ${session.exam.title}. Score: ${updatedSession.totalScore}/${session.exam.totalMarks} (${updatedSession.percentage}%)`,
    });

    return res.status(200).json({
      success: true,
      message: 'Examination submitted successfully.',
      session: {
        id: updatedSession.id,
        status: updatedSession.status,
        submittedAt: updatedSession.submittedAt,
        totalScore:
          session.exam.resultReleasePolicy === 'IMMEDIATE' ? updatedSession.totalScore : null,
        percentage:
          session.exam.resultReleasePolicy === 'IMMEDIATE' ? updatedSession.percentage : null,
        passed: session.exam.resultReleasePolicy === 'IMMEDIATE' ? updatedSession.passed : null,
        resultReleasePolicy: session.exam.resultReleasePolicy,
      },
    });
  } catch (error) {
    console.error('submitExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit examination' });
  }
};

export const getExamResult = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    const role = req.user?.role;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            subject: true,
            faculty: { select: { fullName: true } },
            questions: {
              include: { options: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        student: { select: { id: true, fullName: true, email: true } },
        responses: true,
        proctorEvents: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session result not found' });
    }

    // Role security check: only the student or faculty/admin can view result
    if (role === 'STUDENT' && session.studentId !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const exam = session.exam;
    const isReleased =
      role !== 'STUDENT' ||
      exam.resultReleasePolicy === 'IMMEDIATE' ||
      (exam.resultsReleasedAt && new Date() >= new Date(exam.resultsReleasedAt));

    if (!isReleased) {
      return res.status(200).json({
        success: true,
        isPendingRelease: true,
        session: {
          id: session.id,
          status: session.status,
          submittedAt: session.submittedAt,
          examTitle: exam.title,
          examCode: exam.code,
          resultReleasePolicy: exam.resultReleasePolicy,
          message: 'Results will be released after faculty evaluation.',
        },
      });
    }

    // Full result details
    return res.status(200).json({
      success: true,
      isPendingRelease: false,
      session: {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt,
        submittedAt: session.submittedAt,
        totalScore: session.totalScore,
        percentage: session.percentage,
        passed: session.passed,
        feedback: session.feedback,
        tabSwitchCount: session.tabSwitchCount,
        fullscreenExitCount: session.fullscreenExitCount,
        proctorWarningsCount: session.proctorWarningsCount,
        student: session.student,
      },
      exam: {
        id: exam.id,
        title: exam.title,
        code: exam.code,
        subject: exam.subject,
        faculty: exam.faculty,
        totalMarks: exam.totalMarks,
        passingMarks: exam.passingMarks,
        durationMinutes: exam.durationMinutes,
      },
      questions: exam.questions.map((q) => {
        const resp = session.responses.find((r) => r.questionId === q.id);
        let selectedOptionIds: string[] = [];
        try {
          if (resp?.selectedOptionIds) selectedOptionIds = JSON.parse(resp.selectedOptionIds);
        } catch (e) {
          selectedOptionIds = [];
        }

        return {
          id: q.id,
          text: q.text,
          type: q.type,
          marks: q.marks,
          negativeMarks: q.negativeMarks,
          explanation: q.explanation,
          options: q.options,
          studentResponse: resp
            ? {
                selectedOptionIds,
                textResponse: resp.textResponse,
                isCorrect: resp.isCorrect,
                marksAwarded: resp.marksAwarded,
              }
            : null,
        };
      }),
      proctorEvents: session.proctorEvents,
    });
  } catch (error) {
    console.error('getExamResult error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch examination results' });
  }
};

export const getExamSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const exam = await prisma.examination.findUnique({
      where: { id: examId },
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    if (role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const submissions = await prisma.examSession.findMany({
      where: { examId },
      include: {
        student: { select: { id: true, fullName: true, email: true } },
        _count: { select: { responses: true, proctorEvents: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return res.status(200).json({ success: true, submissions });
  } catch (error) {
    console.error('getExamSubmissions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
  }
};

export const gradeSubjectiveResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId, questionId } = req.params;
    const { marksAwarded, feedback } = req.body;
    const role = req.user?.role;
    const userId = req.user?.userId;

    if (role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: true,
        responses: true,
      },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    if (role !== 'ADMIN' && session.exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await prisma.studentResponse.update({
      where: {
        examSessionId_questionId: {
          examSessionId: sessionId,
          questionId,
        },
      },
      data: {
        marksAwarded: Number(marksAwarded),
        isCorrect: Number(marksAwarded) > 0,
      },
    });

    // Recompute total marks for session
    const allResponses = await prisma.studentResponse.findMany({
      where: { examSessionId: sessionId },
    });
    const totalScore = allResponses.reduce((acc, curr) => acc + (curr.marksAwarded || 0), 0);
    const percentage =
      session.exam.totalMarks > 0
        ? Math.round((totalScore / session.exam.totalMarks) * 100 * 10) / 10
        : 0;
    const passed = totalScore >= session.exam.passingMarks;

    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        totalScore,
        percentage,
        passed,
        ...(feedback && { feedback }),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Evaluation saved successfully',
      session: updatedSession,
    });
  } catch (error) {
    console.error('gradeSubjectiveResponse error:', error);
    return res.status(500).json({ success: false, message: 'Failed to grade response' });
  }
};
