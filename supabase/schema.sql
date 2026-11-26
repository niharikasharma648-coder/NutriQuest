-- NutriQuest Production PostgreSQL Schema for Supabase
-- Includes tables, primary keys, foreign keys, indexes, RLS policies, triggers, and Storage buckets.

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES (1:1 with Supabase auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text DEFAULT '/assets/default-avatar.png',
  bio text NOT NULL DEFAULT 'Building healthy habits one plate at a time 🥗',
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1),
  current_xp integer NOT NULL DEFAULT 0 CHECK (current_xp >= 0),
  total_xp integer NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  xp_to_next_level integer NOT NULL DEFAULT 200 CHECK (xp_to_next_level > 0),
  rank_title text NOT NULL DEFAULT 'Quest Novice',
  streak_days integer NOT NULL DEFAULT 1 CHECK (streak_days >= 0),
  longest_streak integer NOT NULL DEFAULT 1 CHECK (longest_streak >= 0),
  last_active_date date DEFAULT CURRENT_DATE,
  hearts integer NOT NULL DEFAULT 5 CHECK (hearts >= 0 AND hearts <= 5),
  arcade_coins integer NOT NULL DEFAULT 100 CHECK (arcade_coins >= 0),
  games_won integer NOT NULL DEFAULT 0 CHECK (games_won >= 0),
  quests_completed_count integer NOT NULL DEFAULT 0 CHECK (quests_completed_count >= 0),
  quizzes_completed_count integer NOT NULL DEFAULT 0 CHECK (quizzes_completed_count >= 0),
  quiz_correct_answers integer NOT NULL DEFAULT 0 CHECK (quiz_correct_answers >= 0),
  quiz_total_answers integer NOT NULL DEFAULT 0 CHECK (quiz_total_answers >= 0),
  notifications_enabled boolean NOT NULL DEFAULT true,
  reminder_time text NOT NULL DEFAULT '12:00',
  dietary_preference text NOT NULL DEFAULT 'Balanced',
  double_xp_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON public.profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- ============================================================================
-- 2. QUEST CHAPTERS & STAGES (Quest Map Progression)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quest_chapters (
  id serial PRIMARY KEY,
  chapter_number integer UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.quest_stages (
  id serial PRIMARY KEY,
  chapter_id integer NOT NULL REFERENCES public.quest_chapters(id) ON DELETE CASCADE,
  stage_code text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  icon text NOT NULL DEFAULT 'fitness_center',
  xp_reward integer NOT NULL DEFAULT 50,
  order_index integer NOT NULL,
  UNIQUE(chapter_id, stage_code)
);

CREATE INDEX IF NOT EXISTS idx_quest_stages_chapter ON public.quest_stages(chapter_id, order_index);

CREATE TABLE IF NOT EXISTS public.user_stage_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stage_id integer NOT NULL REFERENCES public.quest_stages(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('locked', 'active', 'completed')),
  completed_at timestamptz,
  UNIQUE(user_id, stage_id)
);

CREATE INDEX IF NOT EXISTS idx_user_stage_progress_user ON public.user_stage_progress(user_id);

-- ============================================================================
-- 3. DAILY QUESTS & PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.daily_quest_templates (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  xp_reward integer NOT NULL CHECK (xp_reward > 0),
  target_count integer NOT NULL DEFAULT 1 CHECK (target_count > 0),
  quest_type text NOT NULL CHECK (quest_type IN ('plate', 'water', 'fruit', 'grain', 'rainbow')),
  icon text NOT NULL,
  badge_hint text
);

