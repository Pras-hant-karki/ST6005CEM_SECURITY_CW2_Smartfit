export default function Privacy() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-600">
        SmartFit collects the personal information you provide directly — name, email, phone number, date of birth,
        gender, and, where relevant, medical appointment and prescription details — solely to provide healthcare
        appointment booking and management services.
      </p>
      <h2 className="text-lg font-semibold mt-8">How your data is protected</h2>
      <p className="text-gray-600">
        Passwords and one-time verification codes are hashed and never stored in plain text. Sessions are secured
        with HttpOnly cookies that cannot be read by page scripts. Payments are processed entirely by Stripe — SmartFit
        never receives or stores your card details.
      </p>
      <h2 className="text-lg font-semibold mt-8">Your rights</h2>
      <p className="text-gray-600">
        You can download a copy of your stored data or permanently delete your account at any time from your{" "}
        <a href="/profile/updateprofile" className="text-emerald-600 underline">profile settings</a>.
      </p>
      <h2 className="text-lg font-semibold mt-8">Sharing</h2>
      <p className="text-gray-600">
        Your data is never sold or shared with third parties beyond what is strictly required to operate the
        platform (e.g. Stripe for payments, our email provider for OTP and appointment notifications).
      </p>
    </div>
  );
}
