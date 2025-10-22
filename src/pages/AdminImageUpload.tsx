import React, { useState, useEffect } from 'react';

import { createClient } from '@supabase/supabase-js';
import ImageUpload from '../components/ImageUpload';
import { Copy, Check } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AdminImageUpload: React.FC = () => {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [savedUrl, setSavedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSavedUrl();
  }, []);youtube-income-calculator

  const loadSavedUrl = async () => {
    try {
      const { data, error } = await supabase
        .from('website_settings')
        .select('value')
        .eq('key', 'compound_interest_guide_image')
        .maybeSingle();

      if (data && !error) {
        setSavedUrl(data.value);
        setUploadedImageUrl(data.value);
      }
    } catch (err) {
      console.error('Error loading saved URL:', err);
    }
  };

  const handleImageUploaded = async (url: string) => {
    setUploadedImageUrl(url);

    if (url) {
      try {
        const { error } = await supabase
          .from('website_settings')
          .upsert({
            key: 'compound_interest_guide_image',
            value: url,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (!error) {
          setSavedUrl(url);
        }
      } catch (err) {
        console.error('Error saving image URL:', err);
      }
    } else {
      try {
        await supabase
          .from('website_settings')
          .delete()
          .eq('key', 'compound_interest_guide_image');

        setSavedUrl('');
      } catch (err) {
        console.error('Error deleting image URL:', err);
      }
    }
  };

  const copyToClipboard = () => {
    if (savedUrl) {
      navigator.clipboard.writeText(savedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-slate-200 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-slate-700">
          <h1 className="text-4xl font-bold text-white mb-2">Image Upload Admin</h1>
          <p className="text-slate-300 mb-8">Upload and manage images for the Compound Interest Calculator guide section</p>

          <div className="space-y-6">
            <ImageUpload
              onImageUploaded={handleImageUploaded}
              currentImageUrl={uploadedImageUrl}
            />

            {savedUrl && (
              <div className="bg-slate-700/50 rounded-lg p-4">
                <label className="block text-sm font-medium text-white mb-2">
                  Current Image URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={savedUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-slate-800 text-slate-200 rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Copy URL"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-white" />
                    ) : (
                      <Copy className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Usage Instructions</h3>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Upload an image that will appear in the "How to Use" section</li>
                <li>The image will be automatically displayed on the Compound Interest Calculator page</li>
                <li>Recommended size: 1200x600 pixels or similar aspect ratio</li>
                <li>Maximum file size: 5MB</li>
                <li>Supported formats: JPG, PNG, GIF, WEBP</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminImageUpload;
