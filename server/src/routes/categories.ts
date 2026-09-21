import { Router, Response } from 'express';
import { prisma } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

const router = Router();

// GET /api/categories
// Returns standard categories + user's custom categories
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    const { type } = req.query;

    const whereClause: any = {
      OR: [
        { is_custom: false },
        ...(userId ? [{ is_custom: true, user_id: BigInt(userId) }] : []),
      ],
    };

    if (type && (type === 'expense' || type === 'income')) {
      whereClause.type = type;
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
// Create a custom category for user
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, icon, color, type } = req.body;
    if (!name || !icon) {
      res.status(400).json({ error: 'Name and icon are required' });
      return;
    }

    const validCategoryType = type === 'income' ? 'income' : 'expense';

    // Get max order
    const maxOrderCat = await prisma.category.findFirst({
      where: {
        type: validCategoryType,
        OR: [{ is_custom: false }, { user_id: BigInt(userId) }],
      },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (maxOrderCat?.order ?? 0) + 1;

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        icon: icon.trim(),
        color: color || (validCategoryType === 'income' ? '#10B981' : '#6366F1'),
        type: validCategoryType,
        is_custom: true,
        order: nextOrder,
        user_id: BigInt(userId),
      },
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    const id = req.params.id as string;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, user_id: BigInt(userId), is_custom: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Custom category not found or not editable' });
      return;
    }

    const { name, icon, color } = req.body;
    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(icon ? { icon: icon.trim() } : {}),
        ...(color ? { color } : {}),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
// Reassigns transactions to "Other Expense" or "Other Income" before deleting
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.telegramUser?.id;
    const id = req.params.id as string;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const existing = await prisma.category.findFirst({
      where: { id, user_id: BigInt(userId), is_custom: true },
    });

    if (!existing) {
      res.status(404).json({ error: 'Custom category not found or not deletable' });
      return;
    }

    // Find fallback "Other" category of the same type
    const fallbackCategoryName = existing.type === 'income' ? 'Other Income' : 'Other Expense';
    const fallbackCategory = await prisma.category.findFirst({
      where: { name: fallbackCategoryName, type: existing.type, is_custom: false },
    });

    // Reassign transactions
    await prisma.transaction.updateMany({
      where: { category_id: id, user_id: BigInt(userId) },
      data: {
        category_id: fallbackCategory ? fallbackCategory.id : null,
      },
    });

    // Delete custom category
    await prisma.category.delete({
      where: { id },
    });

    res.json({ success: true, id, fallbackReassignedTo: fallbackCategory?.id ?? null });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
