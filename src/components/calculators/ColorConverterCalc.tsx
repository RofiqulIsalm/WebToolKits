import React, { useState, useEffect } from 'react';
import { Copy, Check, RefreshCw } from 'lucide-react';

const ColorConverterCalc: React.FC = () => {
  const [hex, setHex] = useState<string>('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [cmyk, setCmyk] = useState({ c: 76, m: 47, y: 0, k: 4 });
  const [gradientColor1, setGradientColor1] = useState<string>('#3B82F6');
  const [gradientColor2, setGradientColor2] = useState<string>('#8B5CF6');
  const [gradientDirection, setGradientDirection] = useState<string>('to right');
  const [copiedField, setCopiedField] = useState<string>('');

  const hexToRgb = (hexColor: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  };

  const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, m, y);

    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };

    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);

    return { c, m, y, k };
  };

  const updateFromHex = (hexValue: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hexValue)) return;
    const rgbValue = hexToRgb(hexValue);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
      setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  };

  useEffect(() => {
    updateFromHex(hex);
  }, [hex]);

  const randomColor = () => {
    const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    setHex(randomHex.toUpperCase());
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const gradientCSS = `linear-gradient(${gradientDirection}, ${gradientColor1}, ${gradientColor2})`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Color Converter</h3>

          <div className="h-32 rounded-xl border-4 border-slate-600" style={{ backgroundColor: hex }}></div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={hex}
                onChange={(e) => setHex(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="#3B82F6"
              />
              <button
                onClick={() => copyToClipboard(hex, 'hex')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copiedField === 'hex' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 font-mono"
              />
              <button
                onClick={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'rgb')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copiedField === 'rgb' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 font-mono"
              />
              <button
                onClick={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'hsl')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copiedField === 'hsl' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 font-mono"
              />
              <button
                onClick={() => copyToClipboard(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'cmyk')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copiedField === 'cmyk' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>
          </div>

          <button
            onClick={randomColor}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Random Color</span>
          </button>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-white">Gradient Generator</h3>

          <div className="h-32 rounded-xl border-4 border-slate-600" style={{ background: gradientCSS }}></div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Color 1</label>
              <input
                type="color"
                value={gradientColor1}
                onChange={(e) => setGradientColor1(e.target.value)}
                className="w-full h-10 rounded border border-slate-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Color 2</label>
              <input
                type="color"
                value={gradientColor2}
                onChange={(e) => setGradientColor2(e.target.value)}
                className="w-full h-10 rounded border border-slate-600 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Direction</label>
              <select
                value={gradientDirection}
                onChange={(e) => setGradientDirection(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="to right">Left to Right</option>
                <option value="to left">Right to Left</option>
                <option value="to bottom">Top to Bottom</option>
                <option value="to top">Bottom to Top</option>
                <option value="to bottom right">Diagonal ↘</option>
                <option value="to bottom left">Diagonal ↙</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={`background: ${gradientCSS};`}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 font-mono text-sm"
              />
              <button
                onClick={() => copyToClipboard(`background: ${gradientCSS};`, 'gradient')}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                {copiedField === 'gradient' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4 text-slate-300" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorConverterCalc;
