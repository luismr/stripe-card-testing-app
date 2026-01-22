'use client';

import { useState, useEffect } from 'react';
import { TEST_CARDS } from '@/lib/stripe';

interface TestCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestCardsModal({ isOpen, onClose }: TestCardsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedCard, setCopiedCard] = useState<string | null>(null);

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

  const copyToClipboard = (text: string, cardType: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(cardType);
    setTimeout(() => setCopiedCard(null), 2000);
  };

  if (!mounted || !isOpen) return null;

  const testCards = [
    { type: 'Success', number: TEST_CARDS.success, description: 'Use this card for successful payments' },
    { type: '3DS Authentication', number: TEST_CARDS.authentication3DS, description: 'Triggers 3D Secure authentication flow' },
    { type: 'Decline', number: TEST_CARDS.decline, description: 'Card will be declined' },
    { type: 'Insufficient Funds', number: TEST_CARDS.insufficientFunds, description: 'Simulates insufficient funds error' },
    { type: 'Authentication Required', number: TEST_CARDS.authenticationRequired, description: 'Requires additional authentication' },
    { type: 'Expired Card', number: TEST_CARDS.expiredCard, description: 'Simulates expired card error' },
    { type: 'Incorrect CVC', number: TEST_CARDS.incorrectCVC, description: 'Invalid security code error' },
    { type: 'Processing Error', number: TEST_CARDS.processingError, description: 'Simulates processing error' },
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
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
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
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Test Card Numbers
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Stripe test cards for different scenarios
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
            <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                <strong>💡 Tip:</strong> Use any future expiration date (e.g., 12/28) and any 3-4 digit CVC for all test cards.
              </p>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testCards.map((card) => (
                <div
                  key={card.type}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-purple-300 dark:hover:border-purple-600 transition-colors bg-gray-50 dark:bg-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {card.type}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                        {card.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded font-mono text-sm text-gray-900 dark:text-white">
                      {card.number}
                    </code>
                    <button
                      onClick={() => copyToClipboard(card.number, card.type)}
                      className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors flex items-center space-x-1"
                      title="Copy card number"
                    >
                      {copiedCard === card.type ? (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Information */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                📝 Usage Notes
              </h3>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <li>• All test cards work in Stripe test mode only</li>
                <li>• Use any future expiration date (e.g., 12/28, 01/30)</li>
                <li>• Use any 3-4 digit CVC code</li>
                <li>• ZIP code can be any valid postal code</li>
                <li>• These cards will not work in live mode</li>
              </ul>
            </div>

            {/* Common Scenarios */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                🎯 Common Testing Scenarios
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800 dark:text-blue-200">
                <div>
                  <strong>Happy Path:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4242 4242 4242 4242</code>
                </div>
                <div>
                  <strong>3DS Testing:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4000 0025 0000 3155</code>
                </div>
                <div>
                  <strong>Decline Testing:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4000 0000 0000 0002</code>
                </div>
                <div>
                  <strong>Error Handling:</strong> Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">4000 0000 0000 9995</code>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}