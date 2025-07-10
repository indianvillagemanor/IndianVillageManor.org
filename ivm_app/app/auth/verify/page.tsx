"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState<string>("");
  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }
    fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus("success");
          setMessage(data.success);
          // Broadcast login event to other tabs
          if (typeof window !== "undefined") {
            const url = window.location.href;
            if (window.BroadcastChannel) {
              const bc = new BroadcastChannel("ivm-auth");
              bc.postMessage({ type: "auth-login", url });
              bc.close();
            } else {
              localStorage.setItem("ivm_auth_login", JSON.stringify({ url, ts: Date.now() }));
            }
            window.close();
          }
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
