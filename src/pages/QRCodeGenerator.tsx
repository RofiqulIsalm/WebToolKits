import React, { useState, useEffect } from 'react';
import { QrCode, Download } from 'lucide-react';
import QRCodeLib from 'qrcode';
import AdBanner from '../components/AdBanner';

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://dailytoolshub.com');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [size, setSize] = useState<number>(256);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  useEffect(() => {
    generateQRCode();
  }, [text, size, errorLevel]);

  const generateQRCode = async () => {
    if (!text.trim()) {
      setQrCodeUrl('');
      return;
    }

    try {
      const url = await QRCodeLib.toDataURL(text, {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCodeUrl('');
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = 'qrcode.png';
    link.href = qrCodeUrl;
    link.click();
  };

  const errorLevels = [
    { value: 'L', label: 'Low (~7%)' },
    { value: 'M', label: 'Medium (~15%)' },
    { value: 'Q', label: 'Quartile (~25%)' },
    { value: 'H', label: 'High (~30%)' }
  ];

  const presetTexts = [
    { label: 'Website URL', value: 'https://example.com' },
    { label: 'Email', value: 'mailto:contact@example.com' },
    { label: 'Phone', value: 'tel:+1234567890' },
    { label: 'SMS', value: 'sms:+1234567890' },
    { label: 'WiFi', value: 'WIFI:T:WPA;S:NetworkName;P:Password;H:false;' },
    { label: 'Location', value: 'geo:40.7128,-74.0060' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">QR Code Generator</h1>
        <p className="text-gray-600">Generate QR codes for text, URLs, contact info, and more</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">QR Code Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text or URL to encode
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter text, URL, email, phone number, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {presetTexts.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => setText(preset.value)}
                    className="px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Size (pixels)
                </label>
                <select
                  value={size}
                  onChange={(e) => setSize(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={128}>128x128</option>
                  <option value={256}>256x256</option>
                  <option value={512}>512x512</option>
                  <option value={1024}>1024x1024</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Error Correction
                </label>
                <select
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {errorLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated QR Code</h2>
          
          <div className="space-y-6">
            {qrCodeUrl ? (
              <div className="text-center">
                <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                  <img
                    src={qrCodeUrl}
                    alt="Generated QR Code"
                    className="max-w-full h-auto"
                    style={{ maxWidth: '300px' }}
                  />
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={downloadQRCode}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                  >
                    <Download className="h-5 w-5" />
                    <span>Download PNG</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {text.trim() ? 'Generating QR code...' : 'Enter text to generate QR code'}
                </p>
              </div>
            )}
          </div>

          {text.trim() && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Encoded Content:</h4>
              <p className="text-sm text-gray-600 break-all">{text}</p>
              <div className="mt-2 text-xs text-gray-500">
                Size: {size}x{size}px | Error Level: {errorLevel}
              </div>
            </div>
          )}
        </div>
      </div>

      <AdBanner type="bottom" />

      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="misc-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">QR Code Generator Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              QR (Quick Response) codes are two-dimensional barcodes that can store various types of information 
              and be scanned by smartphones and QR readers. Our generator creates high-quality QR codes for 
              websites, contact information, WiFi passwords, and much more.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">QR Code Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">URL/Website</div>
                <div className="text-slate-300 text-sm mb-1">Direct users to websites</div>
                <div className="text-xs text-slate-400">Example: https://example.com</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Contact Info</div>
                <div className="text-slate-300 text-sm mb-1">vCard format for contacts</div>
                <div className="text-xs text-slate-400">Name, phone, email, address</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">WiFi Password</div>
                <div className="text-slate-300 text-sm mb-1">Auto-connect to WiFi</div>
                <div className="text-xs text-slate-400">WIFI:T:WPA;S:Name;P:Pass;;</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Location</div>
                <div className="text-slate-300 text-sm mb-1">GPS coordinates</div>
                <div className="text-xs text-slate-400">geo:latitude,longitude</div>
              </div>
            </div>
    </div>
  );
};

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Error Correction Levels</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">Low (L)</div>
                <div className="text-sm text-slate-400">~7% recovery</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">Medium (M)</div>
                <div className="text-sm text-slate-400">~15% recovery</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">Quartile (Q)</div>
                <div className="text-sm text-slate-400">~25% recovery</div>
              </div>
              <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                <div className="font-semibold text-white">High (H)</div>
                <div className="text-sm text-slate-400">~30% recovery</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;
export default QRCodeGenerator;