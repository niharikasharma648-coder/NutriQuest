import React, { useState, useEffect, useRef, useCallback } from 'react';
import TabShell from '../components/TabShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';

const STAT_ICONS = {
  xp: '⭐',
  streak: '🔥',
  badges: '🏅',
  lessons: '📚',
  quizzes: '🧠',
  games: '🎮',
};

export default function ProfilePage() {
  const { profile, session, addToast, refreshProfile, supabase } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ username: '', bio: '' });

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/profile');
      setProfileData(data);
      setForm({ username: data.username || '', bio: data.bio || '' });
    } catch (err) {
      addToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async () => {
    if (!form.username.trim()) { addToast('Username cannot be empty', 'error'); return; }
    setSaving(true);
    try {
      await apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: form.username.trim(), bio: form.bio.trim() }),
      });
      addToast('Profile updated! ✅', 'success');
      refreshProfile();
      fetchProfile();
      setEditing(false);
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { addToast('Please select an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { addToast('Image must be under 5MB', 'error'); return; }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await apiRequest('/api/profile/avatar', { method: 'POST', body: formData, isFormData: true });
      addToast('Avatar updated! 🖼️', 'success');
      refreshProfile();
      fetchProfile();
    } catch (err) {
      addToast(err.message || 'Failed to upload avatar', 'error');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      addToast('Sign out failed', 'error');
      setSignOutLoading(false);
    }
  };

  const stats = profileData?.stats || {};
  const weeklyNutrition = profileData?.weeklyNutrition || [];
  const recentActivity = profileData?.recentActivity || [];
  const showcaseBadges = profileData?.showcaseBadges || [];

  return (
    <TabShell activeTab="profile">
      <div className="pb-24 pt-2">
        {/* Header */}
        <div className="px-4 pt-2 pb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">👤 My Profile</h1>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 rounded-xl bg-nq-card border border-nq-border text-sm text-nq-text-muted font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-nq-green border-t-transparent rounded-full animate-spin" />
            <p className="text-nq-text-muted text-sm">Loading profile...</p>
          </div>
        ) : (
          <>
            {/* Avatar + Info Card */}
            <div className="mx-4 mb-4 rounded-2xl bg-nq-card border border-nq-border p-5">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={profileData?.avatarUrl || '/assets/default-avatar.png'}
                    alt="Avatar"
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-nq-green/40"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-nq-green flex items-center justify-center text-black text-sm shadow-lg"
                    title="Change avatar"
                  >
                    {avatarUploading ? '...' : '📷'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {editing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={form.username}
                        onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                        maxLength={30}
                        placeholder="Username"
                        className="w-full bg-nq-bg-dark border border-nq-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-nq-green"
                      />
                      <textarea
                        value={form.bio}
                        onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                        maxLength={120}
                        placeholder="Short bio..."
                        rows={2}
                        className="w-full bg-nq-bg-dark border border-nq-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-nq-green resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(false)}
                          className="flex-1 py-2 rounded-lg border border-nq-border text-nq-text-muted text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="flex-1 py-2 rounded-lg bg-nq-green text-black font-bold text-sm"
                        >
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white font-bold text-lg truncate">{profileData?.username || 'Adventurer'}</p>
                      <p className="text-nq-text-muted text-xs mb-1">{session?.user?.email}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-nq-green/20 text-nq-green px-2 py-0.5 rounded-full text-xs font-bold">
                          Level {profileData?.level ?? 1}
                        </span>
                        <span className="text-nq-text-muted text-xs">{profileData?.title || 'Nutrition Rookie'}</span>
                      </div>
                      {profileData?.bio && (
                        <p className="text-nq-text-muted text-sm mt-1 leading-snug">{profileData.bio}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Bento Grid */}
            <div className="px-4 mb-4">
              <p className="text-white font-bold text-lg mb-3">📊 Game Stats</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'xp', label: 'Total XP' },
                  { key: 'streak', label: 'Day Streak' },
                  { key: 'badges', label: 'Badges' },
                  { key: 'lessons', label: 'Lessons' },
                  { key: 'quizzes', label: 'Quizzes' },
                  { key: 'games', label: 'Games' },
                ].map(({ key, label }) => (
                  <div key={key} className="rounded-xl bg-nq-card border border-nq-border p-3 text-center">
                    <span className="text-2xl">{STAT_ICONS[key]}</span>
                    <p className="text-white font-bold text-base mt-0.5">
                      {typeof stats[key] === 'number' ? stats[key].toLocaleString() : (stats[key] ?? '—')}
                    </p>
                    <p className="text-nq-text-muted text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Showcase Badges */}
            {showcaseBadges.length > 0 && (
              <div className="px-4 mb-4">
                <p className="text-white font-bold text-lg mb-3">🏅 Showcase Badges</p>
                <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {showcaseBadges.map(badge => (
                    <div
                      key={badge.id}
                      className="shrink-0 w-20 rounded-xl bg-nq-card border border-nq-border p-3 text-center"
                    >
                      <div className="text-3xl mb-1">{badge.icon}</div>
                      <p className="text-white text-xs font-semibold leading-tight">{badge.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Nutrition */}
            {weeklyNutrition.length > 0 && (
              <div className="mx-4 mb-4 rounded-2xl bg-nq-card border border-nq-border p-4">
                <p className="text-white font-bold mb-3">🥗 Weekly Nutrition Balance</p>
                <div className="space-y-3">
                  {weeklyNutrition.map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between mb-1">
                        <span className="text-nq-text-muted text-sm">{item.label}</span>
                        <span className="text-white text-sm font-semibold">{item.percent}%</span>
                      </div>
                      <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${item.percent}%`, backgroundColor: item.color || '#00FF94' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="px-4 mb-4">
                <p className="text-white font-bold text-lg mb-3">📋 Recent Activity</p>
                <div className="space-y-2">
                  {recentActivity.map((act, i) => (
                    <div key={i} className="rounded-xl bg-nq-card border border-nq-border px-4 py-3 flex items-center gap-3">
                      <span className="text-xl">{act.icon || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium leading-tight">{act.description}</p>
                        <p className="text-nq-text-muted text-xs mt-0.5">{act.timeAgo}</p>
                      </div>
                      {act.xp > 0 && (
                        <span className="text-nq-green text-xs font-bold">+{act.xp} XP</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Section */}
            <div className="px-4 mb-4">
              <p className="text-white font-bold text-lg mb-3">⚙️ Settings</p>
              <div className="rounded-2xl bg-nq-card border border-nq-border overflow-hidden">
                {[
                  { label: 'Notifications', icon: '🔔', action: null },
                  { label: 'Privacy Settings', icon: '🔒', action: null },
                  { label: 'Help & Support', icon: '❓', action: null },
                ].map((item, i) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-4 text-left hover:bg-white/5 transition-colors ${
                      i > 0 ? 'border-t border-nq-border' : ''
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-white text-sm font-medium flex-1">{item.label}</span>
                    <span className="text-nq-text-muted text-lg">›</span>
                  </button>
                ))}
                <button
                  onClick={handleSignOut}
                  disabled={signOutLoading}
                  className="w-full flex items-center gap-3 px-4 py-4 text-left border-t border-nq-border hover:bg-red-900/20 transition-colors"
                >
                  <span className="text-xl">🚪</span>
                  <span className="text-red-400 text-sm font-bold flex-1">
                    {signOutLoading ? 'Signing out...' : 'Sign Out'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </TabShell>
  );
}
