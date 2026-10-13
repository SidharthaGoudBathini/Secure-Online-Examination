export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  isActive?: boolean;
  createdAt?: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  description?: string;
  subjects?: Subject[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  courseId: string;
  creditHours: number;
  course?: { id: string; code: string; name: string };
  _count?: { exams: number; questions: number };
}

export type ExamStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED';
export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'SHORT_ANSWER';
export type ResultReleasePolicy = 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED';

export interface AnswerOption {
  id: string;
  text: string;
  isCorrect?: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  examId?: string | null;
  subjectId?: string | null;
  text: string;
  type: QuestionType;
  marks: number;
  negativeMarks?: number;
  explanation?: string;
  orderIndex: number;
  options: AnswerOption[];
  studentResponse?: {
    selectedOptionIds?: string[];
    textResponse?: string;
    isCorrect?: boolean;
    marksAwarded?: number;
  } | null;
}

export interface Examination {
  id: string;
  title: string;
  code: string;
  description?: string;
  subjectId: string;
  facultyId: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  status: ExamStatus;
  startTime?: string | null;
  endTime?: string | null;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  allowNegativeMarking: boolean;
  negativeMarkingValue: number;
  enableWebcam: boolean;
  enableAudio: boolean;
  tabSwitchLimit: number;
  resultReleasePolicy: ResultReleasePolicy;
  resultsReleasedAt?: string | null;
  subject?: Subject;
  faculty?: { id: string; fullName: string; email: string };
  _count?: { questions: number; sessions: number };
  sessions?: ExamSession[];
  questions?: Question[];
}

export type SessionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'TERMINATED';

export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  status: SessionStatus;
  startedAt?: string;
  submittedAt?: string;
  expiresAt?: string;
  totalScore?: number | null;
  percentage?: number | null;
  passed?: boolean | null;
  feedback?: string | null;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  proctorWarningsCount: number;
  student?: { id: string; fullName: string; email: string };
  exam?: Examination;
  responses?: StudentResponse[];
  proctorEvents?: ProctoringEvent[];
}

export interface StudentResponse {
  id: string;
  examSessionId: string;
  questionId: string;
  selectedOptionIds?: string;
  textResponse?: string;
  isCorrect?: boolean;
  marksAwarded?: number;
  isMarkedForReview: boolean;
  savedAt: string;
}

export type ProctorEventType =
  | 'FULLSCREEN_ENTER'
  | 'FULLSCREEN_EXIT'
  | 'TAB_SWITCH_BLUR'
  | 'TAB_SWITCH_FOCUS'
  | 'WEBCAM_DENIED'
  | 'WEBCAM_RECONNECTED'
  | 'MULTIPLE_FACES'
  | 'NO_FACE'
  | 'SUSPICIOUS_AUDIO'
  | 'COPY_PASTE_ATTEMPT';

export interface ProctoringEvent {
  id: string;
  examSessionId: string;
  eventType: ProctorEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  details?: string;
  timestamp: string;
  examSession?: {
    id: string;
    student: { fullName: string; email: string };
  };
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  details?: string | null;
  timestamp: string;
  user?: { fullName: string; email: string; role: string } | null;
}

export interface GlobalSecuritySetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}
