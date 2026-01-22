'use client';

import { useState, useEffect } from 'react';
import type Stripe from 'stripe';
import { CustomerData, ApiResponse, CreateCustomerRequest } from '@/types/stripe';

interface CustomerSelectorProps {
  selectedCustomerId: string | null;
  onCustomerSelect: (customerId: string | null) => void;
}

export default function CustomerSelector({ 
  selectedCustomerId, 
  onCustomerSelect 
}: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state for creating new customer
  const [newCustomer, setNewCustomer] = useState<CreateCustomerRequest>({
    email: '',
    name: '',
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customers');
      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        const data = result.data as { localCustomers?: CustomerData[]; stripeCustomers?: Stripe.Customer[] };
        const localCustomers = data.localCustomers || [];
        const stripeCustomers = data.stripeCustomers || [];
        
        // Merge Stripe customers with local customers
        // Create a map of local customers by ID for quick lookup
        const localCustomersMap = new Map(
          localCustomers.map((c: CustomerData) => [c.id, c])
        );
        
        // Convert Stripe customers to CustomerData format and merge
        const mergedCustomers: CustomerData[] = stripeCustomers.map((stripeCustomer: Stripe.Customer) => {
          const localData = localCustomersMap.get(stripeCustomer.id);
          
          // If we have local data, use it; otherwise create from Stripe data
          if (localData) {
            return localData;
          }
          
          // Create CustomerData from Stripe customer
          return {
            id: stripeCustomer.id,
            email: stripeCustomer.email || '',
            name: stripeCustomer.name || '',
            created: stripeCustomer.created * 1000, // Convert to milliseconds
            paymentMethods: [],
          };
        });
        
        // Add any local customers that aren't in Stripe (edge case)
        // Only add if they exist in Stripe (to avoid orphaned local data)
        localCustomers.forEach((localCustomer: CustomerData) => {
          const existsInStripe = stripeCustomers.some((sc: Stripe.Customer) => sc.id === localCustomer.id);
          if (existsInStripe && !mergedCustomers.find((c: CustomerData) => c.id === localCustomer.id)) {
            mergedCustomers.push(localCustomer);
          }
        });
        
        // Sort by creation date (newest first)
        mergedCustomers.sort((a, b) => b.created - a.created);
        
        setCustomers(mergedCustomers);
        
        // Log for debugging
        if (mergedCustomers.length === 0) {
          console.log('No customers found in Stripe sandbox account');
        } else {
          console.log(`Loaded ${mergedCustomers.length} customer(s) from Stripe`);
        }
      } else {
        setError(result.error || 'Failed to load customers');
      }
    } catch (err) {
      setError('Network error while loading customers');
      console.error('Load customers error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCustomer.email.trim() || !newCustomer.name.trim()) {
      setError('Email and name are required');
      return;
    }

    setCreateLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomer),
      });

      const result: ApiResponse = await response.json();

      if (result.success && result.data) {
        const data = result.data as { local: CustomerData };
        setSuccess(`Customer "${data.local.name}" created successfully!`);
        setNewCustomer({ email: '', name: '' });
        setShowCreateForm(false);
        
        // Refresh customers list
        await loadCustomers();
        
        // Auto-select the new customer
        onCustomerSelect(data.local.id);
      } else {
        setError(result.error || 'Failed to create customer');
      }
    } catch (err) {
      setError('Network error while creating customer');
      console.error('Create customer error:', err);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) {
      return;
    }

    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (result.success) {
        setSuccess('Customer deleted successfully!');
        
        // Clear selection if deleted customer was selected
        if (selectedCustomerId === customerId) {
          onCustomerSelect(null);
        }
        
        // Refresh customers list
        await loadCustomers();
      } else {
        setError(result.error || 'Failed to delete customer');
      }
    } catch (err) {
      setError('Network error while deleting customer');
      console.error('Delete customer error:', err);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Customer Selection
        </h3>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            clearMessages();
          }}
          className="btn-secondary text-sm"
        >
          {showCreateForm ? 'Cancel' : 'Create Customer'}
        </button>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="status-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="status-success mb-4">
          {success}
        </div>
      )}

      {/* Create Customer Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateCustomer} className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="text-md font-medium mb-3 text-gray-900 dark:text-white">
            Create New Customer
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="form-label">
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="customer@example.com"
                required
              />
            </div>
            
            <div>
              <label className="form-label">
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createLoading}
              className="btn-primary"
            >
              {createLoading ? 'Creating...' : 'Create Customer'}
            </button>
            
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewCustomer({ email: '', name: '' });
                clearMessages();
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Customer Selection */}
      <div className="space-y-3">
        <label className="form-label">
          Select Customer for Testing
        </label>
        
        {loading ? (
          <div className="status-info">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="status-info">
            <div className="text-center py-4">
              <p className="mb-2">No customers found in your Stripe sandbox account.</p>
              <p className="text-sm mb-3">Create your first test customer above to get started.</p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Customers created in Stripe Dashboard will appear here automatically.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="customer"
                  value=""
                  checked={selectedCustomerId === null}
                  onChange={() => onCustomerSelect(null)}
                  className="mr-3"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  No customer selected
                </span>
              </label>
            </div>

            {customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <label className="flex items-center flex-grow cursor-pointer">
                  <input
                    type="radio"
                    name="customer"
                    value={customer.id}
                    checked={selectedCustomerId === customer.id}
                    onChange={() => onCustomerSelect(customer.id)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {customer.email}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      ID: {customer.id}
                    </div>
                  </div>
                </label>
                
                <button
                  onClick={() => handleDeleteCustomer(customer.id)}
                  className="ml-2 text-red-600 hover:text-red-700 text-sm"
                  title="Delete customer"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={loadCustomers}
          disabled={loading}
          className="btn-secondary w-full mt-4"
        >
          {loading ? 'Refreshing...' : 'Refresh Customers'}
        </button>
      </div>
    </div>
  );
}