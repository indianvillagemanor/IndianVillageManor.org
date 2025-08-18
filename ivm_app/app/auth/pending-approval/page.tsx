"use client";
import { useSearchParams } from "next/navigation";

export default function PendingApprovalPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Registration Pending Approval</h1>
        <p className="mb-4">Your registration for <b>{email}</b> is pending association approval.</p>
        <p>Please be patient; you will be notified by email once approved.</p>
      </div>
    </div>
  );
}
