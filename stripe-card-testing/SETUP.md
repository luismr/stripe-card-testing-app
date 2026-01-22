# Environment Setup Guide

## Step 1: Create `.env.local` File

Create a `.env.local` file in the **project root directory** (same level as `package.json`):

```
stripe-card-testing/
├── .env.local          ← Create this file here
├── package.json
└── src/
```

## Step 2: Add Your Stripe Keys

Copy this template into `.env.local` and replace with your actual keys:

```env
# ============================================
# PUBLIC VARIABLES (Exposed to Browser)
# ============================================
# Get from: https://dashboard.stripe.com/test/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# ============================================
# PRIVATE VARIABLES (Server-Only)
# ============================================
# Secret key - NEVER expose to browser!
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Webhook secret - Get by running: stripe listen --forward-to localhost:3000/api/webhooks/stripe
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Important Notes:
- ✅ Variables starting with `NEXT_PUBLIC_` are exposed to the browser (safe for publishable keys)
- ✅ Variables WITHOUT `NEXT_PUBLIC_` are server-only (use for secret keys)
- ✅ Never put secret keys (`sk_test_...`) in `NEXT_PUBLIC_` variables!
- ✅ See `ENV_VARIABLES.md` for detailed explanation

## Getting Your Keys

1. **Publishable Key**: https://dashboard.stripe.com/test/apikeys → Copy "Publishable key"
2. **Secret Key**: Same page → Click "Reveal test key" → Copy "Secret key"
3. **Webhook Secret**: Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` → Copy the `whsec_...` value

## Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local file (use template above)

# 3. Setup Stripe CLI for webhooks (in another terminal)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. Start development server
npm run dev
```

Open http://localhost:3000 to start testing!