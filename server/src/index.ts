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

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protect all /api routes with Telegram auth
app.use('/api', telegramAuthMiddleware);

// User Profile route
app.get('/api/user/profile', async (req: AuthenticatedRequest, res) => {
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
app.put('/api/user/currency', async (req: AuthenticatedRequest, res) => {
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
app.put('/api/user/starting-balance', async (req: AuthenticatedRequest, res) => {
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
app.post('/api/user/reset', async (req: AuthenticatedRequest, res) => {
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
app.use('/api/categories', categoriesRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/expenses', expensesRouter); // backwards compatibility
app.use('/api/hashtags', hashtagsRouter);
app.use('/api/analytics', analyticsRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

