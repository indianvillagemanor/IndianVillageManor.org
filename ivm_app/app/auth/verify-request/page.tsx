"use client";

import { useEffect, useState } from "react";

// TODO: Make this prettier once the registration/login flow is working
// particularly:
// - Make the page less wordy overall.  
// - Reduce the text of the page to indicate 
// 1) the email has been sent, 
// 2) check your spam folder, 
// 3) make sure you entered the email correctly, 
// 4) register if need be

function sanitizeEmail(email: string) {
  // Only allow basic email characters
  return email.replace(/[^a-zA-Z0-9@._+-]/g, "");
}

export default function VerifyRequestPage() {
  const [safeEmail, setSafeEmail] = useState<string | undefined>();

  useEffect(() => {
    const email = sessionStorage.getItem("ivm_last_login_email");
    if (email) setSafeEmail(sanitizeEmail(email));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Check your email</h1>
        <p className="mb-2">
          A sign-in link has been sent to your email address
          {safeEmail ? (
            <>: <span className="font-mono">{safeEmail}</span></>
          ) : (
            "."
          )}
        </p>
        <p className="mb-2">Please check your inbox and click the link to log in.</p>
        <p className="text-sm text-muted-foreground">
          If you don&apos;t see the email, check your spam or junk folder.
          <br />
          Also, make sure you entered your email address correctly above.
        </p>
      </div>
    </div>
  );
}
