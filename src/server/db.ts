import fs from 'fs';
import path from 'path';
import {
  UserProfile,
  Skill,
  Goal,
  Milestone,
  PracticeSession,
  Post,
  Comment,
  Badge,
  DashboardAnalytics
} from '../types';

interface StoredUser extends UserProfile {
  password_hash: string;
}

interface DBData {
  users: Record<string, StoredUser>;
  skills: Record<string, Skill>;
  goals: Record<string, Goal>;
  milestones: Record<string, Milestone>;
  practice_sessions: Record<string, PracticeSession>;
  posts: Record<string, Post>;
  likes: Record<string, Record<string, string>>; // postId -> { userId: liked_at }
  comments: Record<string, Comment>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

const INITIAL_BADGES: Omit<Badge, 'unlocked' | 'unlocked_at'>[] = [
  {
    id: 'first_practice',
    name: 'First Practice',
    description: 'Logged your very first practice session',
    icon: '🎯'
  },
  {
    id: 'streak_7',
    name: '7 Day Streak',
    description: 'Practiced consistently for 7 consecutive days',
    icon: '🔥'
  },
  {
    id: 'hours_10',
    name: '10 Hours Practiced',
    description: 'Invested 10 total hours into skill development',
    icon: '⏳'
  },
  {
    id: 'hours_25',
    name: '25 Hours Practiced',
    description: 'Reached the 25 hours milestone of deep practice',
    icon: '⭐'
  },
  {
    id: 'hours_50',
    name: '50 Hours Practiced',
    description: 'Halfway to mastery with 50 practice hours',
    icon: '🏆'
  },
  {
    id: 'goal_completed',
    name: 'First Goal Completed',
    description: 'Achieved 100% of a defined skill target',
    icon: '🎖️'
  }
];

class CloudDatabase {
  private data: DBData = {
    users: {},
    skills: {},
    goals: {},
    milestones: {},
    practice_sessions: {},
    posts: {},
    likes: {},
    comments: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using in-memory state:', err);
      this.seedInitialData();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  public seedInitialData() {
    const now = new Date();
    const isoNow = now.toISOString();

    // Helper date generator
    const getPastDate = (daysAgo: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      return d.toISOString().split('T')[0];
    };

    // User A: Alex
    const alexId = 'usr_alex_001';
    const samId = 'usr_sam_002';

    this.data.users[alexId] = {
      user_id: alexId,
      name: 'Alex Rivera',
      username: 'alex_r',
      email: 'alex@example.com',
      password_hash: 'password123', // In demo/simulated cloud DB
      profile_picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      bio: 'Cloud computing student passionate about acoustic guitar and landscape photography.',
      interests: ['Photography', 'Guitar', 'Cloud Computing'],
      created_at: getPastDate(20)
    };

    // User B: Sam
    this.data.users[samId] = {
      user_id: samId,
      name: 'Sam Chen',
      username: 'sam_dev',
      email: 'sam@example.com',
      password_hash: 'password123',
      profile_picture: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop',
      bio: 'Software enthusiast learning UI/UX design, Rust, and oil painting.',
      interests: ['Coding', 'Art', 'Fitness'],
      created_at: getPastDate(15)
    };

    // Alex's Skills
    const skillGuitar = 'sk_guitar_01';
    const skillPhoto = 'sk_photo_02';

    this.data.skills[skillGuitar] = {
      skill_id: skillGuitar,
      user_id: alexId,
      skill_name: 'Guitar',
      category: 'Music',
      current_level: 'BEGINNER',
      target_level: 'INTERMEDIATE',
      start_date: getPastDate(14),
      target_date: getPastDate(-60),
      status: 'ACTIVE',
      description: 'Mastering chord transitions, fingerpicking patterns, and acoustic rhythm.',
      created_at: getPastDate(14)
    };

    this.data.skills[skillPhoto] = {
      skill_id: skillPhoto,
      user_id: alexId,
      skill_name: 'Photography',
      category: 'Photography',
      current_level: 'BEGINNER',
      target_level: 'ADVANCED',
      start_date: getPastDate(20),
      target_date: getPastDate(-90),
      status: 'ACTIVE',
      description: 'Understanding manual exposure, portrait lighting, and RAW post-processing.',
      created_at: getPastDate(20)
    };

    // Sam's Skills
    const skillCoding = 'sk_coding_01';
    this.data.skills[skillCoding] = {
      skill_id: samId,
      user_id: samId,
      skill_name: 'Coding',
      category: 'Coding',
      current_level: 'INTERMEDIATE',
      target_level: 'ADVANCED',
      start_date: getPastDate(15),
      target_date: getPastDate(-45),
      status: 'ACTIVE',
      description: 'Building distributed cloud applications and learning system design.',
      created_at: getPastDate(15)
    };

    // Alex's Goal: Practice 30 hours
    const goalGuitar = 'gl_guitar_30h';
    this.data.goals[goalGuitar] = {
      goal_id: goalGuitar,
      user_id: alexId,
      skill_id: skillGuitar,
      title: 'Practice 30 hours',
      target_value: 30,
      current_value: 18,
      unit: 'hours',
      deadline: getPastDate(-30),
      status: 'IN_PROGRESS',
      created_at: getPastDate(14)
    };

    // Milestones for Goal
    this.data.milestones['ms_5h'] = {
      milestone_id: 'ms_5h',
      goal_id: goalGuitar,
      title: '5 Hours Practiced',
      target_value: 5,
      achieved: true,
      achieved_at: getPastDate(10)
    };
    this.data.milestones['ms_10h'] = {
      milestone_id: 'ms_10h',
      goal_id: goalGuitar,
      title: '10 Hours Practiced',
      target_value: 10,
      achieved: true,
      achieved_at: getPastDate(5)
    };
    this.data.milestones['ms_20h'] = {
      milestone_id: 'ms_20h',
      goal_id: goalGuitar,
      title: '20 Hours Practiced',
      target_value: 20,
      achieved: false
    };
    this.data.milestones['ms_30h'] = {
      milestone_id: 'ms_30h',
      goal_id: goalGuitar,
      title: '30 Hours Practiced',
      target_value: 30,
      achieved: false
    };

    // Practice Sessions for Alex (consecutive days leading up to today to establish a 4-day streak)
    const sessions = [
      { id: 'ps_1', skill: skillGuitar, name: 'Guitar', mins: 120, act: 'Chord transitions (C, G, Em, D)', date: getPastDate(3) },
      { id: 'ps_2', skill: skillGuitar, name: 'Guitar', mins: 180, act: 'Fingerpicking arpeggios & metronome practice', date: getPastDate(2) },
      { id: 'ps_3', skill: skillPhoto, name: 'Photography', mins: 90, act: 'Natural light portrait composition in park', date: getPastDate(1) },
      { id: 'ps_4', skill: skillGuitar, name: 'Guitar', mins: 60, act: 'Barre chord exercises and barre endurance', date: getPastDate(0) },
      { id: 'ps_5', skill: skillGuitar, name: 'Guitar', mins: 360, act: 'Acoustic tabs & rhythm practice', date: getPastDate(7) },
      { id: 'ps_6', skill: skillGuitar, name: 'Guitar', mins: 270, act: 'Song accompaniment practice', date: getPastDate(8) }
    ];

    sessions.forEach(s => {
      this.data.practice_sessions[s.id] = {
        session_id: s.id,
        user_id: alexId,
        skill_id: s.skill,
        skill_name: s.name,
        duration_minutes: s.mins,
        activity: s.act,
        notes: `Focus session recorded on ${s.date}`,
        practiced_at: s.date,
        created_at: `${s.date}T10:00:00.000Z`
      };
    });

    // Community Posts
    const post1 = 'pst_alex_001';
    this.data.posts[post1] = {
      post_id: post1,
      user_id: alexId,
      author_name: 'Alex Rivera',
      author_username: 'alex_r',
      author_avatar: this.data.users[alexId].profile_picture,
      skill_id: skillGuitar,
      skill_name: 'Guitar',
      content: 'Completed 18 hours of acoustic guitar practice! Finally nailed clean barre chords after consistent daily sessions.',
      media_url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop',
      milestone: '10 Hours Practiced Milestone Passed',
      likes_count: 1,
      comments_count: 1,
      created_at: `${getPastDate(1)}T14:30:00.000Z`
    };

    // Likes & Comments
    this.data.likes[post1] = {
      [samId]: `${getPastDate(1)}T15:00:00.000Z`
    };

    const comm1 = 'cm_sam_001';
    this.data.comments[comm1] = {
      comment_id: comm1,
      post_id: post1,
      user_id: samId,
      author_name: 'Sam Chen',
      author_username: 'sam_dev',
      author_avatar: this.data.users[samId].profile_picture,
      text: 'Great work Alex! Clean barre chords take real finger endurance.',
      created_at: `${getPastDate(1)}T15:05:00.000Z`
    };

    this.save();
  }

  // --- Users & Auth ---
  public getUserById(id: string): UserProfile | null {
    const user = this.data.users[id];
    if (!user) return null;
    const { password_hash, ...profile } = user;
    return profile;
  }

  public getUserByEmail(email: string): StoredUser | null {
    const cleanEmail = email.toLowerCase().trim();
    for (const id in this.data.users) {
      if (this.data.users[id].email.toLowerCase() === cleanEmail) {
        return this.data.users[id];
      }
    }
    return null;
  }

  public getUserByUsername(username: string): StoredUser | null {
    const clean = username.toLowerCase().trim();
    for (const id in this.data.users) {
      if (this.data.users[id].username.toLowerCase() === clean) {
        return this.data.users[id];
      }
    }
    return null;
  }

  public createUser(userData: {
    name: string;
    username: string;
    email: string;
    password_hash: string;
    bio?: string;
    interests?: string[];
  }): UserProfile {
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const profile: StoredUser = {
      user_id: userId,
      name: userData.name,
      username: userData.username.toLowerCase().trim(),
      email: userData.email.toLowerCase().trim(),
      password_hash: userData.password_hash,
      profile_picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${userData.username}`,
      bio: userData.bio || 'New learner tracking skills on the cloud.',
      interests: userData.interests || [],
      created_at: new Date().toISOString()
    };

    this.data.users[userId] = profile;
    this.save();

    const { password_hash, ...publicProfile } = profile;
    return publicProfile;
  }

  public updateUserProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'bio' | 'interests' | 'profile_picture'>>
  ): UserProfile {
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found');

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.bio !== undefined) user.bio = updates.bio.trim();
    if (updates.interests !== undefined) user.interests = updates.interests;
    if (updates.profile_picture !== undefined) user.profile_picture = updates.profile_picture;

    // Also update author details on user's posts
    for (const pid in this.data.posts) {
      if (this.data.posts[pid].user_id === userId) {
        if (updates.name) this.data.posts[pid].author_name = updates.name;
        if (updates.profile_picture) this.data.posts[pid].author_avatar = updates.profile_picture;
      }
    }

    this.save();
    const { password_hash, ...publicProfile } = user;
    return publicProfile;
  }

  // --- Skills ---
  public getSkillsByUser(userId: string): Skill[] {
    return Object.values(this.data.skills)
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSkillById(skillId: string): Skill | null {
    return this.data.skills[skillId] || null;
  }

  public createSkill(skillData: Omit<Skill, 'skill_id' | 'created_at'>): Skill {
    const skill_id = `sk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const skill: Skill = {
      ...skillData,
      skill_id,
      created_at: new Date().toISOString()
    };
    this.data.skills[skill_id] = skill;
    this.save();
    return skill;
  }

  public updateSkill(skillId: string, userId: string, updates: Partial<Skill>): Skill {
    const skill = this.data.skills[skillId];
    if (!skill) throw new Error('Skill not found');
    if (skill.user_id !== userId) throw new Error('Unauthorized: cannot edit another user skill');

    Object.assign(skill, updates);
    this.save();
    return skill;
  }

  public deleteSkill(skillId: string, userId: string): boolean {
    const skill = this.data.skills[skillId];
    if (!skill) throw new Error('Skill not found');
    if (skill.user_id !== userId) throw new Error('Unauthorized: cannot delete another user skill');

    delete this.data.skills[skillId];

    // Cascade delete practice sessions and goals for this skill
    for (const gid in this.data.goals) {
      if (this.data.goals[gid].skill_id === skillId) {
        delete this.data.goals[gid];
      }
    }
    for (const sid in this.data.practice_sessions) {
      if (this.data.practice_sessions[sid].skill_id === skillId) {
        delete this.data.practice_sessions[sid];
      }
    }

    this.save();
    return true;
  }

  // --- Goals & Milestones ---
  public getGoalsByUser(userId: string): Goal[] {
    const goals = Object.values(this.data.goals).filter(g => g.user_id === userId);
    return goals.map(g => {
      const milestones = Object.values(this.data.milestones).filter(m => m.goal_id === g.goal_id);
      return { ...g, milestones };
    });
  }

  public createGoal(
    goalData: Omit<Goal, 'goal_id' | 'current_value' | 'status' | 'created_at'> & {
      initial_milestones?: number[];
    }
  ): Goal {
    const goal_id = `gl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    
    // Calculate current practiced value for this skill
    const sessions = Object.values(this.data.practice_sessions).filter(
      s => s.user_id === goalData.user_id && s.skill_id === goalData.skill_id
    );
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const currentValue = goalData.unit.toLowerCase().includes('hour')
      ? Math.round((totalMinutes / 60) * 10) / 10
      : totalMinutes;

    const isCompleted = currentValue >= goalData.target_value;

    const goal: Goal = {
      goal_id,
      user_id: goalData.user_id,
      skill_id: goalData.skill_id,
      title: goalData.title,
      target_value: goalData.target_value,
      current_value: currentValue,
      unit: goalData.unit,
      deadline: goalData.deadline,
      status: isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      created_at: new Date().toISOString()
    };

    this.data.goals[goal_id] = goal;

    // Create default milestones if target allows
    const milestoneTargets = goalData.initial_milestones || [
      Math.round(goalData.target_value * 0.2),
      Math.round(goalData.target_value * 0.5),
      Math.round(goalData.target_value * 0.75),
      goalData.target_value
    ].filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx);

    milestoneTargets.forEach(target => {
      const mid = `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const achieved = currentValue >= target;
      this.data.milestones[mid] = {
        milestone_id: mid,
        goal_id,
        title: `${target} ${goal.unit} Milestone`,
        target_value: target,
        achieved,
        achieved_at: achieved ? new Date().toISOString() : undefined
      };
    });

    this.save();
    return {
      ...goal,
      milestones: Object.values(this.data.milestones).filter(m => m.goal_id === goal_id)
    };
  }

