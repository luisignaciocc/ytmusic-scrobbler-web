"use client";
import React from "react";
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
  updatedAt: Date;
  deletedAt: Date | null;
}

interface UserTableProps {
  users: User[];
}

function UserTable({ users }: UserTableProps) {
  const router = useRouter();

  const handleUserStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await updateUserStatus(userId, isActive);
      router.refresh();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  return (
    <table className="w-full table-auto">
      <thead>
        <tr className="text-left">
          <th className="px-2 py-2">Picture</th>
          <th className="px-2 py-2">Email</th>
          <th className="px-2 py-2">Last.fm Username</th>
          <th className="px-2 py-2">Is Active</th>
          <th className="px-2 py-2">Last Successful Scrobble</th>
          <th className="px-2 py-2">Created At</th>
          <th className="px-2 py-2">Deleted At</th>
          <th className="px-2 py-2">Updated At</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-b">
            <td className="px-2 py-2">
              <Image
                src={user.picture}
                alt={user.name}
                className="w-10 h-10 rounded-full"
                width={20}
                height={20}
              ></Image>
            </td>
            <td className="px-2 py-2">{user.email}</td>
            <td className="px-2 py-2">{user.lastFmUsername}</td>
            <td className="px-2 py-2">
              <input
                type="checkbox"
                checked={user.isActive}
                onChange={() => handleUserStatusChange(user.id, user.isActive)}
              />
            </td>
            <td className="px-2 py-2">
              {user.lastSuccessfulScrobble?.toLocaleString() || "-"}
            </td>
            <td className="px-2 py-2">{user.createdAt.toLocaleString()}</td>
            <td className="px-2 py-2">
              {user.deletedAt?.toLocaleString() || "-"}
            </td>
            <td className="px-2 py-2">{user.updatedAt.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default UserTable;
