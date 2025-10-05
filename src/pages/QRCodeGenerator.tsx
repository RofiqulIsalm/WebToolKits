import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Download, Upload, Copy, Check, Scan, BarChart3, Hash } from 'lucide-react';
import QRCodeLib from 'qrcode';
import jsQR from 'jsqr';
import JsBarcode from 'jsbarcode';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';
 

type TabType = 'qr-generator' | 'qr-decoder' | 'barcode' | 'hash';
type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';
type ExportSize = 'small' | 'medium' | 'large';
type BarcodeType = 'EAN13' | 'UPC' | 'CODE128' | 'CODE39';

const QRCodeGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('qr-generator');

  const [text, setText] = useState<string>('https://dailytoolshub.com');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [size, setSize] = useState<number>(256);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [fgColor, setFgColor] = useState<string>('#000000');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportSize, setExportSize] = useState<ExportSize>('medium');
  const [presetOpen, setPresetOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('Quick Presets');


  const [decodedText, setDecodedText] = useState<string>('');
  const [decodedCopied, setDecodedCopied] = useState<boolean>(false);
  const [decodeError, setDecodeError] = useState<string>('');

  const [barcodeText, setBarcodeText] = useState<string>('123456789012');
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('CODE128');
  const [barcodeUrl, setBarcodeUrl] = useState<string>('');
  const [barcodeFormat, setBarcodeFormat] = useState<'png' | 'svg'>('png');
  const barcodeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barcodeSvgRef = useRef<SVGSVGElement | null>(null);

  const [hashInput, setHashInput] = useState<string>('Hello World');
  const [md5Hash, setMd5Hash] = useState<string>('');
  const [sha1Hash, setSha1Hash] = useState<string>('');
  const [sha256Hash, setSha256Hash] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
      if (canvasRef.current && text.trim() !== '') {
    generateQRCode();
  }
}, [text, size, fgColor, bgColor, errorLevel, logoDataUrl]);

useEffect(() => {
  generateBarcode();
}, [barcodeText, barcodeType, barcodeFormat]);

  useEffect(() => {
    generateHashes();
  }, [hashInput]);

  useEffect(() => {
    if (logoFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(logoFile);
    } else {
      setLogoDataUrl('');
    }
  }, [logoFile]);

  //start
  
