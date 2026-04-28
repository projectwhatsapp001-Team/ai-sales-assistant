<<<<<<< HEAD

# AI Sales Assistant (SaaS)

This is a full-stack AI-powered sales automation tool for WhatsApp, designed to help SMEs manage orders and customer inquiries.

## The Team

- **Macee (Lead):** Product Architecture & Frontend Lead

## 🛠 Tech Stack

- **Frontend:** React.js + Tailwind CSS
- **Backend:** Node.js + Express
- **Database:** Supabase
- **AI:** OpenAI API (GPT-4o)

## Project Structure

- `/client`: React Frontend (Lead: Macee/...)
- `/server`: Node.js Backend (...)
- `/docs`: Design assets, Figma links, and meeting notes.

## Development Rules (The "Code of Conduct")

1. **Branching:** NEVER push directly to the `main` branch. Create a branch for your feature (e.g., `feature/login-ui` or `fix/api-bug`).
2. **Pull Requests:** All code must be merged via a Pull Request (PR). Macee or Eli must review code before merging.
3. **Secrets:** Never upload `.env` files. If you add an API key, message the Lead to update the team's secrets.
4. **Commits:** Use clear commit messages (e.g., "Added: WhatsApp webhook logic" instead of "update").
5. **Sync:** Daily updates in the WhatsApp group by 8:00 PM.

# SalesBot — Betty AI Sales Assistant

A full-stack WhatsApp AI sales assistant. Betty auto-replies to customer messages, logs orders, sends follow-ups, and alerts you when a human needs to step in.

---

## What's Fixed & Added

### Bugs Fixed

| File                              | Fix                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `backend/supabase.js`             | **Created** — was missing, breaking stream.js + webhook.js                         |
| `backend/routes/conversations.js` | Added `/thread/:customerId` endpoint for SSE streaming                             |
| `ConversationsPage.jsx`           | Full SSE streaming implemented with typing bubble                                  |
| `Sidebar.jsx`                     | Business name now dynamic from DB; badge counts are live                           |
| `TopBar.jsx`                      | Bell now opens notification panel; search input works                              |
| `SettingsPage.jsx`                | Save buttons now write to Supabase via API                                         |
| `App.jsx`                         | Loads business name from profiles; ErrorBoundary added                             |
| `index.html`                      | favicon.svg added                                                                  |
| `docs/schema.sql`                 | Added `needs_human`, billing fields, typing_indicators table, auto-profile trigger |

### New Features

- **Payment gateway** — Paystack monthly subscriptions (Starter GH₵99/mo, Pro GH₵249/mo)
- **3-day free trial** — starts automatically on signup via DB trigger
- **BillingPage.jsx** — plan cards, trial countdown, Paystack checkout
- **ErrorBoundary** — catches React crashes with a clean error screen
- **Badge counts** — sidebar shows live unread/pending counts
- **Notification panel** — bell icon opens real notification list

---

## Quick Start

### 1. Clone & install

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 2. Set up environment

```bash
cp .env.example .env
# Fill in your values (Supabase, OpenAI, WhatsApp, Paystack)
```

### 3. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run `docs/schema.sql`
3. Copy your **Project URL** and **anon key** into `.env`
4. Copy your **service role key** into backend `.env`

### 4. Run the app

```bash
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend && node server.js
```

---

## Payment Setup (Paystack)

1. Create account at [paystack.com](https://paystack.com)
2. Go to **Settings → API Keys** → copy your **Secret Key**
3. Add to backend `.env` as `PAYSTACK_SECRET_KEY`
4. In Paystack dashboard, go to **Settings → Webhooks**
5. Add webhook URL: `https://yourdomain.com/api/billing/webhook`
6. Select events: `charge.success`, `subscription.create`, `subscription.disable`, `invoice.payment_failed`

The 3-day free trial starts automatically when a user signs up. After the trial, they're redirected to `/billing` to subscribe.

---

## WhatsApp Setup (Meta)

1. Create a Meta Developer app at [developers.facebook.com](https://developers.facebook.com)
2. Add WhatsApp Business product
3. Get your **Phone Number ID** and **Access Token**
4. Set webhook URL: `https://yourdomain.com/api/webhook`
5. Set **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN` env variable
6. Subscribe to `messages` webhook field

---

## Project Structure

```
salesbot/
├── src/
│   ├── App.jsx                    # Root — auth, profile, error boundary
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx        # Dynamic business name + live badges
│   │   │   └── TopBar.jsx         # Search + notification panel
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── OverviewPage.jsx
│   │       ├── ConversationsPage.jsx  # SSE streaming typing bubble
│   │       ├── OrdersPage.jsx
│   │       ├── FollowUpPage.jsx
│   │       ├── AnalyticsPage.jsx
│   │       ├── SettingsPage.jsx   # Saves to Supabase
│   │       └── BillingPage.jsx    # Paystack subscriptions
│   ├── hooks/
│   │   └── useAuth.js
│   └── lib/
│       ├── supabase.js
│       └── api.js
├── backend/
│   ├── server.js                  # Express app entry point
│   ├── supabase.js                # Shared Supabase client (was missing)
│   └── routes/
│       ├── conversations.js       # + /thread/:customerId endpoint
│       ├── orders.js
│       ├── followups.js
│       ├── settings.js            # AI settings + profile save
│       ├── billing.js             # Paystack subscriptions
│       ├── stream.js              # SSE streaming endpoint
│       └── webhook.js             # WhatsApp webhook handler
├── docs/
│   └── schema.sql                 # Full Supabase schema (run this first)
├── public/
│   └── favicon.svg
├── index.html
└── .env.example
```

---

## How SSE Streaming Works

1. User types a message in **ConversationsPage**
2. Frontend appends the customer message to the thread
3. Frontend opens `EventSource` to `GET /api/stream?message=...&customerId=...`
4. Backend opens SSE connection, shows typing indicator
5. OpenAI streams tokens back one by one
6. Each token fires a `token` event → frontend appends to streaming bubble
7. When done, fires `done` event → bubble becomes permanent message
8. Full reply saved to Supabase
"# Deploy" 
