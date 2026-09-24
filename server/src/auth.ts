import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { prisma } from './db.js';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  allows_write_to_pm?: boolean;
}

export interface AuthenticatedRequest extends Request {
  telegramUser?: TelegramUser;
}

/**
 * Validates Telegram WebApp initData string using HMAC-SHA256.
 * Official algorithm:
 * 1. Parse params and extract 'hash'.
 * 2. Sort remaining params in format 'key=value' separated by '\n'.
 * 3. secret_key = HMAC_SHA256("WebAppData", bot_token)
 * 4. computed_hash = HMAC_SHA256(secret_key, data_check_string)
 */
export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    params.delete('hash');

    // Sort parameters alphabetically
    const keys = Array.from(params.keys()).sort();
    const dataCheckArr: string[] = [];

    for (const key of keys) {
      dataCheckArr.push(`${key}=${params.get(key)}`);
    }

    const dataCheckString = dataCheckArr.join('\n');

    // Create secret key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Calculate signature
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return null;
    }

    // Parse user object
    const userJson = params.get('user');
    if (userJson) {
      return JSON.parse(userJson) as TelegramUser;
    }

    return null;
  } catch (err) {
    console.error('Error verifying Telegram initData:', err);
    return null;
  }
}

/**
 * Express middleware to authenticate Telegram requests.
 * Supports production HMAC check and seamless dev/demo mock headers.
 */
export async function telegramAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const initData = (req.headers['x-telegram-init-data'] as string) || '';
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  // 1. If real bot token and initData are provided, verify cryptographically
  if (botToken && botToken !== 'demo_bot_token_replace_with_real' && initData) {
    const verifiedUser = verifyTelegramInitData(initData, botToken);
    if (!verifiedUser) {
      res.status(401).json({ error: 'Invalid Telegram initData signature' });
      return;
    }
    req.telegramUser = verifiedUser;
  } else {
    // 2. Dev / Demo fallback: parse user from initData if present, or use default demo user
    let user: TelegramUser = {
      id: 987654321,
      first_name: 'Alex',
      last_name: 'Tracker',
      username: 'alex_tg_user',
    };

    if (initData) {
      try {
        const params = new URLSearchParams(initData);
        const userJson = params.get('user');
        if (userJson) {
          user = JSON.parse(userJson);
        }
      } catch {
        // use default demo user
      }
    }

    req.telegramUser = user;
  }

  // Ensure user exists in database
  if (req.telegramUser) {
    try {
      await prisma.user.upsert({
        where: { telegram_id: BigInt(req.telegramUser.id) },
        update: {
          first_name: req.telegramUser.first_name,
          last_name: req.telegramUser.last_name || null,
          username: req.telegramUser.username || null,
        },
        create: {
          telegram_id: BigInt(req.telegramUser.id),
          first_name: req.telegramUser.first_name,
          last_name: req.telegramUser.last_name || null,
          username: req.telegramUser.username || null,
          currency: 'USD',
          language: req.telegramUser.language_code?.toLowerCase().startsWith('ru') ? 'ru' : 'en',
        },
      });
    } catch (err) {
      console.error('Error ensuring user in DB:', err);
    }
  }

  next();
}
