import Filters from "./components/filters";
import UsersTable from "./components/users-table";
import PaginationButtonsServer from "./components/pagination-buttons.server";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <Filters />
      <UsersTable urlParams={searchParams} />
      <PaginationButtonsServer urlParams={searchParams} />
    </div>
  );
}
