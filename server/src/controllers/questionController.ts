import { Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const questionSchema = z.object({
  examId: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  text: z.string().min(3, 'Question text must be at least 3 characters'),
  type: z.enum(['MCQ', 'MULTI_SELECT', 'SHORT_ANSWER']).default('MCQ'),
  marks: z.number().min(0.5, 'Marks must be at least 0.5'),
  negativeMarks: z.number().default(0),
  explanation: z.string().optional(),
  orderIndex: z.number().default(0),
  options: z
    .array(
      z.object({
        text: z.string().min(1, 'Option text is required'),
        isCorrect: z.boolean().default(false),
        orderIndex: z.number().default(0),
      })
    )
    .min(1, 'At least one option or answer key must be provided'),
});

export const getQuestionsByExam = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;

    const exam = await prisma.examination.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      return res.status(404).json({ success: false, message: 'Examination not found' });
    }

    if (role === 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Direct question access forbidden for students outside of active exam sessions.',
      });
    }

    if (role !== 'ADMIN' && exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const questions = await prisma.question.findMany({
      where: { examId },
      include: {
        options: {
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { orderIndex: 'asc' },
    });

    return res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('getQuestionsByExam error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

export const getQuestionBank = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    if (role === 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { subjectId, type, search } = req.query;

    const where: any = {};
    if (subjectId && subjectId !== 'ALL') where.subjectId = String(subjectId);
    if (type && type !== 'ALL') where.type = String(type);
    if (search) {
      where.text = { contains: String(search) };
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        subject: true,
        options: { orderBy: { orderIndex: 'asc' } },
        exam: { select: { id: true, title: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return res.status(200).json({ success: true, questions });
  } catch (error) {
    console.error('getQuestionBank error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch question bank' });
  }
};

export const createQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (role === 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' });

    const parseResult = questionSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { examId, subjectId, text, type, marks, negativeMarks, explanation, orderIndex, options } =
      parseResult.data;

    if (examId) {
      const exam = await prisma.examination.findUnique({ where: { id: examId } });
      if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
      if (role !== 'ADMIN' && exam.facultyId !== userId) {
        return res.status(403).json({ success: false, message: 'Unauthorized to edit this exam' });
      }
    }

    const question = await prisma.question.create({
      data: {
        examId: examId || null,
        subjectId: subjectId || null,
        text,
        type,
        marks,
        negativeMarks,
        explanation,
        orderIndex,
        options: {
          create: options.map((opt, idx) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            orderIndex: opt.orderIndex || idx + 1,
          })),
        },
      },
      include: { options: true },
    });

    // Update totalMarks in exam if examId is provided
    if (examId) {
      const allExamQuestions = await prisma.question.findMany({
        where: { examId },
        select: { marks: true },
      });
      const totalMarks = allExamQuestions.reduce((acc, q) => acc + q.marks, 0);
      await prisma.examination.update({
        where: { id: examId },
        data: { totalMarks },
      });
    }

    await logAudit({
      userId,
      action: 'QUESTION_CREATED',
      entity: 'Question',
      entityId: question.id,
      ipAddress: req.ip,
      details: `Created question: ${text.substring(0, 40)}...`,
    });

    return res.status(201).json({ success: true, message: 'Question created successfully', question });
  } catch (error) {
    console.error('createQuestion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create question' });
  }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (role === 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' });

    const parseResult = questionSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { text, type, marks, negativeMarks, explanation, orderIndex, options } = parseResult.data;

    const existing = await prisma.question.findUnique({
      where: { id },
      include: { exam: true },
    });
    if (!existing) return res.status(404).json({ success: false, message: 'Question not found' });

    if (role !== 'ADMIN' && existing.exam && existing.exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Update question
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      if (options && options.length > 0) {
        await tx.answerOption.deleteMany({ where: { questionId: id } });
        await tx.answerOption.createMany({
          data: options.map((opt, idx) => ({
            questionId: id,
            text: opt.text,
            isCorrect: opt.isCorrect,
            orderIndex: opt.orderIndex || idx + 1,
          })),
        });
      }

      const q = await tx.question.update({
        where: { id },
        data: {
          ...(text && { text }),
          ...(type && { type }),
          ...(marks !== undefined && { marks }),
          ...(negativeMarks !== undefined && { negativeMarks }),
          ...(explanation !== undefined && { explanation }),
          ...(orderIndex !== undefined && { orderIndex }),
        },
        include: { options: true },
      });

      if (existing.examId) {
        const allExamQuestions = await tx.question.findMany({
          where: { examId: existing.examId },
          select: { marks: true },
        });
        const totalMarks = allExamQuestions.reduce((acc, curr) => acc + curr.marks, 0);
        await tx.examination.update({
          where: { id: existing.examId },
          data: { totalMarks },
        });
      }

      return q;
    });

    return res.status(200).json({ success: true, message: 'Question updated successfully', question: updatedQuestion });
  } catch (error) {
    console.error('updateQuestion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update question' });
  }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (role === 'STUDENT') return res.status(403).json({ success: false, message: 'Forbidden' });

    const question = await prisma.question.findUnique({
      where: { id },
      include: { exam: true },
    });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    if (role !== 'ADMIN' && question.exam && question.exam.facultyId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const examId = question.examId;

    await prisma.question.delete({ where: { id } });

    if (examId) {
      const allExamQuestions = await prisma.question.findMany({
        where: { examId },
        select: { marks: true },
      });
      const totalMarks = allExamQuestions.reduce((acc, curr) => acc + curr.marks, 0);
      await prisma.examination.update({
        where: { id: examId },
        data: { totalMarks },
      });
    }

    return res.status(200).json({ success: true, message: 'Question deleted successfully' });
  } catch (error) {
    console.error('deleteQuestion error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};
