'use client';

import { useState, useEffect, useRef } from 'react';
import { CustomerData, ApiResponse, CreateCustomerRequest } from '@/types/stripe';

interface CustomerDropdownProps {
  selectedCustomerId: string | null;
  onCustomerSelect: (customerId: string | null) => void;
  onCustomerSelected?: (customer: { id: string; name: string; email: string }) => void;
}

export default function CustomerDropdown({ 
  selectedCustomerId, 
  onCustomerSelect,
  onCustomerSelected
}: CustomerDropdownProps) {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form state for creating new customer
  const [newCustomer, setNewCustomer] = useState<CreateCustomerRequest>({
    email: '',
    name: '',
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/customers');
      const result: ApiResponse = await response.json();

      if (result.success) {
        const localCustomers = result.data.localCustomers || [];
        const stripeCustomers = result.data.stripeCustomers || [];
        
        // Merge Stripe customers with local customers
        const localCustomersMap = new Map(
          localCustomers.map(c => [c.id, c])
        );
        
        const mergedCustomers: CustomerData[] = stripeCustomers.map((stripeCustomer: any) => {
          const localData = localCustomersMap.get(stripeCustomer.id);
          
          if (localData) {
            return localData;
          }
          
          return {
            id: stripeCustomer.id,
            email: stripeCustomer.email || '',
            name: stripeCustomer.name || '',
            created: stripeCustomer.created * 1000,
            paymentMethods: [],
          };
        });
        
        localCustomers.forEach(localCustomer => {
          const existsInStripe = stripeCustomers.some((sc: any) => sc.id === localCustomer.id);
          if (existsInStripe && !mergedCustomers.find(c => c.id === localCustomer.id)) {
            mergedCustomers.push(localCustomer);
          }
        });
        
        mergedCustomers.sort((a, b) => b.created - a.created);
        setCustomers(mergedCustomers);
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
    e.stopPropagation();
    
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

      if (result.success) {
        setSuccess(`Customer "${result.data.local.name}" created!`);
        setNewCustomer({ email: '', name: '' });
        setShowCreateForm(false);
        
        await loadCustomers();
        
        const customerId = result.data.local.id;
        onCustomerSelect(customerId);
        
        if (onCustomerSelected) {
          onCustomerSelected({
            id: customerId,
            name: result.data.local.name,
            email: result.data.local.email,
          });
        }
        
        setIsOpen(false);
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

  const handleSelectCustomer = (customer: CustomerData) => {
    onCustomerSelect(customer.id);
    
    if (onCustomerSelected) {
      onCustomerSelected({
        id: customer.id,
        name: customer.name,
        email: customer.email,
      });
    }
    
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClearSelection = () => {
    onCustomerSelect(null);
    if (onCustomerSelected) {
      onCustomerSelected({ id: '', name: '', email: '' });
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(customer => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.email.toLowerCase().includes(query) ||
      customer.id.toLowerCase().includes(query)
    );
  });

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            loadCustomers();
          }
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
      >
        <div className="flex items-center space-x-2 min-w-0">
          {selectedCustomer ? (
            <>
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-semibold">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                  {selectedCustomer.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                  {selectedCustomer.email}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">?</span>
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Select Customer</span>
            </>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 flex flex-col">
          {/* Header with Search and Actions */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            {/* Search Input */}
            <div className="mb-2">
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCreateForm(!showCreateForm);
                  setError(null);
                  setSuccess(null);
                }}
                className="flex-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                {showCreateForm ? 'Cancel' : '+ Create'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  loadCustomers();
                }}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors disabled:bg-gray-400"
              >
                {loading ? '...' : '↻'}
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900 px-2 py-1 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mt-2 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900 px-2 py-1 rounded">
                {success}
              </div>
            )}
          </div>

          {/* Create Customer Form */}
          {showCreateForm && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <form onSubmit={handleCreateCustomer} className="space-y-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
                <input
                  type="text"
                  placeholder="Name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-blue-400"
                >
                  {createLoading ? 'Creating...' : 'Create Customer'}
                </button>
              </form>
            </div>
          )}

          {/* Customer List */}
          <div className="overflow-y-auto flex-1">
            {loading && customers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading customers...
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                {searchQuery ? 'No customers match your search' : 'No customers found'}
              </div>
            ) : (
              <div className="py-1">
                {/* Clear Selection Option */}
                {selectedCustomerId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearSelection();
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <span className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs">×</span>
                    </span>
                    <span>Clear Selection</span>
                  </button>
                )}

                {/* Customer Items */}
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectCustomer(customer);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                      selectedCustomerId === customer.id
                        ? 'bg-blue-50 dark:bg-blue-900 border-l-2 border-blue-500'
                        : ''
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {customer.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {customer.email}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate">
                        {customer.id}
                      </div>
                    </div>
                    {selectedCustomerId === customer.id && (
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}