  public updateGoal(goalId: string, userId: string, updates: Partial<Goal>): Goal {
    const goal = this.data.goals[goalId];
    if (!goal) throw new Error('Goal not found');
    if (goal.user_id !== userId) throw new Error('Unauthorized');

    Object.assign(goal, updates);
    if (goal.current_value >= goal.target_value) {
      goal.status = 'COMPLETED';
    }

    this.save();
    return {
      ...goal,
      milestones: Object.values(this.data.milestones).filter(m => m.goal_id === goalId)
    };
  }

  public deleteGoal(goalId: string, userId: string): boolean {
    const goal = this.data.goals[goalId];
    if (!goal) throw new Error('Goal not found');
    if (goal.user_id !== userId) throw new Error('Unauthorized');

    delete this.data.goals[goalId];
    for (const mid in this.data.milestones) {
      if (this.data.milestones[mid].goal_id === goalId) {
        delete this.data.milestones[mid];
      }
    }
    this.save();
    return true;
  }

  // --- Practice Sessions & Tracking ---
  public getPracticeSessionsByUser(userId: string, skillId?: string): PracticeSession[] {
    return Object.values(this.data.practice_sessions)
      .filter(s => s.user_id === userId && (!skillId || s.skill_id === skillId))
      .sort((a, b) => new Date(b.practiced_at).getTime() - new Date(a.practiced_at).getTime());
  }

