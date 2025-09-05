import EnhancedFilters from "./components/enhanced-filters";
import UsersTable from "./components/users-table";
import PaginationButtonsServer from "./components/pagination-buttons.server";
import EnhancedStats from "./components/enhanced-stats";
import ExternalStats from "./components/external-stats";
import { Suspense } from "react";
import FiltersLoading from "./components/filters.loading";
import PaginationButtonsLoading from "./components/pagination-buttons.loading";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            🎵 YTMusic Scrobbler Admin
          </h2>
          <p className="text-gray-600 mt-1">
            System administration and monitoring panel
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>🔄 Updated:</span>
          <span>{new Date().toLocaleTimeString('en-US')}</span>
        </div>
      </div>
      
      <EnhancedStats />
      
      <ExternalStats />
      
      <div className="flex items-center justify-between border-t pt-6">
        <h3 className="text-2xl font-bold tracking-tight text-gray-900">
          👥 User Management
        </h3>
        <div className="text-sm text-gray-500">
          Manage and monitor the status of all users
        </div>
      </div>
      
      <Suspense fallback={<FiltersLoading />}>
        <EnhancedFilters />
      </Suspense>
      
      <UsersTable urlParams={searchParams} />
      
      <Suspense fallback={<PaginationButtonsLoading />}>
        <PaginationButtonsServer urlParams={searchParams} />
      </Suspense>
    </div>
  );
}
