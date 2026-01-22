'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { ApiResponse, PaymentIntentRequest, PaymentIntentResponse, FormState, CURRENCIES } from '@/types/stripe';
import { TEST_CARDS, formatAmount } from '@/lib/stripe';
import { getStripeErrorMessage, formatApiError, logError } from '@/lib/errors';

interface PaymentFormProps {
  customerId: string | null;
  onSuccess?: (paymentIntentId: string, paymentMethodId?: string) => void;
}

export default function PaymentForm({ customerId, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    success: null,
  });
  
  const [amount, setAmount] = useState<string>('10.00');
  const [currency, setCurrency] = useState<string>('usd');
  const [saveCard, setSaveCard] = useState<boolean>(true);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      setFormState({
        ...formState,
        error: 'Stripe not loaded',
      });
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setFormState({
        ...formState,
        error: 'Card element not found',
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setFormState({
        ...formState,
        error: 'Please enter a valid amount',
      });
      return;
    }

    setFormState({
      loading: true,
      error: null,
      success: null,
    });

    try {
      // Create PaymentIntent on the backend
      const paymentIntentRequest: PaymentIntentRequest = {
        amount: amountValue,
        currency,
        customerId: saveCard ? customerId : undefined, // Only add customer if saving card
        saveCard: saveCard && !!customerId, // Only save if customer is selected
      };

      const response = await fetch('/api/payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentIntentRequest),
      });

      const result: ApiResponse<PaymentIntentResponse> = await response.json();

      if (!result.success || !result.data) {
        const errorMessage = formatApiError(result.error);
        logError(new Error(errorMessage), 'PaymentIntent creation');
        throw new Error(errorMessage);
      }

      // If payment is already succeeded (shouldn't happen with new card)
      if (result.data.status === 'succeeded') {
        setFormState({
          loading: false,
          error: null,
          success: `Payment succeeded! Amount: ${formatAmount(amountValue * 100, currency)}`,
        });
        
        if (onSuccess) {
          onSuccess(result.data.paymentIntentId);
        }
        return;
      }

      // Confirm PaymentIntent with Stripe
      if (!result.data.clientSecret) {
        throw new Error('No client secret received');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        result.data.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: 'Test Customer',
            },
          },
        }
      );

      if (confirmError) {
        const errorMessage = getStripeErrorMessage(confirmError);
        logError(confirmError, 'PaymentIntent confirmation');
        throw new Error(errorMessage);
      }

      if (paymentIntent?.status === 'succeeded') {
        const successMessage = saveCard && customerId 
          ? `Payment succeeded and card saved! Amount: ${formatAmount(amountValue * 100, currency)}`
          : `Payment succeeded! Amount: ${formatAmount(amountValue * 100, currency)}`;
        
        setFormState({
          loading: false,
          error: null,
          success: successMessage,
        });

        // Clear the card element
        cardElement.clear();
        setAmount('10.00');

        // Extract payment method ID if card was saved
        const paymentMethodId = typeof paymentIntent.payment_method === 'string' 
          ? paymentIntent.payment_method 
          : paymentIntent.payment_method?.id;

        // Call success callback
        if (onSuccess) {
          onSuccess(paymentIntent.id, paymentMethodId);
        }
      } else {
        throw new Error(`Unexpected payment status: ${paymentIntent?.status}`);
      }
    } catch (error) {
      logError(error, 'PaymentForm');
      const errorMessage = error instanceof Error 
        ? error.message 
        : getStripeErrorMessage(error);
      
      setFormState({
        loading: false,
        error: errorMessage,
        success: null,
      });
    }
  };

  const fillTestCard = () => {
    setFormState({
      ...formState,
      success: `Use test card: ${TEST_CARDS.success}`,
      error: null,
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment + Save Card
        </h3>
        <button
          type="button"
          onClick={fillTestCard}
          className="btn-secondary text-sm"
        >
          Show Test Card
        </button>
      </div>

      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>PaymentIntent + setup_future_usage:</strong> Pay now and optionally save the card for future use.
        </p>
      </div>

      {/* Status Messages */}
      {formState.error && (
        <div className="status-error mb-4">
          {formState.error}
        </div>
      )}

      {formState.success && (
        <div className="status-success mb-4">
          {formState.success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount and Currency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">
              Amount
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="form-input"
              placeholder="10.00"
              required
            />
          </div>
          
          <div>
            <label className="form-label">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="form-input"
            >
              {CURRENCIES.map((curr) => (
                <option key={curr} value={curr}>
                  {curr.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Card Option */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
              className="mr-2"
              disabled={!customerId}
            />
            <span className="text-sm">
              Save card for future payments
              {!customerId && (
                <span className="text-gray-500 ml-1">(requires customer selection)</span>
              )}
            </span>
          </label>
          {saveCard && customerId && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Card will be saved using setup_future_usage: 'off_session'
            </p>
          )}
        </div>

        {/* Card Input */}
        <div>
          <label className="form-label">
            Card Details
          </label>
          <div className="p-3 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-[#2B313F]">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#7A7F8C', // Medium purple-grey for entered text
                    fontFamily: 'Inter, system-ui, sans-serif',
                    '::placeholder': {
                      color: '#8E939C', // Light medium grey for placeholder
                    },
                  },
                  invalid: {
                    color: '#ef4444',
                    iconColor: '#ef4444',
                  },
                },
                hidePostalCode: false,
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Use test card: {TEST_CARDS.success} with any future expiration and any CVC
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!stripe || formState.loading}
          className="btn-primary w-full"
        >
          {formState.loading 
            ? 'Processing...' 
            : `Pay ${formatAmount(parseFloat(amount || '0') * 100, currency)}`
          }
        </button>
      </form>

      {/* Test Card Information */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
          Test Card Numbers
        </h4>
        <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <div><strong>Success:</strong> {TEST_CARDS.success}</div>
          <div><strong>3DS Auth:</strong> {TEST_CARDS.authentication3DS}</div>
          <div><strong>Decline:</strong> {TEST_CARDS.decline}</div>
          <div><strong>Insufficient Funds:</strong> {TEST_CARDS.insufficientFunds}</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Use any future expiration date (e.g., 12/28) and any 3-4 digit CVC.
        </p>
      </div>
    </div>
  );
}