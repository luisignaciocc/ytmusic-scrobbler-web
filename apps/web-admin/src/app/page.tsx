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
  const searchText = searchParams?.searchText;

  const statusParam = searchParams?.status;

  let status: boolean | undefined;
  if (statusParam === "true") {
    status = true;
  } else if (statusParam === "false") {
    status = false;
  } else {
    status = undefined;
  }

  const data = await getUsers(Number(page), perPage, searchText, status);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <Filters />
      <UserTable users={data.users} />
      <PaginationButtons count={data.count} currentPage={Number(page)} />
    </div>
  );
}
