# Vault — Telegram Mini App (TMA) Master Project Specification & AI Context

> **Document Version**: 2.0.0 (Dual-Theme Liquid Glass & TMA Production Edition)  
> **Target Audience**: AI Coding Assistants, Senior Full-Stack Engineers, Telegram WebApp Developers  
> **App Name**: **Vault — Personal Finance Tracker**

---

## 1. Executive Summary & Product Vision

**Vault** is a production-grade **Personal Finance Tracker** built natively as a **Telegram Mini App (TMA / TWA)**. It provides lightning-fast expense and income logging, category distribution charts, monthly cash flow projections, hashtag organization, and ledger search—packaged inside a high-end **Fintech Liquid Glassmorphic** UI that rivals Revolut, Cash App, and YNAB.

### Core Product Principles:
1. **Zero Friction Logging**: Users can log an expense in under 5 seconds with an ergonomic tactile numpad, smart category grid, and auto-suggested hashtags.
2. **Dual-Theme Liquid Glassmorphism**:
   - **"Obsidian Frost" (Dark Mode)**: Deep space canvas (`#080A0F`), frosted acrylic panels (`bg-zinc-900/60`), neon emerald/rose accents, subtle border glow.
   - **"Crystal Porcelain" (Light Mode)**: Off-white canvas (`#F4F6F9`), high-contrast frosted white glass (`bg-white/80`), deep slate typography (`#0F172A`), zero washed-out elements.
   - **"System"**: Dynamically synchronizes with the host Telegram client's color scheme and theme parameters.
3. **Telegram Native Ergonomics**:
   - Full-viewport expansion (`window.Telegram.WebApp.expand()`).
   - Telegram haptic feedback on all interactions (numpad taps, tab switches, transaction deletions, success events).
   - Native Telegram `BackButton` binding on modal screens and sheets.
   - Native header and background color synchronization via `tg.setHeaderColor` and `tg.setBackgroundColor`.
   - iOS Safe Area handling via CSS environment variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
4. **Seamless Hybrid Persistence**:
   - Operates with an **Express + Prisma + SQLite** backend secured with **Telegram HMAC-SHA256 `initData` cryptographic signature verification**.
   - Includes **instant client-side optimistic updates** and local caching (`localStorage`) to guarantee instant responsiveness even in offline or slow-network scenarios.

---

## 2. Tech Stack & Dependencies

### Frontend (`client/`)
- **Runtime & Framework**: React 19, TypeScript 5.7, Vite 8.3
- **Styling**: Tailwind CSS 3.4, Vanilla CSS variables, Glassmorphism utilities (`backdrop-blur-xl`, `backdrop-filter`)
- **State Management**: Zustand 5.0 (decentralized domain stores)
- **Data Visualization**: Recharts 2.15 (Pie/Donut charts, vertical SVG gradient Bar charts, Area spending curves)
- **Icons**: Lucide React (`lucide-react`)
- **Delight & Animations**: `canvas-confetti` (for milestones and achievements), Tailwind `animate-in` transitions
- **Telegram SDK**: Native `window.Telegram.WebApp` injected via `https://telegram.org/js/telegram-web-app.js`

### Backend (`server/`)
- **Runtime**: Node.js 18+ (utilizing native `fetch` and `crypto`)
- **Web Framework**: Express 4.21
- **Database & ORM**: SQLite (`prisma/dev.db`) managed via Prisma ORM 6.4
- **TypeScript Runner**: `tsx` (zero-compile dev workflow & seed execution)
- **Security & Cryptography**: Node.js native `crypto` module (HMAC-SHA256 signature verification)
- **CORS**: `cors` package configured for development and external tunnel origins

---

## 3. Repository Architecture & Directory Map

