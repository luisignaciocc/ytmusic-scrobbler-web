import React from "react";
import EnhancedUsersTable from "./enhanced-users-table";
import { getEnhancedUsers } from "@/lib/enhanced-prisma";

interface EnhancedUsersTableServerProps {
  page: number;
  perPage: number;
  searchText: string;
  status: boolean | string;
  subscription: string;
  setup: string;
  health: string;
  activity: string;
  dateRange: string;
  notifications: string;
  sortColumn: string;
  sortDirection: string;
}

async function EnhancedUsersTableServer({
  page,
  perPage,
  searchText,
  status,
  subscription,
  setup,
  health,
  activity,
  dateRange,
  notifications,
  sortColumn,
  sortDirection,
}: EnhancedUsersTableServerProps) {
  const data = await getEnhancedUsers({
    page,
    perPage,
    searchText: searchText || undefined,
    isActive: status,
    subscription: subscription || undefined,
    setup: setup || undefined,
    health: health || undefined,
    activity: activity || undefined,
    dateRange: dateRange || undefined,
    notifications: notifications || undefined,
    sortColumn: sortColumn || undefined,
    sortDirection: sortDirection || undefined,
  });

  return (
    <EnhancedUsersTable
      users={data.users}
      searchText={searchText}
      status={status}
    />
  );
}

export default EnhancedUsersTableServer;