import Stripe from 'stripe';

// Customer data structure for local storage
export interface CustomerData {
  id: string;
  email: string;
  name: string;
  created: number;
  paymentMethods: SavedPaymentMethod[];
}

// Saved payment method data
export interface SavedPaymentMethod {
  id: string;
  customerId: string;
  type: 'card';
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
  created: number;
  isDefault?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Setup Intent API request/response
export interface SetupIntentRequest {
  customerId: string;
  usage?: 'on_session' | 'off_session';
}

export interface SetupIntentResponse {
  clientSecret: string;
  setupIntentId: string;
}

// Payment Intent API request/response
export interface PaymentIntentRequest {
  customerId?: string;
  amount: number;
  currency?: string;
  paymentMethodId?: string;
  saveCard?: boolean;
  offSession?: boolean;
}

export interface PaymentIntentResponse {
  clientSecret?: string;
  paymentIntentId: string;
  status: string;
  requiresAction?: boolean;
}

// Customer API request/response
export interface CreateCustomerRequest {
  email: string;
  name: string;
  metadata?: Record<string, string>;
}

// Payment method list response
export interface PaymentMethodsResponse {
  paymentMethods: Stripe.PaymentMethod[];
  localData?: SavedPaymentMethod[];
}

// Webhook event data
export interface WebhookEventData {
  type: string;
  data: {
    object: Stripe.Event.Data.Object;
  };
  created: number;
}

// Form states for UI components
export interface FormState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

// Test scenarios
export interface TestScenario {
  id: string;
  title: string;
  description: string;
  component: string;
}

// App constants
export const CURRENCIES = ['usd', 'eur', 'gbp', 'cad', 'aud'] as const;
export type Currency = typeof CURRENCIES[number];

export const CARD_BRANDS = [
  'amex',
  'diners',
  'discover',
  'jcb',
  'mastercard',
  'unionpay',
  'visa',
  'unknown',
] as const;

export type CardBrand = typeof CARD_BRANDS[number];