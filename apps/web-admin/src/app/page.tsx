import Filters from "./components/filters";
import UsersTable from "./components/users-table";
import PaginationButtonsServer from "./components/pagination-buttons.server";
import StatsCards from "./components/stats-cards";
import { Suspense } from "react";
import FiltersLoading from "./components/filters.loading";
import PaginationButtonsLoading from "./components/pagination-buttons.loading";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <StatsCards />
      <div className="flex items-center justify-between space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">Users</h3>
      </div>
      <Suspense fallback={<FiltersLoading />}>
        <Filters />
      </Suspense>
      <UsersTable urlParams={searchParams} />
      <Suspense fallback={<PaginationButtonsLoading />}>
        <PaginationButtonsServer urlParams={searchParams} />
      </Suspense>
    </div>
  );
}
