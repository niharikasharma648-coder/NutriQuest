import { Router } from 'express';
import multer from 'multer';
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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed for meal photos.', 400));
    }
    cb(null, true);
  },
});

const foodLogSchema = z.object({
  meal_name: z.string().trim().min(2, 'Meal name must be at least 2 characters').max(80),
  food_groups: z.array(z.enum(['Greens', 'Protein', 'Whole Grain'])).min(1, 'Pick at least one food group'),
  calories: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  notes: z.string().trim().max(240).optional().nullable(),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('food_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ foodLogs: data || [] });
  })
);

router.post(
  '/',
  requireAuth,
  upload.single('photo'),
  asyncHandler(async (req, res) => {
    let rawGroups = req.body.food_groups;
    if (typeof rawGroups === 'string') {
      try {
        rawGroups = JSON.parse(rawGroups);
      } catch {
        rawGroups = rawGroups.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    const parsed = foodLogSchema.parse({
      meal_name: req.body.meal_name,
      food_groups: rawGroups,
      calories: req.body.calories ? Number(req.body.calories) : null,
      notes: req.body.notes || null,
    });

    let imageUrl = null;
    if (req.file) {
      const ext = req.file.mimetype.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'jpg';
      const filePath = `${req.user.id}/meal-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('meal-photos')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });
      if (uploadErr) {
        throw new AppError(`Meal photo upload failed: ${uploadErr.message}`, 500);
      }
      const { data: urlData } = supabaseAdmin.storage.from('meal-photos').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;
    }

    const today = getTodayISO();
    const { data: logRow, error: insertErr } = await supabaseAdmin
      .from('food_logs')
      .insert({
        user_id: req.user.id,
        meal_name: parsed.meal_name,
        food_groups: parsed.food_groups,
        calories: parsed.calories ?? null,
        notes: parsed.notes ?? null,
        image_url: imageUrl,
        logged_date: today,
      })
      .select('*')
      .single();

    if (insertErr) throw insertErr;

    // Update weekly nutrition metrics
    await bumpWeeklyMetric(req.user.id, {
      veggies: parsed.food_groups.includes('Greens') ? 10 : 0,
      protein: parsed.food_groups.includes('Protein') ? 10 : 0,
    });

    // Advance today's Balanced Plate daily challenge
    const { data: plateQuest } = await supabaseAdmin
      .from('user_daily_quests')
      .select('*, daily_quest_templates!inner(*)')
      .eq('user_id', req.user.id)
      .eq('quest_date', today)
      .eq('daily_quest_templates.quest_type', 'plate')
      .maybeSingle();

    let questCompletedNow = false;
    let awardedXp = 15; // base meal log XP

    if (plateQuest) {
      const existingGroups = Array.isArray(plateQuest.metadata?.groups) ? plateQuest.metadata.groups : [];
      const mergedGroups = Array.from(new Set([...existingGroups, ...parsed.food_groups]));
      const nowComplete = mergedGroups.length >= 3;
      questCompletedNow = nowComplete && !plateQuest.xp_claimed;

      if (questCompletedNow) {
        awardedXp += plateQuest.daily_quest_templates.xp_reward;
      }

      await supabaseAdmin
        .from('user_daily_quests')
        .update({
          progress_count: mergedGroups.length,
          metadata: { ...(plateQuest.metadata || {}), groups: mergedGroups },
          is_completed: nowComplete,
          xp_claimed: plateQuest.xp_claimed || questCompletedNow,
          completed_at: nowComplete && !plateQuest.completed_at ? new Date().toISOString() : plateQuest.completed_at,
        })
        .eq('id', plateQuest.id);
    }

    const rewardResult = await awardXpAndCoins(
      req.user.id,
      awardedXp,
      questCompletedNow ? 15 : 5,
      questCompletedNow
        ? { quests_completed_count: (req.profile.quests_completed_count || 0) + 1 }
        : {}
    );

    await logActivity(
      req.user.id,
      'food_log',
      questCompletedNow ? `Completed Balanced Plate: ${parsed.meal_name}` : `Logged Meal: ${parsed.meal_name}`,
      parsed.food_groups.join(' • '),
      rewardResult.awardedXp,
      rewardResult.awardedCoins
    );

    const unlockedBadges = await evaluateBadges(req.user.id);

    res.status(201).json({
      foodLog: logRow,
      awardedXp: rewardResult.awardedXp,
      awardedCoins: rewardResult.awardedCoins,
      questCompletedNow,
      profile: rewardResult.profile,
      unlockedBadges,
    });
  })
);

router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { error } = await supabaseAdmin
      .from('food_logs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ deleted: true });
  })
);

export default router;
