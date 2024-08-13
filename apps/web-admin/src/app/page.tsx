import { getUsers } from "@/lib/prisma";
import UserTable from "./components/usersTable";
import PaginationButtons from "./components/paginationButtons";

export default async function HomePage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const page = searchParams?.page || 1;
  const perPage = 10;
  const data = await getUsers(Number(page), perPage);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <UserTable users={data.users} />
      <PaginationButtons count={data.count} currentPage={Number(page)} />
    </div>
  );
}