```
Expense tracker/
├── package.json                   # Root package: concurrently runs server & client
├── README.md                      # High-level overview
├── VAULT_TMA_PROJECT_CONTEXT.md   # [THIS FILE] Master specification for AI & Engineers
│
├── client/                        # Frontend Vite + React application
│   ├── index.html                 # HTML shell, loads Google Fonts & telegram-web-app.js
│   ├── vite.config.ts             # Vite config: proxy /api -> :3001, allowedHosts: true
│   ├── tailwind.config.js         # Fintech color tokens, dark mode class, border radii
│   ├── src/
│   │   ├── main.tsx               # React DOM bootstrap
│   │   ├── App.tsx                # App shell, Tab router, overlay router, Theme provider
│   │   ├── index.css              # Glassmorphic utility classes, CSS variables, resets
│   │   │
│   │   ├── context/
│   │   │   └── TelegramContext.tsx # Master Telegram WebApp bridge, haptics, theme engine
│   │   │
│   │   ├── types/
│   │   │   ├── models.ts          # Core domain models (Transaction, Category, Filters)
│   │   │   └── telegram.ts        # Comprehensive Telegram WebApp TypeScript definitions
│   │   │
│   │   ├── stores/                # Zustand Domain Stores
│   │   │   ├── transactionStore.ts # Transactions CRUD, period filters, hashtag suggestions
│   │   │   ├── categoryStore.ts    # 19 default categories + custom user categories
│   │   │   ├── settingsStore.ts    # Currencies (USD, KZT, EUR, etc.), balance, wipe data
│   │   │   └── uiStore.ts          # Active tabs, modal sheet visibility, search state
│   │   │
│   │   ├── components/
│   │   │   ├── Navigation/
│   │   │   │   ├── BottomNav.tsx   # 4-item dock (Vault, History, [+] Center FAB, Analytics)
│   │   │   │   └── TabBar.tsx      # Legacy alias / container for BottomNav
│   │   │   ├── Header/
│   │   │   │   └── Header.tsx      # User badge, currency selector pill, Settings gear icon
│   │   │   ├── Dashboard/
│   │   │   │   ├── TotalNetBalance.tsx # Hero card: balance, savings rate, paired split buttons
│   │   │   │   ├── SpendingBreakdown.tsx # Squircle category icons & HD slim progress bars
│   │   │   │   └── RecentTransactionsWidget.tsx # Recent ledger with hashtag pills & micro-icons
│   │   │   ├── ExpenseLogging/
│   │   │   │   ├── AddTransactionScreen.tsx # Fullscreen logger with numpad & category picker
│   │   │   │   ├── Numpad.tsx      # Tactile custom numpad with calculation preview
│   │   │   │   ├── CategorySelector.tsx # Type-filtered category grid
│   │   │   │   └── HashtagSelector.tsx  # Quick-select suggested hashtag pills
│   │   │   ├── History/
│   │   │   │   ├── SearchAndFilterBar.tsx # Segmented control, period buttons, date range inputs
│   │   │   │   ├── TransactionFeed.tsx    # Chronological feed grouped by day
│   │   │   │   └── TransactionDetailSheet.tsx # Tap-to-inspect bottom sheet with edit & delete
│   │   │   ├── Analytics/
│   │   │   │   └── AnalyticsView.tsx # 4 sub-views: Breakdown, Cash Flow, Trend, Insights
│   │   │   ├── Settings/
│   │   │   │   ├── SettingsModal.tsx  # Glassmorphic bottom sheet (theme, currency, hashtags)
│   │   │   │   └── SettingsScreen.tsx # Standalone settings view
│   │   │   ├── CategoryManagement/
│   │   │   │   └── CategoryManagementScreen.tsx # Add category, icon picker, safe reassignment
│   │   │   └── glass/             # Design System Components
│   │   │       ├── GlassCard.tsx
│   │   │       ├── GlassButton.tsx
│   │   │       ├── GlassBadge.tsx
│   │   │       └── BackgroundMesh.tsx
│   │   │
│   │   └── utils/
│   │       ├── api.ts             # Typed fetch wrapper with x-telegram-init-data injection
│   │       └── export.ts          # CSV and JSON client-side data exporters
│   │
│   └── public/                    # Static assets
│
└── server/                        # Backend Express API & Database
    ├── .env                       # Active environment configuration
    ├── .env.example               # Template environment configuration
    ├── prisma/
    │   ├── schema.prisma          # Database schema (User, Category, Transaction, HashtagUsage)
    │   ├── seed.ts                # Seed script with 19 standard categories
    │   └── dev.db                 # SQLite database file
    └── src/
        ├── index.ts               # Express entry point, middleware, routes registration
        ├── db.ts                  # Shared PrismaClient instance
        ├── auth.ts                # Telegram HMAC-SHA256 signature verification & middleware
        ├── bot.ts                 # Optional Telegram Bot runner & Menu Button auto-configurator
        └── routes/
            ├── transactions.ts    # Transaction CRUD & query filtering
            ├── categories.ts      # Category CRUD & delete reassignment
            ├── hashtags.ts        # Hashtag usage tracking, suggestions, and management
            └── analytics.ts       # Aggregation endpoints for charts and metrics
```

