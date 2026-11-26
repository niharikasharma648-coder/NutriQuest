import React, { useState, useEffect, useCallback } from 'react';
import TabShell from '../components/TabShell.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../lib/api.js';

const RARITY_STYLES = {
  common: { border: 'border-gray-500', bg: 'bg-gray-800', label: 'Common', labelColor: 'text-gray-400' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-900/40', label: 'Rare', labelColor: 'text-blue-400' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-900/40', label: 'Epic', labelColor: 'text-purple-400' },
  legendary: { border: 'border-yellow-400', bg: 'bg-yellow-900/30', label: 'Legendary', labelColor: 'text-yellow-400' },
};

const FILTERS = ['All', 'Earned', 'Locked', 'Legendary'];

export default function RewardsPage() {
  const { profile, addToast } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [chestLoading, setChestLoading] = useState(false);
  const [equipLoading, setEquipLoading] = useState(null);
  const [selectedBadge, setSelectedBadge] = useState(null);

  const fetchRewards = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/api/rewards');
      setRewards(data);
    } catch (err) {
      addToast('Failed to load rewards', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRewards(); }, [fetchRewards]);

  const handleEquip = async (badgeId) => {
    setEquipLoading(badgeId);
    try {
      await apiRequest(`/api/rewards/badges/${badgeId}/equip`, { method: 'POST' });
      addToast('Badge equipped! 🏅', 'success');
      fetchRewards();
    } catch (err) {
      addToast(err.message || 'Failed to equip badge', 'error');
    } finally {
      setEquipLoading(null);
      setSelectedBadge(null);
    }
  };

  const handleMysteryChest = async () => {
    if (!rewards?.mysteryChest?.available) return;
    setChestLoading(true);
    try {
      const result = await apiRequest('/api/rewards/mystery-chest', { method: 'POST' });
      addToast(`🎁 ${result.reward?.description || 'Reward unlocked!'}`, 'success');
      fetchRewards();
    } catch (err) {
      addToast(err.message || 'Chest not available yet', 'error');
    } finally {
      setChestLoading(false);
    }
  };

  const filteredBadges = () => {
    if (!rewards?.badges) return [];
    switch (filter) {
      case 'Earned': return rewards.badges.filter(b => b.earned);
      case 'Locked': return rewards.badges.filter(b => !b.earned);
      case 'Legendary': return rewards.badges.filter(b => b.rarity === 'legendary');
      default: return rewards.badges;
    }
  };

  const xpToNextLevel = rewards?.xpProgress?.toNextLevel ?? 0;
  const xpCurrent = rewards?.xpProgress?.current ?? 0;
  const xpPercent = xpToNextLevel > 0 ? Math.min(100, Math.round((xpCurrent / xpToNextLevel) * 100)) : 0;

  return (
    <TabShell activeTab="rewards">
      <div className="pb-24 pt-2">
        {/* Header */}
        <div className="px-4 pt-2 pb-4">
          <h1 className="text-2xl font-bold text-white">🏆 Trophy Room</h1>
          <p className="text-nq-text-muted text-sm mt-1">Your achievements & rewards</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-nq-green border-t-transparent rounded-full animate-spin" />
            <p className="text-nq-text-muted text-sm">Loading your rewards...</p>
          </div>
        ) : (
          <>
            {/* XP Progress Card */}
            <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-nq-green/20 to-nq-teal/20 border border-nq-green/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-nq-text-muted text-xs uppercase tracking-wider font-semibold">Level {rewards?.level ?? 1}</p>
                  <p className="text-white font-bold text-lg">{profile?.username || 'Adventurer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-nq-green font-bold text-xl">{(rewards?.totalXp ?? 0).toLocaleString()} XP</p>
                  <p className="text-nq-text-muted text-xs">{xpCurrent} / {xpToNextLevel} to next level</p>
                </div>
              </div>
              <div className="h-3 bg-black/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-nq-green to-nq-teal rounded-full transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-nq-text-muted">Level {rewards?.level ?? 1}</span>
                <span className="text-xs text-nq-green font-semibold">{xpPercent}%</span>
                <span className="text-xs text-nq-text-muted">Level {(rewards?.level ?? 1) + 1}</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mx-4 mb-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Badges', value: rewards?.earnedCount ?? 0, icon: '🏅', color: 'text-yellow-400' },
                { label: 'Streak', value: `${rewards?.streak ?? 0}d`, icon: '🔥', color: 'text-orange-400' },
                { label: 'Rank', value: `#${rewards?.rank ?? '—'}`, icon: '⭐', color: 'text-purple-400' },
              ].map(stat => (
                <div key={stat.label} className="rounded-xl bg-nq-card border border-nq-border p-3 text-center">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                  <p className="text-nq-text-muted text-xs">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Mystery Chest */}
            <div className="mx-4 mb-5">
              <div className={`rounded-2xl border p-4 flex items-center gap-4 ${
                rewards?.mysteryChest?.available
                  ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/40'
                  : 'bg-nq-card border-nq-border opacity-70'
              }`}>
                <div className="text-5xl">🎁</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold">Mystery Chest</p>
                  {rewards?.mysteryChest?.available ? (
                    <p className="text-yellow-400 text-sm font-medium">Ready to open!</p>
                  ) : (
                    <p className="text-nq-text-muted text-sm">
                      Available in {rewards?.mysteryChest?.hoursRemaining ?? '—'}h
                    </p>
                  )}
                </div>
                <button
                  onClick={handleMysteryChest}
                  disabled={!rewards?.mysteryChest?.available || chestLoading}
                  className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    rewards?.mysteryChest?.available && !chestLoading
                      ? 'bg-yellow-400 text-black hover:bg-yellow-300 active:scale-95'
                      : 'bg-nq-border text-nq-text-muted cursor-not-allowed'
                  }`}
                >
                  {chestLoading ? '...' : 'Open'}
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 mb-4">
              <p className="text-white font-bold text-lg mb-3">Your Badges</p>
              <div className="flex gap-2 flex-wrap">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                      filter === f
                        ? 'bg-nq-green text-black border-nq-green'
                        : 'bg-nq-card border-nq-border text-nq-text-muted hover:border-nq-green/50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Badges Grid */}
            <div className="px-4 grid grid-cols-2 gap-3">
              {filteredBadges().length === 0 ? (
                <div className="col-span-2 text-center py-10">
                  <p className="text-4xl mb-2">🔍</p>
                  <p className="text-nq-text-muted text-sm">No badges in this category yet</p>
                </div>
              ) : (
                filteredBadges().map(badge => {
                  const style = RARITY_STYLES[badge.rarity] || RARITY_STYLES.common;
                  return (
                    <button
                      key={badge.id}
                      onClick={() => badge.earned && setSelectedBadge(badge)}
                      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-4 text-left transition-all active:scale-95 ${
                        badge.earned ? 'cursor-pointer hover:opacity-90' : 'opacity-50 cursor-default'
                      } ${badge.isEquipped ? 'ring-2 ring-nq-green ring-offset-2 ring-offset-nq-bg-dark' : ''}`}
                    >
                      <div className="text-4xl mb-2">{badge.earned ? badge.icon : '🔒'}</div>
                      <p className="text-white font-bold text-sm leading-tight">{badge.name}</p>
                      <p className={`text-xs font-semibold mt-1 ${style.labelColor}`}>{style.label}</p>
                      {badge.isEquipped && (
                        <span className="text-xs bg-nq-green/20 text-nq-green px-2 py-0.5 rounded-full mt-1 inline-block">Equipped</span>
                      )}
                      {!badge.earned && badge.requirement && (
                        <p className="text-nq-text-muted text-xs mt-1 leading-tight">{badge.requirement}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Badge Detail Modal */}
        {selectedBadge && (
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
            onClick={() => setSelectedBadge(null)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-nq-card border border-nq-border p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="text-6xl mb-3">{selectedBadge.icon}</div>
              <h3 className="text-white font-bold text-xl mb-1">{selectedBadge.name}</h3>
              <p className={`text-sm font-semibold mb-3 ${RARITY_STYLES[selectedBadge.rarity]?.labelColor || 'text-gray-400'}`}>
                {RARITY_STYLES[selectedBadge.rarity]?.label || 'Common'}
              </p>
              <p className="text-nq-text-muted text-sm mb-5">{selectedBadge.description}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedBadge(null)}
                  className="flex-1 py-3 rounded-xl border border-nq-border text-nq-text-muted font-semibold"
                >
                  Close
                </button>
                {!selectedBadge.isEquipped && (
                  <button
                    onClick={() => handleEquip(selectedBadge.id)}
                    disabled={equipLoading === selectedBadge.id}
                    className="flex-1 py-3 rounded-xl bg-nq-green text-black font-bold"
                  >
                    {equipLoading === selectedBadge.id ? 'Equipping...' : 'Equip Badge'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </TabShell>
  );
}
