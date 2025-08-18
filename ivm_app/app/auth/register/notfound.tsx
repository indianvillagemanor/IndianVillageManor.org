"use client";
import { useSearchParams } from "next/navigation";

export default function RegisterNotFoundPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Registration Required</h1>
        <p className="mb-4 text-red-600">No user has been registered with this email address. Please register, or check the spelling of the email address.</p>
        <a
          href={`/auth/register?email=${encodeURIComponent(email)}`}
          className="text-blue-600 underline"
        >
          Go to Registration
        </a>
      </div>
    </div>
  );
}
