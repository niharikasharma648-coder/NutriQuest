import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  awardXpAndCoins,
  evaluateBadges,
  getTodayISO,
  logActivity,
} from '../services/progressionService.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = getTodayISO();

    await evaluateBadges(userId);

    const [{ data: badges, error }, { data: mysteryClaim }, { data: freshProfile }] = await Promise.all([
      supabaseAdmin
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', userId)
        .order('badge_id'),
      supabaseAdmin
        .from('daily_chest_claims')
        .select('*')
        .eq('user_id', userId)
        .eq('claim_date', today)
        .eq('chest_type', 'mystery_chest')
        .maybeSingle(),
      supabaseAdmin.from('profiles').select('*').eq('id', userId).single(),
    ]);

    if (error) throw error;

    const formattedBadges = (badges || []).map((ub) => ({
      id: ub.id,
      badgeId: ub.badge_id,
      slug: ub.badges.slug,
      name: ub.badges.name,
      description: ub.badges.description,
      icon: ub.badges.icon,
      category: ub.badges.category,
      tier: ub.badges.tier,
      rarity: ub.badges.rarity,
      xpReward: ub.badges.xp_reward,
      targetValue: ub.badges.target_value,
      progressValue: ub.progress_value,
      unlocked: ub.unlocked,
      equipped: ub.equipped,
      unlockedAt: ub.unlocked_at,
    }));

    const unlockedCount = formattedBadges.filter((b) => b.unlocked).length;

    res.json({
      profile: freshProfile || req.profile,
      badges: formattedBadges,
      unlockedCount,
      totalBadges: formattedBadges.length,
      mysteryChestClaimed: Boolean(mysteryClaim),
      mysteryClaim,
    });
  })
);

router.post(
  '/badges/:badgeId/equip',
  requireAuth,
  asyncHandler(async (req, res) => {
    const badgeId = Number(req.params.badgeId);
    const { data: userBadge, error } = await supabaseAdmin
      .from('user_badges')
      .select('*, badges(*)')
      .eq('user_id', req.user.id)
      .eq('badge_id', badgeId)
      .single();

    if (error || !userBadge) {
      throw new AppError('Badge not found.', 404);
    }

    if (!userBadge.unlocked) {
      throw new AppError('Unlock this badge before equipping it to your profile!', 400);
    }

    if (!userBadge.equipped) {
      const { count } = await supabaseAdmin
        .from('user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('equipped', true);

      if ((count || 0) >= 4) {
        throw new AppError('You can equip up to 4 Showcase Badges at once. Unequip one first.', 400);
      }
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('user_badges')
      .update({ equipped: !userBadge.equipped })
      .eq('id', userBadge.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;
    res.json({ equipped: updated.equipped, badgeId });
  })
);

router.post(
  '/mystery-chest',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = getTodayISO();

    const { data: existing } = await supabaseAdmin
      .from('daily_chest_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('claim_date', today)
      .eq('chest_type', 'mystery_chest')
      .maybeSingle();

    if (existing) {
      return res.json({
        alreadyClaimed: true,
        claim: existing,
        profile: req.profile,
      });
    }

    const lootPool = [
      { xp: 40, coins: 20, label: 'Emerald Apple Cache (+40 XP & 20 Coins)' },
      { xp: 60, coins: 30, label: 'Golden Grain Stash (+60 XP & 30 Coins)' },
      { xp: 75, coins: 35, label: 'Super-Vitamin Crate (+75 XP & 35 Coins)' },
    ];
    const loot = lootPool[Math.floor(Math.random() * lootPool.length)];

    const { data: claim, error: claimErr } = await supabaseAdmin
      .from('daily_chest_claims')
      .insert({
        user_id: userId,
        claim_date: today,
        chest_type: 'mystery_chest',
        xp_awarded: loot.xp,
        coins_awarded: loot.coins,
        reward_label: loot.label,
      })
      .select('*')
      .single();

    if (claimErr) throw claimErr;

    const rewardResult = await awardXpAndCoins(userId, loot.xp, loot.coins);
    await logActivity(userId, 'chest', 'Claimed Daily Mystery Chest', loot.label, rewardResult.awardedXp, loot.coins);

    res.json({
      alreadyClaimed: false,
      claim,
      awardedXp: rewardResult.awardedXp,
      awardedCoins: loot.coins,
      profile: rewardResult.profile,
    });
  })
);

export default router;
