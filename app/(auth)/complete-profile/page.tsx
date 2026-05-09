'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, User, MapPin, Phone, ArrowRight, Camera } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const CameraCapture = dynamic(() => import('@/components/CameraCapture'), { ssr: false });

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    postcode: '',
  });
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  const handleTakePhoto = () => {
    setShowCamera(true);
  };

  const handleCameraCapture = async (file: File) => {
    const compressed = await compressImage(file);
    setPhotoFile(compressed);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(compressed);
  };

  const handleChoosePhoto = () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    input?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be less than 5MB');
        return;
      }
      
      // Compress image before upload
      const compressedFile = await compressImage(file);
      setPhotoFile(compressedFile);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    }
  };

  // Compress image to reduce storage
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              }
            },
            'image/jpeg',
            0.8 // 80% quality
          );
        };
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let photoUrl = null;

      // Upload photo if provided
      if (photoFile) {
        setUploading(true);
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(fileName);
        
        photoUrl = publicUrl;
        setUploading(false);
      }

      // Update member profile
      const { error: updateError } = await supabase
        .from('members')
        // @ts-ignore - Supabase type inference issue
        .update({
          phone: formData.phone,
          address_line1: formData.address_line1,
          address_line2: formData.address_line2 || null,
          city: formData.city,
          postcode: formData.postcode,
          profile_photo_url: photoUrl,
          profile_completed: true,
          profile_completed_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Force a full page reload to clear middleware cache
      // This ensures the middleware sees the updated profile_completed status
      window.location.replace('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      
      <div className="min-h-screen bg-ivory py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Complete Your Profile
          </h1>
          <p className="text-xl text-gray-600">
            Just a few more details to activate your membership
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>Why we need this:</strong> Your photo helps us verify your identity in-store and prevents account sharing. Your address is used for service delivery and communications.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Profile Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Upload a clear photo of yourself for verification
              </p>
              
              <div className="flex items-start gap-4">
                {photoPreview ? (
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-primary">
                    <Image 
                      src={photoPreview} 
                      alt="Profile preview" 
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  {/* Camera Input (Primary) */}
                  <button
                    type="button"
                    onClick={handleTakePhoto}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </button>
                  <input
                    id="camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  
                  {/* File Upload (Secondary) */}
                  <button
                    type="button"
                    onClick={handleChoosePhoto}
                    className="btn-secondary w-full inline-flex items-center justify-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Choose from Gallery
                  </button>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG or WEBP. Max 5MB.
                  </p>
                  {!photoPreview && (
                    <p className="text-xs text-red-500">
                      Photo required for verification
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="label">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="07123 456789"
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address_line1" className="label">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="address_line1"
                  type="text"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  placeholder="123 High Street"
                  required
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address_line2" className="label">
                Address Line 2
              </label>
              <input
                id="address_line2"
                type="text"
                value={formData.address_line2}
                onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                placeholder="Apartment, suite, etc. (optional)"
                className="input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="label">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Lymington"
                  required
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="postcode" className="label">
                  Postcode <span className="text-red-500">*</span>
                </label>
                <input
                  id="postcode"
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  placeholder="SO43 7AA"
                  required
                  className="input"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="btn-primary w-full btn-lg"
            >
              {uploading ? 'Uploading photo...' : loading ? 'Saving...' : (
                <>
                  Complete Profile
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </div>
        </div>
      </div>
    </>
  );
}
