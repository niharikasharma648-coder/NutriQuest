-- NutriQuest Seed Data for Supabase PostgreSQL
-- Populates curriculum lessons, quiz questions, mini-game challenges, quest chapters/stages,
-- daily quest templates, pantry foods, badges, and daily nutrition tips.

-- ============================================================================
-- 1. QUEST CHAPTERS & STAGES
-- ============================================================================
INSERT INTO public.quest_chapters (chapter_number, title, description) VALUES
(1, 'Chapter 1: Hydration Hollow', 'Master water balance and mindful snacking habits.'),
(2, 'Chapter 2: The Macro Realm', 'Balance carbohydrates, healthy fats, and lean proteins.')
ON CONFLICT (chapter_number) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description;

INSERT INTO public.quest_stages (chapter_id, stage_code, title, subtitle, icon, xp_reward, order_index) VALUES
((SELECT id FROM public.quest_chapters WHERE chapter_number = 2), '2.1', 'Carb Trail', 'Complex vs simple fuel', 'done_all', 40, 1),
((SELECT id FROM public.quest_chapters WHERE chapter_number = 2), '2.2', 'Fats Forest', 'Brain-boosting omegas', 'done_all', 45, 2),
((SELECT id FROM public.quest_chapters WHERE chapter_number = 2), '2.3', 'Protein Powerhouse', 'Muscle & tissue repair', 'fitness_center', 60, 3),
((SELECT id FROM public.quest_chapters WHERE chapter_number = 2), '2.4', 'Boss Feast', 'The Ultimate Balanced Plate', 'emoji_events', 100, 4)
ON CONFLICT (chapter_id, stage_code) DO UPDATE SET title = EXCLUDED.title, subtitle = EXCLUDED.subtitle, icon = EXCLUDED.icon, xp_reward = EXCLUDED.xp_reward;

-- ============================================================================
-- 2. DAILY QUEST TEMPLATES
-- ============================================================================
INSERT INTO public.daily_quest_templates (slug, title, description, difficulty, xp_reward, target_count, quest_type, icon, badge_hint) VALUES
('balanced-plate', 'Build a Balanced Plate', 'Include at least half a plate of colorful veggies, 1/4 whole grains, and 1/4 lean protein in one meal today.', 'medium', 60, 3, 'plate', 'restaurant', 'Chef Badge Progress'),
('drink-water', 'Drink More Water', 'Log 6 glasses (1.5L) of water to stay hydrated and energetic.', 'easy', 40, 6, 'water', 'water_drop', NULL),
('add-fruits', 'Add 2 Fruits Today', 'Snack on fresh berries, an apple, or a banana between classes or study sessions.', 'easy', 35, 2, 'fruit', 'nutrition', NULL),
('whole-grain', 'Choose a Whole Grain', 'Swap refined white bread or white rice for brown rice, quinoa, or whole-wheat options.', 'medium', 50, 1, 'grain', 'grain', NULL),
('eat-rainbow', 'Eat a Rainbow', 'Eat vegetables or fruits of at least 4 different colors (Red, Green, Orange, Purple) in 24 hours.', 'hard', 85, 4, 'rainbow', 'palette', 'Rainbow Badge')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  difficulty = EXCLUDED.difficulty,
  xp_reward = EXCLUDED.xp_reward,
  target_count = EXCLUDED.target_count,
  quest_type = EXCLUDED.quest_type,
  icon = EXCLUDED.icon,
  badge_hint = EXCLUDED.badge_hint;