CREATE TABLE IF NOT EXISTS public.user_daily_quests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id integer NOT NULL REFERENCES public.daily_quest_templates(id) ON DELETE CASCADE,
  quest_date date NOT NULL DEFAULT CURRENT_DATE,
  progress_count integer NOT NULL DEFAULT 0 CHECK (progress_count >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_completed boolean NOT NULL DEFAULT false,
  xp_claimed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  UNIQUE(user_id, template_id, quest_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_quests_lookup ON public.user_daily_quests(user_id, quest_date);

CREATE TABLE IF NOT EXISTS public.daily_chest_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claim_date date NOT NULL DEFAULT CURRENT_DATE,
  chest_type text NOT NULL CHECK (chest_type IN ('daily_quest_bonus', 'mystery_chest')),
  xp_awarded integer NOT NULL DEFAULT 100,
  coins_awarded integer NOT NULL DEFAULT 50,
  reward_label text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, claim_date, chest_type)
);

CREATE INDEX IF NOT EXISTS idx_daily_chest_claims_user ON public.daily_chest_claims(user_id, claim_date);

-- ============================================================================
-- 4. FOOD LOGS (Meals & Photo Uploads via Supabase Storage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  meal_name text NOT NULL,
  food_groups text[] NOT NULL DEFAULT '{}',
  calories integer CHECK (calories IS NULL OR calories >= 0),
  notes text,
  image_url text,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON public.food_logs(user_id, logged_date DESC);

-- ============================================================================
-- 5. PANTRY FOODS & SAVED PLATES (Build Your Plate Mini-Game)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pantry_foods (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  emoji text NOT NULL,
  category text NOT NULL CHECK (category IN ('veggie', 'grain', 'protein', 'dairy')),
  tag text NOT NULL,
  calories integer NOT NULL CHECK (calories >= 0),
  is_starter boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.saved_plates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_name text NOT NULL,
  items jsonb NOT NULL,
  veg_pct integer NOT NULL CHECK (veg_pct >= 0 AND veg_pct <= 100),
  grain_pct integer NOT NULL CHECK (grain_pct >= 0 AND grain_pct <= 100),
  protein_pct integer NOT NULL CHECK (protein_pct >= 0 AND protein_pct <= 100),
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_plates_user ON public.saved_plates(user_id, created_at DESC);

-- ============================================================================
-- 6. FOOD ACADEMY LESSONS & PROGRESS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lessons (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL CHECK (category IN ('macro', 'micro', 'habits')),
  category_label text NOT NULL,
  icon text NOT NULL,
  xp_reward integer NOT NULL CHECK (xp_reward > 0),
  read_minutes integer NOT NULL CHECK (read_minutes > 0),
  summary text NOT NULL,
  highlight text NOT NULL,
  body_paragraphs text[] NOT NULL,
  food_choices text[] NOT NULL,
  search_keywords text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id integer NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  xp_claimed integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user ON public.user_lesson_progress(user_id);

-- ============================================================================
-- 7. NUTRITION QUIZ QUESTIONS & ATTEMPTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id serial PRIMARY KEY,
  topic text NOT NULL,
  question_text text NOT NULL,
  hint text NOT NULL,
  options jsonb NOT NULL,
  correct_choice text NOT NULL CHECK (correct_choice IN ('A', 'B', 'C', 'D')),
  explanation text NOT NULL,
  food_tags text[] NOT NULL DEFAULT '{}',
  xp_value integer NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'standard' CHECK (mode IN ('standard', 'quick')),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  correct_count integer NOT NULL CHECK (correct_count >= 0),
  xp_earned integer NOT NULL DEFAULT 0,
  max_streak integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id, completed_at DESC);

-- ============================================================================
-- 8. MINI-GAME CHALLENGES & GAME SESSIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mini_game_challenges (
  id serial PRIMARY KEY,
  game_slug text NOT NULL CHECK (game_slug IN ('food-detective', 'sugar-detective')),
  prompt text NOT NULL,
  payload jsonb NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  xp_value integer NOT NULL DEFAULT 20
);

CREATE INDEX IF NOT EXISTS idx_mini_game_challenges_slug ON public.mini_game_challenges(game_slug);

CREATE TABLE IF NOT EXISTS public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_slug text NOT NULL CHECK (game_slug IN ('build-your-plate', 'food-detective', 'sugar-detective')),
  score integer NOT NULL DEFAULT 0,
  won boolean NOT NULL DEFAULT false,
  xp_earned integer NOT NULL DEFAULT 0,
  coins_earned integer NOT NULL DEFAULT 0,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON public.game_sessions(user_id, played_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_slug ON public.game_sessions(game_slug, played_at DESC);

-- ============================================================================
-- 9. BADGES & USER BADGES
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.badges (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL CHECK (category IN ('milestones', 'habits', 'gamemasters')),
  tier text NOT NULL,
  rarity text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 50,
  target_value integer NOT NULL DEFAULT 1,
  requirement_type text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id integer NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  progress_value integer NOT NULL DEFAULT 0,
  unlocked boolean NOT NULL DEFAULT false,
  equipped boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  UNIQUE(user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON public.user_badges(user_id);

-- ============================================================================
-- 10. WEEKLY NUTRITION METRICS, ACTIVITY LOGS, TIPS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.weekly_nutrition_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  veggies_pct integer NOT NULL DEFAULT 25 CHECK (veggies_pct >= 0 AND veggies_pct <= 100),
  water_pct integer NOT NULL DEFAULT 25 CHECK (water_pct >= 0 AND water_pct <= 100),
  protein_pct integer NOT NULL DEFAULT 25 CHECK (protein_pct >= 0 AND protein_pct <= 100),
  mindful_sugar_pct integer NOT NULL DEFAULT 25 CHECK (mindful_sugar_pct >= 0 AND mindful_sugar_pct <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  subtitle text,
  xp_delta integer NOT NULL DEFAULT 0,
  coins_delta integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.nutrition_tips (
  id serial PRIMARY KEY,
  icon text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  highlight_text text
);

-- ============================================================================
-- 11. TRIGGERS: AUTO-UPDATED_AT & AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_username text;
  display_val text;
BEGIN
  base_username := COALESCE(
    NULLIF(regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))), '[^a-z0-9_]', '', 'g'), ''),
    'explorer'
  ) || '_' || substr(replace(NEW.id::text, '-', ''), 1, 4);

  display_val := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
    initcap(split_part(NEW.email, '@', 1))
  );

  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, base_username, display_val)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stage_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_chest_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_plates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mini_game_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_nutrition_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_tips ENABLE ROW LEVEL SECURITY;

