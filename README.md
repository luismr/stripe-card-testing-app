# Stripe Card Testing Application

[![Next.js](https://img.shields.io/badge/Next.js-14.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-14.14-635BFF?logo=stripe)](https://stripe.com/)
[![CI](https://github.com/luismr/stripe-card-testing-app/workflows/CI/badge.svg)](https://github.com/luismr/stripe-card-testing-app/actions)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

A comprehensive Next.js application for testing Stripe's Card on File functionality, including SetupIntents, PaymentIntents, and various payment scenarios.

## 🚀 Quick Start

### Clone the Repository

```bash
git clone git@github.com:luismr/stripe-card-testing-app.git
cd stripe-card-testing-app
```

### Install Dependencies

```bash
cd stripe-card-testing
npm install
```

### Setup Environment Variables

See [ENV_VARIABLES.md](./stripe-card-testing/ENV_VARIABLES.md) for detailed instructions.

Create a `.env.local` file in the `stripe-card-testing/` directory:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
stripe-card-testing-app/
├── README.md                    # Main project README (this file)
├── card-on-file/                # Card on File documentation
│   ├── card-on-file.md
│   └── card-on-file-sequence-*.png
├── payments/                     # Payment flow documentation
│   ├── *.mmd                    # Mermaid sequence diagrams
│   └── *.png                    # Sequence diagram images
├── stripe-card-testing/          # Main Next.js application
│   ├── src/
│   │   ├── app/                 # Next.js App Router
│   │   │   ├── api/             # API routes
│   │   │   │   ├── customers/   # Customer management endpoints
│   │   │   │   ├── payment-intent/  # Payment intent creation
│   │   │   │   ├── payment-methods/  # Payment method management
│   │   │   │   ├── setup-intent/    # Setup intent creation
│   │   │   │   └── webhooks/        # Stripe webhook handler
│   │   │   │       └── stripe/
│   │   │   ├── globals.css      # Global styles
│   │   │   ├── layout.tsx       # Root layout
│   │   │   └── page.tsx         # Main page component
│   │   ├── components/          # React components
│   │   │   ├── CustomerDropdown.tsx
│   │   │   ├── CustomerSelector.tsx
│   │   │   ├── OffSessionPayment.tsx
│   │   │   ├── OnSessionPayment.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── SavedCardsList.tsx
│   │   │   ├── SetupCardForm.tsx
│   │   │   ├── SetupModal.tsx
│   │   │   ├── TestCardsModal.tsx
│   │   │   └── WorkflowModal.tsx
│   │   ├── lib/                 # Utility libraries
│   │   │   ├── data.ts          # Local data storage (JSON files)
│   │   │   ├── errors.ts        # Error handling utilities
│   │   │   └── stripe.ts        # Stripe client configuration
│   │   └── types/               # TypeScript type definitions
│   │       └── stripe.ts        # Stripe-related types
│   ├── data/                    # Local JSON data storage (auto-created)
│   │   ├── customers.json       # Customer data
│   │   └── payment-methods.json # Payment method data
│   ├── .env.local               # Environment variables (create this)
│   ├── .gitignore
│   ├── COLOR_PALETTE.md         # Design system colors
│   ├── ENV_VARIABLES.md         # Environment variable guide
│   ├── package.json             # Dependencies and scripts
│   ├── README.md                # Application-specific README
│   ├── SETUP.md                 # Detailed setup guide
│   ├── next.config.js           # Next.js configuration
│   ├── postcss.config.js        # PostCSS configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   └── tsconfig.json            # TypeScript configuration
└── package-lock.json            # Root package lock file
```

### Key Directories

- **`src/app/api/`**: Next.js API routes for backend functionality
- **`src/components/`**: Reusable React components
- **`src/lib/`**: Utility functions and helpers
- **`src/types/`**: TypeScript type definitions
- **`data/`**: Auto-generated directory for local JSON storage (gitignored)

## 🔨 Build Instructions

### Prerequisites

- **Node.js**: Version 18.x or higher
- **npm**: Version 9.x or higher (comes with Node.js)
- **Stripe Account**: Test mode keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
- **Stripe CLI**: For webhook testing (optional but recommended)

### Development Build

1. **Install dependencies**:
   ```bash
   cd stripe-card-testing
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   # Create .env.local file
   cp .env.example .env.local  # If example exists
   # Or create manually - see ENV_VARIABLES.md
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

### Production Build

1. **Build the application**:
   ```bash
   cd stripe-card-testing
   npm run build
   ```

   This creates an optimized production build in the `.next/` directory.

2. **Start production server**:
   ```bash
   npm start
   ```

   The application will run on port 3000 by default.

### Build Output

After running `npm run build`, you'll see:
- `.next/` directory with compiled application
- Optimized JavaScript bundles
- Static assets
- Server-side rendering artifacts

### Linting

Check code quality and style:

```bash
npm run lint
```

This runs ESLint with Next.js configuration.

### Type Checking

Verify TypeScript types without building:

```bash
cd stripe-card-testing
npx tsc --noEmit
```

## 🔄 Continuous Integration (CI)

This project uses GitHub Actions to automatically build and validate every commit and pull request.

### CI Workflow

The CI pipeline runs on:
- **Push** to `main`, `master`, or `develop` branches
- **Pull Requests** targeting `main`, `master`, or `develop` branches

### What Gets Validated

1. **Code Linting**: Runs ESLint to check code quality and style
2. **Type Checking**: Validates TypeScript types without emitting files
3. **Build Verification**: Ensures the application builds successfully
4. **Multi-Node Testing**: Tests against Node.js 18.x and 20.x

### CI Status Badge

Add this badge to your README to show CI status:

```markdown
![CI](https://github.com/luismr/stripe-card-testing-app/workflows/CI/badge.svg)
```

### Viewing CI Results

- Navigate to the **Actions** tab in your GitHub repository
- Click on any workflow run to see detailed logs
- CI must pass before merging pull requests (if branch protection is enabled)

### Local CI Validation

Run the same checks locally before pushing:

```bash
cd stripe-card-testing

# Run linting
npm run lint

# Type check
npx tsc --noEmit

# Build
npm run build
```

## 🧪 Testing

### Manual Testing

This application is designed for manual testing of Stripe payment flows. Follow these steps:

#### 1. Setup Stripe Webhooks (Recommended)

For webhook testing, use Stripe CLI:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret from the output and add it to your `.env.local` file.

#### 2. Test Card Saving (SetupIntent)

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. Select a customer from the dropdown
3. Click "Save Card" tab
4. Enter test card: `4242 4242 4242 4242`
5. Fill in expiration (any future date) and CVC
6. Click "Save Card"
7. Verify card appears in "Saved Cards" list

#### 3. Test Payment + Save (PaymentIntent)

1. Select a customer
2. Click "Pay & Save" tab
3. Enter payment amount
4. Enter test card details
5. Complete payment
6. Verify card is saved automatically

#### 4. Test On-Session Payment

1. Ensure you have a saved card
2. Click "Pay with Saved Card" tab
3. Select a saved payment method
4. Enter amount and confirm payment
5. Handle 3DS if prompted (use card `4000 0025 0000 3155`)

#### 5. Test Off-Session Payment

1. Ensure you have a saved card
2. Click "Off-Session Payment" tab
3. Select a saved payment method
4. Enter amount and click "Charge"
5. Verify payment succeeds or requires authentication

#### 6. Test Card Management

1. View saved cards in the list
2. Set a card as default
3. Remove a card
4. Verify changes persist

### Test Cards

Use these Stripe test card numbers:

| Scenario | Card Number | Expected Behavior |
|----------|-------------|-------------------|
| **Success** | `4242 4242 4242 4242` | Payment succeeds |
| **Decline** | `4000 0000 0000 0002` | Payment declined |
| **3DS Required** | `4000 0025 0000 3155` | Requires 3D Secure authentication |
| **Insufficient Funds** | `4000 0000 0000 9995` | Insufficient funds error |
| **Expired Card** | `4000 0000 0000 0069` | Expired card error |

**Note**: Use any future expiration date (e.g., 12/25) and any 3-4 digit CVC.

### Monitoring Tests

1. **Stripe Dashboard**: Monitor events in real-time at [dashboard.stripe.com/test/events](https://dashboard.stripe.com/test/events)
2. **Browser Console**: Check for JavaScript errors and API responses
3. **Network Tab**: Inspect API calls and responses
4. **Webhook Logs**: Use `stripe logs tail` to see webhook deliveries

### Troubleshooting Tests

- **Webhook not firing**: Ensure Stripe CLI is running and forwarding correctly
- **API errors**: Verify environment variables are set correctly
- **3DS not triggering**: Use the specific 3DS test card `4000 0025 0000 3155`
- **Payment failing**: Confirm you're using test mode keys and test cards
- **Data not persisting**: Check that `data/` directory exists and is writable

## 📚 Documentation

- **[Setup Guide](./stripe-card-testing/SETUP.md)** - Detailed setup instructions
- **[Environment Variables](./stripe-card-testing/ENV_VARIABLES.md)** - Configuration guide
- **[Card on File Documentation](./card-on-file/card-on-file.md)** - Card on File flow documentation
- **[Color Palette](./stripe-card-testing/COLOR_PALETTE.md)** - Design system colors
- **[Application README](./stripe-card-testing/README.md)** - Detailed application documentation

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Fork and Clone

1. **Fork the repository**:
   - Click the "Fork" button on GitHub
   - This creates a copy of the repository in your GitHub account

2. **Clone your fork**:
   ```bash
   git clone git@github.com:YOUR_USERNAME/stripe-card-testing-app.git
   cd stripe-card-testing-app
   ```

3. **Add upstream remote** (optional, for keeping your fork updated):
   ```bash
   git remote add upstream git@github.com:luismr/stripe-card-testing-app.git
   git remote -v
   ```

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

3. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Submitting a Pull Request

1. **Navigate to the original repository** on GitHub
2. **Click "New Pull Request"**
3. **Select "compare across forks"**
4. **Choose your fork and branch** as the source
5. **Fill out the pull request template** with:
   - Description of changes
   - Related issues (if any)
   - Screenshots (if applicable)
6. **Submit the pull request**

### Pull Request Guidelines

- Keep changes focused and atomic
- Write clear commit messages
- Update documentation if needed
- Test your changes thoroughly
- Follow the existing code style

## 🔧 Git Remote Information

To view the current git remote configuration:

```bash
git remote -v
```

Expected output:
```
origin	git@github.com:luismr/stripe-card-testing-app.git (fetch)
origin	git@github.com:luismr/stripe-card-testing-app.git (push)
```

## 📋 Features

- **SetupIntent Flow**: Save cards without charging
- **PaymentIntent + setup_future_usage**: Pay and save cards simultaneously
- **On-Session Payments**: Customer present payments with saved cards
- **Off-Session Payments**: Automated billing simulation
- **Card Management**: View, set default, and remove saved payment methods
- **Webhook Integration**: Real-time event handling
- **Customer Management**: Create and manage test customers

## 🧪 Test Cards

Use these Stripe test card numbers:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3DS Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

Use any future expiration date and any 3-4 digit CVC.

## 🛠️ Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **UI Library**: React 18
- **Payment Processing**: Stripe
- **Styling**: Tailwind CSS
- **Package Manager**: npm

## 📖 Learn More

- [Stripe Card on File Documentation](https://stripe.com/docs/payments/save-and-reuse)
- [SetupIntents API](https://stripe.com/docs/api/setup_intents)
- [PaymentIntents API](https://stripe.com/docs/api/payment_intents)
- [Payment Methods API](https://stripe.com/docs/api/payment_methods)
- [Next.js Documentation](https://nextjs.org/docs)

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Stripe](https://stripe.com/) for payment processing
- Powered by [Next.js](https://nextjs.org/) and [React](https://reactjs.org/)
