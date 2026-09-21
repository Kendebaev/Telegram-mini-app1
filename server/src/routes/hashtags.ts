import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/hashtags/suggest
// Returns recently/frequently used hashtags for user
router.get('/suggest', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { query, limit } = req.query;
    const maxLimit = limit ? Math.min(parseInt(limit as string, 10), 30) : 15;

    const whereClause: any = {
      user_id: BigInt(userId),
    };

    if (query && typeof query === 'string' && query.trim()) {
      const cleanQ = query.trim().replace(/^#/, '').toLowerCase();
      whereClause.tag = {
        contains: cleanQ,
      };
    }

    const tags = await prisma.hashtagUsage.findMany({
      where: whereClause,
      orderBy: [
        { last_used_at: 'desc' },
        { use_count: 'desc' },
      ],
      take: maxLimit,
    });

    res.json(tags.map((t) => t.tag));
  } catch (error) {
    console.error('Error suggesting hashtags:', error);
    res.status(500).json({ error: 'Failed to suggest hashtags' });
  }
});

export default router;
