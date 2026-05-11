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

      <div className="mt-6">
        <button
          onClick={handleFullscreen}
          className="btn-secondary w-full flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Fullscreen
        </button>
      </div>

      <p className="text-center text-sm text-forest-600 mt-4">
        Scan this QR code in-store for instant access
      </p>
    </div>
  );
}
