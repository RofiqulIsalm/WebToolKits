import React, { useEffect, useMemo, useState } from 'react';
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
  const [count, setCount] = useState<number>(5);
  const [version, setVersion] = useState<UuidVersion>('v4');

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
  const [v5Name, setV5Name] = useState<string>('calculatorhub.com');

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

  const applyCasing = (s: string) => (isUppercase ? s.toUpperCase() : s.toLowerCase());

  const formatForDisplay = (entry: RawEntry): string => {
    let out = applyFormat(entry.uuid, format);
    // Only apply casing to text uuid forms (not base64)
    if (format !== 'base64') out = applyCasing(out);
    // Prefix/suffix: allow for all formats (even base64) but keep as plain concatenation
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
    // When enabling: show a loading animation before revealing panel
    if (!advancedEnabled) {
      setAdvLoading(true);
      setTimeout(() => {
        setAdvancedEnabled(true);
        setAdvLoading(false);
      }, 1200);
    } else {
      // Turning off: hide immediately
      setAdvancedEnabled(false);
      setAdvLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="UUID Generator – V1, V4, V5 | Bulk Generate, Copy, Download"
        description="Generate UUIDs (V1, V4, V5). Copy single/all, uppercase/lowercase, hyphenated/compact/Base64/URN. Decode timestamps for V1 and export as TXT/JSON/CSV."
        canonical="https://calculatorhub.com/uuid-generator"
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Misc Tools', url: '/category/misc-tools' },
            { name: 'UUID Generator', url: '/uuid-generator' },
          ]}
        />

        {/* Card */}
        <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-gradient-to-b from-slate-800/70 to-slate-900 border border-slate-700 shadow-lg backdrop-blur">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 border border-blue-500/40 rounded-xl">
                <Key className="text-blue-400 h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">UUID Generator</h1>
            </div>

            {/* Advanced Mode button */}
            <button
              onClick={toggleAdvanced}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition
                ${advancedEnabled ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600' : 'bg-blue-600/20 border-blue-500/40 text-blue-100 hover:bg-blue-600/30'}`}
              title="Toggle Advanced Mode"
            >
              <Settings2 className="w-5 h-5" />
              {advancedEnabled ? 'Advanced: ON' : 'Advanced Mode'}
            </button>
          </div>

          {/* Basic controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">UUID Version</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value as UuidVersion)}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Copy-all separator */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Copy All separator</label>
                <select
                  value={separator}
                  onChange={(e) => setSeparator(e.target.value as Separator)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
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
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                    <p className="text-xs text-slate-400 mt-1">Use a valid namespace UUID (DNS/URL/OID/X500 or custom)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">V5 Name</label>
                    <input
                      type="text"
                      placeholder="e.g. calculatorhub.com"
                      value={v5Name}
                      onChange={(e) => setV5Name(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Export buttons */}
              <div className="flex items-end gap-2">
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
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {rawList.map((r, i) => {
                  const out = formatForDisplay(r);
                  const showTimestamp = r.decodedAt && version === 'v1';
                  return (
                    <div
                      key={`${r.uuid}-${i}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors group"
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
                        className="mt-2 sm:mt-0 sm:ml-4 p-2 rounded-lg hover:bg-slate-600 transition"
                        title="Copy to clipboard"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-5 w-5 text-green-400" />
                        ) : (
                          <Copy className="h-5 w-5 text-slate-400 group-hover:text-white" />
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

        {/* Validator Panel (always visible, or you can move inside advanced) */}
       <div className="rounded-2xl p-6 sm:p-8 mb-8 bg-slate-900/70 border border-slate-700">
  <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
    <ShieldCheck className="w-5 h-5 text-green-400" />
    UUID Validator
  </h2>

  <div className="flex flex-col sm:flex-row gap-3">
    <input
      type="text"
      value={validateInput}
      onChange={(e) => setValidateInput(e.target.value)}
      placeholder="Paste a UUID (with or without prefix/suffix)"
      className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 font-mono"
    />

    {/* Validation box */}
      <div className="min-w-[200px] px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200">
        {(() => {
              if (!validateInput.trim())
                return <div className="text-slate-400">Awaiting input…</div>;
            
              let input = validateInput.trim();
            
              // Handle URN prefix
              if (input.startsWith("urn:uuid:")) input = input.replace("urn:uuid:", "");
            
              // Handle Base64: quick detection
              const base64Pattern = /^[A-Za-z0-9+/=]+$/;
              if (input.length < 40 && base64Pattern.test(input)) {
                return (
                  <div className="text-yellow-300 text-sm leading-snug">
                    ⚠️ Looks like Base64 — visually valid, but not RFC UUID.
                  </div>
                );
              }
            
              // Handle Compact UUID (32 hex)
              if (/^[0-9a-fA-F]{32}$/.test(input)) {
                const canonical =
                  input.slice(0, 8) +
                  "-" +
                  input.slice(8, 12) +
                  "-" +
                  input.slice(12, 16) +
                  "-" +
                  input.slice(16, 20) +
                  "-" +
                  input.slice(20);
                if (uuidValidate(canonical)) {
                  return (
                    <div className="text-green-400 text-sm">
                      ✅ Valid ({`v${uuidVersion(canonical)}`}) – Compact format
                    </div>
                  );
                }
              }
            
              // Handle standard or prefix/suffix formats
              const regex =
                /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
              const match = input.match(regex);
            
              if (!match) return <div className="text-red-400">Invalid UUID</div>;
            
              const core = match[0];
              const ok = uuidValidate(core);
              const ver = ok ? `v${uuidVersion(core)}` : "invalid";
            
              if (ok && input !== core) {
                return (
                  <div className="text-yellow-300 text-sm leading-snug">
                    ⚠️ Prefix/suffix detected
                    <br />
                    Core is <span className="text-green-400 font-semibold">valid ({ver})</span>
                  </div>
                );
              }
            
              return ok ? (
                <div className="text-green-400">✅ Valid ({ver})</div>
              ) : (
                <div className="text-red-400">❌ Invalid UUID</div>
              );
            })()}

      </div>
    </div>
  
    <p className="text-xs text-slate-500 mt-2">
      Smart validation: detects valid UUIDs even if wrapped with extra text.
    </p>
  </div>


        <RelatedCalculators currentPath="/uuid-generator" />
      </div>
    </>
  );
};

export default UUIDGenerator;