-- Public / authenticated read policies for static curriculum & catalog tables
CREATE POLICY "Public read quest_chapters" ON public.quest_chapters FOR SELECT USING (true);
CREATE POLICY "Public read quest_stages" ON public.quest_stages FOR SELECT USING (true);
CREATE POLICY "Public read daily_quest_templates" ON public.daily_quest_templates FOR SELECT USING (true);
CREATE POLICY "Public read pantry_foods" ON public.pantry_foods FOR SELECT USING (true);
CREATE POLICY "Public read lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Public read quiz_questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Public read mini_game_challenges" ON public.mini_game_challenges FOR SELECT USING (true);
CREATE POLICY "Public read badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Public read nutrition_tips" ON public.nutrition_tips FOR SELECT USING (true);

-- Profiles: users can view leaderboard fields or own profile, and update own profile
CREATE POLICY "Profiles readable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User-owned tables: strict auth.uid() = user_id isolation
CREATE POLICY "Own stage progress" ON public.user_stage_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own daily quests" ON public.user_daily_quests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own chest claims" ON public.daily_chest_claims FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own food logs" ON public.food_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own saved plates" ON public.saved_plates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own lesson progress" ON public.user_lesson_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own quiz attempts" ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own game sessions" ON public.game_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own user badges" ON public.user_badges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own weekly nutrition metrics" ON public.weekly_nutrition_metrics FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own activity logs" ON public.activity_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 13. SUPABASE STORAGE BUCKETS & POLICIES (avatars, meal-photos)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('avatars', 'avatars', true),
  ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated delete own avatar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public read meal-photos" ON storage.objects FOR SELECT USING (bucket_id = 'meal-photos');
CREATE POLICY "Authenticated upload own meal-photo" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Authenticated delete own meal-photo" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
