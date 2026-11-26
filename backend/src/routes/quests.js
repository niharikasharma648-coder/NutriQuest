import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  awardXpAndCoins,
  bumpWeeklyMetric,
  evaluateBadges,
  getTodayISO,
  logActivity,
} from '../services/progressionService.js';

const router = Router();

const progressSchema = z.object({
  action: z.enum(['set_water', 'increment_water', 'add_fruit', 'toggle_grain', 'add_rainbow_color', 'complete_plate']),
  value: z.union([z.number(), z.string()]).optional(),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = getTodayISO();

    const [{ data: dailyQuests, error }, { data: bonusClaim }, { data: stages }] = await Promise.all([
      supabaseAdmin
        .from('user_daily_quests')
        .select('*, daily_quest_templates(*)')
        .eq('user_id', userId)
        .eq('quest_date', today)
        .order('template_id', { ascending: true }),
      supabaseAdmin
        .from('daily_chest_claims')
        .select('*')
        .eq('user_id', userId)
        .eq('claim_date', today)
        .eq('chest_type', 'daily_quest_bonus')
        .maybeSingle(),
      supabaseAdmin
        .from('user_stage_progress')
        .select('*, quest_stages(*)')
        .eq('user_id', userId),
    ]);

    if (error) throw error;

    const now = new Date();
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msUntilReset = Math.max(0, endOfDay - now);

    const formatted = (dailyQuests || []).map((q) => ({
      id: q.id,
      templateId: q.template_id,
      slug: q.daily_quest_templates.slug,
      title: q.daily_quest_templates.title,
      description: q.daily_quest_templates.description,
      difficulty: q.daily_quest_templates.difficulty,
      xpReward: q.daily_quest_templates.xp_reward,
      targetCount: q.daily_quest_templates.target_count,
      questType: q.daily_quest_templates.quest_type,
      icon: q.daily_quest_templates.icon,
      badgeHint: q.daily_quest_templates.badge_hint,
      progressCount: q.progress_count,
      metadata: q.metadata || {},
      isCompleted: q.is_completed,
      xpClaimed: q.xp_claimed,
    }));

    const completedCount = formatted.filter((q) => q.isCompleted).length;

    res.json({
      profile: req.profile,
      quests: formatted,
      completedCount,
      totalCount: formatted.length,
      bonusChestClaimed: Boolean(bonusClaim),
      msUntilReset,
      stages: (stages || [])
        .sort((a, b) => (a.quest_stages?.order_index || 0) - (b.quest_stages?.order_index || 0))
        .map((s) => ({
          id: s.id,
          stageCode: s.quest_stages?.stage_code,
          title: s.quest_stages?.title,
          subtitle: s.quest_stages?.subtitle,
          xpReward: s.quest_stages?.xp_reward,
          status: s.status,
        })),
    });
  })
);

router.patch(
  '/:id/progress',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { action, value } = progressSchema.parse(req.body);

    const { data: quest, error } = await supabaseAdmin
      .from('user_daily_quests')
      .select('*, daily_quest_templates(*)')
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .single();

    if (error || !quest) {
      throw new AppError('Daily quest not found.', 404);
    }

    const tpl = quest.daily_quest_templates;
    let progressCount = quest.progress_count;
    let metadata = { ...(quest.metadata || {}) };
    let isCompleted = quest.is_completed;
    let metricDelta = {};

    if (tpl.quest_type === 'water') {
      if (action === 'set_water') {
        const num = Math.min(tpl.target_count, Math.max(0, Number(value || 0)));
        progressCount = num;
      } else if (action === 'increment_water') {
        progressCount = Math.min(tpl.target_count, progressCount + 1);
      }
      isCompleted = progressCount >= tpl.target_count;
      metricDelta = { water: 8 };
    } else if (tpl.quest_type === 'fruit') {
      if (action === 'add_fruit') {
        const fruitList = Array.isArray(metadata.fruits) ? [...metadata.fruits] : [];
        const defaultFruits = ['🍎 Crisp Apple', '🍌 Sweet Banana', '🍓 Fresh Berries'];
        const chosen = typeof value === 'string' && value.trim() ? value.trim() : defaultFruits[fruitList.length % defaultFruits.length];
        if (fruitList.length < tpl.target_count) {
          fruitList.push(chosen);
        }
        metadata.fruits = fruitList;
        progressCount = fruitList.length;
        isCompleted = progressCount >= tpl.target_count;
        metricDelta = { veggies: 8 };
      }
    } else if (tpl.quest_type === 'grain') {
      if (action === 'toggle_grain') {
        progressCount = 1;
        metadata.swapItem = typeof value === 'string' && value.trim() ? value.trim() : 'Quinoa Bowl';
        isCompleted = true;
      }
    } else if (tpl.quest_type === 'rainbow') {
      if (action === 'add_rainbow_color') {
        const allowedColors = ['red', 'green', 'orange', 'purple'];
        const colors = Array.isArray(metadata.colors) ? [...metadata.colors] : [];
        let color = typeof value === 'string' ? value.toLowerCase() : '';
        if (!allowedColors.includes(color)) {
          color = allowedColors.find((c) => !colors.includes(c)) || '';
        }
        if (color && !colors.includes(color)) {
          colors.push(color);
        }
        metadata.colors = colors;
        progressCount = colors.length;
        isCompleted = progressCount >= tpl.target_count;
        metricDelta = { veggies: 6 };
      }
    } else if (tpl.quest_type === 'plate' && action === 'complete_plate') {
      metadata.groups = ['Greens', 'Protein', 'Whole Grain'];
      progressCount = tpl.target_count;
      isCompleted = true;
      metricDelta = { veggies: 8, protein: 8 };
    }

    const newlyCompleted = isCompleted && !quest.xp_claimed;

    const { data: updatedQuest, error: updateErr } = await supabaseAdmin
      .from('user_daily_quests')
      .update({
        progress_count: progressCount,
        metadata,
        is_completed: isCompleted,
        xp_claimed: quest.xp_claimed || newlyCompleted,
        completed_at: isCompleted && !quest.completed_at ? new Date().toISOString() : quest.completed_at,
      })
      .eq('id', quest.id)
      .select('*, daily_quest_templates(*)')
      .single();

    if (updateErr) throw updateErr;

    if (Object.keys(metricDelta).length > 0) {
      await bumpWeeklyMetric(userId, metricDelta);
    }

    let rewardResult = null;
    let unlockedBadges = [];
    if (newlyCompleted) {
      rewardResult = await awardXpAndCoins(userId, tpl.xp_reward, 10, {
        quests_completed_count: (req.profile.quests_completed_count || 0) + 1,
      });
      await logActivity(userId, 'quest', `Daily Challenge: ${tpl.title}`, 'Completed daily quest', rewardResult.awardedXp, 10);
      unlockedBadges = await evaluateBadges(userId);
    }

    res.json({
      quest: {
        id: updatedQuest.id,
        slug: tpl.slug,
        title: tpl.title,
        progressCount: updatedQuest.progress_count,
        targetCount: tpl.target_count,
        metadata: updatedQuest.metadata,
        isCompleted: updatedQuest.is_completed,
        xpClaimed: updatedQuest.xp_claimed,
      },
      newlyCompleted,
      awardedXp: rewardResult?.awardedXp || 0,
      awardedCoins: rewardResult?.awardedCoins || 0,
      leveledUp: rewardResult?.leveledUp || false,
      unlockedBadges,
    });
  })
);

