# Stripe Card on File Testing Application

A comprehensive Next.js application for testing Stripe's Card on File functionality, including SetupIntents, PaymentIntents, and various payment scenarios.

## Features

- **SetupIntent Flow**: Save cards without charging
- **PaymentIntent + setup_future_usage**: Pay and save cards simultaneously
- **On-Session Payments**: Customer present payments with saved cards
- **Off-Session Payments**: Automated billing simulation
- **Card Management**: View, set default, and remove saved payment methods
- **Webhook Integration**: Real-time event handling
- **Customer Management**: Create and manage test customers

## Setup

1. **Clone and Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env.local` file in the project root with your Stripe test keys.
   
   **📖 See [ENV_VARIABLES.md](./ENV_VARIABLES.md) for detailed instructions on where and how to set up environment variables.**
   
   Quick template:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
   STRIPE_SECRET_KEY=sk_test_your_key_here
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   
   **Important:** 
   - File location: Project root (same level as `package.json`)
   - Variables with `NEXT_PUBLIC_` prefix are exposed to browser
   - Variables without prefix are server-only (use for secrets!)

3. **Setup Stripe CLI** (for webhooks):
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the webhook secret that appears and add it to your `.env.local`.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Open the Application**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Test Card Numbers

Use these test card numbers from Stripe:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3DS Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`
- **Expired Card**: `4000 0000 0000 0069`

Use any future expiration date and any 3-4 digit CVC.

## Application Structure

### Frontend Components
- `SetupCardForm.tsx` - Card saving without payment
- `PaymentForm.tsx` - Payment with card saving option
- `SavedCardsList.tsx` - Display and manage saved cards
- `OnSessionPayment.tsx` - Pay with saved cards (customer present)
- `OffSessionPayment.tsx` - Simulate automated billing
- `CustomerSelector.tsx` - Customer management interface

### API Routes
- `/api/setup-intent` - Create SetupIntent for card saving
- `/api/payment-intent` - Create PaymentIntent for payments
- `/api/customers` - Customer creation and retrieval
- `/api/payment-methods` - Saved payment method management
- `/api/webhooks/stripe` - Stripe webhook event handler

### Data Storage
Test data is stored locally in JSON files in the `data/` directory:
- `customers.json` - Customer information
- `payment-methods.json` - Saved payment method details

## Stripe Flows Tested

### 1. Card Saving (SetupIntent)
Perfect for "Add card to wallet" scenarios:
1. Create SetupIntent with customer
2. Confirm on frontend with card details
3. Handle 3DS authentication if required
4. Store payment_method_id on success

### 2. Pay + Save (PaymentIntent + setup_future_usage)
Ideal for checkout with "Save card" option:
1. Create PaymentIntent with `setup_future_usage: 'off_session'`
2. Confirm payment on frontend
3. Card is automatically saved for future use

### 3. On-Session Payment
Customer present payment with saved card:
1. Select saved payment method
2. Create new PaymentIntent with payment_method_id
3. Confirm payment (may require 3DS)

### 4. Off-Session Payment
Automated billing simulation:
1. Create PaymentIntent with `off_session: true`
2. Attempt automatic confirmation
3. Handle authentication_required scenarios

## Webhook Events

The application handles these Stripe webhook events:
- `setup_intent.succeeded` - Card successfully saved
- `payment_intent.succeeded` - Payment completed
- `payment_method.attached` - Card attached to customer

## Development Tips

1. **Monitor Stripe Dashboard**: Keep the Stripe test dashboard open to see real-time events
2. **Check Webhook Logs**: Use `stripe logs tail` to see webhook delivery
3. **Test Different Scenarios**: Use various test card numbers to simulate different outcomes
4. **Inspect Network Traffic**: Use browser dev tools to see API calls and responses

## Troubleshooting

- **Webhook not working**: Ensure Stripe CLI is running and forwarding to correct URL
- **API errors**: Check that environment variables are set correctly
- **3DS not triggering**: Use the specific 3DS test card number `4000 0025 0000 3155`
- **Payment failing**: Verify you're using test mode keys and test card numbers

## Learn More

- [Stripe Card on File Documentation](https://stripe.com/docs/payments/save-and-reuse)
- [SetupIntents API](https://stripe.com/docs/api/setup_intents)
- [PaymentIntents API](https://stripe.com/docs/api/payment_intents)
- [Payment Methods API](https://stripe.com/docs/api/payment_methods)