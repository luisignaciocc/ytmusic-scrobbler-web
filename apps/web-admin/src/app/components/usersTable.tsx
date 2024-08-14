"use client";
import React, { useState, useMemo, useCallback } from "react";
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
  searchText: string | undefined;
  status: boolean | string;
}

function UserTable({ users, searchText, status }: UserTableProps) {
  const router = useRouter();

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive);
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const [sortColumn, setSortColumn] = useState<
    | "email"
    | "lastFmUsername"
    | "isActive"
    | "lastSuccessfulScrobble"
    | "createdAt"
  >("email");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleColumnClick = (
    column:
      | "email"
      | "lastFmUsername"
      | "isActive"
      | "lastSuccessfulScrobble"
      | "createdAt",
  ) => {
    let newSortDirection: "asc" | "desc" = "asc";
    if (column === sortColumn) {
      newSortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      newSortDirection = "asc";
    }

    const queryParams = `?searchText=${searchText}&status=${status}&sortColumn=${column}&sortDirection=${newSortDirection}`;
    router.push(queryParams);

    setSortColumn(column);
    setSortDirection(newSortDirection);
  };

  return (
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
        {users.map((user) => (
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
                onChange={() => handleUserStatusChange(user.id, user.isActive)}
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
  );
}

export default UserTable;
