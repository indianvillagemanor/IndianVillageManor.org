"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    // Broadcast login event to other tabs
    if (typeof window !== "undefined") {
      const url = window.location.href;
      // Use BroadcastChannel if available
      if (window.BroadcastChannel) {
        const bc = new BroadcastChannel("ivm-auth");
        bc.postMessage({ type: "auth-login", url });
        bc.close();
      } else {
        // Fallback: use localStorage
        localStorage.setItem("ivm_auth_login", JSON.stringify({ url, ts: Date.now() }));
      }
      // Try to close this tab
      window.close();
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Logging you in...</h1>
        <p>If you are not redirected, you may close this tab and return to your IVM portal.</p>
      </div>
    </div>
  );
}
