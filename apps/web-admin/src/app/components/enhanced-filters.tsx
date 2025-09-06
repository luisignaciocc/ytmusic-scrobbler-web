"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "use-debounce";

function EnhancedFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const sortColumn = searchParams.get("sortColumn") || "";
  const sortDirection = searchParams.get("sortDirection") || "";

  // Search and basic filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get("searchText") || "");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [filterByActive, setFilterByActive] = useState(searchParams.get("status") || "all");

  // Advanced filters
  const [subscriptionFilter, setSubscriptionFilter] = useState(searchParams.get("subscription") || "all");
  const [setupFilter, setSetupFilter] = useState(searchParams.get("setup") || "all");
  const [healthFilter, setHealthFilter] = useState(searchParams.get("health") || "all");
  const [activityFilter, setActivityFilter] = useState(searchParams.get("activity") || "all");
  const [dateRangeFilter, setDateRangeFilter] = useState(searchParams.get("dateRange") || "all");
  const [notificationsFilter, setNotificationsFilter] = useState(searchParams.get("notifications") || "all");

  // Show/hide advanced filters
  const [showAdvanced, setShowAdvanced] = useState(false);

  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    // Basic params
    params.set("page", "1"); // Reset to page 1 when filtering
    if (debouncedSearchQuery) params.set("searchText", debouncedSearchQuery);
    
    // Status filter
    if (filterByActive === "active") {
      params.set("status", "true");
    } else if (filterByActive === "inactive") {
      params.set("status", "false");
    }
    
    // Advanced filters
    if (subscriptionFilter !== "all") params.set("subscription", subscriptionFilter);
    if (setupFilter !== "all") params.set("setup", setupFilter);
    if (healthFilter !== "all") params.set("health", healthFilter);
    if (activityFilter !== "all") params.set("activity", activityFilter);
    if (dateRangeFilter !== "all") params.set("dateRange", dateRangeFilter);
    if (notificationsFilter !== "all") params.set("notifications", notificationsFilter);
    
    // Preserve sorting
    if (sortColumn) params.set("sortColumn", sortColumn);
    if (sortDirection) params.set("sortDirection", sortDirection);
    
    return params.toString();
  }, [
    debouncedSearchQuery,
    filterByActive,
    subscriptionFilter,
    setupFilter,
    healthFilter,
    activityFilter,
    dateRangeFilter,
    notificationsFilter,
    sortColumn,
    sortDirection
  ]);

  const applyFilters = useCallback(() => {
    const queryString = buildQueryParams();
    router.push(`?${queryString}`);
  }, [router, buildQueryParams]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setFilterByActive("all");
    setSubscriptionFilter("all");
    setSetupFilter("all");
    setHealthFilter("all");
    setActivityFilter("all");
    setDateRangeFilter("all");
    setNotificationsFilter("all");
    router.push(`?page=1&sortColumn=${sortColumn}&sortDirection=${sortDirection}`);
  };

  const hasActiveFilters = () => {
    return (
      searchQuery ||
      filterByActive !== "all" ||
      subscriptionFilter !== "all" ||
      setupFilter !== "all" ||
      healthFilter !== "all" ||
      activityFilter !== "all" ||
      dateRangeFilter !== "all" ||
      notificationsFilter !== "all"
    );
  };

  // Auto-apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Check if there are advanced filters applied to show the section
  useEffect(() => {
    const hasAdvancedFilters = 
      subscriptionFilter !== "all" ||
      setupFilter !== "all" ||
      healthFilter !== "all" ||
      activityFilter !== "all" ||
      dateRangeFilter !== "all" ||
      notificationsFilter !== "all";
    
    if (hasAdvancedFilters) {
      setShowAdvanced(true);
    }
  }, [subscriptionFilter, setupFilter, healthFilter, activityFilter, dateRangeFilter, notificationsFilter]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-gray-900">🔍 Filters and Search</h3>
          {hasActiveFilters() && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {[
                searchQuery && "Search",
                filterByActive !== "all" && "Status",
                subscriptionFilter !== "all" && "Subscription",
                setupFilter !== "all" && "Setup",
                healthFilter !== "all" && "Health",
                activityFilter !== "all" && "Activity",
                dateRangeFilter !== "all" && "Date",
                notificationsFilter !== "all" && "Notifications"
              ].filter(Boolean).join(", ")} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
          >
            <span>{showAdvanced ? "🔼 Hide advanced" : "🔽 Advanced filters"}</span>
          </button>
          {hasActiveFilters() && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center space-x-1"
            >
              <span>✖️ Clear all</span>
            </button>
          )}
        </div>
      </div>

      {/* Basic Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search by email, Last.fm username, or name..."
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✖️
            </button>
          )}
        </div>

        {/* Basic Status Filter */}
        <div>
          <select
            value={filterByActive}
            onChange={(e) => setFilterByActive(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">📊 All statuses</option>
            <option value="active">✅ Active only</option>
            <option value="inactive">❌ Inactive only</option>
          </select>
        </div>

        {/* Activity Quick Filter */}
        <div>
          <select
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">🎵 All activity</option>
            <option value="recent">🔥 Recent active (7d)</option>
            <option value="inactive_30d">😴 Inactive 30+ days</option>
            <option value="no_scrobbles">🚫 No scrobbles</option>
            <option value="high_activity">⭐ High activity (100+)</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters Section */}
      {showAdvanced && (
        <div className="border-t pt-4 space-y-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Filters</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Subscription Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">💳 Subscription</label>
              <select
                value={subscriptionFilter}
                onChange={(e) => setSubscriptionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="free">🆓 Free</option>
                <option value="pro">⭐ Pro</option>
                <option value="active_subscription">✅ Active subscription</option>
                <option value="canceled">❌ Canceled</option>
                <option value="trial">🎯 Trial</option>
              </select>
            </div>

            {/* Setup Completion Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">⚙️ Setup</label>
              <select
                value={setupFilter}
                onChange={(e) => setSetupFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="complete">✅ Complete</option>
                <option value="incomplete">⚠️ Incomplete</option>
                <option value="no_cookie">🍪 No YTMusic cookie</option>
                <option value="no_lastfm">🎵 No Last.fm</option>
              </select>
            </div>

            {/* Health Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">🏥 Health status</label>
              <select
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="healthy">💚 Healthy</option>
                <option value="warnings">⚠️ With warnings</option>
                <option value="errors">❌ With errors</option>
                <option value="auth_failures">🔐 Auth failures</option>
                <option value="network_failures">🌐 Network failures</option>
              </select>
            </div>

            {/* Registration Date Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">📅 Registered</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Any date</option>
                <option value="today">🔥 Today</option>
                <option value="week">📅 This week</option>
                <option value="month">📅 This month</option>
                <option value="quarter">📅 Last 3 months</option>
                <option value="year">📅 This year</option>
                <option value="older">📅 More than 1 year</option>
              </select>
            </div>

            {/* Notifications Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">🔔 Notifications</label>
              <select
                value={notificationsFilter}
                onChange={(e) => setNotificationsFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="enabled">🔔 Enabled</option>
                <option value="disabled">🔕 Disabled</option>
                <option value="high_notifications">⚠️ Many notifications</option>
                <option value="recent_notifications">📧 Recently notified</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter Summary */}
      {hasActiveFilters() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-blue-800">
              <strong>Filters applied:</strong> Showing users that match the selected criteria
            </span>
            <button
              onClick={clearAllFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedFilters;