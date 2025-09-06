"use client";
import React, { useState } from "react";
import Image from "next/image";
import { updateUserStatus, resetUserFailures } from "@/lib/prisma";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  isActive: boolean;
  lastFmUsername: string | null;
  lastSuccessfulScrobble: Date | null;
  createdAt: Date;
  updatedAt: Date;
  consecutiveFailures: number;
  lastFailureType: string | null;
  lastFailedAt: Date | null;
  ytmusicCookie: string | null;
  lastFmSessionKey: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string | null;
  notificationsEnabled: boolean;
  authNotificationCount: number;
  lastNotificationSent: Date | null;
  Songs: { id: string; addedAt: Date }[];
  _count: { Songs: number };
}

interface EnhancedUserTableProps {
  users: User[];
  searchText: string | undefined;
  status: boolean | string;
}

export default function EnhancedUsersTable({
  users,
  searchText,
  status,
}: EnhancedUserTableProps) {
  const router = useRouter();
  const [sortColumn, setSortColumn] = useState<string>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive);
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleResetFailures = async (userId: string) => {
    try {
      await resetUserFailures(userId);
      router.refresh();
    } catch (error) {
      console.error("Error resetting user failures:", error);
    }
  };

  const getStatusBadge = (user: User) => {
    const hasSetup = user.ytmusicCookie && user.lastFmSessionKey;

    if (!hasSetup) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          🔧 Incomplete Setup
        </span>
      );
    }

    if (!user.isActive) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ⏸️ Paused
        </span>
      );
    }

    if (user.consecutiveFailures > 0) {
      const failureEmoji =
        user.lastFailureType === "AUTH"
          ? "🔐"
          : user.lastFailureType === "NETWORK"
            ? "🌐"
            : user.lastFailureType === "TEMPORARY"
              ? "⏱️"
              : "❌";
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {failureEmoji} {user.consecutiveFailures} failures
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        ✅ Active
      </span>
    );
  };

  const getHealthIndicator = (user: User) => {
    const now = new Date();
    const daysSinceLastScrobble = user.lastSuccessfulScrobble
      ? Math.floor(
          (now.getTime() - user.lastSuccessfulScrobble.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    if (!user.lastSuccessfulScrobble) {
      return <span className="text-gray-400">🔘 Never</span>;
    }

    if (daysSinceLastScrobble! <= 1) {
      return <span className="text-green-600">🟢 Very active</span>;
    } else if (daysSinceLastScrobble! <= 7) {
      return <span className="text-yellow-600">🟡 Active</span>;
    } else if (daysSinceLastScrobble! <= 30) {
      return <span className="text-orange-600">🟠 Inactive</span>;
    } else {
      return <span className="text-red-600">🔴 Very inactive</span>;
    }
  };

  const formatTimeAgo = (date: Date | null) => {
    if (!date) return "-";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return "Now";
  };

  const getSetupProgress = (user: User) => {
    let progress = 0;
    let total = 3;

    if (user.ytmusicCookie) progress++;
    if (user.lastFmSessionKey) progress++;
    if (user.isActive) progress++;

    const percentage = (progress / total) * 100;
    const color =
      percentage === 100
        ? "bg-green-500"
        : percentage >= 66
          ? "bg-yellow-500"
          : "bg-red-500";

    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${color}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs text-gray-500">
          {progress}/{total}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Setup
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Scrobbles
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Failures
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                {/* User */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <Image
                      src={user.picture}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p
                        className="text-xs text-gray-500 truncate"
                        title={user.email}
                      >
                        {user.email}
                      </p>
                      {user.lastFmUsername && (
                        <p className="text-xs text-purple-600 truncate">
                          🎧 {user.lastFmUsername}
                        </p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Estado */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-2">
                    {getStatusBadge(user)}
                    <div className="flex items-center space-x-1">
                      {getHealthIndicator(user)}
                    </div>
                  </div>
                </td>

                {/* Setup */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-2">
                    {getSetupProgress(user)}
                    <div className="text-xs space-y-1">
                      <div
                        className={`flex items-center space-x-1 ${user.ytmusicCookie ? "text-green-600" : "text-red-600"}`}
                      >
                        <span>{user.ytmusicCookie ? "✅" : "❌"}</span>
                        <span>YTMusic</span>
                      </div>
                      <div
                        className={`flex items-center space-x-1 ${user.lastFmSessionKey ? "text-green-600" : "text-red-600"}`}
                      >
                        <span>{user.lastFmSessionKey ? "✅" : "❌"}</span>
                        <span>Last.fm</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Actividad */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-gray-500">Last:</span>{" "}
                      <span className="font-medium">
                        {user.lastSuccessfulScrobble
                          ? formatTimeAgo(user.lastSuccessfulScrobble)
                          : "Never"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Registered: {formatTimeAgo(user.createdAt)}
                    </div>
                  </div>
                </td>

                {/* Scrobbles */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    <div className="font-semibold text-indigo-600">
                      {user._count.Songs.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.Songs.length > 0 && (
                        <>Last: {formatTimeAgo(user.Songs[0].addedAt)}</>
                      )}
                    </div>
                  </div>
                </td>

                {/* Plan */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.subscriptionPlan === "pro"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.subscriptionPlan === "pro" ? "👑 Pro" : "🆓 Free"}
                    </span>
                    {user.subscriptionStatus && (
                      <span className="text-xs text-gray-500">
                        {user.subscriptionStatus}
                      </span>
                    )}
                  </div>
                </td>

                {/* Fallos */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {user.consecutiveFailures > 0 ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-red-600">
                          {user.consecutiveFailures} consecutive failures
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.lastFailureType} •{" "}
                          {formatTimeAgo(user.lastFailedAt)}
                        </div>
                        {user.authNotificationCount > 0 && (
                          <div className="text-xs text-orange-600">
                            📧 {user.authNotificationCount} notifications
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-600 text-sm">
                        ✅ No failures
                      </span>
                    )}
                  </div>
                </td>

                {/* Acciones */}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleUserStatusChange(user.id, user.isActive)
                      }
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        user.isActive
                          ? "bg-red-100 text-red-700 hover:bg-red-200"
                          : "bg-green-100 text-green-700 hover:bg-green-200"
                      }`}
                    >
                      {user.isActive ? "⏸️ Pause" : "▶️ Activate"}
                    </button>

                    {user.consecutiveFailures > 0 && (
                      <button
                        onClick={() => handleResetFailures(user.id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        title="Reset consecutive failures"
                      >
                        🔄 Reset
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {users.length} users
            {searchText && (
              <span> • Filtered by: &quot;{searchText}&quot;</span>
            )}
            {typeof status === "boolean" && (
              <span> • Status: {status ? "Active" : "Inactive"}</span>
            )}
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Healthy</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Warning</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>Critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
