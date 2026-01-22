'use client';

import { useState, useEffect } from 'react';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WorkflowModal({ isOpen, onClose }: WorkflowModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const workflowSteps = [
    {
      number: 1,
      title: 'Create or Select Customer',
      description: 'Use the customer dropdown in the header to create a new test customer or select an existing one from your Stripe account.',
      icon: '👤',
    },
    {
      number: 2,
      title: 'Save Payment Methods',
      description: 'Navigate to the "Save Cards" tab and use either SetupIntent (save only) or PaymentIntent (pay + save) to store payment methods.',
      icon: '💳',
    },
    {
      number: 3,
      title: 'Manage Saved Cards',
      description: 'Go to the "Manage Cards" tab to view all saved payment methods, set defaults, or remove cards.',
      icon: '🔧',
    },
    {
      number: 4,
      title: 'Test Payment Scenarios',
      description: 'Use the "Payment Scenarios" tab to test on-session payments (customer present) and off-session payments (automated billing).',
      icon: '💰',
    },
    {
      number: 5,
      title: 'Monitor Webhooks',
      description: 'Keep your Stripe CLI running to see real-time webhook events for setup_intent.succeeded, payment_intent.succeeded, and more.',
      icon: '📡',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
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
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Testing Workflow Guide
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Step-by-step guide to testing Stripe Card on File
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {workflowSteps.map((step) => (
                <div
                  key={step.number}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-600 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">{step.number}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xl">{step.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Tips */}
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
              <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                💡 Pro Tips
              </h3>
              <ul className="text-xs text-green-800 dark:text-green-200 space-y-1">
                <li>• Always test with different card scenarios (success, decline, 3DS)</li>
                <li>• Check Stripe Dashboard for real-time event logs</li>
                <li>• Use webhooks to verify server-side event handling</li>
                <li>• Test both on-session and off-session payment flows</li>
                <li>• Verify payment methods are properly attached to customers</li>
              </ul>
            </div>

            {/* Quick Links */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                🔗 Quick Links
              </h3>
              <div className="space-y-2">
                <a
                  href="https://stripe.com/docs/payments/save-and-reuse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>Stripe Card on File Documentation</span>
                </a>
                <a
                  href="https://dashboard.stripe.com/test/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>Stripe Test Dashboard</span>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}