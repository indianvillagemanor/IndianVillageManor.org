"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    // Call API route to verify
    fetch(`/api/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.success);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. Please try again later.");
      });
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
        {status === "verifying" && <p>Verifying your email...</p>}
        {status !== "verifying" && <p>{message}</p>}
      </div>
    </div>
  );
}
