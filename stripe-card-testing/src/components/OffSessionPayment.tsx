'use client';

import { useState, useEffect } from 'react';
import { ApiResponse, PaymentIntentRequest, PaymentIntentResponse, FormState, CURRENCIES } from '@/types/stripe';
import { formatAmount } from '@/lib/stripe';
import Stripe from 'stripe';

interface OffSessionPaymentProps {
  customerId: string | null;
  onSuccess?: (paymentIntentId: string) => void;
}

export default function OffSessionPayment({ customerId, onSuccess }: OffSessionPaymentProps) {
  const [formState, setFormState] = useState<FormState>({
    loading: false,
    error: null,
    success: null,
  });
  
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([]);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string>('');
  const [amount, setAmount] = useState<string>('25.00');
  const [currency, setCurrency] = useState<string>('usd');
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
  const [authenticateUrl, setAuthenticateUrl] = useState<string | null>(null);

  // Load payment methods when customer changes
  useEffect(() => {
    if (customerId) {
      // Clear previous state when customer changes
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
      setFormState({ loading: false, error: null, success: null });
      setAuthenticateUrl(null);
      // Load payment methods for new customer
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
      setSelectedPaymentMethodId('');
      setFormState({ loading: false, error: null, success: null });
      setAuthenticateUrl(null);
    }
  }, [customerId]);

  const loadPaymentMethods = async () => {
    if (!customerId) return;

    setPaymentMethodsLoading(true);
    
    try {
      const response = await fetch(`/api/payment-methods?customerId=${customerId}`);
      const result: ApiResponse = await response.json();

      if (result.success) {
        const methods = result.data.paymentMethods || [];
        setPaymentMethods(methods);
        
        // Clear any previous errors
        setFormState({
          ...formState,
          error: null,
        });
        
        // Auto-select first payment method if available
        if (methods.length > 0 && !selectedPaymentMethodId) {
          setSelectedPaymentMethodId(methods[0].id);
        } else if (methods.length === 0) {
          setFormState({
            ...formState,
            error: 'No payment methods found for this customer. Please save a card first.',
          });
        }
      } else {
        const errorMsg = result.error || 'Failed to load payment methods';
        setFormState({
          ...formState,
          error: errorMsg,
        });
      }
    } catch (err) {
      setFormState({
        ...formState,
        error: 'Network error while loading payment methods',
      });
      console.error('Load payment methods error:', err);
    } finally {
      setPaymentMethodsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!customerId || !selectedPaymentMethodId) {
      setFormState({
        ...formState,
        error: 'Please ensure customer and payment method are selected',
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
    setAuthenticateUrl(null);

    try {
      // Create off-session PaymentIntent with automatic confirmation
      const paymentIntentRequest: PaymentIntentRequest = {
        amount: amountValue,
        currency,
        customerId,
        paymentMethodId: selectedPaymentMethodId,
        offSession: true, // This will set off_session=true and confirm=true
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
        
        // Handle customer not found error
        if (errorMsg.includes('No such customer')) {
          setFormState({
            loading: false,
            error: `Customer ${customerId} not found. Please select a valid customer from your Stripe account.`,
            success: null,
          });
          return;
        }
        
        // Handle authentication required error specially
        if (response.status === 402 && errorMsg.includes('authentication_required')) {
          setFormState({
            loading: false,
            error: null,
            success: null,
          });
          
          // In a real app, you'd send an email or SMS to the customer
          const mockAuthUrl = `${window.location.origin}/authenticate?payment_intent=${result.data?.paymentIntentId || 'pi_mock'}`;
          setAuthenticateUrl(mockAuthUrl);
          
          setFormState({
            loading: false,
            error: null,
            success: 'Payment requires customer authentication. In a real app, an email would be sent to the customer.',
          });
          return;
        }
        
        throw new Error(errorMsg);
      }

      // Handle different payment statuses
      if (result.data.status === 'succeeded') {
        setFormState({
          loading: false,
          error: null,
          success: `Off-session payment succeeded! Amount: ${formatAmount(amountValue * 100, currency)}`,
        });
        
        // Reset form
        setAmount('25.00');

        if (onSuccess) {
          onSuccess(result.data.paymentIntentId);
        }
      } else if (result.data.status === 'requires_action' && result.data.requiresAction) {
        // Payment requires customer authentication
        setFormState({
          loading: false,
          error: null,
          success: null,
        });
        
        // Create mock authentication URL
        const mockAuthUrl = `${window.location.origin}/authenticate?payment_intent=${result.data.paymentIntentId}`;
        setAuthenticateUrl(mockAuthUrl);
        
        setFormState({
          loading: false,
          error: null,
          success: 'Payment requires customer authentication. In a real app, the customer would receive an email with a secure link.',
        });
      } else {
        throw new Error(`Unexpected payment status: ${result.data.status}`);
      }
    } catch (error) {
      console.error('Off-session payment error:', error);
      setFormState({
        loading: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        success: null,
      });
    }
  };

  const handleRetryPayment = async () => {
    if (!selectedPaymentMethodId) return;

    setFormState({
      loading: true,
      error: null,
      success: null,
    });
    setAuthenticateUrl(null);

    // Simulate retrying the payment after some time
    setTimeout(async () => {
      try {
        const amountValue = parseFloat(amount);
        const paymentIntentRequest: PaymentIntentRequest = {
          amount: amountValue,
          currency,
          customerId,
          paymentMethodId: selectedPaymentMethodId,
          offSession: true,
        };

        const response = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentIntentRequest),
        });

        const result: ApiResponse<PaymentIntentResponse> = await response.json();

        if (result.success && result.data?.status === 'succeeded') {
          setFormState({
            loading: false,
            error: null,
            success: `Retry successful! Payment completed: ${formatAmount(amountValue * 100, currency)}`,
          });
          
          setAmount('25.00');

          if (onSuccess) {
            onSuccess(result.data.paymentIntentId);
          }
        } else {
          setFormState({
            loading: false,
            error: 'Payment still requires authentication or failed.',
            success: null,
          });
        }
      } catch (error) {
        setFormState({
          loading: false,
          error: 'Retry failed. Please try again later.',
          success: null,
        });
      }
    }, 2000); // Simulate processing delay
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
          Off-Session Payment (Customer Not Present)
        </h3>
        <div className="status-info">
          Please select a customer first to simulate off-session payments.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Off-Session Payment (Customer Not Present)
      </h3>

      <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900 rounded-lg">
        <p className="text-sm text-orange-800 dark:text-orange-200">
          <strong>Off-Session Payment:</strong> Automated billing when customer is not present. Used for subscriptions, usage-based billing, etc.
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

      {/* Authentication Required Notice */}
      {authenticateUrl && (
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
            🔐 Customer Authentication Required
          </h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            The payment requires customer authentication. In a real application:
          </p>
          <ul className="text-xs text-yellow-600 dark:text-yellow-400 mb-3 space-y-1">
            <li>• Customer receives secure email/SMS with authentication link</li>
            <li>• Customer authenticates via their bank's 3DS flow</li>
            <li>• Payment auto-completes after successful authentication</li>
            <li>• You receive webhook events with final payment status</li>
          </ul>
          <div className="flex gap-2">
            <button
              onClick={handleRetryPayment}
              disabled={formState.loading}
              className="btn-secondary text-sm"
            >
              {formState.loading ? 'Retrying...' : 'Simulate Retry (Mock)'}
            </button>
            <a
              href={authenticateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm"
            >
              View Mock Auth Link
            </a>
          </div>
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
                Billing Amount
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="form-input"
                placeholder="25.00"
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
            disabled={formState.loading || !selectedPaymentMethodId}
            className="btn-primary w-full"
          >
            {formState.loading 
              ? 'Processing Automated Payment...' 
              : `Charge ${formatAmount(parseFloat(amount || '0') * 100, currency)} (Off-Session)`
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
          Off-Session Payment Scenarios
        </h4>
        <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <li>• <strong>Success:</strong> Payment completes automatically</li>
          <li>• <strong>Authentication Required:</strong> Customer gets email/SMS for 3DS</li>
          <li>• <strong>Card Declined:</strong> Billing retry logic kicks in</li>
          <li>• <strong>Expired Card:</strong> Customer notified to update payment method</li>
        </ul>
        <p className="text-xs text-gray-500 mt-2">
          💡 Tip: Use cards like {paymentMethods[0]?.card?.brand === 'visa' ? '4000 0025 0000 3155' : '4000 0025 0000 3155'} to trigger authentication flows.
        </p>
      </div>
    </div>
  );
}