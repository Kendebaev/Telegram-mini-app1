import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  // 12 Expense Categories
  { name: 'Food & Dining', icon: 'Utensils', color: '#F87171', type: 'expense', order: 1 },
  { name: 'Groceries', icon: 'ShoppingCart', color: '#34D399', type: 'expense', order: 2 },
  { name: 'Transport', icon: 'Car', color: '#60A5FA', type: 'expense', order: 3 },
  { name: 'Housing & Rent', icon: 'Home', color: '#818CF8', type: 'expense', order: 4 },
  { name: 'Bills & Utilities', icon: 'Receipt', color: '#FBBF24', type: 'expense', order: 5 },
  { name: 'Entertainment', icon: 'Film', color: '#A78BFA', type: 'expense', order: 6 },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#F472B6', type: 'expense', order: 7 },
  { name: 'Health & Fitness', icon: 'HeartPulse', color: '#FB7185', type: 'expense', order: 8 },
  { name: 'Travel', icon: 'Plane', color: '#38BDF8', type: 'expense', order: 9 },
  { name: 'Education', icon: 'GraduationCap', color: '#4ADE80', type: 'expense', order: 10 },
  { name: 'Personal Care', icon: 'Sparkles', color: '#E879F9', type: 'expense', order: 11 },
  { name: 'Other Expense', icon: 'MoreHorizontal', color: '#94A3B8', type: 'expense', order: 12 },

  // 7 Income Categories
  { name: 'Salary', icon: 'Briefcase', color: '#10B981', type: 'income', order: 1 },
  { name: 'Freelance', icon: 'Laptop', color: '#06B6D4', type: 'income', order: 2 },
  { name: 'Investments', icon: 'TrendingUp', color: '#8B5CF6', type: 'income', order: 3 },
  { name: 'Business', icon: 'Building2', color: '#3B82F6', type: 'income', order: 4 },
  { name: 'Gifts', icon: 'Gift', color: '#EC4899', type: 'income', order: 5 },
  { name: 'Rental', icon: 'Key', color: '#F59E0B', type: 'income', order: 6 },
  { name: 'Other Income', icon: 'PlusCircle', color: '#64748B', type: 'income', order: 7 },
];

async function main() {
  console.log('Seeding categories...');

  const categoryRecords: Record<string, string> = {};

  for (const cat of DEFAULT_CATEGORIES) {
    let existing = await prisma.category.findFirst({
      where: { name: cat.name, type: cat.type, is_custom: false },
    });

    if (!existing) {
      existing = await prisma.category.create({
        data: {
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          order: cat.order,
          is_custom: false,
        },
      });
    } else {
      // Keep color and order updated
      existing = await prisma.category.update({
        where: { id: existing.id },
        data: {
          icon: cat.icon,
          color: cat.color,
          order: cat.order,
        },
      });
    }
    categoryRecords[`${cat.type}:${cat.name}`] = existing.id;
  }

  console.log('Seeding demo user and transactions...');

  // Default demo user
  const demoUserId = BigInt(987654321);
  await prisma.user.upsert({
    where: { telegram_id: demoUserId },
    update: {
      starting_balance: 1500.0,
    },
    create: {
      telegram_id: demoUserId,
      first_name: 'Alex',
      last_name: 'Tracker',
      username: 'alex_tg_user',
      currency: 'USD',
      starting_balance: 1500.0,
    },
  });

  const existingCount = await prisma.transaction.count({
    where: { user_id: demoUserId },
  });

  if (existingCount === 0) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 19, 15);
    const twoDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 45);
    const threeDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 3, 16, 20);
    const fiveDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5, 9, 0);
    const lastWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 13, 0);

    const demoTransactions = [
      {
        user_id: demoUserId,
        category_id: categoryRecords['income:Salary'],
        type: 'income',
        amount: 3200.0,
        note: 'Monthly salary payout #work',
        hashtags: JSON.stringify(['salary', 'work']),
        date: fiveDaysAgo,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['income:Freelance'],
        type: 'income',
        amount: 450.0,
        note: 'Landing page design milestone #client',
        hashtags: JSON.stringify(['freelance', 'client', 'design']),
        date: twoDaysAgo,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Food & Dining'],
        type: 'expense',
        amount: 32.5,
        note: 'Lunch at Italian bistro with team #lunch',
        hashtags: JSON.stringify(['lunch', 'team']),
        date: today,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Transport'],
        type: 'expense',
        amount: 14.5,
        note: 'Taxi ride home in rain #uber',
        hashtags: JSON.stringify(['uber', 'travel']),
        date: today,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Groceries'],
        type: 'expense',
        amount: 78.4,
        note: 'Weekly supermarket essentials & fruits #food',
        hashtags: JSON.stringify(['food', 'organic']),
        date: yesterday,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Entertainment'],
        type: 'expense',
        amount: 22.0,
        note: 'Cinema IMAX ticket and popcorn #weekend',
        hashtags: JSON.stringify(['weekend', 'movies']),
        date: yesterday,
        payment_method: 'Cash',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Bills & Utilities'],
        type: 'expense',
        amount: 95.0,
        note: 'High-speed fiber internet & utilities #home',
        hashtags: JSON.stringify(['bills', 'home']),
        date: twoDaysAgo,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Shopping'],
        type: 'expense',
        amount: 54.0,
        note: 'Wireless earbuds case & braided cable #gadgets',
        hashtags: JSON.stringify(['gadgets']),
        date: threeDaysAgo,
        payment_method: 'Card',
      },
      {
        user_id: demoUserId,
        category_id: categoryRecords['expense:Health & Fitness'],
        type: 'expense',
        amount: 45.0,
        note: 'Gym membership renewal & electrolytes #fitness',
        hashtags: JSON.stringify(['fitness', 'gym']),
        date: lastWeek,
        payment_method: 'Card',
      },
    ];

    for (const tx of demoTransactions) {
      await prisma.transaction.create({
        data: tx,
      });
    }

    // Seed initial hashtag usages
    const initialTags = ['salary', 'work', 'freelance', 'client', 'lunch', 'team', 'uber', 'food', 'weekend', 'bills', 'home', 'fitness'];
    for (const tag of initialTags) {
      await prisma.hashtagUsage.upsert({
        where: { user_id_tag: { user_id: demoUserId, tag } },
        update: { use_count: { increment: 1 }, last_used_at: new Date() },
        create: { user_id: demoUserId, tag, use_count: 1 },
      });
    }
  }

  console.log('Database seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
