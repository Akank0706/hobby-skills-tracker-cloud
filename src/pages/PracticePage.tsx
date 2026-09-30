import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { PracticeSession, Skill } from '../types';
import {
  Timer,
  Calendar,
  Flame,
  Clock,
  Sparkles,
  Award,
  Trash2,
  Plus,
  BookOpen,
  CheckCircle2,
  ChevronDown
} from 'lucide-react';

interface PracticePageProps {
  initialSkillId?: string;
  onPostMilestone?: (milestoneText: string, skillId: string) => void;
}

export const PracticePage: React.FC<PracticePageProps> = ({ initialSkillId, onPostMilestone }) => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState<string>(initialSkillId || 'ALL');

  // Form states
  const [skillId, setSkillId] = useState<string>(initialSkillId || '');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [activity, setActivity] = useState('');
  const [notes, setNotes] = useState('');
  const [practicedDate, setPracticedDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // Success alert / Milestone unlocked banner
  const [latestResult, setLatestResult] = useState<{
    streak: number;
    milestones: string[];
    skillName: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [skillsData, sessionsData] = await Promise.all([
        api.skills.getAll(),
        api.practice.getAll()
      ]);
      setSkills(skillsData);
      setSessions(sessionsData);
      if (!skillId && skillsData.length > 0) {
        setSkillId(initialSkillId || skillsData[0].skill_id);
      }
    } catch (err) {
      console.error('Failed to load practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDuration = (mins: number) => {
    setDurationMinutes(mins);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillId || !activity.trim() || durationMinutes <= 0) return;

    setSubmitting(true);
    setLatestResult(null);

    try {
      const selectedSkill = skills.find(s => s.skill_id === skillId);
      const res = await api.practice.log({
        skill_id: skillId,
        duration_minutes: Number(durationMinutes),
        activity: activity.trim(),
        notes: notes.trim(),
        practiced_at: practicedDate
      });

      // Refresh list
      const updatedSessions = await api.practice.getAll();
      setSessions(updatedSessions);

      // Trigger achievement notification
      setLatestResult({
        streak: res.streak,
        milestones: res.milestonesAchieved,
        skillName: selectedSkill?.skill_name || 'Skill'
      });

      // Clear input fields
      setActivity('');
      setNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to log practice session');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSessions = sessions.filter(
    s => selectedSkillFilter === 'ALL' || s.skill_id === selectedSkillFilter
  );

  const totalMinutes = filteredSessions.reduce((acc, s) => acc + s.duration_minutes, 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Practice Session Tracking
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Log deliberate practice, maintain consecutive daily streaks, and update goal progress in real-time.
        </p>
      </div>

      {/* Milestone / Streak celebratory alert */}
      {latestResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Practice session logged successfully!</span>
          </div>
          <p className="text-xs text-emerald-700">
            Current streak: <strong className="font-semibold">{latestResult.streak} days</strong>.
          </p>
          {latestResult.milestones.length > 0 && (
            <div className="pt-2 border-t border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-emerald-900 font-semibold">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Milestone Achieved: {latestResult.milestones.join(', ')}!</span>
              </div>
              {onPostMilestone && (
                <button
                  onClick={() => onPostMilestone(latestResult.milestones[0], skillId)}
                  className="px-3 py-1 bg-emerald-700 text-white rounded-md text-xs font-semibold hover:bg-emerald-800"
                >
                  Share to Community
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Log Practice Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs sticky top-24">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Timer className="w-4 h-4 text-indigo-600" />
              <span>Log Practice Session</span>
            </h2>

            {skills.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-lg text-slate-500 text-xs">
                Please create a skill first under &quot;My Skills&quot; before logging practice.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Select Skill *
                  </label>
                  <select
                    value={skillId}
                    onChange={e => setSkillId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  >
                    {skills.map(s => (
                      <option key={s.skill_id} value={s.skill_id}>
                        {s.skill_name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date Practiced *
                  </label>
                  <input
                    type="date"
                    required
                    value={practicedDate}
                    onChange={e => setPracticedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Duration (Minutes) *
                    </label>
                    <span className="text-xs font-bold text-indigo-600">{durationMinutes} mins</span>
                  </div>

                  <div className="flex gap-1.5 mb-2">
                    {[15, 30, 45, 60, 90].map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleQuickDuration(mins)}
                        className={`flex-1 py-1 rounded text-xs font-semibold border ${
                          durationMinutes === mins
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    min="1"
                    max="1440"
                    required
                    value={durationMinutes}
                    onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Activity / Exercises Done *
                  </label>
                  <input
                    type="text"
                    required
                    value={activity}
                    onChange={e => setActivity(e.target.value)}
                    placeholder="e.g. Practiced portrait lighting, C & G transitions"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Notes &amp; Reflections
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Key observations, friction points, or progress made..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Recording to Cloud...' : 'Record Practice Session'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Sessions History & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Sessions</span>
              <span className="text-xl font-bold text-slate-900">{filteredSessions.length}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Duration</span>
              <span className="text-xl font-bold text-indigo-600">{totalHours} hrs</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Active Scope</span>
              <span className="text-sm font-bold text-slate-800 truncate block">
                {selectedSkillFilter === 'ALL'
                  ? 'All Skills'
                  : skills.find(s => s.skill_id === selectedSkillFilter)?.skill_name || 'Selected'}
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Practice History Log</h2>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Filter by skill:</span>
              <select
                value={selectedSkillFilter}
                onChange={e => setSelectedSkillFilter(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 font-medium focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="ALL">All Skills</option>
                {skills.map(s => (
                  <option key={s.skill_id} value={s.skill_id}>
                    {s.skill_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* History List */}
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading practice log...</div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No practice sessions found</p>
              <p className="text-xs text-slate-400 mt-1">Use the form to log your first session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSessions.map(session => (
                <div
                  key={session.session_id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{session.skill_name}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-500">{session.practiced_at}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium">{session.activity}</p>
                    {session.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-md">
                        &quot;{session.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-100">
                      {session.duration_minutes} mins
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
