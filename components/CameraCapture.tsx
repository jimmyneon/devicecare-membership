'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false,
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          onCapture(file);
          stopCamera();
          onClose();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-bold text-red-600 mb-2">Camera Error</h3>
          <p className="text-gray-700 mb-4">{error}</p>
          <button onClick={onClose} className="btn-primary w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 p-4 flex items-center justify-between">
        <h3 className="text-white font-semibold">Take Profile Photo</h3>
        <button
          onClick={() => {
            stopCamera();
            onClose();
          }}
          className="text-white hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Video Preview */}
      <div className="flex-1 relative flex items-center justify-center">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Face Guide Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-80 border-4 border-white border-dashed rounded-full opacity-50" />
        </div>
      </div>

      {/* Controls */}
      <div className="bg-black bg-opacity-50 p-6 flex items-center justify-center gap-4">
        <button
          onClick={switchCamera}
          className="p-4 bg-gray-700 rounded-full text-white hover:bg-gray-600"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        
        <button
          onClick={capturePhoto}
          className="p-6 bg-white rounded-full hover:bg-gray-200"
        >
          <Camera className="w-8 h-8 text-gray-900" />
        </button>
        
        <div className="w-16" /> {/* Spacer for symmetry */}
      </div>
    </div>
  );
}