---

## 4. Database Schema (Prisma & SQLite)

The database is defined in `server/prisma/schema.prisma`:

### Models:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id               String         @id @default(uuid())
  telegram_id      BigInt         @unique
  first_name       String
  last_name        String?
  username         String?
  currency         String         @default("USD")
  starting_balance Float          @default(0.0)
  created_at       DateTime       @default(now())
  updated_at       DateTime       @updatedAt

  categories       Category[]
  transactions     Transaction[]
  hashtag_usages   HashtagUsage[]

  @@map("users")
}

model Category {
  id           String        @id @default(uuid())
  user_id      BigInt?       // null = global system category; set = custom user category
  name         String
  icon         String        // Lucide icon name or emoji
  color        String        // Hex color code (e.g. #10B981)
  type         String        // 'expense' | 'income'
  is_custom    Boolean       @default(false)
  created_at   DateTime      @default(now())

  user         User?         @relation(fields: [user_id], references: [telegram_id], onDelete: Cascade)
  transactions Transaction[]

  @@map("categories")
}

model Transaction {
  id             String    @id @default(uuid())
  user_id        BigInt
  category_id    String?
  type           String    // 'expense' | 'income'
  amount         Float
  note           String?
  hashtags       String?   // JSON-stringified array: '["food","lunch"]'
  payment_method String    @default("Card") // 'Card' | 'Cash'
  date           DateTime  @default(now())
  created_at     DateTime  @default(now())

  user           User      @relation(fields: [user_id], references: [telegram_id], onDelete: Cascade)
  category       Category? @relation(fields: [category_id], references: [id], onDelete: SetNull)

  @@index([user_id, date])
  @@map("transactions")
}

