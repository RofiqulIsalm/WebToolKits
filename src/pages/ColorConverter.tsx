import React, { useEffect, useMemo, useState } from 'react';
import {
  Palette,
  Copy, 
  Heart,
  RefreshCw,
  PlusCircle,
  Star,
  Trash2,
} from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

/**
 * Color Converter
 * - Enhanced UI/UX (responsive, animated, polished)
 * - Same conversion logic preserved & extended (HEX ⇆ RGB ⇆ HSL ⇆ CMYK)
 * - Copy, Random, Favorites (localStorage), Gradient generator (2 colors + angle)
 */

const btn =
  'inline-flex items-center gap-2 rounded-xl px-3 py-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed';
const btnPrimary =
  'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-900/30';
const btnNeutral =
  'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600';
const btnGhost =
  'bg-transparent hover:bg-slate-800/60 text-slate-200 border border-slate-700';

const card =
  'rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/60 border border-slate-700/70 backdrop-blur p-6';

const labelCls = 'block text-sm font-medium text-slate-200 mb-2';
const inputCls =
  'w-full px-3 py-2 bg-slate-800/70 text-white rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono';

const smallMono = 'mt-2 text-xs text-slate-400 font-mono break-all';

const ColorConverter: React.FC = () => {
  // ======= State (original + added) =======
  const [hex, setHex] = useState<string>('#3B82F6');
  const [rgb, setRgb] = useState({ r: 59, g: 130, b: 246 });
  const [hsl, setHsl] = useState({ h: 217, s: 91, l: 60 });
  const [cmyk, setCmyk] = useState({ c: 76, m: 47, y: 0, k: 4 });

  const [favorites, setFavorites] = useState<string[]>([]);
  const [color2, setColor2] = useState<string>('#10B981');
  const [angle, setAngle] = useState<number>(90);
  const [gradientCss, setGradientCss] = useState<string>('');

  const [toast, setToast] = useState<string>('');

  useEffect(() => {
    updateFromHex(hex);
    const saved = localStorage.getItem('favoriteColors');
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // ======= Conversions (existing logic preserved) =======
  const hexToRgb = (hexColor: string) => {
    const result =
      /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    '#' +
    [r, g, b]
      .map((x) => {
        const hx = x.toString(16);
        return hx.length === 1 ? '0' + hx : hx;
      })
      .join('');

  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const hslToRgb = (h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;

      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  const rgbToCmyk = (r: number, g: number, b: number) => {
    let c = 1 - r / 255;
    let m = 1 - g / 255;
    let y = 1 - b / 255;
    const k = Math.min(c, m, y);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    c = ((c - k) / (1 - k)) * 100;
    m = ((m - k) / (1 - k)) * 100;
    y = ((y - k) / (1 - k)) * 100;
    return {
      c: Math.round(c),
      m: Math.round(m),
      y: Math.round(y),
      k: Math.round(k * 100),
    };
  };

  const cmykToRgb = (c: number, m: number, y: number, k: number) => {
    c /= 100;
    m /= 100;
    y /= 100;
    k /= 100;
    const r = 255 * (1 - c) * (1 - k);
    const g = 255 * (1 - m) * (1 - k);
    const b = 255 * (1 - y) * (1 - k);
    return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
  };

  // ======= Update chains (unchanged behavior) =======
  const updateFromHex = (hexValue: string) => {
    if (!/^#[0-9A-F]{6}$/i.test(hexValue)) return;
    const rgbValue = hexToRgb(hexValue);
    if (rgbValue) {
      setRgb(rgbValue);
      setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
      setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
    }
  };

  const updateFromRgb = (r: number, g: number, b: number) => {
    const hexValue = rgbToHex(r, g, b);
    setHex(hexValue.toUpperCase());
    setHsl(rgbToHsl(r, g, b));
    setCmyk(rgbToCmyk(r, g, b));
  };

  const updateFromHsl = (h: number, s: number, l: number) => {
    const rgbValue = hslToRgb(h, s, l);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b).toUpperCase());
    setCmyk(rgbToCmyk(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  const updateFromCmyk = (c: number, m: number, y: number, k: number) => {
    const rgbValue = cmykToRgb(c, m, y, k);
    setRgb(rgbValue);
    setHex(rgbToHex(rgbValue.r, rgbValue.g, rgbValue.b).toUpperCase());
    setHsl(rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b));
  };

  // ======= UI Helpers =======
  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout((showToast as any)._t);
    (showToast as any)._t = window.setTimeout(() => setToast(''), 1200);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('Copied!');
  };

  const randomColor = () => {
    const randomHex =
      '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    setHex(randomHex.toUpperCase());
    updateFromHex(randomHex.toUpperCase());
    showToast('Randomized');
  };

  const toggleFavorite = () => {
    let updated = [...favorites];
    if (favorites.includes(hex)) {
      updated = updated.filter((f) => f !== hex);
      showToast('Removed from favorites');
    } else {
      updated.push(hex);
      showToast('Saved to favorites');
    }
    setFavorites(updated);
    localStorage.setItem('favoriteColors', JSON.stringify(updated));
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem('favoriteColors');
    showToast('Favorites cleared');
  };

  const generateGradient = () => {
    const css = `linear-gradient(${angle}deg, ${hex}, ${color2})`;
    setGradientCss(css);
    showToast('Gradient generated');
  };

  const previewTextColor = useMemo(() => {
    // Contrast-aware text color for the big preview
    const { r, g, b } = rgb;
    // Relative luminance (WCAG-ish)
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return lum > 0.6 ? '#0f172a' : '#ffffff'; // slate-900 or white
  }, [rgb]);

  // ======= Small UI Components =======
  const SectionTitle: React.FC<{ icon?: React.ReactNode; children: React.ReactNode }> = ({
    icon,
    children,
  }) => (
    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 flex items-center gap-2">
      {icon} {children}
    </h2>
  );

  const Divider = () => (
    <div className="my-6 h-px w-full bg-gradient-to-r from-transparent via-slate-600 to-transparent" />
  );

  // ======= Render =======
  return (
    <>
      
        <SEOHead
          title="Color Converter - Convert HEX, RGB, HSL, and CMYK | Online Gradient Generator"
          description="Free online color converter to convert between HEX, RGB, HSL, and CMYK. Copy color codes, generate gradients, save favorites, and preview colors instantly."
        
          // ✅ Open Graph + Twitter meta
          openGraph={{
            title: "Color Converter - HEX, RGB, HSL, CMYK & Gradient Tool | CalculatorHub",
            description:
              "Convert colors between HEX, RGB, HSL, and CMYK formats. Real-time preview, gradient generator, favorites, and one-click copy for web and print design.",
            url: "https://calculatorhub.site/color-converter",
            type: "website",
            site_name: "CalculatorHub",
            locale: "en_US",
            images: [
              {
                url: "https://calculatorhub.site/assets/color-converter-og.jpg",
                width: 1200,
                height: 630,
                alt: "Color Converter Tool - HEX, RGB, HSL, CMYK & Gradient Generator",
              },
            ],
          }}
        
          twitter={{
            card: "summary_large_image",
            site: "@calculatorhub",
            title: "Color Converter - HEX, RGB, HSL, CMYK & Gradient Tool",
            description:
              "Free color converter with real-time preview, gradient generator, and one-click copy. Convert between HEX, RGB, HSL, and CMYK effortlessly.",
            image: "https://calculatorhub.site/assets/color-converter-og.jpg",
          }}
        
          canonical="https://calculatorhub.site/color-converter"
        
          schemaData={{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Color Converter - HEX, RGB, HSL, CMYK & Gradient Tool",
            "url": "https://calculatorhub.site/color-converter",
            "description":
              "Convert colors instantly between HEX, RGB, HSL, and CMYK formats. Save favorites, copy codes, and generate gradients with live preview.",
            "mainEntity": {
              "@type": "SoftwareApplication",
              "name": "Color Converter",
              "applicationCategory": "WebApplication",
              "operatingSystem": "All",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "featureList": [
                "HEX to RGB, HSL, and CMYK conversion",
                "Bidirectional color conversion",
                "One-click copy color code",
                "Random color generator",
                "Save favorite colors (local storage)",
                "Gradient color generator (two-color)",
                "Responsive UI with real-time preview"
              ]
            },
            "faq": [
              {
                "@type": "Question",
                "name": "What is a Color Converter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "A tool that converts color codes between HEX, RGB, HSL, and CMYK for designers and developers."
                }
              },
              {
                "@type": "Question",
                "name": "How does this tool help web designers?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "It allows web designers to easily preview, copy, and use accurate color codes for CSS and brand consistency."
                }
              },
              {
                "@type": "Question",
                "name": "Can I save my favorite colors?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, you can save unlimited favorite colors in your browser for quick access."
                }
              },
              {
                "@type": "Question",
                "name": "Can I generate gradients?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, use the gradient generator to create smooth two-color gradients and copy the CSS code instantly."
                }
              },
              {
                "@type": "Question",
                "name": "Is it free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, this tool is completely free, secure, and requires no login or installation."
                }
              }
            ]
          }}
        
        
        />


      <div className="max-w-6xl mx-auto">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Color Converter', url: '/color-converter' },
          ]}
        />

        {/* Header */}
        <div className="mb-6 md:mb-8 px-1">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute -inset-1 rounded-2xl bg-blue-600/30 blur-lg" />
              <div className="relative rounded-2xl bg-blue-600/10 p-3 border border-blue-500/40">
                <Palette className="h-7 w-7 text-blue-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Color Converter
              </h1>
              <p className="text-slate-300 text-sm md:text-base">
                HEX ⇆ RGB ⇆ HSL ⇆ CMYK · Favorites · Gradient Generator
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Live Preview & Actions */}
          <section className={card}>
            <SectionTitle>Preview & Actions</SectionTitle>

            <div
              className="mb-5 rounded-2xl border-4 border-slate-700 overflow-hidden transition"
              style={{ backgroundColor: hex }}
            >
              <div
                className="flex flex-col items-center justify-center py-10 md:py-12 lg:py-16 transition-colors"
                style={{ color: previewTextColor }}
              >
                <div className="text-3xl md:text-4xl font-extrabold tracking-tight">
                  {hex}
                </div>
                <div className="mt-2 text-sm md:text-base opacity-90">
                  rgb({rgb.r}, {rgb.g}, {rgb.b}) · hsl({hsl.h}, {hsl.s}%,
                  {hsl.l}%)
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => copyToClipboard(hex)}
                className={`${btn} ${btnNeutral}`}
                aria-label="Copy HEX"
                title="Copy HEX"
              >
                <Copy size={16} /> Copy HEX
              </button>

              <button onClick={randomColor} className={`${btn} ${btnPrimary}`}>
                <RefreshCw size={16} /> Random
              </button>

              <button
                onClick={toggleFavorite}
                className={`${btn} ${
                  favorites.includes(hex) ? 'bg-pink-600 hover:bg-pink-500' : btnGhost
                }`}
              >
                <Heart size={16} />
                {favorites.includes(hex) ? 'Saved' : 'Save'}
              </button>
            </div>

            <Divider />

            {/* Quick pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hex}
                    onChange={(e) => {
                      setHex(e.target.value.toUpperCase());
                      updateFromHex(e.target.value.toUpperCase());
                    }}
                    className="h-10 w-14 rounded-lg border border-slate-600 bg-slate-900/50"
                  />
                  <input
                    type="text"
                    value={hex}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      setHex(v);
                      updateFromHex(v);
                    }}
                    className={inputCls}
                    placeholder="#3B82F6"
                  />
                </div>
                <p className={smallMono}>HEX</p>
              </div>

              <div>
                <label className={labelCls}>Secondary (Gradient)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value.toUpperCase())}
                    className="h-10 w-14 rounded-lg border border-slate-600 bg-slate-900/50"
                  />
                  <input
                    type="text"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value.toUpperCase())}
                    className={inputCls}
                    placeholder="#10B981"
                  />
                </div>
                <p className={smallMono}>HEX</p>
              </div>
            </div>
          </section>

          {/* Right: Converters */}
          <section className={card}>
            <SectionTitle>Color Models</SectionTitle>

            {/* RGB */}
            <div className="mb-5">
              <label className={labelCls}>RGB (0–255)</label>
              <div className="grid grid-cols-3 gap-3">
                <NumberBox
                  label="R"
                  value={rgb.r}
                  min={0}
                  max={255}
                  onChange={(v) => {
                    const r = clamp(v, 0, 255);
                    setRgb({ ...rgb, r });
                    updateFromRgb(r, rgb.g, rgb.b);
                  }}
                />
                <NumberBox
                  label="G"
                  value={rgb.g}
                  min={0}
                  max={255}
                  onChange={(v) => {
                    const g = clamp(v, 0, 255);
                    setRgb({ ...rgb, g });
                    updateFromRgb(rgb.r, g, rgb.b);
                  }}
                />
                <NumberBox
                  label="B"
                  value={rgb.b}
                  min={0}
                  max={255}
                  onChange={(v) => {
                    const b = clamp(v, 0, 255);
                    setRgb({ ...rgb, b });
                    updateFromRgb(rgb.r, rgb.g, b);
                  }}
                />
              </div>
              <CodeRow
                text={`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}
                onCopy={() => copyToClipboard(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`)}
              />
            </div>

            {/* HSL */}
            <div className="mb-5">
              <label className={labelCls}>HSL</label>
              <div className="grid grid-cols-3 gap-3">
                <NumberBox
                  label="H"
                  value={hsl.h}
                  min={0}
                  max={360}
                  onChange={(v) => {
                    const h = clamp(v, 0, 360);
                    setHsl({ ...hsl, h });
                    updateFromHsl(h, hsl.s, hsl.l);
                  }}
                />
                <NumberBox
                  label="S%"
                  value={hsl.s}
                  min={0}
                  max={100}
                  onChange={(v) => {
                    const s = clamp(v, 0, 100);
                    setHsl({ ...hsl, s });
                    updateFromHsl(hsl.h, s, hsl.l);
                  }}
                />
                <NumberBox
                  label="L%"
                  value={hsl.l}
                  min={0}
                  max={100}
                  onChange={(v) => {
                    const l = clamp(v, 0, 100);
                    setHsl({ ...hsl, l });
                    updateFromHsl(hsl.h, hsl.s, l);
                  }}
                />
              </div>
              <CodeRow
                text={`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}
                onCopy={() => copyToClipboard(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
              />
            </div>

            {/* CMYK */}
            <div>
              <label className={labelCls}>CMYK (%)</label>
              <div className="grid grid-cols-4 gap-3">
                {(['c', 'm', 'y', 'k'] as const).map((key) => (
                  <NumberBox
                    key={key}
                    label={key.toUpperCase()}
                    value={cmyk[key]}
                    min={0}
                    max={100}
                    onChange={(v) => {
                      const val = clamp(v, 0, 100);
                      const updated = { ...cmyk, [key]: val };
                      setCmyk(updated);
                      updateFromCmyk(updated.c, updated.m, updated.y, updated.k);
                    }}
                  />
                ))}
              </div>
              <CodeRow
                text={`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`}
                onCopy={() =>
                  copyToClipboard(
                    `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`
                  )
                }
              />
            </div>
          </section>
        </div>

        {/* Favorites */}
        <div className="mt-6 lg:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className={`lg:col-span-2 ${card}`}>
            <SectionTitle icon={<Star className="text-yellow-400" />}>
              Favorites
            </SectionTitle>

            {favorites.length === 0 ? (
              <p className="text-slate-300">
                No favorites yet. Click <span className="inline-flex items-center gap-1"><Heart size={14} className="text-pink-400" /> Save</span> to add.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  {favorites.map((fav) => (
                    <button
                      key={fav}
                      onClick={() => {
                        setHex(fav);
                        updateFromHex(fav);
                        showToast('Applied favorite');
                      }}
                      className="group relative h-12 w-12 rounded-xl border border-slate-700 transition hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ backgroundColor: fav }}
                      title={fav}
                      aria-label={`Apply ${fav}`}
                    >
                      <span className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 ring-white/70 transition" />
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={clearFavorites}
                    className={`${btn} ${btnGhost}`}
                    title="Clear all favorites"
                  >
                    <Trash2 size={16} /> Clear All
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Gradient */}
          <section className={card}>
            <SectionTitle icon={<PlusCircle />}>Gradient Generator</SectionTitle>

            <div className="space-y-4">
              <div className="h-20 rounded-xl border border-slate-700"
                   style={{ background: gradientCss || `linear-gradient(${angle}deg, ${hex}, ${color2})` }} />

              <div>
                <label className={labelCls}>Angle: {angle}°</label>
                <input
                  type="range"
                  min={0}
                  max={360}
                  value={angle}
                  onChange={(e) => setAngle(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={generateGradient} className={`${btn} ${btnPrimary}`}>
                  Generate
                </button>
                <button
                  onClick={() => {
                    const css = gradientCss || `linear-gradient(${angle}deg, ${hex}, ${color2})`;
                    copyToClipboard(css);
                  }}
                  className={`${btn} ${btnNeutral}`}
                >
                  <Copy size={16} /> Copy CSS
                </button>
              </div>

              <p className={smallMono}>
                {gradientCss || `linear-gradient(${angle}deg, ${hex}, ${color2})`}
              </p>
            </div>
          </section>
        </div>

        <AdBanner />

        {/* ------------------seo content------------------------ */}

          <div className="rounded-2xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">About Color Converter</h2>
            <h3 className="text-xl text-slate-300 mb-4">
              Convert, Explore, and Manage Colors Effortlessly
            </h3>
          
            <div className="space-y-4 text-slate-300 leading-relaxed">
              <p>
                <strong>Color Converter</strong> is an advanced online tool that allows you to
                instantly convert colors between <strong>HEX, RGB, HSL, and CMYK</strong> formats. Whether
                you’re a designer, developer, or digital artist, this converter helps you
                find, compare, and manage color codes with just a few clicks.
              </p>
          
              <p>
                It provides a real-time color preview, one-click copy functionality, random
                color generation, favorite color saving (via local storage), and even a
                <strong> gradient generator </strong> for creating smooth two-color blends
                for your projects.
              </p>
          
              <p>
                Our responsive interface ensures that you can use it seamlessly on
                desktop, tablet, or mobile. With accurate bidirectional conversion and a
                modern UI, this tool is ideal for anyone working with colors in
                <strong> web design, branding, or print media.</strong>
              </p>
          
              <h2 className="text-yellow-500 mt-6">
                <strong>Main Features</strong>
              </h2>
              <p>
                Explore a rich set of features that make color management simpler and
                faster:
              </p>
          
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  ✅ <strong>HEX ⇆ RGB ⇆ HSL ⇆ CMYK</strong> bidirectional color conversion
                </li>
                <li>
                  🎨 Real-time color preview with auto contrast adjustment
                </li>
                <li>📋 One-click copy for all color codes</li>
                <li>💾 Save favorite colors locally (persistent via LocalStorage)</li>
                <li>🎲 Generate random colors instantly</li>
                <li>
                  🌈 Create two-color gradients with adjustable angle and copyable CSS
                </li>
                <li>📱 Fully responsive, smooth, and fast user interface</li>
              </ul>
          
              <h2 className="text-yellow-500 mt-6">
                <strong>Benefits of Using This Color Converter</strong>
              </h2>
              <p>
                Our tool saves time and enhances creativity by removing the manual work of
                color calculations. Designers can focus on the aesthetic while developers
                get precise code formats for HTML, CSS, and design systems. It's perfect
                for maintaining consistent brand colors across web and print.
              </p>
          
              <h2 className="text-yellow-500 mt-6">
                <strong>Use Cases</strong>
              </h2>
              <p>Ideal for multiple professionals and workflows:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  🎨 <strong>Web Designers:</strong> Match brand colors and export CSS color codes
                </li>
                <li>
                  🖌️ <strong>Graphic Designers:</strong> Switch between print and digital color models
                </li>
                <li>
                  💻 <strong>Developers:</strong> Integrate consistent theme colors into projects
                </li>
                <li>
                  🖨️ <strong>Print Professionals:</strong> Convert CMYK to RGB or HEX for web previews
                </li>
              </ul>
          
              <p>
                In short, <strong>Color Converter</strong> is your all-in-one companion for color
                transformation, visualization, and creativity.
              </p>
          
              <h3 className="text-2xl font-semibold text-white mt-8">
                Why Choose This Color Converter?
              </h3>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accurate conversions for both web and print color models</li>
                <li>Fast, responsive design that works on any device</li>
                <li>Simple interface suitable for beginners and experts alike</li>
                <li>Free to use, no sign-up required</li>
              </ul>
          
              <p>
                Try it once — you’ll realize how quick and powerful color manipulation can
                be!
              </p>
          
              <AdBanner type="bottom" />
          
              {/* FAQ Section */}
              <section className="space-y-4 mt-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  ❓ Frequently Asked Questions (
                  <span className="text-yellow-300">FAQ</span>)
                </h2>
          
                <div className="space-y-4 text-slate-100 leading-relaxed">
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q1:</span> What is a Color Converter?
                    </h3>
                    <p>
                      A Color Converter is an online tool that converts color values
                      between different formats such as HEX, RGB, HSL, and CMYK, allowing
                      you to use accurate color codes in both web and print designs.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q2:</span> How does this tool help web designers?
                    </h3>
                    <p>
                      It helps designers easily match brand colors, copy CSS codes, and
                      visualize how colors will appear on websites or digital designs in
                      real time.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q3:</span> Can I generate random colors?
                    </h3>
                    <p>
                      Yes! The “Random Color” button instantly generates a new color with
                      all its code values displayed and ready to copy or save.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q4:</span> How can I save my favorite colors?
                    </h3>
                    <p>
                      Simply click the “Save” button. The tool stores your favorites in
                      your browser’s local storage so they stay available even after you
                      close the tab.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q5:</span> What is CMYK conversion used for?
                    </h3>
                    <p>
                      CMYK is the standard color model for printing. Converting to CMYK
                      ensures your designs print with the correct ink colors and tones.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q6:</span> Can I generate gradients with this tool?
                    </h3>
                    <p>
                      Absolutely! Pick two colors and use the gradient generator to
                      preview and copy linear gradient CSS code for your website or app
                      design.
                    </p>
                  </div>
          
                  <div className="bg-slate-800/60 p-4 rounded-lg">
                    <h3 className="font-semibold text-xl">
                      <span className="text-yellow-300">Q7:</span> Is this tool free to use?
                    </h3>
                    <p>
                      Yes! Our color converter is 100% free, secure, and doesn’t require
                      registration or downloads. Use it anytime to simplify your color
                      workflow.
                    </p>
                  </div>
                </div>
              </section>
          
            </div>
          </div>

          <section className="mt-10 border-t border-gray-700 pt-6 text-slate-300">
              <div className="flex items-center gap-3">
                <img
                  src="/images/calculatorhub-author.webp"
                  alt="CalculatorHub Security Tools Team"
                  className="w-12 h-12 rounded-full border border-gray-600"
                  loading="lazy"
                />
                <div>
                  <p className="font-semibold text-white">Written by the CalculatorHub Security Tools Team</p>
                  <p className="text-sm text-slate-400">
                    Experts in web security and online calculator development. Last updated: <time dateTime="2025-10-10">October 10, 2025</time>.
                  </p>
                </div>
              </div>
            </section>

        <RelatedCalculators currentPath="/color-converter" />
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-5 right-5 z-50 transition-all ${
          toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        <div className="rounded-xl bg-slate-800/90 border border-slate-700 text-white px-4 py-2 shadow-lg">
          {toast}
        </div>
      </div>
    </>
  );
};

/* ---------- Reusable subcomponents ---------- */

function clamp(v: number, min: number, max: number) {
  if (Number.isNaN(v)) return min;
  return Math.min(max, Math.max(min, v));
}

const NumberBox: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, onChange }) => {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputCls}
      />
    </div>
  );
};

const CodeRow: React.FC<{ text: string; onCopy: () => void }> = ({
  text,
  onCopy,
}) => {
  return (
    <div className="mt-2 flex items-center justify-between gap-2">
      <code className="text-sm md:text-base font-mono text-slate-200 break-all">
        {text}
      </code>
      <button
        onClick={onCopy}
        className={`${btn} ${btnNeutral} shrink-0`}
        title="Copy"
        aria-label="Copy"
      >
        <Copy size={16} />
      </button>

      
    </div>
  );
};

export default ColorConverter;
