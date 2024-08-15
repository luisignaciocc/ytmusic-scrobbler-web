import React from "react";
import PaginationButtons from "./pagination-buttons";
import getSearchParams from "../utils/getSearchParams";
import { getUsers } from "@/lib/prisma";

interface PaginationButtonsServerProps {
  urlParams?: {
    [key: string]: string | undefined;
  };
}

async function PaginationButtonsServer({
  urlParams,
}: PaginationButtonsServerProps) {
  const { page, perPage, searchText, status, sortColumn, sortDirection } =
    getSearchParams(urlParams || {});

  const data = await getUsers(
    Number(page),
    perPage,
    searchText,
    status,
    sortColumn,
    sortDirection,
  );

  return <PaginationButtons count={data.count} />;
}

export default PaginationButtonsServer;