-- ============================================================================
-- 3. PANTRY FOODS (Build Your Plate)
-- ============================================================================
INSERT INTO public.pantry_foods (name, emoji, category, tag, calories, is_starter) VALUES
('Broccoli', '🥦', 'veggie', '+Vitamins', 35, true),
('Spinach', '🥗', 'veggie', '+Iron', 25, true),
('Quinoa', '🌾', 'grain', '+Whole Grain', 120, true),
('Salmon', '🐟', 'protein', '+Omega-3', 165, true),
('Chicken', '🍗', 'protein', '+Protein • 140kcal', 140, false),
('Sweet Potato', '🍠', 'grain', '+Carb • 115kcal', 115, false),
('Berries', '🫐', 'veggie', '+Antioxidant', 45, false),
('Greek Yogurt', '🥣', 'dairy', '+Probiotics', 90, false),
('Avocado', '🥑', 'veggie', '+Good Fats', 120, false),
('Green Apple', '🍏', 'veggie', '+Fiber Boost', 55, false),
('Brown Rice', '🍚', 'grain', '+Sustained Carb', 130, false),
('Tofu Cubes', '🧈', 'protein', '+Plant Protein', 110, false)
ON CONFLICT (name) DO UPDATE SET
  emoji = EXCLUDED.emoji,
  category = EXCLUDED.category,
  tag = EXCLUDED.tag,
  calories = EXCLUDED.calories,
  is_starter = EXCLUDED.is_starter;

-- ============================================================================
-- 4. FOOD ACADEMY LESSONS
-- ============================================================================
INSERT INTO public.lessons (slug, title, category, category_label, icon, xp_reward, read_minutes, summary, highlight, body_paragraphs, food_choices, search_keywords) VALUES
('carbohydrates', 'Carbohydrates', 'macro', 'Macronutrient', '🌾', 20, 3,
 'Your body''s primary fuel source. Complex vs simple carbs and sustained energy.',
 'Fuel your muscles with complex grains rather than sugar spikes.',
 ARRAY[
   'Complex carbohydrates break down slowly, giving you stable focus throughout school, sports, and late study sessions.',
   'Simple sugars digest rapidly and can trigger energy crashes an hour later. Pair carbs with fiber or protein for steady stamina.'
 ],
 ARRAY['Rolled oats with cinnamon', 'Brown rice and sweet potatoes', 'Whole grain sourdough bread'],
 'carbohydrates energy grains oats complex fuel carbs'),

('protein', 'Protein', 'macro', 'Macronutrient', '🥚', 20, 4,
 'Building blocks for muscle, tissue repair, immune enzymes, and feeling full.',
 'Aim for a palm-sized serving of protein at every main meal.',
 ARRAY[
   'Proteins are composed of amino acids that rebuild muscle fibers after workouts, synthesize hormones, and support immune antibodies.',
   'Mixing plant and animal sources—or combining beans with whole grains—keeps you satisfied longer between meals.'
 ],
 ARRAY['Grilled chicken or salmon', 'Lentils, chickpeas & edamame', 'Greek yogurt and whole eggs'],
 'protein muscle tissue repair eggs beans amino fullness'),

('healthy-fats', 'Healthy Fats', 'macro', 'Macronutrient', '🥑', 20, 3,
 'Brain fuel, hormone synthesis, and absorbing essential fat-soluble vitamins.',
 'Healthy unsaturated fats unlock vitamins A, D, E, and K.',
 ARRAY[
   'Your brain is nearly 60% fat! Omega-3 and monounsaturated fats protect cell membranes and support sharp memory and focus.',
   'Skip trans fats and pair salads with olive oil, seeds, or avocado so your body actually absorbs fat-soluble micronutrients.'
 ],
 ARRAY['Sliced avocado on toast', 'Extra virgin olive oil drizzle', 'Walnuts, chia & flax seeds'],
 'healthy fats avocado olive oil omega brain hormones absorption'),

('vitamins', 'Vitamins', 'micro', 'Micronutrient', '🍊', 25, 5,
 'Vital micronutrients (A, B, C, D, E, K) that power energy and immune defenses.',
 'Eat colorful produce daily to cover both water- and fat-soluble vitamins.',
 ARRAY[
   'B-vitamins convert food into cellular energy, Vitamin C boosts collagen and immunity, and Vitamin D strengthens bones alongside calcium.',
   'Because water-soluble vitamins (B & C) aren''t stored long-term, topping up with fresh fruits and greens daily keeps levels steady.'
 ],
 ARRAY['Citrus fruits & bell peppers', 'Dark leafy greens like kale', 'Fortified milk or sunlight for Vitamin D'],
 'vitamins micronutrients citrus orange immune immunity defenses c d a b e k'),

