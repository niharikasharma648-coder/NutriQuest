import { supabaseAdmin } from '../config/supabase.js';
import { AppError, asyncHandler } from './errorHandler.js';
import { ensureProfileBootstrapped } from '../services/progressionService.js';

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    throw new AppError('Authentication required. Missing Bearer token.', 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new AppError('Invalid authorization token.', 401);
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    throw new AppError('Session expired or invalid. Please sign in again.', 401);
  }

  req.user = data.user;
  req.profile = await ensureProfileBootstrapped(data.user);
  next();
});
