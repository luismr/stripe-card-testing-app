import { loadStripe, Stripe } from '@stripe/stripe-js';
import StripeBackend from 'stripe';

// Frontend Stripe instance
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined');
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  
  return stripePromise;
};

// Backend Stripe instance
export const stripe = new StripeBackend(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  appInfo: {
    name: 'Stripe Card Testing App',
    version: '1.0.0',
  },
});

// Webhook signature verification
export const constructWebhookEvent = (
  body: Buffer,
  signature: string,
  secret: string
) => {
  return stripe.webhooks.constructEvent(body, signature, secret);
};

// Helper function to format currency amounts
export const formatAmount = (amount: number, currency = 'usd'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Test card numbers for different scenarios
export const TEST_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficientFunds: '4000000000009995',
  authentication3DS: '4000002500003155',
  authenticationRequired: '4000002760003184',
  expiredCard: '4000000000000069',
  incorrectCVC: '4000000000000127',
  processingError: '4000000000000119',
};

// Stripe Elements appearance configuration
// Supports both light and dark modes
export const ELEMENTS_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorPrimary: '#2563eb',
    colorBackground: 'transparent', // Use transparent to inherit from parent
    colorText: '#E0E0E0', // Light grey text for dark mode
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '6px',
    // Dark mode specific colors
    colorTextSecondary: '#8E939C', // Placeholder text color
    colorTextPlaceholder: '#8E939C',
  },
  rules: {
    '.Input': {
      backgroundColor: '#2B313F', // Dark blue-grey input background
      border: '1px solid #D0D0D0', // Light grey border
      color: '#7A7F8C', // Medium purple-grey for entered text
      boxShadow: 'none',
      padding: '12px',
      fontSize: '16px',
    },
    '.Input:focus': {
      border: '1px solid #2563eb', // Blue focus border
      boxShadow: '0 0 0 1px #2563eb',
      backgroundColor: '#2B313F',
    },
    '.Input::placeholder': {
      color: '#8E939C', // Light medium grey for placeholder
    },
    '.Input--invalid': {
      border: '1px solid #ef4444',
      color: '#9e2146',
    },
    '.Label': {
      fontWeight: '500',
      fontSize: '14px',
      marginBottom: '8px',
      color: '#E0E0E0', // Light grey label text
    },
    '.Error': {
      color: '#ef4444',
      fontSize: '13px',
    },
  },
};