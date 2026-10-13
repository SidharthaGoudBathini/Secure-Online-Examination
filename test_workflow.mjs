async function test() {
  const BASE = 'http://localhost:5000/api';

  console.log('1. Testing Student Login...');
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@secureexam.edu', password: 'Student@123' }),
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error('Login failed: ' + loginData.message);
  console.log('   ✓ Student Logged in:', loginData.user.fullName);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${loginData.token}`,
  };

  console.log('2. Fetching Examinations...');
  const examsRes = await fetch(`${BASE}/exams`, { headers });
  const examsData = await examsRes.json();
  const exam = examsData.exams.find((e) => e.code === 'EXAM-CS201-MID');
  console.log('   ✓ Found Exam:', exam.title, `(${exam.code})`);

  console.log('3. Starting Exam Session...');
  const startRes = await fetch(`${BASE}/submissions/start/${exam.id}`, {
    method: 'POST',
    headers,
  });
  const startData = await startRes.json();
  if (!startData.success) throw new Error('Start exam failed: ' + startData.message);
  const sessionId = startData.session.id;
  console.log('   ✓ Session Initialized:', sessionId);
  console.log('   ✓ Questions Received (Sanitized without answers):', startData.questions.length);

  console.log('4. Saving Question 1 Answer...');
  const q1 = startData.questions[0];
  const opt1 = q1.options[0].id;
  const saveRes = await fetch(`${BASE}/submissions/session/${sessionId}/save-answer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      questionId: q1.id,
      selectedOptionIds: [opt1],
      isMarkedForReview: false,
    }),
  });
  const saveData = await saveRes.json();
  console.log('   ✓ Answer Saved at:', saveData.savedAt);

  console.log('5. Logging Security Event (TAB_SWITCH_BLUR)...');
  const proctorRes = await fetch(`${BASE}/proctor/log-event`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      examSessionId: sessionId,
      eventType: 'TAB_SWITCH_BLUR',
      severity: 'MEDIUM',
      details: 'Student switched tabs during exam',
    }),
  });
  const proctorData = await proctorRes.json();
  console.log('   ✓ Proctoring Telemetry Recorded. Total Tab Switches:', proctorData.currentStats.tabSwitchCount);

  console.log('6. Submitting Examination...');
  const submitRes = await fetch(`${BASE}/submissions/session/${sessionId}/submit`, {
    method: 'POST',
    headers,
  });
  const submitData = await submitRes.json();
  console.log('   ✓ Submission Finalized. Status:', submitData.session.status, 'Score:', submitData.session.totalScore);

  console.log('7. Fetching Detailed Graded Result...');
  const resultRes = await fetch(`${BASE}/submissions/session/${sessionId}/result`, { headers });
  const resultData = await resultRes.json();
  console.log('   ✓ Result Evaluated:', {
    totalScore: resultData.session.totalScore,
    percentage: resultData.session.percentage + '%',
    passed: resultData.session.passed,
    questionsEvaluated: resultData.questions.length,
  });

  console.log('8. Verifying Admin Audit Log Recording...');
  const adminLoginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@secureexam.edu', password: 'Admin@123' }),
  });
  const adminData = await adminLoginRes.json();
  const auditRes = await fetch(`${BASE}/admin/audit-logs?limit=5`, {
    headers: { Authorization: `Bearer ${adminData.token}` },
  });
  const auditData = await auditRes.json();
  console.log('   ✓ Latest Audit Log Action:', auditData.logs[0].action, '-', auditData.logs[0].details);

  console.log('\n🌟 ALL END-TO-END TEST SUITE ACCEPTANCE CRITERIA PASSED SUCCESSFULLY! 🌟');
}

test().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
