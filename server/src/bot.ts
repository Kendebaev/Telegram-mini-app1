import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

if (!BOT_TOKEN || BOT_TOKEN === 'demo_bot_token_replace_with_real' || BOT_TOKEN === 'your_bot_token_here') {
  console.error('\x1b[31m[Bot Error]\x1b[0m Please set a valid TELEGRAM_BOT_TOKEN in server/.env');
  console.log('To get a bot token:');
  console.log('1. Open Telegram and search for @BotFather');
  console.log('2. Send /newbot and follow instructions');
  console.log('3. Copy the token into server/.env: TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."\n');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tgCall(method: string, body: Record<string, any> = {}) {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as any;
  if (!data.ok) {
    throw new Error(`Telegram API [${method}] failed: ${data.description}`);
  }
  return data.result;
}

async function setupMenuButton() {
  if (!WEBAPP_URL.startsWith('https://')) {
    console.warn('\x1b[33m[Warning]\x1b[0m WEBAPP_URL is not HTTPS. Telegram requires HTTPS for WebApp buttons.');
    console.warn(`Current WEBAPP_URL: ${WEBAPP_URL}`);
  }

  try {
    await tgCall('setChatMenuButton', {
      menu_button: {
        type: 'web_app',
        text: 'Vault Finance',
        web_app: { url: WEBAPP_URL },
      },
    });
    console.log(`\x1b[32m✔\x1b[0m Menu Button configured successfully -> ${WEBAPP_URL}`);
  } catch (err: any) {
    console.warn(`Could not set menu button: ${err.message}`);
  }
}

async function startPolling() {
  try {
    const me = await tgCall('getMe');
    console.log(`\x1b[36m✔ Bot connected:\x1b[0m @${me.username} (${me.first_name})`);

    await setupMenuButton();

    console.log(`\x1b[35m⚡ Bot polling started...\x1b[0m Send /start to @${me.username} to test!`);

    let offset = 0;

    while (true) {
      try {
        const updates = await tgCall('getUpdates', {
          offset,
          timeout: 30,
        });

        for (const update of updates) {
          offset = update.update_id + 1;

          if (update.message?.text?.startsWith('/start')) {
            const chatId = update.message.chat.id;
            const firstName = update.message.from?.first_name || 'User';

            await tgCall('sendMessage', {
              chat_id: chatId,
              text: `👋 Hey ${firstName}!\n\nWelcome to *Vault* — your personal finance & expense tracker inside Telegram.\n\nTap the button below to launch the Mini App:`,
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '🚀 Launch Vault',
                      web_app: { url: WEBAPP_URL },
                    },
                  ],
                ],
              },
            });
            console.log(`[Bot] Replied to /start from user ${chatId} (${firstName})`);
          }
        }
      } catch (pollErr: any) {
        if (!pollErr.message.includes('timeout')) {
          console.error('[Polling error]', pollErr.message);
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  } catch (err: any) {
    console.error('\x1b[31m[Bot Fatal Error]\x1b[0m', err.message);
    process.exit(1);
  }
}

startPolling();
