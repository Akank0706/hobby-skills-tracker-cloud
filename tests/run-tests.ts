import { cloudDb } from '../src/server/db.ts';

// Simple lightweight assertion runner
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function runAllTests() {
  console.log('====================================================');
  console.log('RUNNING AUTOMATED TEST SUITE FOR CLOUD HOBBY TRACKER');
  console.log('====================================================\n');

  // Test 1: User Registration
  console.log('[TEST 1] User Registration & Uniqueness');
  try {
    const testEmail = `test_${Date.now()}@example.com`;
    const testUsername = `user_${Date.now()}`;
    const user = cloudDb.createUser({
      name: 'Test Engineer',
      username: testUsername,
      email: testEmail,
      password_hash: 'secret123'
    });
    assert(Boolean(user.user_id), 'User created with unique user_id');
    assert(user.email === testEmail, 'User email matches input');

    // Duplicate check
    const existing = cloudDb.getUserByEmail(testEmail);
    assert(existing !== null, 'Duplicate check detects existing registered email');
  } catch (err: any) {
    assert(false, 'User Registration', err.message);
  }

  // Test 2: Authentication
  console.log('\n[TEST 2] Authentication & Credentials Verification');
  try {
    const alex = cloudDb.getUserByEmail('alex@example.com');
    assert(alex !== null, 'Alex exists in database');
    assert(alex?.password_hash === 'password123', 'Password matches valid credentials');

    const nonExistent = cloudDb.getUserByEmail('nobody@example.com');
    assert(nonExistent === null, 'Invalid login gracefully rejects non-existent email');
  } catch (err: any) {
    assert(false, 'Authentication', err.message);
  }

  // Test 3: Skill Creation & CRUD
  console.log('\n[TEST 3] Skill Management CRUD');
  let testSkillId = '';
  try {
    const skill = cloudDb.createSkill({
      user_id: 'usr_test_999',
      skill_name: 'Python Robotics',
      category: 'Coding',
      current_level: 'BEGINNER',
      target_level: 'ADVANCED',
      start_date: '2026-09-01',
      target_date: '2026-12-01',
      status: 'ACTIVE',
      description: 'Autonomous ROS2 control'
    });
    testSkillId = skill.skill_id;
    assert(Boolean(skill.skill_id), 'Skill created with ID');
    assert(skill.skill_name === 'Python Robotics', 'Skill name stored correctly');

    const userSkills = cloudDb.getSkillsByUser('usr_test_999');
    assert(userSkills.length >= 1, 'getSkillsByUser returns created skill');
  } catch (err: any) {
    assert(false, 'Skill CRUD', err.message);
  }

  // Test 4: Practice Session Logging & Goal Progress
  console.log('\n[TEST 4] Practice Logging & Automatic Progress Calculation');
  try {
    const goal = cloudDb.createGoal({
      user_id: 'usr_test_999',
      skill_id: testSkillId,
      title: 'Practice 20 hours',
      target_value: 20,
      unit: 'hours',
      deadline: '2026-12-31',
      initial_milestones: [5, 10, 20]
    });
    assert(goal.target_value === 20, 'Goal created with target of 20 hours');
    assert(goal.current_value === 0, 'Initial progress is 0');

    // Log 600 minutes (10 hours)
    const logRes = cloudDb.createPracticeSession({
      user_id: 'usr_test_999',
      skill_id: testSkillId,
      duration_minutes: 600,
      activity: 'ROS2 navigation and path planning',
      practiced_at: new Date().toISOString().split('T')[0]
    });
    assert(Boolean(logRes.session.session_id), 'Practice session logged');

    // Verify goal was automatically updated
    const goalsAfter = cloudDb.getGoalsByUser('usr_test_999');
    const updatedGoal = goalsAfter.find(g => g.goal_id === goal.goal_id);
    assert(updatedGoal !== undefined && updatedGoal.current_value === 10, 'Goal progress automatically updated to 10 hours');
    
    // Formula verification: (10 / 20) * 100 = 50%
    const progressPct = ((updatedGoal!.current_value / updatedGoal!.target_value) * 100);
    assert(progressPct === 50, 'Progress percentage calculation equals exactly 50%');

    // Milestones check
    const m5 = updatedGoal?.milestones?.find(m => m.target_value === 5);
    const m10 = updatedGoal?.milestones?.find(m => m.target_value === 10);
    const m20 = updatedGoal?.milestones?.find(m => m.target_value === 20);
    assert(m5?.achieved === true, '5 hours milestone automatically achieved');
    assert(m10?.achieved === true, '10 hours milestone automatically achieved');
    assert(m20?.achieved === false, '20 hours milestone remains pending');
  } catch (err: any) {
    assert(false, 'Practice & Progress', err.message);
  }

  // Test 5: Streak System Logic
  console.log('\n[TEST 5] Practice Streak Calculation Logic');
  try {
    const streakUser = 'usr_streak_test';
    // Clean prior sessions
    const sessions = cloudDb.getPracticeSessionsByUser(streakUser);

    const now = new Date();
    const getDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // Create a dummy skill
    const skill = cloudDb.createSkill({
      user_id: streakUser,
      skill_name: 'Guitar Test',
      category: 'Music',
      current_level: 'BEGINNER',
      target_level: 'INTERMEDIATE',
      start_date: getDate(10),
      target_date: '',
      status: 'ACTIVE',
      description: 'Testing streak'
    });

    // Day 1: 2 days ago
    cloudDb.createPracticeSession({
      user_id: streakUser,
      skill_id: skill.skill_id,
      duration_minutes: 30,
      activity: 'Session 1',
      practiced_at: getDate(2)
    });

    // Day 2: Yesterday
    cloudDb.createPracticeSession({
      user_id: streakUser,
      skill_id: skill.skill_id,
      duration_minutes: 30,
      activity: 'Session 2',
      practiced_at: getDate(1)
    });

    // Day 3: Today
    cloudDb.createPracticeSession({
      user_id: streakUser,
      skill_id: skill.skill_id,
      duration_minutes: 30,
      activity: 'Session 3',
      practiced_at: getDate(0)
    });

    // Duplicate session on same date (Today) - MUST NOT increase streak!
    cloudDb.createPracticeSession({
      user_id: streakUser,
      skill_id: skill.skill_id,
      duration_minutes: 45,
      activity: 'Session 4 (Same day)',
      practiced_at: getDate(0)
    });

    const streakResult = cloudDb.calculateStreak(streakUser);
    assert(streakResult.currentStreak === 3, 'Streak is exactly 3 days for 3 consecutive dates');
    assert(streakResult.longestStreak >= 3, 'Longest streak is at least 3');
  } catch (err: any) {
    assert(false, 'Streak System', err.message);
  }

  // Test 6: Social & Duplicate Like Prevention
  console.log('\n[TEST 6] Social Community & Duplicate Likes Prevention');
  try {
    const post = cloudDb.createPost({
      user_id: 'usr_alex_001',
      content: 'Milestone achieved in guitar!',
      milestone: '5 Hours Practiced'
    });
    assert(Boolean(post.post_id), 'Community post created');

    // First like by Sam
    const like1 = cloudDb.toggleLike(post.post_id, 'usr_sam_002');
    assert(like1.liked === true, 'First like action succeeds (liked: true)');
    assert(like1.likesCount === 1, 'Likes count is incremented to 1');

    // Second action by Sam (toggling like unlikes, preventing duplicate entries)
    const like2 = cloudDb.toggleLike(post.post_id, 'usr_sam_002');
    assert(like2.liked === false, 'Second like action toggles unlike (liked: false)');
    assert(like2.likesCount === 0, 'Likes count decremented cleanly');

    // Re-like
    const like3 = cloudDb.toggleLike(post.post_id, 'usr_sam_002');
    assert(like3.liked === true && like3.likesCount === 1, 'Re-liking sets count back to 1 without duplicates');
  } catch (err: any) {
    assert(false, 'Social Community', err.message);
  }

  // Test 7: Comments & Authorization Checks
  console.log('\n[TEST 7] Comments & User Ownership Authorization');
  try {
    const feed = cloudDb.getCommunityFeed({ limit: 5 });
    const targetPost = feed[0];
    
    // Sam adds comment
    const comment = cloudDb.addComment(targetPost.post_id, 'usr_sam_002', 'Super inspiring progress!');
    assert(Boolean(comment.comment_id), 'Comment added by Sam');
    assert(comment.author_name === 'Sam Chen', 'Comment linked to author name');

    // Alex attempts to delete Sam's comment -> MUST throw unauthorized error
    let unauthorizedBlocked = false;
    try {
      cloudDb.deleteComment(comment.comment_id, 'usr_alex_001');
    } catch {
      unauthorizedBlocked = true;
    }
    assert(unauthorizedBlocked, 'Alex is prevented from deleting Sam comment (authorization enforced)');

    // Sam deletes own comment -> MUST succeed
    const deleted = cloudDb.deleteComment(comment.comment_id, 'usr_sam_002');
    assert(deleted === true, 'Sam can delete their own comment');
  } catch (err: any) {
    assert(false, 'Comments Authorization', err.message);
  }

  // Test 8: Data Isolation
  console.log('\n[TEST 8] User Data Isolation');
  try {
    const alexSkills = cloudDb.getSkillsByUser('usr_alex_001');
    const samSkills = cloudDb.getSkillsByUser('usr_sam_002');

    const hasOverlap = alexSkills.some(as => samSkills.some(ss => ss.skill_id === as.skill_id));
    assert(!hasOverlap, 'Alex and Sam skills are strictly isolated');

    // Sam cannot delete Alex skill
    let deleteBlocked = false;
    try {
      cloudDb.deleteSkill(alexSkills[0].skill_id, 'usr_sam_002');
    } catch {
      deleteBlocked = true;
    }
    assert(deleteBlocked, 'Cross-user deletion attempt blocked on cloud database layer');
  } catch (err: any) {
    assert(false, 'Data Isolation', err.message);
  }

  // Test 9: Analytics Calculation
  console.log('\n[TEST 9] Analytics Calculation Verification');
  try {
    const alexAnalytics = cloudDb.getAnalytics('usr_alex_001');
    assert(alexAnalytics.totalPracticeHours > 0, 'Total practice hours is calculated and > 0');
    assert(alexAnalytics.weeklyTrend.length === 7, 'Weekly trend includes all 7 days');
    assert(alexAnalytics.unlockedBadges.length >= 6, 'Badge evaluation includes all 6 core badges');
    assert(alexAnalytics.currentStreak >= 1, 'Current streak matches active sessions');
  } catch (err: any) {
    assert(false, 'Analytics', err.message);
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAllTests();
