'use client';

import { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { ApiResponse, SetupIntentRequest, SetupIntentResponse, FormState } from '@/types/stripe';
import { TEST_CARDS } from '@/lib/stripe';
import { getStripeErrorMessage, formatApiError, logError } from '@/lib/errors';

interface SetupCardFormProps {
  customerId: string | null;
  onSuccess?: (paymentMethodId: string) => void;
}

export default function SetupCardForm({ customerId, onSuccess }: SetupCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    success: null,
  });
  
  const [usage, setUsage] = useState<'on_session' | 'off_session'>('off_session');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements || !customerId) {
      setFormState({
        ...formState,
        error: 'Stripe not loaded or no customer selected',
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

    setFormState({
      loading: true,
      error: null,
      success: null,
    });

    try {
      // Create SetupIntent on the backend
      const setupIntentRequest: SetupIntentRequest = {
        customerId,
        usage,
      };

      const response = await fetch('/api/setup-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(setupIntentRequest),
      });

      const result: ApiResponse<SetupIntentResponse> = await response.json();

      if (!result.success || !result.data) {
        const errorMessage = formatApiError(result.error);
        logError(new Error(errorMessage), 'SetupIntent creation');
        throw new Error(errorMessage);
      }

      // Confirm SetupIntent with Stripe
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(
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
        logError(confirmError, 'SetupIntent confirmation');
        throw new Error(errorMessage);
      }

      if (setupIntent?.status === 'succeeded') {
        const paymentMethodId = setupIntent.payment_method as string;
        
        setFormState({
          loading: false,
          error: null,
          success: `Card saved successfully! Payment Method ID: ${paymentMethodId}`,
        });

        // Clear the card element
        cardElement.clear();

        // Call success callback
        if (onSuccess) {
          onSuccess(paymentMethodId);
        }
      } else {
        throw new Error(`Unexpected SetupIntent status: ${setupIntent?.status}`);
      }
    } catch (error) {
      logError(error, 'SetupCardForm');
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
    const cardElement = elements?.getElement(CardElement);
    if (cardElement) {
      // Note: In a real app, you'd handle this differently since CardElement doesn't support programmatic filling
      // This is just for demonstration - users will need to manually enter test card numbers
      setFormState({
        ...formState,
        success: `Use test card: ${TEST_CARDS.success}`,
        error: null,
      });
    }
  };

  if (!customerId) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Save Card (SetupIntent)
        </h3>
        <div className="status-info">
          Please select a customer first to save a card.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Save Card (SetupIntent)
        </h3>
        <button
          type="button"
          onClick={fillTestCard}
          className="btn-secondary text-sm"
        >
          Show Test Card
        </button>
      </div>

      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>SetupIntent Flow:</strong> Save a card without charging it. Perfect for "Add card to wallet" scenarios.
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
        {/* Usage Selection */}
        <div>
          <label className="form-label">
            Usage Type
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="usage"
                value="off_session"
                checked={usage === 'off_session'}
                onChange={(e) => setUsage(e.target.value as 'off_session')}
                className="mr-2"
              />
              <span className="text-sm">
                Off Session (for subscriptions/future automated payments)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="usage"
                value="on_session"
                checked={usage === 'on_session'}
                onChange={(e) => setUsage(e.target.value as 'on_session')}
                className="mr-2"
              />
              <span className="text-sm">
                On Session (customer must be present for future use)
              </span>
            </label>
          </div>
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
          {formState.loading ? 'Saving Card...' : 'Save Card'}
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
          <div><strong>Expired:</strong> {TEST_CARDS.expiredCard}</div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Use any future expiration date (e.g., 12/28) and any 3-4 digit CVC.
        </p>
      </div>
    </div>
  );
}