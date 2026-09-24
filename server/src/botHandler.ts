import dotenv from 'dotenv';
import { prisma } from './db.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// Map of icon names or keywords to native emojis
const CATEGORY_EMOJI_MAP: Record<string, string> = {
  // Expense
  Utensils: '🍽️',
  ShoppingCart: '🛒',
  Car: '🚗',
  Home: '🏠',
  Receipt: '🧾',
  Film: '🎬',
  ShoppingBag: '🛍️',
  HeartPulse: '❤️',
  Plane: '✈️',
  GraduationCap: '🎓',
  Sparkles: '✨',
  MoreHorizontal: '📦',
  // Income
  Briefcase: '💼',
  Laptop: '💻',
  TrendingUp: '📈',
  Building2: '🏢',
  Gift: '🎁',
  Key: '🔑',
  PlusCircle: '➕',
};

export function getCategoryEmoji(iconName?: string | null, categoryName?: string | null): string {
  if (iconName && CATEGORY_EMOJI_MAP[iconName]) {
    return CATEGORY_EMOJI_MAP[iconName];
  }
  const name = categoryName?.toLowerCase() || '';
  if (name.includes('food') || name.includes('еда') || name.includes('ресторан')) return '🍽️';
  if (name.includes('groc') || name.includes('продукт')) return '🛒';
  if (name.includes('trans') || name.includes('такси') || name.includes('авто')) return '🚗';
  if (name.includes('hous') || name.includes('жиль') || name.includes('аренд')) return '🏠';
  if (name.includes('bill') || name.includes('коммун') || name.includes('счет')) return '🧾';
  if (name.includes('entert') || name.includes('развлеч') || name.includes('кино')) return '🎬';
  if (name.includes('shop') || name.includes('покупк')) return '🛍️';
  if (name.includes('health') || name.includes('здоров')) return '💊';
  if (name.includes('travel') || name.includes('путеш')) return '✈️';
  if (name.includes('educ') || name.includes('обучен')) return '📚';
  if (name.includes('salary') || name.includes('зарплат')) return '💰';
  if (name.includes('free') || name.includes('фриланс')) return '💻';
  if (name.includes('invest') || name.includes('инвест')) return '📈';
  if (name.includes('gift') || name.includes('подар')) return '🎁';
  return '🏷️';
}

function isRu(languageCode?: string | null): boolean {
  return languageCode?.toLowerCase().startsWith('ru') || false;
}

export async function tgCall(method: string, body: Record<string, any> = {}) {
  if (!BOT_TOKEN || BOT_TOKEN === 'demo_bot_token_replace_with_real') {
    console.warn(`[Telegram API] BOT_TOKEN is missing or demo; skipping ${method}`);
    return null;
  }

  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as any;
  if (!data.ok) {
    console.error(`Telegram API [${method}] error:`, data.description);
    throw new Error(`Telegram API [${method}] failed: ${data.description}`);
  }
  return data.result;
}

/**
 * Parses user message into amount and note.
 * Supports:
 * - "500 coffee"
 * - "1200 taxi"
 * - "50000 freelance"
 * - "25000 bonus"
 * - "300"
 * - "12.50 lunch with team"
 * - "12,50 lunch"
 * - "coffee 500"
 */
export function parseTransactionText(text: string): { amount: number; note: string } | null {
  const trimmed = text.trim();
  if (!trimmed || trimmed.startsWith('/')) return null;

  // Remove currency signs or extra spaces between digits (e.g. "1 200 taxi" -> "1200 taxi")
  // First match: starting with amount e.g. "500 coffee", "1 200 taxi", "25.50 lunch"
  const startMatch = trimmed.match(/^([0-9]+(?:\s*[0-9]+)*(?:[.,][0-9]{1,2})?)\s*(.*)$/i);
  if (startMatch) {
    const rawNum = startMatch[1].replace(/\s+/g, '').replace(',', '.');
    const amount = parseFloat(rawNum);
    if (!isNaN(amount) && amount > 0) {
      return { amount, note: startMatch[2]?.trim() || '' };
    }
  }

  // Second match: ending with amount e.g. "coffee 500", "lunch 25.50"
  const endMatch = trimmed.match(/^(.*?)\s+([0-9]+(?:\s*[0-9]+)*(?:[.,][0-9]{1,2})?)$/i);
  if (endMatch) {
    const rawNum = endMatch[2].replace(/\s+/g, '').replace(',', '.');
    const amount = parseFloat(rawNum);
    if (!isNaN(amount) && amount > 0) {
      return { amount, note: endMatch[1]?.trim() || '' };
    }
  }

  return null;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Ensures user exists in Neon DB
 */
async function ensureDbUser(from: {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}) {
  const initialLang = from.language_code?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
  return await prisma.user.upsert({
    where: { telegram_id: BigInt(from.id) },
    update: {
      first_name: from.first_name,
      last_name: from.last_name || null,
      username: from.username || null,
    },
    create: {
      telegram_id: BigInt(from.id),
      first_name: from.first_name,
      last_name: from.last_name || null,
      username: from.username || null,
      currency: 'USD',
      starting_balance: 0.0,
      language: initialLang,
    },
  });
}

/**
 * Main dispatcher for Telegram Webhook / Polling Updates
 */
export async function processTelegramUpdate(update: any) {
  if (!update) return;

  // 1. Handle incoming text message
  if (update.message) {
    await handleIncomingMessage(update.message);
    return;
  }

  // 2. Handle callback queries from inline buttons
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query);
    return;
  }
}

