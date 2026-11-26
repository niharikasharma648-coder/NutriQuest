// ============================================================
// MOCK DATA — used in Demo Mode when Supabase is not configured
// ============================================================

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@nutriquest.app',
};

export const DEMO_SESSION = {
  access_token: 'demo-token',
  user: DEMO_USER,
};

export const DEMO_PROFILE = {
  id: 'demo-user-001',
  username: 'NutriHero',
  bio: 'On a quest to eat better every day! 🥦',
  avatarUrl: '/assets/default-avatar.png',
  level: 7,
  xp: 3450,
  title: 'Nutrition Explorer',
  streak: 12,
};

export const MOCK_RESPONSES = {
  '/api/profile': {
    username: 'NutriHero',
    bio: 'On a quest to eat better every day! 🥦',
    avatarUrl: '/assets/default-avatar.png',
    level: 7,
    xp: 3450,
    title: 'Nutrition Explorer',
    streak: 12,
    email: 'demo@nutriquest.app',
    stats: { xp: 3450, streak: 12, badges: 5, lessons: 8, quizzes: 14, games: 22 },
    showcaseBadges: [
      { id: 'b1', name: 'First Meal', icon: '🍽️' },
      { id: 'b2', name: 'Streak Starter', icon: '🔥' },
      { id: 'b3', name: 'Quiz Master', icon: '🧠' },
    ],
    weeklyNutrition: [
      { label: 'Protein', percent: 72, color: '#00FF94' },
      { label: 'Carbs', percent: 85, color: '#4FC3F7' },
      { label: 'Fats', percent: 55, color: '#FFB74D' },
      { label: 'Fiber', percent: 68, color: '#CE93D8' },
      { label: 'Vitamins', percent: 90, color: '#F06292' },
    ],
    recentActivity: [
      { icon: '🍎', description: 'Logged Apple as a snack', timeAgo: '2h ago', xp: 10 },
      { icon: '🧠', description: 'Completed Nutrition Quiz — 8/10', timeAgo: '5h ago', xp: 50 },
      { icon: '🎮', description: 'Build Your Plate — Gold score', timeAgo: 'Yesterday', xp: 75 },
      { icon: '📚', description: 'Finished Lesson: Macronutrients 101', timeAgo: '2d ago', xp: 30 },
    ],
  },

  '/api/dashboard': {
    playerName: 'NutriHero',
    level: 7,
    xp: 3450,
    xpToNextLevel: 500,
    streak: 12,
    totalBadges: 5,
    dailyChallenge: {
      title: 'Rainbow Plate Challenge',
      description: 'Eat 5 different coloured foods today',
      xpReward: 100,
      progress: 3,
      total: 5,
    },
    questProgress: { completed: 3, total: 5 },
    tipOfDay: {
      title: 'Eat the Rainbow 🌈',
      body: 'Different coloured fruits and vegetables contain different nutrients. Try to eat at least 5 colours every day!',
    },
    recentFoodLogs: [],
    weeklyCalories: [1800, 2100, 1950, 2200, 1700, 2050, 1900],
  },

  '/api/quests': {
    quests: [
      { id: 'q1', type: 'plate', title: 'Build a Balanced Plate', description: 'Log a meal with all food groups', xpReward: 80, progress: 1, total: 1, completed: false, icon: '🍽️' },
      { id: 'q2', type: 'water', title: 'Hydration Hero', description: 'Drink 8 glasses of water', xpReward: 50, progress: 5, total: 8, completed: false, icon: '💧' },
      { id: 'q3', type: 'fruit', title: 'Fruit Power', description: 'Eat 2 servings of fruit', xpReward: 40, progress: 2, total: 2, completed: true, icon: '🍎' },
      { id: 'q4', type: 'grain', title: 'Whole Grain Champion', description: 'Have a whole grain serving', xpReward: 40, progress: 0, total: 1, completed: false, icon: '🌾' },
      { id: 'q5', type: 'rainbow', title: 'Rainbow Plate', description: 'Eat 5 different coloured foods', xpReward: 100, progress: 3, total: 5, completed: false, icon: '🌈' },
    ],
    bonusChest: { available: true, xpReward: 150 },
    stageProgress: { current: 'chapter-2', label: 'Macro Master', percent: 60 },
  },

  '/api/food-logs': {
    logs: [
      { id: 'fl1', name: 'Oatmeal with Berries', calories: 320, mealType: 'breakfast', foodGroup: 'grain', loggedAt: new Date().toISOString(), photoUrl: null },
      { id: 'fl2', name: 'Grilled Chicken Salad', calories: 480, mealType: 'lunch', foodGroup: 'protein', loggedAt: new Date().toISOString(), photoUrl: null },
      { id: 'fl3', name: 'Apple', calories: 95, mealType: 'snack', foodGroup: 'fruit', loggedAt: new Date().toISOString(), photoUrl: null },
    ],
    totalCalories: 895,
    calorieGoal: 2000,
  },

  '/api/learn': {
    lessons: [
      { id: 'l1', title: 'Macronutrients 101', category: 'basics', emoji: '💪', duration: 5, xpReward: 30, completed: true, description: 'Learn about proteins, carbs, and fats — the three macronutrients your body needs.', content: 'Macronutrients are the nutrients your body needs in large amounts. Proteins build muscle, carbohydrates provide energy, and fats support cell function and hormone production. A balanced diet includes all three in the right proportions.' },
      { id: 'l2', title: 'Vitamins & Minerals', category: 'basics', emoji: '🌿', duration: 6, xpReward: 30, completed: true, description: 'Discover the essential micronutrients and their roles in your body.', content: 'Vitamins and minerals are micronutrients essential for nearly every body process. Vitamin C boosts immunity, calcium strengthens bones, and iron carries oxygen in your blood. Eating a colourful variety of foods helps ensure you get them all.' },
      { id: 'l3', title: 'The Power of Fiber', category: 'digestion', emoji: '🫘', duration: 4, xpReward: 25, completed: false, description: 'Why fiber is your digestive system\'s best friend.', content: 'Dietary fiber keeps your digestive system healthy, helps control blood sugar levels, and makes you feel full longer. Great sources include whole grains, legumes, fruits, and vegetables. Aim for 25–38g per day.' },
      { id: 'l4', title: 'Hydration & Health', category: 'basics', emoji: '💧', duration: 3, xpReward: 20, completed: false, description: 'How much water do you really need and why?', content: 'Water makes up about 60% of your body weight and is essential for every bodily function. It regulates temperature, carries nutrients, and flushes waste. Most adults need 8–10 cups (2–2.5L) per day, more if active.' },
      { id: 'l5', title: 'Understanding Sugar', category: 'sugar', emoji: '🍬', duration: 5, xpReward: 30, completed: false, description: 'Natural vs added sugars — what\'s the real difference?', content: 'Natural sugars in fruits and dairy come with fiber, vitamins, and minerals. Added sugars in processed foods provide calories with no nutritional benefit. The WHO recommends limiting added sugar to less than 10% of your daily calorie intake.' },
      { id: 'l6', title: 'Healthy Fats', category: 'fats', emoji: '🥑', duration: 5, xpReward: 30, completed: false, description: 'Not all fats are equal — learn which ones to embrace.', content: 'Unsaturated fats (found in avocados, nuts, olive oil, and fish) are heart-healthy and reduce inflammation. Saturated fats should be limited, and trans fats avoided entirely. Fat is essential for brain health and absorbing fat-soluble vitamins.' },
      { id: 'l7', title: 'Reading Food Labels', category: 'practical', emoji: '🏷️', duration: 7, xpReward: 40, completed: false, description: 'Decode nutrition labels like a pro.', content: 'Food labels list serving size, calories, macronutrients, and key micronutrients. Watch for hidden sugars (any ingredient ending in -ose), high sodium, and misleading "low-fat" claims that add extra sugar. The ingredients list is your most honest guide.' },
      { id: 'l8', title: 'Meal Planning Basics', category: 'practical', emoji: '📋', duration: 8, xpReward: 50, completed: false, description: 'Plan your meals to eat healthier with less effort.', content: 'Meal planning saves time, money, and reduces unhealthy choices. Start by planning 3–4 dinners per week, prep ingredients on weekends, and keep healthy snacks visible. The "plate method" — half vegetables, quarter protein, quarter whole grains — is a simple guide for every meal.' },
    ],
    categories: ['All', 'basics', 'digestion', 'sugar', 'fats', 'practical'],
  },

  '/api/quiz/questions': {
    questions: [
      { id: 'qq1', question: 'Which macronutrient provides 4 calories per gram?', options: ['Fat', 'Protein', 'Alcohol', 'Water'], correctIndex: 1, hint: 'Think about muscle-building nutrients' },
      { id: 'qq2', question: 'Which vitamin is produced by the skin when exposed to sunlight?', options: ['Vitamin A', 'Vitamin B12', 'Vitamin C', 'Vitamin D'], correctIndex: 3, hint: 'Often called the "sunshine vitamin"' },
      { id: 'qq3', question: 'What is the recommended daily water intake for adults?', options: ['1–2 cups', '4–5 cups', '8–10 cups', '15+ cups'], correctIndex: 2, hint: 'Think about 8 glasses per day' },
      { id: 'qq4', question: 'Which food group is the best source of dietary fiber?', options: ['Meat & Fish', 'Dairy', 'Whole Grains & Legumes', 'Oils & Fats'], correctIndex: 2, hint: 'Think plant-based whole foods' },
      { id: 'qq5', question: 'What does BMR stand for in nutrition?', options: ['Basic Metabolic Rate', 'Basal Metabolic Rate', 'Body Mass Ratio', 'Blood Mineral Reading'], correctIndex: 1, hint: 'It is the energy your body uses at rest' },
    ],
    totalQuestions: 5,
  },

  '/api/rewards': {
    level: 7,
    totalXp: 3450,
    earnedCount: 5,
    streak: 12,
    rank: 42,
    xpProgress: { current: 450, toNextLevel: 550 },
    mysteryChest: { available: true, hoursRemaining: 0 },
    badges: [
      { id: 'badge1', name: 'First Quest', icon: '⚔️', rarity: 'common', earned: true, isEquipped: false, description: 'Completed your very first daily quest.' },
      { id: 'badge2', name: 'Streak Starter', icon: '🔥', rarity: 'common', earned: true, isEquipped: true, description: 'Maintained a 7-day login streak.' },
      { id: 'badge3', name: 'Plate Builder', icon: '🍽️', rarity: 'rare', earned: true, isEquipped: false, description: 'Built 10 balanced plates in Build Your Plate.' },
      { id: 'badge4', name: 'Quiz Whiz', icon: '🧠', rarity: 'rare', earned: true, isEquipped: false, description: 'Scored 100% on a Nutrition Quiz.' },
      { id: 'badge5', name: 'Rainbow Chaser', icon: '🌈', rarity: 'epic', earned: true, isEquipped: false, description: 'Completed the Rainbow Plate quest 5 times.' },
      { id: 'badge6', name: 'Sugar Detective', icon: '🔍', rarity: 'epic', earned: false, requirement: 'Complete Sugar Detective game 3 times', description: 'Identified hidden sugars in 15 products.' },
      { id: 'badge7', name: 'Legend', icon: '👑', rarity: 'legendary', earned: false, requirement: 'Reach Level 20', description: 'The ultimate NutriQuest achiever.' },
      { id: 'badge8', name: 'Food Scholar', icon: '📚', rarity: 'epic', earned: false, requirement: 'Complete all Food Academy lessons', description: 'Finished every lesson in Food Academy.' },
    ],
  },

  '/api/games/overview': {
    totalGamesPlayed: 22,
    totalXpFromGames: 1200,
    leaderboard: [
      { rank: 1, username: 'FoodNinja99', xp: 5200, avatar: null },
      { rank: 2, username: 'VeggiePower', xp: 4800, avatar: null },
      { rank: 3, username: 'ProteinKing', xp: 4500, avatar: null },
      { rank: 4, username: 'NutriHero', xp: 3450, avatar: null, isMe: true },
      { rank: 5, username: 'HealthyHana', xp: 3100, avatar: null },
    ],
    games: [
      { slug: 'build-your-plate', name: 'Build Your Plate', emoji: '🍽️', description: 'Assemble the perfect balanced meal', xpReward: 75, bestScore: 920, timesPlayed: 14, isNew: false, is2x: true },
      { slug: 'food-detective', name: 'Food Detective', emoji: '🔎', description: 'Identify food groups from clues', xpReward: 50, bestScore: 850, timesPlayed: 5, isNew: false, is2x: false },
      { slug: 'sugar-detective', name: 'Sugar Detective', emoji: '🍬', description: 'Hunt down hidden sugars in products', xpReward: 60, bestScore: 780, timesPlayed: 3, isNew: true, is2x: false },
    ],
  },

  '/api/games/pantry': {
    foods: [
      { id: 'f1', name: 'Grilled Chicken', emoji: '🍗', group: 'protein', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
      { id: 'f2', name: 'Brown Rice', emoji: '🍚', group: 'grain', calories: 216, protein: 5, carbs: 45, fat: 1.8 },
      { id: 'f3', name: 'Broccoli', emoji: '🥦', group: 'vegetable', calories: 55, protein: 3.7, carbs: 11, fat: 0.6 },
      { id: 'f4', name: 'Apple', emoji: '🍎', group: 'fruit', calories: 95, protein: 0.5, carbs: 25, fat: 0.3 },
      { id: 'f5', name: 'Greek Yogurt', emoji: '🥛', group: 'dairy', calories: 100, protein: 17, carbs: 6, fat: 0.7 },
      { id: 'f6', name: 'Avocado', emoji: '🥑', group: 'fat', calories: 160, protein: 2, carbs: 9, fat: 15 },
      { id: 'f7', name: 'Lentils', emoji: '🫘', group: 'protein', calories: 230, protein: 18, carbs: 40, fat: 0.8 },
      { id: 'f8', name: 'Spinach', emoji: '🥬', group: 'vegetable', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
      { id: 'f9', name: 'Banana', emoji: '🍌', group: 'fruit', calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
      { id: 'f10', name: 'Whole Wheat Bread', emoji: '🍞', group: 'grain', calories: 138, protein: 6, carbs: 26, fat: 1.9 },
      { id: 'f11', name: 'Salmon', emoji: '🐟', group: 'protein', calories: 208, protein: 28, carbs: 0, fat: 10 },
      { id: 'f12', name: 'Almonds', emoji: '🌰', group: 'fat', calories: 164, protein: 6, carbs: 6, fat: 14 },
    ],
  },

  '/api/games/challenges/food-detective': {
    slug: 'food-detective',
    name: 'Food Detective',
    emoji: '🔎',
    rounds: [
      { id: 'r1', clue: 'I am orange, crunchy, and great for your eyes. What food group am I from?', answer: 'vegetable', options: ['fruit', 'vegetable', 'grain', 'protein'], emoji: '🥕' },
      { id: 'r2', clue: 'I am a complete protein, come from a hen, and can be scrambled or fried.', answer: 'protein', options: ['dairy', 'grain', 'protein', 'fat'], emoji: '🥚' },
      { id: 'r3', clue: 'I am sweet, come from a tree, and am a great source of natural sugar and fiber.', answer: 'fruit', options: ['grain', 'fruit', 'vegetable', 'dairy'], emoji: '🍊' },
      { id: 'r4', clue: 'I am white, liquid, rich in calcium, and produced by cows.', answer: 'dairy', options: ['fat', 'protein', 'dairy', 'grain'], emoji: '🥛' },
      { id: 'r5', clue: 'I am a whole grain, full of fiber, and often eaten as a porridge in the morning.', answer: 'grain', options: ['fruit', 'grain', 'vegetable', 'protein'], emoji: '🌾' },
    ],
  },

  '/api/games/challenges/sugar-detective': {
    slug: 'sugar-detective',
    name: 'Sugar Detective',
    emoji: '🍬',
    rounds: [
      { id: 's1', clue: 'A 330ml can of cola contains how many teaspoons of sugar?', answer: '9', options: ['2', '5', '9', '15'], emoji: '🥤' },
      { id: 's2', clue: 'Which breakfast cereal typically has the MOST hidden sugar?', answer: 'Frosted Flakes', options: ['Oatmeal', 'Muesli', 'Frosted Flakes', 'Bran Flakes'], emoji: '🥣' },
      { id: 's3', clue: 'Which ingredient on a label is NOT a form of added sugar?', answer: 'Stevia', options: ['Dextrose', 'Maltose', 'Stevia', 'Fructose Syrup'], emoji: '🏷️' },
      { id: 's4', clue: 'A "low-fat" yogurt often compensates by adding more of what?', answer: 'Sugar', options: ['Salt', 'Sugar', 'Protein', 'Fiber'], emoji: '🍶' },
      { id: 's5', clue: 'Which fruit juice has the LEAST natural sugar?', answer: 'Lemon juice', options: ['Orange juice', 'Apple juice', 'Grape juice', 'Lemon juice'], emoji: '🍋' },
    ],
  },
};

// Helper to get a mock response for a path, including dynamic paths
export function getMockResponse(path, method = 'GET') {
  // Strip query strings
  const cleanPath = path.split('?')[0];

  // Exact match
  if (MOCK_RESPONSES[cleanPath]) return { ...MOCK_RESPONSES[cleanPath] };

  // Dynamic routes
  if (cleanPath.match(/^\/api\/games\/challenges\//)) return MOCK_RESPONSES[cleanPath] || { rounds: [] };
  if (cleanPath.match(/^\/api\/food-logs\/\w+$/) && method === 'DELETE') return { success: true };
  if (cleanPath.match(/^\/api\/rewards\/badges\/.+\/equip$/) && method === 'POST') return { success: true };
  if (cleanPath === '/api/rewards/mystery-chest' && method === 'POST') return { reward: { description: 'Bonus 50 XP earned! 🎉', xp: 50 } };
  if (cleanPath === '/api/quiz/check') return { correct: true, explanation: 'Great answer!' };
  if (cleanPath === '/api/quiz/complete') return { xpEarned: 100, badge: null };
  if (cleanPath === '/api/quests/bonus-chest' && method === 'POST') return { xpEarned: 150, message: '🎁 Bonus chest opened!' };
  if (cleanPath.match(/^\/api\/quests\/.+\/progress$/) && method === 'PATCH') return { success: true };
  if (cleanPath === '/api/learn') return MOCK_RESPONSES['/api/learn'];
  if (cleanPath.match(/^\/api\/learn\/.+\/complete$/) && method === 'POST') return { xpEarned: 30 };
  if (cleanPath === '/api/games/plates' && method === 'POST') return { id: 'plate-' + Date.now(), score: 920, feedback: 'Perfect balance! 🏆', xpEarned: 75 };
  if (cleanPath.match(/^\/api\/games\/plates\//) && method === 'DELETE') return { success: true };
  if (cleanPath === '/api/games/sessions' && method === 'POST') return { xpEarned: 60, score: 800 };
  if (cleanPath.match(/^\/api\/quests\/stages\/.+\/complete$/) && method === 'POST') return { success: true, xpEarned: 200 };
  if (cleanPath === '/api/food-logs' && method === 'POST') return { id: 'fl-' + Date.now(), success: true };
  if (cleanPath === '/api/profile' && method === 'PATCH') return { success: true };
  if (cleanPath === '/api/profile/avatar' && method === 'POST') return { avatarUrl: '/assets/default-avatar.png' };
  if (cleanPath === '/api/health') return { status: 'ok', mode: 'demo' };

  return { data: null };
}
