import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield, Zap, Clock, CreditCard } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Hero Section with Image Background */}
      <div className="relative h-[600px] overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image 
            src="https://images.unsplash.com/photo-1556656793-08538906a9f8?q=80&w=2070&auto=format&fit=crop"
            alt="Device Repair" 
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary-dark/90 z-10"></div>
        </div>
        
        {/* Content */}
        <div className="container mx-auto px-4 relative z-20 h-full flex items-center">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white animate-[fadeInUp_0.6s_ease-out]">
              Never Get Caught Short on Repairs Again
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-white/95 font-light leading-relaxed animate-[fadeInUp_0.6s_ease-out_0.2s_both]">
              Build credit monthly. Pay for labour with your balance. Get priority service. We trust you when you need it most.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-[fadeInUp_0.6s_ease-out_0.4s_both]">
              <Link href="/onboarding" className="group bg-secondary hover:bg-secondary-light text-gray-900 inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 font-semibold transition-all shadow-lg hover:shadow-2xl hover:scale-105">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/login" className="group bg-white/10 backdrop-blur-md border-2 border-white/80 text-white hover:bg-white hover:text-primary inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 font-semibold transition-all hover:border-white">
                Member Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-glass hover:shadow-hover transition-all duration-300 hover:-translate-y-1 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Build Credit Monthly
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Your subscription builds up credit that rolls over. Use it to pay for labour costs on any repair.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-glass hover:shadow-hover transition-all duration-300 hover:-translate-y-1 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                We Trust You
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                After 3-12 months, go into negative balance for big repairs. We trust loyal members.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-glass hover:shadow-hover transition-all duration-300 hover:-translate-y-1 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-light rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Priority Service
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Members jump the queue. Get your devices repaired faster with priority access.
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-glass hover:shadow-hover transition-all duration-300 hover:-translate-y-1 border border-white/50">
              <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-gray-900" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Top Up Anytime
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Need more credit? Top up your account whenever you like for bigger repairs.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-black mb-6 text-center">
              How It Works
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Choose Your Plan</h4>
                  <p className="text-gray-600">
                    Pick from £10, £25, £50, or £100 monthly plans. Your subscription builds credit every month.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Credit Builds & Rolls Over</h4>
                  <p className="text-gray-600">
                    Your credit accumulates monthly and rolls over for 12 months. Top up anytime for bigger repairs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Use Credit for Labour</h4>
                  <p className="text-gray-600">
                    Pay for labour with your credit balance. Parts are paid separately. Never get caught short again.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">Build Trust, Get Advances</h4>
                  <p className="text-gray-600">
                    After 3-12 months, we trust you with negative balance for big repairs. Show your card/NFC tag in-store.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200 text-center">
              <Link href="/onboarding" className="bg-primary text-white hover:bg-primary-dark inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-medium transition-all shadow-md">
                Join DeviceCare Today
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          <div className="mt-12 text-center bg-white rounded-lg p-6 shadow-md">
            <p className="text-gray-700">
              Questions? Contact us at{' '}
              <a href="mailto:support@newforestdevicerepairs.co.uk" className="text-primary hover:text-primary-dark font-medium">
                support@newforestdevicerepairs.co.uk
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