router.post(
  '/bonus-chest',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = getTodayISO();

    const { data: existing } = await supabaseAdmin
      .from('daily_chest_claims')
      .select('*')
      .eq('user_id', userId)
      .eq('claim_date', today)
      .eq('chest_type', 'daily_quest_bonus')
      .maybeSingle();

    if (existing) {
      throw new AppError('Daily Quest Bonus Chest already claimed today!', 409);
    }

    const { data: todayQuests } = await supabaseAdmin
      .from('user_daily_quests')
      .select('is_completed')
      .eq('user_id', userId)
      .eq('quest_date', today);

    const completedCount = (todayQuests || []).filter((q) => q.is_completed).length;
    if (!todayQuests || completedCount < 5) {
      throw new AppError(`Complete all 5 daily quests first (${completedCount}/5 done).`, 400);
    }

    await supabaseAdmin.from('daily_chest_claims').insert({
      user_id: userId,
      claim_date: today,
      chest_type: 'daily_quest_bonus',
      xp_awarded: 100,
      coins_awarded: 50,
      reward_label: 'Daily Quest Grand Chest (+100 XP + 50 Coins)',
    });

    const rewardResult = await awardXpAndCoins(userId, 100, 50);
    await logActivity(userId, 'chest', 'Opened Daily Quest Bonus Chest', 'Completed all 5 daily quests!', rewardResult.awardedXp, 50);
    const unlockedBadges = await evaluateBadges(userId);

    res.json({
      message: 'Bonus Chest opened!',
      awardedXp: rewardResult.awardedXp,
      awardedCoins: 50,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

router.post(
  '/stages/:stageCode/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { stageCode } = req.params;

    const { data: stageList } = await supabaseAdmin
      .from('user_stage_progress')
      .select('*, quest_stages(*)')
      .eq('user_id', userId);

    const sorted = (stageList || []).sort(
      (a, b) => (a.quest_stages?.order_index || 0) - (b.quest_stages?.order_index || 0)
    );

    const targetIdx = sorted.findIndex((s) => s.quest_stages?.stage_code === stageCode);
    if (targetIdx === -1) {
      throw new AppError('Quest stage not found.', 404);
    }

    const target = sorted[targetIdx];
    if (target.status === 'locked') {
      throw new AppError('Complete the previous stage first to unlock this one.', 400);
    }

    const wasAlreadyCompleted = target.status === 'completed';
    if (!wasAlreadyCompleted) {
      await supabaseAdmin
        .from('user_stage_progress')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', target.id);

      const nextStage = sorted[targetIdx + 1];
      if (nextStage && nextStage.status === 'locked') {
        await supabaseAdmin
          .from('user_stage_progress')
          .update({ status: 'active' })
          .eq('id', nextStage.id);
      }

      const xp = target.quest_stages?.xp_reward || 50;
      const rewardResult = await awardXpAndCoins(userId, xp, 15);
      await logActivity(
        userId,
        'stage',
        `Cleared Stage ${stageCode}: ${target.quest_stages?.title}`,
        'Chapter 2 Quest Map',
        rewardResult.awardedXp,
        15
      );
      await evaluateBadges(userId);
      return res.json({
        completed: true,
        awardedXp: rewardResult.awardedXp,
        awardedCoins: 15,
        profile: rewardResult.profile,
      });
    }

    res.json({ completed: true, awardedXp: 0, awardedCoins: 0 });
  })
);

export default router;
