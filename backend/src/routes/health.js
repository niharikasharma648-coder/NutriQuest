import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const { error } = await supabaseAdmin.from('nutrition_tips').select('id').limit(1);
    res.json({
      status: 'ok',
      service: 'nutriquest-api',
      database: error ? 'degraded' : 'connected',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;