// replace your existing generateQRCode with this
const generateQRCode = async () => {
  try {
    if (!text.trim()) {
      setQrCodeUrl('');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Draw QR code first
    await QRCodeLib.toCanvas(canvas, text, {
      width: size,
      margin: 1,
      errorCorrectionLevel: errorLevel,
      color: {
        dark: fgColor,
        light: bgColor,
      },
    });

    // Draw logo if exists
    if (logoDataUrl) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous'; // requires CORS headers on remote images
        await new Promise<void>((resolve) => {
          logo.onload = () => {
            const logoSize = Math.round(size * 0.2);
            const x = Math.round((size - logoSize) / 2);
            const y = x;

            // draw background for logo so it doesn't hide modules
            ctx.save();
            ctx.fillStyle = bgColor || '#ffffff';
            ctx.fillRect(x - 6, y - 6, logoSize + 12, logoSize + 12);
            ctx.drawImage(logo, x, y, logoSize, logoSize);
            ctx.restore();

            resolve();
          };
          logo.onerror = () => {
            // if logo fails to load, just continue silently
            resolve();
          };
          logo.src = logoDataUrl;
        });
      }
    }

    // Set QR code preview (this triggers React re-render)
    const finalDataURL = canvas.toDataURL('image/png');
    setQrCodeUrl(finalDataURL);
  } catch (err) {
    console.error('QR generation failed:', err);
    setQrCodeUrl('');
  }
};




  //end here
  const getSizePixels = (): number => {
    const sizes = {
      small: 256,
      medium: 512,
      large: 1024
    };
    return sizes[exportSize];
  };

  // Replace your existing downloadQRCode with this function
  const downloadQRCode = async () => {
      if (!text.trim()) return;
    
      try {
        const exportPixels = getSizePixels();
    
        // === Create canvas for export ===
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = exportPixels;
        exportCanvas.height = exportPixels;
    
        // Draw QR code onto canvas
        await QRCodeLib.toCanvas(exportCanvas, text, {
          width: exportPixels,
          margin: 2,
          errorCorrectionLevel: errorLevel,
          color: {
            dark: fgColor,
            light: bgColor,
          },
        });
    
        // === Draw logo (if present) ===
        if (logoDataUrl) {
          const ctx = exportCanvas.getContext('2d');
          if (ctx) {
            const logo = new Image();
            logo.crossOrigin = 'anonymous';
            await new Promise<void>((resolve) => {
              logo.onload = () => {
                const logoSize = Math.round(exportPixels * 0.2);
                const x = Math.round((exportPixels - logoSize) / 2);
                const y = x;
    
                // Draw a white background box behind logo (for contrast)
                ctx.save();
                ctx.fillStyle = bgColor || '#ffffff';
                ctx.fillRect(
                  x - Math.round(logoSize * 0.05),
                  y - Math.round(logoSize * 0.05),
                  logoSize + Math.round(logoSize * 0.1),
                  logoSize + Math.round(logoSize * 0.1)
                );
                ctx.drawImage(logo, x, y, logoSize, logoSize);
                ctx.restore();
    
                resolve();
              };
              logo.onerror = () => {
                console.warn('Logo failed to load — exporting QR without logo.');
                resolve();
              };
              logo.src = logoDataUrl;
            });
          }
        }
    
        // === PNG / JPG Export ===
        const mime = exportFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        exportCanvas.toBlob((blob) => {
          if (!blob) {
            console.error('Failed to export QR code.');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `qrcode.${exportFormat}`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }, mime, 1.0);
      } catch (error) {
        console.error('Error downloading QR code:', error);
      }
    };


    async function convertToBase64(url: string): Promise<string> {
        if (url.startsWith('data:image')) return url;
        try {
          const res = await fetch(url, { mode: 'cors' });
          const blob = await res.blob();
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } catch (err) {
          console.warn('Failed to convert logo to base64:', err);
          return url;
        }
      }


  const handleQRImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDecodeError('');
    setDecodedText('');

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            setDecodedText(code.data);
          } else {
            setDecodeError('No QR code found in the image. Please upload a clear QR code image.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const copyDecodedText = () => {
    navigator.clipboard.writeText(decodedText);
    setDecodedCopied(true);
    setTimeout(() => setDecodedCopied(false), 2000);
  };

  const generateBarcode = () => {
    if (!barcodeText.trim()) {
      setBarcodeUrl('');
      return;
    }

    try {
      if (barcodeFormat === 'svg' && barcodeSvgRef.current) {
        JsBarcode(barcodeSvgRef.current, barcodeText, {
          format: barcodeType,
          displayValue: true,
          fontSize: 14,
          width: 2,
          height: 100
        });

        const svgString = new XMLSerializer().serializeToString(barcodeSvgRef.current);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        setBarcodeUrl(URL.createObjectURL(blob));
      } else if (barcodeCanvasRef.current) {
        JsBarcode(barcodeCanvasRef.current, barcodeText, {
          format: barcodeType,
          displayValue: true,
          fontSize: 14,
          width: 2,
          height: 100
        });
        setBarcodeUrl(barcodeCanvasRef.current.toDataURL());
      }
    } catch (error) {
      console.error('Error generating barcode:', error);
      setBarcodeUrl('');
    }
  };

  const downloadBarcode = () => {
    if (!barcodeUrl) return;

    const link = document.createElement('a');
    link.download = `barcode.${barcodeFormat}`;
    link.href = barcodeUrl;
    link.click();
  };

  const generateHashes = async () => {
    if (!hashInput) {
      setMd5Hash('');
      setSha1Hash('');
      setSha256Hash('');
      return;
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);

    const md5 = await simpleMD5(hashInput);
    setMd5Hash(md5);

    const sha1Buffer = await crypto.subtle.digest('SHA-1', data);
    setSha1Hash(bufferToHex(sha1Buffer));

    const sha256Buffer = await crypto.subtle.digest('SHA-256', data);
    setSha256Hash(bufferToHex(sha256Buffer));
  };

  const simpleMD5 = (str: string): string => {
    const rotateLeft = (x: number, n: number) => (x << n) | (x >>> (32 - n));

    const addUnsigned = (x: number, y: number) => {
      const lsw = (x & 0xFFFF) + (y & 0xFFFF);
      const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    };

    const md5FF = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned((b & c) | (~b & d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const md5GG = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned((b & d) | (c & ~d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const md5HH = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(b ^ c ^ d, x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const md5II = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(c ^ (b | ~d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const convertToWordArray = (str: string) => {
      const wordArray = [];
      for (let i = 0; i < str.length * 8; i += 8) {
        wordArray[i >> 5] |= (str.charCodeAt(i / 8) & 0xFF) << (i % 32);
      }
      return wordArray;
    };

    const wordArray = convertToWordArray(str);
    const wordCount = str.length * 8;

    wordArray[wordCount >> 5] |= 0x80 << (wordCount % 32);
    wordArray[(((wordCount + 64) >>> 9) << 4) + 14] = wordCount;

    let a = 0x67452301, b = 0xEFCDAB89, c = 0x98BADCFE, d = 0x10325476;

    for (let i = 0; i < wordArray.length; i += 16) {
      const aa = a, bb = b, cc = c, dd = d;

      a = md5FF(a, b, c, d, wordArray[i + 0], 7, 0xD76AA478);
      d = md5FF(d, a, b, c, wordArray[i + 1], 12, 0xE8C7B756);
      c = md5FF(c, d, a, b, wordArray[i + 2], 17, 0x242070DB);
      b = md5FF(b, c, d, a, wordArray[i + 3], 22, 0xC1BDCEEE);
      a = md5FF(a, b, c, d, wordArray[i + 4], 7, 0xF57C0FAF);
      d = md5FF(d, a, b, c, wordArray[i + 5], 12, 0x4787C62A);
      c = md5FF(c, d, a, b, wordArray[i + 6], 17, 0xA8304613);
      b = md5FF(b, c, d, a, wordArray[i + 7], 22, 0xFD469501);
      a = md5FF(a, b, c, d, wordArray[i + 8], 7, 0x698098D8);
      d = md5FF(d, a, b, c, wordArray[i + 9], 12, 0x8B44F7AF);
      c = md5FF(c, d, a, b, wordArray[i + 10], 17, 0xFFFF5BB1);
      b = md5FF(b, c, d, a, wordArray[i + 11], 22, 0x895CD7BE);
      a = md5FF(a, b, c, d, wordArray[i + 12], 7, 0x6B901122);
      d = md5FF(d, a, b, c, wordArray[i + 13], 12, 0xFD987193);
      c = md5FF(c, d, a, b, wordArray[i + 14], 17, 0xA679438E);
      b = md5FF(b, c, d, a, wordArray[i + 15], 22, 0x49B40821);

      a = md5GG(a, b, c, d, wordArray[i + 1], 5, 0xF61E2562);
      d = md5GG(d, a, b, c, wordArray[i + 6], 9, 0xC040B340);
      c = md5GG(c, d, a, b, wordArray[i + 11], 14, 0x265E5A51);
      b = md5GG(b, c, d, a, wordArray[i + 0], 20, 0xE9B6C7AA);
      a = md5GG(a, b, c, d, wordArray[i + 5], 5, 0xD62F105D);
      d = md5GG(d, a, b, c, wordArray[i + 10], 9, 0x02441453);
      c = md5GG(c, d, a, b, wordArray[i + 15], 14, 0xD8A1E681);
      b = md5GG(b, c, d, a, wordArray[i + 4], 20, 0xE7D3FBC8);
      a = md5GG(a, b, c, d, wordArray[i + 9], 5, 0x21E1CDE6);
      d = md5GG(d, a, b, c, wordArray[i + 14], 9, 0xC33707D6);
      c = md5GG(c, d, a, b, wordArray[i + 3], 14, 0xF4D50D87);
      b = md5GG(b, c, d, a, wordArray[i + 8], 20, 0x455A14ED);
      a = md5GG(a, b, c, d, wordArray[i + 13], 5, 0xA9E3E905);
      d = md5GG(d, a, b, c, wordArray[i + 2], 9, 0xFCEFA3F8);
      c = md5GG(c, d, a, b, wordArray[i + 7], 14, 0x676F02D9);
      b = md5GG(b, c, d, a, wordArray[i + 12], 20, 0x8D2A4C8A);

      a = md5HH(a, b, c, d, wordArray[i + 5], 4, 0xFFFA3942);
      d = md5HH(d, a, b, c, wordArray[i + 8], 11, 0x8771F681);
      c = md5HH(c, d, a, b, wordArray[i + 11], 16, 0x6D9D6122);
      b = md5HH(b, c, d, a, wordArray[i + 14], 23, 0xFDE5380C);
      a = md5HH(a, b, c, d, wordArray[i + 1], 4, 0xA4BEEA44);
      d = md5HH(d, a, b, c, wordArray[i + 4], 11, 0x4BDECFA9);
      c = md5HH(c, d, a, b, wordArray[i + 7], 16, 0xF6BB4B60);
      b = md5HH(b, c, d, a, wordArray[i + 10], 23, 0xBEBFBC70);
      a = md5HH(a, b, c, d, wordArray[i + 13], 4, 0x289B7EC6);
      d = md5HH(d, a, b, c, wordArray[i + 0], 11, 0xEAA127FA);
      c = md5HH(c, d, a, b, wordArray[i + 3], 16, 0xD4EF3085);
      b = md5HH(b, c, d, a, wordArray[i + 6], 23, 0x04881D05);
      a = md5HH(a, b, c, d, wordArray[i + 9], 4, 0xD9D4D039);
      d = md5HH(d, a, b, c, wordArray[i + 12], 11, 0xE6DB99E5);
      c = md5HH(c, d, a, b, wordArray[i + 15], 16, 0x1FA27CF8);
      b = md5HH(b, c, d, a, wordArray[i + 2], 23, 0xC4AC5665);

      a = md5II(a, b, c, d, wordArray[i + 0], 6, 0xF4292244);
      d = md5II(d, a, b, c, wordArray[i + 7], 10, 0x432AFF97);
      c = md5II(c, d, a, b, wordArray[i + 14], 15, 0xAB9423A7);
      b = md5II(b, c, d, a, wordArray[i + 5], 21, 0xFC93A039);
      a = md5II(a, b, c, d, wordArray[i + 12], 6, 0x655B59C3);
      d = md5II(d, a, b, c, wordArray[i + 3], 10, 0x8F0CCC92);
      c = md5II(c, d, a, b, wordArray[i + 10], 15, 0xFFEFF47D);
      b = md5II(b, c, d, a, wordArray[i + 1], 21, 0x85845DD1);
      a = md5II(a, b, c, d, wordArray[i + 8], 6, 0x6FA87E4F);
      d = md5II(d, a, b, c, wordArray[i + 15], 10, 0xFE2CE6E0);
      c = md5II(c, d, a, b, wordArray[i + 6], 15, 0xA3014314);
      b = md5II(b, c, d, a, wordArray[i + 13], 21, 0x4E0811A1);
      a = md5II(a, b, c, d, wordArray[i + 4], 6, 0xF7537E82);
      d = md5II(d, a, b, c, wordArray[i + 11], 10, 0xBD3AF235);
      c = md5II(c, d, a, b, wordArray[i + 2], 15, 0x2AD7D2BB);
      b = md5II(b, c, d, a, wordArray[i + 9], 21, 0xEB86D391);

      a = addUnsigned(a, aa);
      b = addUnsigned(b, bb);
      c = addUnsigned(c, cc);
      d = addUnsigned(d, dd);
    }

    return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  };

  const wordToHex = (x: number): string => {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      hex += ((x >> (i * 8 + 4)) & 0x0F).toString(16) + ((x >> (i * 8)) & 0x0F).toString(16);
    }
    return hex;
  };

  const bufferToHex = (buffer: ArrayBuffer): string => {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const copyHash = (hash: string, type: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(''), 2000);
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

  const tabs = [
    { id: 'qr-generator', label: '', icon: QrCode },
    { id: 'qr-decoder', label: '', icon: Scan },
    { id: 'barcode', label: '', icon: BarChart3 },
    { id: 'hash', label: '', icon: Hash }
  ];

  return (
    <>
      <SEOHead
        title={seoData.qrCodeGenerator.title}
        description={seoData.qrCodeGenerator.description}
        canonical="https://calculatorhub.site/qr-code-generator"
        schemaData={generateCalculatorSchema(
          "QR Code Generator",
          seoData.qrCodeGenerator.description,
          "/qr-code-generator",
          seoData.qrCodeGenerator.keywords
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'QR Code Generator', url: '/qr-code-generator' }
        ]}
      />
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'QR Code Generator', url: '/qr-code-generator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <QrCode className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-white">QR & Barcode Tools</h1>
              <p className="text-slate-300 mt-1">Generate QR codes, decode images, create barcodes, and generate hashes</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-700">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-6 py-3 font-medium rounded-t-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'qr-generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Text or URL to encode
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter text, URL, email, phone number, etc."
                  />
                </div>

                
              {/* ---------------- Quick Presets Dropdown ---------------- */}
              <div className="relative inline-block w-full max-w-xs">
                <label className="block text-sm font-medium text-white mb-2">
                      Quick Presets
                    </label>
                <button
                  onClick={() => setPresetOpen(!presetOpen)}
                  className="w-full flex justify-between items-center bg-slate-800 text-white px-4 py-2 rounded-md border border-slate-600 hover:bg-slate-700"
                >
                  {selectedPreset}
                  <svg
                    className={`w-4 h-4 ml-2 transition-transform ${presetOpen ? 'rotate-180' : 'rotate-0'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              
                {presetOpen && (
                  <div className="absolute z-10 w-full mt-2 bg-slate-800 border border-slate-600 rounded-md shadow-lg">
                    {['Website URL', 'Email', 'Phone', 'SMS', 'WiFi', 'Location'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setSelectedPreset(preset);
                          setPresetOpen(false);
              
                          // handle preset selection
                          switch (preset) {
                            case 'Website URL':
                              setText('https://');
                              break;
                            case 'Email':
                              setText('mailto:example@example.com');
                              break;
                            case 'Phone':
                              setText('tel:+880');
                              break;
                            case 'SMS':
                              setText('sms:+880?body=Hello');
                              break;
                            case 'WiFi':
                              setText('WIFI:T:WPA;S:NetworkName;P:Password;;');
                              break;
                            case 'Location':
                              setText('geo:0,0?q=Dhaka,Bangladesh');
                              break;
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-slate-700"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                )}
              </div>

                
                {/*end*/}

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Foreground Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="h-10 w-20 rounded border border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="h-10 w-20 rounded border border-slate-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Preview Size
                    </label>
                    <div className="flex gap-1">
                      {[
                        { label: 'S', value: 128 },
                        { label: 'M', value: 256 },
                        { label: 'L', value: 512 },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setSize(opt.value)}
                          className={`flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                            size === opt.value
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>


                 <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Error Correction
                    </label>
                    <div className="flex gap-1">
                      {['L', 'M', 'Q', 'H'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setErrorLevel(level as 'L' | 'M' | 'Q' | 'H')}
                          className={`
                            px-4 py-2 rounded-lg border 
                            ${errorLevel === level ? 'bg-blue-500 text-white border-blue-500' : 'bg-slate-700 text-white border-slate-600'}
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          `}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Logo/Icon (Optional)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition-colors border border-slate-600"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Logo</span>
                    </label>
                    {logoFile && (
                      <button
                        onClick={() => {
                          setLogoFile(null);
                          setLogoDataUrl('');
                        }}
                        className="text-sm text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {logoFile && (
                    <p className="text-xs text-slate-400 mt-1">{logoFile.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Export Format
                    </label>
                    <div className="flex gap-2">
                      {['png', 'jpg'].map((format) => (
                        <button
                          key={format}
                          onClick={() => setExportFormat(format as ExportFormat)}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-all duration-200 ${
                            exportFormat === format
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                          }`}
                        >
                          {format.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Export Size
                    </label>
                    <select
                      value={exportSize}
                      onChange={(e) => setExportSize(e.target.value as ExportSize)}
                      className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="small">Small (256px)</option>
                      <option value="medium">Medium (512px)</option>
                      <option value="large">Large (1024px)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-center items-center bg-slate-800 rounded-lg p-4">
  {qrCodeUrl ? (
    <img
      src={qrCodeUrl}
      alt="Generated QR Code"
      className="w-auto h-auto max-w-full max-h-80"
    />
  ) : (
    <p className="text-gray-400">Generating QR code...</p>
  )}
  <canvas ref={canvasRef} className="hidden" />
</div>


                {text.trim() && (
                  <div className="p-4 bg-slate-800 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Encoded Content:</h4>
                    <p className="text-sm text-slate-300 break-all">{text}</p>
                    <div className="mt-2 text-xs text-slate-500">
                      Size: {size}x{size}px | Error Level: {errorLevel} | Colors: {fgColor}/{bgColor}
                    </div>

                      <button
                        onClick={downloadQRCode}
                        className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-md"
                      >
                        <Download size={18} />
                        Download QR Code
                      </button>
                    
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'qr-decoder' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Upload QR Code Image
                </label>
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-xl p-8 bg-slate-800 hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleQRImageUpload}
                    className="hidden"
                    id="qr-decode-upload"
                  />
                  <label
                    htmlFor="qr-decode-upload"
                    className="cursor-pointer text-center"
                  >
                    <Upload className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-white mb-1">Click to upload QR code image</p>
                    <p className="text-sm text-slate-400">PNG, JPG, or any image format</p>
                  </label>
                </div>
              </div>

              {decodeError && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{decodeError}</p>
                </div>
              )}

              {decodedText && (
                <div className="space-y-4">
                  <div className="p-6 bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl border border-green-500/30">
                    <h3 className="text-lg font-semibold text-white mb-3">Decoded Content:</h3>
                    <p className="text-white break-all mb-4">{decodedText}</p>
                    <button
                      onClick={copyDecodedText}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      {decodedCopied ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy to Clipboard</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/*-------------------------------Barcode-----------------------------*/}

         {activeTab === 'barcode' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Barcode Text</label>
              <input
                type="text"
                value={barcodeText}
                onChange={(e) => setBarcodeText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter barcode text (e.g. 123456789012)"
              />
            </div>
        
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-white mb-2">
                  Barcode Type
                </label>
                <select
                  value={barcodeType}
                  onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                  className="w-full px-3 py-2 bg-slate-700 text-white rounded-md border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="CODE128">CODE128</option>
                  <option value="CODE39">CODE39</option>
                  <option value="EAN13">EAN13</option>
                  <option value="UPC">UPC</option>
                </select>
              </div>

        
           <div>
          <label className="block text-sm font-medium text-white mb-2">Download Format</label>
          <div className="flex space-x-3">
            <button
              onClick={() => setBarcodeFormat('png')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                barcodeFormat === 'png'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setBarcodeFormat('svg')}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                barcodeFormat === 'svg'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              SVG
            </button>
          </div>
        </div>

        
            <div className="flex flex-col items-center justify-center bg-slate-800 rounded-xl p-6 mt-4">
              {/* Render Barcode */}
              {barcodeFormat === 'svg' ? (
                <svg ref={barcodeSvgRef}></svg>
              ) : (
                <canvas ref={barcodeCanvasRef}></canvas>
              )}
        
              {/* Show preview image if generated */}
              {barcodeUrl && (
                <img
                  src={barcodeUrl}
                  alt="Generated Barcode"
                  className="mt-4 max-h-40 object-contain bg-white p-2 rounded-lg"
                />
              )}
        
              <button
                onClick={downloadBarcode}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
              >
                Download Barcode
              </button>
            </div>
          </div>
        )}

          {/*-----------------------------Hash code------------------------------*/}

          {activeTab === 'hash' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Text to Hash
                </label>
                <textarea
                  value={hashInput}
                  onChange={(e) => setHashInput(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter text to generate hash"
                />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">MD5</h4>
                    <button
                      onClick={() => copyHash(md5Hash, 'md5')}
                      className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copiedHash === 'md5' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 font-mono text-sm break-all">{md5Hash || '-'}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">SHA-1</h4>
                    <button
                      onClick={() => copyHash(sha1Hash, 'sha1')}
                      className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copiedHash === 'sha1' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 font-mono text-sm break-all">{sha1Hash || '-'}</p>
                </div>

                <div className="p-4 bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">SHA-256</h4>
                    <button
                      onClick={() => copyHash(sha256Hash, 'sha256')}
                      className="flex items-center space-x-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copiedHash === 'sha256' ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-slate-300 font-mono text-sm break-all">{sha256Hash || '-'}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <h4 className="font-semibold text-blue-300 mb-2">About Hash Functions</h4>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li><strong>MD5:</strong> 128-bit hash, fast but not secure for cryptography</li>
                  <li><strong>SHA-1:</strong> 160-bit hash, deprecated for security purposes</li>
                  <li><strong>SHA-256:</strong> 256-bit hash, secure and widely used</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About QR & Barcode Tools</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Our comprehensive suite of encoding and decoding tools includes QR code generation,
              QR code decoding, barcode creation, and cryptographic hash generation. All tools are
              free, work in your browser, and require no installation.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">QR Code Features</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Custom colors and logo embedding</li>
                  <li>Multiple export formats (PNG, JPG, SVG, PDF)</li>
                  <li>Adjustable size and error correction</li>
                  <li>QR code decoding from images</li>
                  <li>Quick presets for common use cases</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-3">Additional Tools</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Barcode generation (EAN-13, UPC, Code128, Code39)</li>
                  <li>Hash generation (MD5, SHA-1, SHA-256)</li>
                  <li>Copy to clipboard functionality</li>
                  <li>No server upload - all processing is local</li>
                  <li>Mobile-friendly interface</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <RelatedCalculators
          currentPath="/qr-code-generator"
        />
      </div>
    </>
  );
};

export default QRCodeGenerator;
