import React from "react";
import { Suspense } from "react";
import UsersTableLoading from "./users-table.loading";
import EnhancedUsersTableServer from "./enhanced-users-table.server";
import getSearchParams from "../utils/getSearchParams";

interface UsersTableProps {
  urlParams?: {
    [key: string]: string | undefined;
  };
}

function UsersTable({ urlParams }: UsersTableProps) {
  const { 
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
    sortDirection 
  } = getSearchParams(urlParams || {});

  return (
    <Suspense fallback={<UsersTableLoading />}>
      <EnhancedUsersTableServer
        page={Number(page)}
        perPage={perPage}
        searchText={searchText}
        status={status}
        subscription={subscription}
        setup={setup}
        health={health}
        activity={activity}
        dateRange={dateRange}
        notifications={notifications}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
      />
    </Suspense>
  );
}

export default UsersTable;
