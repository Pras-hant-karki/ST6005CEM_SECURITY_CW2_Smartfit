export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto py-16 px-4 space-y-6">
      <h1 className="text-2xl font-bold mb-2">Terms of Service</h1>
      <p className="text-gray-600">
        By creating an account on SmartFit, you agree to provide accurate information and to use the platform only
        for legitimate healthcare appointment booking and management.
      </p>
      <h2 className="text-lg font-semibold mt-8">Account responsibility</h2>
      <p className="text-gray-600">
        You are responsible for keeping your password confidential and for all activity that occurs under your
        account. Report any suspected unauthorized access immediately.
      </p>
      <h2 className="text-lg font-semibold mt-8">Appointments &amp; payments</h2>
      <p className="text-gray-600">
        Consultation fees are set by each doctor and charged securely through Stripe at the time of booking.
        Cancellation and rescheduling are available from your appointment details page, subject to the doctor's
        availability.
      </p>
      <h2 className="text-lg font-semibold mt-8">Medical disclaimer</h2>
      <p className="text-gray-600">
        SmartFit is a booking and records platform, not a substitute for professional medical judgment. Always
        follow the advice of your treating doctor.
      </p>
    </div>
  );
}
