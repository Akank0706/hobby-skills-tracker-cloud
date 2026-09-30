import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Goal, Skill, Milestone } from '../types';
import {
  Target,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Trash2,
  Award,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface GoalsPageProps {
  onLogPractice?: () => void;
}

export const GoalsPage: React.FC<GoalsPageProps> = ({ onLogPractice }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [skillId, setSkillId] = useState('');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState<number>(30);
  const [unit, setUnit] = useState('hours');
  const [deadline, setDeadline] = useState('');
  const [milestonesInput, setMilestonesInput] = useState('5, 10, 20, 30');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [goalsData, skillsData] = await Promise.all([
        api.goals.getAll(),
        api.skills.getAll()
      ]);
      setGoals(goalsData);
      setSkills(skillsData);
      if (skillsData.length > 0 && !skillId) {
        setSkillId(skillsData[0].skill_id);
      }
    } catch (err) {
      console.error('Failed to load goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setTitle('');
    setTargetValue(30);
    setUnit('hours');
    setDeadline('');
    setMilestonesInput('5, 10, 20, 30');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId || !title.trim() || targetValue <= 0) return;

    setSubmitting(true);
    try {
      const parsedMilestones = milestonesInput
        .split(',')
        .map(v => Number(v.trim()))
        .filter(v => !isNaN(v) && v > 0);

      await api.goals.create({
        skill_id: skillId,
        title: title.trim(),
        target_value: Number(targetValue),
        unit,
        deadline,
        initial_milestones: parsedMilestones.length > 0 ? parsedMilestones : undefined
      });

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (!window.confirm(`Delete goal "${goalTitle}"?`)) return;
    try {
      await api.goals.delete(goalId);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete goal');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Skill Goals &amp; Milestones
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Quantifiable targets automatically updated from practice session durations.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          disabled={skills.length === 0}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400">Loading goals from cloud database...</div>
      ) : goals.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
          <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No goals created yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Set measurable targets for your skills (e.g. &quot;Practice Guitar 30 hours&quot;) and celebrate intermediate milestones.
          </p>
          {skills.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
            >
              Create First Goal
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const skill = skills.find(s => s.skill_id === goal.skill_id);
            const rawProgress = goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0;
            const progress = Math.min(Math.round(rawProgress), 100);
            const isCompleted = goal.status === 'COMPLETED' || progress >= 100;

            return (
              <div
                key={goal.goal_id}
                className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      {skill && (
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                          {skill.skill_name}
                        </span>
                      )}
                      <h2 className="text-base font-bold text-slate-900 mt-2">{goal.title}</h2>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.goal_id, goal.title)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quantitative progress */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        Progress: <strong className="text-slate-800">{goal.current_value}</strong> / {goal.target_value} {goal.unit}
                      </span>
                      <span className="font-bold text-indigo-600">{progress}%</span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${progress}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Milestones Roadmap */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                        Milestone Checkpoints
                      </span>
                      <div className="space-y-2">
                        {goal.milestones.map(m => (
                          <div
                            key={m.milestone_id}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs ${
                              m.achieved
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 font-medium'
                                : 'bg-slate-50 text-slate-600 border border-slate-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              {m.achieved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>{m.title}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-semibold">
                              {m.target_value} {goal.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {goal.deadline && (
                    <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mt-4">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Target Deadline: {goal.deadline}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                      isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {isCompleted ? 'Goal Completed 🎉' : 'In Progress'}
                  </span>

                  {onLogPractice && !isCompleted && (
                    <button
                      onClick={onLogPractice}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                    >
                      <span>Log practice for this</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Set Measurable Goal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Associated Skill *
                </label>
                <select
                  value={skillId}
                  onChange={e => setSkillId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  {skills.map(s => (
                    <option key={s.skill_id} value={s.skill_id}>
                      {s.skill_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Practice 30 hours, Learn 20 songs"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Target Value *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={targetValue}
                    onChange={e => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    <option value="hours">hours</option>
                    <option value="minutes">minutes</option>
                    <option value="sessions">sessions</option>
                    <option value="items">items</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Milestone Checkpoints (Comma-separated)
                </label>
                <input
                  type="text"
                  value={milestonesInput}
                  onChange={e => setMilestonesInput(e.target.value)}
                  placeholder="5, 10, 20, 30"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Intermediate checkpoints automatically evaluated as you log practice.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={e => setDeadline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating Goal...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