/**
 * Handles incoming text messages
 */
async function handleIncomingMessage(message: any) {
  const chatId = message.chat?.id;
  const from = message.from;
  const text = message.text || '';

  if (!chatId || !from) return;

  const dbUser = await ensureDbUser(from);
  const ru = (dbUser.language || from.language_code || '').toLowerCase().startsWith('ru');

  // Command: /lang or /language
  if (text.startsWith('/lang') || text.startsWith('/language')) {
    const parts = text.split(/\s+/);
    if (parts[1]?.toLowerCase() === 'ru') {
      await prisma.user.update({
        where: { telegram_id: BigInt(from.id) },
        data: { language: 'ru' },
      });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: '🇷🇺 Язык успешно переключен на русский.',
      });
      return;
    } else if (parts[1]?.toLowerCase() === 'en') {
      await prisma.user.update({
        where: { telegram_id: BigInt(from.id) },
        data: { language: 'en' },
      });
      await tgCall('sendMessage', {
        chat_id: chatId,
        text: '🇬🇧 Language switched to English.',
      });
      return;
    }

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: ru ? '🌐 Выберите язык приложения и бота:' : '🌐 Select app and bot language:',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🇬🇧 English', callback_data: 'l:en' },
            { text: '🇷🇺 Русский', callback_data: 'l:ru' },
          ],
        ],
      },
    });
    return;
  }

  // Command: /start
  if (text.startsWith('/start')) {
    const welcomeText = ru
      ? `👋 Привет, ${from.first_name}!\n\n` +
        `Добро пожаловать в *Vault* — твой личный трекер финансов и расходов прямо в Telegram.\n\n` +
        `💡 *Быстрая запись расхода/дохода:*\n` +
        `Просто отправь сумму и заметку в чат:\n` +
        `• \`500 кофе\`\n` +
        `• \`1200 такси\`\n` +
        `• \`50000 зарплата\`\n\n` +
        `Либо открой приложение кнопкой ниже для полной аналитики и истории:`
      : `👋 Hey ${from.first_name}!\n\n` +
        `Welcome to *Vault* — your personal finance & expense tracker inside Telegram.\n\n` +
        `💡 *Quick Transaction Logging:*\n` +
        `Just type the amount and an optional note:\n` +
        `• \`500 coffee\`\n` +
        `• \`1200 taxi\`\n` +
        `• \`50000 salary\`\n\n` +
        `Or launch the Mini App below for full charts and analytics:`;

    const appButtonText = ru ? '🚀 Открыть Vault' : '🚀 Launch Vault';

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: welcomeText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: appButtonText,
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    });
    return;
  }

  // Parse transaction text
  const parsed = parseTransactionText(text);

  if (!parsed) {
    const hintText = ru
      ? `💡 Введите сумму и заметку (например: \`500 кофе\` или \`25000 проект\`), либо откройте приложение через кнопку меню ниже.`
      : `💡 Please enter an amount and an optional note (e.g. \`500 coffee\` or \`25000 project\`), or launch the Mini App via the menu button below.`;

    await tgCall('sendMessage', {
      chat_id: chatId,
      text: hintText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: ru ? '🚀 Открыть Vault' : '🚀 Open Vault',
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    });
    return;
  }

  const { amount, note } = parsed;

  // Store/overwrite active draft in Neon DB
  await prisma.botDraft.upsert({
    where: { user_id: BigInt(from.id) },
    update: {
      amount,
      note: note || null,
      type: null,
      category_id: null,
      updated_at: new Date(),
    },
    create: {
      user_id: BigInt(from.id),
      amount,
      note: note || null,
    },
  });

  const currency = dbUser.currency || 'USD';
  const amountStr = `${formatAmount(amount)} ${currency}`;
  const noteDisplay = note ? (ru ? `\n📝 Заметка: *${note}*` : `\n📝 Note: *${note}*`) : '';

  const promptText = ru
    ? `Сумма: **${amountStr}**${noteDisplay}\n\nВыберите тип операции:`
    : `Amount: **${amountStr}**${noteDisplay}\n\nSelect operation type:`;

  const expenseLabel = ru ? '🔴 Расход' : '🔴 Expense';
  const incomeLabel = ru ? '🟢 Доход' : '🟢 Income';
  const cancelLabel = ru ? '❌ Отмена' : '❌ Cancel';

  await tgCall('sendMessage', {
    chat_id: chatId,
    text: promptText,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: expenseLabel, callback_data: 't:expense' },
          { text: incomeLabel, callback_data: 't:income' },
        ],
        [{ text: cancelLabel, callback_data: 'b:cancel' }],
      ],
    },
  });
}

