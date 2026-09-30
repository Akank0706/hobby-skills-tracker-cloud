export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SkillStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface UserProfile {
  user_id: string;
  name: string;
  username: string;
  email: string;
  profile_picture?: string;
  bio?: string;
  interests?: string[];
  created_at: string;
}

export interface Skill {
  skill_id: string;
  user_id: string;
  skill_name: string;
  category: string;
  current_level: SkillLevel;
  target_level: SkillLevel;
  start_date: string;
  target_date: string;
  status: SkillStatus;
  description: string;
  created_at: string;
}

export interface Milestone {
  milestone_id: string;
  goal_id: string;
  title: string;
  target_value: number;
  achieved: boolean;
  achieved_at?: string;
}

export interface Goal {
  goal_id: string;
  user_id: string;
  skill_id: string;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  milestones?: Milestone[];
}

export interface PracticeSession {
  session_id: string;
  user_id: string;
  skill_id: string;
  skill_name?: string;
  duration_minutes: number;
  activity: string;
  notes: string;
  practiced_at: string;
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
}

export interface Post {
  post_id: string;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  skill_id?: string;
  skill_name?: string;
  content: string;
  media_url?: string;
  milestone?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
}

export interface Comment {
  comment_id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_username: string;
  author_avatar?: string;
  text: string;
  created_at: string;
}

export interface DashboardAnalytics {
  totalPracticeHours: number;
  totalPracticeMinutes: number;
  weeklyPracticeHours: number;
  monthlyPracticeHours: number;
  mostPracticedSkill: string;
  currentStreak: number;
  longestStreak: number;
  goalsCompleted: number;
  activeGoals: number;
  milestonesAchieved: number;
  numberOfPosts: number;
  likesReceived: number;
  commentsReceived: number;
  practiceHoursBySkill: { skill_name: string; hours: number; color?: string }[];
  weeklyTrend: { day: string; date: string; minutes: number }[];
  monthlyProgress: { month: string; hours: number }[];
  skillDistribution: { category: string; count: number }[];
  unlockedBadges: Badge[];
}
