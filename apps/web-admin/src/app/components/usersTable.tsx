import React from "react";
import Image from "next/image";

interface User {
  id: string;
  googleId: string;
  name: string;
  email: string;
  isActive: boolean;
  picture: string;
  googleAccessToken: string;
  googleRefreshToken: string | null;
  googleTokenExpires: bigint | null;
  googleIdToken: string | null;
  lastFmSessionKey: string | null;
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
            <td className="px-2 py-2">{user.isActive ? "Yes" : "No"}</td>
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
