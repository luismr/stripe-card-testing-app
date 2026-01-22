'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { ApiResponse, PaymentIntentRequest, PaymentIntentResponse, FormState, CURRENCIES, PaymentMethodsResponse } from '@/types/stripe';
import { formatAmount } from '@/lib/stripe';
import Stripe from 'stripe';

interface OnSessionPaymentProps {
  customerId: string | null;
  onSuccess?: (paymentIntentId: string) => void;
}

export default function OnSessionPayment({ customerId, onSuccess }: OnSessionPaymentProps) {
  const stripe = useStripe();
  
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    success: null,
  });
  
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [amount, setAmount] = useState<string>('15.00');
  const [currency, setCurrency] = useState<string>('usd');
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);

  const loadPaymentMethods = useCallback(async () => {
    if (!customerId) return;

    setPaymentMethodsLoading(true);
    
    try {
      const response = await fetch(`/api/payment-methods?customerId=${customerId}`);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        const data = result.data as PaymentMethodsResponse;
        const methods = data.paymentMethods || [];
        setPaymentMethods(methods);
        
        // Clear any previous errors
        setFormState((prev) => ({
          ...prev,
          error: null,
        }));
        
        // Auto-select first payment method if available
        if (methods.length > 0) {
          setSelectedPaymentMethodId((prev) => prev || methods[0].id);
        } else {
          setFormState((prev) => ({
            ...prev,
            error: 'No payment methods found for this customer. Please save a card first.',
          }));
        }
      } else {
        const errorMsg = result.error || 'Failed to load payment methods';
        setFormState((prev) => ({
          ...prev,
          error: errorMsg,
        }));
      }
    } catch (err) {
      setFormState((prev) => ({
        ...prev,
        error: 'Network error while loading payment methods',
      }));
      console.error('Load payment methods error:', err);
    } finally {
      setPaymentMethodsLoading(false);
    }
  }, [customerId]);

  // Load payment methods when customer changes
  useEffect(() => {
    if (customerId) {
      // Clear previous state when customer changes
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
      setFormState({ loading: false, error: null, success: null });
      // Load payment methods for new customer
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
      setFormState({ loading: false, error: null, success: null });
    }
  }, [customerId, loadPaymentMethods]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !customerId || !selectedPaymentMethodId) {
      setFormState({
        ...formState,
        error: 'Please ensure Stripe is loaded, customer is selected, and payment method is chosen',
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
      // Create PaymentIntent with saved payment method
      const paymentIntentRequest: PaymentIntentRequest = {
        amount: amountValue,
        currency,
        customerId,
        paymentMethodId: selectedPaymentMethodId,
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
        const errorMsg = result.error || 'Failed to create PaymentIntent';
        // Provide more helpful error messages
        if (errorMsg.includes('No such customer')) {
          throw new Error(`Customer ${customerId} not found. Please select a valid customer from your Stripe account.`);
        }
        throw new Error(errorMsg);
      }

      // Handle different payment statuses
      if (result.data.status === 'succeeded') {
        // Payment already succeeded (rare for on-session)
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

      if (result.data.status === 'requires_confirmation' && result.data.clientSecret) {
        // Confirm the payment
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          result.data.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message || 'Payment confirmation failed');
        }

        if (paymentIntent?.status === 'succeeded') {
          setFormState({
            loading: false,
            error: null,
            success: `On-session payment succeeded! Amount: ${formatAmount(amountValue * 100, currency)}`,
          });

          // Reset form
          setAmount('15.00');

          if (onSuccess) {
            onSuccess(paymentIntent.id);
          }
        } else {
          throw new Error(`Unexpected payment status: ${paymentIntent?.status}`);
        }
      } else if (result.data.requiresAction && result.data.clientSecret) {
        // Handle 3DS or other authentication
        const { error: authError, paymentIntent } = await stripe.confirmCardPayment(
          result.data.clientSecret
        );

        if (authError) {
          throw new Error(authError.message || 'Authentication failed');
        }

        if (paymentIntent?.status === 'succeeded') {
          setFormState({
            loading: false,
            error: null,
            success: `Payment succeeded after authentication! Amount: ${formatAmount(amountValue * 100, currency)}`,
          });

          setAmount('15.00');

          if (onSuccess) {
            onSuccess(paymentIntent.id);
          }
        } else {
          throw new Error(`Authentication completed but payment status: ${paymentIntent?.status}`);
        }
      } else {
        throw new Error(`Unexpected PaymentIntent state: ${result.data.status}`);
      }
    } catch (error) {
      console.error('On-session payment error:', error);
      setFormState({
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: null,
      });
    }
  };

  const getCardBrandIcon = (brand: string) => {
    const brandIcons: Record<string, string> = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳',
      diners: '💳',
      jcb: '💳',
      unionpay: '💳',
      unknown: '❓',
    };
    return brandIcons[brand] || '💳';
  };

  if (!customerId) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          On-Session Payment (Customer Present)
        </h3>
        <div className="status-info">
          Please select a customer first to make an on-session payment.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        On-Session Payment (Customer Present)
      </h3>

      <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
        <p className="text-sm text-indigo-800 dark:text-indigo-200">
          <strong>On-Session Payment:</strong> Customer is present and can complete authentication if required (3DS, etc.).
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

      {paymentMethodsLoading ? (
        <div className="status-info mb-4">
          Loading saved payment methods...
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="status-info mb-4">
          No saved payment methods found. Please save a card first using the forms above.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <label className="form-label">
              Select Saved Payment Method
            </label>
            <div className="space-y-2">
              {paymentMethods.map((pm) => (
                <label
                  key={pm.id}
                  className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={pm.id}
                    checked={selectedPaymentMethodId === pm.id}
                    onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                    className="mr-3"
                  />
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {getCardBrandIcon(pm.card?.brand || 'unknown')}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pm.card?.brand?.toUpperCase()} •••• {pm.card?.last4}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Expires {pm.card?.exp_month?.toString().padStart(2, '0')}/{pm.card?.exp_year}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

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
                placeholder="15.00"
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!stripe || formState.loading || !selectedPaymentMethodId}
            className="btn-primary w-full"
          >
            {formState.loading 
              ? 'Processing Payment...' 
              : `Pay ${formatAmount(parseFloat(amount || '0') * 100, currency)}`
            }
          </button>
        </form>
      )}

      {/* Refresh Payment Methods */}
      <div className="mt-4">
        <button
          onClick={loadPaymentMethods}
          disabled={paymentMethodsLoading}
          className="btn-secondary w-full text-sm"
        >
          {paymentMethodsLoading ? 'Refreshing...' : 'Refresh Payment Methods'}
        </button>
      </div>

      {/* Information */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h4 className="text-sm font-medium mb-2 text-gray-900 dark:text-white">
          On-Session Payment Flow
        </h4>
        <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <li>• Customer is actively present during payment</li>
          <li>• Can handle 3DS authentication in real-time</li>
          <li>• Uses previously saved payment methods</li>
          <li>• Ideal for checkout/purchase scenarios</li>
        </ul>
      </div>
    </div>
  );
}