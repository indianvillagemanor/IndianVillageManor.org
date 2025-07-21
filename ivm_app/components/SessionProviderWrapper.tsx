"use client";
import { SessionProvider } from "next-auth/react";

import { useEffect } from "react";

export default function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleAuthLogin(event: {data : {type: string}}) {
      if (event?.data?.type === "auth-login") {
        // Reload or redirect to homepage after login event
        window.location.href = "/";
      }
    }
    // Listen for BroadcastChannel
    let bc: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && window.BroadcastChannel) {
      bc = new BroadcastChannel("ivm-auth");
      bc.onmessage = handleAuthLogin;
    }
    // Fallback: listen for localStorage events
    function handleStorage(e: StorageEvent) {
      if (e.key === "ivm_auth_login" && e.newValue) {
        window.location.href = "/";
      }
    }
    window.addEventListener("storage", handleStorage);
    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);
  return <SessionProvider>{children}</SessionProvider>;
}