('minerals', 'Minerals', 'micro', 'Micronutrient', '🥦', 25, 4,
 'Iron, Calcium, Magnesium, Potassium - keeping bones strong and muscles firing.',
 'Electrolyte minerals prevent cramps and keep oxygen flowing.',
 ARRAY[
   'Iron carries oxygen in hemoglobin to combat fatigue, while calcium and magnesium coordinate muscle contractions and nerve signals.',
   'Pair plant-based iron (spinach, lentils) with Vitamin C (lemon or tomatoes) to dramatically boost absorption!'
 ],
 ARRAY['Steamed broccoli & spinach', 'Bananas & baked potatoes (potassium)', 'Pumpkin seeds & almonds (magnesium)'],
 'minerals iron calcium magnesium potassium bones muscles firing broccoli'),

('fibre', 'Fibre', 'macro', 'Gut & Digestion', '🍎', 20, 3,
 'Gut microbiome health, smooth digestion, and steady blood sugar balance.',
 'Dietary fiber feeds beneficial gut bacteria and slows sugar absorption.',
 ARRAY[
   'Soluble fiber forms a gentle gel in your gut that balances cholesterol and blood sugar; insoluble fiber keeps digestion moving smoothly.',
   'Most teens and young adults get half the recommended 25–30g daily fiber. Keeping skins on apples and choosing whole grains bridges the gap.'
 ],
 ARRAY['Crisp apples & pears with skin', 'Chia seeds & raspberries', 'Black beans and oats'],
 'fibre fiber gut microbiome digestion sugar balance apple chia seeds'),

('hydration', 'Hydration', 'habits', 'Daily Habit', '💧', 15, 2,
 'Why water is 60% of you, dehydration warning signs, and electrolyte balance.',
 'Even 2% mild dehydration can dip your concentration and mood.',
 ARRAY[
   'Water regulates body temperature, lubricates joints, and transports nutrients to every cell in your body.',
   'Waiting until you feel super thirsty means you are already mildly dehydrated. Keep a reusable bottle visible at your desk!'
 ],
 ARRAY['6–8 glasses of plain or infused water', 'Watermelon, cucumber & oranges', 'Coconut water after heavy sweat'],
 'hydration water ripple dehydration electrolyte thirst drink fluid'),

('balanced-diet', 'Balanced Diet', 'habits', 'Lifestyle Mastery', '🥗', 30, 4,
 'The 80/20 rule, plate method, mindful eating, and beating junk food cravings.',
 'Consistency beats perfection: nourish 80% of the time, enjoy treats mindfully 20%.',
 ARRAY[
   'A balanced plate divides space simply: 50% colorful veggies & fruit, 25% whole grains, and 25% lean protein without needing tedious calorie math.',
   'Slowing down without screens helps hunger hormones register fullness, reducing late-night snacking.'
 ],
 ARRAY['50/25/25 Balanced Lunch Plate', 'Rainbow grain & veggie bowls', 'Dark chocolate + berries treat'],
 'balanced diet plate wholesome cravings junk food mindful meals 80 20 rule')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  icon = EXCLUDED.icon,
  xp_reward = EXCLUDED.xp_reward,
  read_minutes = EXCLUDED.read_minutes,
  summary = EXCLUDED.summary,
  highlight = EXCLUDED.highlight,
  body_paragraphs = EXCLUDED.body_paragraphs,
  food_choices = EXCLUDED.food_choices,
  search_keywords = EXCLUDED.search_keywords;

-- ============================================================================
-- 5. NUTRITION QUIZ QUESTIONS (10 Questions)
-- ============================================================================
INSERT INTO public.quiz_questions (id, topic, question_text, hint, options, correct_choice, explanation, food_tags, xp_value) VALUES
(1, 'Macronutrients & Anatomy',
 'Which nutrient is mainly responsible for building and repairing body tissues?',
 'Think athletic recovery: which macro rebuilds torn muscle fibers after a heavy workout?',
 '[{"choice":"A","label":"Carbohydrates","icon":"bakery_dining"},{"choice":"B","label":"Protein","icon":"egg_alt"},{"choice":"C","label":"Vitamins","icon":"shield"},{"choice":"D","label":"Water","icon":"water_drop"}]'::jsonb,
 'B',
 'Proteins are made of amino acids, the fundamental building blocks your body deploys to reconstruct muscle fibers, skin cells, and vital organs!',
 ARRAY['🍗 Lean Poultry', '🌱 Lentils & Edamame', '🥚 Whole Eggs'], 25),

