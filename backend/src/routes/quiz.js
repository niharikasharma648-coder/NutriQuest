import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import {
  awardXpAndCoins,
  bumpWeeklyMetric,
  evaluateBadges,
  logActivity,
} from '../services/progressionService.js';

const router = Router();

const checkSchema = z.object({
  questionId: z.number().int().positive(),
  choice: z.enum(['A', 'B', 'C', 'D']),
});

const completeSchema = z.object({
  mode: z.enum(['standard', 'quick']).default('standard'),
  totalQuestions: z.number().int().min(1).max(20),
  correctCount: z.number().int().min(0).max(20),
  maxStreak: z.number().int().min(0).max(20).default(0),
});

router.get(
  '/questions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const mode = req.query.mode === 'quick' ? 'quick' : 'standard';
    const limit = mode === 'quick' ? 3 : 10;

    const { data, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('id, topic, question_text, hint, options, xp_value')
      .order('id', { ascending: true })
      .limit(limit);

    if (error) throw error;
    res.json({ mode, questions: data || [] });
  })
);

router.post(
  '/check',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { questionId, choice } = checkSchema.parse(req.body);

    const { data: q, error } = await supabaseAdmin
      .from('quiz_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error || !q) {
      throw new AppError('Quiz question not found.', 404);
    }

    const isCorrect = q.correct_choice === choice;
    res.json({
      questionId: q.id,
      isCorrect,
      correctChoice: q.correct_choice,
      explanation: q.explanation,
      foodTags: q.food_tags || [],
      xpValue: isCorrect ? q.xp_value : 0,
    });
  })
);

router.post(
  '/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = completeSchema.parse(req.body);
    if (parsed.correctCount > parsed.totalQuestions) {
      throw new AppError('correctCount cannot exceed totalQuestions.', 400);
    }

    const baseXp = parsed.correctCount * 15 + (parsed.correctCount === parsed.totalQuestions ? 25 : 0);
    const coins = parsed.correctCount * 3;

    await supabaseAdmin.from('quiz_attempts').insert({
      user_id: req.user.id,
      mode: parsed.mode,
      total_questions: parsed.totalQuestions,
      correct_count: parsed.correctCount,
      xp_earned: baseXp,
      max_streak: parsed.maxStreak,
    });

    const rewardResult = await awardXpAndCoins(req.user.id, baseXp, coins, {
      quizzes_completed_count: (req.profile.quizzes_completed_count || 0) + 1,
      quiz_correct_answers: (req.profile.quiz_correct_answers || 0) + parsed.correctCount,
      quiz_total_answers: (req.profile.quiz_total_answers || 0) + parsed.totalQuestions,
    });

    const pct = Math.round((parsed.correctCount / parsed.totalQuestions) * 100);
    await bumpWeeklyMetric(req.user.id, { sugar: 6 });
    await logActivity(
      req.user.id,
      'quiz',
      `Passed Quiz: ${parsed.mode === 'quick' ? 'Quick Knowledge Check' : 'Nutrition Arena'}`,
      `${pct}% Score (${parsed.correctCount}/${parsed.totalQuestions})`,
      rewardResult.awardedXp,
      coins
    );
    const unlockedBadges = await evaluateBadges(req.user.id);

    res.json({
      awardedXp: rewardResult.awardedXp,
      awardedCoins: coins,
      accuracy: pct,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

export default router;
