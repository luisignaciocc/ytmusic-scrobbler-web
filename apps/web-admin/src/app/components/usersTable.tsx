"use client";
import React, { Fragment, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { updateUserStatus } from "@/lib/prisma";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  picture: string;
  lastFmUsername: string | null;
  lastSuccessfulScrobble: Date | null;
  createdAt: Date;
}

interface UserTableProps {
  users: User[];
}

function UserTable({ users }: UserTableProps) {
  const router = useRouter();

  const [filterByActive, setFilterByActive] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [sortColumn, setSortColumn] = useState<
    | "email"
    | "lastFmUsername"
    | "isActive"
    | "lastSuccessfulScrobble"
    | "createdAt"
  >("email");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive);
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const sortRecords = useCallback(
    (users: User[]): User[] => {
      return users.sort((a, b) => {
        switch (sortColumn) {
          case "email":
            if (a.email.toLowerCase() < b.email.toLowerCase())
              return sortDirection === "asc" ? -1 : 1;
            if (a.email.toLowerCase() > b.email.toLowerCase())
              return sortDirection === "asc" ? 1 : -1;
            break;

          case "lastFmUsername":
            if (
              (a.lastFmUsername ?? "").toLowerCase() <
              (b.lastFmUsername ?? "").toLowerCase()
            )
              return sortDirection === "asc" ? -1 : 1;
            if (
              (a.lastFmUsername ?? "").toLowerCase() >
              (b.lastFmUsername ?? "").toLowerCase()
            )
              return sortDirection === "asc" ? 1 : -1;
            break;

          case "isActive":
            if (a.isActive === b.isActive) return 0;
            return a.isActive
              ? sortDirection === "asc"
                ? -1
                : 1
              : sortDirection === "asc"
                ? 1
                : -1;

          case "lastSuccessfulScrobble":
            if (a.lastSuccessfulScrobble && b.lastSuccessfulScrobble) {
              if (
                a.lastSuccessfulScrobble.getTime() <
                b.lastSuccessfulScrobble.getTime()
              )
                return sortDirection === "asc" ? -1 : 1;
              if (
                a.lastSuccessfulScrobble.getTime() >
                b.lastSuccessfulScrobble.getTime()
              )
                return sortDirection === "asc" ? 1 : -1;
            } else if (a.lastSuccessfulScrobble) {
              return sortDirection === "asc" ? -1 : 1;
            } else if (b.lastSuccessfulScrobble) {
              return sortDirection === "asc" ? 1 : -1;
            }
            break;

          case "createdAt":
            if (a.createdAt.getTime() < b.createdAt.getTime())
              return sortDirection === "asc" ? -1 : 1;
            if (a.createdAt.getTime() > b.createdAt.getTime())
              return sortDirection === "asc" ? 1 : -1;
            break;
        }

        return 0;
      });
    },
    [sortColumn, sortDirection],
  );

  const handleColumnClick = (
    column:
      | "email"
      | "lastFmUsername"
      | "isActive"
      | "lastSuccessfulScrobble"
      | "createdAt",
  ) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedUsers = useMemo(
    () => sortRecords([...users]),
    [users, sortRecords],
  );

  const handleFilterAndSearch = (
    newSearchQuery = "",
    newFilterByActive = filterByActive,
  ) => {
    let queryParams = "";

    queryParams += `?searchText=${newSearchQuery}`;

    let statusParam;
    if (newFilterByActive === "active") {
      statusParam = "true";
    } else if (newFilterByActive === "inactive") {
      statusParam = "false";
    } else {
      statusParam = "";
    }

    queryParams += queryParams
      ? `&status=${statusParam}`
      : `?status=${statusParam}`;

    router.push(queryParams);
  };

  const handleSearch = () => {
    handleFilterAndSearch(searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    handleFilterAndSearch("");
  };

  const handleFilterChange = (newFilterValue: string) => {
    setFilterByActive(newFilterValue);
    handleFilterAndSearch(searchQuery, newFilterValue);
  };

  return (
    <Fragment>
      <div className="flex space-x-4 mb-4">
        <select
          value={filterByActive}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="relative w-1/3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search by email or Last.fm username"
            className="w-full px-4 py-2 pr-12 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleClearSearch}
            className="absolute top-0 z-50 right-24 h-full text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
          <button
            onClick={handleSearch}
            className="absolute top-0 right-0 h-full px-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Buscar
          </button>
        </div>
      </div>
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-2">Picture</th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleColumnClick("email")}
            >
              Email{" "}
              {sortColumn === "email" && (
                <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleColumnClick("lastFmUsername")}
            >
              Last.fm Username{" "}
              {sortColumn === "lastFmUsername" && (
                <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleColumnClick("isActive")}
            >
              Is Active{" "}
              {sortColumn === "isActive" && (
                <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleColumnClick("lastSuccessfulScrobble")}
            >
              Last Successful Scrobble{" "}
              {sortColumn === "lastSuccessfulScrobble" && (
                <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
            <th
              className="px-4 py-2 cursor-pointer"
              onClick={() => handleColumnClick("createdAt")}
            >
              Created At{" "}
              {sortColumn === "createdAt" && (
                <span>{sortDirection === "asc" ? "▲" : "▼"}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((user) => (
            <tr key={user.id} className="border-b">
              <td className="px-4 py-2">
                <Image
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full"
                  width={20}
                  height={20}
                ></Image>
              </td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.lastFmUsername}</td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={user.isActive}
                  onChange={() =>
                    handleUserStatusChange(user.id, user.isActive)
                  }
                />
              </td>
              <td className="px-4 py-2">
                {user.lastSuccessfulScrobble?.toLocaleString() || "-"}
              </td>
              <td className="px-4 py-2">{user.createdAt.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Fragment>
  );
}

export default UserTable;