  public createPracticeSession(sessionData: {
    user_id: string;
    skill_id: string;
    duration_minutes: number;
    activity: string;
    notes?: string;
    practiced_at?: string;
  }): { session: PracticeSession; streak: number; milestonesAchieved: string[] } {
    const skill = this.data.skills[sessionData.skill_id];
    if (!skill) throw new Error('Skill not found');

    const practicedDate = sessionData.practiced_at
      ? sessionData.practiced_at.split('T')[0]
      : new Date().toISOString().split('T')[0];

    const session_id = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const session: PracticeSession = {
      session_id,
      user_id: sessionData.user_id,
      skill_id: sessionData.skill_id,
      skill_name: skill.skill_name,
      duration_minutes: Number(sessionData.duration_minutes),
      activity: sessionData.activity.trim(),
      notes: (sessionData.notes || '').trim(),
      practiced_at: practicedDate,
      created_at: new Date().toISOString()
    };

    this.data.practice_sessions[session_id] = session;

    // Automatically recalculate goals & milestones for this skill
    const milestonesAchieved: string[] = [];
    const userGoals = Object.values(this.data.goals).filter(
      g => g.user_id === sessionData.user_id && g.skill_id === sessionData.skill_id
    );

    const allSessions = Object.values(this.data.practice_sessions).filter(
      s => s.user_id === sessionData.user_id && s.skill_id === sessionData.skill_id
    );
    const totalMins = allSessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    for (const goal of userGoals) {
      const isHours = goal.unit.toLowerCase().includes('hour');
      const val = isHours ? Math.round((totalMins / 60) * 10) / 10 : totalMins;
      goal.current_value = val;
      if (goal.current_value >= goal.target_value) {
        goal.status = 'COMPLETED';
      }

      // Check milestones for this goal
      const mList = Object.values(this.data.milestones).filter(m => m.goal_id === goal.goal_id);
      for (const m of mList) {
        if (!m.achieved && val >= m.target_value) {
          m.achieved = true;
          m.achieved_at = new Date().toISOString();
          milestonesAchieved.push(m.title);
        }
      }
    }

    this.save();

    const streakData = this.calculateStreak(sessionData.user_id);
    return {
      session,
      streak: streakData.currentStreak,
      milestonesAchieved
    };
  }

