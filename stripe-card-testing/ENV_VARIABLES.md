# Environment Variables in Next.js

## File Location

Create a `.env.local` file in the **project root directory** (same level as `package.json`):

```
stripe-card-testing/
├── .env.local          ← Create this file here
├── package.json
├── next.config.js
└── src/
```

## Important: Variable Naming Rules

### 1. **Public Variables (Exposed to Browser)**
Variables that start with `NEXT_PUBLIC_` are exposed to the browser/client-side code:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**⚠️ Security Warning:** Never put secret keys in `NEXT_PUBLIC_` variables! These are visible in the browser.

### 2. **Server-Only Variables (Private)**
Variables WITHOUT `NEXT_PUBLIC_` prefix are only available on the server:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
```

These are **never** exposed to the browser and are safe for secrets.

## Complete `.env.local` Example

Create `.env.local` in the project root:

```env
# ============================================
# PUBLIC VARIABLES (Exposed to Browser)
# ============================================
# These are safe to expose - they're meant for client-side use
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdefghijklmnop
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# PRIVATE VARIABLES (Server-Only)
# ============================================
# These are NEVER exposed to the browser - keep them secret!
STRIPE_SECRET_KEY=sk_test_51234567890abcdefghijklmnop
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnop
```

## How to Access Variables

### In Client Components (Browser)
```typescript
// ✅ Works - NEXT_PUBLIC_ variables
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// ❌ Won't work - server-only variables are undefined
const secretKey = process.env.STRIPE_SECRET_KEY; // undefined in browser!
```

### In Server Components & API Routes
```typescript
// ✅ Works - Both public and private variables
const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const secretKey = process.env.STRIPE_SECRET_KEY; // ✅ Available here!
```

### Example from Our Code

**Client Component** (`src/components/SetupCardForm.tsx`):
```typescript
// Uses NEXT_PUBLIC_ variable - safe for browser
import { getStripe } from '@/lib/stripe';
const stripe = await getStripe(); // Uses NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

**API Route** (`src/app/api/setup-intent/route.ts`):
```typescript
// Uses private variable - only on server
import { stripe } from '@/lib/stripe';
// stripe instance uses STRIPE_SECRET_KEY (server-only)
```

## Environment File Priority

Next.js loads environment variables in this order (later files override earlier ones):

1. `.env` - Default values (commit to git)
2. `.env.local` - Local overrides (never commit to git)
3. `.env.development` - Development environment
4. `.env.production` - Production environment

**Best Practice:** Use `.env.local` for your local development secrets.

## Getting Your Stripe Keys

### 1. Publishable Key (Public)
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy the **Publishable key** (starts with `pk_test_`)
3. Add to `.env.local` as `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### 2. Secret Key (Private)
1. Same page: https://dashboard.stripe.com/test/apikeys
2. Click "Reveal test key" for the **Secret key** (starts with `sk_test_`)
3. Add to `.env.local` as `STRIPE_SECRET_KEY` (NO `NEXT_PUBLIC_` prefix!)

### 3. Webhook Secret
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copy the `whsec_...` secret from the output
4. Add to `.env.local` as `STRIPE_WEBHOOK_SECRET`

## Security Best Practices

### ✅ DO:
- ✅ Use `.env.local` for local development (already in `.gitignore`)
- ✅ Use `NEXT_PUBLIC_` prefix only for variables that MUST be in the browser
- ✅ Keep secret keys WITHOUT `NEXT_PUBLIC_` prefix
- ✅ Use different keys for test vs production
- ✅ Never commit `.env.local` to git

### ❌ DON'T:
- ❌ Put secret keys in `NEXT_PUBLIC_` variables
- ❌ Commit `.env.local` to version control
- ❌ Share your secret keys publicly
- ❌ Use production keys in development

## Verifying Your Setup

After creating `.env.local`, restart your Next.js dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

Next.js only loads environment variables on startup, so you need to restart after changes.

## Troubleshooting

### Variables are `undefined`
- ✅ Check the variable name matches exactly (case-sensitive!)
- ✅ Make sure you restarted the dev server after adding variables
- ✅ Verify the file is named `.env.local` (not `.env.local.txt`)
- ✅ Check the file is in the project root (same level as `package.json`)

### Public variable not accessible in browser
- ✅ Make sure it starts with `NEXT_PUBLIC_`
- ✅ Restart the dev server

### Secret variable accessible in browser (security issue!)
- ❌ This shouldn't happen - check you didn't add `NEXT_PUBLIC_` prefix
- ❌ Verify the variable is only used in API routes or server components

## Example `.env.local` Template

Copy this template and fill in your actual keys:

```env
# Stripe Test Mode Keys
# Get from: https://dashboard.stripe.com/test/apikeys

# Public key (safe for browser)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Secret key (server-only, never expose!)
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE

# Webhook secret (get from: stripe listen --forward-to localhost:3000/api/webhooks/stripe)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Production Deployment

For production (Vercel, Netlify, etc.):

1. **Vercel**: Add variables in Project Settings → Environment Variables
2. **Netlify**: Add in Site Settings → Environment Variables
3. **Other platforms**: Use their environment variable configuration

**Important:** Use production Stripe keys (`pk_live_...` and `sk_live_...`) in production, not test keys!