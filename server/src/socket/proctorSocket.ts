import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';

let ioInstance: Server | null = null;

export const setSocketIO = (io: Server) => {
  ioInstance = io;
};

export const getSocketIO = () => ioInstance;

export const initProctorSocket = (io: Server) => {
  setSocketIO(io);

  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    (socket as any).user = payload;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    // console.log(`Socket connected: ${user.email} (${user.role})`);

    // Join room for exam
    socket.on('join_exam_room', ({ examId }) => {
      socket.join(`exam:${examId}`);
      // If student joins, emit to faculty
      if (user.role === 'STUDENT') {
        io.to(`exam:${examId}`).emit('student_status_update', {
          studentId: user.userId,
          studentName: user.fullName,
          status: 'ONLINE',
          timestamp: new Date(),
        });
      }
    });

    // Leave room
    socket.on('leave_exam_room', ({ examId }) => {
      socket.leave(`exam:${examId}`);
    });

    // Student sends proctor ping or heartbeat
    socket.on('proctor_heartbeat', ({ examId, sessionId, status }) => {
      io.to(`exam:${examId}`).emit('proctor_heartbeat_update', {
        studentId: user.userId,
        studentName: user.fullName,
        sessionId,
        status,
        timestamp: new Date(),
      });
    });

    // Faculty sends direct warning message to student
    socket.on('send_warning_to_student', ({ studentId, examId, warningMessage }) => {
      if (user.role === 'FACULTY' || user.role === 'ADMIN') {
        io.to(`exam:${examId}`).emit(`student_warning:${studentId}`, {
          from: user.fullName,
          message: warningMessage,
          timestamp: new Date(),
        });
      }
    });

    // Faculty forces termination
    socket.on('force_submit_student', ({ studentId, examId, reason }) => {
      if (user.role === 'FACULTY' || user.role === 'ADMIN') {
        io.to(`exam:${examId}`).emit(`force_terminate:${studentId}`, {
          reason: reason || 'Instructor forced examination submission.',
          timestamp: new Date(),
        });
      }
    });

    socket.on('disconnect', () => {
      // console.log(`Socket disconnected: ${user.email}`);
    });
  });
};