/**
 * Handles callback queries from inline keyboard buttons
 */
async function handleCallbackQuery(query: any) {
  const queryId = query.id;
  const from = query.from;
  const message = query.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const data = query.data as string;

  if (!queryId || !from || !chatId || !messageId || !data) return;

  // Acknowledge callback immediately to remove loading state in Telegram client
  try {
    await tgCall('answerCallbackQuery', { callback_query_id: queryId });
  } catch (err) {
    // Non-fatal
  }

  // Language change action
  if (data.startsWith('l:')) {
    const chosenLang = data.substring(2) as 'en' | 'ru';
    await prisma.user.upsert({
      where: { telegram_id: BigInt(from.id) },
      update: { language: chosenLang },
      create: {
        telegram_id: BigInt(from.id),
        first_name: from.first_name,
        last_name: from.last_name || null,
        username: from.username || null,
        currency: 'USD',
        language: chosenLang,
      },
    });

    const isNowRu = chosenLang === 'ru';
    const textConfirm = isNowRu
      ? '🇷🇺 Язык успешно изменен на русский!\nНастройки синхронизированы с приложением Vault.'
      : '🇬🇧 Language successfully set to English!\nSettings synchronized with Vault Mini App.';

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: textConfirm,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: isNowRu ? '🚀 Открыть Vault' : '🚀 Open Vault',
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { telegram_id: BigInt(from.id) },
  });
  const ru = (user?.language || from.language_code || '').toLowerCase().startsWith('ru');

  // Cancel action
  if (data === 'b:cancel') {
    await prisma.botDraft.deleteMany({
      where: { user_id: BigInt(from.id) },
    });
    const cancelMsg = ru ? '❌ Запись отменена.' : '❌ Transaction cancelled.';
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: cancelMsg,
    });
    return;
  }

  // Fetch active draft
  const draft = await prisma.botDraft.findUnique({
    where: { user_id: BigInt(from.id) },
  });

  if (!draft) {
    const expiredMsg = ru
      ? '⚠️ Черновик устарел или не найден. Введите сумму заново.'
      : '⚠️ Session expired. Please enter the amount again.';
    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: expiredMsg,
    });
    return;
  }

  const currency = user?.currency || 'USD';
  const amountStr = `${formatAmount(draft.amount)} ${currency}`;

  // STEP 1: Operation Type Selected (Expense or Income)
  if (data.startsWith('t:')) {
    const selectedType = data.substring(2) as 'expense' | 'income';

    await prisma.botDraft.update({
      where: { user_id: BigInt(from.id) },
      data: { type: selectedType },
    });

    // Fetch categories for this type from DB
    const categories = await prisma.category.findMany({
      where: {
        type: selectedType,
        OR: [{ user_id: BigInt(from.id) }, { user_id: null }],
      },
      orderBy: { order: 'asc' },
    });

    const typeDisplay =
      selectedType === 'expense'
        ? ru
          ? 'Расход'
          : 'Expense'
        : ru
          ? 'Доход'
          : 'Income';

    const categoryPrompt = ru
      ? `Сумма: **${amountStr}** (${typeDisplay})\n\nВыберите категорию:`
      : `Amount: **${amountStr}** (${typeDisplay})\n\nSelect a category:`;

    // 2 buttons per row
    const keyboardRows: any[][] = [];
    let currentRow: any[] = [];

    for (const cat of categories) {
      const emoji = getCategoryEmoji(cat.icon, cat.name);
      currentRow.push({
        text: `${emoji} ${cat.name}`,
        callback_data: `c:${cat.id}`,
      });
      if (currentRow.length === 2) {
        keyboardRows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      keyboardRows.push(currentRow);
    }

    keyboardRows.push([
      { text: ru ? '❌ Отмена' : '❌ Cancel', callback_data: 'b:cancel' },
    ]);

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: categoryPrompt,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboardRows,
      },
    });
    return;
  }

  // STEP 2: Category Selected
  if (data.startsWith('c:')) {
    const categoryId = data.substring(2);

    await prisma.botDraft.update({
      where: { user_id: BigInt(from.id) },
      data: { category_id: categoryId },
    });

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });
    const categoryEmoji = getCategoryEmoji(category?.icon, category?.name);
    const categoryName = category?.name || (ru ? 'Категория' : 'Category');

    // Fetch user's top hashtags
    const topUsages = await prisma.hashtagUsage.findMany({
      where: { user_id: BigInt(from.id) },
      orderBy: { use_count: 'desc' },
      take: 6,
    });

    const defaultSuggestions = ['Kaspi', 'Card', 'Cash', 'Halyk'];
    const tagList = Array.from(
      new Set([
        ...topUsages.map((u) => u.tag.replace(/^#/, '')),
        ...defaultSuggestions,
      ])
    ).slice(0, 6);

    const tagPrompt = ru
      ? `Сумма: **${amountStr}** • ${categoryEmoji} ${categoryName}\n\nВыберите счет или тег:`
      : `Amount: **${amountStr}** • ${categoryEmoji} ${categoryName}\n\nSelect account or tag:`;

    // 2-3 hashtag buttons per row
    const keyboardRows: any[][] = [];
    let currentRow: any[] = [];

    for (const tag of tagList) {
      currentRow.push({
        text: `#${tag}`,
        callback_data: `h:${tag}`,
      });
      if (currentRow.length === 2) {
        keyboardRows.push(currentRow);
        currentRow = [];
      }
    }
    if (currentRow.length > 0) {
      keyboardRows.push(currentRow);
    }

    // Skip and Cancel row
    keyboardRows.push([
      { text: ru ? 'Пропустить ➡️' : 'Skip ➡️', callback_data: 'h:_skip_' },
      { text: ru ? '❌ Отмена' : '❌ Cancel', callback_data: 'b:cancel' },
    ]);

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: tagPrompt,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: keyboardRows,
      },
    });
    return;
  }

  // STEP 3: Hashtag Selected / Skipped -> Save to Neon Postgres
  if (data.startsWith('h:')) {
    const rawTag = data.substring(2);
    const selectedTag = rawTag === '_skip_' ? null : rawTag;

    const category = draft.category_id
      ? await prisma.category.findUnique({ where: { id: draft.category_id } })
      : null;

    const categoryEmoji = getCategoryEmoji(category?.icon, category?.name);
    const categoryName = category?.name || (ru ? 'Общее' : 'General');
    const paymentMethod = selectedTag?.toLowerCase().includes('cash') || selectedTag?.toLowerCase().includes('налич')
      ? 'Cash'
      : 'Card';

    // 1. Create Transaction in Neon Postgres (strictly today / now)
    const transaction = await prisma.transaction.create({
      data: {
        user_id: BigInt(from.id),
        category_id: draft.category_id,
        type: draft.type || 'expense',
        amount: draft.amount,
        note: draft.note || null,
        hashtags: selectedTag ? JSON.stringify([selectedTag]) : '[]',
        payment_method: paymentMethod,
        currency,
        date: new Date(),
      },
    });

    // 2. Increment / Upsert Hashtag Usage if tag provided
    if (selectedTag) {
      await prisma.hashtagUsage.upsert({
        where: {
          user_id_tag: {
            user_id: BigInt(from.id),
            tag: selectedTag,
          },
        },
        update: {
          use_count: { increment: 1 },
          last_used_at: new Date(),
        },
        create: {
          user_id: BigInt(from.id),
          tag: selectedTag,
          use_count: 1,
          last_used_at: new Date(),
        },
      });
    }

    // 3. Clear active draft
    await prisma.botDraft.deleteMany({
      where: { user_id: BigInt(from.id) },
    });

    const isExpense = (draft.type || 'expense') === 'expense';
    const typeTitle = isExpense
      ? ru
        ? 'Расход сохранен'
        : 'Expense recorded'
      : ru
        ? 'Доход сохранен'
        : 'Income recorded';

    const tagDisplay = selectedTag ? ` • #${selectedTag}` : '';
    const noteDisplay = draft.note ? `\n📝 ${draft.note}` : '';

    const successMsg = ru
      ? `✅ **${typeTitle}!**\n\n` +
        `💰 **${amountStr}** • ${categoryEmoji} ${categoryName}${tagDisplay}` +
        `${noteDisplay}`
      : `✅ **${typeTitle}!**\n\n` +
        `💰 **${amountStr}** • ${categoryEmoji} ${categoryName}${tagDisplay}` +
        `${noteDisplay}`;

    const openAppBtn = ru ? '🚀 Открыть в приложении' : '🚀 Open in Vault App';

    await tgCall('editMessageText', {
      chat_id: chatId,
      message_id: messageId,
      text: successMsg,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: openAppBtn,
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    });
  }
}
