'use client';

import { useState, useEffect } from 'react';

interface Stats {
  // Basic metrics
  totalUsers: number;
  activeUsers: number;
  usersWithRecentScrobbles24h: number;
  usersWithRecentScrobbles7d: number;
  usersWithRecentScrobbles30d: number;
  totalScrobbles: number;
  recentScrobbles24h: number;
  recentScrobbles7d: number;
  recentScrobbles30d: number;

  // Health metrics
  usersWithAuthFailures: number;
  usersWithNetworkFailures: number;
  usersWithoutCookie: number;
  usersWithoutLastFm: number;

  // Growth metrics
  usersCreatedToday: number;
  usersCreatedThisWeek: number;

  // Calculated metrics
  inactiveUsers: number;
  usersWithoutRecentScrobbles24h: number;
  activeUserRate: number;
  recentActivityRate24h: number;
  setupCompletionRate: number;

  // Insights
  avgScrobblesPerActiveUser: number;
  topArtists: { artist: string; count: number }[];
  failureStats: Record<string, number>;
}

export default function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
        Error loading statistics: {error}
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: 'Total Usuarios',
      value: stats.totalUsers.toLocaleString(),
      description: 'Usuarios registrados',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-600'
    },
    {
      title: 'Usuarios Activos',
      value: stats.activeUsers.toLocaleString(),
      description: 'Con configuración completa',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-600'
    },
    {
      title: 'Con Scrobbles Recientes',
      value: stats.usersWithRecentScrobbles.toLocaleString(),
      description: 'Últimos 30 días',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-600'
    },
    {
      title: 'Usuarios Inactivos',
      value: stats.inactiveUsers.toLocaleString(),
      description: 'Sin configuración completa',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Total Scrobbles',
      value: stats.totalScrobbles.toLocaleString(),
      description: 'Todas las canciones',
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-600'
    },
    {
      title: 'Scrobbles Recientes',
      value: stats.recentScrobbles.toLocaleString(),
      description: 'Últimos 30 días',
      color: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-600'
    },
    {
      title: 'Sin Scrobbles Recientes',
      value: stats.usersWithoutRecentScrobbles.toLocaleString(),
      description: 'Sin actividad en 30 días',
      color: 'bg-gray-50 border-gray-200',
      textColor: 'text-gray-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`${card.color} border rounded-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}