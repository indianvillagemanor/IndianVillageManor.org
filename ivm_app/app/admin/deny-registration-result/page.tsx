"use client";
import { useSearchParams } from "next/navigation";

export default function RegistrationDeniedPage() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Registration Denied</h1>
        {success && (
          <p className="mb-4 text-red-700">{success}</p>
        )}
        {error && (
          <p className="mb-4 text-red-600">{error}</p>
        )}
        <p>If you believe this is a mistake, please contact the association for assistance.</p>
      </div>
    </div>
  );
}
