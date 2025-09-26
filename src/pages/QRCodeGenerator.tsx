import React, { useState } from 'react';
import { QrCode, Download, Copy } from 'lucide-react';
import AdBanner from '../components/AdBanner';

const QRCodeGenerator: React.FC = () => {
  const [text, setText] = useState<string>('https://example.com');
  const [size, setSize] = useState<number>(200);
  const [errorLevel, setErrorLevel] = useState<string>('M');

  const generateQRCodeURL = () => {
    const baseURL = 'https://api.qrserver.com/v1/create-qr-code/';
    const params = new URLSearchParams({
      size: `${size}x${size}`,
      data: text,
      ecc: errorLevel
    });
    return `${baseURL}?${params.toString()}`;
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = generateQRCodeURL();
    link.download = 'qrcode.png';
    link.click();
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateQRCodeURL());
    } catch (err) {
      console.error('Failed to copy QR code URL:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">QR Code Generator</h1>
        <p className="text-slate-300">Generate QR codes for URLs, text, and more</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="misc-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">QR Code Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Text or URL
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Enter text or URL to encode"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Size: {size}x{size} pixels
              </label>
              <input
                type="range"
                min="100"
                max="500"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>100px</span>
                <span>500px</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Error Correction Level
              </label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value)}
                className="w-full px-4 py-2 glow-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="misc-card rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Generated QR Code</h2>
          
          <div className="text-center space-y-6">
            <div className="bg-white p-4 rounded-lg inline-block">
              <img
                src={generateQRCodeURL()}
                alt="Generated QR Code"
                className="mx-auto"
                style={{ width: size, height: size }}
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={downloadQRCode}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 glow-button text-white rounded-lg transition-all"
              >
                <Download className="h-5 w-5" />
                <span>Download</span>
              </button>

              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Copy className="h-5 w-5" />
                <span>Copy URL</span>
              </button>
            </div>

            <div className="text-left space-y-2 text-sm text-slate-300">
              <div className="flex justify-between">
                <span>Data Length:</span>
                <span>{text.length} characters</span>
              </div>
              <div className="flex justify-between">
                <span>Image Size:</span>
                <span>{size}x{size} pixels</span>
              </div>
              <div className="flex justify-between">
                <span>Error Correction:</span>
                <span>{errorLevel} Level</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AdBanner type="bottom" />
      
      {/* SEO Content Section */}
      <div className="mt-12 space-y-8">
        <div className="misc-card rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">QR Code Generator Guide</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-300 mb-4">
              Generate high-quality QR codes for any text, URL, or data with our free QR code generator. 
              Perfect for business cards, marketing materials, event tickets, and digital sharing. 
              Customize size and error correction levels for optimal scanning performance.
            </p>
            
            <h3 className="text-xl font-semibold text-white mt-6 mb-4">QR Code Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">URL/Website</div>
                <div className="text-slate-300 text-sm mb-1">Direct users to websites or landing pages</div>
                <div className="text-xs text-slate-400">Most common QR code type</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Plain Text</div>
                <div className="text-slate-300 text-sm mb-1">Share messages, instructions, or information</div>
                <div className="text-xs text-slate-400">Simple text encoding</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">Contact Info</div>
                <div className="text-slate-300 text-sm mb-1">vCard format for easy contact sharing</div>
                <div className="text-xs text-slate-400">Business card integration</div>
              </div>
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="font-semibold text-white mb-2">WiFi Access</div>
                <div className="text-slate-300 text-sm mb-1">Share WiFi credentials securely</div>
                <div className="text-xs text-slate-400">Automatic network connection</div>
              </div>
            </div>

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

            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Best Practices</h3>
            <ul className="text-slate-300 space-y-2">
              <li>• <strong>Test Before Use:</strong> Always scan your QR code before printing</li>
              <li>• <strong>Size Matters:</strong> Ensure adequate size for scanning distance</li>
              <li>• <strong>High Contrast:</strong> Use dark QR codes on light backgrounds</li>
              <li>• <strong>Error Correction:</strong> Use higher levels for damaged surfaces</li>
              <li>• <strong>Clear Instructions:</strong> Tell users what the QR code does</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;