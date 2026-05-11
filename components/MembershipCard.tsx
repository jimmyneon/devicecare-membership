'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Maximize2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Member } from '@/types';

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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
    <div className={`relative bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden ${
      isFullscreen ? 'w-full max-w-md mx-auto' : ''
    }`}>
      {/* Header */}
      <div className="bg-forest-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              DeviceCare
            </h2>
            <p className="text-forest-100 text-xs flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              {member.membership_status === 'ACTIVE' ? 'Priority Member' : member.membership_status}
            </p>
          </div>
          <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        </div>
      </div>

      {/* QR Code */}
      <div className="bg-gray-50 p-8 flex items-center justify-center">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
      </div>

      {/* Member Info */}
      <div className="px-6 py-4">
        <p className="font-semibold text-gray-900 mb-1">
          {member.full_name || 'Member'}
        </p>
        <p className="text-xs text-gray-500">
          Member ID: {member.id.substring(0, 8).toUpperCase()}
        </p>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
        <button
          onClick={handleFullscreen}
          className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 rounded-full text-3xl font-light transition-colors"
          aria-label="Close"
        >
          ×
        </button>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {member.full_name || 'Member'}
          </h2>
          <p className="text-white/80">Show this QR code in-store</p>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <canvas ref={canvasRef} className="w-full h-full" style={{ width: '400px', height: '400px' }} />
        </div>
        <div className="mt-6 text-center">
          <p className="text-white/90 font-semibold text-xl mb-1">
            {formatCurrency(member.current_credit_balance)}
          </p>
          <p className="text-white/60 text-sm">Available Credit</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CardContent />

      <div className="mt-4">
        <button
          onClick={handleFullscreen}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Maximize2 className="w-4 h-4" />
          Enlarge QR Code
        </button>
      </div>

      <div className="mt-3 text-center">
        <p className="text-sm text-gray-700">
          Show this QR code in-store for instant check-in
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Or use your NFC fob if you have one
        </p>
      </div>
    </div>
  );
}
