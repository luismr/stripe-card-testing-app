'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiResponse, PaymentMethodsResponse } from '@/types/stripe';
import Stripe from 'stripe';

interface SavedCardsListProps {
  customerId: string | null;
  onCardSelect?: (paymentMethodId: string) => void;
  selectedPaymentMethodId?: string | null;
  onCardsChanged?: () => void;
}

export default function SavedCardsList({ 
  customerId, 
  onCardSelect, 
  selectedPaymentMethodId,
  onCardsChanged 
}: SavedCardsListProps) {
  const [paymentMethods, setPaymentMethods] = useState<Stripe.PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(async () => {
    if (!customerId) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/payment-methods?customerId=${customerId}`);
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        const data = result.data as PaymentMethodsResponse;
        setPaymentMethods(data.paymentMethods || []);
      } else {
        setError(result.error || 'Failed to load payment methods');
      }
    } catch (err) {
      setError('Network error while loading payment methods');
      console.error('Load payment methods error:', err);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  // Load payment methods when customer changes
  useEffect(() => {
    if (customerId) {
      loadPaymentMethods();
    } else {
      setPaymentMethods([]);
      setError(null);
      setSuccess(null);
    }
  }, [customerId, loadPaymentMethods]);

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!customerId) return;

    setActionLoading(paymentMethodId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/payment-methods', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId,
          customerId,
          action: 'set_default',
        }),
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess('Default payment method updated successfully!');
        await loadPaymentMethods(); // Reload to get updated data
        
        if (onCardsChanged) {
          onCardsChanged();
        }
      } else {
        setError(result.error || 'Failed to set default payment method');
      }
    } catch (err) {
      setError('Network error while updating default payment method');
      console.error('Set default error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setActionLoading(paymentMethodId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment-methods?id=${paymentMethodId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess('Payment method removed successfully!');
        await loadPaymentMethods(); // Reload to get updated list
        
        // Clear selection if deleted card was selected
        if (selectedPaymentMethodId === paymentMethodId && onCardSelect) {
          onCardSelect('');
        }
        
        if (onCardsChanged) {
          onCardsChanged();
        }
      } else {
        setError(result.error || 'Failed to remove payment method');
      }
    } catch (err) {
      setError('Network error while removing payment method');
      console.error('Remove card error:', err);
    } finally {
      setActionLoading(null);
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

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!customerId) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Saved Payment Methods
        </h3>
        <div className="status-info">
          Please select a customer to view their saved payment methods.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Saved Payment Methods
        </h3>
        <button
          onClick={loadPaymentMethods}
          disabled={loading}
          className="btn-secondary text-sm"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900 rounded-lg">
        <p className="text-sm text-purple-800 dark:text-purple-200">
          <strong>Card Management:</strong> View, set default, and remove saved payment methods.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="status-error mb-4">
          {error}
          <button
            onClick={clearMessages}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {success && (
        <div className="status-success mb-4">
          {success}
          <button
            onClick={clearMessages}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Payment Methods List */}
      {loading ? (
        <div className="status-info">
          Loading payment methods...
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="status-info">
          No saved payment methods found. Save a card using the forms above.
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`p-4 border rounded-lg transition-colors ${
                selectedPaymentMethodId === pm.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {onCardSelect && (
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.id}
                      checked={selectedPaymentMethodId === pm.id}
                      onChange={() => onCardSelect(pm.id)}
                      className="text-blue-600"
                    />
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">
                      {getCardBrandIcon(pm.card?.brand || 'unknown')}
                    </span>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {pm.card?.brand?.toUpperCase()} •••• {pm.card?.last4}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Expires {pm.card?.exp_month?.toString().padStart(2, '0')}/{pm.card?.exp_year}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {pm.id}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSetDefault(pm.id)}
                    disabled={actionLoading === pm.id}
                    className="btn-secondary text-xs"
                    title="Set as default payment method"
                  >
                    {actionLoading === pm.id ? 'Setting...' : 'Set Default'}
                  </button>
                  
                  <button
                    onClick={() => handleRemoveCard(pm.id)}
                    disabled={actionLoading === pm.id}
                    className="btn-danger text-xs"
                    title="Remove payment method"
                  >
                    {actionLoading === pm.id ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </div>

              {/* Show if this is the default payment method */}
              {/* Note: In a real app, you'd track this properly through customer.invoice_settings.default_payment_method */}
              <div className="mt-2 text-xs text-gray-500">
                Created: {new Date(pm.created * 1000).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Payment Method Info */}
      {onCardSelect && selectedPaymentMethodId && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
            Selected for payment: {paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.card?.brand?.toUpperCase()} •••• {paymentMethods.find(pm => pm.id === selectedPaymentMethodId)?.card?.last4}
          </div>
        </div>
      )}
    </div>
  );
}