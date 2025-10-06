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
              <h1 className="text-3xl font-bold text-white"> Free QR Code Generator</h1>
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
                    className="w-80 h-32 px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
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

                {/* Preview Size */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Preview Size
                  </label>
                  <div className="flex gap-4">
                    {[
                      { label: 'S', value: 128 },
                      { label: 'M', value: 256 },
                      { label: 'L', value: 512 },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setSize(opt.value)}
                        className={`
                          flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                          ${
                            size === opt.value
                              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                              : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                          }
                        `}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              
                {/* Error Correction */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Error Correction
                  </label>
                  <div className="flex gap-2">
                    {['L', 'M', 'Q', 'H'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setErrorLevel(level as 'L' | 'M' | 'Q' | 'H')}
                        className={`
                          flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                          ${
                            errorLevel === level
                              ? 'bg-blue-500 text-white border-blue-500 shadow-md'
                              : 'bg-slate-700 text-white border-slate-600 hover:bg-slate-600'
                          }
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
                    <div className="flex gap-2 sm:gap-4">
                      {[
                        { label: 'S', value: 'small' },
                        { label: 'M', value: 'medium' },
                        { label: 'L', value: 'large' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setExportSize(opt.value as ExportSize)}
                          className={`
                            flex-1 px-3 sm:px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                            ${
                              exportSize === opt.value
                                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                                : 'bg-slate-700 text-gray-300 border-slate-600 hover:bg-slate-600'
                            }
                            focus:outline-none focus:ring-2 focus:ring-blue-500
                          `}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
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

        {/*--------------------------Seo content--------------------------------*/}
        


          <div className="rounded-2xl p-8 mb-8">
                 <h2 className="text-3xl font-bold text-white mb-4">Free Online QR Code, Barcode & Hash Generator with Decoder</h2>
                 <div className="space-y-4 text-slate-300">
                  <p>
               In today’s connected world, <strong>QR codes</strong> and <strong>barcodes</strong> have become essential tools for digital sharing, product tracking, and online security. Our<strong> Free QR Code </strong> lets you instantly create, decode, and customize QR codes, barcodes, and hash codes — all in one place. Whether you’re a business owner, developer, or just a curious user, this all-in-one tool helps you save time and stay secure.
              </p>

               <h2 className="text-yellow-500"><strong>What is a QR Code?</strong></h2>
              <p>
                A QR (Quick Response) Code is a two-dimensional barcode that stores information like website URLs, Wi-Fi passwords, phone numbers, or text. It’s scannable by any mobile camera, making it a fast and contactless way to share data.
              </p>
               <h2 className="text-yellow-500"><strong>What is a Barcode?</strong></h2>
              <p>
                Barcodes are one-dimensional representations used widely in retail, inventory, and logistics. Each line pattern represents unique data that helps businesses manage products efficiently.
              </p>
               <h2 className="text-yellow-500"><strong>What is a Hash Code?</strong></h2>
              <p>
               Hashing converts plain text into fixed, encrypted strings using algorithms like MD5, SHA-1, and SHA-256. Hash codes ensure data integrity, authentication, and secure password storage.
              </p>
              <p>
                Our platform combines all these functions into one powerful, easy-to-use interface — no software installation, no limits, and completely free.
              </p>

              <h3 className="text-2xl font-semibold text-white mt-6">💡 Why Use This 4-in-1 QR, Barcode & Hash Tool?</h3>
                   
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Generate custom QR codes with logos and colors.</li>
                <li>Instantly decode QR codes directly from images.</li>
                <li>Create multiple barcode types such as Code128, Code39, EAN13, and UPC.</li>
                <li>Generate secure hash codes (MD5, SHA-1, SHA-256).</li>
                <li>Customize QR color, background, and logo for branding.</li>
                <li>Select error correction level for QR reliability (L, M, Q, H).</li>
                <li>Download QR and barcodes in PNG or JPG formats.</li>
                <li>Completely browser-based — no data stored or uploaded.</li>
                <li>Fast, responsive, and mobile-friendly interface.</li>
                <li>Perfect for businesses, developers, marketers, and personal use.</li>
              </ul>

                   
              <p>By using a <storng>secure password generator</storng>, you can effortlessly create passwords that meet these requirements and ensure your digital life stays safe.</p>
          
              <h3 className="text-2xl font-semibold text-white mt-6">⚙️ Key Features of Our QR, Barcode & Hash Generator</h3>
              <p>Our <strong>Password Generator</strong> is designed to help you create <strong>strong and secure passwords</strong> effortlessly. Here’s what makes it an essential tool for online security:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Multi-Type QR Input:</strong> – Generate QR codes for text, links, phone numbers, emails, Wi-Fi, SMS, or passwords.</li>
                <li><strong>Dynamic Type Selection:</strong> – Choose your QR type easily from a dropdown list.</li>
                <li><strong>Color Customization:</strong> – Adjust foreground and background colors to match your brand.</li>
                <li><strong>Logo Insertion:</strong> – Add your business logo or custom icon at the center of the QR code</li>
                <li><strong>Size Preview Options:</strong> – QSmall (S), Medium (M), or Large (L) previews before download.</li>
                <li><strong>Error Correction Levels:</strong> – Select between L, M, Q, and H for data recovery strength.</li>
                <li><strong>Barcode Generator:</strong> – Support for Code128, Code39, EAN13, and UPC with instant preview.</li>
                <li><strong>QR Decoder:</strong> – Upload and decode QR images instantly to reveal hidden text or URLs.</li>
                <li><strong>Hash Code Generator:</strong> – Create secure MD5, SHA-1, and SHA-256 hashes instantly.</li>
                <li><strong>Download & Export Options:</strong> – Choose output format (PNG/JPG) and export size (S, M, L).</li>
              </ul>
              <p>Using these features, our Password Generator ensures that you can always create<strong> robust, high-security passwords</strong> for all your online accounts with ease.</p>
         
              
              <AdBanner type="bottom" />

                   
            <section className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">❓ Frequently Asked Questions (<span className="text-yellow-300"> FAQ </span>)</h2>
            <div className="space-y-4 text-lg text-slate-100 leading-relaxed">
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q1</span>: Is this QR & Barcode Generator free to use?</h3>
                    <p>Yes, it’s 100% free! You can generate, decode, and download unlimited QR codes, barcodes, and hash codes without registration.
                    </p>
                  
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q2</span>: Can I customize the QR code colors and add my logo?</h3>
                  <p>Absolutely! You can pick custom foreground and background colors, and even upload your logo to appear in the center.</p>
                </div>
             </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q3</span>: How do I decode a QR code image?</h3>
                <p>Simply upload the image under the “QR Code Decode” tab — the tool will automatically scan and display the embedded data.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q4</span>: What barcode formats are supported?</h3>
                <p>Our tool supports Code128, Code39, EAN13, and UPC barcode formats, ideal for retail and inventory systems.</p>
                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q5</span>: Are my data and inputs stored online?</h3>
                <p>No. Everything runs locally in your browser — your data is never uploaded or saved.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q6</span>: What is a hash code, and why should I use it?</h3>
                <p> Hash codes securely convert data into encrypted text. It’s useful for verifying data integrity and generating secure passwords.</p>

                </div>
              </div>
              <div>
                <div className="bg-slate-800/60 p-4 rounded-lg">
                <h3 className="font-semibold text-xl"><span className="text-yellow-300">Q7</span>: Can I use this tool on mobile devices?</h3>
                <p>Yes! The entire generator is fully responsive and optimized for Android, iOS, and all major browsers.</p>

                </div>
              </div>
              
            </div>
          </section>

              <AdBanner type="bottom" />

                   
                 </div>
          </div>

        {/* ===================== FAQ SCHEMA (SEO Rich Results) ===================== */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Is this QR Code Generator free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! Our QR Code Generator is completely free and allows you to create, decode, and download unlimited QR codes, barcodes, and hash codes without any hidden costs or registration."
                }
              },
              {
                "@type": "Question",
                "name": "Can I customize the QR code colors and add a logo?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! You can choose custom foreground and background colors and even upload a logo or icon to appear in the center of the QR code."
                }
              },
              {
                "@type": "Question",
                "name": "How do I decode a QR code?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Simply upload your QR code image under the 'QR Code Decode' tab, and the tool will automatically scan and display the embedded data."
                }
              },
              {
                "@type": "Question",
                "name": "Which barcode formats are supported?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our tool supports Code128, Code39, EAN13, and UPC barcode formats, making it suitable for retail, inventory management, and product labeling."
                }
              },
              {
                "@type": "Question",
                "name": "Can I generate hash codes with this tool?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You can generate MD5, SHA-1, and SHA-256 hash codes instantly from your input text, useful for encryption and data verification."
                }
              },
              {
                "@type": "Question",
                "name": "Can I download the QR codes and barcodes?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! You can download your QR codes and barcodes in PNG or JPG formats and select export sizes Small (S), Medium (M), or Large (L)."
                }
              },
              {
                "@type": "Question",
                "name": "Is this tool mobile-friendly?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Absolutely! The entire generator is fully responsive and works seamlessly on desktop, tablet, and mobile devices."
                }
              }
            ]
          })
        }} />
        
        {/* ===================== SoftwareApplication Schema ===================== */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "QR Code, Barcode & Hash Generator",
            "operatingSystem": "All",
            "applicationCategory": "UtilitiesApplication",
            "description": "Generate, decode, and customize QR codes, barcodes, and hash codes instantly with our free online tool. Add logos, colors, and select export formats easily.",
            "url": "https://calculatorhub.site/qr-code-generator",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "950"
            }
          })
        }} />


        
        <RelatedCalculators currentPath="/qr-code-generator"/>
        
      </div> 
    </>
  );
};

export default QRCodeGenerator;
