'use client';

import { useState, useEffect } from 'react';

interface PaddleStats {
  subscriptions: {
    active: number;
    trialing: number;
    total: number;
  };
  customers: {
    total: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    totalRevenue: number;
    monthlyRevenue: number;
  };
  lastUpdated: string;
}

interface ResendStats {
  account: {
    domains: {
      total: number;
      verified: number;
      pending: number;
    };
    apiKeys: {
      total: number;
      active: number;
    };
  };
  emails: {
    sent: string | number;
    delivered: string | number;
    bounced: string | number;
    opened: string | number;
    clicked: string | number;
    complained: string | number;
  };
  engagement: {
    openRate: string;
    clickRate: string;
    bounceRate: string;
  };
  implementation: {
    note: string;
    webhookEvents: string[];
    suggestedTable: string;
  };
  lastUpdated: string;
}

export default function ExternalStats() {
  const [paddleStats, setPaddleStats] = useState<PaddleStats | null>(null);
  const [resendStats, setResendStats] = useState<ResendStats | null>(null);
  const [loadingPaddle, setLoadingPaddle] = useState(true);
  const [loadingResend, setLoadingResend] = useState(true);
  const [paddleError, setPaddleError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaddleStats() {
      try {
        const response = await fetch('/api/stats/paddle');
        if (!response.ok) {
          throw new Error('Failed to fetch Paddle stats');
        }
        const data = await response.json();
        setPaddleStats(data);
      } catch (error) {
        setPaddleError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingPaddle(false);
      }
    }

    async function fetchResendStats() {
      try {
        const response = await fetch('/api/stats/resend');
        if (!response.ok) {
          throw new Error('Failed to fetch Resend stats');
        }
        const data = await response.json();
        setResendStats(data);
      } catch (error) {
        setResendError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoadingResend(false);
      }
    }

    fetchPaddleStats();
    fetchResendStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  return (
    <div className="space-y-8">
      {/* Paddle Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">🚣</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Paddle Analytics</h3>
              <p className="text-sm text-gray-500">Billing & subscription metrics</p>
            </div>
          </div>
          {paddleStats && (
            <span className="text-xs text-gray-400">
              Updated: {formatDate(paddleStats.lastUpdated)}
            </span>
          )}
        </div>

        {loadingPaddle ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-20 rounded"></div>
              ))}
            </div>
          </div>
        ) : paddleError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <p className="text-sm text-red-800">Failed to load Paddle statistics</p>
                <p className="text-xs text-red-600 mt-1">{paddleError}</p>
              </div>
            </div>
          </div>
        ) : paddleStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-700">{paddleStats.subscriptions.active}</div>
              <div className="text-sm text-green-600">Active Subscriptions</div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-700">{paddleStats.subscriptions.trialing}</div>
              <div className="text-sm text-blue-600">Trial Subscriptions</div>
            </div>
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-700">{paddleStats.customers.total}</div>
              <div className="text-sm text-purple-600">Total Customers</div>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-700">{formatCurrency(paddleStats.revenue.mrr)}</div>
              <div className="text-sm text-yellow-600">Monthly Recurring Revenue</div>
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
              <div className="text-2xl font-bold text-indigo-700">{formatCurrency(paddleStats.revenue.arr)}</div>
              <div className="text-sm text-indigo-600">Annual Recurring Revenue</div>
            </div>
            <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
              <div className="text-2xl font-bold text-pink-700">{formatCurrency(paddleStats.revenue.totalRevenue)}</div>
              <div className="text-sm text-pink-600">Total Revenue</div>
            </div>
            <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
              <div className="text-2xl font-bold text-teal-700">{formatCurrency(paddleStats.revenue.monthlyRevenue)}</div>
              <div className="text-sm text-teal-600">This Month Revenue</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Resend Statistics */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">✉️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Resend Analytics</h3>
              <p className="text-sm text-gray-500">Email delivery & engagement metrics</p>
            </div>
          </div>
          {resendStats && (
            <span className="text-xs text-gray-400">
              Updated: {formatDate(resendStats.lastUpdated)}
            </span>
          )}
        </div>

        {loadingResend ? (
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-gray-200 h-20 rounded"></div>
              ))}
            </div>
          </div>
        ) : resendError ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <p className="text-sm text-red-800">Failed to load Resend statistics</p>
                <p className="text-xs text-red-600 mt-1">{resendError}</p>
              </div>
            </div>
          </div>
        ) : resendStats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700">{resendStats.account.domains.verified}</div>
                <div className="text-sm text-green-600">Verified Domains</div>
              </div>
              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-700">{resendStats.account.domains.pending}</div>
                <div className="text-sm text-yellow-600">Pending Domains</div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700">{resendStats.account.apiKeys.total}</div>
                <div className="text-sm text-blue-600">Total API Keys</div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700">{resendStats.account.apiKeys.active}</div>
                <div className="text-sm text-purple-600">Active API Keys</div>
              </div>
            </div>

            {/* Implementation Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="text-blue-400">💡</div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 font-medium">Email Analytics Implementation</p>
                  <p className="text-xs text-blue-700 mt-1">{resendStats.implementation.note}</p>
                  <div className="mt-3 text-xs text-blue-600">
                    <p className="font-medium">Supported webhook events:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {resendStats.implementation.webhookEvents.map((event) => (
                        <span key={event} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {event}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}