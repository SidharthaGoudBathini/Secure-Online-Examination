import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing tables in proper order
  await prisma.proctoringEvent.deleteMany({});
  await prisma.studentResponse.deleteMany({});
  await prisma.examSession.deleteMany({});
  await prisma.examAssignment.deleteMany({});
  await prisma.answerOption.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.examination.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.globalSecuritySetting.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing records.');

  // Create Global Security Settings
  await prisma.globalSecuritySetting.createMany({
    data: [
      { key: 'MAX_TAB_SWITCHES', value: '3', description: 'Maximum allowed tab switches before proctor warning alert' },
      { key: 'FULLSCREEN_STRICT', value: 'true', description: 'Strict fullscreen mode enforcement during exam sessions' },
      { key: 'WEBCAM_MONITORING', value: 'true', description: 'Webcam snapshot and presence verification requirement' },
      { key: 'COPY_PASTE_PREVENTION', value: 'true', description: 'Disable clipboard copy/paste inside exam window' },
      { key: 'AUTO_SUBMIT_ON_EXPIRY', value: 'true', description: 'Automatically submit exam when countdown timer reaches zero' },
    ],
  });

  // Common password hash for test accounts
  const passwordHash = await bcrypt.hash('Admin@123', 10);
  const facultyPasswordHash = await bcrypt.hash('Faculty@123', 10);
  const studentPasswordHash = await bcrypt.hash('Student@123', 10);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@secureexam.edu',
      passwordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const faculty1 = await prisma.user.create({
    data: {
      email: 'faculty@secureexam.edu',
      passwordHash: facultyPasswordHash,
      fullName: 'Dr. Robert Oppenheimer',
      role: 'FACULTY',
      isActive: true,
    },
  });

  const faculty2 = await prisma.user.create({
    data: {
      email: 'dr.smith@secureexam.edu',
      passwordHash: facultyPasswordHash,
      fullName: 'Prof. Ada Lovelace',
      role: 'FACULTY',
      isActive: true,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student@secureexam.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Alex Walker',
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'jane.doe@secureexam.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Jane Doe',
      role: 'STUDENT',
      isActive: true,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'alex.kumar@secureexam.edu',
      passwordHash: studentPasswordHash,
      fullName: 'Rajesh Kumar',
      role: 'STUDENT',
      isActive: true,
    },
  });

  console.log('👤 Created users: Admin, Faculty (2), Students (3)');

  // 2. Create Courses
  const courseCS = await prisma.course.create({
    data: {
      code: 'CS-UG',
      name: 'Computer Science and Engineering',
      department: 'School of Computing',
      description: 'Undergraduate Computer Science program focusing on algorithms, architecture, and systems engineering.',
    },
  });

  const courseCY = await prisma.course.create({
    data: {
      code: 'CY-SEC',
      name: 'Cybersecurity and Information Assurance',
      department: 'Information Security Institute',
      description: 'Advanced curriculum covering cryptography, cloud security, penetration testing, and ethical hacking.',
    },
  });

  // 3. Create Subjects
  const subjectDSA = await prisma.subject.create({
    data: {
      code: 'CS201',
      name: 'Data Structures and Algorithms',
      courseId: courseCS.id,
      creditHours: 4,
    },
  });

  const subjectOS = await prisma.subject.create({
    data: {
      code: 'CS301',
      name: 'Operating Systems & Concurrency',
      courseId: courseCS.id,
      creditHours: 4,
    },
  });

  const subjectCRYPTO = await prisma.subject.create({
    data: {
      code: 'CY401',
      name: 'Applied Cryptography & Network Defense',
      courseId: courseCY.id,
      creditHours: 3,
    },
  });

  console.log('📚 Created courses and subjects');

  // 4. Create Examinations
  // Exam 1: Active published exam available to student
  const now = new Date();
  const startTime = new Date(now.getTime() - 1000 * 60 * 30); // Started 30 mins ago
  const endTime = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // Closes in 7 days

  const exam1 = await prisma.examination.create({
    data: {
      title: 'CS201: Data Structures Mid-Term Examination',
      code: 'EXAM-CS201-MID',
      description: 'Comprehensive mid-term examination covering Trees, Graphs, Asymptotic Notation, and Sorting Algorithms.',
      subjectId: subjectDSA.id,
      facultyId: faculty1.id,
      durationMinutes: 45,
      totalMarks: 50,
      passingMarks: 20,
      status: 'PUBLISHED',
      startTime,
      endTime,
      randomizeQuestions: true,
      randomizeOptions: true,
      allowNegativeMarking: true,
      negativeMarkingValue: 0.25,
      enableWebcam: true,
      enableAudio: false,
      tabSwitchLimit: 3,
      resultReleasePolicy: 'IMMEDIATE',
    },
  });

  // Exam 2: Scheduled upcoming exam
  const scheduledStart = new Date(now.getTime() + 1000 * 60 * 60 * 48); // In 2 days
  const scheduledEnd = new Date(now.getTime() + 1000 * 60 * 60 * 52);

  const exam2 = await prisma.examination.create({
    data: {
      title: 'CY401: Applied Cryptography Final Assessment',
      code: 'EXAM-CY401-FIN',
      description: 'Covers public key infrastructure, AES encryption, digital signatures, and hash functions.',
      subjectId: subjectCRYPTO.id,
      facultyId: faculty1.id,
      durationMinutes: 60,
      totalMarks: 60,
      passingMarks: 30,
      status: 'SCHEDULED',
      startTime: scheduledStart,
      endTime: scheduledEnd,
      randomizeQuestions: true,
      randomizeOptions: true,
      allowNegativeMarking: false,
      enableWebcam: true,
      enableAudio: true,
      tabSwitchLimit: 2,
      resultReleasePolicy: 'MANUAL',
    },
  });

  // Exam 3: Draft exam by faculty2
  const exam3 = await prisma.examination.create({
    data: {
      title: 'CS301: Operating Systems Kernel Quiz',
      code: 'EXAM-CS301-QUIZ',
      description: 'Quiz testing understanding of process scheduling, semaphores, virtual memory, and paging.',
      subjectId: subjectOS.id,
      facultyId: faculty2.id,
      durationMinutes: 30,
      totalMarks: 30,
      passingMarks: 12,
      status: 'DRAFT',
      randomizeQuestions: false,
      randomizeOptions: false,
      allowNegativeMarking: false,
      enableWebcam: false,
      tabSwitchLimit: 4,
      resultReleasePolicy: 'IMMEDIATE',
    },
  });

  // Exam 4: Completed Exam with already submitted results
  const completedStart = new Date(now.getTime() - 1000 * 60 * 60 * 96);
  const completedEnd = new Date(now.getTime() - 1000 * 60 * 60 * 24);

  const exam4 = await prisma.examination.create({
    data: {
      title: 'CS301: Diagnostic Evaluation Exam',
      code: 'EXAM-CS301-DIAG',
      description: 'Prerequisite readiness assessment.',
      subjectId: subjectOS.id,
      facultyId: faculty2.id,
      durationMinutes: 20,
      totalMarks: 20,
      passingMarks: 10,
      status: 'COMPLETED',
      startTime: completedStart,
      endTime: completedEnd,
      resultReleasePolicy: 'IMMEDIATE',
      resultsReleasedAt: completedEnd,
    },
  });

  console.log('📝 Created 4 Examinations (Published, Scheduled, Draft, Completed)');

  // 5. Add Questions to Exam 1 (Data Structures)
  const q1 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'What is the worst-case time complexity of searching for an element in an unbalanced Binary Search Tree (BST)?',
      type: 'MCQ',
      marks: 5,
      negativeMarks: 1.25,
      explanation: 'In the worst case (skewed tree), a BST degenerates into a linked list resulting in O(n) search time.',
      orderIndex: 1,
      options: {
        create: [
          { text: 'O(1)', isCorrect: false, orderIndex: 1 },
          { text: 'O(log n)', isCorrect: false, orderIndex: 2 },
          { text: 'O(n)', isCorrect: true, orderIndex: 3 },
          { text: 'O(n log n)', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  const q2 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'Which of the following data structures operates on the First-In, First-Out (FIFO) principle?',
      type: 'MCQ',
      marks: 5,
      negativeMarks: 1.25,
      explanation: 'A Queue adheres to FIFO, whereas a Stack adheres to LIFO.',
      orderIndex: 2,
      options: {
        create: [
          { text: 'Stack', isCorrect: false, orderIndex: 1 },
          { text: 'Queue', isCorrect: true, orderIndex: 2 },
          { text: 'Binary Tree', isCorrect: false, orderIndex: 3 },
          { text: 'Priority Queue', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  const q3 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'Which of the following sorting algorithms have an average time complexity of O(n log n)? (Select all that apply)',
      type: 'MULTI_SELECT',
      marks: 10,
      negativeMarks: 2,
      explanation: 'Merge Sort and Quick Sort both exhibit average O(n log n) running times. Bubble sort is O(n^2).',
      orderIndex: 3,
      options: {
        create: [
          { text: 'Merge Sort', isCorrect: true, orderIndex: 1 },
          { text: 'Quick Sort', isCorrect: true, orderIndex: 2 },
          { text: 'Bubble Sort', isCorrect: false, orderIndex: 3 },
          { text: 'Heap Sort', isCorrect: true, orderIndex: 4 },
        ],
      },
    },
  });

  const q4 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'What algorithm is commonly utilized to find the shortest path from a single source node in a weighted graph with non-negative edge weights?',
      type: 'SHORT_ANSWER',
      marks: 10,
      negativeMarks: 0,
      explanation: "Dijkstra's Algorithm finds the shortest path in non-negative weighted graphs.",
      orderIndex: 4,
      options: {
        create: [
          { text: "dijkstra", isCorrect: true, orderIndex: 1 },
          { text: "dijkstra's", isCorrect: true, orderIndex: 2 },
          { text: "dijkstra algorithm", isCorrect: true, orderIndex: 3 },
        ],
      },
    },
  });

  const q5 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'In an AVL tree, what is the maximum permissible difference between heights of left and right subtrees for any given node?',
      type: 'MCQ',
      marks: 10,
      negativeMarks: 2,
      explanation: 'In an AVL tree, the balance factor must be strictly -1, 0, or 1.',
      orderIndex: 5,
      options: {
        create: [
          { text: '0', isCorrect: false, orderIndex: 1 },
          { text: '1', isCorrect: true, orderIndex: 2 },
          { text: '2', isCorrect: false, orderIndex: 3 },
          { text: 'Unlimited', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  const q6 = await prisma.question.create({
    data: {
      examId: exam1.id,
      subjectId: subjectDSA.id,
      text: 'What is the minimum number of stacks required to implement a FIFO Queue?',
      type: 'MCQ',
      marks: 10,
      negativeMarks: 2,
      explanation: 'Two stacks are required to reverse order twice and achieve FIFO behavior.',
      orderIndex: 6,
      options: {
        create: [
          { text: '1', isCorrect: false, orderIndex: 1 },
          { text: '2', isCorrect: true, orderIndex: 2 },
          { text: '3', isCorrect: false, orderIndex: 3 },
          { text: '4', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  // Questions for Completed Exam 4 (for student2 historical result)
  const q4_1 = await prisma.question.create({
    data: {
      examId: exam4.id,
      subjectId: subjectOS.id,
      text: 'What is a process that has finished execution but still has an entry in the process table called?',
      type: 'MCQ',
      marks: 10,
      negativeMarks: 0,
      explanation: 'A zombie process has completed execution but retains an entry until parent reads exit status.',
      orderIndex: 1,
      options: {
        create: [
          { text: 'Zombie Process', isCorrect: true, orderIndex: 1 },
          { text: 'Orphan Process', isCorrect: false, orderIndex: 2 },
          { text: 'Daemon Process', isCorrect: false, orderIndex: 3 },
          { text: 'Ghost Process', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  const q4_2 = await prisma.question.create({
    data: {
      examId: exam4.id,
      subjectId: subjectOS.id,
      text: 'Which CPU scheduling algorithm gives minimum average waiting time for a given set of processes?',
      type: 'MCQ',
      marks: 10,
      negativeMarks: 0,
      explanation: 'Shortest Job First (SJF) is provably optimal regarding average waiting time.',
      orderIndex: 2,
      options: {
        create: [
          { text: 'First-Come First-Served (FCFS)', isCorrect: false, orderIndex: 1 },
          { text: 'Shortest Job First (SJF)', isCorrect: true, orderIndex: 2 },
          { text: 'Round Robin (RR)', isCorrect: false, orderIndex: 3 },
          { text: 'Priority Scheduling', isCorrect: false, orderIndex: 4 },
        ],
      },
    },
  });

  // Assign students to Exam 1
  await prisma.examAssignment.createMany({
    data: [
      { examId: exam1.id, studentId: student1.id, isEligible: true },
      { examId: exam1.id, studentId: student2.id, isEligible: true },
      { examId: exam1.id, studentId: student3.id, isEligible: true },
      { examId: exam2.id, studentId: student1.id, isEligible: true },
      { examId: exam4.id, studentId: student1.id, isEligible: true },
      { examId: exam4.id, studentId: student2.id, isEligible: true },
    ],
  });

  // Seed Completed exam session for student1 on exam4 (so student dashboard has historical stats and charts)
  const pastSession = await prisma.examSession.create({
    data: {
      examId: exam4.id,
      studentId: student1.id,
      status: 'SUBMITTED',
      startedAt: new Date(completedStart.getTime() + 1000 * 60 * 10),
      submittedAt: new Date(completedStart.getTime() + 1000 * 60 * 25),
      expiresAt: new Date(completedStart.getTime() + 1000 * 60 * 30),
      totalScore: 20,
      percentage: 100,
      passed: true,
      feedback: 'Outstanding performance on Operating Systems Diagnostic!',
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      proctorWarningsCount: 0,
    },
  });

  // Seed Responses for student1 on exam4
  const q4_1_opts = await prisma.answerOption.findMany({ where: { questionId: q4_1.id } });
  const q4_1_correct = q4_1_opts.find((o) => o.isCorrect);
  const q4_2_opts = await prisma.answerOption.findMany({ where: { questionId: q4_2.id } });
  const q4_2_correct = q4_2_opts.find((o) => o.isCorrect);

  if (q4_1_correct && q4_2_correct) {
    await prisma.studentResponse.createMany({
      data: [
        {
          examSessionId: pastSession.id,
          questionId: q4_1.id,
          selectedOptionIds: JSON.stringify([q4_1_correct.id]),
          isCorrect: true,
          marksAwarded: 10,
        },
        {
          examSessionId: pastSession.id,
          questionId: q4_2.id,
          selectedOptionIds: JSON.stringify([q4_2_correct.id]),
          isCorrect: true,
          marksAwarded: 10,
        },
      ],
    });
  }

  // Seed notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: student1.id,
        title: 'New Examination Available',
        message: 'CS201 Data Structures Mid-Term is now open for test takers.',
        type: 'INFO',
      },
      {
        userId: student1.id,
        title: 'Exam Graded',
        message: 'Your OS Diagnostic results are available. You scored 20/20 (100%).',
        type: 'SUCCESS',
      },
      {
        userId: faculty1.id,
        title: 'Scheduled Exam Approaching',
        message: 'CY401 Cryptography Final scheduled to open in 48 hours.',
        type: 'INFO',
      },
      {
        userId: admin.id,
        title: 'System Health Check',
        message: 'All proctoring nodes and database instances are operational.',
        type: 'SUCCESS',
      },
    ],
  });

  // Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_INIT',
        entity: 'System',
        details: 'Initial database seeds and security policies created',
      },
      {
        userId: faculty1.id,
        action: 'EXAM_PUBLISHED',
        entity: 'Examination',
        entityId: exam1.id,
        details: 'Published CS201 Midterm Examination',
      },
      {
        userId: student1.id,
        action: 'EXAM_SUBMISSION',
        entity: 'ExamSession',
        entityId: pastSession.id,
        details: 'Submitted CS301 Diagnostic Evaluation with score 20/20',
      },
    ],
  });

  console.log('✅ Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
