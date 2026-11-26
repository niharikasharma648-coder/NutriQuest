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

const savePlateSchema = z.object({
  questName: z.string().trim().min(2).max(80),
  items: z.object({
    veggie: z.array(z.object({ name: z.string(), emoji: z.string() })),
    grain: z.array(z.object({ name: z.string(), emoji: z.string() })),
    protein: z.array(z.object({ name: z.string(), emoji: z.string() })),
  }),
  vegPct: z.number().int().min(0).max(100),
  grainPct: z.number().int().min(0).max(100),
  proteinPct: z.number().int().min(0).max(100),
  score: z.number().int().min(0).max(100),
  submitAsWin: z.boolean().optional(),
});

const gameSessionSchema = z.object({
  gameSlug: z.enum(['build-your-plate', 'food-detective', 'sugar-detective']),
  score: z.number().int().min(0).max(10000),
  won: z.boolean(),
  details: z.record(z.any()).optional(),
});

router.get(
  '/overview',
  requireAuth,
  asyncHandler(async (req, res) => {
    const todayStart = `${getTodayISO()}T00:00:00.000Z`;

    const [{ count: dailyTrophies }, { data: leaderboardRows, error: lbErr }] = await Promise.all([
      supabaseAdmin
        .from('game_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', req.user.id)
        .eq('won', true)
        .gte('played_at', todayStart),
      supabaseAdmin
        .from('profiles')
        .select('id, display_name, username, avatar_url, rank_title, total_xp, games_won')
        .order('total_xp', { ascending: false })
        .limit(5),
    ]);

    if (lbErr) throw lbErr;

    res.json({
      stats: {
        arcadeCoins: req.profile.arcade_coins,
        gamesWon: req.profile.games_won,
        dailyTrophies: Math.min(5, dailyTrophies || 0),
      },
      leaderboard: (leaderboardRows || []).map((row, index) => ({
        rank: index + 1,
        id: row.id,
        displayName: row.display_name,
        username: row.username,
        avatarUrl: row.avatar_url || '/assets/default-avatar.png',
        rankTitle: row.rank_title,
        points: row.total_xp,
        wins: row.games_won,
        isCurrentUser: row.id === req.user.id,
      })),
    });
  })
);

router.get(
  '/pantry',
  requireAuth,
  asyncHandler(async (req, res) => {
    const [{ data: foods, error: foodsErr }, { data: savedPlates, error: platesErr }] = await Promise.all([
      supabaseAdmin.from('pantry_foods').select('*').order('id'),
      supabaseAdmin
        .from('saved_plates')
        .select('*')
        .eq('user_id', req.user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    if (foodsErr) throw foodsErr;
    if (platesErr) throw platesErr;

    res.json({
      foods: foods || [],
      savedPlates: savedPlates || [],
    });
  })
);

router.post(
  '/plates',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = savePlateSchema.parse(req.body);
    const totalItems = parsed.items.veggie.length + parsed.items.grain.length + parsed.items.protein.length;
    if (totalItems === 0) {
      throw new AppError('Add at least one food item to your plate before saving!', 400);
    }

    const isGoldenRatio =
      parsed.items.veggie.length >= 2 && parsed.items.grain.length >= 1 && parsed.items.protein.length >= 1;
    const baseXp = parsed.submitAsWin ? (isGoldenRatio ? 150 : 50) : 20; // 2X Boost for Game of the Week!
    const coins = parsed.submitAsWin ? (isGoldenRatio ? 25 : 10) : 5;

    const { data: savedPlate, error: saveErr } = await supabaseAdmin
      .from('saved_plates')
      .insert({
        user_id: req.user.id,
        quest_name: parsed.questName,
        items: parsed.items,
        veg_pct: parsed.vegPct,
        grain_pct: parsed.grainPct,
        protein_pct: parsed.proteinPct,
        score: parsed.score,
        xp_earned: baseXp,
      })
      .select('*')
      .single();

    if (saveErr) throw saveErr;

    if (parsed.submitAsWin) {
      await supabaseAdmin.from('game_sessions').insert({
        user_id: req.user.id,
        game_slug: 'build-your-plate',
        score: parsed.score,
        won: isGoldenRatio,
        xp_earned: baseXp,
        coins_earned: coins,
        details: { questName: parsed.questName },
      });
    }

    const rewardResult = await awardXpAndCoins(
      req.user.id,
      baseXp,
      coins,
      parsed.submitAsWin && isGoldenRatio
        ? { games_won: (req.profile.games_won || 0) + 1 }
        : {}
    );

    await bumpWeeklyMetric(req.user.id, { veggies: 8, protein: 6 });
    await logActivity(
      req.user.id,
      'game',
      parsed.submitAsWin ? `Build Your Plate: ${parsed.questName}` : `Saved Plate: ${parsed.questName}`,
      `Score ${parsed.score}/100 • ${parsed.vegPct}/${parsed.grainPct}/${parsed.proteinPct}`,
      rewardResult.awardedXp,
      coins
    );
    const unlockedBadges = await evaluateBadges(req.user.id);

    res.status(201).json({
      savedPlate,
      isGoldenRatio,
      awardedXp: rewardResult.awardedXp,
      awardedCoins: coins,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

router.delete(
  '/plates/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { error } = await supabaseAdmin
      .from('saved_plates')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ deleted: true });
  })
);

router.get(
  '/challenges/:slug',
  requireAuth,
  asyncHandler(async (req, res) => {
    const slug = req.params.slug;
    if (!['food-detective', 'sugar-detective'].includes(slug)) {
      throw new AppError('Invalid mini-game slug.', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('mini_game_challenges')
      .select('*')
      .eq('game_slug', slug)
      .order('id');

    if (error) throw error;
    res.json({ gameSlug: slug, challenges: data || [] });
  })
);

router.post(
  '/sessions',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = gameSessionSchema.parse(req.body);
    const rewardsMap = {
      'build-your-plate': { xp: 75, coins: 25, title: 'Build Your Plate' },
      'food-detective': { xp: 50, coins: 15, title: 'Food Detective' },
      'sugar-detective': { xp: 90, coins: 40, title: 'Sugar Detective' },
    };

    const config = rewardsMap[parsed.gameSlug];
    const baseXp = parsed.won ? config.xp : Math.max(15, Math.round(config.xp * 0.35));
    const coins = parsed.won ? config.coins : 5;

    const { data: session, error } = await supabaseAdmin
      .from('game_sessions')
      .insert({
        user_id: req.user.id,
        game_slug: parsed.gameSlug,
        score: parsed.score,
        won: parsed.won,
        xp_earned: baseXp,
        coins_earned: coins,
        details: parsed.details || {},
      })
      .select('*')
      .single();

    if (error) throw error;

    const rewardResult = await awardXpAndCoins(
      req.user.id,
      baseXp,
      coins,
      parsed.won ? { games_won: (req.profile.games_won || 0) + 1 } : {}
    );

    if (parsed.gameSlug === 'sugar-detective') {
      await bumpWeeklyMetric(req.user.id, { sugar: 10 });
    } else {
      await bumpWeeklyMetric(req.user.id, { veggies: 6 });
    }

    await logActivity(
      req.user.id,
      'game',
      `${parsed.won ? 'Won' : 'Played'} Mini-Game: ${config.title}`,
      `Score: ${parsed.score}%`,
      rewardResult.awardedXp,
      coins
    );
    const unlockedBadges = await evaluateBadges(req.user.id);

    res.status(201).json({
      session,
      awardedXp: rewardResult.awardedXp,
      awardedCoins: coins,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

export default router;
