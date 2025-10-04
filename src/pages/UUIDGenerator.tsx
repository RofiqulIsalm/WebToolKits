import React, { useState } from 'react';
import { Key, Copy, Check, RefreshCw } from 'lucide-react';
import AdBanner from '../components/AdBanner';
import SEOHead from '../components/SEOHead';
import Breadcrumbs from '../components/Breadcrumbs';
import { seoData, generateCalculatorSchema } from '../utils/seoData';
import RelatedCalculators from '../components/RelatedCalculators';

const UUIDGenerator: React.FC = () => {
  const [uuids, setUuids] = useState<string[]>([]);
  const [count, setCount] = useState<number>(1);
  const [version, setVersion] = useState<4>(4);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const generateUUIDv4 = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const generateUUIDs = () => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      newUuids.push(generateUUIDv4());
    }
    setUuids(newUuids);
    setCopiedIndex(null);
  };

  const copyToClipboard = async (uuid: string, index: number) => {
    try {
      await navigator.clipboard.writeText(uuid);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.uuidGenerator?.title || 'UUID Generator - Generate Unique Identifiers'}
        description={seoData.uuidGenerator?.description || 'Generate UUID v4 (Universally Unique Identifiers) instantly. Perfect for database keys, session IDs, and unique identifiers.'}
        canonical="https://calculatorhub.com/uuid-generator"
        schemaData={generateCalculatorSchema(
          'UUID Generator',
          'Generate unique identifiers (UUIDs)',
          '/uuid-generator',
          ['uuid generator', 'guid generator', 'unique id', 'uuid v4', 'random uuid']
        )}
        breadcrumbs={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'UUID Generator', url: '/uuid-generator' }
        ]}
      />
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={[
          { name: 'Misc Tools', url: '/category/misc-tools' },
          { name: 'UUID Generator', url: '/uuid-generator' }
        ]} />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <Key className="h-8 w-8 text-blue-400" />
            <h1 className="text-3xl font-bold text-white">UUID Generator</h1>
          </div>

          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  UUID Version
                </label>
                <select
                  value={version}
                  onChange={(e) => setVersion(Number(e.target.value) as 4)}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={4}>Version 4 (Random)</option>
                </select>
                <p className="text-xs text-slate-400 mt-1">Most commonly used UUID version</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Number of UUIDs
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value))))}
                  min={1}
                  max={100}
                  className="w-full px-4 py-3 bg-slate-700 text-white rounded-lg border border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How many UUIDs?"
                />
                <p className="text-xs text-slate-400 mt-1">Maximum: 100 UUIDs at once</p>
              </div>
            </div>

            <button
              onClick={generateUUIDs}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Generate UUID{count > 1 ? 's' : ''}</span>
            </button>
          </div>

          {uuids.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">
                  Generated UUIDs ({uuids.length})
                </h3>
                <button
                  onClick={copyAllToClipboard}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {copiedIndex === -1 ? (
                    <>
                      <Check className="h-4 w-4 text-green-400" />
                      <span className="text-sm">Copied All!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy All</span>
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {uuids.map((uuid, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors group"
                  >
                    <code className="text-slate-200 font-mono text-sm flex-1">{uuid}</code>
                    <button
                      onClick={() => copyToClipboard(uuid, index)}
                      className="ml-4 p-2 rounded-lg hover:bg-slate-500 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5 text-slate-400 group-hover:text-white" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <AdBanner />

        <div className="glow-card rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About UUID Generator</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              A UUID (Universally Unique Identifier) is a 128-bit number used to identify information
              in computer systems. UUIDs are designed to be unique across space and time, making them
              ideal for distributed systems.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">UUID Format:</h3>
            <p className="font-mono bg-slate-700 p-3 rounded">
              xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
            </p>
            <p>
              Where x is any hexadecimal digit (0-9, a-f) and y is one of 8, 9, a, or b.
              The "4" indicates this is a version 4 (random) UUID.
            </p>
            <h3 className="text-xl font-semibold text-white mt-6">Common Uses:</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Database primary keys and foreign keys</li>
              <li>Session identifiers for web applications</li>
              <li>Transaction IDs in distributed systems</li>
              <li>File and document identifiers</li>
              <li>API request tracking</li>
              <li>Unique reference numbers</li>
            </ul>
            <h3 className="text-xl font-semibold text-white mt-6">Why Use UUIDs?</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Globally unique without coordination</li>
              <li>Can be generated offline</li>
              <li>No central authority needed</li>
              <li>Collision probability is negligible</li>
              <li>Standardized format (RFC 4122)</li>
            </ul>
          </div>
        </div>

        <RelatedCalculators currentPath="/uuid-generator" />
      </div>
    </>
  );
};

export default UUIDGenerator;
