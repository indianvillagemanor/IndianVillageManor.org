import Link from 'next/link';

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f0f0]">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">📧</div>
          <div className="text-3xl font-serif text-[#2d5016] mb-2">
            Check your email
          </div>
          <p className="text-gray-600">
            A sign in link has been sent to your email address.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md text-sm mb-6">
          <p className="font-medium mb-2">What to do next:</p>
          <ol className="text-left space-y-1 ml-4">
            <li>1. Check your email inbox</li>
            <li>2. Click the magic link in the email</li>
            <li>3. You&apos;ll be signed in automatically</li>
          </ol>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          <p>The link expires 15 minutes after it is sent.</p>
          <p className="mt-2">Once clicked, the same link stays valid for 30 minutes — so a link preview on your device won&apos;t prevent you from signing in.</p>
          <p className="mt-2">If you don&apos;t see the email, check your spam folder.</p>
        </div>

        <div className="mt-6">
          <Link href="/auth/login" className="text-[#2d5016] hover:underline text-sm font-medium">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
