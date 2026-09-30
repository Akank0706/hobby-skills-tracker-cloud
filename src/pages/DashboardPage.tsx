import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardAnalytics, PracticeSession, Skill, Goal } from '../types';
import {
  Flame,
  Award,
  Clock,
  Target,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Heart,
  PlusCircle,
  Timer,
  ChevronRight,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);
  const [activeGoalsList, setActiveGoalsList] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, sessions, goals] = await Promise.all([
        api.analytics.getDashboard(),
        api.practice.getAll(),
        api.goals.getAll()
      ]);
      setAnalytics(analyticsData);
      setRecentSessions(sessions.slice(0, 5));
      setActiveGoalsList(goals);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load cloud analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-medium">Aggregating Cloud Analytics &amp; Metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <p className="font-semibold">Unable to load dashboard analytics</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-3 px-4 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const maxWeeklyMins = Math.max(...analytics.weeklyTrend.map(t => t.minutes), 60);
  const maxSkillHours = Math.max(...analytics.practiceHoursBySkill.map(s => s.hours), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Cloud Computing Dashboard</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Welcome back, {user?.name || 'Learner'}!
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Tracking your deliberate practice sessions, streak consistency, and milestone achievements.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('practice')}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
          >
            <Timer className="w-4 h-4" />
            <span>Log Practice</span>
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className="flex items-center space-x-2 px-3.5 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-sm font-medium rounded-lg transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-slate-500" />
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Practice Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.currentStreak}</span>
            <span className="text-xs text-slate-500">days active</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Longest record: <span className="font-semibold text-slate-700">{analytics.longestStreak} days</span>
          </p>
        </div>

        {/* Total Hours */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Time</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.totalPracticeHours}</span>
            <span className="text-xs text-slate-500">hours logged</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Top skill: <span className="font-semibold text-slate-700">{analytics.mostPracticedSkill}</span>
          </p>
        </div>

        {/* Goals Completed */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Goals &amp; Milestones</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.goalsCompleted}</span>
            <span className="text-xs text-slate-500">completed</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            <span className="font-semibold text-slate-700">{analytics.milestonesAchieved}</span> milestones achieved
          </p>
        </div>

        {/* Community Engagement */}
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Community</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{analytics.numberOfPosts}</span>
            <span className="text-xs text-slate-500">shared posts</span>
          </div>
          <div className="flex items-center space-x-3 text-xs text-slate-500 mt-2">
            <span className="flex items-center space-x-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>{analytics.likesReceived}</span>
            </span>
            <span className="flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>{analytics.commentsReceived}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Section (5 Charts specified in syllabus) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Weekly Practice Trend (7 Days Breakdown) */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Weekly Practice Trend</h2>
              <p className="text-xs text-slate-500">Practice minutes logged over the last 7 calendar days</p>
            </div>
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              {analytics.weeklyPracticeHours} hrs this week
            </span>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6">
            {analytics.weeklyTrend.map((item, idx) => {
              const heightPct = Math.round((item.minutes / maxWeeklyMins) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="text-[11px] font-medium text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.minutes}m
                  </div>
                  <div className="w-full bg-slate-100 rounded-t-sm h-36 flex items-end">
                    <div
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        item.minutes > 0 ? 'bg-indigo-600 group-hover:bg-indigo-700' : 'bg-slate-200'
                      }`}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 mt-2">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Practice Hours by Skill */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Practice Hours by Skill</h2>
              <p className="text-xs text-slate-500">Cumulative time invested in each tracked discipline</p>
            </div>
          </div>

          {analytics.practiceHoursBySkill.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-slate-400">
              No skills practice logged yet
            </div>
          ) : (
            <div className="space-y-3.5 pt-2">
              {analytics.practiceHoursBySkill.map((sk, idx) => {
                const pct = Math.round((sk.hours / maxSkillHours) * 100);
                const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600', 'bg-purple-600', 'bg-rose-600'];
                const barColor = colors[idx % colors.length];

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800">{sk.skill_name}</span>
                      <span className="text-slate-500 font-medium">{sk.hours} hours</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(pct, 5)}%` }}
                        className={`h-full rounded-full ${barColor}`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: Monthly Progress */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Monthly Progress</h2>
              <p className="text-xs text-slate-500">Long-term consistency trend across past months</p>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="space-y-3 pt-2">
            {analytics.monthlyProgress.map((m, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-semibold text-slate-800">{m.month}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">{m.hours}</span>
                  <span className="text-xs text-slate-500">hours</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Skill Distribution by Category */}
        <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Category Distribution</h2>
              <p className="text-xs text-slate-500">Diversity of tracked hobbies and capabilities</p>
            </div>
          </div>

          {analytics.skillDistribution.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No categories configured
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {analytics.skillDistribution.map((item, idx) => {
                const totalSkills = analytics.skillDistribution.reduce((acc, curr) => acc + curr.count, 0);
                const pct = Math.round((item.count / totalSkills) * 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.category}</span>
                      <span className="text-slate-500">
                        {item.count} skills ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${pct}%` }} className="h-full bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Active Goals with Milestones Progress (Chart 5: Goal Completion) */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Measurable Goals &amp; Progress</h2>
            <p className="text-xs text-slate-500">
              Formula: Progress % = (Current Value / Target Value) × 100 (capped at 100%)
            </p>
          </div>
          <button
            onClick={() => setActiveTab('goals')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>Manage Goals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeGoalsList.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg">
            <p className="text-xs text-slate-500">No active goals set yet.</p>
            <button
              onClick={() => setActiveTab('goals')}
              className="mt-2 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Define your first skill goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoalsList.map(goal => {
              const rawPct = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
              const displayPct = Math.min(Math.round(rawPct), 100);
              const isCompleted = goal.status === 'COMPLETED' || displayPct >= 100;

              return (
                <div key={goal.goal_id} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{goal.title}</h3>
                      <p className="text-xs text-slate-500">
                        Target: {goal.target_value} {goal.unit} • Current: {goal.current_value} {goal.unit}
                      </p>
                    </div>
                    {isCompleted ? (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {displayPct}% Done
                      </span>
                    )}
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${displayPct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                      }`}
                    ></div>
                  </div>

                  {/* Milestones list */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-1.5">
                      {goal.milestones.map(m => (
                        <span
                          key={m.milestone_id}
                          className={`inline-flex items-center space-x-1 text-[11px] px-2 py-0.5 rounded-md font-medium ${
                            m.achieved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200/80 text-slate-600'
                          }`}
                        >
                          <span>{m.achieved ? '✓' : '○'}</span>
                          <span>{m.title}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Badges / Achievements Section */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Earned Badges &amp; Milestones</h2>
            <p className="text-xs text-slate-500">System-evaluated cloud accomplishments</p>
          </div>
          <Award className="w-5 h-5 text-amber-500" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {analytics.unlockedBadges.map(badge => (
            <div
              key={badge.id}
              className={`p-3 rounded-lg border text-center transition-all ${
                badge.unlocked
                  ? 'border-amber-200 bg-amber-50/60 shadow-xs'
                  : 'border-slate-200 bg-slate-50/60 opacity-50 grayscale'
              }`}
            >
              <div className="text-2xl mb-1">{badge.icon}</div>
              <p className="text-xs font-bold text-slate-800 leading-tight">{badge.name}</p>
              <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{badge.description}</p>
              <span
                className={`inline-block mt-2 text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                  badge.unlocked ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {badge.unlocked ? 'Unlocked' : 'Locked'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="p-6 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Practice Activity</h2>
            <p className="text-xs text-slate-500">Audit trail of latest recorded sessions</p>
          </div>
          <button
            onClick={() => setActiveTab('practice')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1"
          >
            <span>View All History</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No practice sessions logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentSessions.map(session => (
              <div key={session.session_id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm text-slate-800">{session.skill_name || 'Skill'}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{session.practiced_at}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{session.activity}</p>
                  {session.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">{session.notes}</p>}
                </div>
                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs">
                    {session.duration_minutes} mins
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
