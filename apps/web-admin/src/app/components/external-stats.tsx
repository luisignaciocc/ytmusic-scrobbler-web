'use client';

import { useState, useEffect } from 'react';

interface BillingStats {
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

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-ES');
};

function BillingStatsCard({
  name,
  icon,
  endpoint,
  subtitle = "Billing & subscription metrics",
}: {
  name: string;
  icon: string;
  endpoint: string;
  subtitle?: string;
}) {
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(endpoint)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to fetch ${name} stats`);
        return response.json();
      })
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, [endpoint, name]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-sm">{icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{name} Analytics</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        {stats && (
          <span className="text-xs text-gray-400">
            Updated: {formatDate(stats.lastUpdated)}
          </span>
        )}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-20 rounded"></div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="text-red-400">⚠️</div>
            <div className="ml-3">
              <p className="text-sm text-red-800">Failed to load {name} statistics</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{stats.subscriptions.active}</div>
            <div className="text-sm text-green-600">Active Subscriptions</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{stats.subscriptions.trialing}</div>
            <div className="text-sm text-blue-600">Trial Subscriptions</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{stats.customers.total}</div>
            <div className="text-sm text-purple-600">Total Customers</div>
          </div>
          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-700">{formatCurrency(stats.revenue.mrr)}</div>
            <div className="text-sm text-yellow-600">Monthly Recurring Revenue</div>
          </div>
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 p-4 rounded-lg border border-indigo-200">
            <div className="text-2xl font-bold text-indigo-700">{formatCurrency(stats.revenue.arr)}</div>
            <div className="text-sm text-indigo-600">Annual Recurring Revenue</div>
          </div>
          <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-4 rounded-lg border border-pink-200">
            <div className="text-2xl font-bold text-pink-700">{formatCurrency(stats.revenue.totalRevenue)}</div>
            <div className="text-sm text-pink-600">Total Revenue</div>
          </div>
          <div className="bg-gradient-to-r from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
            <div className="text-2xl font-bold text-teal-700">{formatCurrency(stats.revenue.monthlyRevenue)}</div>
            <div className="text-sm text-teal-600">This Month Revenue</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function ExternalStats() {
  const [resendStats, setResendStats] = useState<ResendStats | null>(null);
  const [loadingResend, setLoadingResend] = useState(true);
  const [resendError, setResendError] = useState<string | null>(null);

  useEffect(() => {
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

    fetchResendStats();
  }, []);

  return (
    <div className="space-y-8">
      <BillingStatsCard name="Stripe" icon="💳" endpoint="/api/stats/stripe" />
      <BillingStatsCard
        name="Paddle"
        icon="🚣"
        endpoint="/api/stats/paddle"
        subtitle="Subscriptions bought before the move to Stripe"
      />

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