import React from "react";
import EnhancedUsersTable from "./enhanced-users-table";
import { getUsers } from "@/lib/prisma";

interface UsersTableServerProps {
  page: number;
  perPage: number;
  searchText: string | undefined;
  status: boolean | string;
  sortColumn: string | undefined;
  sortDirection: string | undefined;
}

async function UsersTableServer({
  page,
  perPage,
  searchText,
  status,
  sortColumn,
  sortDirection,
}: UsersTableServerProps) {
  const data = await getUsers(
    Number(page),
    perPage,
    searchText,
    status,
    sortColumn,
    sortDirection,
  );

  return (
    <EnhancedUsersTable
      users={data.users}
      searchText={searchText}
      status={status}
    />
  );
}

export default UsersTableServer;