(2, 'Plate Method',
 'According to the Balanced Plate rule, how much of your plate should be filled with vegetables and fruits?',
 'Look at the green left side of the Build Your Plate arena!',
 '[{"choice":"A","label":"1/4 of the plate","icon":"pie_chart"},{"choice":"B","label":"1/2 of the plate","icon":"eco"},{"choice":"C","label":"1/8 of the plate","icon":"restaurant"},{"choice":"D","label":"3/4 of the plate","icon":"local_florist"}]'::jsonb,
 'B',
 'Filling half (50%) of your plate with colorful veggies and fruits maximizes fiber, potassium, and antioxidants while keeping meals light and energizing.',
 ARRAY['🥦 Broccoli', '🥬 Spinach', '🫐 Mixed Berries'], 25),

(3, 'Vitamin Synergy',
 'Healthy fats help your body absorb which group of fat-soluble vitamins?',
 'Remember the Tip of the Day from the Home Dashboard!',
 '[{"choice":"A","label":"Vitamins B1, B6, B12, C","icon":"bolt"},{"choice":"B","label":"Vitamins A, D, E, K","icon":"spa"},{"choice":"C","label":"Iron and Zinc only","icon":"fitness_center"},{"choice":"D","label":"Vitamin C and Folate","icon":"citrus"}]'::jsonb,
 'B',
 'Vitamins A, D, E, and K dissolve in fat rather than water. Adding avocado or olive oil to greens helps unlock their full nutritional value!',
 ARRAY['🥑 Avocado', '🫒 Olive Oil', '🥜 Walnuts'], 25),

(4, 'Smart Carbs',
 'Why are whole grains like oats and quinoa preferred over refined white flour?',
 'Think about how fast your blood sugar rises and crashes.',
 '[{"choice":"A","label":"They contain zero calories","icon":"remove_circle"},{"choice":"B","label":"They retain fiber and release steady energy","icon":"grain"},{"choice":"C","label":"They have twice the added sugar","icon":"cookie"},{"choice":"D","label":"They replace water intake","icon":"water_drop"}]'::jsonb,
 'B',
 'Whole grains keep their bran and germ intact, providing dietary fiber, B-vitamins, and slow-release glucose for lasting focus.',
 ARRAY['🌾 Quinoa', '🥣 Rolled Oats', '🍚 Brown Rice'], 25),

(5, 'Hydration Science',
 'Roughly what percentage of the human body is made up of water?',
 'It is slightly more than half!',
 '[{"choice":"A","label":"25%","icon":"water_drop"},{"choice":"B","label":"40%","icon":"opacity"},{"choice":"C","label":"60%","icon":"waves"},{"choice":"D","label":"95%","icon":"pool"}]'::jsonb,
 'C',
 'About 60% of your body weight is water, powering circulation, temperature control, and cognitive alertness.',
 ARRAY['💧 Plain Water', '🍉 Watermelon', '🥒 Cucumber'], 20),

(6, 'Iron Absorption',
 'Pairing spinach (plant iron) with which nutrient helps your body absorb iron much better?',
 'Think citrus fruits or bell peppers!',
 '[{"choice":"A","label":"Vitamin C","icon":"nutrition"},{"choice":"B","label":"Refined Sugar","icon":"cake"},{"choice":"C","label":"Sodium","icon":"grain"},{"choice":"D","label":"Caffeine","icon":"local_cafe"}]'::jsonb,
 'A',
 'Vitamin C converts plant-based non-heme iron into a form your digestive tract absorbs far more efficiently.',
 ARRAY['🍊 Oranges', '🫑 Bell Peppers', '🥬 Spinach'], 25),

