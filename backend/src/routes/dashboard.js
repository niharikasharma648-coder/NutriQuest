import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { getTodayISO, getUserLeagueRank } from '../services/progressionService.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const today = getTodayISO();

    const [
      { data: plateQuest },
      { data: stageProgress },
      { data: tips },
      { data: chapters },
      leagueRank,
    ] = await Promise.all([
      supabaseAdmin
        .from('user_daily_quests')
        .select('*, daily_quest_templates!inner(*)')
        .eq('user_id', userId)
        .eq('quest_date', today)
        .eq('daily_quest_templates.quest_type', 'plate')
        .maybeSingle(),
      supabaseAdmin
        .from('user_stage_progress')
        .select('*, quest_stages(*)')
        .eq('user_id', userId),
      supabaseAdmin.from('nutrition_tips').select('*').order('id'),
      supabaseAdmin.from('quest_chapters').select('*').order('chapter_number'),
      getUserLeagueRank(req.profile.total_xp),
    ]);

    const sortedStages = (stageProgress || []).sort(
      (a, b) => (a.quest_stages?.order_index || 0) - (b.quest_stages?.order_index || 0)
    );

    const dayIndex = new Date().getDate() % Math.max(1, (tips || []).length);
    const tipOfTheDay = tips && tips.length > 0 ? tips[dayIndex] : null;

    const now = new Date();
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const msLeft = Math.max(0, endOfDay - now);

    res.json({
      profile: {
        ...req.profile,
        league_rank: leagueRank,
      },
      dailyChallenge: plateQuest
        ? {
            id: plateQuest.id,
            title: plateQuest.daily_quest_templates.title,
            xpReward: plateQuest.daily_quest_templates.xp_reward,
            groupsAdded: plateQuest.metadata?.groups || [],
            isCompleted: plateQuest.is_completed,
            msUntilReset: msLeft,
          }
        : null,
      activeChapter: (chapters || []).find((c) => c.chapter_number === 2) || chapters?.[0] || null,
      stages: sortedStages.map((s) => ({
        id: s.id,
        stageId: s.stage_id,
        stageCode: s.quest_stages?.stage_code,
        title: s.quest_stages?.title,
        subtitle: s.quest_stages?.subtitle,
        icon: s.quest_stages?.icon,
        xpReward: s.quest_stages?.xp_reward,
        status: s.status,
      })),
      tipOfTheDay,
    });
  })
);

export default router;