model HashtagUsage {
  id           String   @id @default(uuid())
  user_id      BigInt
  tag          String
  use_count    Int      @default(1)
  last_used_at DateTime @default(now())

  user         User     @relation(fields: [user_id], references: [telegram_id], onDelete: Cascade)

  @@unique([user_id, tag])
  @@index([user_id, last_used_at])
  @@map("hashtag_usages")
}
```

### Standard Seed Categories (19 Total):
- **12 Expenses**: Food & Groceries, Transport & Fuel, Dining & Cafe, Housing & Rent, Entertainment, Shopping, Health & Medical, Fitness & Sports, Education & Books, Bills & Utilities, Gifts & Charity, Investments.
- **7 Incomes**: Salary, Freelance, Business, Dividends, Crypto & Staking, Gifts Received, Other Income.

---

## 5. Telegram Mini App (TMA) Integration & Security

### 5.1 Telegram WebApp Script
Loaded in `client/index.html`:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 5.2 App Mount & Lifecycle Handlers
Handled inside `client/src/context/TelegramContext.tsx`:
```ts
const tg = window.Telegram?.WebApp;
if (tg && tg.initData !== undefined) {
  // 1. Expand to full height
  tg.expand();
  // 2. Notify Telegram that the WebApp is ready
  tg.ready();
  // 3. Sync colors with native Telegram header
  tg.setHeaderColor?.(isDark ? '#080A0F' : '#F4F6F9');
  tg.setBackgroundColor?.(isDark ? '#080A0F' : '#F4F6F9');
}
```

### 5.3 Theme Engine & CSS Variables Binding
Telegram passes `tg.themeParams`. The app maps these parameters directly to document CSS variables:
- `--tg-theme-bg-color`
- `--tg-theme-secondary-bg-color`
- `--tg-theme-text-color`
- `--tg-theme-hint-color`
- `--tg-theme-link-color`
- `--tg-theme-button-color`
- `--tg-theme-button-text-color`

Additionally, `TelegramContext` maintains three modes:
- `dark`: Forces `.dark` class on `<html>` (Obsidian Frost theme).
- `light`: Removes `.dark` class (Crystal Porcelain theme).
- `system`: Auto-evaluates `tg.colorScheme` or `prefers-color-scheme` media query, responding dynamically to Telegram client theme switches (`tg.onEvent('themeChanged')`).

### 5.4 Cryptographic Authentication (HMAC-SHA256)
All client requests send the raw Telegram `initData` string in the `x-telegram-init-data` HTTP header.
On the backend (`server/src/auth.ts`), incoming requests pass through `telegramAuthMiddleware`:

```ts
/**
 * Official Telegram HMAC-SHA256 Signature Verification Algorithm:
 * 1. Parse query params from initData and extract 'hash'.
 * 2. Delete 'hash' from params.
 * 3. Sort remaining keys alphabetically and format as 'key=value\n'.
 * 4. secret_key = HMAC_SHA256("WebAppData", TELEGRAM_BOT_TOKEN).
 * 5. calculated_hash = HMAC_SHA256(secret_key, dataCheckString).hex().
 * 6. Match calculated_hash against the received 'hash'.
 */
