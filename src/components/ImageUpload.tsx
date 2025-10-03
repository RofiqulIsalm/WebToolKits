import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Upload, X, Check } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUploaded, currentImageUrl }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null);
      setUploadSuccess(false);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('website-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('website-images')
        .getPublicUrl(filePath);

      onImageUploaded(publicUrl);
      setUploadSuccess(true);

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUploaded('');
    setUploadSuccess(false);
  };

  return (
    <div className="w-full">
      <div className="mb-2">
        <label className="block text-sm font-medium text-white mb-2">
          Upload Guide Image
        </label>
      </div>

      {currentImageUrl ? (
        <div className="relative">
          <img
            src={currentImageUrl}
            alt="Uploaded guide"
            className="w-full rounded-xl shadow-lg mb-4"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            title="Remove image"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              uploading
                ? 'border-blue-400 bg-blue-400/10'
                : 'border-slate-500 hover:border-blue-400 bg-slate-800/50 hover:bg-slate-800'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-3"></div>
                  <p className="text-sm text-slate-300">Uploading...</p>
                </>
              ) : uploadSuccess ? (
                <>
                  <Check className="h-12 w-12 text-green-500 mb-3" />
                  <p className="text-sm text-green-400">Upload successful!</p>
                </>
              ) : (
                <>
                  <Upload className="h-12 w-12 text-slate-400 mb-3" />
                  <p className="mb-2 text-sm text-slate-300">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">PNG, JPG, GIF, WEBP (Max 5MB)</p>
                </>
              )}
            </div>
          </label>
        </div>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