(7, 'Gut Microbiome',
 'Which nutrient acts as fuel (prebiotic) for beneficial bacteria living in your gut?',
 'Found abundantly in apples with skin, beans, and chia seeds.',
 '[{"choice":"A","label":"Dietary Fiber","icon":"eco"},{"choice":"B","label":"Trans Fat","icon":"warning"},{"choice":"C","label":"Artificial Sweetener","icon":"science"},{"choice":"D","label":"Cholesterol","icon":"egg"}]'::jsonb,
 'A',
 'Gut microbes ferment soluble fiber into short-chain fatty acids that strengthen your intestinal lining and immune system.',
 ARRAY['🍎 Apples', '🫘 Black Beans', '🌱 Chia Seeds'], 25),

(8, 'Hidden Sugars',
 'About how many grams of sugar equal 1 standard sugar cube (or teaspoon)?',
 'Used by Sugar Detectives to decode drink labels!',
 '[{"choice":"A","label":"1 gram","icon":"looks_one"},{"choice":"B","label":"4 grams","icon":"grid_view"},{"choice":"C","label":"12 grams","icon":"battery_full"},{"choice":"D","label":"25 grams","icon":"warning"}]'::jsonb,
 'B',
 'One teaspoon or sugar cube is roughly 4 grams of sugar—so a 36g soda has about 9 sugar cubes!',
 ARRAY['🍋 Sparkling Water', '🍓 Fresh Strawberries', '🍵 Unsweetened Tea'], 30),

(9, 'Mineral Power',
 'Which mineral is critical for carrying oxygen in red blood cells throughout your body?',
 'Low levels often make students feel tired and sluggish.',
 '[{"choice":"A","label":"Iron","icon":"bloodtype"},{"choice":"B","label":"Fluoride","icon":"dentistry"},{"choice":"C","label":"Sodium","icon":"salt"},{"choice":"D","label":"Chloride","icon":"science"}]'::jsonb,
 'A',
 'Iron is the core atom in hemoglobin, transporting oxygen from your lungs to muscles and brain.',
 ARRAY['🥬 Spinach', '🫘 Lentils', '🥩 Lean Beef'], 25),

(10, 'Lifestyle Balance',
 'What does the 80/20 balanced eating approach encourage?',
 'Sustainable habits beat extreme dieting!',
 '[{"choice":"A","label":"Eat 80% nutrient-dense foods and enjoy 20% flexible treats","icon":"balance"},{"choice":"B","label":"Eat 80% dessert and 20% veggies","icon":"cake"},{"choice":"C","label":"Skip 20% of your meals","icon":"no_meals"},{"choice":"D","label":"Only eat foods that are 80% water","icon":"water_drop"}]'::jsonb,
 'A',
 'The 80/20 rule builds lifelong healthy habits without guilt—fueling well most of the time while leaving room for social favorites.',
 ARRAY['🥗 Balanced Bowl', '🍓 Berries', '🍫 Dark Chocolate'], 30)
ON CONFLICT (id) DO UPDATE SET
  topic = EXCLUDED.topic,
  question_text = EXCLUDED.question_text,
  hint = EXCLUDED.hint,
  options = EXCLUDED.options,
  correct_choice = EXCLUDED.correct_choice,
  explanation = EXCLUDED.explanation,
  food_tags = EXCLUDED.food_tags,
  xp_value = EXCLUDED.xp_value;

SELECT setval(pg_get_serial_sequence('public.quiz_questions', 'id'), (SELECT MAX(id) FROM public.quiz_questions));

-- ============================================================================
-- 6. MINI-GAME CHALLENGES (Food Detective & Sugar Detective)
-- ============================================================================
INSERT INTO public.mini_game_challenges (id, game_slug, prompt, payload, correct_answer, explanation, xp_value) VALUES
(1, 'food-detective', 'Which afternoon snack delivers more sustained energy & fiber?',
 '{"left":{"name":"Sliced Avocado & Whole-Grain Toast","emoji":"🥑","stats":"7g fiber • Healthy fats"},"right":{"name":"Cheese Puff Chips Bag","emoji":"🧀","stats":"0g fiber • Refined starch"}}'::jsonb,
 'left', 'Avocado and whole-grain toast pair fiber with monounsaturated fats for hours of steady brain power.', 15),

