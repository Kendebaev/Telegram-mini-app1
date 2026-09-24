import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import categoriesRouter from './routes/categories.js';
import transactionsRouter from './routes/transactions.js';
import expensesRouter from './routes/expenses.js';
import analyticsRouter from './routes/analytics.js';
import hashtagsRouter from './routes/hashtags.js';
import { telegramAuthMiddleware, AuthenticatedRequest } from './auth.js';
import { prisma } from './db.js';

dotenv.config();

export const app = express();

// Enable CORS for Vercel, Telegram Webview (iOS, Android, Desktop, Web), and local development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-telegram-init-data'],
}));

app.use(express.json());

// API router containing all endpoints
const apiRouter = express.Router();

// Health check endpoint
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protect all /api routes with Telegram auth
apiRouter.use(telegramAuthMiddleware);

// User Profile route
apiRouter.get('/user/profile', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(userId) },
    });

    res.json({
      ...req.telegramUser,
      currency: user?.currency || 'USD',
      starting_balance: user?.starting_balance ?? 0.0,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update User Currency
apiRouter.put('/user/currency', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.telegramUser?.id;
    const { currency } = req.body;

    if (!userId || !currency) {
      res.status(400).json({ error: 'User ID and currency are required' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { telegram_id: BigInt(userId) },
      data: { currency },
    });

    res.json({
      ...updatedUser,
      telegram_id: updatedUser.telegram_id.toString(),
    });
  } catch (error) {
    console.error('Error updating currency:', error);
    res.status(500).json({ error: 'Failed to update currency' });
  }
});

// Update Starting Balance
apiRouter.put('/user/starting-balance', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.telegramUser?.id;
    const { starting_balance } = req.body;

    if (!userId || starting_balance === undefined) {
      res.status(400).json({ error: 'User ID and starting_balance are required' });
      return;
    }

    const parsedBalance = parseFloat(starting_balance);
    if (isNaN(parsedBalance)) {
      res.status(400).json({ error: 'starting_balance must be a valid number' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { telegram_id: BigInt(userId) },
      data: { starting_balance: parsedBalance },
    });

    res.json({
      ...updatedUser,
      telegram_id: updatedUser.telegram_id.toString(),
    });
  } catch (error) {
    console.error('Error updating starting balance:', error);
    res.status(500).json({ error: 'Failed to update starting balance' });
  }
});

// Wipe User Data / Reset
apiRouter.post('/user/reset', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const userBigInt = BigInt(userId);

    // Delete all transactions for this user
    await prisma.transaction.deleteMany({
      where: { user_id: userBigInt },
    });

    // Delete custom categories
    await prisma.category.deleteMany({
      where: { user_id: userBigInt, is_custom: true },
    });

    // Delete hashtag usages
    await prisma.hashtagUsage.deleteMany({
      where: { user_id: userBigInt },
    });

    // Reset starting balance to 0
    await prisma.user.update({
      where: { telegram_id: userBigInt },
      data: { starting_balance: 0.0 },
    });

    res.json({ success: true, message: 'All user data has been cleared' });
  } catch (error) {
    console.error('Error resetting user data:', error);
    res.status(500).json({ error: 'Failed to reset user data' });
  }
});

// Module routes
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/expenses', expensesRouter); // backwards compatibility
apiRouter.use('/hashtags', hashtagsRouter);
apiRouter.use('/analytics', analyticsRouter);

// Mount router on both '/api' and '/'
// This ensures compatibility whether requests arrive directly at /api/... or get rewritten by Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
