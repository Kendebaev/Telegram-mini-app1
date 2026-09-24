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

// POST /api/hashtags
// Adds a new suggested hashtag for user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tag } = req.body;
    if (!tag || typeof tag !== 'string') {
      res.status(400).json({ error: 'Tag is required' });
      return;
    }

    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase();
    if (!cleanTag) {
      res.status(400).json({ error: 'Valid tag is required' });
      return;
    }

    const usage = await prisma.hashtagUsage.upsert({
      where: {
        user_id_tag: {
          user_id: BigInt(userId),
          tag: cleanTag,
        },
      },
      update: {
        last_used_at: new Date(),
        use_count: { increment: 1 },
      },
      create: {
        user_id: BigInt(userId),
        tag: cleanTag,
        use_count: 1,
        last_used_at: new Date(),
      },
    });

    res.status(201).json({ tag: usage.tag, id: usage.id });
  } catch (error) {
    console.error('Error adding hashtag:', error);
    res.status(500).json({ error: 'Failed to add hashtag' });
  }
});

// DELETE /api/hashtags/:tag
// Deletes a suggested hashtag from user's hashtag list
router.delete('/:tag', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const rawTag = Array.isArray(req.params.tag) ? req.params.tag[0] : req.params.tag;
    const cleanTag = (rawTag || '').trim().replace(/^#/, '').toLowerCase();

    await prisma.hashtagUsage.deleteMany({
      where: {
        user_id: BigInt(userId),
        tag: cleanTag,
      },
    });

    res.json({ success: true, tag: cleanTag });
  } catch (error) {
    console.error('Error deleting hashtag:', error);
    res.status(500).json({ error: 'Failed to delete hashtag' });
  }
});

export default router;

