import { getUsers } from "@/lib/prisma";
import PaginationButtons from "./components/pagination-buttons";
import Filters from "./components/filters";
import UsersTableServer from "./components/users-table.server";
import { Suspense } from "react";
import UsersTableLoading from "./components/users-table.loading";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const page = searchParams?.page || 1;
  const perPage = 10;

  const searchText =
    typeof searchParams?.searchText !== "undefined"
      ? searchParams?.searchText
      : "";

  let status: boolean | string = "";
  if (typeof searchParams?.status !== "undefined") {
    if (searchParams?.status === "true") {
      status = true;
    } else if (searchParams?.status === "false") {
      status = false;
    } else {
      status = "";
    }
  } else {
    status = "";
  }

  const sortColumn =
    typeof searchParams?.sortColumn !== "undefined"
      ? searchParams?.sortColumn
      : "";

  const sortDirection =
    typeof searchParams?.sortDirection !== "undefined"
      ? searchParams?.sortDirection
      : "";

  const data = await getUsers(
    Number(page),
    perPage,
    searchText,
    status,
    sortColumn,
    sortDirection,
  );

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <Filters
        currentPage={Number(page)}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
      <Suspense fallback={<UsersTableLoading />}>
        <UsersTableServer
          page={Number(page)}
          perPage={perPage}
          searchText={searchText}
          status={status}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
        />
      </Suspense>
      <PaginationButtons
        count={data.count}
        currentPage={Number(page)}
        searchText={searchText}
        status={status}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
    </div>
  );
}
