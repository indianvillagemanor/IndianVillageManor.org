"use client";
import { useSearchParams } from "next/navigation";

export default function RegistrationApprovalResultPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const email = searchParams.get("email");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Registration Approval</h1>
        {success && (
          <>
            <p className="mb-4 text-green-700">{success}</p>
            {email && (
              <p className="mb-4">An email has been sent to <span className="font-mono">{email}</span> with a login link.</p>
            )}
          </>
        )}
        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
