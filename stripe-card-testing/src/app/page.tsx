'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe, ELEMENTS_APPEARANCE } from '@/lib/stripe';
import CustomerDropdown from '@/components/CustomerDropdown';
import SetupModal from '@/components/SetupModal';
import TestCardsModal from '@/components/TestCardsModal';
import WorkflowModal from '@/components/WorkflowModal';
import SetupCardForm from '@/components/SetupCardForm';
import PaymentForm from '@/components/PaymentForm';
import SavedCardsList from '@/components/SavedCardsList';
import OnSessionPayment from '@/components/OnSessionPayment';
import OffSessionPayment from '@/components/OffSessionPayment';

export default function Home() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [stripePromise] = useState(() => getStripe());
  const [activeCardTab, setActiveCardTab] = useState<'setup' | 'payment'>('setup');
  const [activeMainTab, setActiveMainTab] = useState<'save' | 'pay' | 'manage'>('save');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isTestCardsModalOpen, setIsTestCardsModalOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);

  // Handle customer selection
  const handleCustomerSelect = (customerId: string | null) => {
    setSelectedCustomerId(customerId);
  };

  // Trigger refresh of saved cards list when cards are modified
  const handleCardsChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCardSaved = (paymentMethodId: string) => {
    console.log('Card saved:', paymentMethodId);
    handleCardsChanged();
  };

  const handlePaymentSuccess = (paymentIntentId: string, paymentMethodId?: string) => {
    console.log('Payment succeeded:', paymentIntentId, paymentMethodId);
    if (paymentMethodId) {
      handleCardsChanged();
    }
  };

  return (
    <Elements stripe={stripePromise} options={{ appearance: ELEMENTS_APPEARANCE }}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <div className="flex items-start justify-between">
                {/* Left Side: Title and Description */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Stripe Card Testing App
                  </h1>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Test all Stripe Card on File scenarios including SetupIntents, <br />PaymentIntents, and payment flows
                  </p>
                </div>
                
                {/* Right Side: Test Mode and Action Buttons */}
                <div className="flex flex-col items-end space-y-3 ml-6">
                  {/* Test Mode Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Test Mode
                      </div>
                      <div className="text-xs text-gray-500">
                        Sandbox Environment
                      </div>
                    </div>
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  </div>
                  
                  {/* Buttons and Dropdown */}
                  <div className="flex items-center space-x-3">
                    {/* Workflow Button */}
                    <button
                      onClick={() => setIsWorkflowModalOpen(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      title="View Testing Workflow"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                      <span>Workflow</span>
                    </button>

                    {/* Test Cards Button */}
                    <button
                      onClick={() => setIsTestCardsModalOpen(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                      title="View Test Cards"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span>Test Cards</span>
                    </button>

                    {/* Setup Button */}
                    <button
                      onClick={() => setIsSetupModalOpen(true)}
                      className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      title="View Setup Guide"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>Setup</span>
                    </button>

                    {/* Customer Dropdown */}
                    <CustomerDropdown
                      selectedCustomerId={selectedCustomerId}
                      onCustomerSelect={handleCustomerSelect}
                      onCustomerSelected={() => {
                        // Customer selection handled by onCustomerSelect
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          {/* Main Tabs Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveMainTab('save')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeMainTab === 'save'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">💳</span>
                    Save Cards
                  </span>
                </button>
                <button
                  onClick={() => setActiveMainTab('pay')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeMainTab === 'pay'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">💰</span>
                    Payment Scenarios
                  </span>
                </button>
                <button
                  onClick={() => setActiveMainTab('manage')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeMainTab === 'manage'
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center">
                    <span className="mr-2">🔧</span>
                    Manage Cards
                  </span>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="mb-8">
            {/* Save Cards Tab */}
            {activeMainTab === 'save' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Save Payment Methods
                </h2>
                
                {/* Sub-tabs for Card Forms */}
                <div className="mb-6">
                  <div className="flex border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveCardTab('setup')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeCardTab === 'setup'
                          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      SetupIntent (Save Only)
                    </button>
                    <button
                      onClick={() => setActiveCardTab('payment')}
                      className={`px-4 py-2 font-medium text-sm transition-colors ${
                        activeCardTab === 'payment'
                          ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                    >
                      PaymentIntent (Pay + Save)
                    </button>
                  </div>
                </div>
                
                {activeCardTab === 'setup' && (
                  <SetupCardForm
                    customerId={selectedCustomerId}
                    onSuccess={handleCardSaved}
                  />
                )}
                
                {activeCardTab === 'payment' && (
                  <PaymentForm
                    customerId={selectedCustomerId}
                    onSuccess={handlePaymentSuccess}
                  />
                )}
              </div>
            )}

            {/* Payment Scenarios Tab */}
            {activeMainTab === 'pay' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OnSessionPayment
                  customerId={selectedCustomerId}
                  onSuccess={handlePaymentSuccess}
                />
                <OffSessionPayment
                  customerId={selectedCustomerId}
                  onSuccess={handlePaymentSuccess}
                />
              </div>
            )}

            {/* Manage Cards Tab */}
            {activeMainTab === 'manage' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Manage Saved Payment Methods
                </h2>
                <SavedCardsList
                  customerId={selectedCustomerId}
                  onCardSelect={setSelectedPaymentMethodId}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onCardsChanged={handleCardsChanged}
                  key={refreshTrigger}
                />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div>
                Built for testing Stripe Card on File functionality
              </div>
              <div className="flex items-center space-x-4">
                <a
                  href="https://stripe.com/docs/payments/save-and-reuse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Stripe Docs
                </a>
                <a
                  href="https://dashboard.stripe.com/test/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Setup Modal */}
        <SetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
        />

        {/* Test Cards Modal */}
        <TestCardsModal
          isOpen={isTestCardsModalOpen}
          onClose={() => setIsTestCardsModalOpen(false)}
        />

        {/* Workflow Modal */}
        <WorkflowModal
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
        />
      </div>
    </Elements>
  );
}