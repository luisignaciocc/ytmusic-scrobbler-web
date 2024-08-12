import { getUsers } from "@/lib/prisma";
import UserTable from "./components/usersTable";

export default async function HomePage() {
  const data = await getUsers(1, 10);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <UserTable users={data.users} />
    </div>
  );
}
