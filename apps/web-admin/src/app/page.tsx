import { getUsers } from "@/lib/prisma";
import UserTable from "./components/usersTable";

export default async function HomePage() {
  const users = await getUsers();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
      </div>
      <UserTable users={users} />
    </div>
  );
}