export function verifyTelegramInitData(initData: string, botToken: string): TelegramUser | null;
```

**Dev / Demo Fallback Mode**:
If `TELEGRAM_BOT_TOKEN` in `server/.env` is set to `"demo_bot_token_replace_with_real"` or running in local browser tests outside Telegram, the middleware seamlessly falls back to a mock demo user (`id: 987654321, first_name: "Alex"`), allowing developers to build and test without friction.

---

## 6. Client Architecture & Zustand State Stores

The frontend state is separated into 4 dedicated Zustand stores in `client/src/stores/`:

### 1. `useTransactionStore` (`transactionStore.ts`)
- **State**:
  - `transactions: Transaction[]`
  - `hashtagSuggestions: string[]`
  - `isLoading: boolean`, `error: string | null`
- **Actions**:
  - `fetchTransactions(filters)`: Queries `/api/transactions` with query params.
  - `addTransaction(tx)`: Optimistically adds transaction, updates balance, syncs hashtags, and calls `POST /api/transactions`.
  - `updateTransaction(id, updates)`: Optimistically updates transaction and calls `PUT /api/transactions/:id`.
  - `deleteTransaction(id)`: Optimistically removes transaction and calls `DELETE /api/transactions/:id`.
  - `addHashtagSuggestion(tag)`: Saves tag to local suggestions and calls `POST /api/hashtags`.
  - `removeHashtagSuggestion(tag)`: Removes tag from local suggestions and calls `DELETE /api/hashtags/:tag`.
- **Selectors**:
  - `getCurrentBalance()`: Computes `startingBalance + sum(income) - sum(expenses)`.
  - `getTotalIncome()`, `getTotalExpenses()`.
  - `getFilteredTransactions(filters)`: Pure filtering function supporting type (`all`, `expense`, `income`), period (`today`, `week`, `month`, `last_month`), custom date range (`startDate`, `endDate`), and text search (note, hashtag, category).

### 2. `useCategoryStore` (`categoryStore.ts`)
- **State**: `categories: Category[]`, `isLoading: boolean`
- **Actions**:
  - `fetchCategories()`: Retrieves combined list of standard and custom categories.
  - `addCategory(category)`: Creates custom category via `POST /api/categories`.
  - `deleteCategory(id, reassignToId)`: Deletes category and safely reassigns existing transactions via `DELETE /api/categories/:id?reassignTo=...`.

### 3. `useSettingsStore` (`settingsStore.ts`)
- **State**:
  - `currency: string` (e.g. `'KZT'`, `'USD'`, `'EUR'`, `'RUB'`, `'GBP'`)
  - `startingBalance: number`
- **Actions**:
  - `setCurrency(code)`: Updates active currency and syncs to backend `PUT /api/user/currency`.
  - `setStartingBalance(amount)`: Updates starting balance and syncs to `PUT /api/user/starting-balance`.
  - `formatAmount(value)`: Formats number according to the selected currency symbol and positioning.
  - `wipeData()`: Triggers full account wipe via `POST /api/user/reset`.

### 4. `useUIStore` (`uiStore.ts`)
- **State**:
  - `activeTab: 'dashboard' | 'history' | 'analytics'`
  - `isAddOpen: boolean`
  - `isSettingsOpen: boolean`
  - `isManageCategoriesOpen: boolean`
  - `selectedTransactionId: string | null`
  - `activeHistoryFilter: FilterState`

---

## 7. Screen-by-Screen Specification

### 7.1 Shell & Navigation
- **Floating Bottom Nav (`BottomNav.tsx`)**:
  - Features strictly **4 items**:
    1. `Vault` (Dashboard)
    2. `History` (Ledger)
    3. `[+]` Elevated circular Add FAB (Violet-to-Indigo gradient, opens Add Transaction modal)
    4. `Analytics` (Charts & Insights)
  - Settings is intentionally **omitted** from the bottom bar to prevent dock crowding.
  - Floating pill style with `bottom-[max(1rem,env(safe-area-inset-bottom))]` for iOS gesture bar clearance.
- **Top Header (`Header.tsx`)**:
  - User avatar with Telegram verified dot and name.
  - Currency Pill (`₸ KZT`, `$ USD`) opening Settings.
  - Glassmorphic **Settings Gear Icon** (`Settings` from Lucide) with tactile active scale animation.

### 7.2 Dashboard Screen
- **Total Net Balance Hero Card (`TotalNetBalance.tsx`)**:
  - Displays formatted net balance (`starting_balance + income - expense`).
  - Savings rate badge with live pulsing indicator dot.
  - Paired split buttons: `+ Add Income` (Emerald tint) & `− Add Expense` (Rose tint).
  - Monthly metrics row: Inflow vs Outflow for current month.
- **Spending Breakdown Widget (`SpendingBreakdown.tsx`)**:
  - Squircle category icon tiles (`w-9 h-9 rounded-xl`).
  - Ultra-slim HD progress bars with category color gradient fills.
- **Recent Transactions Ledger (`RecentTransactionsWidget.tsx`)**:
  - 5 most recent records with micro-icons for payment methods (`Card` vs `Cash`) and hashtag badges (`#lunch`, `#uber`).
  - "See All" button that switches tab to History.

### 7.3 Add Transaction Flow (`AddTransactionScreen.tsx`)
- Fullscreen modal with smooth slide-up animation and Telegram BackButton binding.
- Segmented Type Switcher: `Expense` (Rose) vs `Income` (Emerald).
- Large live display with calculation expression preview.
- **Custom Tactile Numpad (`Numpad.tsx`)**:
  - Keys `1-9`, `0`, `.`, and `⌫` (backspace).
  - Basic math operator support (`+`, `-`).
  - Haptic feedback on every tap.
- **Category Grid (`CategorySelector.tsx`)**: Filtered dynamically by selected transaction type (`expense` or `income`).
- **Quick Hashtag Pills (`HashtagSelector.tsx`)**: Displays suggested hashtags with one-tap toggle.
- Date selector and Payment Method toggle (`Card` / `Cash`).

### 7.4 History Screen (`SearchAndFilterBar.tsx` & `TransactionFeed.tsx`)
- Multi-dimension filter toolbar:
  - Type capsule: `All` | `Expenses` | `Income`.
  - Period toolbar: `Day` | `Week` | `Month` | `All Time` | `Custom Range`.
  - Expandable date range inputs: `Start Date` and `End Date`.
  - Search input: matches note text, category name, or hashtags.
  - Category lock rule: when Type is `All`, category chips are locked to avoid cross-type mismatch.
