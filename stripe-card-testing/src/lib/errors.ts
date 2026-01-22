import { StripeError } from '@stripe/stripe-js';

// Custom error types for better error handling
export class StripeAppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public type?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'StripeAppError';
  }
}

// Map Stripe errors to user-friendly messages
export function getStripeErrorMessage(error: StripeError | Error | unknown): string {
  if (!error) {
    return 'An unexpected error occurred';
  }

  // Handle Stripe.js errors
  if ('type' in error && 'code' in error) {
    const stripeError = error as StripeError;
    
    switch (stripeError.type) {
      case 'card_error':
        return getCardErrorMessage(stripeError.code || '');
      case 'validation_error':
        return `Validation error: ${stripeError.message}`;
      case 'api_error':
        return 'Stripe API error. Please try again later.';
      case 'authentication_error':
        return 'Authentication error. Please check your API keys.';
      case 'rate_limit_error':
        return 'Too many requests. Please try again in a moment.';
      default:
        return stripeError.message || 'An error occurred with your payment';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('Network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    if (error.message.includes('authentication_required')) {
      return 'This payment requires additional authentication. Please complete the verification process.';
    }
    if (error.message.includes('card_declined')) {
      return 'Your card was declined. Please try a different payment method.';
    }
    if (error.message.includes('insufficient_funds')) {
      return 'Insufficient funds. Please use a different payment method.';
    }
    if (error.message.includes('expired_card')) {
      return 'Your card has expired. Please use a different payment method.';
    }
    if (error.message.includes('incorrect_cvc')) {
      return 'Your card\'s security code is incorrect. Please check and try again.';
    }
    
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

// Get user-friendly card error messages
function getCardErrorMessage(code: string): string {
  const cardErrorMessages: Record<string, string> = {
    'card_declined': 'Your card was declined. Please try a different payment method.',
    'expired_card': 'Your card has expired. Please use a different payment method.',
    'incorrect_cvc': 'Your card\'s security code is incorrect. Please check and try again.',
    'incorrect_number': 'Your card number is incorrect. Please check and try again.',
    'insufficient_funds': 'Insufficient funds. Please use a different payment method.',
    'invalid_cvc': 'Your card\'s security code is invalid. Please check and try again.',
    'invalid_expiry_month': 'Your card\'s expiration month is invalid.',
    'invalid_expiry_year': 'Your card\'s expiration year is invalid.',
    'invalid_number': 'Your card number is invalid. Please check and try again.',
    'processing_error': 'An error occurred while processing your card. Please try again.',
    'generic_decline': 'Your card was declined. Please try a different payment method.',
    'lost_card': 'Your card was declined. Please contact your bank.',
    'stolen_card': 'Your card was declined. Please contact your bank.',
    'pickup_card': 'Your card was declined. Please contact your bank.',
    'restricted_card': 'Your card was declined. Please contact your bank.',
    'security_violation': 'Your card was declined due to a security violation.',
    'service_not_allowed': 'Your card does not support this type of purchase.',
    'stop_payment_order': 'Your card was declined. Please contact your bank.',
    'testmode_decline': 'This card was declined in test mode.',
    'withdrawal_count_limit_exceeded': 'You have exceeded your withdrawal limit.',
  };

  return cardErrorMessages[code] || 'Your card was declined. Please try a different payment method.';
}

// Format API error responses
export function formatApiError(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error?.error) {
    return typeof error.error === 'string' ? error.error : error.error.message || 'An error occurred';
  }

  if (error?.message) {
    return error.message;
  }

  return 'An unexpected error occurred';
}

// Check if error is retryable
export function isRetryableError(error: Error | StripeError | unknown): boolean {
  if (!error) return false;

  if ('type' in error) {
    const stripeError = error as StripeError;
    return stripeError.type === 'api_error' || stripeError.type === 'rate_limit_error';
  }

  if (error instanceof Error) {
    return error.message.includes('Network') || error.message.includes('timeout');
  }

  return false;
}

// Log error for debugging (in production, send to error tracking service)
export function logError(error: Error | StripeError | unknown, context?: string) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
  };

  console.error(`[${timestamp}] Error${context ? ` in ${context}` : ''}:`, errorInfo);

  // In production, you would send this to an error tracking service like Sentry
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: { context } });
  // }
}