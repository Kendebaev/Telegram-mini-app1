import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

const router = Router();

// Helper to extract and normalize hashtags from note or array
function extractHashtags(tagsInput?: any, note?: string): string[] {
  const set = new Set<string>();

  if (Array.isArray(tagsInput)) {
    tagsInput.forEach((tag) => {
      if (typeof tag === 'string') {
        const cleaned = tag.replace(/^#/, '').trim().toLowerCase();
        if (cleaned) set.add(cleaned);
      }
    });
  }

  if (note && typeof note === 'string') {
    const matches = note.match(/#(\w+)/g);
    if (matches) {
      matches.forEach((m) => {
        const cleaned = m.replace(/^#/, '').trim().toLowerCase();
        if (cleaned) set.add(cleaned);
      });
    }
  }

  return Array.from(set);
}

// Helper to record hashtag usages
async function recordHashtagUsages(userId: bigint, tags: string[]) {
  for (const tag of tags) {
    try {
      await prisma.hashtagUsage.upsert({
        where: { user_id_tag: { user_id: userId, tag } },
        update: {
          use_count: { increment: 1 },
          last_used_at: new Date(),
        },
        create: {
          user_id: userId,
          tag,
          use_count: 1,
          last_used_at: new Date(),
        },
      });
    } catch (err) {
      console.error('Error tracking hashtag usage:', err);
    }
  }
}

// GET /api/transactions
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type, category_id, startDate, endDate, search, hashtag, payment_method, limit, offset } = req.query;

    const whereClause: any = {
      user_id: BigInt(userId),
    };

    // Filter by type: 'expense' | 'income' (if 'all' or missing, return both)
    if (type && typeof type === 'string' && type !== 'all') {
      whereClause.type = type;
    }

    // Filter by category
    if (category_id && typeof category_id === 'string' && category_id !== 'all') {
      whereClause.category_id = category_id;
    }

    // Filter by date range
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate && typeof startDate === 'string') {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        whereClause.date.lte = new Date(endDate);
      }
    }

    // Filter by payment method
    if (payment_method && typeof payment_method === 'string' && payment_method !== 'all') {
      whereClause.payment_method = payment_method;
    }

    // Filter by specific hashtag
    if (hashtag && typeof hashtag === 'string') {
      const cleanTag = hashtag.replace(/^#/, '').toLowerCase();
      whereClause.hashtags = {
        contains: `"${cleanTag}"`,
      };
    }

    // Filter by search query across note, hashtags, and category name
    if (search && typeof search === 'string' && search.trim() !== '') {
      const query = search.trim();
      whereClause.OR = [
        { note: { contains: query } },
        { hashtags: { contains: query.toLowerCase() } },
        { category: { name: { contains: query } } },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: true,
      },
      orderBy: [
        { date: 'desc' },
        { created_at: 'desc' },
      ],
      take: limit ? parseInt(limit as string, 10) : undefined,
      skip: offset ? parseInt(offset as string, 10) : undefined,
    });

    // Parse JSON hashtags for clean client consumption
    const parsedTransactions = transactions.map((tx) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(tx.hashtags);
      } catch {
        parsedTags = [];
      }
      return {
        ...tx,
        hashtags: parsedTags,
      };
    });

    res.json(parsedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// POST /api/transactions
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { amount, type, category_id, note, hashtags, date, payment_method } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      res.status(400).json({ error: 'Amount must be a positive number' });
      return;
    }

    const txType = type === 'income' ? 'income' : 'expense';
    const payMethod = payment_method === 'Cash' ? 'Cash' : 'Card';
    const tags = extractHashtags(hashtags, note);

    const transaction = await prisma.transaction.create({
      data: {
        user_id: BigInt(userId),
        type: txType,
        category_id: category_id || null,
        amount: parsedAmount,
        note: note ? note.trim() : null,
        hashtags: JSON.stringify(tags),
        date: date ? new Date(date) : new Date(),
        payment_method: payMethod,
      },
      include: {
        category: true,
      },
    });

    // Record tag usages in background
    if (tags.length > 0) {
      await recordHashtagUsages(BigInt(userId), tags);
    }

    res.status(201).json({
      ...transaction,
      hashtags: tags,
    });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, user_id: BigInt(userId) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    const { amount, type, category_id, note, hashtags, date, payment_method } = req.body;

    const updateData: any = {};
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        res.status(400).json({ error: 'Amount must be a positive number' });
        return;
      }
      updateData.amount = parsedAmount;
    }

    if (type !== undefined) {
      updateData.type = type === 'income' ? 'income' : 'expense';
    }

    if (category_id !== undefined) {
      updateData.category_id = category_id || null;
    }

    if (note !== undefined) {
      updateData.note = note ? note.trim() : null;
    }

    let updatedTags: string[] | null = null;
    if (hashtags !== undefined || note !== undefined) {
      updatedTags = extractHashtags(hashtags, note ?? existing.note ?? undefined);
      updateData.hashtags = JSON.stringify(updatedTags);
    }

    if (date !== undefined) {
      updateData.date = new Date(date);
    }

    if (payment_method !== undefined) {
      updateData.payment_method = payment_method === 'Cash' ? 'Cash' : 'Card';
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    if (updatedTags && updatedTags.length > 0) {
      await recordHashtagUsages(BigInt(userId), updatedTags);
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(updated.hashtags);
    } catch {
      parsedTags = [];
    }

    res.json({
      ...updated,
      hashtags: parsedTags,
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    const id = req.params.id as string;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.transaction.findFirst({
      where: { id, user_id: BigInt(userId) },
    });

    if (!existing) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    await prisma.transaction.delete({
      where: { id },
    });

    res.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

export default router;
