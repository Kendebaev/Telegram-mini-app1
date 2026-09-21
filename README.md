# Telegram Mini App (TMA): Personal Expense Tracker

A high-performance, mobile-first Telegram Mini App for personal expense tracking built with **React 19**, **TypeScript**, **Tailwind CSS**, **Lucide React**, **Recharts**, and an **Express + Prisma SQLite/PostgreSQL** backend.

---

## 🌟 Key Features

### 1. Telegram Native Integration
- **Theme Matching:** Dynamic CSS variables (`--tg-theme-bg-color`, `--tg-theme-text-color`, `--tg-theme-button-color`, etc.) with instant Light/Dark switching.
- **Native Telegram Controls:**
  - `Telegram.WebApp.MainButton` ("Save Expense • $XX.XX").
  - `Telegram.WebApp.BackButton` for modals and subviews.
  - `Telegram.WebApp.HapticFeedback` (`impactOccurred`, `notificationOccurred`).
  - Viewport auto-expansion via `Telegram.WebApp.expand()`.
- **Browser Simulation Mode:** When tested outside of Telegram (standard desktop or mobile browser), an integrated TMA preview bar allows testing light/dark themes, simulated user profiles, and native button actions.

### 2. Fast Expense Entry (Numeric Keypad)
- Mobile-optimized numeric keypad with instant currency formatting (`$`, `€`, `₸`, `₽`, `£`, `¥`, `₺`, `د.إ`, `so'm`).
- Quick increment chips (`+5`, `+10`, `+25`, `+50`, `+100`).
- Predefined categories with icons & color highlights (Food & Dining, Transport, Groceries, Entertainment, Bills, Health, Shopping, Other).
- Payment method selection: Card, Cash, Crypto, Bank Transfer.
- Note input with quick tags and custom transaction date selector.
- Celebratory confetti feedback and inline validation.

### 3. Expense History & Dashboard
- **Top Summary Widget:** Total spent Today, This Week, and This Month with comparative trend badge (e.g. `+12% vs last mo`).
- **Visual Analytics:**
  - Interactive Recharts Donut/Pie Chart with center total and slice selection.
  - Horizontal progress bars for top categories.
  - Daily spending area trend chart over the current month.
  - Payment method distribution and key spending metrics (average daily spend, largest transaction).
- **Chronological Feed:** Grouped by day ("Today", "Yesterday", "Mon, Sep 21") with payment method badges, note search, and category/date filters.
- **Edit & Delete:** Tap-to-edit modal sheet with delete confirmation and haptic feedback.

### 4. Data Management & Settings
- Telegram user profile card (Avatar, name, username, Telegram ID).
- Currency picker supporting global and CIS currencies.
- One-click export to **CSV** and **JSON**.
- Reset demo data.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Canvas-Confetti
- **Backend:** Node.js, Express, Prisma ORM, SQLite (local zero-config) / PostgreSQL (production)
- **Security:** Telegram `initData` HMAC-SHA256 cryptographic verification using the bot token
- **Storage:** Dual sync (Backend REST API + LocalStorage / Telegram CloudStorage offline fallback)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
From the root directory:
```bash
# Install root dependencies
npm install

# Setup backend database & seed default data
npm run db:seed
```

### Running the App
Run both client and server concurrently with one command:
```bash
npm run dev
```

- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

Or run individually:
- Client only: `npm run dev:client`
- Server only: `npm run dev:server`

---

## 🤖 Connecting to a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather).
2. Create a bot using `/newbot` and obtain your **BOT_TOKEN**.
3. Create a Mini App via `/newapp` in BotFather:
   - Select your bot.
   - Set the title and description.
   - For local testing, use a tunnel like [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/pages/how-to/preview-with-cloudflare-tunnel/):
     ```bash
     ngrok http 5173
     ```
   - Provide the HTTPS tunnel URL (e.g., `https://your-domain.ngrok-free.app`) to BotFather.
4. Put your Bot Token in `server/.env`:
   ```env
   TELEGRAM_BOT_TOKEN="your_bot_token_here"
   ```
5. Open your Mini App link in Telegram (iOS, Android, or Telegram Desktop)!

---

## 🧪 Testing

Run the automated backend integration test suite (verifying HMAC validation, CRUD, and analytics):
```bash
cd server
npx tsx src/test_api.ts
```
