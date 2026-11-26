# 🚀 NutriQuest - Production Deployment Guide

This guide walks you step-by-step through deploying **NutriQuest**:
- **Database, Auth & Storage**: [Supabase](https://supabase.com)
- **Backend API**: [Render](https://render.com) (Node.js + Express)
- **Frontend App**: [Cloudflare Pages](https://pages.cloudflare.com) (React + Vite)

---

## 📑 Table of Contents
1. [Supabase Setup (Database, Auth, Storage)](#1-supabase-setup)
2. [Backend Deployment on Render](#2-backend-deployment-on-render)
3. [Frontend Deployment on Cloudflare Pages](#3-frontend-deployment-on-cloudflare-pages)
4. [Post-Deployment Verification](#4-post-deployment-verification)
5. [Environment Variables Cheat Sheet](#5-environment-variables-cheat-sheet)

---

## 1. Supabase Setup

### A. Create Project
1. Log in to [supabase.com](https://supabase.com) and click **"New project"**.
2. Name: `nutriquest`
3. Choose a region closest to your users (e.g. `Singapore` / `South Asia`).
4. Note down your project reference ID (e.g. `ylmkotbfbfjkyzueolme`).

### B. Run Database Schema & Seeds
1. In the Supabase Dashboard, go to **SQL Editor** -> **New query**.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) to create all 20+ tables, RLS policies, triggers, and storage buckets.
3. Run [`supabase/seed.sql`](./supabase/seed.sql) to populate initial quest chapters, food catalog, quiz questions, and badges.
4. Execute permissions grant:
```sql
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
```

### C. Authentication Settings
1. Go to **Authentication** -> **Providers** -> **Email**.
   - For easy sign-up during demo/testing: toggle off **"Confirm email"** (or keep on for strict production).
2. Go to **Authentication** -> **URL Configuration**:
   - **Site URL**: `https://<your-cloudflare-pages-domain>.pages.dev`
   - **Redirect URLs**: Add `https://<your-cloudflare-pages-domain>.pages.dev/**`

### D. Storage Buckets
Ensure the `avatars` and `meal-photos` buckets exist under **Storage** and are set to **Public** (schema.sql sets this up automatically).

---

## 2. Backend Deployment on Render

### A. Push Code to GitHub
Ensure your repository is pushed to GitHub:
```bash
git init
git add .
git commit -m "feat: complete NutriQuest fullstack application"
git remote add origin https://github.com/<your-username>/NutriQuest.git
git push -u origin main
```

### B. Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Configure service settings:
   - **Name**: `nutriquest-api`
   - **Region**: Choose closest to Supabase (e.g., `Singapore` or `Frankfurt`)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/index.js`
   - **Instance Type**: `Free`

### C. Add Environment Variables on Render
Under **Environment Variables**, add:
| Key | Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `10000` | Render assigns default port 10000 |
| `FRONTEND_URL` | `https://<your-cloudflare-pages-app>.pages.dev` | Frontend origin for CORS |
| `SUPABASE_URL` | `https://<project-id>.supabase.co` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_...` | Supabase Service Role Secret (never expose!) |
| `SUPABASE_ANON_KEY` | `sb_publishable_...` | Supabase Anon Key |

5. Click **Create Web Service**. Once deployed, copy your Render URL (e.g. `https://nutriquest-api.onrender.com`).

---

## 3. Frontend Deployment on Cloudflare Pages

### A. Create Project on Cloudflare Pages
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Go to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your GitHub repository.

### B. Build Configuration
- **Project Name**: `nutriquest`
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`

### C. Environment Variables in Cloudflare Pages
Under **Settings** -> **Environment variables**, add:
| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-id>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` |
| `VITE_API_URL` | `https://nutriquest-api.onrender.com` (Render Backend URL) |

### D. Single Page Application (SPA) Routing
Vite SPA routes (`/quests`, `/games`, `/learn`, etc.) need Cloudflare Pages to serve `index.html` on 404s.
This is automatically handled by Cloudflare Pages for Vite preset. Alternatively, ensure `frontend/public/_redirects` contains:
```
/*    /index.html   200
```

Click **Save and Deploy**. In ~1 minute, your site will be live at `https://nutriquest.pages.dev`!

---

## 4. Post-Deployment Verification

1. **Authentication**: Open your Cloudflare Pages URL, create a new account, and sign in.
2. **Dashboard**: Verify player stats, XP, daily challenge card, and quest map render.
3. **Food Log**: Open the food log modal, log a meal with an image upload, and check if it uploads to Supabase storage.
4. **Quests**: Complete daily quest items (water intake, plate building) and observe XP progression.
5. **Mini-Games**: Play *Build Your Plate*, *Food Detective*, and *Sugar Detective*.
6. **Quiz**: Complete a 5-question nutrition quiz and claim rewards.
7. **Trophy Room**: Equip badges and inspect streak stats.

---

## 5. Security & Best Practices

- 🔒 **Service Role Key**: Stored strictly on Render backend. Never referenced in Vite frontend or client code.
- 🛡️ **Row Level Security (RLS)**: Enforced across all tables in Supabase. Users can only read and mutate their own data.
- 🌐 **CORS**: Restricted in backend via `FRONTEND_URL` environment variable.
