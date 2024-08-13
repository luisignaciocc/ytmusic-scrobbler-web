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

  return (
    <Fragment>
      <select
        value={filterByActive}
        onChange={handleFilterChange}
        className="px-4 py-2 mt-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <table className="w-full table-auto">
        <thead>
          <tr className="text-left">
            <th className="px-4 py-2">Picture</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Last.fm Username</th>
            <th className="px-4 py-2">Is Active</th>
            <th className="px-4 py-2">Last Successful Scrobble</th>
            <th className="px-4 py-2">Created At</th>
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
