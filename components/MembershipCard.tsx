'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Maximize2, Wallet, Smartphone } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Member } from '@/types';
import Image from 'next/image';

interface MembershipCardProps {
  member: Member;
}

export default function MembershipCard({ member }: MembershipCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      const memberUrl = `${window.location.origin}/staff/member/${member.id}`;
      
      QRCode.toCanvas(
        canvasRef.current,
        memberUrl,
        {
          width: 200,
          margin: 2,
          color: {
            dark: '#1f3d2b',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [member.id]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `devicecare-card-${member.id}.png`;
      link.href = url;
      link.click();
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleAddToAppleWallet = async () => {
    // Call API to generate Apple Wallet pass
    try {
      const response = await fetch('/api/wallet/apple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'devicecare-membership.pkpass';
        link.click();
      }
    } catch (error) {
      console.error('Failed to add to Apple Wallet:', error);
      alert('Failed to add to Apple Wallet. Please try again.');
    }
  };

  const handleAddToGoogleWallet = async () => {
    // Call API to generate Google Wallet pass
    try {
      const response = await fetch('/api/wallet/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        // Open Google Wallet save URL
        window.open(data.saveUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to add to Google Wallet:', error);
      alert('Failed to add to Google Wallet. Please try again.');
    }
  };

  const getStatusColor = () => {
    switch (member.membership_status) {
      case 'ACTIVE':
        return 'bg-green-500';
      case 'GRACE':
        return 'bg-yellow-500';
      case 'LOCKED':
      case 'CANCELLED':
        return 'bg-red-500';
      case 'PAUSED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const CardContent = () => (
    <div className={`relative bg-gradient-to-br from-forest-800 via-forest-700 to-forest-900 rounded-2xl shadow-2xl overflow-hidden ${
      isFullscreen ? 'w-full h-full flex items-center justify-center p-8' : 'p-8'
    }`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              DeviceCare
            </h2>
            <p className="text-forest-100 text-sm">
              Membership Card
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`} />
        </div>

        <div className="bg-white rounded-xl p-6 mb-6 flex items-center justify-center">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        <div className="space-y-3 text-white">
          <div>
            <p className="text-forest-200 text-xs uppercase tracking-wide mb-1">
              Member Name
            </p>
            <p className="text-lg font-semibold">
              {member.full_name || 'Member'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-forest-200 text-xs uppercase tracking-wide mb-1">
                Credit Balance
              </p>
              <p className="text-xl font-bold">
                {formatCurrency(member.current_credit_balance)}
              </p>
            </div>
            <div>
              <p className="text-forest-200 text-xs uppercase tracking-wide mb-1">
                Status
              </p>
              <p className="text-sm font-semibold">
                {member.membership_status}
              </p>
            </div>
          </div>

          <div>
            <p className="text-forest-200 text-xs uppercase tracking-wide mb-1">
              Member ID
            </p>
            <p className="text-xs font-mono opacity-75">
              {member.id.substring(0, 8).toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 text-white hover:text-forest-200 text-sm"
        >
          Close ✕
        </button>
        <div className="max-w-2xl w-full">
          <CardContent />
        </div>
      </div>
    );
  }

  return (
    <div>
      <CardContent />
      
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={handleFullscreen}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
        <button
          onClick={handleDownload}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Wallet Buttons */}
      <div className="mt-4 space-y-3">
        <p className="text-sm font-medium text-gray-700 text-center">
          Add to your mobile wallet
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAddToAppleWallet}
            className="bg-black hover:bg-gray-800 text-white rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            <span className="text-sm font-medium">Apple Wallet</span>
          </button>

          <button
            onClick={handleAddToGoogleWallet}
            className="bg-white hover:bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Google Pay</span>
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-forest-600 mt-4">
        Scan this QR code in-store for instant access
      </p>
    </div>
  );
}
