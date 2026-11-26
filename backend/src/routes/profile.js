import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { getUserLeagueRank, getWeekStartISO, logActivity } from '../services/progressionService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Only image files are allowed for avatars.', 400));
    }
    cb(null, true);
  },
});

const updateProfileSchema = z.object({
  display_name: z.string().trim().min(2).max(40).optional(),
  username: z
    .string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().trim().max(160).optional(),
  notifications_enabled: z.boolean().optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  dietary_preference: z
    .enum(['Balanced', 'Vegetarian', 'Vegan', 'High-Protein', 'Gluten-Free', 'Pescatarian'])
    .optional(),
});

router.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const weekStart = getWeekStartISO();

    const [{ data: badges }, { data: weeklyMetrics }, { data: activities }, leagueRank] =
      await Promise.all([
        supabaseAdmin
          .from('user_badges')
          .select('*, badges(*)')
          .eq('user_id', userId)
          .order('badge_id'),
        supabaseAdmin
          .from('weekly_nutrition_metrics')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', weekStart)
          .maybeSingle(),
        supabaseAdmin
          .from('activity_logs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10),
        getUserLeagueRank(req.profile.total_xp),
      ]);

    const quizAccuracy =
      req.profile.quiz_total_answers > 0
        ? Math.round((req.profile.quiz_correct_answers / req.profile.quiz_total_answers) * 100)
        : 0;

    res.json({
      profile: {
        ...req.profile,
        league_rank: leagueRank,
        quiz_accuracy: quizAccuracy,
      },
      badges: (badges || []).map((ub) => ({
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
      })),
      weeklyMetrics: weeklyMetrics || {
        veggies_pct: 20,
        water_pct: 20,
        protein_pct: 20,
        mindful_sugar_pct: 20,
      },
      recentActivity: activities || [],
    });
  })
);

router.patch(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const parsed = updateProfileSchema.parse(req.body);
    if (Object.keys(parsed).length === 0) {
      throw new AppError('No profile fields provided to update.', 400);
    }

    if (parsed.username) {
      parsed.username = parsed.username.toLowerCase();
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(parsed)
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new AppError('That username is already taken. Try another!', 409);
      }
      throw error;
    }

    await logActivity(req.user.id, 'profile', 'Updated Profile Settings', 'Saved personal preferences', 0, 0);

    res.json({ profile: data });
  })
);

router.post(
  '/avatar',
  requireAuth,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('Please choose an image file to upload.', 400);
    }

    const ext = req.file.mimetype.split('/')[1]?.replace(/[^a-z0-9]/gi, '') || 'png';
    const filePath = `${req.user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('avatars')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new AppError(`Avatar upload failed: ${uploadError.message}`, 500);
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = publicUrlData.publicUrl;

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', req.user.id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    res.json({ avatarUrl, profile: updated });
  })
);

router.get(
  '/activity',
  requireAuth,
  asyncHandler(async (req, res) => {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 25)));
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    res.json({ activities: data || [] });
  })
);

export default router;
