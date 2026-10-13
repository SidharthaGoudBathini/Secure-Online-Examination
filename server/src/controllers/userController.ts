import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logAudit } from '../utils/audit';

const userCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['STUDENT', 'FACULTY', 'ADMIN']),
});

export const getUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { role, search, status } = req.query;

    const where: any = {};
    if (role && role !== 'ALL') where.role = String(role);
    if (status !== undefined && status !== 'ALL') {
      where.isActive = status === 'ACTIVE';
    }
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: { examSessions: true, createdExams: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error('getUsers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

export const createUserByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const parseResult = userCreateSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    const { fullName, email, password, role } = parseResult.data;

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      userId: adminId,
      action: 'ADMIN_USER_CREATED',
      entity: 'User',
      entityId: newUser.id,
      ipAddress: req.ip,
      details: `Admin created user ${newUser.fullName} (${newUser.email}) with role ${newUser.role}`,
    });

    return res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('createUserByAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

export const updateUserByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;
    const { fullName, role, isActive, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'User not found' });

    let passwordHash = undefined;
    if (password && password.length >= 6) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(fullName && { fullName }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(passwordHash && { passwordHash }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    await logAudit({
      userId: adminId,
      action: 'ADMIN_USER_UPDATED',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      details: `Admin updated user ${updatedUser.email}`,
    });

    return res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('updateUserByAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

export const deleteUserByAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const adminId = req.user?.userId;

    if (id === adminId) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own administrator account' });
    }

    await prisma.user.delete({ where: { id } });

    await logAudit({
      userId: adminId,
      action: 'ADMIN_USER_DELETED',
      entity: 'User',
      entityId: id,
      ipAddress: req.ip,
      details: `Admin deleted user ID: ${id}`,
    });

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUserByAdmin error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};
