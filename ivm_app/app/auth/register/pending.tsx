export default function RegistrationPendingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white dark:bg-card p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Registration Submitted</h1>
        <p>Your registration has been received and will be verified by the association.</p>
        <p>Please check your email for more information.</p>
      </div>
    </div>
  );
}
