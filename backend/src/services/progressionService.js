import { supabaseAdmin } from '../config/supabase.js';

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function getWeekStartISO(date = new Date()) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
  d.setUTCDate(diff);
  return d.toISOString().slice(0, 10);
}

export function getXpRequirementForLevel(level) {
  return 200 + (level - 1) * 150;
}

export function getRankTitleForLevel(level) {
  if (level <= 2) return 'Sprout Explorer';
  if (level <= 4) return 'Quest Novice';
  if (level <= 6) return 'Nutrition Adept';
  if (level <= 9) return 'Macro Strategist';
  return 'Master Chef Legend';
}

export async function ensureProfileBootstrapped(authUser) {
  const userId = authUser.id;
  const emailPrefix = (authUser.email || 'explorer').split('@')[0];
  const cleanPrefix = emailPrefix.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'explorer';
  const defaultUsername = `${cleanPrefix}_${userId.replace(/-/g, '').slice(0, 4)}`;
  const displayName =
    authUser.user_metadata?.display_name ||
    emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

  let { data: profile, error: profileErr } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (profileErr) throw profileErr;

  if (!profile) {
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        username: defaultUsername,
        display_name: displayName,
        avatar_url: '/assets/default-avatar.png',
        level: 1,
        current_xp: 0,
        total_xp: 0,
        xp_to_next_level: getXpRequirementForLevel(1),
        rank_title: getRankTitleForLevel(1),
        streak_days: 1,
        longest_streak: 1,
        last_active_date: getTodayISO(),
        hearts: 5,
        arcade_coins: 100,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;
    profile = inserted;
  }

  // Update daily streak if user logged in on a new calendar day
  const today = getTodayISO();
  if (profile.last_active_date !== today) {
    const lastDate = profile.last_active_date ? new Date(`${profile.last_active_date}T00:00:00Z`) : null;
    const todayDate = new Date(`${today}T00:00:00Z`);
    let newStreak = 1;
    if (lastDate) {
      const diffDays = Math.round((todayDate - lastDate) / 86400000);
      if (diffDays === 1) {
        newStreak = profile.streak_days + 1;
      } else if (diffDays === 0) {
        newStreak = profile.streak_days;
      }
    }
    const longestStreak = Math.max(profile.longest_streak || 1, newStreak);
    const { data: updated } = await supabaseAdmin
      .from('profiles')
      .update({
        last_active_date: today,
        streak_days: newStreak,
        longest_streak: longestStreak,
      })
      .eq('id', userId)
      .select('*')
      .single();
    if (updated) profile = updated;
  }

  // Bootstrap Chapter 2 stages if none exist for user
  const { count: stageCount } = await supabaseAdmin
    .from('user_stage_progress')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (!stageCount) {
    const { data: stages } = await supabaseAdmin
      .from('quest_stages')
      .select('id, stage_code')
      .order('order_index', { ascending: true });

    if (stages && stages.length > 0) {
      const rows = stages.map((st, idx) => ({
        user_id: userId,
        stage_id: st.id,
        status: idx === 0 ? 'active' : 'locked',
      }));
      await supabaseAdmin.from('user_stage_progress').upsert(rows, { onConflict: 'user_id,stage_id' });
    }
  }

  // Bootstrap today's 5 daily quests
  const { count: dailyCount } = await supabaseAdmin
    .from('user_daily_quests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('quest_date', today);

  if (!dailyCount) {
    const { data: templates } = await supabaseAdmin
      .from('daily_quest_templates')
      .select('id, quest_type')
      .order('id', { ascending: true });

    if (templates && templates.length > 0) {
      const rows = templates.map((tpl) => ({
        user_id: userId,
        template_id: tpl.id,
        quest_date: today,
        progress_count: 0,
        metadata:
          tpl.quest_type === 'rainbow'
            ? { colors: [] }
            : tpl.quest_type === 'fruit'
              ? { fruits: [] }
              : tpl.quest_type === 'plate'
                ? { groups: [] }
                : {},
        is_completed: false,
        xp_claimed: false,
      }));
      await supabaseAdmin
        .from('user_daily_quests')
        .upsert(rows, { onConflict: 'user_id,template_id,quest_date' });
    }
  }

  // Bootstrap user badges
  const { data: allBadges } = await supabaseAdmin.from('badges').select('*').order('id');
  const { data: existingBadges } = await supabaseAdmin
    .from('user_badges')
    .select('badge_id')
    .eq('user_id', userId);

  if (allBadges && (!existingBadges || existingBadges.length < allBadges.length)) {
    const existingSet = new Set((existingBadges || []).map((b) => b.badge_id));
    const missing = allBadges
      .filter((b) => !existingSet.has(b.id))
      .map((b) => ({
        user_id: userId,
        badge_id: b.id,
        progress_value: 0,
        unlocked: false,
        equipped: false,
      }));
    if (missing.length > 0) {
      await supabaseAdmin.from('user_badges').upsert(missing, { onConflict: 'user_id,badge_id' });
    }
  }

  // Bootstrap current week's nutrition metrics
  const weekStart = getWeekStartISO();
  await supabaseAdmin
    .from('weekly_nutrition_metrics')
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        veggies_pct: 20,
        water_pct: 20,
        protein_pct: 20,
        mindful_sugar_pct: 20,
      },
      { onConflict: 'user_id,week_start', ignoreDuplicates: true }
    );

  return profile;
}

