import React, { useEffect, useMemo, useState } from 'react';
import { Link } from "react-router-dom";
import {
  Key,
  Copy,
  Check,
  RefreshCw,
  Save,
  CaseSensitive,
  Info,
  ShieldCheck,
  Settings2,
} from 'lucide-react';
import {
  v1 as uuidv1,
  v4 as uuidv4,
  v5 as uuidv5,
  validate as uuidValidate,
  version as uuidVersion,
  parse as uuidParse,
} from 'uuid';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

type UuidVersion = 'v1' | 'v4' | 'v5';
type OutputFormat = 'hyphenated' | 'compact' | 'base64' | 'urn';
type Separator = 'newline' | 'comma' | 'space';

type RawEntry = {
  uuid: string;        // raw hyphenated uuid
  decodedAt?: string;  // decoded timestamp for v1 (ISO)
};

const ADVANCED_LS_KEY = 'uuid-advanced-enabled';

const UUIDGenerator: React.FC = () => {
  // --- Basic controls ---
  const [count, setCount] = useState<number>(1);
  const [version, setVersion] = useState<UuidVersion>('v1');

  // --- Advanced controls ---
  const [advancedEnabled, setAdvancedEnabled] = useState<boolean>(false);
  const [advLoading, setAdvLoading] = useState<boolean>(false);
  const [format, setFormat] = useState<OutputFormat>('hyphenated');
  const [isUppercase, setIsUppercase] = useState<boolean>(false);
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  const [separator, setSeparator] = useState<Separator>('newline');

  // V5 inputs
  const [v5Namespace, setV5Namespace] = useState<string>('6ba7b811-9dad-11d1-80b4-00c04fd430c8'); // DNS namespace
  const [v5Name, setV5Name] = useState<string>('calculatorhub.site');

  // Output
  const [rawList, setRawList] = useState<RawEntry[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Validator
  const [validateInput, setValidateInput] = useState<string>('');
  const validateResult = useMemo(() => {
    if (!validateInput.trim()) return null;
    const val = validateInput.trim();
    const ok = uuidValidate(val);
    const ver = ok ? `v${uuidVersion(val)}` : 'invalid';
    return { ok, ver };
  }, [validateInput]);

  // --- Persist Advanced Mode ---
  useEffect(() => {
    const saved = localStorage.getItem(ADVANCED_LS_KEY);
    if (saved === '1') setAdvancedEnabled(true);
  }, []);
  useEffect(() => {
    localStorage.setItem(ADVANCED_LS_KEY, advancedEnabled ? '1' : '0');
  }, [advancedEnabled]);

  // --- Helpers ---
  const hyphenatedToCompact = (id: string) => id.replace(/-/g, '');
  const toURN = (id: string) => `urn:uuid:${id}`;
  const toBase64 = (id: string) => {
    try {
      const bytes = uuidParse(id); // Uint8Array(16)
      let binary = '';
      bytes.forEach((b) => (binary += String.fromCharCode(b)));
      return btoa(binary);
    } catch {
      return id;
    }
  };

  const applyFormat = (id: string, fmt: OutputFormat): string => {
    switch (fmt) {
      case 'compact':
        return hyphenatedToCompact(id);
      case 'base64':
        return toBase64(id);
      case 'urn':
        return toURN(id);
      default:
        return id; // hyphenated
    }
  };

  const applyCasing = (s: string) => (format === 'base64' ? s : isUppercase ? s.toUpperCase() : s.toLowerCase());

  const formatForDisplay = (entry: RawEntry): string => {
    let out = applyFormat(entry.uuid, format);
    out = applyCasing(out);
    if (prefix || suffix) out = `${prefix}${out}${suffix}`;
    return out;
  };

  // RFC 4122 v1 timestamp decode
  const decodeV1Timestamp = (id: string): string | undefined => {
    try {
      if (!uuidValidate(id) || uuidVersion(id) !== 1) return undefined;
      const [time_low, time_mid, time_hi_and_version] = id.split('-');
      const tl = BigInt(`0x${time_low}`);
      const tm = BigInt(`0x${time_mid}`);
      const thv = BigInt(`0x${time_hi_and_version}`);
      const timeHigh = thv & BigInt(0x0fff); // mask version bits
      const timestamp100ns = (timeHigh << BigInt(48)) | (tm << BigInt(32)) | tl;
      const GREGORIAN_TO_UNIX_100NS = BigInt(122192928000000000);
      const unix100ns = timestamp100ns - GREGORIAN_TO_UNIX_100NS;
      const ms = Number(unix100ns / BigInt(10000));
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) return undefined;
      return date.toISOString();
    } catch {
      return undefined;
    }
  };

  // --- Actions ---
  const generate = () => {
    const n = Math.min(1000, Math.max(1, count));
    const next: RawEntry[] = [];
    for (let i = 0; i < n; i++) {
      let id = '';
      if (version === 'v1') {
        id = uuidv1();
      } else if (version === 'v5') {
        const ns = uuidValidate(v5Namespace) ? v5Namespace : uuidv5.URL;
        const name = v5Name || `uuid-${i}-${Date.now()}`;
        id = uuidv5(name, ns);
      } else {
        id = uuidv4();
      }
      next.push({ uuid: id, decodedAt: version === 'v1' ? decodeV1Timestamp(id) : undefined });
    }
    setRawList(next);
    setCopiedIndex(null);
  };

  const copySingle = async (i: number) => {
    try {
      await navigator.clipboard.writeText(formatForDisplay(rawList[i]));
      setCopiedIndex(i);
      setTimeout(() => setCopiedIndex(null), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  const copyAll = async () => {
    try {
      const sep = separator === 'newline' ? '\n' : separator === 'comma' ? ',' : ' ';
      const payload = rawList.map((r) => formatForDisplay(r)).join(sep);
      await navigator.clipboard.writeText(payload);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 1400);
    } catch (e) {
      console.error(e);
    }
  };

  const download = (type: 'txt' | 'json' | 'csv') => {
    const name = `uuids_${version}_${format}.${type}`;
    let content = '';
    let mime = 'text/plain;charset=utf-8';

    if (type === 'txt') {
      content = rawList.map((r) => formatForDisplay(r)).join('\n');
    } else if (type === 'json') {
      content = JSON.stringify(rawList.map((r) => formatForDisplay(r)), null, 2);
      mime = 'application/json;charset=utf-8';
    } else {
      const header = 'uuid,timestamp\n';
      const rows = rawList
        .map((r) => {
          const u = formatForDisplay(r).replace(/"/g, '""');
          const ts = r.decodedAt || '';
          return `"${u}","${ts}"`;
        })
        .join('\n');
      content = header + rows;
      mime = 'text/csv;charset=utf-8';
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAdvanced = () => {
    if (!advancedEnabled) {
      setAdvLoading(true);
      setTimeout(() => {
        setAdvancedEnabled(true);
        setAdvLoading(false);
      }, 800);
    } else {
      setAdvancedEnabled(false);
      setAdvLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="UUID Generator – V1, V4, V5 | Bulk Generate, Copy, Download"
        description="Generate UUIDs (V1, V4, V5). Copy single/all, uppercase/lowercase, hyphenated/compact/Base64/URN. Decode timestamps for V1 and export as TXT/JSON/CSV."
        canonical="https://calculatorhub.site/uuid-generator"
        schemaData={generateCalculatorSchema(
          'UUID Generator',
          'Generate multiple UUIDs (V1, V4, V5) with advanced formats, timestamp decode, validation, and exports.',
          '/uuid-generator',
          ['uuid generator', 'uuid v1 v4 v5', 'bulk uuid', 'uuid timestamp', 'uuid base64', 'uuid validator']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'UUID Generator', url: '/uuid-generator' },
        ]}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
 

      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'UUID Generator', url: '/uuid-generator' },
          ]}
        />

        {/* Card */}
        <div className="rounded-2xl p-5 sm:p-8 mb-8 bg-gradient-to-b from-slate-800/70 to-slate-900 border border-slate-700 shadow-lg backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl shrink-0">
                <Key className="text-blue-400 h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">
                UUID Generator
              </h1>
            </div>

            {/* Advanced Mode button */}
            <button
              onClick={toggleAdvanced}
              className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg border text-sm sm:text-base font-medium transition-all duration-200
                ${advancedEnabled
                  ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                  : 'bg-blue-600/20 border-blue-500/40 text-blue-100 hover:bg-blue-600/30'
                }`}
              title="Toggle Advanced Mode"
            >
              <Settings2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">{advancedEnabled ? 'Advanced: ON' : 'Advanced Mode'}</span>
            </button>
          </div>

          {/* Basic controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">UUID Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value as UuidVersion)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="v1">Version 1 (Time-based)</option>
                <option value="v4">Version 4 (Random)</option>
                <option value="v5">Version 5 (Namespace + Name)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">How many?</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(1000, Number(e.target.value))))}
                min={1}
                max={1000}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-400 mt-1">Up to 1000 at once</p>
            </div>

            {/* Generate button (basic) */}
            <div className="flex items-end"> 
              <button
                onClick={generate}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                <span>Generate UUID{count > 1 ? 's' : ''}</span>
              </button>
            </div>
          </div>

          {/* Loading indicator for advanced panel */}
          {advLoading && (
            <div className="mb-6 flex items-center gap-3 text-slate-200">
              <div className="h-5 w-5 rounded-full border-2 border-slate-500 border-t-white animate-spin" />
              <span className="text-sm">Loading advanced tools…</span>
            </div>
          )}

          {/* Advanced panel (Tailwind-only animation) */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out
              ${advancedEnabled ? 'max-h-[1200px] opacity-100 mt-2' : 'max-h-0 opacity-0'}
            `}
          >
            <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Output format */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Output format</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="hyphenated">Hyphenated</option>
                  <option value="compact">Compact (no hyphens)</option>
                  <option value="base64">Base64 (16 bytes)</option>
                  <option value="urn">URN (urn:uuid:...)</option>
                </select>
              </div>

              {/* Case toggle */}
              <div className="flex items-end">
                <button
                  onClick={() => setIsUppercase((s) => !s)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-lg hover:bg-slate-700 transition"
                  title="Toggle case (not applied to Base64)"
                >
                  <CaseSensitive className="w-5 h-5 text-blue-400" />
                  {isUppercase ? 'UPPERCASE' : 'lowercase'}
                </button>
              </div>

              {/* Prefix */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Prefix</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. user-"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Suffix */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Suffix</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g. -prod"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Copy-all separator */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Copy All separator</label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value as Separator)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="newline">Newline</option>
                  <option value="comma">Comma</option>
                  <option value="space">Space</option>
                </select>
              </div>

              {/* V5 namespace/name */}
              {version === 'v5' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">V5 Namespace (UUID)</label>
                    <input
                      type="text"
                      placeholder="e.g. 6ba7b811-9dad-11d1-80b4-00c04fd430c8"
                      value={v5Namespace}
                      onChange={(e) => setV5Namespace(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-xs text-slate-400 mt-1">Use a valid namespace UUID (DNS/URL/OID/X500 or custom)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">V5 Name</label>
                    <input
                      type="text"
                      placeholder="e.g. calculatorhub.site"
                      value={v5Name}
                      onChange={(e) => setV5Name(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Export buttons */}
              <div className="flex flex-wrap items-end gap-2">
                <button
                  onClick={() => download('txt')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  <Save className="h-4 w-4 text-blue-400" />
                  .txt
                </button>
                <button
                  onClick={() => download('json')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  <Save className="h-4 w-4 text-blue-400" />
                  .json
                </button>
                <button
                  onClick={() => download('csv')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                >
                  <Save className="h-4 w-4 text-blue-400" />
                  .csv
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {rawList.length > 0 && (
            <div className="space-y-5 mt-8">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">Generated UUIDs ({rawList.length})</h3>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
                  >
                    {copiedIndex === -1 ? (
                      <>
                        <Check className="h-4 w-4 text-green-400" />
                        <span>Copied All!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                {rawList.map((r, i) => {
                  const out = formatForDisplay(r);
                  const showTimestamp = r.decodedAt && version === 'v1';
                  return (
                    <div
                      key={`${r.uuid}-${i}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group break-words"
                    >
                      <div className="flex-1 min-w-0">
                        <code className="text-slate-200 font-mono text-sm break-all">{out}</code>
                        {showTimestamp && (
                          <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            <span>Timestamp (from V1): {new Date(r.decodedAt!).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => copySingle(i)}
                        className="mt-2 sm:mt-0 sm:ml-4 px-3 py-2 rounded-lg bg-slate-700/0 hover:bg-slate-600 transition"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-slate-300 group-hover:text-white" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <AdBanner />

        {/* Validator Panel */}
        <div className="rounded-2xl p-5 sm:p-8 mb-8 bg-slate-900/70 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            UUID Validator
          </h2>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <input
              type="text"
              value={validateInput}
              onChange={(e) => setValidateInput(e.target.value)}
              placeholder="Paste a UUID (with or without prefix/suffix)"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />

            {/* Validation box */}
            <div className="min-w-[220px] px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">
              {(() => {
                if (!validateInput.trim())
                  return <div className="text-slate-400">Awaiting input…</div>;

                let input = validateInput.trim();

                if (input.startsWith('urn:uuid:')) input = input.replace('urn:uuid:', '');

                const base64Match = input.match(/[A-Za-z0-9+/=]{20,}={0,2}/);
                const hexMatch = input.match(/[0-9a-fA-F]{32,36}/);
                const canonicalMatch = input.match(
                  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
                );

                let inner = canonicalMatch?.[0] || hexMatch?.[0] || base64Match?.[0];
                if (!inner) return <div className="text-red-400">❌ Invalid UUID</div>;

                const likelyBase64 =
                  /^[A-Za-z0-9+/=]+$/.test(inner) && (inner.length === 22 || inner.length === 24);

                if (likelyBase64) {
                  try {
                    const binary = atob(inner.replace(/-/g, '+').replace(/_/g, '/'));
                    if (binary.length === 16) {
                      const hex = Array.from(binary)
                        .map((b) => ('0' + b.charCodeAt(0).toString(16)).slice(-2))
                        .join('');
                      const canonical =
                        hex.slice(0, 8) +
                        '-' +
                        hex.slice(8, 12) +
                        '-' +
                        hex.slice(12, 16) +
                        '-' +
                        hex.slice(16, 20) +
                        '-' +
                        hex.slice(20);
                      if (uuidValidate(canonical)) {
                        const ver = uuidVersion(canonical);
                        return (
                          <div className="text-green-400 text-sm leading-snug">
                            ✅ Valid ({`v${ver}`}) – Base64 format
                            {input !== inner && (
                              <p className="text-yellow-300 text-xs mt-1">⚠️ Prefix/suffix detected</p>
                            )}
                            <p className="text-slate-400 text-xs mt-1">
                              🧩 Canonical UUID: <code>{canonical}</code>
                            </p>
                          </div>
                        );
                      }
                    }
                  } catch {
                    return <div className="text-red-400">❌ Invalid Base64 UUID</div>;
                  }
                }

                if (/^[0-9a-fA-F]{32}$/.test(inner)) {
                  const canonical =
                    inner.slice(0, 8) +
                    '-' +
                    inner.slice(8, 12) +
                    '-' +
                    inner.slice(12, 16) +
                    '-' +
                    inner.slice(16, 20) +
                    '-' +
                    inner.slice(20);
                  if (uuidValidate(canonical)) {
                    const ver = uuidVersion(canonical);
                    return (
                      <div className="text-green-400 text-sm leading-snug">
                        ✅ Valid ({`v${ver}`}) – Compact format
                        {input !== inner && (
                          <p className="text-yellow-300 text-xs mt-1">⚠️ Prefix/suffix detected</p>
                        )}
                        <p className="text-slate-400 text-xs mt-1">
                          🧩 Canonical UUID: <code>{canonical}</code>
                        </p>
                      </div>
                    );
                  }
                }

                if (uuidValidate(inner)) {
                  const ver = uuidVersion(inner);
                  return (
                    <div className="text-green-400 text-sm leading-snug">
                      ✅ Valid ({`v${ver}`})
                      {input !== inner && (
                        <p className="text-yellow-300 text-xs mt-1">⚠️ Prefix/suffix detected</p>
                      )}
                    </div>
                  );
                }

                return <div className="text-red-400">❌ Invalid UUID</div>;
              })()}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-2">
            Smart validation: detects valid UUIDs even if wrapped with extra text.
          </p>
        </div>

        {/* ---------- SEO CONTENT (kept, light spacing polish) ---------- */}
        
        <div className="">
          <h2 className="text-3xl font-bold text-white mb-4">About UUID Generator</h2>
          <h3 className="text-xl text-slate-300 mb-4">
            What is a UUID and Why Do You Need a UUID Generator?
          </h3>

          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              A <strong>UUID (Universally Unique Identifier)</strong> is a 128-bit value used to uniquely
              identify information across systems and applications. It ensures that every generated ID is unique —
              even when created on different machines at the same time. UUIDs are widely used in databases, APIs,
              authentication systems, and distributed applications.
            </p>

            <p>
              The <strong>UUID Generator by CalculatorHub</strong> helps you quickly create unique IDs based on the
              <strong> UUID Version 1, 4, and 5 </strong> standards. It also allows you to generate multiple UUIDs at once,
              copy them instantly, download as a file, and even view timestamps (for v1 UUIDs).
            </p>

            <p>
              UUIDs are globally unique, collision-resistant, and don’t require a central authority.
              This makes them ideal for identifying users, transactions, files, or sessions where duplication is unacceptable.
            </p>

            <h2 className="text-yellow-500 mt-6"><strong>How Does a UUID Work?</strong></h2>
            <p>
              A <strong>UUID</strong> (Universally Unique Identifier) is a 128-bit value represented as hexadecimal characters.
              It is divided into <strong>five groups</strong> separated by hyphens and typically looks like this:
            </p>
            
            <p className="bg-slate-800 p-3 rounded-lg font-mono text-yellow-300 text-center overflow-x-auto">
              xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
            </p>
            
            <p>
              Each section in the UUID has a specific meaning:
            </p>
            
            <ul className="list-disc list-inside space-y-1 ml-4 text-slate-300">
              <li><strong>xxxxxxxx</strong> – time_low (or random bits)</li>
              <li><strong>xxxx</strong> – time_mid (or random bits)</li>
              <li><strong>Mxxx</strong> – the “version” field (defines how the UUID is generated)</li>
              <li><strong>Nxxx</strong> – the “variant” field (defines the UUID layout type)</li>
              <li><strong>xxxxxxxxxxxx</strong> – node or random component</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4">🔹 Version 1 – Time-Based Logic</h3>
            <p>
              Version 1 UUIDs are created using the current timestamp (in 100-nanosecond precision)
              combined with the device’s <strong>MAC address</strong> and a random clock sequence.
              This means two UUIDv1 values generated on the same machine at the same time are still unique.
            </p>
            
            <p className="font-mono bg-slate-800 text-yellow-300 p-3 rounded-lg text-sm overflow-x-auto">
              Example (Hyphenated): 550e8400-e29b-11d4-a716-446655440000<br />
              Example (Compact): 550e8400e29b11d4a716446655440000<br />
              Example (URN): urn:uuid:550e8400-e29b-11d4-a716-446655440000<br />
              Example (Base64): VQ6EAOKbEdSnFkRmVUQAAA==
            </p>
            
            <p>
              You can even decode its embedded timestamp to find <strong>when it was generated</strong>.
              That’s why this generator shows “Timestamp (from V1)” next to v1 results.
            </p>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4">🔹 Version 4 – Random Logic</h3>
            <p>
              Version 4 UUIDs are purely random. All 122 bits (except version and variant bits) are filled with random data.
              This provides around <strong>5.3 × 10³⁶</strong> possible unique combinations — making collisions practically impossible.
            </p>
            
            <p className="font-mono bg-slate-800 text-yellow-300 p-3 rounded-lg text-sm overflow-x-auto">
              Example (Hyphenated): 3f50b7b2-9c82-4b2f-a6f3-0dcd1b2a6c09<br />
              Example (Compact): 3f50b7b29c824b2fa6f30dcd1b2a6c09<br />
              Example (URN): urn:uuid:3f50b7b2-9c82-4b2f-a6f3-0dcd1b2a6c09<br />
              Example (Base64): P1C3spyCSy+m8w3NGypsCQ==
            </p>
            
            <p>
              UUIDv4 is the most common and preferred version for general use — it’s fast, simple, and completely independent of hardware or network data.
            </p>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4">🔹 Version 5 – Name-Based Logic (SHA-1)</h3>
            <p>
              Version 5 UUIDs are generated using a <strong>namespace UUID</strong> and a <strong>name string</strong>.
              The two are hashed together using the <strong>SHA-1 algorithm</strong> to create a deterministic UUID.
              That means if you use the same namespace and name again, you’ll always get the same UUID.
            </p>
            
            <p className="font-mono bg-slate-800 text-yellow-300 p-3 rounded-lg text-sm overflow-x-auto">
              Namespace: 6ba7b811-9dad-11d1-80b4-00c04fd430c8<br />
              Name: calculatorhub.site<br /><br />
              Example (Hyphenated): 4f4d49f1-c1e7-5a84-885b-7a6a81602d52<br />
              Example (Compact): 4f4d49f1c1e75a84885b7a6a81602d52<br />
              Example (URN): urn:uuid:4f4d49f1-c1e7-5a84-885b-7a6a81602d52<br />
              Example (Base64): T01J8cHnWoSIS3pqgWAtUg==
            </p>
            
            <p>
              UUIDv5 is ideal for generating consistent identifiers for URLs, usernames, or domain names — anywhere you need a reproducible yet globally unique value.
            </p>
            
            <h3 className="text-lg font-semibold text-yellow-400 mt-4">🔹 Different Output Formats Explained</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-300">
              <li><strong>Hyphenated:</strong> The standard format used by most systems (<code>550e8400-e29b-41d4-a716-446655440000</code>).</li>
              <li><strong>Compact:</strong> Same UUID but without hyphens, ideal for databases or filenames (<code>550e8400e29b41d4a716446655440000</code>).</li>
              <li><strong>Base64:</strong> Encoded binary version that’s shorter and URL-safe (<code>VQ6EAOKbEdSnFkRmVUQAAA==</code>).</li>
              <li><strong>URN:</strong> URI-style format that starts with <code>urn:uuid:</code>, often used in XML or RDF data (<code>urn:uuid:550e8400-e29b-41d4-a716-446655440000</code>).</li>
            </ul>
            
            <p className="mt-3">
              Each format represents the same 128-bit data — just encoded differently for various use cases like networking, storage, or compact transmission.
            </p>


            <h2 className="text-yellow-500 mt-6"><strong>Why Use UUIDs?</strong></h2>
            <p>
              UUIDs are essential in software development for creating globally unique references that never clash.
              Unlike auto-incrementing IDs, UUIDs prevent duplication even across servers and databases. They’re widely
              used in APIs, distributed systems, and cloud applications.
            </p>

            <h2 className="text-yellow-500 mt-6"><strong>Benefits of Using UUID Generator</strong></h2>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>⚙️ Generate multiple UUIDs at once (bulk mode supported)</li>
              <li>🔢 Choose between versions: V1, V4, or V5</li>
              <li>📂 Export your UUIDs as <strong>.txt</strong>, <strong>.json</strong>, or <strong>.csv</strong></li>
              <li>🧩 Supports different formats – hyphenated, compact, Base64, or URN</li>
              <li>🕒 View timestamps for Version 1 UUIDs</li>
              <li>✍️ Add prefixes or suffixes to your UUIDs for organization</li>
              <li>📱 Fully responsive, mobile-friendly design</li>
            </ul>

            <h2 className="text-yellow-500 mt-6"><strong>When Should You Use UUIDs?</strong></h2>
            <p>Use UUIDs whenever you need unique identifiers without collisions or central coordination. Common use cases include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Database primary keys and distributed record IDs</li>
              <li>Session and authentication tokens</li>
              <li>File and document identifiers</li>
              <li>API keys and transaction IDs</li>
              <li>Device identifiers and IoT tracking</li>
            </ul>

            <p>
              In short, UUIDs ensure <strong>global uniqueness, scalability, and reliability</strong> — essential for any modern software system.
            </p>

            <AdBanner type="bottom" />

            {/* ======== FAQ SECTION ======== */}
            <section className="space-y-4 mt-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                ❓ Frequently Asked Questions (<span className="text-yellow-300">FAQ</span>)
              </h2>

              <div className="space-y-4 text-slate-100 leading-relaxed">
                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q1:</span> What is a UUID?
                  </h3>
                  <p>
                    A UUID (Universally Unique Identifier) is a 128-bit value that uniquely identifies resources such as users,
                    transactions, or files without requiring a central authority.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q2:</span> How does the UUID Generator work?
                  </h3>
                  <p>
                    The generator creates UUIDs based on your selected version (v1, v4, or v5).
                    Version 1 uses timestamps, version 4 uses random numbers, and version 5 uses name-based hashing.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q3:</span> What is the difference between UUID v1, v4, and v5?
                  </h3>
                  <p>
                    UUID v1 includes timestamp &amp; hardware info, v4 is random-based, and v5 is generated from a name and namespace.
                    Version 4 is the most common for general use.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q4:</span> Can UUIDs ever repeat?
                  </h3>
                  <p>
                    The probability of two UUIDs colliding is extremely small — practically impossible for most use cases.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q5:</span> What is the length of a UUID?
                  </h3>
                  <p>
                    A UUID consists of 36 characters (32 hexadecimal + 4 hyphens) or 128 bits when stored in binary form.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q6:</span> Can I convert UUIDs to different formats?
                  </h3>
                  <p>
                    Yes! This tool supports converting between hyphenated, compact, Base64, and URN formats instantly.
                  </p>
                </div>

                <div className="bg-slate-800/60 p-4 rounded-lg">
                  <h3 className="font-semibold text-xl">
                    <span className="text-yellow-300">Q7:</span> Is this UUID Generator free to use?
                  </h3>
                  <p>
                    Absolutely! The CalculatorHub UUID Generator is 100% free, with no registration required.
                    You can generate unlimited unique IDs anytime.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <RelatedCalculators currentPath="/uuid-generator" />

        {/* ===================== UUID GENERATOR ENHANCED SEO SCHEMAS ===================== */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "UUID Generator - Create Unique Identifiers Online",
              "url": "https://calculatorhub.site/uuid-generator",
              "description":
                "Generate UUIDs (Universally Unique Identifiers) instantly. Supports versions 1, 4, and 5 with options for Base64, Compact, and Hyphenated formats. Copy, export, and validate unique IDs easily.",
              "breadcrumb": {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Misc Tools", "item": "https://calculatorhub.site/category/misc-tools" },
                  { "@type": "ListItem", "position": 2, "name": "UUID Generator", "item": "https://calculatorhub.site/uuid-generator" }
                ]
              },
              "about": [
                "UUID generator online",
                "UUID v1 v4 v5 generator",
                "UUID converter tool",
                "Base64 and Compact UUID formats",
                "UUID validator"
              ],
              "publisher": {
                "@type": "Organization",
                "name": "CalculatorHub",
                "url": "https://calculatorhub.site",
                "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/assets/logo.png" }
              }
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "What is a UUID?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "A UUID (Universally Unique Identifier) is a 128-bit value used to uniquely identify data, users, or objects in systems and applications. It ensures global uniqueness without central coordination."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How does the UUID Generator work?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The UUID Generator creates identifiers based on version 1, 4, or 5 standards. Version 1 uses timestamps, version 4 uses random numbers, and version 5 uses namespace and name-based hashing."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Why use UUIDs?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "UUIDs ensure unique identification for records, files, sessions, and transactions across distributed systems, making them ideal for modern applications and databases."
                  }
                },
                {
                  "@type": "Question",
                  "name": "What are UUID versions 1, 4, and 5?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Version 1 UUIDs use timestamps and MAC addresses, Version 4 uses random numbers, and Version 5 uses cryptographic hashing (SHA-1) with namespace and name inputs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can UUIDs repeat?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "The probability of two UUIDs repeating is practically zero. They are statistically guaranteed to be unique across devices and systems."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Can I convert UUIDs between different formats?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! The tool allows conversion between Hyphenated, Compact, Base64, and URN formats easily. You can also add prefixes and suffixes to your UUIDs."
                  }
                },
                {
                  "@type": "Question",
                  "name": "Is this UUID Generator free to use?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, CalculatorHub’s UUID Generator is completely free to use. No login or signup required — generate unlimited UUIDs instantly."
                  }
                }
              ]
            })
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "UUID Generator",
              "operatingSystem": "All",
              "applicationCategory": "DeveloperApplication",
              "url": "https://calculatorhub.site/uuid-generator",
              "description":
                "Generate and validate UUIDs (v1, v4, v5) instantly. Supports Base64, Compact, and Hyphenated formats, prefix/suffix customization, timestamp viewing, and bulk generation.",
              "featureList": [
                "Supports UUID versions 1, 4, and 5",
                "Generate multiple UUIDs at once",
                "Copy, validate, and export UUIDs",
                "Format support: Hyphenated, Compact, Base64, URN",
                "Add custom prefixes or suffixes",
                "Timestamp display for version 1 UUIDs",
                "Responsive, mobile-friendly interface"
              ],
              "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "1750" },
              "publisher": {
                "@type": "Organization",
                "name": "CalculatorHub",
                "url": "https://calculatorhub.site",
                "logo": { "@type": "ImageObject", "url": "https://calculatorhub.site/assets/logo.png" }
              }
            })
          }}
        />
      </div>
    </>
  );
};

export default UUIDGenerator;