  // --- Streak Calculation ---
  public calculateStreak(userId: string): { currentStreak: number; longestStreak: number } {
    const sessions = Object.values(this.data.practice_sessions).filter(s => s.user_id === userId);
    if (sessions.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Get unique calendar dates formatted as YYYY-MM-DD
    const dateSet = new Set<string>();
    sessions.forEach(s => {
      const d = s.practiced_at.split('T')[0];
      dateSet.add(d);
    });

    const dates = Array.from(dateSet).sort(); // Ascending chronological order
    if (dates.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Calculate longest consecutive streak historically
    let longest = 1;
    let currentRun = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays === 1) {
        currentRun++;
        if (currentRun > longest) longest = currentRun;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }

    // Calculate current active streak relative to today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const lastPracticedStr = dates[dates.length - 1];

    let currentStreak = 0;
    // Streak is active only if practiced today or yesterday
    if (lastPracticedStr === todayStr || lastPracticedStr === yesterdayStr) {
      currentStreak = 1;
      let checkDate = new Date(lastPracticedStr);

      for (let i = dates.length - 2; i >= 0; i--) {
        const prev = new Date(dates[i]);
        const diff = Math.round((checkDate.getTime() - prev.getTime()) / (1000 * 3600 * 24));
        if (diff === 1) {
          currentStreak++;
          checkDate = prev;
        } else {
          break;
        }
      }
    }

    if (currentStreak > longest) longest = currentStreak;

    return { currentStreak, longestStreak: longest };
  }

  // --- Community Posts ---
  public getCommunityFeed(params: {
    category?: string;
    search?: string;
    sort?: 'recent' | 'likes';
    limit?: number;
    currentUserId?: string;
  }): Post[] {
    let posts = Object.values(this.data.posts);

    // Filter by category
    if (params.category && params.category !== 'All') {
      posts = posts.filter(p => {
        if (!p.skill_id) return false;
        const sk = this.data.skills[p.skill_id];
        return sk && sk.category.toLowerCase() === params.category!.toLowerCase();
      });
    }

    // Search by content or author or skill
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      posts = posts.filter(
        p =>
          p.content.toLowerCase().includes(q) ||
          p.author_name.toLowerCase().includes(q) ||
          p.author_username.toLowerCase().includes(q) ||
          (p.skill_name && p.skill_name.toLowerCase().includes(q))
      );
    }

    // Sort
    if (params.sort === 'likes') {
      posts.sort((a, b) => b.likes_count - a.likes_count || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else {
      posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Attach is_liked_by_me
    const uid = params.currentUserId;
    const result = posts.map(p => {
      const postLikes = this.data.likes[p.post_id] || {};
      const isLiked = uid ? Boolean(postLikes[uid]) : false;
      return {
        ...p,
        is_liked_by_me: isLiked,
        likes_count: Object.keys(postLikes).length
      };
    });

    if (params.limit && params.limit > 0) {
      return result.slice(0, params.limit);
    }
    return result;
  }

  public createPost(postData: {
    user_id: string;
    content: string;
    skill_id?: string;
    milestone?: string;
    media_url?: string;
  }): Post {
    const user = this.data.users[postData.user_id];
    if (!user) throw new Error('User not found');

    const skill = postData.skill_id ? this.data.skills[postData.skill_id] : undefined;

    const post_id = `pst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const post: Post = {
      post_id,
      user_id: user.user_id,
      author_name: user.name,
      author_username: user.username,
      author_avatar: user.profile_picture,
      skill_id: postData.skill_id,
      skill_name: skill ? skill.skill_name : undefined,
      content: postData.content.trim(),
      milestone: postData.milestone,
      media_url: postData.media_url,
      likes_count: 0,
      comments_count: 0,
      created_at: new Date().toISOString(),
      is_liked_by_me: false
    };

    this.data.posts[post_id] = post;
    this.data.likes[post_id] = {};
    this.save();
    return post;
  }

  public deletePost(postId: string, userId: string): boolean {
    const post = this.data.posts[postId];
    if (!post) throw new Error('Post not found');
    if (post.user_id !== userId) throw new Error('Unauthorized: cannot delete someone else post');

    delete this.data.posts[postId];
    delete this.data.likes[postId];

    for (const cid in this.data.comments) {
      if (this.data.comments[cid].post_id === postId) {
        delete this.data.comments[cid];
      }
    }

    this.save();
    return true;
  }

  // --- Likes & Comments ---
  public toggleLike(postId: string, userId: string): { liked: boolean; likesCount: number } {
    const post = this.data.posts[postId];
    if (!post) throw new Error('Post not found');

    if (!this.data.likes[postId]) {
      this.data.likes[postId] = {};
    }

    const postLikes = this.data.likes[postId];
    let liked = false;

    if (postLikes[userId]) {
      // Unlike
      delete postLikes[userId];
      liked = false;
    } else {
      // Prevent duplicate like - set unique key
      postLikes[userId] = new Date().toISOString();
      liked = true;
    }

    post.likes_count = Object.keys(postLikes).length;
    this.save();

    return { liked, likesCount: post.likes_count };
  }

  public getComments(postId: string): Comment[] {
    return Object.values(this.data.comments)
      .filter(c => c.post_id === postId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addComment(postId: string, userId: string, text: string): Comment {
    const post = this.data.posts[postId];
    if (!post) throw new Error('Post not found');
    const user = this.data.users[userId];
    if (!user) throw new Error('User not found');

    const comment_id = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const comment: Comment = {
      comment_id,
      post_id: postId,
      user_id: userId,
      author_name: user.name,
      author_username: user.username,
      author_avatar: user.profile_picture,
      text: text.trim(),
      created_at: new Date().toISOString()
    };

    this.data.comments[comment_id] = comment;
    post.comments_count = Object.values(this.data.comments).filter(c => c.post_id === postId).length;
    this.save();
    return comment;
  }

  public deleteComment(commentId: string, userId: string): boolean {
    const comment = this.data.comments[commentId];
    if (!comment) throw new Error('Comment not found');
    if (comment.user_id !== userId) throw new Error('Unauthorized: cannot delete someone else comment');

    const postId = comment.post_id;
    delete this.data.comments[commentId];

    if (this.data.posts[postId]) {
      this.data.posts[postId].comments_count = Object.values(this.data.comments).filter(
        c => c.post_id === postId
      ).length;
    }

    this.save();
    return true;
  }

  // --- Analytics Dashboard Engine ---
  public getAnalytics(userId: string): DashboardAnalytics {
    const userSkills = this.getSkillsByUser(userId);
    const sessions = this.getPracticeSessionsByUser(userId);
    const goals = this.getGoalsByUser(userId);
    const streak = this.calculateStreak(userId);

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

    // Weekly practice (last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weeklyMins = sessions
      .filter(s => new Date(s.practiced_at) >= sevenDaysAgo)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const weeklyHours = Math.round((weeklyMins / 60) * 10) / 10;

    // Monthly practice (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyMins = sessions
      .filter(s => new Date(s.practiced_at) >= thirtyDaysAgo)
      .reduce((sum, s) => sum + s.duration_minutes, 0);
    const monthlyHours = Math.round((monthlyMins / 60) * 10) / 10;

    // Practice hours by skill
    const skillMinutesMap: Record<string, { name: string; mins: number }> = {};
    userSkills.forEach(sk => {
      skillMinutesMap[sk.skill_id] = { name: sk.skill_name, mins: 0 };
    });

    sessions.forEach(s => {
      if (!skillMinutesMap[s.skill_id]) {
        skillMinutesMap[s.skill_id] = { name: s.skill_name || 'Other', mins: 0 };
      }
      skillMinutesMap[s.skill_id].mins += s.duration_minutes;
    });

    let mostPracticedSkill = 'None yet';
    let maxSkillMins = -1;

    const practiceHoursBySkill = Object.values(skillMinutesMap).map(item => {
      if (item.mins > maxSkillMins && item.mins > 0) {
        maxSkillMins = item.mins;
        mostPracticedSkill = item.name;
      }
      return {
        skill_name: item.name,
        hours: Math.round((item.mins / 60) * 10) / 10
      };
    });

    // Weekly Trend (Past 7 calendar days breakdown)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyTrend: { day: string; date: string; minutes: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = days[d.getDay()];

      const dayMins = sessions
        .filter(s => s.practiced_at.split('T')[0] === dateStr)
        .reduce((sum, s) => sum + s.duration_minutes, 0);

      weeklyTrend.push({
        day: dayName,
        date: dateStr,
        minutes: dayMins
      });
    }

    // Monthly progress (last 4 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyProgress: { month: string; hours: number }[] = [];

    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      const mStr = `${monthNames[mIdx]} ${yr}`;

      const minsInMonth = sessions
        .filter(s => {
          const sd = new Date(s.practiced_at);
          return sd.getMonth() === mIdx && sd.getFullYear() === yr;
        })
        .reduce((sum, s) => sum + s.duration_minutes, 0);

      monthlyProgress.push({
        month: mStr,
        hours: Math.round((minsInMonth / 60) * 10) / 10
      });
    }

    // Skill distribution by category
    const categoryCount: Record<string, number> = {};
    userSkills.forEach(s => {
      categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
    });

    const skillDistribution = Object.entries(categoryCount).map(([category, count]) => ({
      category,
      count
    }));

    // Goals & Milestones
    const goalsCompleted = goals.filter(g => g.status === 'COMPLETED').length;
    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS').length;

    let milestonesAchieved = 0;
    goals.forEach(g => {
      (g.milestones || []).forEach(m => {
        if (m.achieved) milestonesAchieved++;
      });
    });

    // Posts & Social engagement
    const userPosts = Object.values(this.data.posts).filter(p => p.user_id === userId);
    const numberOfPosts = userPosts.length;
    let likesReceived = 0;
    let commentsReceived = 0;

    userPosts.forEach(p => {
      const pLikes = this.data.likes[p.post_id] || {};
      likesReceived += Object.keys(pLikes).length;
      commentsReceived += p.comments_count || 0;
    });

    // Badges calculation
    const badges: Badge[] = INITIAL_BADGES.map(b => {
      let unlocked = false;
      let unlocked_at: string | undefined = undefined;

      if (b.id === 'first_practice' && sessions.length >= 1) {
        unlocked = true;
        unlocked_at = sessions[sessions.length - 1].created_at;
      } else if (b.id === 'streak_7' && (streak.currentStreak >= 7 || streak.longestStreak >= 7)) {
        unlocked = true;
        unlocked_at = new Date().toISOString();
      } else if (b.id === 'hours_10' && totalMinutes >= 600) {
        unlocked = true;
      } else if (b.id === 'hours_25' && totalMinutes >= 1500) {
        unlocked = true;
      } else if (b.id === 'hours_50' && totalMinutes >= 3000) {
        unlocked = true;
      } else if (b.id === 'goal_completed' && goalsCompleted >= 1) {
        unlocked = true;
      }

      return {
        ...b,
        unlocked,
        unlocked_at
      };
    });

    return {
      totalPracticeHours: totalHours,
      totalPracticeMinutes: totalMinutes,
      weeklyPracticeHours: weeklyHours,
      monthlyPracticeHours: monthlyHours,
      mostPracticedSkill,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      goalsCompleted,
      activeGoals,
      milestonesAchieved,
      numberOfPosts,
      likesReceived,
      commentsReceived,
      practiceHoursBySkill,
      weeklyTrend,
      monthlyProgress,
      skillDistribution,
      unlockedBadges: badges
    };
  }
}

export const cloudDb = new CloudDatabase();
