"use client";
import React, { Fragment, ChangeEvent, useState } from "react";
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

  const [records, setRecords] = useState(users);
  const [filterByActive, setFilterByActive] = useState<
    "all" | "active" | "inactive"
  >("all");

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

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedFilter = event.target.value as "all" | "active" | "inactive";
    setFilterByActive(selectedFilter);

    if (selectedFilter === "all") {
      setRecords(users);
    } else if (selectedFilter === "active") {
      setRecords(users.filter((user) => user.isActive));
    } else {
      setRecords(users.filter((user) => !user.isActive));
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    let filteredRecords = users;

    if (filterByActive === "active") {
      filteredRecords = users.filter((user) => user.isActive);
    } else if (filterByActive === "inactive") {
      filteredRecords = users.filter((user) => !user.isActive);
    }

    filteredRecords = filteredRecords.filter((user) => {
      return (
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        (user.lastFmUsername &&
          user.lastFmUsername.toLowerCase().includes(query.toLowerCase()))
      );
    });

    setRecords(filteredRecords);
  };

  const sortRecords = (records: User[]) => {
    const sortedRecords = [...records].sort((a, b) => {
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
    setRecords(sortedRecords);
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

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
    sortRecords(records);
  };

  return (
    <Fragment>
      <div className="flex space-x-4 mb-4">
        <select
          value={filterByActive}
          onChange={handleFilterChange}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by email or Last.fm username"
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
          {records.map((user) => (
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
