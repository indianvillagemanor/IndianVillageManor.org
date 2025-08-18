import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import React from "react";

export default async function WelcomePage() {
  const session = await getServerSession(authOptions);
  const name = session?.user?.name || session?.user?.email || "Resident";
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold mb-4">Welcome, {name}!</h1>
        <p className="mb-4">You have successfully logged in.</p>
        <p className="mb-4">To access resident and owner specific content such as newsletters and the event calendar, use the menu in the upper right corner of the page.</p>
      </div>
    </div>
  );
}
