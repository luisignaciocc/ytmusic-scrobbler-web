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

export default function EnhancedStats() {
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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow border p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
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

  const getHealthColor = (value: number, total: number, threshold: number = 10) => {
    const percentage = (value / total) * 100;
    if (percentage > threshold) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage > 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getGrowthIndicator = (value: number) => {
    if (value > 10) return '📈 Excelente';
    if (value > 5) return '📊 Bueno';
    if (value > 0) return '🔄 Lento';
    return '😴 Sin crecimiento';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Todos los registrados</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.activeUserRate}% del total</p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos 24h</p>
                <p className="text-2xl font-bold text-purple-600">{stats.usersWithRecentScrobbles24h.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.recentActivityRate24h}% del total</p>
              </div>
              <div className="text-2xl">🔥</div>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Scrobbles</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.totalScrobbles.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Todas las canciones</p>
              </div>
              <div className="text-2xl">🎵</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Cards */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">⚡ Actividad Reciente</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scrobbles Hoy</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.recentScrobbles24h.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Últimas 24 horas</p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
          </div>

          <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scrobbles 7d</p>
                <p className="text-2xl font-bold text-teal-600">{stats.recentScrobbles7d.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Última semana</p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
          </div>

          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Scrobbles 30d</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.recentScrobbles30d.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Último mes</p>
              </div>
              <div className="text-2xl">📋</div>
            </div>
          </div>
        </div>
      </div>

      {/* Health Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🩺 Estado del Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`border rounded-lg p-6 ${getHealthColor(stats.usersWithAuthFailures, stats.totalUsers)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fallos de Auth</p>
                <p className="text-2xl font-bold">{stats.usersWithAuthFailures.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Credenciales expiradas</p>
              </div>
              <div className="text-2xl">🔐</div>
            </div>
          </div>

          <div className={`border rounded-lg p-6 ${getHealthColor(stats.usersWithNetworkFailures, stats.totalUsers)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fallos de Red</p>
                <p className="text-2xl font-bold">{stats.usersWithNetworkFailures.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Problemas temporales</p>
              </div>
              <div className="text-2xl">🌐</div>
            </div>
          </div>

          <div className={`border rounded-lg p-6 ${getHealthColor(stats.usersWithoutCookie, stats.totalUsers)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Cookie YTM</p>
                <p className="text-2xl font-bold">{stats.usersWithoutCookie.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Setup incompleto</p>
              </div>
              <div className="text-2xl">🍪</div>
            </div>
          </div>

          <div className={`border rounded-lg p-6 ${getHealthColor(stats.usersWithoutLastFm, stats.totalUsers)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sin Last.fm</p>
                <p className="text-2xl font-bold">{stats.usersWithoutLastFm.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Setup incompleto</p>
              </div>
              <div className="text-2xl">🎧</div>
            </div>
          </div>
        </div>
      </div>

      {/* Growth & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📈 Crecimiento</h3>
          <div className="bg-white border rounded-lg p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Usuarios nuevos hoy</span>
                <span className="text-lg font-bold text-blue-600">{stats.usersCreatedToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Usuarios nuevos esta semana</span>
                <span className="text-lg font-bold text-green-600">{stats.usersCreatedThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Tasa de crecimiento semanal</span>
                <span className="text-sm font-medium text-purple-600">{getGrowthIndicator(stats.usersCreatedThisWeek)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">Promedio scrobbles/usuario activo</span>
                <span className="text-lg font-bold text-orange-600">{Math.round(stats.avgScrobblesPerActiveUser || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Artists */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🎤 Top Artistas (30d)</h3>
          <div className="bg-white border rounded-lg p-6">
            <div className="space-y-3">
              {stats.topArtists.slice(0, 5).map((artist, index) => (
                <div key={artist.artist} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-400 w-4">#{index + 1}</span>
                    <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]" title={artist.artist}>
                      {artist.artist}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">{artist.count.toLocaleString()}</span>
                </div>
              ))}
              {stats.topArtists.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No hay datos suficientes</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Failure Breakdown */}
      {Object.keys(stats.failureStats).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ Tipos de Fallos</h3>
          <div className="bg-white border rounded-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.failureStats).map(([type, count]) => (
                <div key={type} className="text-center">
                  <p className="text-sm font-medium text-gray-600">{type}</p>
                  <p className="text-xl font-bold text-red-600">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}