export async function awardXpAndCoins(userId, baseXp, baseCoins = 0, profileUpdates = {}) {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !profile) throw error || new Error('Profile not found');

  const isDoubleXp = profile.double_xp_until && new Date(profile.double_xp_until) > new Date();
  const awardedXp = isDoubleXp ? baseXp * 2 : baseXp;

  let level = profile.level;
  let currentXp = profile.current_xp + awardedXp;
  let totalXp = profile.total_xp + awardedXp;
  let xpToNext = profile.xp_to_next_level || getXpRequirementForLevel(level);
  let leveledUp = false;

  while (currentXp >= xpToNext) {
    currentXp -= xpToNext;
    level += 1;
    xpToNext = getXpRequirementForLevel(level);
    leveledUp = true;
  }

  const nextRank = getRankTitleForLevel(level);
  const updatePayload = {
    level,
    current_xp: currentXp,
    total_xp: totalXp,
    xp_to_next_level: xpToNext,
    rank_title: nextRank,
    arcade_coins: profile.arcade_coins + baseCoins,
    ...profileUpdates,
  };

  // Level 5 milestone unlocks 24h 2x XP potion if newly reached
  if (leveledUp && level >= 5 && profile.level < 5) {
    updatePayload.double_xp_until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  }

  const { data: updatedProfile, error: updateErr } = await supabaseAdmin
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select('*')
    .single();

  if (updateErr) throw updateErr;

  return {
    profile: updatedProfile,
    awardedXp,
    awardedCoins: baseCoins,
    leveledUp,
    doubleXpApplied: Boolean(isDoubleXp),
  };
}

export async function logActivity(userId, activityType, title, subtitle, xpDelta = 0, coinsDelta = 0) {
  await supabaseAdmin.from('activity_logs').insert({
    user_id: userId,
    activity_type: activityType,
    title,
    subtitle,
    xp_delta: xpDelta,
    coins_delta: coinsDelta,
  });
}

export async function bumpWeeklyMetric(userId, deltas = {}) {
  const weekStart = getWeekStartISO();
  const { data: existing } = await supabaseAdmin
    .from('weekly_nutrition_metrics')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .maybeSingle();

  const current = existing || {
    veggies_pct: 20,
    water_pct: 20,
    protein_pct: 20,
    mindful_sugar_pct: 20,
  };

  const next = {
    user_id: userId,
    week_start: weekStart,
    veggies_pct: Math.min(100, (current.veggies_pct || 0) + (deltas.veggies || 0)),
    water_pct: Math.min(100, (current.water_pct || 0) + (deltas.water || 0)),
    protein_pct: Math.min(100, (current.protein_pct || 0) + (deltas.protein || 0)),
    mindful_sugar_pct: Math.min(100, (current.mindful_sugar_pct || 0) + (deltas.sugar || 0)),
    updated_at: new Date().toISOString(),
  };

  await supabaseAdmin
    .from('weekly_nutrition_metrics')
    .upsert(next, { onConflict: 'user_id,week_start' });
}

export async function evaluateBadges(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) return [];

  const [{ count: platesCount }, { count: sugarWins }, { data: userBadges }] = await Promise.all([
    supabaseAdmin.from('saved_plates').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabaseAdmin
      .from('game_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('game_slug', 'sugar-detective')
      .eq('won', true),
    supabaseAdmin
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', userId),
  ]);

  const today = getTodayISO();
  const { data: todayQuests } = await supabaseAdmin
    .from('user_daily_quests')
    .select('*, daily_quest_templates(quest_type)')
    .eq('user_id', userId)
    .eq('quest_date', today);

  const waterDone = (todayQuests || []).some(
    (q) => q.daily_quest_templates?.quest_type === 'water' && q.is_completed
  )
    ? 1
    : 0;
  const fruitCount =
    (todayQuests || []).find((q) => q.daily_quest_templates?.quest_type === 'fruit')?.progress_count || 0;
  const rainbowColors =
    (todayQuests || []).find((q) => q.daily_quest_templates?.quest_type === 'rainbow')?.progress_count || 0;

  const newlyUnlocked = [];

  for (const ub of userBadges || []) {
    const badge = ub.badges;
    if (!badge) continue;

    let progress = ub.progress_value;
    switch (badge.requirement_type) {
      case 'quests_completed':
        progress = Math.max(progress, profile.quests_completed_count);
        break;
      case 'plates_saved':
        progress = Math.max(progress, platesCount || 0);
        break;
      case 'water_quests':
        progress = Math.max(progress, waterDone);
        break;
      case 'fruit_count':
        progress = Math.max(progress, fruitCount);
        break;
      case 'streak_days':
        progress = Math.max(progress, profile.streak_days);
        break;
      case 'sugar_wins':
        progress = Math.max(progress, sugarWins || 0);
        break;
      case 'rainbow_colors':
        progress = Math.max(progress, rainbowColors);
        break;
      case 'quizzes_completed':
        progress = Math.max(progress, profile.quizzes_completed_count);
        break;
      default:
        break;
    }

    const shouldUnlock = !ub.unlocked && progress >= badge.target_value;
    if (progress !== ub.progress_value || shouldUnlock) {
      await supabaseAdmin
        .from('user_badges')
        .update({
          progress_value: Math.min(progress, badge.target_value),
          unlocked: ub.unlocked || shouldUnlock,
          unlocked_at: shouldUnlock ? new Date().toISOString() : ub.unlocked_at,
        })
        .eq('id', ub.id);

      if (shouldUnlock) {
        newlyUnlocked.push(badge);
        await logActivity(
          userId,
          'badge',
          `Unlocked Badge: ${badge.name}`,
          badge.description,
          badge.xp_reward,
          0
        );
        await awardXpAndCoins(userId, badge.xp_reward, 0);
      }
    }
  }

  return newlyUnlocked;
}

export async function getUserLeagueRank(totalXp) {
  const { count } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .gt('total_xp', totalXp);
  return (count || 0) + 1;
}