(2, 'food-detective', 'Pick the smarter post-workout protein boost!',
 '{"left":{"name":"Sugary Frosted Cereal Bar","emoji":"🍫","stats":"18g added sugar • 2g protein"},"right":{"name":"Plain Greek Yogurt + Berries","emoji":"🥣","stats":"15g protein • Probiotics"}}'::jsonb,
 'right', 'Greek yogurt packs 15g of complete protein plus gut-friendly probiotics without a sugar crash.', 15),

(3, 'food-detective', 'Which drink hydrates best between study sessions?',
 '{"left":{"name":"Sparkling Water + Fresh Lime","emoji":"🍋","stats":"0g sugar • Pure hydration"},"right":{"name":"Fruit Punch Energy Soda","emoji":"🥤","stats":"39g sugar • High caffeine"}}'::jsonb,
 'left', 'Zero-sugar citrus sparkling water hydrates cleanly without jittery caffeine or sugar spikes.', 15),

(4, 'food-detective', 'Spot the higher-iron, higher-vitamin side dish!',
 '{"left":{"name":"Steamed Broccoli & Sesame","emoji":"🥦","stats":"Vitamin C + K + Fiber"},"right":{"name":"Deep-Fried Onion Rings","emoji":"🧅","stats":"Refined batter • Trans/sat fat"}}'::jsonb,
 'left', 'Steamed broccoli delivers Vitamin C, Vitamin K, and fiber with minimal excess oil.', 15),

(5, 'food-detective', 'Which lunch carb fuels afternoon focus better?',
 '{"left":{"name":"Quinoa & Black Bean Bowl","emoji":"🌾","stats":"Slow-release carbs + 8g fiber"},"right":{"name":"White Pasta with Butter Only","emoji":"🍝","stats":"Low fiber • Fast glucose spike"}}'::jsonb,
 'left', 'Quinoa and black beans give complex carbs plus plant protein for steady afternoon energy.', 15),

(6, 'sugar-detective', 'How many 4g sugar cubes are hiding in a 12oz Cola Can (36g sugar)?',
 '{"item":"12oz Classic Cola Can","emoji":"🥤","serving":"355 ml","choices":["5 cubes","9 cubes","14 cubes","3 cubes"]}'::jsonb,
 '9 cubes', '36g ÷ 4g per cube = 9 full sugar cubes in a single 12oz can!', 20),

(7, 'sugar-detective', 'How many 4g sugar cubes are in a Flavored Strawberry Yogurt Cup (16g sugar)?',
 '{"item":"Flavored Strawberry Yogurt","emoji":"🍓","serving":"150 g cup","choices":["2 cubes","4 cubes","8 cubes","12 cubes"]}'::jsonb,
 '4 cubes', 'Flavored yogurts often add ~16g sugar (4 cubes). Choosing plain yogurt + fresh berries cuts added sugar drastically!', 20),

(8, 'sugar-detective', 'How many 4g sugar cubes are in a Bottled Iced Green Tea (24g sugar)?',
 '{"item":"Sweetened Bottled Iced Tea","emoji":"🧃","serving":"500 ml bottle","choices":["2 cubes","6 cubes","10 cubes","15 cubes"]}'::jsonb,
 '6 cubes', 'Even "tea" drinks can hide 24g of sugar—that is 6 sugar cubes!', 20),

(9, 'sugar-detective', 'How many 4g sugar cubes are in a Chocolate Granola Bar (12g sugar)?',
 '{"item":"Chocolate Chip Granola Bar","emoji":"🍫","serving":"1 bar (40g)","choices":["1 cube","3 cubes","7 cubes","11 cubes"]}'::jsonb,
 '3 cubes', 'Many packaged granola bars pack 12g (3 sugar cubes) disguised as health food.', 20),