- Grouped feed by date (`TODAY`, `YESTERDAY`, `SEP 20`).
- Tap any transaction to open **Transaction Detail Sheet (`TransactionDetailSheet.tsx`)** to edit details or delete with confirmation.

### 7.5 Analytics Screen (`AnalyticsView.tsx`)
- 4 sub-views:
  1. **Breakdown**: Recharts Donut Chart with dual-theme high-contrast center sum & "TOTAL" label, category slice selection, percentage rankings.
  2. **Cash Flow**:
     - Recharts Bar Chart with vertical SVG linear gradients: Emerald (`#inflowGrad`) and Rose (`#outflowGrad`).
     - Rounded bar tops (`radius={[6, 6, 0, 0]}`).
     - Compact legend with colored dots (`● Inflow`, `● Outflow`).
     - Interactive glassmorphic tooltip with Net Margin calculation.
     - Two under-chart GlassCard widgets: **"Average Savings"** and **"Monthly Burn Rate"**.
  3. **Trend**: Daily spending curve area chart with peak indicator.
  4. **Insights**: Financial health assessment, top spending category, and savings rate.
- Period toolbar (`Day`, `Week`, `Month`, `All Time`, `Custom`) dynamically recalculates all charts and metrics.

### 7.6 Settings Modal (`SettingsModal.tsx`)
- Triggered via Header gear icon or currency pill.
- **Appearance**: 3-segment switcher (`Dark`, `Light`, `System`).
- **Active Currency**: Searchable grid of global and CIS currencies (`USD`, `EUR`, `KZT`, `RUB`, `GBP`, `TRY`, etc.).
- **Category Management Trigger**: Navigates to custom categories screen.
- **Suggested Hashtags Manager**:
  - Input field `# new-tag` + `Add` button to register new quick-tags.
  - Badge list of registered hashtags with one-tap `×` delete button.
  - Synchronizes immediately with the Add Transaction quick pills.
- **Data Export**: One-tap export to formatted **CSV** or **JSON**.
- **Starting Balance Editor**: Real-time baseline balance adjustment.
- **Danger Zone**: Reset account data with double-confirmation dialog.

---

## 8. REST API Reference

All routes are prefixed with `/api` and protected by `telegramAuthMiddleware`.

| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health check | None | `{ status: "ok", timestamp }` |
| `GET` | `/api/user/profile` | Current user profile | None | `{ id, first_name, currency, starting_balance }` |
| `PUT` | `/api/user/currency` | Update display currency | `{ currency: "KZT" }` | Updated user object |
| `PUT` | `/api/user/starting-balance` | Update starting balance | `{ starting_balance: 1500.0 }` | Updated user object |
| `POST` | `/api/user/reset` | Wipe all user transactions & custom data | None | `{ success: true, message }` |
| `GET` | `/api/categories` | List system & user categories | None | `Category[]` |
| `POST` | `/api/categories` | Create custom category | `{ name, icon, color, type }` | Created `Category` |
| `DELETE` | `/api/categories/:id` | Delete category & reassign | Query `?reassignTo=<id>` | `{ success: true }` |
| `GET` | `/api/transactions` | Query transactions with filters | Query `?type=&period=&startDate=&endDate=&search=` | `Transaction[]` |
| `POST` | `/api/transactions` | Create new transaction | `{ type, amount, category_id, note, hashtags, date, payment_method }` | Created `Transaction` |
| `PUT` | `/api/transactions/:id` | Update transaction | `{ amount, category_id, note, hashtags, date, payment_method }` | Updated `Transaction` |
| `DELETE` | `/api/transactions/:id` | Delete transaction | None | `{ success: true }` |
| `GET` | `/api/hashtags/suggest` | Get user's frequent hashtags | Query `?query=&limit=15` | `string[]` (e.g. `["food", "work"]`) |
| `POST` | `/api/hashtags` | Register suggested hashtag | `{ tag: "crypto" }` | `{ tag: "crypto", id }` |
| `DELETE` | `/api/hashtags/:tag` | Delete suggested hashtag | None | `{ success: true, tag }` |
| `GET` | `/api/analytics/summary` | Aggregated finance metrics | Query `?period=month` | Summary object (income, expenses, cash flow) |

