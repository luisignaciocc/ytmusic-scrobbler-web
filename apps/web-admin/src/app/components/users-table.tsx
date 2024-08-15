import React from "react";
import { Suspense } from "react";
import UsersTableLoading from "./users-table.loading";
import UsersTableServer from "./users-table.server";
import getSearchParams from "../utils/getSearchParams";

interface UsersTableProps {
  urlParams?: {
    [key: string]: string | undefined;
  };
}

function UsersTable({ urlParams }: UsersTableProps) {
  const { page, perPage, searchText, status, sortColumn, sortDirection } =
    getSearchParams(urlParams || {});

  return (
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
  );
}

export default UsersTable;
