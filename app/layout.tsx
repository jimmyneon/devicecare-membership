import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'DeviceCare Membership | New Forest Device Repairs',
  description: 'Subscription-based repair credit system for priority access and no upfront costs',
  keywords: ['device repair', 'membership', 'subscription', 'New Forest'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className={poppins.className}>{children}</body>
    </html>
  );
}
