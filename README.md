# 🥗 NutriQuest — Gamified Nutrition Education Platform

NutriQuest is a production-grade, gamified web application designed to help college students build lifelong healthy eating habits. Through daily quests, food logging, interactive arcade games, structured nutrition academy lessons, and achievement trophies, eating balanced meals becomes engaging and rewarding.

---

## 🌟 Key Features

- **🏠 Interactive Dashboard**: Daily hero spotlight, real-time macro and calorie balance, daily challenge tracking, chapter roadmap, and nutrition tips.
- **🗺️ Daily Quests & Chapter Map**: 5 daily quest categories (Balanced Plate, Water Hydration, Fruit servings, Whole grains, Rainbow plate) with progress steppers and mystery bonus chests.
- **🍽️ Build Your Plate Mini-Game**: Interactive plate assembler featuring 12 pantry foods across 6 food groups, real-time macro balance meters, coaching feedback, and saved plate history.
- **🔎 Food Detective & Sugar Detective**: Clue-based mini-games challenging players to detect hidden sugars and food categories for bonus XP and arcade coins.
- **🧠 Nutrition Academy & Quiz**: 8 structured bite-sized nutrition lessons with completion tracking and verified 5-question quizzes with instant feedback and hints.
- **🏆 Trophy Room & Rewards**: 8 unlockable badges with rarity tiers (Common, Rare, Epic, Legendary), streak tracking, badge equipping, and weekly nutrition distribution.
- **👤 Player Profile**: Customizable avatar with photo upload, bio editor, game stats bento grid, and activity audit log.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express.js, Multer, Zod, Helmet, Express Rate Limit |
| **Database** | Supabase PostgreSQL with Row Level Security (RLS) |
| **Authentication** | Supabase Auth (Email & Password JWT) |
| **Storage** | Supabase Storage (`avatars`, `meal-photos`) |
| **Frontend Hosting** | Cloudflare Pages |
| **Backend Hosting** | Render |

---

## 📁 Project Structure

```
NutriQuest/
├── backend/                       # Node.js + Express API
│   ├── src/
│   │   ├── config/                # Supabase Admin client & env loader
│   │   ├── middleware/            # JWT auth & centralized error handling
│   │   ├── routes/                # REST endpoints (dashboard, quests, games, etc.)
│   │   ├── services/              # Progression, streaks, XP & badge engine
│   │   └── index.js               # Express server entry point
│   └── package.json
├── frontend/                      # React + Vite application
│   ├── src/
│   │   ├── components/            # TabShell, StackShell, FoodLogModal, ToastBanner
│   │   ├── context/               # AuthContext (sessions, toasts, demo fallback)
│   │   ├── lib/                   # Supabase client & apiRequest helper
│   │   ├── pages/                 # Home, Quests, Games, Learn, Quiz, Rewards, Profile, Auth
│   │   ├── App.jsx                # Route definitions & protected routes
│   │   └── main.jsx               # React entry point
│   ├── index.html
│   ├── tailwind.config.js         # Exact NutriQuest design system palette
│   └── package.json
├── supabase/
│   ├── schema.sql                 # Complete PostgreSQL schema (20+ tables & RLS)
│   └── seed.sql                   # Initial catalog & curriculum data
├── DEPLOYMENT.md                  # Complete deployment manual (Cloudflare + Render)
└── .env.example                   # Master environment variable template
```

---

## 💻 Local Development Setup

### 1. Prerequisites
- Node.js (v18+) & npm

### 2. Configure Environment Variables
Copy `.env.example` into both `frontend/.env` and `backend/.env` and add your Supabase credentials:

**frontend/.env**:
```env
VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_API_URL=http://localhost:5000
```

**backend/.env**:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://<your-project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Start the Backend API
```bash
cd backend
npm install
node src/index.js
```
API runs on `http://localhost:5000`.

### 4. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🚢 Deployment

Refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md) for full instructions on deploying the frontend to **Cloudflare Pages** and backend to **Render**.
