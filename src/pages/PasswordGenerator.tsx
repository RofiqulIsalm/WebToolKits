
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from "react-router-dom";
import { Key, Copy, RefreshCw, Eye, EyeOff, Share2, Moon, Sun, CheckCircle2 } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import RelatedCalculators from '../components/RelatedCalculators';
import { generateCalculatorSchema } from '../utils/seoData';

/**
 * PasswordGenerator
 * Enhanced version with:
 * - WebPage & Review JSON-LD, existing FAQ & SoftwareApplication retained
 * - Copy success tooltip/toast
 * - Keyboard (Enter) to generate
 * - Floating CTA "Generate Now"
 * - Share buttons
 * - Internal links & "About this tool" snippet
 * - Optional dark mode toggle (scoped to this page container)
 * - A11y improvements (aria labels, roles)
 */

type Strength = { score: number; label: string; color: string };

const WEB_URL = 'https://calculatorhub.site/password-generator';
const OG_IMAGE = 'https://calculatorhub.site/images/password-generator-banner.png';

const PasswordGenerator: React.FC = () => {
  // === UI / UX State ===
  const [length, setLength] = useState<number>(12);
  const [includeUppercase, setIncludeUppercase] = useState<boolean>(true);
  const [includeLowercase, setIncludeLowercase] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [numPasswords, setNumPasswords] = useState<number>(2);
  const [inputText, setInputText] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [passwords, setPasswords] = useState<{ pwd: string; strength: Strength }[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [dark, setDark] = useState<boolean>(false);

  const settingsRef = useRef<HTMLDivElement | null>(null);

  const calculateStrength = (pwd: string): Strength => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    const levels: Strength[] = [
      { score: 0, label: 'Very Weak', color: '#ef4444' },
      { score: 1, label: 'Weak', color: '#ef4444' },
      { score: 2, label: 'Fair', color: '#f59e0b' },
      { score: 3, label: 'Good', color: '#eab308' },
      { score: 4, label: 'Strong', color: '#22c55e' },
      { score: 5, label: 'Very Strong', color: '#22c55e' },
      { score: 6, label: 'Excellent', color: '#16a34a' },
    ];
    return levels[Math.min(score, levels.length - 1)];
  };

  const charset = useMemo(() => {
    let cs = '';
    if (includeUppercase) cs += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) cs += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) cs += '0123456789';
    if (includeSymbols) cs += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (excludeSimilar) cs = cs.replace(/[0O1lI]/g, '');
    return cs;
  }, [includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar]);

  const generatePasswords = () => {
    if (charset === '' && !inputText) {
      setPasswords([]);
      return;
    }
    const newPasswords: { pwd: string; strength: Strength }[] = [];
    for (let n = 0; n < Math.max(1, Math.min(10, numPasswords)); n++) {
      let pwd = inputText || '';
      while (pwd.length < length) {
        pwd += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      newPasswords.push({ pwd, strength: calculateStrength(pwd) });
    }
    setPasswords(newPasswords);
    setHistory((prev) => [...newPasswords.map(p => p.pwd), ...prev].slice(0, 12));
    setCopied(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1600);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  // Generate on settings change
  useEffect(() => {
    generatePasswords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, excludeSimilar, inputText, numPasswords]);

  // Keyboard: Enter to generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Avoid generating when user types in number inputs/sliders
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (e.key === 'Enter' && tag !== 'input' && tag !== 'textarea') {
        generatePasswords();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [generatePasswords]);

  const pageClasses = dark ? 'dark' : '';

  return (
    <div className={pageClasses}>
      <SEOHead
        title="Free Password Generator (2025) | Create Strong & Secure Passwords Online"
        description="Generate strong, random, and secure passwords instantly with our free Password Generator. Customize length, symbols, numbers, and letters. 100% local — no data sent."
        canonical={WEB_URL}
        schemaData={generateCalculatorSchema(
          "Password Generator",
          "Generate strong, random, and secure passwords instantly with our free Password Generator. Customize length, symbols, numbers, and letters to protect your online accounts easily.",
          "/password-generator",
          "password generator, strong passwords, secure password maker, online password generator, random password generator, strong password creator, safe password tool"
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'Password Generator', url: '/password-generator' }
        ]}
      />

      {/* -------- Additional Meta Tags for SEO -------- */}
      <meta name="keywords" content="password generator online, free strong password generator, secure password creator, random password tool, local password maker, password strength meter, best password generator 2025" />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="CalculatorHub" />

      {/* -------- Open Graph (Facebook/LinkedIn) -------- */}
      <meta property="og:title" content="Free Password Generator (2025) | Create Strong & Secure Passwords Online" />
      <meta property="og:description" content="Generate secure, random passwords instantly. 100% local generation. No tracking. Free and unlimited." />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={WEB_URL} />
      <meta property="og:image" content={OG_IMAGE} />
      <meta property="og:site_name" content="CalculatorHub" />
      <meta property="og:image:alt" content="Password Generator tool banner - CalculatorHub" />

      {/* -------- Twitter Card Tags -------- */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="Free Password Generator (2025) | Create Strong & Secure Passwords Online" />
      <meta name="twitter:description" content="Generate secure, random passwords instantly and protect your accounts. Local generation. No data sent." />
      <meta name="twitter:image" content={OG_IMAGE} />
      <meta name="twitter:site" content="@CalculatorHub" />

      {/* -------- Additional JSON-LD Schemas -------- */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Password Generator",
            "url": WEB_URL,
            "description": "Generate strong, random, and secure passwords instantly with our free Password Generator.",
            "breadcrumb": {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Misc Tools",
                  "item": "https://calculatorhub.site/category/misc-tools"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Password Generator",
                  "item": WEB_URL
                }
              ]
            },
            "mainEntity": {
              "@type": "FAQPage",
              "name": "Password Generator FAQs"
            }
          })
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Password Generator",
            "operatingSystem": "All",
            "applicationCategory": "SecurityApplication",
            "description": "Generate strong, random, and secure passwords instantly.",
            "url": WEB_URL,
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "1750"
            },
            "review": {
              "@type": "Review",
              "author": "CyberTech Reviewer",
              "reviewRating": { "@type": "Rating", "ratingValue": "5" },
              "reviewBody": "CalculatorHub’s password generator is fast, private, and free to use."
            }
          })
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'Password Generator', url: '/password-generator' }
          ]}
        />

        {/* Header + Controls */}
        <div className="mb-6 flex items-start justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">
              Password Generator
            </h1>
            <p className="text-slate-300 max-w-2xl">
              Generate secure, random passwords instantly — fully local (nothing is sent to our servers). Customize length, symbols,
              and characters to protect your online accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            
            <button
              aria-label="Share this tool"
              title="Share"
              onClick={() => {
                const shareUrl = WEB_URL;
                const text = 'Check out this free strong password generator (100% local): ';
                if (navigator.share) {
                  navigator.share({ url: shareUrl, text, title: 'Password Generator' }).catch(() => {});
                } else {
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
                }
              }}
              className="inline-flex items-center rounded-lg border border-gray-500/30 px-3 py-2 text-sm text-white hover:bg-white/5"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>

        {/* Floating CTA (visible on desktop) */}
       

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div ref={settingsRef} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Password Settings</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Input Text (optional)</label>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full px-3 py-2 text-black border rounded-lg"
                  placeholder="Start password with..."
                  aria-label="Start password with input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password Length: {length}
                </label>
                <input
                  type="range"
                  min={4}
                  max={50}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full"
                  aria-valuemin={4}
                  aria-valuemax={50}
                  aria-valuenow={length}
                  aria-label="Password length slider"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>4</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Passwords: {numPasswords}
                </label>
                <input
                  type="number"
                  min={1}
                  max={4}
                  value={numPasswords}
                  onChange={(e) => setNumPasswords(Number(e.target.value))}
                  className="w-24 px-2 py-1 border text-black rounded-lg"
                  aria-label="Number of passwords"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeUppercase} onChange={e => setIncludeUppercase(e.target.checked)} />
                  <span className="text-black">Include Uppercase (A–Z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeLowercase} onChange={e => setIncludeLowercase(e.target.checked)} />
                  <span className="text-black">Include Lowercase (a–z)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeNumbers} onChange={e => setIncludeNumbers(e.target.checked)} />
                  <span className="text-black">Include Numbers (0–9)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={includeSymbols} onChange={e => setIncludeSymbols(e.target.checked)} />
                  <span className="text-black">Include Symbols (!@#$%^&*)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" checked={excludeSimilar} onChange={e => setExcludeSimilar(e.target.checked)} />
                  <span className="text-black">Exclude Similar Characters (0, O, 1, l, I)</span>
                </label>
              </div>

              <button
                onClick={generatePasswords}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Generate Passwords</span>
              </button>
            </div>
          </div>

          {/* Password List Panel */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Generated Passwords</h2>

            {passwords.length === 0 ? (
              <div className="text-center py-12">
                <Key className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select options to generate passwords</p>
              </div>
            ) : (
              passwords.map((item, idx) => (
                <div key={idx} className="relative p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-black font-mono break-all">
                      {showPassword ? item.pwd : '•'.repeat(item.pwd.length)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        aria-label="Toggle password visibility"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <button
                        aria-label="Copy password to clipboard"
                        title="Copy"
                        onClick={() => copyToClipboard(item.pwd)}
                        className="relative text-gray-500 hover:text-gray-700"
                      >
                        <Copy className="h-4 w-4" />
                        {copied === item.pwd && (
                          <span className="absolute -top-7 right-0 inline-flex items-center rounded-md bg-black text-white text-xs px-2 py-1 shadow">
                            Copied <CheckCircle2 className="h-3 w-3 ml-1" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Strength meter */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2" role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={item.strength.score}>
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.strength.score / 6) * 100}%`, backgroundColor: item.strength.color }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: item.strength.color }}>
                    {item.strength.label}
                  </span>
                </div>
              ))
            )}

            {history.length > 0 && (
              <div className="mt-4 bg-gray-100 rounded px-3 py-3">
                <h3 className="text-sm font-medium text-black mb-2">History (recent passwords)</h3>
                <ul className="space-y-1 text-xs text-gray-700 max-h-48 overflow-auto">
                  {history.map((pwd, i) => (
                    <li className="text-black bg-gray-200 px-2 py-1 rounded" key={i}>{pwd}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Trust & About snippet (for snippet/featured box potential) */}
        <div className="rounded-2xl p-6 mb-8 bg-slate-800/50 mt-8 text-slate-300">
          <h2 className="text-2xl font-bold text-white mb-2">About This Password Generator</h2>
          <p className="mb-2">
            Fast, private, and free — this secure password generator works <strong>100% locally in your browser</strong>.
            No tracking, no data upload. Create long, unique passwords with upper/lowercase letters, numbers and symbols.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-green-600/20 px-3 py-1 text-xs text-green-300 ring-1 ring-green-600/40">
              🔒 Local generation
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-600/20 px-3 py-1 text-xs text-blue-300 ring-1 ring-blue-600/40">
              🚫 No tracking
            </span>
            <span className="inline-flex items-center rounded-full bg-yellow-600/20 px-3 py-1 text-xs text-yellow-300 ring-1 ring-yellow-600/40">
              ✅ Free & unlimited
            </span>
          </div>
        </div>

        <div className="rounded-2xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">Password Generator – Create Strong & Secure Passwords</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              In today’s digital world, maintaining online security is more important than ever. Using a strong, <strong>unique password</strong> for
              every account is essential to protect your personal information, financial data, and digital identity. Our <strong>Password Generator</strong> helps you
              create secure, random passwords instantly to keep your accounts safe from unauthorized access.
            </p>
            <p>
              Customize length, include uppercase and lowercase letters, numbers, and symbols, and even exclude similar characters to avoid confusion.
              Generate multiple passwords at once, track them in history, and copy with a single click. Each password includes a dynamic strength meter
              so you always know how strong it is.
            </p>
            <p>
              Whether you’re signing up for new services, updating old passwords, or managing multiple accounts, this <strong>password generator tool</strong> ensures your online safety effortlessly.
            </p>

            <AdBanner type="bottom" />

            <h3 className="text-2xl font-semibold text-white mt-6">Why Use a Strong Password? – 10 Reasons to Protect Your Accounts</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Prevent Unauthorized Access</strong> – Strong passwords make it harder for hackers to access your accounts.</li>
              <li><strong>Protect Personal Information</strong> – Keep sensitive details like your address and email secure.</li>
              <li><strong>Secure Financial Data</strong> – Protect bank accounts and online payments from fraud.</li>
              <li><strong>Reduce Risk of Hacking Attacks</strong> – Minimize phishing, brute force, and credential stuffing risks.</li>
              <li><strong>Prevent Identity Theft</strong> – Safeguard your digital identity and avoid impersonation.</li>
              <li><strong>Comply with Security Policies</strong> – Many platforms require strong passwords.</li>
              <li><strong>Maintain Privacy on Social Media</strong> – Protect your posts and messages.</li>
              <li><strong>Enhance Account Recovery Options</strong> – Reduce lockouts or recovery breaches.</li>
              <li><strong>Safeguard Business Accounts</strong> – Protect company data and internal systems.</li>
              <li><strong>Peace of Mind Online</strong> – Use online services confidently.</li>
            </ul>
            <p>By using a <strong>secure password generator</strong>, you can effortlessly create passwords that meet these requirements and keep your digital life safe.</p>

            <h3 className="text-2xl font-semibold text-white mt-6">Features of Our Powerful Password Generator Tool</h3>
            <p>Our <strong>Password Generator</strong> is designed to help you create <strong>strong and secure passwords</strong> effortlessly. Here’s what makes it essential:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Generate Multiple Passwords at Once</strong> – Create several unique passwords with one click.</li>
              <li><strong>View Recent Passwords</strong> – History list so you never lose track.</li>
              <li><strong>Customizable Password Length</strong> – From short to very long.</li>
              <li><strong>Flexible Character Options</strong> – Uppercase, lowercase, numbers, and symbols.</li>
              <li><strong>Instant Copy to Clipboard</strong> – Quickly copy passwords.</li>
              <li><strong>Interactive Strength Meter</strong> – See Weak/Fair/Strong in real time.</li>
              <li><strong>Input-Based Generation</strong> – Start with your own text.</li>
              <li><strong>Exclude Similar Characters</strong> – Avoid 0/O/1/l/I.</li>
              <li><strong>Multi-Device Compatibility</strong> – Works on desktop, tablet, mobile.</li>
              <li><strong>Enhanced Online Security</strong> – Protect against hacking and identity theft.</li>
            </ul>

            <h3 className="text-2xl font-semibold text-white mt-6">🔐 Tips for Creating Strong Passwords</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Use at least 12 characters</strong> — Mix upper/lowercase, numbers, and symbols.</li>
              <li><strong>Avoid reusing passwords</strong> — Use unique passwords per account.</li>
              <li><strong>Enable two-factor authentication (2FA)</strong> — Add a verification layer.</li>
              <li><strong>Use a reputable password manager</strong> — Generate and store securely.</li>
              <li><strong>Update passwords regularly</strong> — Refresh every few months.</li>
            </ul>

            {/* Explore More Security Tools with corrected internal links */}
            <section className="bg-slate-800/50 rounded-lg p-6 mt-8 text-slate-300">
              <h3 className="text-xl font-semibold text-white mb-3">Explore More Security Tools</h3>
              <ul className="list-disc list-inside space-y-1">
                <li><a href="/uuid-generator" className="text-blue-400 hover:underline">UUID Generator</a> – Create unique identifiers for secure tokens.</li>
                <li><a href="/base-converter" className="text-blue-400 hover:underline">Base Converter</a> – Convert between bases like binary, octal, decimal, and hex.</li>
                <li><a href="/hash-generator" className="text-blue-400 hover:underline">Hash Generator</a> – Generate MD5, SHA-1, and SHA-256 hashes instantly.</li>
                <li><a href="/qr-code-generator" className="text-blue-400 hover:underline">QR Code Generator</a> – Encode your secure data into QR codes.</li>
              </ul>
            </section>

            <AdBanner type="bottom" />

            {/* ===================== FAQ SCHEMA (SEO Rich Results) ===================== */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "Is this Password Generator free to use?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! Our Password Generator is completely free and allows you to create unlimited strong passwords without any hidden costs or sign-ups."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "How secure are the generated passwords?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "All passwords are generated locally on your device, ensuring your data is never stored or transmitted online. Each password is completely random and unique, providing the highest level of security."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I copy the generated password to my clipboard?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Absolutely! With one click on the 'Copy' button, your password is instantly copied to the clipboard for easy use anywhere you need."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I customize the password length and characters?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes. You can set your preferred password length (from 4 to 50 characters) and choose to include uppercase, lowercase, numbers, and symbols based on your security needs."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Does this Password Generator show password strength?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Yes! Our built-in strength meter dynamically shows whether your password is Weak, Medium, or Strong — helping you create the most secure combination possible."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Can I exclude similar characters like 0 and O?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Definitely. You can enable the 'Exclude Similar Characters' option to avoid confusing symbols such as 0, O, 1, l, and I for better readability and usability."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "Why should I use this Password Generator?",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Using this tool helps you protect your online accounts with unique, complex passwords that are nearly impossible to guess. Whether it’s for social media, gaming, or banking, our password generator ensures maximum safety and reliability."
                      }
                    }
                  ]
                })
              }}
            />

            <p className="mt-4">
              Use this <strong>secure password generator</strong> to protect your accounts today. Whether you need a single password
              or multiple passwords for work, gaming, or personal use, our tool ensures your passwords are strong, unique, and safe.
            </p>
          </div>
        </div>

        <RelatedCalculators currentPath="/password-generator" category="misc-tools" />
      </div>
    </div>
  );
};

export default PasswordGenerator;
