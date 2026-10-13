import { Request, Response } from 'express';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        subjects: {
          include: {
            _count: { select: { exams: true, questions: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });
    return res.status(200).json({ success: true, courses });
  } catch (error) {
    console.error('getCourses error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

export const createCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, department, description } = req.body;
    if (!code || !name || !department) {
      return res.status(400).json({ success: false, message: 'Code, name, and department are required' });
    }

    const course = await prisma.course.create({
      data: { code, name, department, description },
    });

    await logAudit({
      userId: req.user?.userId,
      action: 'COURSE_CREATED',
      entity: 'Course',
      entityId: course.id,
      ipAddress: req.ip,
      details: `Created course: ${course.name} (${course.code})`,
    });

    return res.status(201).json({ success: true, course });
  } catch (error) {
    console.error('createCourse error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create course' });
  }
};

export const updateCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, department, description } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: { code, name, department, description },
    });

    return res.status(200).json({ success: true, course });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update course' });
  }
};

export const deleteCourse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.course.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete course' });
  }
};

export const getSubjects = async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query;
    const where: any = {};
    if (courseId) where.courseId = String(courseId);

    const subjects = await prisma.subject.findMany({
      where,
      include: {
        course: { select: { id: true, code: true, name: true } },
        _count: { select: { exams: true, questions: true } },
      },
      orderBy: { code: 'asc' },
    });

    return res.status(200).json({ success: true, subjects });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
  }
};

export const createSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, name, courseId, creditHours } = req.body;
    if (!code || !name || !courseId) {
      return res.status(400).json({ success: false, message: 'Code, name, and course are required' });
    }

    const subject = await prisma.subject.create({
      data: { code, name, courseId, creditHours: Number(creditHours) || 3 },
    });

    return res.status(201).json({ success: true, subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create subject' });
  }
};

export const updateSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { code, name, creditHours } = req.body;

    const subject = await prisma.subject.update({
      where: { id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(creditHours && { creditHours: Number(creditHours) }),
      },
    });

    return res.status(200).json({ success: true, subject });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update subject' });
  }
};

export const deleteSubject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.subject.delete({ where: { id } });
    return res.status(200).json({ success: true, message: 'Subject deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete subject' });
  }
};
