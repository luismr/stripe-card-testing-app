'use client';

import { useState, useEffect } from 'react';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetupModal({ isOpen, onClose }: SetupModalProps) {
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
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Quick Setup Guide
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get started with Stripe Card Testing
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
            <div className="space-y-6">
              {/* Step 1: Environment Variables */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">1</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Environment Variables
                    </h3>
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                      Create a <code className="bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded text-xs font-mono">.env.local</code> file in the project root with your Stripe test keys.
                    </p>
                    <div className="bg-blue-100 dark:bg-blue-800 p-3 rounded text-xs font-mono text-blue-900 dark:text-blue-100 overflow-x-auto">
                      <div className="space-y-1">
                        <div>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...</div>
                        <div>STRIPE_SECRET_KEY=sk_test_...</div>
                        <div>STRIPE_WEBHOOK_SECRET=whsec_...</div>
                        <div>NEXT_PUBLIC_APP_URL=http://localhost:3000</div>
                      </div>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Get your keys from:{' '}
                      <a
                        href="https://dashboard.stripe.com/test/apikeys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        Stripe Dashboard → API Keys
                      </a>
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      See <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">ENV_VARIABLES.md</code> for detailed instructions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Webhook Setup */}
              <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">2</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
                      Webhook Setup
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                      Install Stripe CLI and forward webhooks to your local server.
                    </p>
                    <div className="space-y-2">
                      <div className="bg-green-100 dark:bg-green-800 p-3 rounded text-xs font-mono text-green-900 dark:text-green-100">
                        <div className="mb-2"># Install Stripe CLI</div>
                        <div className="mb-2">brew install stripe/stripe-cli/stripe</div>
                        <div className="mb-2"># Or download from:</div>
                        <div className="mb-2">
                          <a
                            href="https://stripe.com/docs/stripe-cli"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            https://stripe.com/docs/stripe-cli
                          </a>
                        </div>
                        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                          <div className="mb-2"># Login to Stripe</div>
                          <div className="mb-2">stripe login</div>
                          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-700">
                            <div className="mb-2"># Forward webhooks</div>
                            <div>stripe listen --forward-to localhost:3000/api/webhooks/stripe</div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Copy the <code className="bg-green-100 dark:bg-green-800 px-1 rounded">whsec_...</code> secret and add it to your <code className="bg-green-100 dark:bg-green-800 px-1 rounded">.env.local</code> file.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Start Development Server */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">3</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2">
                      Start Development Server
                    </h3>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                      Install dependencies and start the app.
                    </p>
                    <div className="bg-purple-100 dark:bg-purple-800 p-3 rounded text-xs font-mono text-purple-900 dark:text-purple-100">
                      <div className="mb-2">npm install</div>
                      <div>npm run dev</div>
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                      Open <code className="bg-purple-100 dark:bg-purple-800 px-1 rounded">http://localhost:3000</code> in your browser.
                    </p>
                  </div>
                </div>
              </div>

              {/* Test Cards Reference */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  🧪 Test Card Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Success</span>
                    <code className="font-mono text-gray-900 dark:text-white">4242 4242 4242 4242</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">3DS Required</span>
                    <code className="font-mono text-gray-900 dark:text-white">4000 0025 0000 3155</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Decline</span>
                    <code className="font-mono text-gray-900 dark:text-white">4000 0000 0000 0002</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Insufficient Funds</span>
                    <code className="font-mono text-gray-900 dark:text-white">4000 0000 0000 9995</code>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Use any future expiration date (e.g., 12/28) and any 3-4 digit CVC.
                </p>
              </div>

              {/* Helpful Links */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  📚 Helpful Links
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
                  <a
                    href="https://stripe.com/docs/stripe-cli"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    <span>Stripe CLI Documentation</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}