import { getUsers } from "@/lib/prisma";
import UserTable from "./components/usersTable";
import PaginationButtons from "./components/paginationButtons";
import Filters from "./components/filters";

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

  const sortColumn = searchParams?.sortColumn;
  const sortDirection = searchParams?.sortDirection;

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
      <Filters />
      <UserTable users={data.users} searchText={searchText} status={status} />
      <PaginationButtons count={data.count} currentPage={Number(page)} />
    </div>
  );
}
