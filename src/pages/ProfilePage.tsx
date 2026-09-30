import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { DashboardAnalytics } from '../types';
import {
  User,
  Mail,
  Calendar,
  Camera,
  Award,
  Flame,
  Clock,
  Sparkles,
  Check,
  AlertCircle,
  ShieldCheck,
  Tag
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [interestsInput, setInterestsInput] = useState((user?.interests || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setInterestsInput((user.interests || []).join(', '));
    }
    loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    try {
      const data = await api.analytics.getDashboard();
      setAnalytics(data);
    } catch (e) {
      console.warn('Could not load user analytics for profile:', e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setStatusMessage(null);

    try {
      const interests = interestsInput
        .split(',')
        .map(i => i.trim())
        .filter(i => i.length > 0);

      await updateProfile({
        name: name.trim(),
        bio: bio.trim(),
        interests
      });

      setIsEditing(false);
      setStatusMessage({ type: 'success', text: 'Profile updated in cloud database successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image file size must be less than 5MB.' });
      return;
    }

    setUploadingImage(true);
    setStatusMessage(null);

    try {
      const res = await api.files.uploadImage(file);
      await updateProfile({ profile_picture: res.url });
      setStatusMessage({ type: 'success', text: 'Profile photo uploaded to cloud storage.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Photo upload failed.' });
    } finally {
      setUploadingImage(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          User Profile &amp; Cloud Account
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Identity management, cloud storage credentials, and personal skills portfolio.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with Cloud Upload */}
          <div className="relative group shrink-0">
            <img
              src={user.profile_picture || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
              alt={user.name}
              className="w-28 h-28 rounded-full object-cover border-2 border-slate-200 shadow-xs"
            />
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/webp"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              title="Upload profile picture to Cloud Object Storage"
              className="absolute bottom-1 right-1 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Profile details or edit form */}
          <div className="flex-1 w-full text-center sm:text-left">
            {!isEditing ? (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user.name}</h2>
                    <p className="text-sm text-slate-500 font-mono">@{user.username}</p>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="self-center sm:self-auto px-4 py-1.5 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>

                <p className="text-sm text-slate-700 max-w-xl">
                  {user.bio || 'No bio provided. Click "Edit Profile" to add your personal background.'}
                </p>

                {/* Cloud identity metadata */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Joined {user.created_at}</span>
                  </div>
                  <div className="flex items-center space-x-1 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                    <span>UID: {user.user_id}</span>
                  </div>
                </div>

                {/* Interests Pills */}
                {user.interests && user.interests.length > 0 && (
                  <div className="pt-2 flex flex-wrap justify-center sm:justify-start gap-1.5">
                    {user.interests.map((interest, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        #{interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Bio &amp; Learning Background
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Briefly describe what you're learning..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Interests (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={interestsInput}
                    onChange={e => setInterestsInput(e.target.value)}
                    placeholder="e.g. Photography, Guitar, Coding, Art"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Cloud Summary Metrics & Badges */}
      {analytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Active Streak</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">{analytics.currentStreak} days</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Total Hours</span>
              <span className="text-2xl font-bold text-indigo-600 mt-1 block">{analytics.totalPracticeHours} hrs</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Goals Completed</span>
              <span className="text-2xl font-bold text-emerald-600 mt-1 block">{analytics.goalsCompleted}</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase block">Milestones</span>
              <span className="text-2xl font-bold text-amber-600 mt-1 block">{analytics.milestonesAchieved}</span>
            </div>
          </div>

          {/* Earned Badges Portfolio */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Verified Skill Badges</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {analytics.unlockedBadges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    badge.unlocked
                      ? 'border-amber-200 bg-amber-50/50'
                      : 'border-slate-200 bg-slate-50/50 opacity-40 grayscale'
                  }`}
                >
                  <div className="text-3xl mb-2">{badge.icon}</div>
                  <h4 className="text-sm font-bold text-slate-800">{badge.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                  <span
                    className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      badge.unlocked
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {badge.unlocked ? 'Unlocked & Verified' : 'Locked'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
