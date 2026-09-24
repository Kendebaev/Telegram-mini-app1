import dotenv from 'dotenv';
import { tgCall, processTelegramUpdate } from './botHandler.js';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

if (!BOT_TOKEN || BOT_TOKEN === 'demo_bot_token_replace_with_real') {
  console.error('\x1b[31m[Bot Error]\x1b[0m Please set a valid TELEGRAM_BOT_TOKEN in .env or server/.env');
  process.exit(1);
}

const isSetWebhook = process.argv.includes('--webhook') || process.argv.includes('-w');

async function setupWebhook() {
  const webhookUrl = `${WEBAPP_URL.replace(/\/$/, '')}/api/bot`;
  console.log(`Setting Telegram webhook to: ${webhookUrl}`);
  const result = await tgCall('setWebhook', { url: webhookUrl });
  console.log(`\x1b[32m✔ Webhook configured successfully:\x1b[0m`, result);
}

async function setupMenuButton() {
  if (WEBAPP_URL.startsWith('https://')) {
    try {
      await tgCall('setChatMenuButton', {
        menu_button: {
          type: 'web_app',
          text: 'Vault Finance',
          web_app: { url: WEBAPP_URL },
        },
      });
      console.log(`\x1b[32m✔ Menu Button configured -> ${WEBAPP_URL}\x1b[0m`);
    } catch (err: any) {
      console.warn(`Could not set menu button: ${err.message}`);
    }
  }
}

async function startPolling() {
  try {
    const me = await tgCall('getMe');
    console.log(`\x1b[36m✔ Bot connected:\x1b[0m @${me.username} (${me.first_name})`);

    // Remove any webhook to allow local polling
    await tgCall('deleteWebhook');
    await setupMenuButton();

    console.log(`\x1b[35m⚡ Bot polling active!\x1b[0m Send amount & note (e.g. "500 coffee" or "25000 bonus") to @${me.username}!`);

    let offset = 0;
    while (true) {
      try {
        const updates = await tgCall('getUpdates', { offset, timeout: 30 });
        if (Array.isArray(updates)) {
          for (const update of updates) {
            offset = update.update_id + 1;
            await processTelegramUpdate(update);
          }
        }
      } catch (pollErr: any) {
        if (!pollErr.message?.includes('timeout')) {
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

if (isSetWebhook) {
  setupWebhook()
    .then(() => setupMenuButton())
    .catch((err) => console.error('Failed to setup webhook:', err));
} else {
  startPolling();
}
