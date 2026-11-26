import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

import healthRouter from './routes/health.js';
import dashboardRouter from './routes/dashboard.js';
import profileRouter from './routes/profile.js';
import questsRouter from './routes/quests.js';
import foodLogsRouter from './routes/foodLogs.js';
import learnRouter from './routes/learn.js';
import quizRouter from './routes/quiz.js';
import gamesRouter from './routes/games.js';
import rewardsRouter from './routes/rewards.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.allowedOrigins.includes('*') || env.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again shortly.' },
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (_req, res) => {
  res.json({
    name: 'NutriQuest API',
    version: '1.0.0',
    health: '/api/health',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/profile', profileRouter);
app.use('/api/quests', questsRouter);
app.use('/api/food-logs', foodLogsRouter);
app.use('/api/learn', learnRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/games', gamesRouter);
app.use('/api/rewards', rewardsRouter);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`[NutriQuest API] Running on port ${env.port} (${env.nodeEnv})`);
});

export default app;
