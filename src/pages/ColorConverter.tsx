import React, { useState, useEffect } from 'react';
import { Palette } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const ColorConverter: React.FC = () => {
  const [hex, setHex] = useState<string>('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });

  useEffect(() => {
    updateFromHex(hex);
  }, []);

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
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255)
    };
  };

  const updateFromHex = (hexValue: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hexValue)) return;

    const rgbValue = hexToRgb(hexValue);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const hexValue = rgbToHex(r, g, b);
    setHex(hexValue.toUpperCase());
    setHsl(rgbToHsl(r, g, b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b).toUpperCase());
  };

  return (
    <>
      <SEOHead
        title={seoData.colorConverter?.title || 'Color Converter - HEX, RGB, HSL Color Conversion'}
        description={seoData.colorConverter?.description || 'Convert colors between HEX, RGB, and HSL formats. Real-time color preview and conversion for web design and development.'}
        canonical="https://calculatorhub.com/color-converter"
        schemaData={generateCalculatorSchema(
          'Color Converter',
          'Convert colors between HEX, RGB, and HSL formats',
          '/color-converter',
          ['color converter', 'hex to rgb', 'rgb to hex', 'hsl converter', 'color code']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Color Converter', url: '/color-converter' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Color Converter', url: '/color-converter' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">Color Converter</h1>
          </div>

          <div className="mb-8 p-8 rounded-xl border-4 border-slate-600" style={{ backgroundColor: hex }}>
            <p className="text-center text-2xl font-bold" style={{ color: hsl.l > 50 ? '#000' : '#fff' }}>
              {hex}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                HEX Color Code
              </label>
              <input
                type="text"
                value={hex}
                onChange={(e) => {
                  setHex(e.target.value.toUpperCase());
                  updateFromHex(e.target.value);
                }}
                className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="#3B82F6"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                RGB Color (Red, Green, Blue)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Red (0-255)</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.r}
                    onChange={(e) => {
                      const r = Math.min(255, Math.max(0, Number(e.target.value)));
                      setRgb({ ...rgb, r });
                      updateFromRgb(r, rgb.g, rgb.b);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Green (0-255)</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.g}
                    onChange={(e) => {
                      const g = Math.min(255, Math.max(0, Number(e.target.value)));
                      setRgb({ ...rgb, g });
                      updateFromRgb(rgb.r, g, rgb.b);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Blue (0-255)</label>
                  <input
                    type="number"
                    min={0}
                    max={255}
                    value={rgb.b}
                    onChange={(e) => {
                      const b = Math.min(255, Math.max(0, Number(e.target.value)));
                      setRgb({ ...rgb, b });
                      updateFromRgb(rgb.r, rgb.g, b);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                rgb({rgb.r}, {rgb.g}, {rgb.b})
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                HSL Color (Hue, Saturation, Lightness)
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Hue (0-360)</label>
                  <input
                    type="number"
                    min={0}
                    max={360}
                    value={hsl.h}
                    onChange={(e) => {
                      const h = Math.min(360, Math.max(0, Number(e.target.value)));
                      setHsl({ ...hsl, h });
                      updateFromHsl(h, hsl.s, hsl.l);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Saturation (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.s}
                    onChange={(e) => {
                      const s = Math.min(100, Math.max(0, Number(e.target.value)));
                      setHsl({ ...hsl, s });
                      updateFromHsl(hsl.h, s, hsl.l);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lightness (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={hsl.l}
                    onChange={(e) => {
                      const l = Math.min(100, Math.max(0, Number(e.target.value)));
                      setHsl({ ...hsl, l });
                      updateFromHsl(hsl.h, hsl.s, l);
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400 font-mono">
                hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
              </p>
            </div>
          </div>
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Color Converter</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              Convert colors seamlessly between HEX, RGB, and HSL formats with our real-time color converter.
              Perfect for web developers, designers, and anyone working with digital colors.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Color Format Guide:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>HEX:</strong> Hexadecimal format (#RRGGBB) commonly used in CSS and HTML</li>
              <li><strong>RGB:</strong> Red, Green, Blue values from 0-255, standard for digital displays</li>
              <li><strong>HSL:</strong> Hue (0-360), Saturation (0-100%), Lightness (0-100%), intuitive for color manipulation</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Use Cases:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Web design and development</li>
              <li>Graphic design projects</li>
              <li>CSS color code conversion</li>
              <li>Brand color consistency</li>
              <li>Digital art and illustration</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/color-converter" />
      </div>
    </>
  );
};

export default ColorConverter;