(10, 'sugar-detective', 'How many 4g sugar cubes are in a Fresh Green Apple (0g ADDED sugar)?',
 '{"item":"Whole Crisp Green Apple","emoji":"🍏","serving":"1 medium apple","choices":["0 added cubes","5 added cubes","8 added cubes","12 added cubes"]}'::jsonb,
 '0 added cubes', 'Whole fruit contains 0g added sugar, and its natural fiber slows absorption!', 20)
ON CONFLICT (id) DO UPDATE SET
  game_slug = EXCLUDED.game_slug,
  prompt = EXCLUDED.prompt,
  payload = EXCLUDED.payload,
  correct_answer = EXCLUDED.correct_answer,
  explanation = EXCLUDED.explanation,
  xp_value = EXCLUDED.xp_value;

SELECT setval(pg_get_serial_sequence('public.mini_game_challenges', 'id'), (SELECT MAX(id) FROM public.mini_game_challenges));

-- ============================================================================
-- 7. BADGES
-- ============================================================================
INSERT INTO public.badges (slug, name, description, icon, category, tier, rarity, xp_reward, target_value, requirement_type) VALUES
('first-quest', 'First Quest', 'Completed your very first nutrition challenge!', '🏆', 'milestones', 'Gold', 'Common', 50, 1, 'quests_completed'),
('balanced-plate', 'Balanced Plate', 'Constructed balanced macro meals in Plate Builder.', '🥗', 'habits', 'Emerald', 'Rare', 100, 1, 'plates_saved'),
('hydration-hero', 'Hydration Hero', 'Logged 6 glasses of water in a daily quest.', '💧', 'habits', 'Shield', 'Epic', 75, 1, 'water_quests'),
('fruit-explorer', 'Fruit Explorer', 'Logged fresh fruits across your daily quests.', '🍎', 'habits', 'Ruby', 'Ruby', 80, 2, 'fruit_count'),
('streak-master', '3-Day Streak', 'Maintained daily quests and active momentum!', '🔥', 'milestones', 'Fire', 'Mythic', 150, 3, 'streak_days'),
('sugar-sleuth', 'Sugar Sleuth', 'Win rounds in Sugar Detective arcade mode.', '🔍', 'gamemasters', 'Sleuth', 'Rare', 90, 3, 'sugar_wins'),
('rainbow-master', 'Rainbow Master', 'Log vibrant colors of produce in Eat a Rainbow.', '🌈', 'habits', 'Prism', 'Epic', 85, 4, 'rainbow_colors'),
('macro-guru', 'Macro Guru', 'Ace Food Academy quizzes with high accuracy.', '🧠', 'gamemasters', 'Scholar', 'Legend', 120, 3, 'quizzes_completed')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  rarity = EXCLUDED.rarity,
  xp_reward = EXCLUDED.xp_reward,
  target_value = EXCLUDED.target_value,
  requirement_type = EXCLUDED.requirement_type;

-- ============================================================================
-- 8. NUTRITION TIPS
-- ============================================================================
INSERT INTO public.nutrition_tips (id, icon, category, content, highlight_text) VALUES
(1, '🥑', 'Super-Brain Fact', 'Healthy fats help your body absorb fat-soluble vitamins A, D, E, and K! Add a slice of avocado or olive oil to your salads.', 'A, D, E, and K'),
(2, '💧', 'Hydration Boost', 'Drinking a glass of water right after waking up jumpstarts focus and alertness before your first class.', 'jumpstarts focus'),
(3, '🥦', 'Color Power', 'Different plant pigments signal different phytonutrients—aim for at least 3 colors on your plate each day.', '3 colors on your plate'),
(4, '🌾', 'Steady Stamina', 'Swapping refined grains for oats, quinoa, or brown rice helps keep afternoon energy crashes away.', 'energy crashes away')
ON CONFLICT (id) DO UPDATE SET
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  content = EXCLUDED.content,
  highlight_text = EXCLUDED.highlight_text;

SELECT setval(pg_get_serial_sequence('public.nutrition_tips', 'id'), (SELECT MAX(id) FROM public.nutrition_tips));
