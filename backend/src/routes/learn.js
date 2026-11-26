import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { awardXpAndCoins, evaluateBadges, logActivity } from '../services/progressionService.js';

const router = Router();

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [{ data: lessons, error }, { data: progress }] = await Promise.all([
      supabaseAdmin.from('lessons').select('*').order('id', { ascending: true }),
      supabaseAdmin.from('user_lesson_progress').select('*').eq('user_id', req.user.id),
    ]);

    if (error) throw error;

    const completedMap = new Map((progress || []).map((p) => [p.lesson_id, p]));
    const formatted = (lessons || []).map((lesson) => ({
      ...lesson,
      completed: completedMap.has(lesson.id),
      completedAt: completedMap.get(lesson.id)?.completed_at || null,
    }));

    const completedCount = formatted.filter((l) => l.completed).length;

    res.json({
      lessons: formatted,
      completedCount,
      totalCount: formatted.length,
    });
  })
);

router.post(
  '/:id/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const lessonId = Number(req.params.id);
    if (!Number.isInteger(lessonId)) {
      throw new AppError('Invalid lesson ID.', 400);
    }

    const { data: lesson, error: lessonErr } = await supabaseAdmin
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single();

    if (lessonErr || !lesson) {
      throw new AppError('Lesson not found.', 404);
    }

    const { data: existing } = await supabaseAdmin
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('lesson_id', lessonId)
      .maybeSingle();

    if (existing) {
      return res.json({
        alreadyCompleted: true,
        awardedXp: 0,
        lessonId,
        profile: req.profile,
      });
    }

    await supabaseAdmin.from('user_lesson_progress').insert({
      user_id: req.user.id,
      lesson_id: lessonId,
      xp_claimed: lesson.xp_reward,
    });

    const rewardResult = await awardXpAndCoins(req.user.id, lesson.xp_reward, 5);
    await logActivity(
      req.user.id,
      'lesson',
      `Completed Lesson: ${lesson.title}`,
      lesson.category_label,
      rewardResult.awardedXp,
      5
    );
    const unlockedBadges = await evaluateBadges(req.user.id);

    res.json({
      alreadyCompleted: false,
      awardedXp: rewardResult.awardedXp,
      awardedCoins: 5,
      lessonId,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

export default router;