---

## 9. Local Development, HTTPS Tunneling & Bot Setup Guide

Telegram Mini Apps strictly require **HTTPS** URLs to render inside iOS, Android, and Desktop Telegram clients.

### 9.1 Local Development Workflow
Run the full stack concurrently:
```bash
# In project root:
npm run dev
# Starts server on http://localhost:3001 and Vite client on http://localhost:5173
```

### 9.2 Launching via Local HTTPS Tunnel

#### Option A: Cloudflare Tunnel (`cloudflared`) — *Recommended (No signup required)*
```bash
# Install cloudflared (Windows: winget install Cloudflare.cloudflared / Mac: brew install cloudflared)
cloudflared tunnel --url http://localhost:5173
```
Cloudflare will output a public HTTPS URL like:
`https://random-subdomain.trycloudflare.com`

#### Option B: Ngrok Tunnel
```bash
ngrok http 5173
```
Ngrok will output:
`https://your-id.ngrok-free.app`

> **Why Port 5173?**  
> Vite (`client/vite.config.ts`) has `allowedHosts: true` and proxies all `/api/*` requests directly to Express on port 3001. Tunneling port 5173 exposes both the frontend and the proxied API under a single unified HTTPS origin, preventing any mixed-content SSL errors!

---

### 9.3 Telegram BotFather Setup (2 Minutes)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Create your bot:
   - Send `/newbot`.
   - Choose a name (e.g., `My Vault Finance`).
   - Choose a username (e.g., `my_vault_finance_bot`).
   - Copy the HTTP API token into `server/.env`:
     ```env
     TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
     WEBAPP_URL="https://your-tunnel-url.trycloudflare.com"
     ```
3. Configure the Mini App Web Button:
   - In @BotFather, send `/setmenubutton`.
   - Select your bot.
   - Send the HTTPS tunnel URL (e.g., `https://your-tunnel-url.trycloudflare.com`).
   - Enter button text: `Vault Finance`.
4. *(Optional)* Create a direct Mini App link:
   - In @BotFather, send `/newapp`.
   - Link your bot and provide the WebApp HTTPS URL.
   - You will receive a direct link: `t.me/your_bot/app`.

---

### 9.4 Using the Included Helper Bot
A ready-to-run bot script is included in `server/src/bot.ts`:
```bash
# In server directory or root:
npm run bot
```
The helper bot will:
- Test your bot credentials against Telegram API (`getMe`).
- Automatically configure the Chat Menu Button to your `WEBAPP_URL`.
- Start polling and automatically reply to any user sending `/start` with an inline keyboard button opening the Mini App!

---

## 10. Engineering Rules & Best Practices for Future AI Agents

When working on this codebase, adhere strictly to these principles:
1. **Preserve Business Logic**: Never break or alter existing Zustand store actions, calculation formulas (`startingBalance + income - expense`), or filter predicates.
2. **Dual-Theme Integrity**: Every new component or text element must support both themes using Tailwind's `dark:` modifier (e.g., `text-slate-900 dark:text-white`, `bg-white/80 dark:bg-zinc-900/60`). Never use hardcoded `text-white` on glass surfaces.
3. **Safe Area Discipline**: Bottom modals and floating toolbars must respect `env(safe-area-inset-bottom)`.
4. **Vite Tunnel Compatibility**: Maintain `allowedHosts: true` in `client/vite.config.ts`.
5. **Prisma BigInt Serialization**: Telegram user IDs are 64-bit integers (`BigInt`). When sending them over JSON in Express, always convert them via `.toString()` to avoid `TypeError: Do not know how to serialize a BigInt`.
