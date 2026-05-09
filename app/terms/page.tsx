import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-ivory py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-GB')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Membership Agreement</h2>
            <p className="text-gray-700 mb-4">
              By subscribing to DeviceCare Membership, you agree to pay the monthly subscription fee for your chosen tier. 
              Your subscription will automatically renew each month until cancelled.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Credit System</h2>
            <p className="text-gray-700 mb-4">
              Monthly credits are added to your account based on your subscription tier. Credits can be used to pay for 
              labour costs on device repairs. Credits expire 12 months after they are issued and roll over month to month 
              within this period.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Parts Payment</h2>
            <p className="text-gray-700 mb-4">
              Parts costs are always paid separately and are not covered by membership credits. Only labour costs can be 
              paid using your credit balance.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Negative Balance & Trust</h2>
            <p className="text-gray-700 mb-4">
              After maintaining an active membership for 3-12 months, you may be eligible to use services that exceed your 
              current credit balance (negative balance). This is at our discretion and based on your payment history. 
              Negative balances must be repaid through future monthly credits or top-ups.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Top-Ups</h2>
            <p className="text-gray-700 mb-4">
              You may top up your credit balance at any time. Top-up credits follow the same 12-month expiry policy as 
              monthly subscription credits.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Cancellation</h2>
            <p className="text-gray-700 mb-4">
              You may cancel your membership at any time. Upon cancellation, you will retain access to your remaining 
              credits until they expire. No refunds are provided for unused credits or partial months.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Priority Service</h2>
            <p className="text-gray-700 mb-4">
              Active members receive priority queue access for repairs. This means your repairs will be processed ahead 
              of non-members when possible, subject to parts availability and repair complexity.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. Members will be notified of significant changes 
              via email. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Contact</h2>
            <p className="text-gray-700 mb-4">
              For questions about these terms, please contact us at{' '}
              <a href="mailto:nfdrepairs@gmail.com" className="text-primary hover:text-primary-dark">
                nfdrepairs@gmail.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
