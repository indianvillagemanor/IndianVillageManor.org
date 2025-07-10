"use client";

import { useEffect, useState } from "react";

type User = {
  id: string | number;
  name?: string | null;
  email: string;
  emailVerified?: boolean | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  role?: string | null;
};

export default function DemoUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/db/demo_users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Demo Users</h1>
      {loading && <p>Loading users...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Verified</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Updated At</th>
              <th className="border p-2">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.name || <em>(none)</em>}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.emailVerified ? "Yes" : "No"}</td>
                <td className="border p-2">{user.createdAt ? new Date(user.createdAt).toLocaleString() : ""}</td>
                <td className="border p-2">{user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ""}</td>
                <td className="border p-2">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
