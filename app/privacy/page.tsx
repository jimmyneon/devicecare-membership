import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-ivory py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-primary hover:text-primary-dark mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-GB')}
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700 mb-4">
              We collect information you provide when signing up for DeviceCare Membership, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Name and contact information (email, phone number)</li>
              <li>Payment information (processed securely by Stripe)</li>
              <li>Device repair history and preferences</li>
              <li>Membership tier and credit balance</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Process your membership and payments</li>
              <li>Provide repair services and manage your credit balance</li>
              <li>Send important updates about your membership</li>
              <li>Improve our services and customer experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Payment Information</h2>
            <p className="text-gray-700 mb-4">
              All payment information is processed securely by Stripe. We never store your full card details on our servers. 
              Stripe is PCI-DSS compliant and uses industry-standard encryption.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We only share data with:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Stripe (for payment processing)</li>
              <li>Service providers who help us operate our business</li>
              <li>Law enforcement when required by law</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate security measures to protect your personal information. This includes encryption, 
              secure servers, and regular security audits.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 mb-4">
              Under UK GDPR, you have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Request data portability</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as your membership is active and for a reasonable period afterwards 
              to comply with legal obligations and resolve disputes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies</h2>
            <p className="text-gray-700 mb-4">
              We use essential cookies to operate our website and provide membership services. We do not use tracking 
              cookies for advertising purposes.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this privacy policy from time to time. We will notify you of significant changes via email.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For privacy-related questions or to exercise your rights, contact us at{' '}
              <a href="mailto:nfdrepairs@gmail.com" className="text-primary hover:text-primary-dark">
                nfdrepairs@gmail.com
              </a>
            </p>
            <p className="text-gray-700 mb-4">
              New Forest Device Repairs<br />
              Lymington, Hampshire<br />
              United Kingdom
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
